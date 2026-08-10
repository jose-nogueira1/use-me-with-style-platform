/** Prevents CMS-authored text containing "</script>" from terminating a
 * JSON-LD element and becoming executable markup. JSON remains valid because
 * \u003c is the escaped form of the less-than character inside JSON strings. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
