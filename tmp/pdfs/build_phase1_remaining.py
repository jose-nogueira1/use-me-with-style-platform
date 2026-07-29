from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / 'output/pdf/Use_Me_With_Style_Phase_1_Remaining_Delivery_Report.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

gold = colors.HexColor('#B89A45'); ink = colors.HexColor('#171717'); muted = colors.HexColor('#666666')
red = colors.HexColor('#B6463D'); amber = colors.HexColor('#C17A21'); green = colors.HexColor('#39765B'); pale = colors.HexColor('#F5F1E6')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleBrand', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=ink, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name='Subtitle', parent=styles['Normal'], fontSize=11, leading=16, textColor=muted, alignment=TA_CENTER, spaceAfter=20))
styles.add(ParagraphStyle(name='H1Brand', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=17, leading=21, textColor=ink, spaceBefore=12, spaceAfter=8))
styles.add(ParagraphStyle(name='H2Brand', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=gold, spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name='BodyBrand', parent=styles['BodyText'], fontSize=9.2, leading=13.4, textColor=ink, spaceAfter=5))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontSize=7.8, leading=10.5, textColor=muted))
styles.add(ParagraphStyle(name='Callout', parent=styles['BodyText'], fontSize=10, leading=14, textColor=ink, backColor=pale, borderColor=gold, borderWidth=0.8, borderPadding=9, spaceBefore=8, spaceAfter=12))
styles.add(ParagraphStyle(name='BulletBrand', parent=styles['BodyText'], fontSize=9, leading=13, leftIndent=13, firstLineIndent=0, bulletIndent=3, spaceBefore=1.5, spaceAfter=3))

def p(text, style='BodyBrand'): return Paragraph(text, styles[style])
def bullets(items): return [Paragraph(x, styles['BulletBrand'], bulletText='•') for x in items]
def section(title, status, owner, goal, items, acceptance=None):
    badge_color = red if status == 'BLOCKER' else amber if status == 'REQUIRED' else green
    data = [[p(title, 'H1Brand'), Paragraph(f'<b>{status}</b>', ParagraphStyle('badge', parent=styles['Small'], textColor=colors.white, backColor=badge_color, alignment=TA_CENTER, borderPadding=5))]]
    table = Table(data, colWidths=[157*mm, 25*mm], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    story = [table, p(f'<b>Primary owner:</b> {owner}'), p(goal)] + bullets(items)
    if acceptance:
        story += [p('<b>Completion gate</b>', 'H2Brand')] + bullets(acceptance)
    story.append(Spacer(1, 5))
    return story

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(gold); canvas.setLineWidth(0.5)
    canvas.line(18*mm, A4[1]-14*mm, A4[0]-18*mm, A4[1]-14*mm)
    canvas.setFont('Helvetica', 7.5); canvas.setFillColor(muted)
    canvas.drawString(18*mm, 9*mm, 'USE ME WITH STYLE  |  PHASE 1 DELIVERY READINESS')
    canvas.drawRightString(A4[0]-18*mm, 9*mm, f'29 July 2026  |  Page {doc.page}')
    canvas.restoreState()

story = [Spacer(1, 18*mm), p('USE ME WITH STYLE', 'Subtitle'), p('Phase 1 Remaining Delivery Report', 'TitleBrand'),
         p('Production readiness, client inputs, live integrations, operational handover, and acceptance', 'Subtitle'), Spacer(1, 8*mm),
         p('<b>Current assessment - 2 of 13 delivery workstreams complete</b><br/>The CMS production deployment and durable production media storage are restored, configured, and verified. Phase 1 is not ready for final client delivery because the public custom domain has not been purchased, the final catalogue is unavailable, and live payment, messaging, email, legal, operational, production-QA, and client-acceptance work remains.', 'Callout')]

summary = [
    ['Priority', 'Workstream', 'Current state'],
    ['DONE', 'CMS production release', 'Restored, deployed, and production-smoke tested'],
    ['DONE', 'Durable media storage', 'Client-owned R2 verified across CMS restart and deletion'],
    ['P0', 'Domains and DNS', 'Engineering ready; awaiting domain purchase and DNS access'],
    ['P0', 'Catalogue and media', 'Production has one test product; final assets absent'],
    ['P0', 'Payments', 'Live credentials and controlled production transactions outstanding'],
    ['P1', 'Legal, shipping, invoicing', 'Core copy approved/published; Portuguese legal details remain'],
    ['P1', 'Admin and full production QA', 'Authenticated production pass not run'],
    ['P1', 'Operations and handover', 'Monitoring, runbooks, training and sign-off outstanding'],
]
t = Table([[p(str(c), 'Small') for c in row] for row in summary], colWidths=[20*mm, 59*mm, 103*mm], repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('TEXTCOLOR',(0,0),(-1,0),colors.white),('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#D9D4C8')),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,pale]),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
story += [p('Executive priority map', 'H1Brand'), t, PageBreak()]

sections = [
('1. CMS production deployment restored','COMPLETE','Engineering / Railway owner','Completed 28 July 2026. Railway clean installs had failed because the dependency lockfile omitted new Payload transitive peer packages. The lockfile was corrected and the release was successfully redeployed.',[
'Fix commit bce6f74 restores clean npm ci installs; deployment trigger commit 301d72a is on main.','Railway deployment 1823f183 is Active and marked Deployment successful.','GitHub deployment status is Success; CMS and PostgreSQL are online.','Production products, categories, colours, merch tags, size guides, settings, admin, and coupon validation endpoints returned HTTP 200.','Local verification passed: 17/17 commerce tests, 3/3 PostgreSQL migration tests, ESLint, production build, and type-check.'],['No further action for this workstream. Recheck deployment health during final launch QA.']),
('2. Restore production domains and market routing','BLOCKER','Client/domain owner plus engineering','Engineering preparation is complete and verified locally. The only current blocker is purchase/ownership of the final domain; no DNS or platform attachment can occur before that.',[
'Completed: codified and tested authoritative AO/PT hostname routing, apex/www market URL generation, deep-link preservation, and preview-host isolation.','Completed: added an executable DNS/HTTPS readiness checker and a provider-specific cutover, validation, and rollback runbook.','After purchase: add apex, www, ao, and pt to Vercel and cms to Railway, then publish the exact DNS records shown by those platforms.','After certificates issue: set final Vercel/Railway environment values and CMS CORS origins, redeploy, then verify geo-routing, cookies, canonical metadata, Admin/API access, and checkout return URLs.','Staging custom subdomains remain optional; the stable Vercel URL can continue to serve pre-domain QA.'],['Domain ownership is confirmed and all intended hosts resolve globally over HTTPS.','AO/PT geo-routing, deep-link switching, Admin/API access, and payment redirects pass on final domains.']),
('3. Replace test catalogue with final client catalogue','BLOCKER','Raisa / catalogue owner','Production currently exposes only <b>Vestido Teste</b>. Final products and imagery are required before client delivery.',[
'Approve the final product and SKU list.','Enter PT/EN names, descriptions, AO/PT prices, optional sales, sizes, size guides, colours, stock, categories, and merchandising tags.','Supply and upload final product, category, and home-page imagery.','Choose featured products and catalogue ordering.','Review every active product on mobile and desktop.'],['No test-named product remains active.','Every sellable variant has approved content, price, media, and stock.']),
('4. Configure durable production media storage','COMPLETE','Client plus engineering','Completed 28 July 2026. Client-owned Cloudflare R2 now stores Payload media and generated invoice files independently of Railway application containers.',[
'Configured the production R2 bucket and a bucket-scoped Object Read & Write account credential in Railway.','Railway deployment e4c89306 became Active and successful with the storage adapter enabled.','Uploaded controlled media through production Payload Admin; CMS retrieval returned HTTP 200 and an exact SHA-256 match.','Restarted the Railway CMS container; the same object remained available with the identical SHA-256.','Deleted the controlled record; the CMS record/file returned HTTP 404 and Cloudflare confirmed the R2 object was removed.','The initially exposed setup credential was revoked and replaced before production use. Linear evidence: JOS-153.'],['No further launch blocker for durable storage. Configure retention/versioning policy during the operations and handover workstream.']),
('5. Approve legal, policy, and business content','BLOCKER','Client, Raisa, and qualified legal reviewer','Partially completed 28 July 2026. The client approved the core policies and business rules, and the bilingual Privacy Policy and Terms are now published in production. Portuguese launch-specific identity and complaint details still block final approval.',[
'Completed: published PT/EN Privacy Policy and Terms with the Angolan legal entity, NIF, registered address, and support WhatsApp.','Completed: approved and published separate Angola and Portugal/EU returns policies, business hours, and AO/PT/international delivery text.','Completed: corrected the Terms by removing the discontinued EU Online Dispute Resolution platform reference.','Completed: replaced the old storefront WhatsApp link with the approved support number (+244 933 617 878) in the Help page and footer.','Pending from Raisa: Portuguese/EU selling-entity legal name, tax number, registered address, competent consumer ADR entity, and Electronic Complaints Book registration/link.','Pending domain purchase: create one monitored domain email for customer support, formal complaints, and data-protection requests, then publish it in both policies.','Pending: qualified legal review of the final market-specific wording before Portugal sales begin.'],['Portuguese entity and complaints details are published in PT/EN.','Site-wide support contacts use the approved number and shared domain-based support/complaints/data-protection email.','Qualified legal reviewer/client final approval is recorded and both footer routes pass production QA.']),
('6. Finalize live payment methods','BLOCKER','Client merchant-account owners plus engineering','The commercial payment paths are now approved and reflected in production settings, but live credentials, AppyPay activation, and real transaction proof remain.',[
'Approved configuration: Angola uses the AppyPay widget; Portugal uses PayPal and Stripe. MB WAY is no longer a Phase 1 payment method.','AppyPay: configure server credentials, webhook Basic Auth, production API/widget values, and fiscal series; verify Multicaixa Express, Reference, Unitel Money, and Visa/Mastercard availability before enabling angolaPaymentLive.','Stripe: configure live secret/webhook keys and final redirect URLs; test success, failure, cancellation, webhook retry, and refund.','PayPal: configure client ID/secret and live frontend ID; test create, capture, cancel, and duplicate callback.','Ensure all merchant accounts belong to the applicable client legal entity.'],['One controlled successful and failed/cancelled flow per launch method.','Orders, inventory, invoices, emails, and payment statuses reconcile.']),
('7. Reconcile delivery and fulfilment rules','REQUIRED','Client operations plus engineering','Portugal and Angola Phase 1 delivery models are implemented; final Angola courier prices and the handling of parcels over 2 kg still require operational confirmation.',[
'Completed: Portugal offers CTT Standard without tracking for EUR 4.90 and CTT Registered with tracking for EUR 6.90.','Completed: Portugal delivery becomes free at EUR 75 or more after discounts.','Completed: PT postcodes are classified server-side as mainland, Madeira, or Azores; Portugal is locked as the delivery country.','Completed: staff can enter a manual CTT tracking code on a Portugal order; verified customers see the code and official CTT tracking link in order lookup.','Completed: Angola is restricted to local-courier delivery across the 16 Luanda municipalities, with no online tracking.','Completed: each Luanda municipality has an editable Kz delivery price in admin; clearly identified placeholder prices are currently seeded.','Completed: Angola delivery becomes free at Kz 80,000 or more after discounts, with authoritative CMS enforcement.','Pending: replace the 16 placeholder Angola prices with the courier-approved prices before launch.','Pending: catalogue weights and an operational/checkout rule for Portugal orders over the 2 kg CTT product limit.','Pending: decide whether automatic CTT labels/status synchronization is needed after the manual Phase 1 tracking workflow.'],['Portugal and Angola rules pass authoritative pricing and checkout tests.','The 16 final Angola municipality prices and the over-2 kg Portugal exception are documented and implemented.','Operations confirms both manual courier workflows and the manual CTT acceptance/tracking procedure.']),
('8. Configure transactional email','REQUIRED','Client/domain owner plus engineering','Order emails safely no-op without Resend, so delivery must be activated and tested.',[
'Verify the sending domain and configure Resend API key, from name/address, and monitored reply inbox.','Test PT/EN order confirmation and any payment/status email paths.','Verify SPF/DKIM/DMARC alignment, spam placement, and failure logging.'],['Controlled production orders receive correct emails.']),
('9. Activate Phase 1 WhatsApp and Instagram messaging','REQUIRED','Client Meta Business admin plus engineering','The rules, escalation model, webhook, and admin log exist; live Meta credentials are still required.',[
'Issue credentials from the client-owned Meta Business account.','Configure WhatsApp number, Instagram page, webhook verify token, and callback subscriptions.','Test inbound/outbound messages, FAQ automation, order status lookup, and manual replies.','Confirm returns, complaints, refunds, and cancellations always escalate to a human.','Document token renewal and conversation ownership.'],['Live end-to-end messages work on both channels.','Sensitive cases remain open for human review.']),
('10. Complete analytics and consent verification','REQUIRED','Marketing/privacy owner plus engineering','Meta browser and server event plumbing requires final credentials and consent validation.',[
'Confirm Pixel ID and configure the Conversions API access token.','Test browser/server events and event-ID deduplication.','Verify AO Kz and EUR-settlement values and currencies.','Confirm consent rejection suppresses optional tracking.','Remove Meta test-event code before launch and align the Privacy Policy.'],['Events appear correctly in production diagnostics without duplicate purchases.']),
('11. Finalize internal invoicing','REQUIRED','Client accountant plus engineering','Phase 1 PDFs are deliberately non-fiscal and require issuer/tax configuration and accountant approval.',[
'Enter legal issuer name, address, tax IDs, numbering prefixes, VAT rules, bank details, and disclaimers.','Test AO and PT invoices with shipping, sales, coupons, and tax.','Confirm historical invoices remain immutable.','Decide whether certified Portugal invoicing is a Phase 1 contractual requirement or later adapter work.'],['Accountant approves the generated documents and operational process.']),
('12. Run authenticated production admin and live E2E QA','BLOCKER','QA plus client admin','The authenticated 54-case admin matrix passed locally, but production credentials were not available.',[
'Create a dedicated QA/admin account and verify login/logout and access controls.','Exercise controlled product, media, coupon, order-status, customer, settings, and invoice flows; remove test data afterward.','Run AO AppyPay, PT Stripe, PT PayPal, and decided MB WAY flows.','Test coupons, sales, last-item concurrency, last-redemption concurrency, webhook retries, cancellations, inventory release, order lookup, invoices, and notifications.'],['No critical/high defects remain.','Evidence is attached to the QA ticket and final domains are used.']),
('13. Establish operations, ownership, handover, and acceptance','BLOCKER','José / Raisa / operations owners','A production system is not delivered until the client owns its accounts, can operate it, and has accepted the launch.',[
'Transfer or recreate GitHub, Vercel, Railway, database, media, payment, Meta, domain, email, and delivery accounts under client ownership.','Enable database/media backups, uptime/error monitoring, webhook/payment alerts, and inventory-cleanup monitoring.','Document deployment, rollback, secret rotation, incident ownership, catalogue/order/coupon/invoice procedures, and launch-day checklist.','Train the client administrator and complete mobile/desktop, content, legal, checkout, fulfilment, and messaging sign-off.','Agree launch date, post-launch support window, and written Phase 1 acceptance.'],['Client controls production accounts and credentials.','Training and signed acceptance are complete.']),
]

for s in sections:
    if s[0].startswith('13.'):
        story.append(PageBreak())
    story.extend(section(*s))

story += [p('Work intentionally deferred beyond Phase 1', 'H1Brand')] + bullets([
'Full customer accounts and wishlist.','Loyalty and VIP segmentation.','AI messaging agent beyond the keyword rules.','Marketing campaign management and content calendar.','Meta Ads automation.','Advanced analytics and performance reporting.','Team roles and permissions.','Advanced automation and multi-warehouse inventory.'])
story += [p('Non-blocking technical watchlist', 'H1Brand')] + bullets([
'React Router reports an RSC-only advisory; this client-only Vite SPA does not expose the affected RSC/server-action path.','Payload transitive Drizzle development tooling carries moderate esbuild advisories with no upstream fix; no production runtime exposure was identified.','Update the in-product roadmap from “Phase 1 - in progress” only after formal client acceptance.'])
story += [PageBreak(), p('Recommended execution order', 'H1Brand')]
order = [['1','Purchase the final domain, then execute the prepared DNS/domain cutover'],['2','Collect client-owned accounts, credentials, legal copy, catalogue, and media'],['3','Finalize delivery/payment decisions and configure integrations'],['4','Load final content and configure media, email, messaging, analytics, and invoicing'],['5','Run authenticated admin and controlled live transaction QA'],['6','Configure monitoring/backups, deliver training, and obtain sign-off']]
ot = Table([[p(a,'Small'),p(b,'Small')] for a,b in order], colWidths=[12*mm,170*mm])
ot.setStyle(TableStyle([('BACKGROUND',(0,0),(0,-1),gold),('TEXTCOLOR',(0,0),(0,-1),colors.white),('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#D9D4C8')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
story += [ot, Spacer(1,8), p('<b>Release recommendation:</b> Do not declare Phase 1 delivered until P0 blockers are closed, controlled live payments pass, the production admin pass is complete, and the client has approved content, policies, operations, and ownership.', 'Callout')]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=16*mm, leftMargin=16*mm, topMargin=19*mm, bottomMargin=16*mm, title='Use Me With Style - Phase 1 Remaining Delivery Report', author='OpenAI Codex for Use Me With Style')
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(OUT)
