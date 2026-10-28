# Herbal Harbour

Online shop and in-store till. The website is a React app on Firebase Hosting (Spark plan is enough). Accounts are Firebase Auth. Products, stock, carts, and orders are MySQL on the HOSTAFRICA account for herbalharbour.co.za. There is no Firestore database and no Cloud Functions.

Prices are in rand. Payment is EFT or pay on collection. The Herbalist layout and the 3D models stay in the browser.

## What you upload where

| Where | What |
| --- | --- |
| Firebase Hosting site `canna-spin-and-win` | The built website (`npm run build` → `dist/`). GitHub Actions does this when `FIREBASE_SERVICE_ACCOUNT` is set. |
| HOSTAFRICA, document root of `api.herbalharbour.co.za` | The whole `server/` folder: `index.php`, `export.php`, `.htaccess`, `lib/`, `cron/`, `config.php`, `schema.sql`, `seed.sql`. |
| phpMyAdmin | `server/schema.sql`, then `server/seed.sql`. |
| Your PC, Excel | `public/HerbalHarbour-Live.xlsx` (also published at `/HerbalHarbour-Live.xlsx`). |

Do not upload `config.sample.php` over a filled-in `config.php`. Do not commit `config.php`.

## 1. Firebase (already done)

Email/Password and Google sign-in are enabled. Authorised domains include the hosting site and herbalharbour.co.za. The public web config is the default in `src/lib/firebase.ts`, so the site builds without extra `VITE_FIREBASE_*` secrets.

Sign-up as `joachimgrobbelaar@gmail.com` once. The seed marks that email as admin. The API checks the verified token email against the `admins` table.

## 2. DirectAdmin — database

Server: `da40.host-ww.net`. Plan: Web_Starter. Domain: `herbalharbour.co.za`.

1. DirectAdmin → **Account Manager → MySQL Management → Create Database**.
2. Database name, for example `herbalharbour`. DirectAdmin may prefix it (`user_herbalharbour`). Use the full name.
3. Create a user with a password and grant that user **all privileges** on this database.
4. Open **phpMyAdmin**. Select the database.
5. **Import** → choose `server/schema.sql` → Go.
6. **Import** → choose `server/seed.sql` → Go.
7. Confirm `products` has 8 rows and `admins` contains `joachimgrobbelaar@gmail.com`.
8. If this database was created before Spin & Win, import `server/migrations/2026-10-28-spin-credit.sql` as well. Do not import `seed.sql` again. That file updates stock. Upload the new `server/index.php`, `server/lib/shop.php`, and `server/lib/spin.php` with the migration, or checkout cannot store the credit column.

Remote MySQL is not required. The PHP API on the same hosting account uses `localhost`.

## 3. DirectAdmin — API subdomain

1. DirectAdmin → **Account Manager → Subdomain Management → Create**.
2. Subdomain: `api`. Domain: `herbalharbour.co.za`. Document root can stay the default (`domains/api.herbalharbour.co.za/public_html`).
3. If the host does not add DNS for you, add an **A record** `api` pointing at the same IP as `herbalharbour.co.za` (the site’s current address on `da40.host-ww.net`).
4. **Files → File Manager** (or FTP). Upload the contents of `server/` into that document root so `index.php` and `.htaccess` sit at the top, next to `lib/` and `cron/`.
5. Copy `config.sample.php` to `config.php` in that same folder. Set:
   - `db.host` = `localhost`
   - `db.name` = the full database name from step 2
   - `db.user` and `db.pass` = the MySQL user
   - `export_key` = a long random string (this is what Excel sends)
   - `dev_auth` = `false`
6. Visit `https://api.herbalharbour.co.za/health`. Expect `{"ok":true,...}`.
7. Visit `https://api.herbalharbour.co.za/products`. Expect the eight products with rand prices.

If the subdomain is not ready, upload `server/` to `public_html/api/` on the main domain and set the site build to `VITE_API_BASE=https://herbalharbour.co.za/api`. The router strips a leading `/api`.

PHP 8.x with PDO MySQL is enough. Composer is not used. `.htaccess` blocks `config.php`, SQL files, `lib/`, and `cache/`.

## 4. Excel live refresh

`export.php` needs the export key:

- CSV: `https://api.herbalharbour.co.za/export.php?key=YOUR_KEY&sheet=products&format=csv`
- Same with `sheet=orders` or `sheet=movements`
- `.xlsx` of one or all sheets: add `format=xlsx` or `sheet=all`

`public/HerbalHarbour-Live.xlsx` has three web connections (refresh interval 10 minutes) and a named cell `ExportKey` on the Settings sheet.

1. Open the workbook.
2. Paste the export key into **Settings!B2**.
3. **Data → Queries & Connections**. Edit each connection and replace `PASTE_EXPORT_KEY` with that key.
4. Turn on **Refresh every 10 minutes** while the workbook is open.
5. The How to connect sheet also has Power Query M that reads `ExportKey` if you prefer **Data → Get Data → Blank Query**.

The desk **Export to .xlsx** button still downloads whatever the desk has loaded. The shop never reads the spreadsheet back.

Optional cron (only if you want a Google Sheet as well): put a service-account JSON path and spreadsheet id in `config.php` under `sheets`, share the Sheet with that account, then DirectAdmin → **Cron Jobs**:

```bash
php /home/USER/domains/api.herbalharbour.co.za/public_html/cron/sync-sheet.php
```

Every 10 minutes. If those settings are blank, the script exits without doing anything.

## 5. Local commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run php:lint
```

`VITE_API_BASE` defaults to `https://api.herbalharbour.co.za`. Override it in `.env.local` to point at a local PHP server.

## Stock rules

Checkout and the till run in one MySQL transaction (`SELECT ... FOR UPDATE`). The API prices the order from the database, so a browser cannot submit its own total. Cancelling a pending or paid order puts the units back. In-store sales use the same path with `channel=pos`. Only emails in `admins` can change products, stock, and order status.

## Hosting deploy

`.github/workflows/firebase-hosting.yml` typechecks, runs `php -l`, builds, and deploys **Hosting only**. Pull requests get a preview channel. The Firebase project can stay on the Spark plan.
