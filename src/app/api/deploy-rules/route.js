// Deploy Firestore security rules using the Firebase Rules API with Admin credentials
import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import fs from 'node:fs/promises';
import path from 'node:path';

async function getAccessToken() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const cred = clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  const app = getApps().length === 0
    ? initializeApp({ credential: cred, projectId })
    : getApps()[0];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const tokenResp = await (app.options.credential /** @type {any} */).getAccessToken();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return tokenResp.access_token;
}

export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Missing FIREBASE_ADMIN_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID' }, { status: 400 });
    }

    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    const rulesContent = await fs.readFile(rulesPath, 'utf8');
    const accessToken = await getAccessToken();

    // 1) Create a new ruleset
    const createResp = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          files: [
            {
              name: 'firestore.rules',
              content: rulesContent,
            },
          ],
        },
      }),
    });

    if (!createResp.ok) {
      const text = await createResp.text();
      return NextResponse.json({ success: false, step: 'createRuleset', status: createResp.status, error: text }, { status: 500 });
    }

    const created = await createResp.json();
    const rulesetName = created.name; // e.g. projects/PROJECT_ID/rulesets/RULESET_ID

    // 2) Update the cloud.firestore release to point to the new ruleset
    const releaseName = `projects/${projectId}/releases/cloud.firestore`;
    let updateResp = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: releaseName, rulesetName }),
    });

    // If the release does not exist yet, create it
    if (updateResp.status === 404) {
      const createReleaseResp = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: releaseName, rulesetName }),
      });
      if (!createReleaseResp.ok) {
        const text = await createReleaseResp.text();
        return NextResponse.json({ success: false, step: 'createRelease', status: createReleaseResp.status, error: text }, { status: 500 });
      }
      updateResp = createReleaseResp;
    } else if (!updateResp.ok) {
      // If conflicts due to existing release, treat as success by updating same name
      if (updateResp.status === 409) {
        return NextResponse.json({ success: true, projectId, rulesetName, note: 'Release already pointed or exists (409).' });
      }
      const text = await updateResp.text();
      return NextResponse.json({ success: false, step: 'updateRelease', status: updateResp.status, error: text }, { status: 500 });
    }

    const updated = await updateResp.json();
    return NextResponse.json({ success: true, projectId, rulesetName, release: updated.name });
  } catch (error) {
    console.error('deploy-rules failed', error);
    return NextResponse.json({ success: false, error: /** @type {Error} */(error).message }, { status: 500 });
  }
}

