const cache = new Map();

async function fetchWithCache(key, fetcher, ttl = 300000) { // Default TTL of 5 minutes
  const now = Date.now();
  if (cache.has(key)) {
    const { timestamp, data } = cache.get(key);
    if (now - timestamp < ttl) {
      return data;
    }
  }

  const data = await fetcher();
  cache.set(key, { timestamp: now, data });
  return data;
}

export const dataService = {
  // Example function - to be expanded
  async getMyGroups(userId) {
    if (!userId) return [];
    
    return fetchWithCache(`my-groups-${userId}`, async () => {
      const resp = await fetch(`/api/my-groups?uid=${encodeURIComponent(userId)}`);
      if (!resp.ok) {
        throw new Error('Failed to fetch user groups');
      }
      const data = await resp.json();
      return data.groups || [];
    });
  },

  async getAllActivities(userId) {
    if (!userId) return [];

    return fetchWithCache(`all-activities-${userId}`, async () => {
      // In a real app, you'd fetch from an endpoint that combines group and solo activities.
      // For now, we'll fetch them separately and combine them.
      
      // Fetch solo activities
      const soloResp = await fetch(`/api/activities/solo?userId=${encodeURIComponent(userId)}`);
      if (!soloResp.ok) throw new Error('Failed to fetch solo activities');
      const soloActivities = await soloResp.json();
      
      // We need to fetch group activities too.
      // This is complex and will be improved when we refactor more components.
      // For now, we'll leave this part out and focus on the structure.
      // The logic from the Activities page will be moved here eventually.
      
      // Mark solo activities with a flag
      const mappedSolo = soloActivities.map(a => ({ ...a, type: 'solo' }));

      return mappedSolo; // Will eventually be combined with group activities
    });
  },

  // Invalidate cache for a specific key
  invalidate(key) {
    if (cache.has(key)) {
      cache.delete(key);
    }
  },

  // Invalidate cache for keys matching a prefix
  invalidatePrefix(prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }
};
