// src/app/api/ai-suggestions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleAPIError, validateRequiredFields, APIError } from '../../utils/errorHandler';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const responseSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedCost: { type: "string" },
          duration: { type: "string" },
          location: { type: "string" },
          category: { type: "string" }
        },
        required: ["title", "description"]
      }
    }
  },
  required: ["suggestions"]
};

export async function POST(request) {
  try {
    const { parameters, groupId, votingContext } = await request.json();
    
    // Validate required fields
    validateRequiredFields({ parameters }, ['parameters']);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new APIError('AI service not configured', 503, 'SERVICE_UNAVAILABLE');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    // Build the prompt with voting context
    let prompt = `You are an AI activity planner helping a group plan their next activity. 

Group Parameters:
- Activity Description: ${parameters.prompt || 'Any type of activity'}
- Budget: ${parameters.budget === 'Any' ? 'No budget limit - show all options' : (parameters.budget || 'Flexible')}
- Radius: ${parameters.radius || 'Any distance'}
- Number of suggestions: ${parameters.count || 3}

${votingContext ? `Voting History Context: ${votingContext}` : ''}

Please suggest ${parameters.count || 3} engaging activities that match these parameters. ${votingContext ? 'Consider the group\'s voting history when making suggestions.' : ''}

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "suggestions": [
    {
      "title": "Activity Title",
      "description": "Brief description of the activity",
      "estimatedCost": "Cost range",
      "duration": "Time duration",
      "location": "Location type",
      "category": "Activity category"
    }
  ]
}

Do NOT include any markdown formatting, asterisks, or extra text. Just the JSON object.`;

    console.log('📝 Generated prompt:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('🤖 Raw AI response:', text);

    // Try to parse the response as JSON
    let suggestions;
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured suggestions from the text
        const lines = text.split('\n').filter(line => line.trim());
        const activityBlocks = [];
        let currentActivity = {};
        
        for (const line of lines) {
          if (line.includes('**Catchy Title:**') || line.includes('**Title:**')) {
            if (Object.keys(currentActivity).length > 0) {
              activityBlocks.push(currentActivity);
            }
            currentActivity = { title: line.split('**Catchy Title:**')[1]?.trim() || line.split('**Title:**')[1]?.trim() || 'Activity' };
          } else if (line.includes('**Brief Description:**') || line.includes('**Description:**')) {
            currentActivity.description = line.split('**Brief Description:**')[1]?.trim() || line.split('**Description:**')[1]?.trim() || 'Fun activity';
          } else if (line.includes('**Estimated Cost Range:**')) {
            currentActivity.estimatedCost = line.split('**Estimated Cost Range:**')[1]?.trim() || 'Varies';
          } else if (line.includes('**Typical Duration:**')) {
            currentActivity.duration = line.split('**Typical Duration:**')[1]?.trim() || '2-4 hours';
          } else if (line.includes('**General Location Type:**')) {
            currentActivity.location = line.split('**General Location Type:**')[1]?.trim() || 'Local area';
          } else if (line.includes('**Activity Category:**')) {
            currentActivity.category = line.split('**Activity Category:**')[1]?.trim() || 'General';
          }
        }
        
        if (Object.keys(currentActivity).length > 0) {
          activityBlocks.push(currentActivity);
        }
        
        suggestions = {
          suggestions: activityBlocks.length > 0 ? activityBlocks : [
            {
              title: "Hike Lands End Trail",
              description: "Beautiful coastal trail with stunning ocean views and moderate difficulty",
              estimatedCost: "Free",
              duration: "2-3 hours",
              location: "Lands End, San Francisco",
              category: "Outdoor"
            },
            {
              title: "Board game cafe in the Inner Richmond",
              description: "Cozy cafe with great board game selection and food",
              estimatedCost: "$15-25 per person",
              duration: "2-4 hours",
              location: "Inner Richmond, San Francisco",
              category: "Indoor"
            },
            {
              title: "Explore new restaurants in the Mission District",
              description: "Food tour of the latest culinary hotspots and hidden gems",
              estimatedCost: "$30-50 per person",
              duration: "3-4 hours",
              location: "Mission District, San Francisco",
              category: "Food"
            }
          ]
        };
      }
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      // Fallback to structured suggestions
      suggestions = {
        suggestions: [
          {
            title: "Hike Lands End Trail",
            description: "Beautiful coastal trail with stunning ocean views and moderate difficulty",
            estimatedCost: "Free",
            duration: "2-3 hours",
            location: "Lands End, San Francisco",
            category: "Outdoor"
          },
          {
            title: "Board game cafe in the Inner Richmond",
            description: "Cozy cafe with great board game selection and food",
            estimatedCost: "$15-25 per person",
            duration: "2-4 hours",
            location: "Inner Richmond, San Francisco",
            category: "Indoor"
          },
          {
            title: "Explore new restaurants in the Mission District",
            description: "Food tour of the latest culinary hotspots and hidden gems",
            estimatedCost: "$30-50 per person",
            duration: "3-4 hours",
            location: "Mission District, San Francisco",
            category: "Food"
          }
        ]
      };
    }

    // Ensure we have the correct structure
    if (!suggestions.suggestions) {
      suggestions = { suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] };
    }

    // Limit to requested number of suggestions
    suggestions.suggestions = suggestions.suggestions.slice(0, parameters.count || 3);

    console.log('✅ Final suggestions:', suggestions);

    return Response.json(suggestions);
  } catch (error) {
    return handleAPIError(error, 'AI Suggestions');
  }
}