# Launch guide

The site is designed to be useful immediately in private development and to become bookable after the business details and provider connections are configured. This guide distinguishes those steps so the team can review the actual travel package before accepting money.

## 1. Prepare a private working copy

From the project root, use Node 24:

```bash
npm ci
npm run setup
npm run dev
```

Keep the Codespaces port private. Open `/admin` with the unique password printed by setup. The `.env` file stays local and is excluded from source control and Docker build context.

The public website, lead capture, contact inquiries, content management, and database persistence work without paid provider credentials. Email messages remain in the outbox until sending is configured. Payment buttons never simulate success.

## 2. Environment variables

The authoritative template is [`.env.example`](../.env.example). Setup creates `.env`, a strong `CRON_SECRET`, and a scrypt administrator password hash. Existing `.env` files are preserved.

| Variable                | Purpose and setup                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`               | Canonical external origin, without a path. Local development: `http://localhost:3000`. Codespaces: your HTTPS forwarded URL. Production must use HTTPS and the public domain. |
| `DATABASE_PATH`         | Writable SQLite file path. Default `./data/retreats.sqlite`; Compose uses `/app/data/retreats.sqlite`.                                                                        |
| `MEDIA_PATH`            | Writable directory for uploaded media. Default `./data/media`; Compose uses `/app/data/media`.                                                                                |
| `DEV_PREVIEW_MODE`      | `true` permits development traveler sign-in previews only outside production. Use `false` on deployed systems.                                                                |
| `ADMIN_EMAIL`           | Administrator login identifier. Replace the generated local identifier with the team’s chosen administrator email before launch.                                              |
| `ADMIN_PASSWORD_HASH`   | Generated scrypt hash, not the plaintext password. Use the rotation procedure in Operations if it must change.                                                                |
| `CRON_SECRET`           | Generated secret of at least 32 characters for `POST /api/jobs`. Keep it server-side.                                                                                         |
| `STRIPE_SECRET_KEY`     | Stripe secret API key for the appropriate sandbox/test environment first; live key only for your approved production release.                                                 |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the exact webhook endpoint or local Stripe CLI listener. Begins with `whsec_`.                                                                             |
| `RESEND_API_KEY`        | Resend API key with permission to send from your verified domain.                                                                                                             |
| `EMAIL_FROM`            | Approved sender, for example `Reign in Wealth Retreats <travel@your-domain.com>`. Use an address on your verified domain.                                                     |
| `BACKUP_PATH`           | Backup directory. Default `./backups`; Compose uses `/app/backups`.                                                                                                           |
| `BACKUP_RETENTION_DAYS` | Local backup retention in days; default `30`. Off-server retention is managed separately.                                                                                     |
| `NODE_ENV`              | Set by the Next development/production commands; Compose explicitly sets `production`. Do not force production mode while expecting development sign-in previews.             |

Restart the application after changing its environment. Never prefix secret variables with `NEXT_PUBLIC_`.

Business contact information, social URLs, the founder photograph, the homepage film, policies, and the optional analytics measurement ID are content settings in `/admin`; they are not secret environment variables.

## 3. Replace the pending business content

Use the admin interface to complete the following before paid bookings open:

- Public contact email and monitored support process.
- WhatsApp number in international digits, if offered.
- Verified social profile and parent-brand URLs.
- Kimona Hanson’s approved portrait and any final founder copy.
- Authentic Ghana 2026 photographs and film. Stock destination photographs must remain described as destination inspiration.
- Real traveler reviews with permission to publish the quote, name, and any photo or video.
- Confirmed hotel/resort, room types, and occupancy arrangements.
- Final day-by-day program, inclusions, exclusions, meeting points, transfer arrangements, and practical travel guidance.
- Prices per **traveler**, currency, deposit, installment count, and total traveler capacity.
- Final legal business identity and approved privacy, booking, and cancellation policies.

The initial Dubai and Ghana outlines are proposed. Replace or explicitly approve them as the actual program. Zanzibar’s exact dates and the Dominican Republic’s date/location remain open business decisions. Do not switch a destination to bookable while those decisions are outstanding.

### Booking readiness gates

For each retreat you want to sell, provide a future start date and an end date, a hotel name, usable pricing for the selected occupancy, positive capacity, retreat terms, and a cancellation policy. Set its status to **open**, enable booking, and approve the global policies. Stripe credentials and webhook verification must also be configured.

Pricing fields in the admin editor are displayed as amounts for your team; the API stores money as integer minor units. In direct API integrations, USD 1,500 is `150000`, not `1500`. Currency values and a fixed-value promotional code must agree. Supported currencies are USD, EUR, GBP, CAD, AUD, NGN, AED, GHS, TZS, and DOP; this implementation uses two decimal places for those supported currencies.

One registration means one person. A double-occupancy selection does not register or charge for two people. The roommate submits their own registration; staff then assign the shared room to the two appropriate traveler records.

### Default payment-plan behavior

- Full payment collects the total immediately.
- Deposit collects the configured deposit now and leaves one balance payment.
- Installments collect the deposit now and divide the remainder into the configured number of payments.
- The default final deadline is **30 days before departure**. Due dates for the remaining installments are distributed between registration and that deadline.
- Inside the last 30 days, the system requires full payment.
- Installments are traveler-initiated Checkout payments with reminders; this is not an automatic recurring card debit or a Stripe subscription.

Approve this schedule as part of your booking terms. A different final-balance rule requires adjusting the schedule function in `src/lib/server/payments.ts` and verifying the results before taking payments.

## 4. Configure Stripe in a sandbox first

Use your own Stripe account and test/sandbox credentials. No live transaction is needed for the acceptance checks below. Follow Stripe’s official [CLI installation](https://docs.stripe.com/stripe-cli) and [webhook guidance](https://docs.stripe.com/webhooks).

Set the test `STRIPE_SECRET_KEY` in `.env`. In another Codespaces terminal, authenticate the Stripe CLI to the same sandbox and start the listener:

```bash
stripe login
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired,charge.refunded \
  --forward-to http://localhost:3000/api/payments/webhook
```

Copy the **listener’s** `whsec_...` value into `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`. Leave the listener running. This local forwarder allows Stripe delivery without making your development website public.

The CLI listener’s secret and a Dashboard-created endpoint’s secret are different. Always pair the secret with the endpoint that is actually delivering events.

### Test an actual website registration

In this private test database, configure one retreat with explicitly temporary test package values and approved test policies. Complete its hotel/date/capacity fields and enable it. Use an email address you control.

1. Open its reservation flow, select occupancy, and choose a payment option.
2. Verify the review total, policy text, and schedule before continuing.
3. Complete the resulting **test** Checkout. Stripe documents `4242 4242 4242 4242`, a future expiry, and any three-digit CVC for a successful test card. Use only Stripe’s published test details in a sandbox. See [Stripe testing](https://docs.stripe.com/testing).
4. Watch the CLI confirm delivery of `checkout.session.completed` to your webhook with a successful response.
5. Sign in to the traveler portal and verify the booking’s payment, remaining balance, schedule, and receipt.
6. Check the same values in admin. Returning to the success URL by itself must not change paid amounts.
7. Repeat for full payment, deposit, and installments using separate test registrations. Confirm that a second traveler’s portal cannot view the first traveler’s records.
8. Test a canceled Checkout and an expired Checkout. Neither should appear as paid.
9. Resend the same successful webhook event using Stripe’s tools and confirm that the payment is not counted twice.
10. Issue a test refund in the Stripe Dashboard and verify that `charge.refunded` adjusts the recorded net paid amount. Changing booking status alone does not refund a card.

A generic `stripe trigger checkout.session.completed` can verify transport, but its generated event will not contain the database-backed registration and checkout metadata required by this application. Complete a real test registration through the site for an end-to-end payment check.

Do not carry fabricated test prices or test traveler records into your production database.

### Production webhook

After the domain and HTTPS are ready, register this endpoint in the correct Stripe live account:

```text
https://YOUR-DOMAIN/api/payments/webhook
```

Select **snapshot events** from your account, not thin-event payloads. Enable:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `charge.refunded`

Set the endpoint’s signing secret and the matching live secret key in your hosting environment. Do not reuse the CLI secret. Check Stripe’s delivery logs after rollout. Card information stays in Stripe Checkout; this website does not store raw card fields.

## 5. Configure email

Add and verify a sending domain in Resend, then configure `RESEND_API_KEY` and `EMAIL_FROM`. Use the required DNS records from your own Resend dashboard. See [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).

Use a real, monitored public contact email in the website settings. Test delivery to an address you control:

1. Submit a destination-interest form and check its persistent admin record.
2. Run `npm run jobs`, or use the admin’s process-jobs action.
3. Check the outbox status and actual recipient inbox.
4. Request a traveler sign-in link; it should arrive and work once within its 15-minute validity period.
5. Complete a sandbox registration/payment and verify the queued registration, welcome, payment, and schedule information.
6. Send a test retreat announcement to test registrations and verify both the portal announcement and email.

Sign-in attempts process email immediately. Successful mutation requests also dispatch the outbox after responding, so a configured sender can deliver confirmations without waiting for the scheduler. Keep the recurring job runner active for retries, scheduled reminders, and unresolved Stripe Checkout reconciliation. A provider’s accepted-send status is not a guarantee of inbox placement; inspect failed attempts and provider delivery records.

Destination leads are segmented and can be exported. The included retreat-announcement feature targets registered guests. If you add an external bulk marketing platform, preserve consent and provide a working unsubscribe process before sending campaigns.

## 6. Release checks

Run from a clean checkout:

```bash
npm ci
npm exec next typegen
npm run typecheck
npm test
npm run build
```

Then verify the actual deployment configuration:

- [ ] Production Node 24 or the supplied Docker image.
- [ ] HTTPS domain matches `APP_URL`; no development sign-in previews.
- [ ] Unique administrator credentials saved securely.
- [ ] SQLite database and uploads on persistent writable storage.
- [ ] Canonical contact details, truthful content, and genuine approved media.
- [ ] Final occupancy prices, deposit/schedule, availability, and accepted policies.
- [ ] Stripe sandbox flows verified and the live webhook configured separately.
- [ ] Resend sender verified; actual sign-in and transactional emails checked.
- [ ] Recurring jobs enabled and monitored.
- [ ] Backup created, copied off-server, and a restore rehearsed.
- [ ] Mobile navigation, forms, keyboard focus, and essential reading contrast reviewed.
- [ ] Optional analytics reviewed with the site’s consent behavior; see [Analytics](ANALYTICS.md).

The ZIP includes the implementation and configuration files. Hosting, payment-account approval, verified email DNS, scheduling, and off-server storage must be configured in your own environment; they have not been provisioned or live-tested by delivering the code.
