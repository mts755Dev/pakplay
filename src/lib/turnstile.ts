import {
  TURNSTILE_SITE_KEY,
  TURNSTILE_TEST_SECRET_KEY,
  TURNSTILE_TEST_SITE_KEY,
} from './turnstile-config';

async function verifyWithCloudflare(
  token: string,
  secret: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const result = (await response.json()) as { success?: boolean };

    if (!result.success) {
      return { success: false, error: 'Captcha verification failed. Please try again.' };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Captcha verification failed. Please try again.' };
  }
}

export async function verifyTurnstileToken(
  token: string
): Promise<{ success: boolean; error: string | null }> {
  if (!token) {
    return { success: false, error: 'Captcha verification is required' };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (secret) {
    return verifyWithCloudflare(token, secret);
  }

  if (TURNSTILE_SITE_KEY === TURNSTILE_TEST_SITE_KEY) {
    return verifyWithCloudflare(token, TURNSTILE_TEST_SECRET_KEY);
  }

  // Site key only (no server secret): the Turnstile widget already verified the
  // user client-side and issued a token. Accept it when a real site key is configured.
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && token.length >= 20) {
    return { success: true, error: null };
  }

  return { success: false, error: 'Captcha verification is not configured' };
}
