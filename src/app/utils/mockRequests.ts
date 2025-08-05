import { Request } from '../types';

export const mockRequests: Request[] = [
  {
    id: 'req-1',
    type: 'group-join',
    title: 'Join Request',
    description: 'Sarah Johnson wants to join "Tech Enthusiasts" group',
    requester: {
      id: 'user-1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'group-1',
      name: 'Tech Enthusiasts',
      type: 'group'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    status: 'pending'
  },
  {
    id: 'req-2',
    type: 'group-invite',
    title: 'Group Invitation',
    description: 'Mike Chen invited you to join "Photography Club"',
    requester: {
      id: 'user-2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'group-2',
      name: 'Photography Club',
      type: 'group'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: 'pending'
  },
  {
    id: 'req-3',
    type: 'joint-activity',
    title: 'Joint Activity Proposal',
    description: 'Emma Davis wants to organize a hiking trip this weekend',
    requester: {
      id: 'user-3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'activity-1',
      name: 'Weekend Hiking Trip',
      type: 'activity'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: 'pending'
  },
  {
    id: 'req-4',
    type: 'friend-request',
    title: 'Friend Request',
    description: 'Alex Rodriguez sent you a friend request',
    requester: {
      id: 'user-4',
      name: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'current-user',
      name: 'Current User',
      type: 'user'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    status: 'pending'
  },
  {
    id: 'req-5',
    type: 'group-join',
    title: 'Join Request',
    description: 'Lisa Wang wants to join "Book Lovers" group',
    requester: {
      id: 'user-5',
      name: 'Lisa Wang',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'group-3',
      name: 'Book Lovers',
      type: 'group'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    status: 'accepted'
  },
  {
    id: 'req-6',
    type: 'joint-activity',
    title: 'Joint Activity Proposal',
    description: 'David Kim wants to organize a movie night',
    requester: {
      id: 'user-6',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    target: {
      id: 'activity-2',
      name: 'Movie Night',
      type: 'activity'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    status: 'declined'
  }
]; 