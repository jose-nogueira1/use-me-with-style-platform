export function normalizeLocalizedProductName(value: string): string {
  return value.replace(/\bFreash\b/g, 'Fresh');
}
