// Programmatically create Firestore composite indexes via REST API using Admin credentials
import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';

async function getAccessToken() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  // Sanitize value: remove surrounding quotes, normalize newlines, and extract exact PEM block
  const unquoted = privateKeyRaw.trim().replace(/^"|"$/g, '');
  const normalized = unquoted
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const pemMatch = normalized.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
  const privateKey = pemMatch ? `${pemMatch[0]}\n` : normalized;

  // Helper to actually fetch the token from the active app's credential
  const fetchToken = async (app) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const tokenResp = await (app.options.credential /** @type {any} */).getAccessToken();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return tokenResp.access_token;
  };

  // Try explicit service account first if it looks valid
  if (clientEmail && privateKey && !/\[REDACTED\]/i.test(privateKeyRaw)) {
    try {
      const app = getApps().length === 0
        ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
        : getApps()[0];
      return await fetchToken(app);
    } catch (e) {
      // Fall through to ADC
      console.warn('apply-indexes: service account token failed, falling back to ADC:', /** @type {Error} */(e).message);
    }
  }

  // Fallback to Application Default Credentials (supports gcloud auth application-default login)
  const app = getApps().length === 0
    ? initializeApp({ credential: applicationDefault(), projectId })
    : getApps()[0];
  return await fetchToken(app);
}

function buildIndexSpecs() {
  // Union of indexes used by the app (mirrors firestore.indexes.json plus a few helpful ones)
  return [
    {
      collectionGroup: 'groups',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'members', arrayConfig: 'CONTAINS' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'messages',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'groupId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'connections',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'members', arrayConfig: 'CONTAINS' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'posts',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'authorId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
    {
      // Needed for queries like: where('groupId','==', X) + orderBy('timestamp','desc')
      collectionGroup: 'posts',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'groupId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'polls',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'groupId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'polls',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'type', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'requests',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'targetUserId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'activitySuggestions',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'voteHistory',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
  ];
}

export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Missing FIREBASE_ADMIN_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const specs = buildIndexSpecs();
    const created = [];
    const skipped = [];
    const errors = [];

    for (const spec of specs) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${encodeURIComponent(spec.collectionGroup)}/indexes`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queryScope: spec.queryScope, fields: spec.fields }),
      });

      if (resp.ok) {
        const data = await resp.json();
        created.push({ collectionGroup: spec.collectionGroup, operation: data.name || 'operation-started' });
        continue;
      }

      const text = await resp.text();
      if (resp.status === 409 || text.includes('ALREADY_EXISTS')) {
        skipped.push({ collectionGroup: spec.collectionGroup, reason: 'ALREADY_EXISTS' });
      } else {
        errors.push({ collectionGroup: spec.collectionGroup, status: resp.status, error: text });
      }
    }

    return NextResponse.json({ success: errors.length === 0, projectId, createdCount: created.length, skippedCount: skipped.length, errors, created, skipped });
  } catch (error) {
    console.error('apply-indexes failed', error);
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown';
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'missing';
    const hasPrivateKey = Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_PRIVATE_KEY.length > 50);
    return NextResponse.json({ 
      success: false, 
      error: /** @type {Error} */(error).message,
      diagnostics: {
        projectId,
        clientEmailSuffix: clientEmail === 'missing' ? 'missing' : clientEmail.split('@')[1],
        hasPrivateKey
      }
    }, { status: 500 });
  }
}

