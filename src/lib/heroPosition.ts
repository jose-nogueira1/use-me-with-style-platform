import type { HomeHero } from './api';

export function heroPosition(hero: Partial<HomeHero> | null | undefined, layout: 'desktop' | 'mobile'): string {
  const percentage = (value: number | null | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
  const x = layout === 'desktop' ? percentage(hero?.heroDesktopPositionX, 65) : percentage(hero?.heroMobilePositionX, 50);
  const y = layout === 'desktop' ? percentage(hero?.heroDesktopPositionY, 20) : percentage(hero?.heroMobilePositionY, 50);
  return `${x}% ${y}%`;
}
