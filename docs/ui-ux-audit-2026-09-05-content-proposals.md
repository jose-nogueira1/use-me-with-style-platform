# Storefront audit content proposals — 5 September 2026

**Approval update — 6 September 2026:** the business approved findings 3 and 9. The proposed PT/EN Terms payment paragraph and all four AO/PT manual WhatsApp instruction fields were saved to the production CMS and verified after saving. The returns-policy records were intentionally left unchanged. No WhatsApp recipient number was supplied or invented.

Read-only investigation for findings 3, 9, 10, and 17. Production evidence came from GET requests to `/api/globals/market-settings`, `/api/globals/legal-content`, `/api/categories`, `/api/size-guides`, and the supplied product snapshot. No CMS record or production configuration was changed.

## 3. Payment promises

### Confirmed production state

- `market-settings.updatedAt`: `2026-09-02T15:09:39.801Z`.
- `angolaPaymentLive: false`; configured future list: `angolaPaymentMethods: ["multicaixa_express"]`.
- `portugalPaymentsEnabled: false`; configured future list: `portugalPaymentMethods: ["paypal", "stripe"]`.
- Checkout therefore replaces both lists with `manual_whatsapp`, creates a pending order, opens WhatsApp with a prefilled order/payment message, and then routes to confirmation. Payment still requires manual verification.
- No WhatsApp recipient is configured: `manualWhatsappNumber: ""`, `angolaWhatsappNumber: null`, and `portugalWhatsappNumber: null`. The resulting `wa.me` link has no business number. A business-owned number is required before the handoff can reliably reach the team.
- Angola currently promises additional instructions by email (`angolaBankTransferInstructionsPT/EN`). Portugal's equivalent fields are null, which explains the empty status surface. The public settings and storefront source do not establish who contacts the buyer next or whether email is operationally guaranteed.
- The legal Terms payment paragraph incorrectly states that AppyPay is used in Angola and that PayPal/Stripe are available in Portugal. Those claims describe configured future providers, not the enabled checkout.

### Approved legal correction

In `legal-content` global ID `1`, replace only the **“Preços e pagamento / Prices and payment”** paragraph of `termsTextPT` and `termsTextEN`:

**Proposed `termsTextPT` paragraph**

> Preços e pagamento: os preços apresentados incluem os impostos aplicáveis, salvo indicação em contrário. Os métodos de pagamento disponíveis variam consoante o mercado (Angola ou Portugal) e são apresentados no checkout. Enquanto os pagamentos online não estiverem ativos, a encomenda pode ser criada com o pagamento pendente e o site abre o WhatsApp para coordenar os passos seguintes. A encomenda só fica confirmada depois de o pagamento ser verificado. Quando um método de pagamento online estiver ativo, será apresentado no checkout e processado de forma segura pelo respetivo parceiro.

**Proposed `termsTextEN` paragraph**

> Prices and payment: displayed prices include applicable taxes unless otherwise stated. Available payment methods vary by market (Angola or Portugal) and are shown at checkout. While online payments are inactive, an order can be created with payment pending and the site opens WhatsApp to coordinate the next steps. The order is confirmed only after payment is verified. When an online payment method is active, it will be shown at checkout and processed securely by the relevant partner.

Do not name AppyPay, PayPal, Stripe, MB WAY, Unitel Money, cards, or Reference as currently available unless their market enablement is changed and verified separately.

### Exact proposed market-settings copy

Use the same factual handoff copy for these four fields; it avoids the unverified email promise:

| Field | Current | Proposed |
|---|---|---|
| `angolaBankTransferInstructionsPT` | `A nossa equipa enviará por email quaisquer instruções adicionais necessárias após a confirmação da encomenda.` | `Ao finalizar, a encomenda é criada com o pagamento pendente e o WhatsApp abre com os dados da encomenda. Envie a mensagem para coordenar os passos seguintes. A encomenda só fica confirmada depois de o pagamento ser verificado.` |
| `angolaBankTransferInstructionsEN` | `Our team will email any additional instructions required after the order is confirmed.` | `When you finish, the order is created with payment pending and WhatsApp opens with the order details. Send the message to coordinate the next steps. The order is confirmed only after payment is verified.` |
| `portugalManualCheckoutInstructionsPT` | `null` | Same proposed Portuguese copy above. |
| `portugalManualCheckoutInstructionsEN` | `null` | Same proposed English copy above. |

The business must also supply the exact WhatsApp number for `angolaWhatsappNumber` and `portugalWhatsappNumber` (or one verified `manualWhatsappNumber`). Do not invent a number.

## 9. Returns messaging

The market-specific policy fields are internally coherent and appear to be the approved source. **Do not rewrite them.** Angola permits conditional exchanges requested within 14 days, generally excludes refunds for size/colour/preference/cancellation, and preserves legally recognised rights. Portugal permits notice of return within 14 consecutive days and a refund after receipt and inspection.

The footer teaser is code-owned and should describe the active market without weakening the detailed policy:

| Market | Portuguese | English |
|---|---|---|
| Angola | `Trocas: pedido em até 14 dias` | `Exchanges: request within 14 days` |
| Portugal | `Devoluções: comunicar em 14 dias` | `Returns: notify us within 14 days` |

Keep the link to `/ajuda#devolucoes`. The full policy remains authoritative for condition, inspection, costs, exceptions, stock availability, refund handling, and legal rights.

## 10. Product classification and size guides

Production photography was inspected directly rather than inferred from names. Active Court is a one-piece sports dress with a pleated skirt and integrated shorts. Aura is a coordinated three-piece outfit (top, wrap layer, and trousers). Fresh Fit is a two-piece sports-bra-and-shorts set. Muse is a two-piece top-and-flare-trouser set.

| Product | Current category | Proposed category | Current size guide | Proposed size guide |
|---|---|---|---|---|
| ID `31`, `vestido-active-court` | ID `4`, `conjuntos` / Sets | ID `1`, `vestidos` / Dresses | ID `4`, `Conjuntos — padrão` | Do **not** silently assign ID `1`. Its listed lengths are 100–104 cm, while the photographed garment and product copy explicitly describe a short style. Retain ID `4` temporarily or create a garment-specific guide after the business supplies measured garment lengths. |
| ID `25`, `conjunto-aura` | ID `1`, `vestidos` / Dresses | ID `4`, `conjuntos` / Sets | ID `4`, `Conjuntos — padrão` | Keep ID `4`. |
| ID `27`, `conjunto-fresh-fit` | ID `4`, `conjuntos` / Sets | Keep ID `4`. | ID `4`, `Conjuntos — padrão` | Keep ID `4`. |
| ID `23`, `conjunto-pantalona-muse` | ID `4`, `conjuntos` / Sets | Keep ID `4`. | ID `4`, `Conjuntos — padrão` | Keep ID `4`. |

Category ID `1` is `vestidos` (`Vestidos` / `Dresses`); category ID `4` is `conjuntos` (`Conjuntos` / `Sets`). The category swaps for IDs 31 and 25 are visually verified. Active Court's final size-guide assignment remains a measurement dependency.

## 17. Product typo and media alt records

### Product name typo

Product ID `27`, field `nameEN`: `Freash Fit Set` → `Fresh Fit Set`.

### Exact media-alt corrections

The current CMS has one unlocalized `alt` field, while product name and colour are bilingual. The storefront should continue generating a localized alt from structured product/colour fields when the authored value is a blob URL, contains a category in the wrong language, or conflicts with the product's corrected category. The following PT-authoritative CMS values remove the technical URL and false taxonomy immediately:

| Media IDs | Current problem | Proposed `alt` |
|---|---|---|
| `41` (Muse, castanho) | Blob URL | `Conjunto Pantalona Muse em castanho` |
| `70`, `71` (Active Court, amarelo-manteiga) | Says `Conjuntos` | `Vestido Active Court em amarelo-manteiga` |
| `81`, `82`, `83` (Active Court, vermelho) | Says `Sets` | `Vestido Active Court em vermelho` |
| `49`, `52`, `54` (Aura, rosa) | Says `Vestidos` | `Conjunto Aura em rosa` |
| `50`, `51`, `53` (Aura, lavanda) | Says `Vestidos` | `Conjunto Aura em lavanda` |
| `58`, `59` (Fresh Fit, azul-bebé) | Embeds category text; cannot localize cleanly | `Conjunto Fresh Fit em azul-bebé` |
| `75`, `76` (Fresh Fit, branco) | Says `Sets` in Portuguese UI | `Conjunto Fresh Fit em branco` |
| `77`, `78`, `79` (Fresh Fit, amarelo-manteiga) | Says `Sets` in Portuguese UI | `Conjunto Fresh Fit em amarelo-manteiga` |

The photos inspected for these proposals show the stated garments and colours. The alt proposals intentionally omit camera-angle guesses. For full bilingual CMS authorship, the media schema would need separate `altPT` and `altEN` fields; until then, localized storefront generation is the reliable presentation layer.

## Remaining dependencies

1. Verified WhatsApp destination number(s) and ownership decision: one shared number or separate Angola/Portugal numbers.
2. Actual Active Court garment measurements before assigning a dress size guide or publishing a new one.

All other corrections above are supported by production configuration, record relationships, localized descriptions, and direct inspection of the product photography.
