// `firebase-functions` types are only needed when deploying; ignore in the app's typecheck environment
// @ts-ignore
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK (uses default service account when deployed)
admin.initializeApp();
const firestore = admin.firestore();
const PASSWORD_RESET_WINDOW_MS = 5 * 60 * 1000;
const FIREBASE_WEB_API_KEY = 'AIzaSyC4ouF9Cn2MyMGjXbZyTQUSw2ifEButMKg';
const PASSWORD_RESET_REQUESTS_COLLECTION = 'passwordResetRequests';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const setCorsHeaders = (res: functions.Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
};

const readJsonBody = (req: functions.Request): Record<string, any> => {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, any>;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body) as Record<string, any>;
    } catch {
      return {};
    }
  }

  return {};
};

const getResetRequestRef = (email: string) => firestore.collection(PASSWORD_RESET_REQUESTS_COLLECTION).doc(normalizeEmail(email));

const fetchActionCodeEmail = async (oobCode: string): Promise<string> => {
  const fetchImpl = globalThis.fetch as typeof globalThis.fetch;
  const response = await fetchImpl(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oobCode }),
  });

  const data: any = await response.json().catch(() => ({}));

  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || 'Unable to verify the reset link.');
  }

  if (!data?.email || typeof data.email !== 'string') {
    throw new Error('Unable to determine the email address for this reset link.');
  }

  return normalizeEmail(data.email);
};

// Scheduled function: sync Auth users -> Firestore users collection
// Automatically marks all users as verified - email verification not required for app access.
export const syncEmailVerification = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context: any) => {
    try {
      let nextPageToken: string | undefined = undefined;

      do {
        const listUsersResult: any = await admin.auth().listUsers(1000, nextPageToken);

        const updates: Promise<any>[] = [];

        for (const userRecord of listUsersResult.users) {
          const uid = userRecord.uid;

          const userRef = firestore.collection('users').doc(uid);

          try {
            const userSnap = await userRef.get();
            // Always mark users as verified for app access (no email verification requirement)
            if (userSnap.exists) {
              const data = userSnap.data() || {};
              const currentlyVerified = !!data.isVerified;

              if (!currentlyVerified) {
                updates.push(userRef.update({
                  isVerified: true,
                  verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                  authProvider: (userRecord.providerData && userRecord.providerData[0]?.providerId) || 'password',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }));
              }
            } else {
              // Create minimal user doc for users missing in Firestore
              updates.push(userRef.set({
                email: userRecord.email || null,
                isVerified: true,
                authProvider: (userRecord.providerData && userRecord.providerData[0]?.providerId) || 'password',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true }));
            }
          } catch (err) {
            console.error('Error processing user', uid, err);
          }
        }

        if (updates.length) {
          await Promise.all(updates);
        }

        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);
    } catch (err) {
      console.error('Email verification sync failed:', err);
    }

    return null;
  });

export const recordPasswordResetRequest = functions.https.onRequest(async (req: any, res: any) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const body = readJsonBody(req);
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';

    if (!email) {
      res.status(400).json({ ok: false, message: 'Email address is required.' });
      return;
    }

    await getResetRequestRef(email).set(
      {
        email,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        usedAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Failed to record password reset request:', error);
    res.status(500).json({ ok: false, message: error?.message || 'Unable to record reset request.' });
  }
});

export const validatePasswordResetRequest = functions.https.onRequest(async (req: any, res: any) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const body = readJsonBody(req);
    const oobCode = typeof body.oobCode === 'string' ? body.oobCode.trim() : '';

    if (!oobCode) {
      res.status(400).json({ ok: false, message: 'Reset code is required.' });
      return;
    }

    const email = await fetchActionCodeEmail(oobCode);
    const snapshot = await getResetRequestRef(email).get();

    if (!snapshot.exists) {
      res.status(403).json({ ok: false, message: 'This reset link expired after 5 minutes. Please request a new password reset email.' });
      return;
    }

    const data = snapshot.data() || {};
    const requestedAt = data.requestedAt;
    const usedAt = data.usedAt;

    if (!requestedAt || typeof requestedAt.toMillis !== 'function') {
      res.status(403).json({ ok: false, message: 'This reset link expired after 5 minutes. Please request a new password reset email.' });
      return;
    }

    const requestedAtMs = requestedAt.toMillis();
    const nowMs = Date.now();

    if (nowMs - requestedAtMs > PASSWORD_RESET_WINDOW_MS) {
      res.status(403).json({ ok: false, message: 'This reset link expired after 5 minutes. Please request a new password reset email.' });
      return;
    }

    if (usedAt && typeof usedAt.toMillis === 'function' && usedAt.toMillis() >= requestedAtMs) {
      res.status(403).json({ ok: false, message: 'This reset link has already been used. Please request a new password reset email.' });
      return;
    }

    res.status(200).json({ ok: true, email });
  } catch (error: any) {
    console.error('Password reset validation failed:', error);
    res.status(400).json({ ok: false, message: error?.message || 'Unable to verify the reset link.' });
  }
});

export const consumePasswordResetRequest = functions.https.onRequest(async (req: any, res: any) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const body = readJsonBody(req);
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';

    if (!email) {
      res.status(400).json({ ok: false, message: 'Email address is required.' });
      return;
    }

    await getResetRequestRef(email).set(
      {
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Failed to consume password reset request:', error);
    res.status(500).json({ ok: false, message: error?.message || 'Unable to consume reset request.' });
  }
});
