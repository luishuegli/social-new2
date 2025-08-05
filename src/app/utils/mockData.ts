import { Conversation } from '../types';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    otherUser: {
      id: 'user-1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    lastMessage: {
      content: 'Hey! Are you free for coffee this weekend?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      senderId: 'user-1'
    },
    unreadCount: 2
  },
  {
    id: 'conv-2',
    otherUser: {
      id: 'user-2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    lastMessage: {
      content: 'Thanks for the help with the project!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      senderId: 'current-user'
    },
    unreadCount: 0
  },
  {
    id: 'conv-3',
    otherUser: {
      id: 'user-3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    lastMessage: {
      content: 'The meeting is confirmed for tomorrow at 3 PM.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      senderId: 'user-3'
    },
    unreadCount: 1
  },
  {
    id: 'conv-4',
    otherUser: {
      id: 'user-4',
      name: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    lastMessage: {
      content: 'Great idea! Let\'s implement that feature.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      senderId: 'current-user'
    },
    unreadCount: 0
  },
  {
    id: 'conv-5',
    otherUser: {
      id: 'user-5',
      name: 'Lisa Wang',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    lastMessage: {
      content: 'Happy birthday! 🎉',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
      senderId: 'user-5'
    },
    unreadCount: 0
  }
]; 