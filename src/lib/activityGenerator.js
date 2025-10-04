// Sophisticated Activity Generation System
// Creates realistic, engaging activity names based on group types and preferences

export const ACTIVITY_CATEGORIES = {
  OUTDOOR: {
    name: 'Outdoor Adventures',
    emoji: '🏔️',
    activities: [
      { name: 'Sunrise Hiking at Mount Tamalpais', duration: '4 hours', difficulty: 'Moderate', season: 'all' },
      { name: 'Golden Gate Park Photography Walk', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Kayaking in Richardson Bay', duration: '3 hours', difficulty: 'Beginner', season: 'spring,summer,fall' },
      { name: 'Rock Climbing at Castle Rock', duration: '6 hours', difficulty: 'Advanced', season: 'all' },
      { name: 'Coastal Trail Running', duration: '1.5 hours', difficulty: 'Moderate', season: 'all' },
      { name: 'Beach Volleyball Tournament', duration: '3 hours', difficulty: 'Easy', season: 'summer' },
      { name: 'Redwood Forest Meditation Walk', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Cycling the Bay Trail', duration: '4 hours', difficulty: 'Moderate', season: 'all' },
      { name: 'Outdoor Yoga at Crissy Field', duration: '1 hour', difficulty: 'Easy', season: 'spring,summer,fall' },
      { name: 'Stargazing at Half Moon Bay', duration: '3 hours', difficulty: 'Easy', season: 'all' }
    ]
  },
  FOOD: {
    name: 'Culinary Experiences',
    emoji: '🍽️',
    activities: [
      { name: 'Michelin Star Restaurant Tour', duration: '4 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Ferry Building Food Market Crawl', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Dim Sum Brunch in Chinatown', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Wine Tasting in Napa Valley', duration: '6 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Cooking Class: Italian Pasta Making', duration: '3 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Food Truck Festival Adventure', duration: '2 hours', difficulty: 'Easy', season: 'spring,summer,fall' },
      { name: 'Artisan Coffee Roastery Tour', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Japanese Tea Ceremony Experience', duration: '1.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Farm-to-Table Dinner Experience', duration: '4 hours', difficulty: 'Easy', season: 'spring,summer,fall' },
      { name: 'Chocolate Making Workshop', duration: '2.5 hours', difficulty: 'Beginner', season: 'all' }
    ]
  },
  CULTURE: {
    name: 'Cultural Immersion',
    emoji: '🎭',
    activities: [
      { name: 'SFMOMA Contemporary Art Exhibition', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Mission District Mural Walking Tour', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Symphony at Davies Hall', duration: '2.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Live Jazz at The Fillmore', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Poetry Reading in North Beach', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Chinatown Cultural Heritage Walk', duration: '2.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Independent Film Screening', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Local Artist Studio Tour', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Historical Architecture Tour', duration: '2.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Underground Comedy Show', duration: '2 hours', difficulty: 'Easy', season: 'all' }
    ]
  },
  SOCIAL: {
    name: 'Social Gatherings',
    emoji: '🎉',
    activities: [
      { name: 'Rooftop Happy Hour Meetup', duration: '3 hours', difficulty: 'Easy', season: 'spring,summer,fall' },
      { name: 'Game Night at Local Café', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Karaoke Night in Japantown', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Book Club Discussion Brunch', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Trivia Night Championship', duration: '2.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Speed Networking Event', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Dance Class: Salsa Fundamentals', duration: '1.5 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Community Volunteer Day', duration: '4 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Sunset Picnic at Dolores Park', duration: '3 hours', difficulty: 'Easy', season: 'spring,summer,fall' },
      { name: 'Escape Room Challenge', duration: '1.5 hours', difficulty: 'Moderate', season: 'all' }
    ]
  },
  WELLNESS: {
    name: 'Wellness & Mindfulness',
    emoji: '🧘',
    activities: [
      { name: 'Sunrise Meditation at Ocean Beach', duration: '1 hour', difficulty: 'Easy', season: 'all' },
      { name: 'Sound Bath Healing Session', duration: '1.5 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Hot Springs Day Trip to Calistoga', duration: '6 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Breathwork Workshop', duration: '2 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Forest Bathing in Muir Woods', duration: '3 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Acupuncture & Wellness Consultation', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Therapeutic Massage Workshop', duration: '2 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Mindful Walking Labyrinth', duration: '1 hour', difficulty: 'Easy', season: 'all' },
      { name: 'Aromatherapy Candle Making', duration: '2 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Digital Detox Nature Retreat', duration: '4 hours', difficulty: 'Easy', season: 'all' }
    ]
  },
  TECH: {
    name: 'Innovation & Learning',
    emoji: '💡',
    activities: [
      { name: 'AI/ML Workshop at Startup Campus', duration: '3 hours', difficulty: 'Intermediate', season: 'all' },
      { name: 'Tech Talk: Future of Web3', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Hackathon: Social Good Projects', duration: '8 hours', difficulty: 'Advanced', season: 'all' },
      { name: 'VR Experience at Immersive Lab', duration: '2 hours', difficulty: 'Easy', season: 'all' },
      { name: 'Cryptocurrency Trading Seminar', duration: '3 hours', difficulty: 'Intermediate', season: 'all' },
      { name: 'Robotics Demo & Hands-on', duration: '2.5 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Startup Pitch Competition', duration: '4 hours', difficulty: 'Intermediate', season: 'all' },
      { name: '3D Printing Workshop', duration: '3 hours', difficulty: 'Beginner', season: 'all' },
      { name: 'Drone Photography Masterclass', duration: '4 hours', difficulty: 'Intermediate', season: 'spring,summer,fall' },
      { name: 'Cybersecurity Awareness Training', duration: '2 hours', difficulty: 'Beginner', season: 'all' }
    ]
  }
};

export const GROUP_TYPE_MAPPING = {
  'Mountain Adventurers': 'OUTDOOR',
  'Food Enthusiasts': 'FOOD',
  'Tech Innovators': 'TECH',
  'Creative Minds': 'CULTURE',
  'City Explorers': 'CULTURE',
  'Wellness Warriors': 'WELLNESS',
  'Social Butterflies': 'SOCIAL',
  'Art Lovers': 'CULTURE',
  'Fitness Friends': 'OUTDOOR',
  'Book Club': 'CULTURE'
};

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export function generateRealisticActivity(groupName, groupCategory = null, preferences = {}) {
  const currentSeason = getCurrentSeason();
  
  // Determine category based on group name or explicit category
  let category = groupCategory;
  if (!category) {
    category = GROUP_TYPE_MAPPING[groupName] || 'SOCIAL';
  }
  
  const categoryData = ACTIVITY_CATEGORIES[category];
  if (!categoryData) {
    category = 'SOCIAL';
  }
  
  // Filter activities by season and preferences
  let availableActivities = ACTIVITY_CATEGORIES[category].activities.filter(activity => {
    const seasons = activity.season.split(',');
    return seasons.includes('all') || seasons.includes(currentSeason);
  });
  
  // Filter by difficulty if specified
  if (preferences.difficulty) {
    availableActivities = availableActivities.filter(activity => 
      activity.difficulty.toLowerCase() === preferences.difficulty.toLowerCase()
    );
  }
  
  // Filter by duration if specified
  if (preferences.maxDuration) {
    availableActivities = availableActivities.filter(activity => {
      const hours = parseInt(activity.duration);
      return hours <= preferences.maxDuration;
    });
  }
  
  // Select random activity
  const selectedActivity = availableActivities[Math.floor(Math.random() * availableActivities.length)];
  
  if (!selectedActivity) {
    // Fallback to any activity from the category
    const fallbackActivity = ACTIVITY_CATEGORIES[category].activities[0];
    return generateActivityObject(fallbackActivity, category);
  }
  
  return generateActivityObject(selectedActivity, category);
}

function generateActivityObject(activity, category) {
  const categoryData = ACTIVITY_CATEGORIES[category];
  const activityId = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate realistic future date (1-30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
  
  // Generate realistic time based on activity type
  const timeOptions = getRealisticTimeOptions(activity.name);
  const selectedTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
  futureDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
  
  return {
    id: activityId,
    title: activity.name,
    description: generateActivityDescription(activity, categoryData),
    date: futureDate,
    location: generateRealisticLocation(activity.name, category),
    duration: activity.duration,
    difficulty: activity.difficulty,
    category: categoryData.name,
    emoji: categoryData.emoji,
    type: category.toLowerCase(),
    estimatedCost: generateEstimatedCost(activity.name, category),
    maxParticipants: generateMaxParticipants(activity.name),
    tags: generateActivityTags(activity.name, category)
  };
}

function getRealisticTimeOptions(activityName) {
  if (activityName.includes('Sunrise') || activityName.includes('sunrise')) {
    return [{ hour: 6, minute: 30 }, { hour: 7, minute: 0 }];
  }
  if (activityName.includes('Sunset') || activityName.includes('sunset')) {
    return [{ hour: 18, minute: 0 }, { hour: 18, minute: 30 }, { hour: 19, minute: 0 }];
  }
  if (activityName.includes('Happy Hour') || activityName.includes('Night')) {
    return [{ hour: 17, minute: 0 }, { hour: 18, minute: 0 }, { hour: 19, minute: 0 }];
  }
  if (activityName.includes('Brunch')) {
    return [{ hour: 10, minute: 0 }, { hour: 11, minute: 0 }, { hour: 11, minute: 30 }];
  }
  // Default daytime activities
  return [
    { hour: 10, minute: 0 }, { hour: 11, minute: 0 }, { hour: 14, minute: 0 }, 
    { hour: 15, minute: 0 }, { hour: 16, minute: 0 }
  ];
}

function generateActivityDescription(activity, categoryData) {
  const descriptions = {
    'Sunrise Hiking at Mount Tamalpais': 'Experience breathtaking panoramic views of the Bay Area as we watch the sunrise from the summit. Moderate 4-mile hike with stunning photo opportunities.',
    'Golden Gate Park Photography Walk': 'Capture the beauty of SF\'s urban oasis. Perfect for all skill levels, we\'ll explore hidden gardens, architectural details, and natural landscapes.',
    'Ferry Building Food Market Crawl': 'Taste your way through SF\'s premier food destination. Sample artisanal cheeses, fresh oysters, and local specialties from renowned vendors.',
    'SFMOMA Contemporary Art Exhibition': 'Explore cutting-edge contemporary works and engage in thoughtful discussions about modern artistic expression and cultural impact.',
    'Rooftop Happy Hour Meetup': 'Unwind with panoramic city views, craft cocktails, and great company. Perfect for networking and making new connections in a relaxed atmosphere.'
  };
  
  return descriptions[activity.name] || 
    `Join us for an amazing ${categoryData.name.toLowerCase()} experience! ${activity.name} offers the perfect opportunity to connect with like-minded people while enjoying a ${activity.difficulty.toLowerCase()} ${activity.duration} adventure.`;
}

function generateRealisticLocation(activityName, category) {
  const locationMap = {
    'Mount Tamalpais': 'Mount Tamalpais State Park, Mill Valley, CA',
    'Golden Gate Park': 'Golden Gate Park, San Francisco, CA',
    'Richardson Bay': 'Richardson Bay Marina, Sausalito, CA',
    'Ferry Building': 'Ferry Building Marketplace, San Francisco, CA',
    'Chinatown': 'Chinatown, San Francisco, CA',
    'SFMOMA': 'San Francisco Museum of Modern Art, 151 3rd St, SF',
    'The Fillmore': 'The Fillmore, 1805 Geary Blvd, San Francisco, CA',
    'Ocean Beach': 'Ocean Beach, San Francisco, CA',
    'Dolores Park': 'Mission Dolores Park, San Francisco, CA'
  };
  
  // Find location based on activity name
  for (const [key, value] of Object.entries(locationMap)) {
    if (activityName.includes(key)) {
      return value;
    }
  }
  
  // Default locations by category
  const defaultLocations = {
    'OUTDOOR': 'Golden Gate Park, San Francisco, CA',
    'FOOD': 'Mission District, San Francisco, CA',
    'CULTURE': 'SOMA District, San Francisco, CA',
    'SOCIAL': 'Castro District, San Francisco, CA',
    'WELLNESS': 'Marina District, San Francisco, CA',
    'TECH': 'SOMA District, San Francisco, CA'
  };
  
  return defaultLocations[category] || 'San Francisco, CA';
}

function generateEstimatedCost(activityName, category) {
  if (activityName.includes('Free') || activityName.includes('Park') || activityName.includes('Walking')) {
    return 'Free';
  }
  if (activityName.includes('Michelin') || activityName.includes('Wine Tasting')) {
    return '$80-120';
  }
  if (activityName.includes('Workshop') || activityName.includes('Class')) {
    return '$25-45';
  }
  
  const costRanges = {
    'OUTDOOR': '$10-30',
    'FOOD': '$25-60',
    'CULTURE': '$15-35',
    'SOCIAL': '$20-40',
    'WELLNESS': '$30-70',
    'TECH': '$15-50'
  };
  
  return costRanges[category] || '$20-40';
}

function generateMaxParticipants(activityName) {
  if (activityName.includes('Workshop') || activityName.includes('Class')) {
    return Math.floor(Math.random() * 8) + 8; // 8-15 people
  }
  if (activityName.includes('Tour') || activityName.includes('Walk')) {
    return Math.floor(Math.random() * 12) + 12; // 12-23 people
  }
  if (activityName.includes('Meetup') || activityName.includes('Social')) {
    return Math.floor(Math.random() * 20) + 20; // 20-39 people
  }
  
  return Math.floor(Math.random() * 10) + 10; // 10-19 people
}

function generateActivityTags(activityName, category) {
  const baseTags = [category.toLowerCase()];
  
  if (activityName.includes('Beginner')) baseTags.push('beginner-friendly');
  if (activityName.includes('Advanced')) baseTags.push('experienced');
  if (activityName.includes('Photography')) baseTags.push('photography');
  if (activityName.includes('Food') || activityName.includes('Cooking')) baseTags.push('food');
  if (activityName.includes('Art') || activityName.includes('Museum')) baseTags.push('art');
  if (activityName.includes('Nature') || activityName.includes('Park')) baseTags.push('nature');
  if (activityName.includes('Social') || activityName.includes('Meetup')) baseTags.push('social');
  if (activityName.includes('Workshop') || activityName.includes('Class')) baseTags.push('learning');
  
  return baseTags;
}





