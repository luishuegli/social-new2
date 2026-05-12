import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';
import type { SearchResult, SearchResponse } from '../../types/search';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // --- USER SEARCH ---
    // Search by username (case-insensitive prefix match)
    const usersRef = adminDb.collection('users');
    
    // We need to query both username and displayName
    // For efficient prefix matching, we use >= and <= with \uf8ff (high unicode character)
    const usernameQuery = usersRef
      .where('username', '>=', lowerQuery)
      .where('username', '<=', lowerQuery + '\uf8ff')
      .limit(10);

    const userDocs = await usernameQuery.get();
    
    // Process user results with relevance scoring
    userDocs.docs.forEach(doc => {
      const data = doc.data();
      const username = (data.username || '').toLowerCase();
      const displayName = (data.displayName || '').toLowerCase();
      
      // Calculate relevance score (higher is better)
      let score = 0;
      
      // Exact match gets highest score
      if (username === lowerQuery || displayName === lowerQuery) {
        score = 100;
      }
      // Prefix match on username
      else if (username.startsWith(lowerQuery)) {
        score = 80;
      }
      // Contains match on username
      else if (username.includes(lowerQuery)) {
        score = 60;
      }
      // Prefix match on display name
      else if (displayName.startsWith(lowerQuery)) {
        score = 70;
      }
      // Contains match on display name
      else if (displayName.includes(lowerQuery)) {
        score = 50;
      }
      
      // Only include if there's a match
      if (score > 0) {
        results.push({
          id: doc.id,
          type: 'user',
          displayName: data.displayName || '',
          username: data.username || '',
          profilePictureUrl: data.profilePictureUrl || '',
          relevanceScore: score
        });
      }
    });

    // Also search by display name if query doesn't start with @
    if (!query.startsWith('@')) {
      const displayNameQuery = usersRef
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(10);

      const displayNameDocs = await displayNameQuery.get();
      
      displayNameDocs.docs.forEach(doc => {
        // Skip if already added from username search
        if (results.some(r => r.id === doc.id)) {
          return;
        }
        
        const data = doc.data();
        const displayName = (data.displayName || '').toLowerCase();
        
        let score = 0;
        if (displayName === lowerQuery) {
          score = 90;
        } else if (displayName.startsWith(lowerQuery)) {
          score = 70;
        } else if (displayName.includes(lowerQuery)) {
          score = 50;
        }
        
        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'user',
            displayName: data.displayName || '',
            username: data.username || '',
            profilePictureUrl: data.profilePictureUrl || '',
            relevanceScore: score
          });
        }
      });
    }

    // --- GROUP SEARCH ---
    const groupsRef = adminDb.collection('groups');
    
    // Search by group name (case-insensitive prefix match)
    const groupNameQuery = groupsRef
      .where('groupName', '>=', query)
      .where('groupName', '<=', query + '\uf8ff')
      .limit(10);

    const groupDocs = await groupNameQuery.get();
    
    // Process group results with relevance scoring
    groupDocs.docs.forEach(doc => {
      const data = doc.data();
      const groupName = (data.groupName || '').toLowerCase();
      const description = (data.description || '').toLowerCase();
      
      let score = 0;
      
      // Exact match
      if (groupName === lowerQuery) {
        score = 100;
      }
      // Prefix match
      else if (groupName.startsWith(lowerQuery)) {
        score = 85;
      }
      // Contains match
      else if (groupName.includes(lowerQuery)) {
        score = 65;
      }
      // Description contains (lower priority)
      else if (description.includes(lowerQuery)) {
        score = 40;
      }
      
      if (score > 0) {
        results.push({
          id: doc.id,
          type: 'group',
          groupName: data.groupName || '',
          groupAvatar: data.groupAvatar || data.avatar || '',
          description: data.description || '',
          memberCount: data.memberCount || 0,
          relevanceScore: score
        });
      }
    });

    // --- SORT BY RELEVANCE SCORE ---
    results.sort((a, b) => {
      // Primary sort: relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort: type (users before groups)
      if (a.type !== b.type) {
        return a.type === 'user' ? -1 : 1;
      }
      
      // Tertiary sort: alphabetically
      const aName = a.type === 'user' ? a.username : a.groupName;
      const bName = b.type === 'user' ? b.username : b.groupName;
      return (aName || '').localeCompare(bName || '');
    });

    // Limit total results to 12 (6 users + 6 groups is a good balance)
    const limitedResults = results.slice(0, 12);

    const response: SearchResponse = {
      results: limitedResults,
      query: query,
      totalCount: results.length,
      timestamp: Date.now()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', results: [] },
      { status: 500 }
    );
  }
}

