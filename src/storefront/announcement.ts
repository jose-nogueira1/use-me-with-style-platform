import type { AnnouncementItem } from '../lib/api';

/** The announcement bar's texts for one language, skipping blanks. */
export function announcementTexts(items: AnnouncementItem[], lang: 'pt' | 'en'): string[] {
  return items.map((item) => item[lang]?.trim()).filter((text): text is string => Boolean(text));
}

/** One bar message and, for a promoted discount code, the code to show in gold. */
export type AnnouncementEntry = { text: string; code?: string };

export function announcementEntries(items: AnnouncementItem[], lang: 'pt' | 'en'): AnnouncementEntry[] {
  return items
    .map((item) => ({ text: item[lang]?.trim() ?? '', code: item.code?.trim() || undefined }))
    .filter((entry) => entry.text);
}

/** Splits a message around the first occurrence of its code (any letter case) so the
 * code can be highlighted. A message that doesn't contain the code stays whole. */
export function splitAroundCode(text: string, code?: string): Array<{ text: string; code: boolean }> {
  const at = code ? text.toLowerCase().indexOf(code.toLowerCase()) : -1;
  if (!code || at < 0) return [{ text, code: false }];
  return [
    { text: text.slice(0, at), code: false },
    { text: text.slice(at, at + code.length), code: true },
    { text: text.slice(at + code.length), code: false },
  ].filter((part) => part.text);
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
