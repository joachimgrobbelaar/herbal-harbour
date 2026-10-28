# Herbal Harbour

Online shop and in-store point of sale for Herbal Harbour. Prices are in South African rand (R). The storefront is React 19, Vite, and Tailwind. Accounts, the catalogue, stock, and orders are in Firebase project `gemini-dream-477009`. Hosting site: `canna-spin-and-win`. Custom domain: `herbalharbour.co.za`.

There is no card payment gateway. Customers pay by EFT or when they collect. An order starts as **pending**, then moves to **paid**, **collected**, or **cancelled**. Cancelling a pending or paid order puts the units back in stock.

The sample catalogue in `src/data/products.ts` is only the seed data. After seeding, the shop reads and writes Firestore.

## What works without the Cloud Function

Sign-in, the cart, checkout, stock, the point of sale, security rules, and the **Export to .xlsx** button do not need Cloud Functions. The Google Sheet mirror is the only piece that needs the **Blaze** plan. Leave it undeployed until you want it: set the GitHub repository variable `SKIP_FUNCTIONS` to `true` so pushes to `main` still publish the site and the security rules.

## 1. Install and run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the web app config from the next section. Until those values exist, the site shows the sample catalogue and refuses checkout.

```bash
npm run lint    # tsc --noEmit
npm run build
npm run test:rules
```

`test:rules` needs Java and uses the Firestore emulator. It does not touch the live project.

## 2. Turn on Authentication

In the [Firebase console](https://console.firebase.google.com/project/gemini-dream-477009/authentication) for `gemini-dream-477009`:

1. Open **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Enable **Google**. Choose a support email.
4. Open **Settings → Authorised domains** and add `herbalharbour.co.za`, `canna-spin-and-win.web.app`, `canna-spin-and-win.firebaseapp.com`, and `localhost` if it is not already there.

## 3. Create Firestore

1. Open **Build → Firestore Database → Create database**.
2. Start in **production mode**. The rules in this repo are deployed separately and replace the locked-down default.
3. Pick a location and leave it. This cannot be changed later.
4. The Sheets Cloud Function is set to region `europe-west1` in `functions/src/index.ts`. If the database location is not in that region, change the `region` in that file to a Cloud Functions region next to the database before you deploy functions. The website itself does not care.

## 4. Web app config (browser)

Firebase console → **Project settings → Your apps → Add app → Web**. You can skip Hosting setup there; this repo already targets the existing site.

Copy the config into `.env.local`:

| `.env.local` | Firebase config field |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` (`gemini-dream-477009`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

The web `apiKey` is a client identifier. It is still kept out of git. Put the same six values in GitHub **Actions secrets** with the same names so the deploy build can talk to Firebase.

Do **not** add a Gemini API key, `@google/genai` key, or service-account JSON to any `VITE_` variable. Vite inlines those into the public JavaScript bundle.

Bank details printed on EFT orders live in `src/lib/shopConfig.ts`. Replace the placeholders before you take a real transfer.

## 5. Service account (seed, admin, GitHub deploy)

This key is private. It never belongs in the browser or in git.

1. Google Cloud console → **IAM → Service accounts → Create** (project `gemini-dream-477009`).
2. Grant it **Firebase Admin** (`roles/firebase.admin`) and **Service Account User** (`roles/iam.serviceAccountUser`).
3. To deploy Cloud Functions later, also grant **Cloud Functions Admin**, **Cloud Build Editor**, and **Artifact Registry Writer**.
4. Create a JSON key and download it. Store it outside the repo.

Local scripts:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to-that-file.json
```

GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: the entire JSON file contents

## 6. Seed the catalogue

The owner signs nothing in for this step. It writes `src/data/products.ts` into `products/{id}`.

```bash
npm run seed
```

Running it again refreshes names and prices and **leaves stock alone**. Add `--reset-stock` only when you intend to overwrite on-hand counts with the numbers in the seed file.

## 7. Make the owner an admin

Admin access is **not** implied by the email address. Either of these works. The Firestore document is what the shop desk and the security rules read. The custom claim is a second check on the ID token.

### Recommended: script

1. Open the site and **sign up** with `joachimgrobbelaar@gmail.com` (email/password or Google). The Auth user has to exist first.
2. With `GOOGLE_APPLICATION_CREDENTIALS` set:

```bash
npm run make-admin -- joachimgrobbelaar@gmail.com
```

3. Sign out and sign in once so the custom claim is on the token. The `roles/{uid}` document applies immediately even before that.

### Console only

1. **Authentication → Users** and copy the uid for `joachimgrobbelaar@gmail.com`.
2. **Firestore → Start collection** `roles`.
3. Document ID: that uid. Fields: `admin` (boolean) `true`, `email` (string) `joachimgrobbelaar@gmail.com`.

Client apps cannot write `roles`. The console and the Admin SDK bypass security rules, which is why this bootstrap is done there. A signed-in customer who is not in `roles` and has no `admin` claim sees an access-denied desk at `/admin`.

## 8. Deploy

This repo does not deploy from a laptop by itself. Pushing `main` runs `.github/workflows/firebase-hosting.yml`:

- Typecheck and build the storefront.
- Deploy Hosting to site `canna-spin-and-win` (SPA rewrite to `index.html`).
- Deploy Firestore rules and indexes.
- Deploy Cloud Functions, unless the repository **variable** `SKIP_FUNCTIONS` is `true`.

Pull requests deploy a **Hosting preview channel** and comment on the PR. They do not touch Firestore or functions.

`firebase.json` points Hosting at `dist` with the target `canna-spin-and-win`. `.firebaserc` pins project `gemini-dream-477009`.

If the functions step fails because the project is still on the Spark plan, set `SKIP_FUNCTIONS` to `true`, or upgrade to Blaze and run the workflow again. Hosting and rules are a separate step, so a functions failure does not roll back the site that was already published in that job. Fix the plan, then re-run.

## 9. Google Sheet mirror (optional, Blaze)

The function `functions/src/index.ts` runs on writes to `products`, `orders`, and `stockMovements` and upserts rows on tabs **Products**, **Orders**, and **StockMovements**.

1. Upgrade the Firebase project to **Blaze**.
2. Create a Google Sheet. The id is the segment in `/spreadsheets/d/<id>/edit`.
3. Enable the **Google Sheets API** on the Cloud project.
4. Share the sheet as **Editor** with the Cloud Functions runtime service account (often `gemini-dream-477009@appspot.gserviceaccount.com` or the Compute Engine default service account shown on the function's details page).
5. Either save that id in the shop desk (**Spreadsheet** tab), which writes `config/sheets`, or set `SHEETS_SPREADSHEET_ID` in `functions/.env` (see `functions/env.example`) and redeploy functions.
6. Optional: set `SHEETS_SERVICE_ACCOUNT` in `functions/.env` to a different service-account JSON, and share the sheet with that account instead.
7. Remove the `SKIP_FUNCTIONS` variable and push to `main`.

If the id is missing or the sheet is not shared, the function logs and returns. Orders in the shop are unaffected.

The shop desk **Export to .xlsx** button (SheetJS) downloads the products, orders, and movements currently loaded in the desk. That download does not use the Cloud Function.

## 10. How stock is protected

Customers may read the catalogue. They may read and write only their own `carts/{uid}` document and their own orders.

They cannot edit prices. They can reduce `stock` only inside a single commit that also creates their own **pending online** order for the same quantity. They can increase `stock` only while that order moves to **cancelled**, and only by the quantity that was sold. A second cancel does not restock again. Admins can create and edit products, adjust stock (with a reason, which writes `stockMovements`), mark orders paid or collected, cancel and restock, and record **pos** sales through the same stock transaction the website uses.

There is still no payment capture. A signed-in customer could submit an order total the till did not calculate. Staff confirm the EFT amount before marking an order paid. Cancelling returns stock.

## 11. Keys that were in git and must be treated as exposed

GitHub secret scanning flagged material that had been committed inside saved CodePen pages:

- `public/assets/aistudio/__Jackpot_Spin_Slot_Machine_Game___Vanilla_JavaScript_Casino_Simulator_0f478380.html`
- `public/assets/aistudio/Email_cannabis_marketing_8b37fd50.html`

Those values are **removed from the current files**. They are still in git history (commit `cf44596` on `main`) until history is rewritten and force-pushed, which this change does not do. Anyone who cloned the repo can still see them. Rotate or revoke as follows:

| What | Identifier | What to do |
| --- | --- | --- |
| Google API key | `AIzaSyBgLAe7N_MdFpuVofMkcQLGwwhUu5tuxls` | Firebase/Google Cloud project **`codepen-store-production`** (this is the CodePen editor's key, baked into a saved page, not the Herbal Harbour web key). If you control that project, restrict or delete the key. If you do not, treat it as CodePen's key that was mirrored into this repo. |
| Firebase ID tokens | Issuer `firebase-adminsdk-8okyl@codepen-store-production.iam.gserviceaccount.com`, Auth uid `zEyNNv`, CodePen username `Marnu-Grobbelaar`. Two different tokens, one in each HTML file. | These are session tokens, not long-lived API keys. They expire about an hour after they were issued. Sign out of CodePen everywhere so no refresh token from that browser session remains useful. Do not paste the raw tokens into a new ticket. |
| Stripe publishable key | `pk_live_2GndomDfiklqpSNQn8FrGuwZSMIMzha7DkLJqlYe7IR0ihKAlKdiHg68JJc5eVPt68rzAjzAAVXcUwjySHRCsgjQQ00gtRBUFNH` | Found in the same pages as CodePen's `__pay_stripe_public_key`. Publishable keys are meant to be public, but secret scanning still flags `pk_live_`. Rotate it in Stripe **only if that key belongs to a Stripe account you control**. It is not used by this shop. |

No live Gemini / `@google/genai` key was stored in the repo (`.env.example` only had the placeholder `MY_GEMINI_API_KEY`). The unused `@google/genai` dependency has been removed so it is not shipped to the browser. If a real Gemini key was ever entered in AI Studio, a hosting environment, or a local env file that was deployed, revoke it in Google AI Studio and create a new one. Never give it a `VITE_` name.

## Shop desk

`/admin` after you are an admin:

- **Orders** — mark paid, mark collected, or cancel (cancel restocks).
- **Products** — create, edit, hide, delete.
- **Stock** — on-hand counts, adjustments with a reason, movement log, low-stock list (on hand at or under the product's threshold, default 5).
- **Point of sale** — in-store sale, channel `pos`, stock drops in the same transaction as an online order.
- **Spreadsheet** — save the Sheet id and download `.xlsx`.

`/account` shows the signed-in customer's orders. They can cancel their own **pending** online orders.

Guests keep a cart in `localStorage`. Signing in merges it into `carts/{uid}` and caps quantities at the current stock. Signing out leaves the account cart in Firestore.
