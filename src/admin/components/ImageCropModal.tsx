import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { C } from '../../theme';

type ImageCropModalProps = {
  file: File;
  aspect: number;
  outputWidth: number;
  lang: 'pt' | 'en';
  title?: string;
  description?: string;
  applyLabel?: string;
  outputSuffix?: string;
  onCancel: () => void;
  onApply: (file: File) => void;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to read image'));
    image.src = url;
  });
}

async function cropImage(file: File, crop: Area, outputWidth: number, outputSuffix: string): Promise<File> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const scale = Math.min(1, outputWidth / crop.width);
    const width = Math.max(1, Math.round(crop.width * scale));
    const height = Math.max(1, Math.round(crop.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare image');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Unable to prepare image'))), 'image/webp', 0.92);
    });
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'hero';
    return new File([blob], `${baseName}-${outputSuffix}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function ImageCropModal({
  file,
  aspect,
  outputWidth,
  lang,
  title,
  description,
  applyLabel,
  outputSuffix = 'crop',
  onCancel,
  onApply,
}: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !applying) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [applying, onCancel]);

  const handleComplete = useCallback((_area: Area, pixels: Area) => setCroppedArea(pixels), []);
  const handleApply = async () => {
    if (!croppedArea) return;
    setApplying(true);
    setError(null);
    try {
      onApply(await cropImage(file, croppedArea, outputWidth, outputSuffix));
    } catch {
      setError(lang === 'pt' ? 'Não foi possível preparar este recorte. Tente outra imagem.' : 'This crop could not be prepared. Try another image.');
      setApplying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-crop-title"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(18,16,13,.72)', display: 'grid', placeItems: 'center', padding: 16 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !applying) onCancel();
      }}
    >
      <div style={{ width: 'min(760px, 100%)', background: C.paper, borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.32)' }}>
        <div style={{ padding: '18px 20px 14px' }}>
          <div id="hero-crop-title" style={{ color: C.ink, fontSize: 16, fontWeight: 800 }}>
            {title ?? (lang === 'pt' ? 'Ajustar imagem' : 'Adjust image')}
          </div>
          <div style={{ color: C.inkSoft, fontSize: 11, marginTop: 5 }}>
            {description ?? (lang === 'pt' ? 'Arraste a imagem e use o zoom para escolher exatamente o que ficará visível.' : 'Drag the image and use zoom to choose exactly what will be visible.')}
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: String(aspect), background: '#171717' }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleComplete}
            showGrid
            objectFit="contain"
          />
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          <label style={{ display: 'grid', gridTemplateColumns: '44px 1fr 38px', alignItems: 'center', gap: 10, color: C.inkSoft, fontSize: 10 }}>
            <span>{lang === 'pt' ? 'Zoom' : 'Zoom'}</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            <span style={{ textAlign: 'right' }}>{zoom.toFixed(1)}×</span>
          </label>
          {error && <div style={{ color: '#B95545', fontSize: 11, marginTop: 10 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onCancel} disabled={applying} style={{ padding: '9px 16px', border: `1px solid ${C.rule}`, borderRadius: 6, background: 'transparent', color: C.ink, fontSize: 11, fontWeight: 800 }}>
              {lang === 'pt' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="button" onClick={() => void handleApply()} disabled={applying || !croppedArea} style={{ padding: '9px 18px', border: 0, borderRadius: 6, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800 }}>
              {applying ? '…' : applyLabel ?? (lang === 'pt' ? 'Aplicar recorte' : 'Apply crop')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
