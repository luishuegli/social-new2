// src/app/api/rerank-suggestions/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { analyzeVotingPatterns } from '@/lib/aiVotingHistory';
import { adminDb } from '@/app/Lib/firebaseAdmin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      candidates = [], // [{ name, description, rating, priceLevel, imageUrl, placeId }]
      groupId,
      prompt, // original user prompt (optional)
      dateTime, // ISO (optional)
    } = body || {};

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ success: false, error: 'No candidates provided' }, { status: 400 });
    }

    // Build lightweight taste context from aggregated preferences and vote history
    let tasteContext = '';
    try {
      if (groupId) {
        // Prefer aggregated preferences when available
        const prefSnap = await adminDb.collection('ai_preferences').doc(groupId).get();
        if (prefSnap.exists) {
          const counts = prefSnap.data()?.counts || {};
          const top = Object.entries(counts)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .slice(0, 5)
            .map(([name, v]) => `${name} (${v})`).join(', ');
          tasteContext = top ? `Group often likes: ${top}.` : '';
        }
        // Fallback to dynamic voting patterns if aggregated empty: compute via Admin from ai_vote_history
        if (!tasteContext) {
          const snap = await adminDb.collection('ai_vote_history').where('groupId', '==', groupId).get();
          const counts = new Map();
          for (const doc of snap.docs) {
            const d = doc.data() || {};
            const key = String(d.selectedOption || '').toLowerCase();
            if (!key) continue;
            counts.set(key, (counts.get(key) || 0) + 1);
          }
          const top = Array.from(counts.entries())
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .slice(0, 5)
            .map(([name, v]) => `${name} (${v})`).join(', ');
          tasteContext = top ? `Group often likes: ${top}.` : '';
        }
      }
    } catch (_) {
      // ignore
    }

    const timeContext = dateTime ? `Planned around ${new Date(dateTime).toLocaleString()}.` : '';

    const systemPrompt = `You are re-ranking local activity options for a group. Consider overall suitability, user's prompt, 
preferences, time context, and variety. Return a JSON object with items sorted best-first and a short reason per item.
Keep reasons under 15 words.`;

    const input = {
      prompt: prompt || '',
      tastes: tasteContext,
      time: timeContext,
      candidates: candidates.map((c, i) => ({
        idx: i,
        name: c.name,
        description: c.description,
        rating: c.rating || 0,
        priceLevel: c.priceLevel || 'Unknown'
      }))
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const promptText = `${systemPrompt}\n\nINPUT JSON:\n${JSON.stringify(input, null, 2)}\n\n` +
      `Return ONLY JSON in the exact shape:\n` +
      `{"order": [candidateIdx...], "reasons": [{idx:number, reason:string}...]}`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = (response?.text?.() || '').trim();

    let parsed;
    try {
      const match = text.match(/\{[\s\S]*\}$/);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(text);
    } catch (e) {
      // Fallback: leave original order
      parsed = { order: candidates.map((_, i) => i), reasons: [] };
    }

    const order = Array.isArray(parsed.order) ? parsed.order : candidates.map((_, i) => i);
    const reasonMap = new Map((parsed.reasons || []).map((r) => [r.idx, r.reason]));
    const reranked = order
      .map((idx) => ({ ...(candidates[idx] || {}), idx, reason: reasonMap.get(idx) || '' }))
      .filter((x) => x.name);

    return NextResponse.json({ success: true, items: reranked });
  } catch (e) {
    console.error('rerank-suggestions failed', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

