import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';

async function getAccessToken() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const cred = clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault();
  const app = getApps().length === 0 ? initializeApp({ credential: cred, projectId }) : getApps()[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenResp = await (app.options.credential /** @type {any} */).getAccessToken();
  return tokenResp.access_token;
}

export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400 });
    }
    const token = await getAccessToken();
    const releaseName = `projects/${projectId}/releases/cloud.firestore`;
    const relResp = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}` , {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!relResp.ok) {
      const text = await relResp.text();
      return NextResponse.json({ success: false, step: 'getRelease', status: relResp.status, error: text }, { status: relResp.status });
    }
    const release = await relResp.json();
    const rulesetName = release.rulesetName;
    const rsResp = await fetch(`https://firebaserules.googleapis.com/v1/${rulesetName}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!rsResp.ok) {
      const text = await rsResp.text();
      return NextResponse.json({ success: false, step: 'getRuleset', status: rsResp.status, error: text }, { status: rsResp.status });
    }
    const ruleset = await rsResp.json();
    const files = ruleset.source?.files || [];
    const firestoreFile = files.find((f) => f.name?.includes('firestore')) || files[0];
    const content = firestoreFile?.content || '';
    return NextResponse.json({ success: true, projectId, release: release.name, rulesetName, length: content.length, content });
  } catch (e) {
    return NextResponse.json({ success: false, error: /** @type {Error} */(e).message }, { status: 500 });
  }
}

