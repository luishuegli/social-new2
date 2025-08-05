import { Group, LatestActivity } from '../types';

export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Mountain Adventurers',
    description: 'A community of outdoor enthusiasts who love hiking, climbing, and exploring nature. We organize regular trips to local mountains and national parks.',
    memberCount: 127,
    joined: true,
    members: [
      { id: 'user-1', name: 'Sarah Johnson', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-2', name: 'Mike Chen', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-3', name: 'Emma Davis', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-4', name: 'Alex Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-5', name: 'Lisa Wang', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-6', name: 'David Kim', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-7', name: 'Maria Garcia', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-8', name: 'James Wilson', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-1',
      title: 'Weekend Hiking Trip to Eagle Peak',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
      location: 'Eagle Peak Trailhead',
      type: 'outing',
      joined: true
    },
    category: 'Outdoor & Adventure',
    latestActivity: {
      type: 'message',
      author: {
        name: 'Sarah Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Just finished the Eagle Peak trail! The views were absolutely incredible. Can\'t wait for our next group hike.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    theme: {
      colors: {
        primary: '#10B981', // emerald-500
        secondary: '#059669'  // emerald-600
      }
    }
  },
  {
    id: 'group-2',
    name: 'Tech Enthusiasts',
    description: 'A community for developers, designers, and tech professionals to share knowledge, collaborate on projects, and stay updated with the latest technology trends.',
    memberCount: 89,
    joined: false,
    members: [
      { id: 'user-9', name: 'Tom Anderson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-10', name: 'Rachel Green', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-11', name: 'Chris Lee', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-12', name: 'Amanda Smith', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-13', name: 'Kevin Brown', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-2',
      title: 'React Advanced Patterns Workshop',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
      location: 'Tech Hub Downtown',
      type: 'workshop',
      joined: false
    },
    category: 'Technology',
    latestActivity: {
      type: 'poll',
      content: 'React Advanced Patterns Workshop',
      pollQuestion: 'Which React pattern would you like to learn next?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    theme: {
      colors: {
        primary: '#3B82F6', // blue-500
        secondary: '#1D4ED8'  // blue-700
      }
    }
  },
  {
    id: 'group-3',
    name: 'Photography Club',
    description: 'A group for photography enthusiasts to share techniques, organize photo walks, and showcase their work. All skill levels welcome!',
    memberCount: 156,
    joined: true,
    members: [
      { id: 'user-14', name: 'Sophie Turner', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-15', name: 'Ryan Murphy', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-16', name: 'Jessica Park', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-17', name: 'Daniel White', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-18', name: 'Nina Patel', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-19', name: 'Carlos Mendez', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-3',
      title: 'Sunset Photography Session',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day from now
      location: 'Beach Promenade',
      type: 'event',
      joined: false
    },
    category: 'Arts & Culture',
    latestActivity: {
      type: 'post',
      author: {
        name: 'Sophie Turner',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
      },
      content: 'New post added',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() // 1 hour ago
    },
    theme: {
      colors: {
        primary: '#8B5CF6', // violet-500
        secondary: '#7C3AED'  // violet-600
      }
    }
  },
  {
    id: 'group-4',
    name: 'Book Lovers',
    description: 'A community for avid readers to discuss books, share recommendations, and participate in book clubs. We read across all genres and welcome diverse perspectives.',
    memberCount: 203,
    joined: false,
    members: [
      { id: 'user-20', name: 'Grace Taylor', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-21', name: 'Marcus Johnson', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-22', name: 'Olivia Davis', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-23', name: 'Ethan Wilson', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-24', name: 'Zoe Anderson', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-4',
      title: 'Monthly Book Discussion: "The Midnight Library"',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
      location: 'Local Library',
      type: 'meeting',
      joined: true
    },
    category: 'Literature',
    latestActivity: {
      type: 'message',
      author: {
        name: 'Grace Taylor',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      content: 'I just finished "The Midnight Library" and it was absolutely mind-blowing! The concept of infinite possibilities really resonated with me.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
    },
    theme: {
      colors: {
        primary: '#F59E0B', // amber-500
        secondary: '#D97706'  // amber-600
      }
    }
  },
  {
    id: 'group-5',
    name: 'Cooking Masters',
    description: 'A community for food lovers and cooking enthusiasts. We share recipes, cooking techniques, and organize cooking classes and food tastings.',
    memberCount: 94,
    joined: false,
    members: [
      { id: 'user-25', name: 'Isabella Martinez', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-26', name: 'Lucas Thompson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-27', name: 'Ava Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-28', name: 'Noah Garcia', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-29', name: 'Mia Lopez', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-5',
      title: 'Italian Pasta Making Class',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
      location: 'Culinary Institute',
      type: 'workshop',
      joined: false
    },
    category: 'Food & Cooking',
    latestActivity: {
      type: 'post',
      author: {
        name: 'Isabella Martinez',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      content: 'New post added',
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
    },
    theme: {
      colors: {
        primary: '#EF4444', // red-500
        secondary: '#DC2626'  // red-600
      }
    }
  },
  {
    id: 'group-6',
    name: 'Fitness Warriors',
    description: 'A supportive community for fitness enthusiasts of all levels. We share workout routines, nutrition tips, and organize group fitness sessions.',
    memberCount: 178,
    joined: true,
    members: [
      { id: 'user-30', name: 'Harper Lee', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-31', name: 'Sebastian Brown', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-32', name: 'Scarlett Davis', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-33', name: 'Jackson Wilson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-34', name: 'Luna Anderson', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-35', name: 'Felix Taylor', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-6',
      title: 'HIIT Bootcamp Session',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days from now
      location: 'Central Park',
      type: 'event',
      joined: false
    },
    category: 'Health & Fitness',
    latestActivity: {
      type: 'poll',
      content: 'HIIT Bootcamp Session',
      pollQuestion: 'What time works best for our next HIIT session?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    theme: {
      colors: {
        primary: '#06B6D4', // cyan-500
        secondary: '#0891B2'  // cyan-600
      }
    }
  },
  {
    id: 'group-7',
    name: 'Creative Writers',
    description: 'A community for writers, poets, and creative storytellers to share their work, get feedback, and collaborate on writing projects.',
    memberCount: 67,
    joined: false,
    members: [
      { id: 'user-36', name: 'Aisha Patel', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-37', name: 'Marcus Chen', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-38', name: 'Elena Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-39', name: 'Kai Johnson', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
      { id: 'user-40', name: 'Zara Williams', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' }
    ],
    nextActivity: {
      id: 'activity-7',
      title: 'Poetry Slam Night',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days from now
      location: 'Downtown Arts Center',
      type: 'event',
      joined: false
    },
    category: 'Arts & Culture',
    latestActivity: {
      type: 'message',
      author: {
        name: 'Aisha Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      content: 'I\'m working on a new poem for the poetry slam. The theme is "urban dreams" - anyone want to give feedback?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
    },
    theme: {
      colors: {
        primary: '#EC4899', // pink-500
        secondary: '#DB2777'  // pink-600
      }
    }
  }
]; 