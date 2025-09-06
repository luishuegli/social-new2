import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, budget, radius, groupSize, suggestionCount = 3, lat, lng, location, excludeKeys = [], excludePlaceIds = [] } = body;
    
    console.log('🤖 Generating suggestions:', { prompt, budget, radius, groupSize, suggestionCount, lat, lng, location });

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({
        error: 'Google Places API key missing',
        details: 'Set GOOGLE_PLACES_API_KEY in your .env.local and restart the dev server.'
      }, { status: 500 });
    }

    // Generate suggestions based on the count requested
    const suggestions = await generateActivitySuggestions({
      prompt,
      budget,
      radius,
      count: suggestionCount,
      lat,
      lng,
      location,
      excludeKeys,
      excludePlaceIds
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestions,
      message: `${suggestions.length} AI suggestions generated successfully`
    });

  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
    return NextResponse.json({ 
      error: 'Failed to generate suggestions', 
      details: error.message 
    }, { status: 500 });
  }
}

// Map a free-text activity to Google Places (New) includedTypes or keyword text
function mapActivityToPlaceType(activity) {
  const a = (activity || '').toLowerCase();
  const map = {
    // food & nightlife
    'food & drink': 'restaurant',
    'nightlife': 'bar',
    // outdoors
    'outdoors & adventure': 'tourist_attraction',
    'hike': 'tourist_attraction',
    'hiking': 'tourist_attraction',
    'kayak': 'tourist_attraction',
    'kayaking': 'tourist_attraction',
    'park': 'park',
    'beach': 'tourist_attraction',
    'viewpoint': 'tourist_attraction',
    'sunset': 'tourist_attraction',
    'picnic': 'park',
    // sports & fitness
    'sports & fitness': 'gym',
    'gym': 'gym',
    'golf': 'golf_course',
    'tennis': 'stadium',
    // arts & culture
    'creative & arts': 'art_gallery',
    'cultural & educational': 'museum',
    'museum': 'museum',
    'art gallery': 'art_gallery',
    // relaxation
    'relaxation & wellness': 'spa',
    'spa': 'spa',
    // entertainment
    'entertainment': 'movie_theater',
    'movies': 'movie_theater',
    // shopping
    'shopping': 'shopping_mall',
    // technology
    'technology & innovation': 'museum'
  };
  return map[a];
}

// Detect if the query is more about a general place/location to be rather than a business
function isLocationOriented(activity) {
  const a = (activity || '').toLowerCase();
  const keywords = [
    'sunset', 'sunrise', 'picnic', 'walk', 'stroll', 'view', 'viewpoint', 'lookout', 'scenic',
    'park', 'beach', 'waterfront', 'promenade', 'trail', 'hike', 'hiking', 'mountain', 'river',
    'lake', 'quiet place', 'hangout', 'chill', 'photography', 'photo spot', 'date spot'
  ];
  return keywords.some(k => a.includes(k));
}

async function generateActivitySuggestions({ prompt, budget, radius, count = 3, lat, lng, location, excludeKeys = [], excludePlaceIds = [] }) {
  // Use the user's natural language prompt for text search
  const normalized = (prompt || '').trim();
  const includedType = mapActivityToPlaceType(normalized);

  // Build request for Places API (New)
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
    'X-Goog-FieldMask': [
      'places.displayName',
      'places.formattedAddress',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.photos',
      'places.id',
      'places.location',
      'places.googleMapsUri',
      'places.types'
    ].join(',')
  };

  const radiusMeters = Math.max(1000, Math.min(50000, Number(radius) * 1000 || 5000));

  let resp;
  const locationMode = isLocationOriented(normalized);
  if (typeof lat === 'number' && typeof lng === 'number') {
    // Nearby search
    const body = {
      maxResultCount: Math.min(20, Math.max(1, count * 2)),
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters
        }
      },
      rankPreference: 'DISTANCE'
    };
    if (locationMode) {
      // Favor general locations like parks and attractions (use a single type for stricter API compatibility)
      body.includedTypes = ['park'];
    } else {
      if (includedType) {
        body.includedTypes = [includedType];
      }
      // Note: searchNearby doesn't accept a free-text keyword; if no includedType,
      // we'll just do a broader nearby search and rely on ranking.
    }

    resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    // Fallback to text search if nearby fails (e.g., due to incompatible params)
    if (!resp.ok) {
      const textQuery = locationMode
        ? (normalized ? `${normalized} scenic spots, parks, viewpoints` : 'parks and scenic viewpoints near me')
        : (normalized || 'activities near me');
      const textBody = { textQuery, maxResultCount: Math.min(20, Math.max(1, count * 2)) };
      resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers,
        body: JSON.stringify(textBody)
      });
    }
  } else {
    // Text search (optionally with a generic location hint)
    const textQuery = locationMode
      ? (normalized ? `${normalized} scenic spots, parks, viewpoints` : 'parks and scenic viewpoints near me')
      : (normalized || 'activities near me');
    const body = { textQuery, maxResultCount: Math.min(20, Math.max(1, count * 2)) };
    // We could add locationBias later if you prefer a default city
    resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  if (!resp.ok) {
    let errText = await resp.text();
    try {
      const errJson = JSON.parse(errText);
      errText = errJson?.error?.message || errText;
    } catch (_) { /* keep raw text */ }
    throw new Error(`Places API request failed with status ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  if (data.error) {
    throw new Error(`${data.error.message || 'Unknown error from Places API'}`);
  }

  let places = Array.isArray(data.places) ? data.places : [];

  // If the user intent is location-oriented, filter out obvious businesses/shops
  if (places.length && isLocationOriented(normalized)) {
    const disallowed = new Set([
      'store', 'convenience_store', 'supermarket', 'grocery_or_supermarket', 'shopping_mall',
      'restaurant', 'bar', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery', 'liquor_store'
    ]);
    places = places.filter(p => {
      const t = p.types || [];
      // keep if it contains park/tourist attractions or lacks disallowed types
      const hasPreferred = t.includes('park') || t.includes('tourist_attraction');
      const hasDisallowed = t.some(x => disallowed.has(x));
      return hasPreferred || !hasDisallowed;
    });
  }
  const priceMapNew = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$'
  };

  const excludedNameSet = new Set((excludeKeys || []).map((s) => String(s).toLowerCase().trim()).filter(Boolean));
  const excludedIdSet = new Set((excludePlaceIds || []).map((s) => String(s).trim()).filter(Boolean));

  const suggestions = places
    .filter((place) => {
      const name = (place.displayName?.text || place.displayName || '').toLowerCase().trim();
      const id = String(place.id || '').trim();
      if (!name && !id) return true;
      if (excludedIdSet.has(id)) return false;
      if (name && excludedNameSet.has(name)) return false;
      
      // Apply budget filtering if a specific budget is selected (not 'Any')
      if (budget && budget !== 'Any') {
        const placePrice = place.priceLevel;
        if (budget === 'Free' && placePrice !== 'PRICE_LEVEL_FREE') {
          return false;
        } else if (budget === '$' && placePrice !== 'PRICE_LEVEL_INEXPENSIVE') {
          return false;
        } else if (budget === '$$' && placePrice !== 'PRICE_LEVEL_MODERATE') {
          return false;
        } else if (budget === '$$$' && placePrice !== 'PRICE_LEVEL_EXPENSIVE') {
          return false;
        }
      }
      
      return true;
    })
    .slice(0, count)
    .map((place) => {
    const photoName = place.photos?.[0]?.name; // e.g., places/XXX/photos/YYY
    const imageUrl = photoName
      ? `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_PLACES_API_KEY}&maxWidthPx=400&maxHeightPx=400`
      : undefined;

    const ratingPart = place.rating ? `Rating: ${place.rating} (${place.userRatingCount || 0})` : undefined;
    const pricePart = place.priceLevel ? `Price: ${priceMapNew[place.priceLevel] || 'Unknown'}` : undefined;

    const descPieces = [place.formattedAddress, ratingPart, pricePart].filter(Boolean);

    return {
      name: place.displayName?.text || place.displayName || 'Unknown',
      description: descPieces.join(' • ') || normalized,
      imageUrl,
      rating: place.rating || 0,
      priceLevel: place.priceLevel ? (priceMapNew[place.priceLevel] || 'Unknown') : 'Unknown',
      distance: 0,
      placeId: place.id,
      address: place.formattedAddress || '',
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      googleMapsUri: place.googleMapsUri || null,
    };
  });

  return suggestions;
}