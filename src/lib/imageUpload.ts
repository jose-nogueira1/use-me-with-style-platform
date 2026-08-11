export type ImageUploadPurpose = 'hero' | 'catalogue' | 'brand';

export const IMAGE_UPLOAD_POLICIES: Record<ImageUploadPurpose, { maxBytes: number; maxWidth: number }> = {
  hero: { maxBytes: 3 * 1024 * 1024, maxWidth: 2560 },
  catalogue: { maxBytes: 2 * 1024 * 1024, maxWidth: 2000 },
  brand: { maxBytes: 500 * 1024, maxWidth: 1024 },
};

export function imageUploadGuidance(purpose: ImageUploadPurpose, lang: 'pt' | 'en'): string {
  const policy = IMAGE_UPLOAD_POLICIES[purpose];
  const size = policy.maxBytes < 1024 * 1024 ? '500 KB' : `${policy.maxBytes / (1024 * 1024)} MB`;
  return lang === 'pt'
    ? `JPG, PNG ou WebP — máximo ${size} e ${policy.maxWidth}px de largura. A imagem será otimizada automaticamente.`
    : `JPG, PNG or WebP — maximum ${size} and ${policy.maxWidth}px wide. The image will be optimized automatically.`;
}

export function validateImageUploadDimensions(
  file: Pick<File, 'size' | 'type'>,
  width: number,
  purpose: ImageUploadPurpose,
  lang: 'pt' | 'en',
): void {
  const policy = IMAGE_UPLOAD_POLICIES[purpose];
  if (!file.type.startsWith('image/')) {
    throw new Error(lang === 'pt' ? 'Escolha um ficheiro de imagem válido.' : 'Choose a valid image file.');
  }
  if (file.size > policy.maxBytes) {
    const size = policy.maxBytes < 1024 * 1024 ? '500 KB' : `${policy.maxBytes / (1024 * 1024)} MB`;
    throw new Error(lang === 'pt' ? `A imagem é demasiado grande. O limite é ${size}.` : `This image is too large. The limit is ${size}.`);
  }
  if (width > policy.maxWidth) {
    throw new Error(
      lang === 'pt'
        ? `A imagem tem ${width}px de largura. O máximo é ${policy.maxWidth}px.`
        : `This image is ${width}px wide. The maximum is ${policy.maxWidth}px.`,
    );
  }
}

async function imageWidth(file: File): Promise<number> {
  const bitmap = await createImageBitmap(file);
  try {
    return bitmap.width;
  } finally {
    bitmap.close();
  }
}

export async function validateImageUpload(file: File, purpose: ImageUploadPurpose, lang: 'pt' | 'en'): Promise<void> {
  // Reject filesize/type before decoding so a 13 MB file never consumes the
  // browser's image decoder just to discover it is invalid.
  validateImageUploadDimensions(file, 0, purpose, lang);
  let width: number;
  try {
    width = await imageWidth(file);
  } catch {
    throw new Error(lang === 'pt' ? 'Não foi possível ler esta imagem. Tente outro ficheiro.' : 'This image could not be read. Try another file.');
  }
  validateImageUploadDimensions(file, width, purpose, lang);
}
