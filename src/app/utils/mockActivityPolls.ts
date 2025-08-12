import { ActivityPoll } from '../types';

// Deprecated: mock data removed. Keep file to avoid import errors if referenced.
export const mockActivityPolls: (ActivityPoll & { userVoted?: boolean })[] = [];
  {
    id: 'poll-1',
    groupName: 'Mountain Adventurers',
    question: 'What should we do next Saturday?',
    options: [
      { id: 'opt-1', text: 'Hike to Eagle Peak', votes: 8 },
      { id: 'opt-2', text: 'Rock climbing at Sunset Cliffs', votes: 12 },
      { id: 'opt-3', text: 'Mountain biking on Pine Trail', votes: 5 },
      { id: 'opt-4', text: 'Camping at Lake View', votes: 3 }
    ],
    totalVotes: 28,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    isActive: true,
    userVoted: false
  },
  {
    id: 'poll-2',
    groupName: 'Tech Enthusiasts',
    question: 'Which workshop should we organize this month?',
    options: [
      { id: 'opt-5', text: 'React Advanced Patterns', votes: 15 },
      { id: 'opt-6', text: 'Machine Learning Basics', votes: 22 },
      { id: 'opt-7', text: 'Web Security Best Practices', votes: 8 },
      { id: 'opt-8', text: 'Mobile App Development', votes: 11 }
    ],
    totalVotes: 56,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    isActive: true,
    userVoted: false
  },
  {
    id: 'poll-3',
    groupName: 'Photography Club',
    question: 'Where should we go for our next photo shoot?',
    options: [
      { id: 'opt-9', text: 'Downtown Urban Architecture', votes: 6 },
      { id: 'opt-10', text: 'Botanical Gardens', votes: 14 },
      { id: 'opt-11', text: 'Beach Sunset Session', votes: 18 },
      { id: 'opt-12', text: 'Historical District Tour', votes: 9 }
    ],
    totalVotes: 47,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
    isActive: true,
    userVoted: false
  },
  {
    id: 'poll-4',
    groupName: 'Book Lovers',
    question: 'Which book should we read for next month\'s discussion?',
    options: [
      { id: 'opt-13', text: 'The Midnight Library by Matt Haig', votes: 12 },
      { id: 'opt-14', text: 'Project Hail Mary by Andy Weir', votes: 8 },
      { id: 'opt-15', text: 'Klara and the Sun by Kazuo Ishiguro', votes: 15 },
      { id: 'opt-16', text: 'The Seven Husbands of Evelyn Hugo', votes: 20 }
    ],
    totalVotes: 55,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
    isActive: true,
    userVoted: false
  },
  {
    id: 'poll-5',
    groupName: 'Cooking Masters',
    question: 'What cuisine should we explore in our next cooking class?',
    options: [
      { id: 'opt-17', text: 'Italian Pasta Making', votes: 25 },
      { id: 'opt-18', text: 'Thai Street Food', votes: 18 },
      { id: 'opt-19', text: 'French Pastry Techniques', votes: 22 },
      { id: 'opt-20', text: 'Japanese Sushi Workshop', votes: 16 }
    ],
    totalVotes: 81,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    isActive: true,
    userVoted: false
  },
  {
    id: 'poll-6',
    groupName: 'Fitness Warriors',
    question: 'Which fitness challenge should we start next week?',
    options: [
      { id: 'opt-21', text: '30-Day Yoga Challenge', votes: 14 },
      { id: 'opt-22', text: 'HIIT Bootcamp Series', votes: 19 },
      { id: 'opt-23', text: 'Strength Training Program', votes: 11 },
      { id: 'opt-24', text: 'Running Club Formation', votes: 16 }
    ],
    totalVotes: 60,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), // 4 days from now
    isActive: true,
    userVoted: false
  }
]; 