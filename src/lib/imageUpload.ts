import imageCompression, { type Options as ImageCompressionOptions } from 'browser-image-compression';

export type ImageUploadPurpose = 'hero' | 'catalogue' | 'brand';

export type PreparedImageUpload = {
  file: File;
  optimized: boolean;
  originalBytes: number;
  finalBytes: number;
  originalWidth: number;
  finalWidth: number;
};

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

export function imageOptimizationSummary(result: PreparedImageUpload, lang: 'pt' | 'en'): string | null {
  if (!result.optimized) return null;
  const before = formatBytes(result.originalBytes);
  const after = formatBytes(result.finalBytes);
  return lang === 'pt'
    ? `Imagem otimizada automaticamente: ${before} / ${result.originalWidth}px → ${after} / ${result.finalWidth}px.`
    : `Image optimized automatically: ${before} / ${result.originalWidth}px → ${after} / ${result.finalWidth}px.`;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
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

type PrepareOptions = {
  enabled?: boolean;
  compress?: (file: File, options: ImageCompressionOptions) => Promise<File>;
  readWidth?: (file: File) => Promise<number>;
};

function configuredOptimizationEnabled(): boolean {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_ADMIN_IMAGE_OPTIMIZATION_ENABLED !== 'false';
}

export async function prepareImageUpload(
  file: File,
  purpose: ImageUploadPurpose,
  lang: 'pt' | 'en',
  options: PrepareOptions = {},
): Promise<PreparedImageUpload> {
  if (!file.type.startsWith('image/')) {
    throw new Error(lang === 'pt' ? 'Escolha um ficheiro de imagem válido.' : 'Choose a valid image file.');
  }

  const readWidth = options.readWidth ?? imageWidth;
  let originalWidth: number;
  try {
    originalWidth = await readWidth(file);
  } catch {
    throw new Error(lang === 'pt' ? 'Não foi possível ler esta imagem. Tente outro ficheiro.' : 'This image could not be read. Try another file.');
  }

  const policy = IMAGE_UPLOAD_POLICIES[purpose];
  const needsOptimization = file.size > policy.maxBytes || originalWidth > policy.maxWidth;
  const enabled = options.enabled ?? configuredOptimizationEnabled();

  if (!enabled || !needsOptimization) {
    validateImageUploadDimensions(file, originalWidth, purpose, lang);
    return {
      file,
      optimized: false,
      originalBytes: file.size,
      finalBytes: file.size,
      originalWidth,
      finalWidth: originalWidth,
    };
  }

  let optimizedFile: File;
  try {
    const compress = options.compress ?? imageCompression;
    optimizedFile = await compress(file, {
      // Aim below the hard server ceiling so small encoder differences do
      // not turn a successful browser operation into a rejected upload.
      maxSizeMB: (policy.maxBytes * 0.9) / (1024 * 1024),
      maxWidthOrHeight: policy.maxWidth,
      useWebWorker: true,
      maxIteration: 12,
      initialQuality: 0.9,
      fileType: 'image/webp',
      preserveExif: false,
    });
    if (optimizedFile.type === 'image/webp' && !/\.webp$/i.test(optimizedFile.name)) {
      optimizedFile = new File(
        [optimizedFile],
        optimizedFile.name.replace(/\.[^.]+$/, '') + '.webp',
        { type: optimizedFile.type, lastModified: optimizedFile.lastModified },
      );
    }
  } catch {
    throw new Error(
      lang === 'pt'
        ? 'Não foi possível otimizar esta imagem. Tente outro ficheiro ou comprima-a manualmente.'
        : 'This image could not be optimized. Try another file or compress it manually.',
    );
  }

  let finalWidth: number;
  try {
    finalWidth = await readWidth(optimizedFile);
  } catch {
    throw new Error(lang === 'pt' ? 'Não foi possível validar a imagem otimizada.' : 'The optimized image could not be validated.');
  }
  validateImageUploadDimensions(optimizedFile, finalWidth, purpose, lang);

  return {
    file: optimizedFile,
    optimized: true,
    originalBytes: file.size,
    finalBytes: optimizedFile.size,
    originalWidth,
    finalWidth,
  };
}
