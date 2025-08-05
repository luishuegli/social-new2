export const mockPosts = [
  {
    id: 'post-1',
    author: {
      id: 'user-1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-1',
      name: 'Mountain Adventurers',
      avatar: null
    },
    caption: 'What an incredible sunset from Eagle Peak! The colors were absolutely stunning tonight. Can\'t wait for our next group hike! 🌄',
    media: [
      {
        type: 'image',
        url: '/api/placeholder/500/500',
        alt: 'Sunset view from Eagle Peak'
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 24,
    comments: 8,
    isLiked: false,
    recentComments: [
      {
        author: { name: 'Mike Chen' },
        text: 'Gorgeous shot! Wish I could have made it'
      },
      {
        author: { name: 'Emma Davis' },
        text: 'The lighting is perfect! 📸'
      }
    ]
  },
  {
    id: 'post-2',
    author: {
      id: 'user-3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-3',
      name: 'Photography Club',
      avatar: null
    },
    caption: 'Some highlights from today\'s street photography workshop! Amazing to see everyone\'s unique perspective on the same locations.',
    media: [
      {
        type: 'image',
        url: '/api/placeholder/400/600',
        alt: 'Street photography sample 1'
      },
      {
        type: 'image',
        url: '/api/placeholder/600/400',
        alt: 'Street photography sample 2'
      },
      {
        type: 'image',
        url: '/api/placeholder/500/700',
        alt: 'Street photography sample 3'
      },
      {
        type: 'image',
        url: '/api/placeholder/700/500',
        alt: 'Street photography sample 4'
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 31,
    comments: 12,
    isLiked: true,
    recentComments: [
      {
        author: { name: 'Ryan Murphy' },
        text: 'Love the composition in the third shot!'
      },
      {
        author: { name: 'Jessica Park' },
        text: 'These workshops are so inspiring'
      }
    ]
  },
  {
    id: 'post-3',
    author: {
      id: 'user-2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-2',
      name: 'Tech Enthusiasts',
      avatar: null
    },
    caption: 'Just wrapped up an amazing React workshop! Thanks to everyone who attended. The energy and questions were fantastic. Looking forward to our next session on GraphQL! 🚀',
    media: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    likes: 18,
    comments: 6,
    isLiked: false,
    recentComments: [
      {
        author: { name: 'Rachel Green' },
        text: 'Thanks for the great session!'
      },
      {
        author: { name: 'Chris Lee' },
        text: 'Those advanced patterns were eye-opening'
      }
    ]
  },
  {
    id: 'post-4',
    author: {
      id: 'user-5',
      name: 'Isabella Martinez',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-5',
      name: 'Cooking Masters',
      avatar: null
    },
    caption: 'Today\'s pasta making class was incredible! Fresh linguine with homemade pesto. The techniques we learned will definitely change how I cook at home. 🍝',
    media: [
      {
        type: 'image',
        url: '/api/placeholder/600/400',
        alt: 'Fresh pasta with pesto'
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    likes: 27,
    comments: 9,
    isLiked: true,
    recentComments: [
      {
        author: { name: 'Lucas Thompson' },
        text: 'That looks delicious! Recipe please?'
      },
      {
        author: { name: 'Noah Garcia' },
        text: 'Can\'t wait for next week\'s class'
      }
    ]
  },
  {
    id: 'post-5',
    author: {
      id: 'user-6',
      name: 'Harper Lee',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-6',
      name: 'Fitness Warriors',
      avatar: null
    },
    caption: 'Morning HIIT session complete! 💪 Nothing beats starting the day with an energizing workout. Who\'s joining us for tomorrow\'s bootcamp?',
    media: [
      {
        type: 'image',
        url: '/api/placeholder/500/600',
        alt: 'Morning workout session'
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    likes: 22,
    comments: 7,
    isLiked: false,
    recentComments: [
      {
        author: { name: 'Sebastian Brown' },
        text: 'Count me in for tomorrow!'
      },
      {
        author: { name: 'Luna Anderson' },
        text: 'These morning sessions are the best'
      }
    ]
  },
  {
    id: 'post-6',
    author: {
      id: 'user-4',
      name: 'Grace Taylor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    group: {
      id: 'group-4',
      name: 'Book Lovers',
      avatar: null
    },
    caption: 'Just finished "The Midnight Library" for our book club discussion. What a thought-provoking read! The concept of infinite possibilities really makes you think about life choices. Can\'t wait to hear everyone\'s thoughts! 📚',
    media: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    likes: 16,
    comments: 11,
    isLiked: true,
    recentComments: [
      {
        author: { name: 'Marcus Johnson' },
        text: 'Loved that book! Great choice for discussion'
      },
      {
        author: { name: 'Ethan Wilson' },
        text: 'The parallel lives concept was fascinating'
      }
    ]
  }
];