// Payments in Angola are processed by AppyPay; wherever the storefront names the
// processor it links to their site (opens in a new tab).
export const APPYPAY_URL = 'https://www.appypay.co.ao/';

export function AppyPayLink() {
  return (
    <a href={APPYPAY_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
      AppyPay
    </a>
  );
}
