import assert from 'node:assert/strict';
import test from 'node:test';

import { formatKz } from '../src/theme/i18n.ts';

// Bug found via screen recording, 2026-08-07: the cart and checkout VAT
// breakdown ("IVA (14%) incluído: ...") passes formatKz a genuine float
// (vatIncludedAmount's total - net), and formatKz previously called
// toLocaleString with no options -- which defaults to up to 3 fraction
// digits -- producing "2026,316 Kz" instead of a whole-number amount,
// inconsistent with every other Kz figure on the same page (all of which
// happen to be integers already, so the same latent bug never showed up
// there).
test('formatKz rounds to a whole number regardless of fractional input', () => {
  // No decimal comma/point survives -- Node's pt-PT ICU data doesn't group
  // a bare 4-digit number, so '2026' (not '2 026') is the correct assertion
  // here; en-US's grouping is unambiguous regardless of ICU data version.
  assert.equal(formatKz(2026.315789, 'pt'), '2026');
  assert.equal(formatKz(2026.315789, 'en'), '2,026');
});

test('formatKz still groups thousands for plain integer amounts', () => {
  // pt-PT groups with a non-breaking space (U+00A0), not a plain space.
  assert.equal(formatKz(16_500, 'pt'), '16 500');
  assert.equal(formatKz(16_500, 'en'), '16,500');
});
