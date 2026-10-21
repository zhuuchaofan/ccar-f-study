import { OAuth2Client } from 'google-auth-library';

export type GoogleProfile = { email: string; emailVerified: boolean };
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID || '';

let client: OAuth2Client | undefined;
/** Verifies a Google Identity Services ID token (signature, expiry, audience) and returns the verified email. */
export async function verifyGoogleToken(credential: string): Promise<GoogleProfile | null> {
  const aud = googleClientId();
  if (!aud) return null;
  try {
    client ??= new OAuth2Client(aud);
    const payload = (await client.verifyIdToken({ idToken: credential, audience: aud })).getPayload();
    if (!payload?.email) return null;
    return { email: payload.email, emailVerified: payload.email_verified === true };
  } catch { return null; }
}
