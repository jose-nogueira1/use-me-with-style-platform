# AppyPay widget containment QA

- Source visual truth: `/var/folders/kl/ymwt189j7536rpvnlz1bcmz00000gn/T/TemporaryItems/NSIRD_screencaptureui_83QTLJ/Screenshot 2026-07-22 at 21.01.15.png`
- Implementation screenshot: `/Users/josenogueira/Desktop/Projects/Use Me - Raisa/Demo/use-me-with-style-platform/design-qa-implementation.png`
- Focused payment-area screenshot: `/Users/josenogueira/Desktop/Projects/Use Me - Raisa/Demo/use-me-with-style-platform/design-qa-payment-area.png`
- Combined comparison: `/Users/josenogueira/Desktop/Projects/Use Me - Raisa/Demo/use-me-with-style-platform/design-qa-comparison.png`
- Browser viewport: 1280 × 720 CSS px, device scale factor 1
- Source pixels: 2984 × 1650
- Implementation pixels: 1274 × 2230 full-page capture
- State: light theme, Angola checkout, AppyPay test widget loaded, reference payment method selected

## Full-view comparison evidence

The source shows AppyPay's global `body { display: flex; justify-content: center }` and full-height background styles collapsing the storefront and stretching the widget across the page. The revised capture keeps the storefront document at full width (`body` remains `display: block`, root width 1274 px) while the widget stays inside the 406 px checkout column.

## Focused region evidence

The focused payment-area capture confirms that the merchant name, amount, payment-method selector, AppyPay branding, and “Gerar referência” control render clearly inside the checkout column. The shop header and surrounding paper background retain their own typography and colors.

## Required fidelity surfaces

- Fonts and typography: storefront typography remains unchanged; AppyPay retains its hosted typography inside the isolated frame.
- Spacing and layout rhythm: checkout width and alignment remain stable; the widget is contained to the payment card width.
- Colors and visual tokens: the storefront paper/gold palette is no longer overwritten by AppyPay's blue page background.
- Image quality and assets: official merchant, payment-method, and AppyPay image assets render sharply from the hosted widget.
- Copy and content: merchant, amount, instructions, and “Gerar referência” content are present and readable.

## Comparison history

1. P0 — Third-party global styles broke the entire checkout layout.
   - Fix: load the hosted widget in a same-origin iframe so its document-level styles cannot affect the storefront.
   - Post-fix evidence: body remains block-level at full width; AppyPay renders fully inside the checkout payment area.
2. P2 — Checkout produced a React warning by navigating during render when the cart was empty.
   - Fix: replace imperative render-time navigation with the declarative `Navigate` component.

## Findings

No actionable P0, P1, or P2 visual differences remain for the reported widget-layout failure.

## Follow-up polish

The hosted widget's internal visual design is controlled by AppyPay and intentionally remains unchanged.

final result: passed
