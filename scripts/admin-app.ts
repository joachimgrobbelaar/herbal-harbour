import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'gemini-dream-477009';

export function initAdmin() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw.trim().startsWith('{')) {
    const credentials = JSON.parse(raw) as { project_id?: string; client_email: string; private_key: string };
    initializeApp({
      credential: cert(credentials),
      projectId: credentials.project_id || PROJECT_ID,
    });
    return;
  }
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}
