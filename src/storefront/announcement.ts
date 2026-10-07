import type { AnnouncementItem } from '../lib/api';

/** The announcement bar's texts for one language, skipping blanks. */
export function announcementTexts(items: AnnouncementItem[], lang: 'pt' | 'en'): string[] {
  return items.map((item) => item[lang]?.trim()).filter((text): text is string => Boolean(text));
}

/** How many times one set of messages is repeated inside a single scrolling
 * group so the group is always wider than the widest screen (about three
 * thousand pixels at ~380px per message), which keeps the loop seamless. */
export function announcementRepeat(textCount: number): number {
  return Math.max(2, Math.ceil(8 / Math.max(1, textCount)));
}

/** Scroll duration in seconds: a steady reading speed regardless of how long
 * the messages are (about 5 characters per second per repeat). */
export function announcementDuration(texts: string[], repeat: number): number {
  const chars = texts.reduce((sum, text) => sum + text.length, 0) * repeat;
  return Math.max(30, Math.round(chars * 0.2));
}
