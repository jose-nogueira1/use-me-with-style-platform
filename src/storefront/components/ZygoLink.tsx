// Angola deliveries are done by Zygo; wherever the storefront names the courier it
// links to their site (opens in a new tab; inside a clickable row it must not
// also select the row).
export const ZYGO_URL = 'https://www.zygo.ao/';

export function ZygoLink() {
  return (
    <a
      href={ZYGO_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      Zygo
    </a>
  );
}
