import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from './admin-app.ts';

const email = (process.argv[2] || 'joachimgrobbelaar@gmail.com').trim().toLowerCase();

initAdmin();

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
await getFirestore().collection('roles').doc(user.uid).set({
  admin: true,
  email: user.email || email,
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`Admin access granted to ${email}.`);
console.log(`Auth uid: ${user.uid}`);
console.log('Firestore document roles/' + user.uid + ' is { admin: true }.');
console.log('Sign out and back in once so the custom claim is attached to the ID token.');
console.log('The roles document is enough for the shop desk and security rules even before that.');
