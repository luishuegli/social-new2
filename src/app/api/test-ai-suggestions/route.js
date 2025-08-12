// src/app/api/test-ai-suggestions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET() {
  try {
    console.log('🧪 Testing AI suggestions...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const prompt = `You are an AI activity planner helping a group plan their next activity. 

Group Parameters:
- Activity Type: Food & Drink
- Budget: $
- Radius: 25
- Number of suggestions: 3

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

    console.log('📝 Testing prompt:', prompt);

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
        console.log('✅ Successfully parsed JSON response');
      } else {
        console.log('❌ No JSON found in response, using fallback');
        suggestions = {
          suggestions: [
            {
              title: "Test Activity 1",
              description: "This is a test activity",
              estimatedCost: "$10-20",
              duration: "2-3 hours",
              location: "Local area",
              category: "Food & Drink"
            }
          ]
        };
      }
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      suggestions = {
        suggestions: [
          {
            title: "Fallback Activity",
            description: "This is a fallback activity",
            estimatedCost: "$15-25",
            duration: "2-4 hours",
            location: "Local area",
            category: "Food & Drink"
          }
        ]
      };
    }

    console.log('✅ Final test suggestions:', suggestions);

    return Response.json({ 
      success: true, 
      message: 'AI suggestions test completed',
      rawResponse: text,
      parsedSuggestions: suggestions
    });
    
  } catch (error) {
    console.error('❌ AI suggestions test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 