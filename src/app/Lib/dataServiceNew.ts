const cache = new Map<string, { timestamp: number; data: any }>();

async function fetchWithCache(key: string, fetcher: () => Promise<any>, ttl: number = 300000): Promise<any> {
  const now = Date.now();
  if (cache.has(key)) {
    const { timestamp, data } = cache.get(key)!;
    if (now - timestamp < ttl) {
      return data;
    }
  }

  const data = await fetcher();
  cache.set(key, { timestamp: now, data });
  return data;
}

export const dataService = {
  async getMyGroups(userId: string): Promise<any[]> {
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

  async getAllActivities(userId: string): Promise<any[]> {
    if (!userId) return [];

    return fetchWithCache(`all-activities-${userId}`, async () => {
      const soloResp = await fetch(`/api/activities/solo?userId=${encodeURIComponent(userId)}`);
      if (!soloResp.ok) throw new Error('Failed to fetch solo activities');
      const soloActivities = await soloResp.json();
      
      const mappedSolo = soloActivities.map((a: any) => ({ ...a, type: 'solo' }));
      return mappedSolo;
    });
  },

  invalidate(key: string): void {
    if (cache.has(key)) {
      cache.delete(key);
    }
  },

  invalidatePrefix(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }
};
