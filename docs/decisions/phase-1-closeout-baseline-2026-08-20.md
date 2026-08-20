# Phase 1 Closeout and Commercial Launch Baseline

Status: approved controlling baseline

Decision date: 2026-08-20

Approved by: José Nogueira and Raisa
Supersedes: the payment, invoicing, delivery and launch assumptions in
`phase-1-architecture-and-blockers.md` and the 20 August 2026 closeout PDF where
they conflict with this decision.

This document separates **Phase 1 delivery acceptance** from **commercial
launch**. It contains decisions and responsibilities only. Completion of a
closeout action still requires its specified test or operational evidence.

## 1. Phase 1 delivery acceptance

Phase 1 may be formally delivered and accepted before the storefront launches
commercially, provided the agreed Phase 1 functionality, testing,
documentation, recovery procedures, training and handoff are complete or an
authorised exception is recorded in writing.

Delivery acceptance does not by itself authorise live selling.

## 2. Payments and commercial launch

- AppyPay is intended to become the primary Angola payment flow after the
  remaining external administrative and legal steps are complete and the
  production integration has passed controlled verification.
- The existing WhatsApp checkout flow remains in the product.
- WhatsApp is retained as an operational fallback in case AppyPay is
  unavailable or experiences a material incident.
- The administrator must be able to activate the WhatsApp fallback without a
  code deployment.
- Activation and deactivation of the fallback must be deliberate, auditable
  and documented in the operating runbook.
- Commercial launch approval is a joint decision by José Nogueira and Raisa.

The AppyPay production-readiness work and the administrator fallback control
are separate implementation and UAT gates. This baseline does not claim that
either has already been proven.

## 3. Invoicing and fiscal-provider decision

- The initial launch may use the application's current invoice implementation.
- Selection and integration of SWEG, FactPlus or another external fiscal
  provider is not a prerequisite for initial commercial launch.
- SWEG and FactPlus remain under evaluation; neither is selected by this
  baseline.
- The current invoice's legal and operational status, limitations and
  accountant process must be described accurately in the client handoff. It
  must not be represented as a certified external fiscal-provider document
  unless that status is separately established.
- A future fiscal-provider integration requires its own provider decision,
  sandbox evidence, document-series rules, credit-note/refund contract,
  retention procedure, monitoring and training.

## 4. Returns policy

The approved Angola customer return/exchange request window is **14 calendar
days after receipt of the order**, subject to the published eligibility
conditions.

All public content, admin-configured content, defaults, seeds and existing
production content must use the approved 14-day rule. The historical 48-hour
wording is not approved. Verification and any safe production data correction
belong to the catalogue/content closeout gate and require evidence.

## 5. Catalogue and content authority

Raisa is responsible for final approval of:

- the sellable catalogue;
- product and category photography;
- image-to-product and image-to-colour assignments;
- final Portuguese and English product and storefront content;
- brand presentation and content accuracy.

Engineering and QA provide exports, validation, implementation support and
responsive verification. Catalogue/content closeout is not complete until
Raisa's approval is recorded.

## 6. Decision and operating roles

| Responsibility | Authorised owner |
| --- | --- |
| Phase 1 client approver | Raisa |
| Commercial launch approval | José Nogueira and Raisa jointly |
| Authority to pause sales | Raisa |
| Primary client operations owner | Raisa |
| Technical and infrastructure owner | José Nogueira |
| Emergency escalation channel | Direct WhatsApp conversation between José Nogueira and Raisa |

Passwords, tokens, recovery codes and other secret values must not be recorded
in this document or the closeout evidence pack.

## 7. Support and maintenance model

- Phase 2 work begins after Phase 1 concludes.
- During subsequent phases, Raisa may report operational issues directly to
  José through the agreed communication channel for investigation and repair.
- After Phase 3 delivery, the first month of maintenance is provided without a
  maintenance charge to cover issues discovered during that period.
- After the free month, the existing monthly paid maintenance agreement
  applies.
- Incident priority, expected response, exclusions and pause-sales procedure
  must be made explicit in the final operations guide and maintenance terms.

This replaces the previously proposed standalone 14-day heightened-support
window.

## 8. Exception and change-control process

Every unresolved P0 closeout item must receive one of these written outcomes:

1. fixed and supported by evidence;
2. accepted by the authorised owner as a dated exception with impact,
   workaround and follow-up owner;
3. removed from the delivered scope by an approved scope decision; or
4. retained as a delivery or launch blocker.

No item is complete solely because a checkbox is ticked. Any later change to
payments, invoices, returns policy, approval authority or launch conditions
must update this baseline or create a newer decision record that explicitly
supersedes it.

## 9. Release references at baseline lock

The repository state observed when this decision was recorded was:

| Repository | Branch | Reference | State |
| --- | --- | --- | --- |
| `use-me-with-style-platform` | `main` | `862ac10` | Clean and aligned with `origin/main` |
| `use-me-with-style-cms` | `main` | `baaef2d` | Commit aligned with `origin/main`; one untracked temporary 14-day content update script remains to be dispositioned |

These are baseline references, not final Phase 1 release candidates. Any
closeout change requires a new commit, deployment verification and an updated
final release record.

## 10. Gate 0 result

Gate 0 is complete when this decision record is committed, pushed, linked from
the closeout index and acknowledged by the named approvers. The next execution
gate is the current technical baseline: tests, builds, browser E2E,
accessibility, dependency-risk disposition and migration-test review.
