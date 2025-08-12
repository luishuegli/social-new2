// Deprecated: mock data removed. Keep file to avoid import errors if referenced.
export const mockConversations = [
  {
    id: 'conv-1',
    otherUser: {
      id: 'user-1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isOnline: true
    },
    lastMessage: {
      id: 'msg-1',
      content: 'Hey! Are you still planning to join the hiking trip this weekend?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      senderId: 'user-1'
    },
    unreadCount: 2
  },
  {
    id: 'conv-2',
    otherUser: {
      id: 'user-2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isOnline: false
    },
    lastMessage: {
      id: 'msg-2',
      content: 'Thanks for the React workshop notes!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      senderId: 'currentUser'
    },
    unreadCount: 0
  },
  {
    id: 'conv-3',
    otherUser: {
      id: 'user-3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isOnline: true
    },
    lastMessage: {
      id: 'msg-3',
      content: 'The photos from yesterday\'s shoot turned out amazing! 📸',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      senderId: 'user-3'
    },
    unreadCount: 1
  },
  {
    id: 'conv-4',
    otherUser: {
      id: 'user-4',
      name: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isOnline: false
    },
    lastMessage: {
      id: 'msg-4',
      content: 'See you at the food festival tomorrow!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      senderId: 'user-4'
    },
    unreadCount: 0
  }
];

export const mockRequests = [
  {
    id: 'req-1',
    type: 'group_invite',
    groupName: 'Street Photography Masters',
    description: 'Join our community of passionate street photographers!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    fromUser: null
  },
  {
    id: 'req-2',
    type: 'join_request',
    groupName: 'Tech Enthusiasts',
    description: 'Interested in learning more about React and modern web development.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    fromUser: {
      id: 'user-5',
      name: 'Jessica Park',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: 'req-3',
    type: 'activity_invite',
    activityName: 'Weekend Coding Bootcamp',
    groupName: 'Tech Enthusiasts',
    description: 'Special invite to our intensive weekend coding session!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    fromUser: null
  }
];

export const mockActivityPolls = [
  {
    id: 'poll-1',
    group: {
      id: 'group-1',
      name: 'Mountain Adventurers',
      avatar: null
    },
    question: 'Which hiking trail should we explore next weekend?',
    description: 'Vote for your preferred trail difficulty and scenery type.',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 48), // 2 days from now
    options: [
      {
        title: 'Eagle Peak Trail',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
          location: 'Eagle Peak Trailhead',
          duration: '6 hours'
        },
        votes: 8
      },
      {
        title: 'Sunset Ridge Path',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
          location: 'Sunset Ridge Parking',
          duration: '4 hours'
        },
        votes: 12
      },
      {
        title: 'Valley Loop Circuit',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
          location: 'Valley Visitor Center',
          duration: '3 hours'
        },
        votes: 5
      }
    ]
  },
  {
    id: 'poll-2',
    group: {
      id: 'group-2',
      name: 'Tech Enthusiasts',
      avatar: null
    },
    question: 'What should be the focus of our next workshop?',
    description: 'Help us decide on the most valuable topic for our community.',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days from now
    options: [
      {
        title: 'Advanced React Patterns',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
          location: 'Tech Hub Downtown',
          duration: '3 hours'
        },
        votes: 15
      },
      {
        title: 'GraphQL & Apollo',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
          location: 'Tech Hub Downtown',
          duration: '3 hours'
        },
        votes: 9
      },
      {
        title: 'TypeScript Deep Dive',
        details: {
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
          location: 'Tech Hub Downtown',
          duration: '3 hours'
        },
        votes: 11
      }
    ]
  }
];