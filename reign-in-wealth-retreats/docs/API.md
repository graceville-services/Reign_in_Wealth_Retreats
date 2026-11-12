# Server API contract

All requests use JSON unless noted. Success: `{data: value, message?: string}`. Error: `{error: string}`. Mutation fetches need `Content-Type: application/json` (upload exception); same-origin cookies are used automatically. Prices are integer minor units. Never infer paid status from a checkout return URL.

## Public

- `GET /api/retreats` → `data: Retreat[]`
- `GET /api/retreats/:slug` → `data: Retreat`
- `GET /api/settings` → `data: SiteSettings`
- `POST /api/leads` `{name?,email,destination?,source?:'waitlist'|'newsletter'|'information',consent:true}` → `{id}`. Destination can be retreat slug or `all`.
- `GET /api/unsubscribe?token=...` validates an opaque email unsubscribe token without changing consent. `POST /api/unsubscribe` `{token}` revokes destination marketing consent and cancels pending marketing messages. Booking communications remain available.
- `POST /api/contact` `{name,email,phone?,subject?:'general'|'partnership'|'group',message,consent:true,website?:''}` → `{id}`. Website is a honeypot.
- `POST /api/bookings/quote` `{retreatSlug,occupancy:'single'|'double',paymentChoice:'deposit'|'full'|'installments',promoCode?}` → `{subtotal,discount,totalAmount,amountDue,currency,installments:[{number,amount,dueDate,paid}],canBook:boolean,reason?:string}`
- `POST /api/bookings` `{retreatSlug,firstName,lastName,email,phone,country,occupancy,roommateName?,roommateEmail?,paymentChoice,promoCode?,termsAccepted:true,marketingConsent?:boolean,notes?,website?:''}` → `{booking:Booking,checkoutUrl:string}`. Returns error unless the retreat, approved policies and Stripe are ready. Exactly one traveler per booking. No fictional test checkout is supplied.
- `POST /api/auth/traveler` `{email}` → `{sent:true,previewUrl?:string}`. Preview URL only in explicit development mode. Email sign-in does not reveal whether registrations exist.
- `GET /api/auth/verify?token=...` redirects to `/portal` after single-use token validation.
- `POST /api/auth/logout` clears session → `{ok:true}`.
- `GET /api/portal` → `{email,bookings:Booking[],announcements:{id,subject,message,createdAt}[],payments:{id,bookingId,amount,refundedAmount,currency,createdAt}[]}` (traveler session required).
- `POST /api/portal/pay` `{bookingId,paymentChoice?:'balance'|'next'}` → `{checkoutUrl}`.
- `GET /api/portal/receipt/:paymentId` → payment receipt JSON; ownership checked.

## Administration

- `POST /api/admin/login` `{email,password}` → `{email,role:'admin'}`.
- `GET /api/admin/session` → `{email,role:'admin'}` (401 otherwise).
- `GET /api/admin/overview` → `{bookings:number,travelers:number,rooms:number,leads:number,revenue:number,outstanding:number,currency:string,paymentConfigured:boolean,emailConfigured:boolean,policiesApproved:boolean}`. Revenue/outstanding include currency breakdowns if mixed.
- `GET /api/admin/retreats` → `Retreat[]` (includes unpublished).
- `POST /api/admin/retreats` full `Retreat` (id optional) → saved `Retreat`.
- `PATCH /api/admin/retreats/:id` partial `Retreat` → saved `Retreat`.
- `DELETE /api/admin/retreats/:id` → `{ok:true}`; existing registrations prevent deletion.
- `GET /api/admin/settings` → `SiteSettings`; `PATCH /api/admin/settings` partial settings → `SiteSettings`.
- `GET /api/admin/bookings` → `Booking[]`.
- `PATCH /api/admin/bookings/:id` `{status?:'pending'|'confirmed'|'cancelled',roomId?:string|null,notes?:string}` → `Booking`. Cannot manually mark a payment as paid. Cancellation does not issue refunds.
- `GET /api/admin/leads` → `{id,name,email,destination,source,consent,createdAt}[]`.
- `GET /api/admin/messages` → `{id,name,email,phone,subject,message,createdAt}[]`.
- `GET /api/admin/export?type=bookings|leads` → authenticated CSV download.
- `GET /api/admin/promos` → `{id,code,type:'percent'|'fixed',amount,currency,retreatId,maxUses,uses,active,expiresAt}[]`.
- `POST /api/admin/promos` `{code,type,amount,currency?:'USD',retreatId?:null,maxUses?:100,active?:true,expiresAt?:null}` → saved promo. Fixed amount is minor units; percent is 1–100.
- `PATCH /api/admin/promos/:id` `{active:boolean}` → promo.
- `GET /api/admin/testimonials` → `Testimonial[]`.
- `POST /api/admin/testimonials` `Testimonial` (id optional) → saved testimonial. Publishing requires consent.
- `PATCH /api/admin/testimonials/:id` partial testimonial → saved testimonial.
- `DELETE /api/admin/testimonials/:id` → `{ok:true}`.
- `POST /api/admin/upload` multipart `file` → `{url,name,size}`. JPEG/PNG/WebP/AVIF/GIF, MP4/WebM only; 25MB maximum. Use returned relative URL in content fields.
- `GET /api/admin/outbox` → `{id,to,subject,status,attempts,createdAt,lastError}[]` (development previews include text).
- `POST /api/admin/announcements` `{retreatId,subject,message}` → `{id,recipients}`. Queues messages for active registered guests of this retreat.
- `POST /api/admin/jobs` `{}` → `{queued,sent,failed}`; sends email jobs and schedules due payment/pre-departure reminders.

## Provider routes

- `POST /api/payments/webhook`: Stripe signature required; idempotent paid Checkout processing and charge.refunded reconciliation. Process actual refunds in Stripe Dashboard after the operator has reviewed the applicable cancellation policy. Only verified provider events change paid amounts.
- `POST /api/jobs`: `Authorization: Bearer CRON_SECRET` required. Run daily through a scheduler, or use `npm run jobs`.
- `GET /api/media/:filename`: serves locally stored uploaded media using safe filenames and MIME types.

See the README for `.env` setup. SQLite and uploaded files require persistent disk when deployed. Production requires HTTPS, a canonical `APP_URL`, strong admin credentials, verified email sender and approved policies. No sensitive passport/payment-card fields are collected.

## Operational behavior

- Installments are a dated payment schedule. Travelers authorize each payment in the portal; the system does not store cards or initiate automatic recurring debits.
- Successful POST requests start outbox delivery after returning the response. Scheduled jobs retry delivery, generate due reminders, and reconcile unresolved Stripe checkout sessions. No provider keys means no real email or payment is sent.
- A pending registration retains capacity while a Checkout session is unresolved, even if its local hold time has passed. A verified payment or confirmed provider expiry settles that hold.
- Supported two-decimal currencies are USD, EUR, GBP, CAD, AUD, NGN, AED, GHS, TZS and DOP. The Stripe account must support the selected currency. All API amounts use integer minor units.
- Cancellation never silently issues a refund. Review the applicable saved policy, cancel the registration, initiate the approved refund in Stripe Dashboard, and let `charge.refunded` reconcile the net paid amount.
- Uploaded files live under `MEDIA_PATH` (default `data/media`) and are served by `/api/media`. This directory and the SQLite database must be on persistent disk. Uploaded SVG, HTML and executable content are rejected.
- Authenticated media uploads are capped at 25 MiB and verified by file signature. Local video responses support bounded byte ranges. HTTPS asset links are rendered by the browser, not fetched by the server.
