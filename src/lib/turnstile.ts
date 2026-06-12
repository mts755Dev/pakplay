export async function verifyTurnstileToken(
  token: string
): Promise<{ success: boolean; error: string | null }> {
  if (!token) {
    return { success: false, error: 'Captcha verification is required' };
  }

  const secret =
    process.env.TURNSTILE_SECRET_KEY ||
    (process.env.NODE_ENV === 'development'
      ? '1x0000000000000000000000000000000AA'
      : undefined);

  if (!secret) {
    return { success: false, error: 'Captcha verification is not configured' };
  }

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
