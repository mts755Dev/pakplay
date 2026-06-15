'use client';

import {
  createOnboardingLogoUploadUrl,
  createOnboardingPhotoUploadUrl,
  createReviewPhotoUploadUrl,
  createVenueLogoUploadUrl,
  createVenuePhotoUploadUrl,
} from '@/lib/server-actions';

export async function uploadFileToSignedUrl(signedUrl: string, file: File): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}

export async function uploadVenuePhotos(
  userId: string,
  venueId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const urlResult = await createVenuePhotoUploadUrl(
      userId,
      venueId,
      file.name,
      file.type || 'image/jpeg',
      i
    );

    if (urlResult.error || !urlResult.signedUrl || !urlResult.publicUrl) {
      return { urls, error: urlResult.error || 'Failed to prepare photo upload' };
    }

    try {
      await uploadFileToSignedUrl(urlResult.signedUrl, file);
      urls.push(urlResult.publicUrl);
    } catch (error: any) {
      return { urls, error: error.message || 'Failed to upload photo' };
    }
  }

  return { urls, error: null };
}

export async function uploadReviewPhotos(
  venueId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const urlResult = await createReviewPhotoUploadUrl(venueId, file.name, i);

    if (urlResult.error || !urlResult.signedUrl || !urlResult.publicUrl) {
      return { urls, error: urlResult.error || 'Failed to prepare photo upload' };
    }

    try {
      await uploadFileToSignedUrl(urlResult.signedUrl, file);
      urls.push(urlResult.publicUrl);
    } catch (error: any) {
      return { urls, error: error.message || 'Failed to upload photo' };
    }
  }

  return { urls, error: null };
}

export async function uploadOnboardingLogo(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const urlResult = await createOnboardingLogoUploadUrl(userId, file.name);

  if (urlResult.error || !urlResult.signedUrl || !urlResult.publicUrl) {
    return { url: null, error: urlResult.error || 'Failed to prepare logo upload' };
  }

  try {
    await uploadFileToSignedUrl(urlResult.signedUrl, file);
    return { url: urlResult.publicUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to upload logo' };
  }
}

export async function uploadOnboardingPhotos(
  userId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const urlResult = await createOnboardingPhotoUploadUrl(userId, file.name, i);

    if (urlResult.error || !urlResult.signedUrl || !urlResult.publicUrl) {
      return { urls, error: urlResult.error || 'Failed to prepare photo upload' };
    }

    try {
      await uploadFileToSignedUrl(urlResult.signedUrl, file);
      urls.push(urlResult.publicUrl);
    } catch (error: any) {
      return { urls, error: error.message || 'Failed to upload photo' };
    }
  }

  return { urls, error: null };
}

export async function uploadVenueLogo(
  userId: string,
  venueId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const urlResult = await createVenueLogoUploadUrl(
    userId,
    venueId,
    file.name,
    file.type || 'image/png'
  );

  if (urlResult.error || !urlResult.signedUrl || !urlResult.publicUrl) {
    return { url: null, error: urlResult.error || 'Failed to prepare logo upload' };
  }

  try {
    await uploadFileToSignedUrl(urlResult.signedUrl, file);
    return { url: urlResult.publicUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to upload logo' };
  }
}
