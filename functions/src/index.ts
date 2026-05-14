// `firebase-functions` types are only needed when deploying; ignore in the app's typecheck environment
// @ts-ignore
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK (uses default service account when deployed)
admin.initializeApp();
const firestore = admin.firestore();

// Scheduled function: sync Auth users -> Firestore users collection
// Automatically marks all users as verified - email verification not required for app access.
export const syncEmailVerification = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context: any) => {
    try {
      let nextPageToken: string | undefined = undefined;

      do {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

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
