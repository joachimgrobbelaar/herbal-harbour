# Herbal Harbour — Official YouTube and TikTok Account Registration & Architecture Guide

> **Authoritative Operational Manual for Herbal Harbour (Pty) Ltd**  
> **Associated Request:** R2 Account Registration Setup  
> **Primary Corporate Entities:** `admin@herbalharbour.co.za` & `info@herbalharbour.co.za`  
> **Target Production Path:** `docs/ACCOUNT_REGISTRATION_GUIDE.md`  
> **Self-Hosted Webmail Integration:** `http://localhost:8025/`

---

## Table of Contents
1. [Executive Summary & Strategic Account Architecture](#1-executive-summary--strategic-account-architecture)
2. [Localhost Webmail Integration & Verification Flow](#2-localhost-webmail-integration--verification-flow)
   - [2.1 Webmail Verification Architecture](#21-webmail-verification-architecture)
   - [2.2 Webmail UI Step-by-Step Retrieval](#22-webmail-ui-step-by-step-retrieval)
   - [2.3 Programmatic / Terminal OTP Inspection (REST API)](#23-programmatic--terminal-otp-inspection-rest-api)
   - [2.4 OTP Lifetime & Timing Windows](#24-otp-lifetime--timing-windows)
3. [YouTube Account & Brand Channel Registration Guide](#3-youtube-account--brand-channel-registration-guide)
   - [3.1 Google Account Creation with Custom Domain Email](#31-google-account-creation-with-custom-domain-email)
   - [3.2 Webmail Verification & Account Finalization](#32-webmail-verification--account-finalization)
   - [3.3 Account Hardening, 2FA & Recovery Provisioning](#33-account-hardening-2fa--recovery-provisioning)
   - [3.4 YouTube Brand Channel Provisioning](#34-youtube-brand-channel-provisioning)
   - [3.5 Multi-Tier Feature Eligibility & Phone Verification](#35-multi-tier-feature-eligibility--phone-verification)
   - [3.6 Permissions Delegation (Admin vs Manager Roles)](#36-permissions-delegation-admin-vs-manager-roles)
   - [3.7 Visual Branding, Assets & Metadata Configuration](#37-visual-branding-assets--metadata-configuration)
   - [3.8 YouTube Data API v3 & Cross-Posting Readiness (R3 Handshake)](#38-youtube-data-api-v3--cross-posting-readiness-r3-handshake)
4. [TikTok Business Account Registration Guide](#4-tiktok-business-account-registration-guide)
   - [4.1 Account Creation via Custom Email](#41-account-creation-via-custom-email)
   - [4.2 OTP Verification via Localhost Webmail](#42-otp-verification-via-localhost-webmail)
   - [4.3 Handle Reservation & Identity Protection](#43-handle-reservation--identity-protection)
   - [4.4 Account Hardening & 2-Step Verification (2FA)](#44-account-hardening--2-step-verification-2fa)
   - [4.5 Switching to TikTok Business Account](#45-switching-to-tiktok-business-account)
   - [4.6 Profile, Bio & Business Desk Optimization](#46-profile-bio--business-desk-optimization)
   - [4.7 TikTok Content Posting API & Developer Registration (R3 Handshake)](#47-tiktok-content-posting-api--developer-registration-r3-handshake)
5. [Regulatory Compliance, Policy Guardrails & Shadowban Prevention](#5-regulatory-compliance-policy-guardrails--shadowban-prevention)
   - [5.1 South African Statutory Framework (Act 7 of 2024 & POPIA)](#51-south-african-statutory-framework-act-7-of-2024--popia)
   - [5.2 YouTube Policy Compliance (Regulated Goods)](#52-youtube-policy-compliance-regulated-goods)
   - [5.3 TikTok Policy Compliance & Keyword Whitelist](#53-tiktok-policy-compliance--keyword-whitelist)
6. [Operational Runbook, Recovery & Credential Vault](#6-operational-runbook-recovery--credential-vault)
   - [6.1 Credential Matrix Template (.env)](#61-credential-matrix-template-env)
   - [6.2 Emergency Account Recovery Procedure](#62-emergency-account-recovery-procedure)
7. [Acceptance Criteria & Verification Checklist](#7-acceptance-criteria--verification-checklist)

---

## 1. Executive Summary & Strategic Account Architecture

Herbal Harbour operates as South Africa's premier medical cannabis, cannabinoid wellness, and botanical genetics dispensary based in Cape Town (`herbalharbour.co.za`). To establish an authoritative, compliant digital footprint and empower downstream automated cross-posting from Instagram (R3), two primary enterprise accounts must be established:

1. **YouTube Official Brand Channel** (`@herbalharbour`)
2. **TikTok Official Business Account** (`@herbalharbour`)

### Separation of Responsibilities & Identity Governance

To ensure enterprise-grade security and prevent operational bottlenecks, administrative ownership is bifurcated between two corporate identities:

| Governance Dimension | Primary Administrative Master (`admin@herbalharbour.co.za`) | Public Communications & Marketing (`info@herbalharbour.co.za`) |
| :--- | :--- | :--- |
| **System Role** | Root Owner, Security Custodian, Cloud Console Billing & API Owner | Public Brand Manager, Community Inquiries, Daily Channel Co-Manager |
| **Google Account** | Primary Google Account (Root Owner of YouTube Brand Channel) | Secondary Google Account (Invited as "Manager" in YouTube Studio) |
| **TikTok Account** | Recovery & Master Security Escrow / Business Center Admin | Primary Sign-In Identity for Daily Social Media Operations |
| **2FA Custody** | Encrypted IT Hardware / Corporate Vault (e.g., Bitwarden / 1Password) | Marketing Lead Authenticator App + Corporate Mobile Backup |
| **Cross-Recovery Role** | Fallback recovery email for `info@herbalharbour.co.za` | Fallback recovery email for `admin@herbalharbour.co.za` |
| **External Sharing** | **NEVER** shared outside C-level / Root IT Administrators | Handed to authorized social media operators with restricted scopes |

---

## 2. Localhost Webmail Integration & Verification Flow

Both Google and TikTok mandate email verification via 6-digit one-time PIN (OTP) codes or secure confirmation links. Because Herbal Harbour operates on custom domain addresses (`@herbalharbour.co.za`) managed by the local self-hosted email stack (R1), all verification messages arrive directly into the self-hosted storage and are viewed through the **Localhost Webmail Portal**.

### 2.1 Webmail Verification Architecture

```
+------------------------------------+             +----------------------------------+
|          External Service          |             |   Herbal Harbour Mail Service    |
| (Google Accounts / TikTok Security)|             | (SMTP Daemon on Port 25 / 2525)  |
+-----------------+------------------+             +-----------------+----------------+
                  | Inbound SMTP MIME Message                        |
                  +------------------------------------------------->+
                                                                     | Parses MIME & Stores
                                                                     v
                                                   +----------------------------------+
                                                   |      SQLite Mailbox Store        |
                                                   |  (mail_service/data/emails.db)   |
                                                   +-----------------+----------------+
                                                                     |
                                      +------------------------------+------------------------------+
                                      |                                                             |
                                      v                                                             v
                       +------------------------------+                             +------------------------------+
                       |    Webmail REST API Engine   |                             |    HTML5 / Tailwind UI       |
                       |    (http://localhost:8025/)  |                             | (http://localhost:8025/webmail)|
                       +--------------+---------------+                             +--------------+---------------+
                                      |                                                            |
                                      v                                                            v
                       +------------------------------+                             +------------------------------+
                       | Curl / JSON Inspection Query |                             | Visual OTP Code Retrieval    |
                       | GET /api/messages?...        |                             | One-Click Copy to Clipboard  |
                       +------------------------------+                             +------------------------------+
```

### 2.2 Webmail UI Step-by-Step Retrieval

1. **Launch Webmail Portal**: Open your browser and navigate to:
   ```
   http://localhost:8025/
   ```
2. **Select Account Mailbox**:
   - In the account switcher dropdown or sidebar, select either `admin@herbalharbour.co.za` or `info@herbalharbour.co.za` depending on which account you are registering.
3. **Locate Verification Message**:
   - **Google Verification**: Sent by `noreply@google.com` with subject: `Verify your email address`.
   - **TikTok Verification**: Sent by `verify@tiktok.com` or `account@tiktok.com` with subject: `Verification Code` or `TikTok Account Verification`.
4. **Inspect & Copy OTP**:
   - Click the message to preview its contents.
   - Extract the bold 6-digit numeric verification code (e.g., `482910` or `839102`).
   - Paste the code into the active Google or TikTok registration tab.

### 2.3 Programmatic / Terminal OTP Inspection (REST API)

If operating in headless mode or automating verification, fetch the latest inbox message directly via the Webmail REST API:

```bash
# Query the latest message for admin@herbalharbour.co.za
curl -s "http://localhost:8025/api/messages?account=admin@herbalharbour.co.za&folder=inbox" | jq '.[0]'

# Query the latest message for info@herbalharbour.co.za
curl -s "http://localhost:8025/api/messages?account=info@herbalharbour.co.za&folder=inbox" | jq '.[0]'
```

Example response payload:
```json
{
  "id": 14,
  "account": "admin@herbalharbour.co.za",
  "folder": "inbox",
  "sender": "Google <noreply@google.com>",
  "subject": "Verify your email address",
  "body_text": "Verify your email address. Enter this code to finish setting up your Google Account: 482910",
  "received_at": "2026-11-10T12:20:00Z"
}
```

### 2.4 OTP Lifetime & Timing Windows

- **Google Account OTP**: Valid for **15 minutes**.
- **TikTok Account OTP**: Valid for **60 seconds**.
  > ⚠️ **CRITICAL TIKTOK TIMING NOTICE**: Due to TikTok's aggressive 60-second OTP expiration window, keep `http://localhost:8025/` open in a split-screen browser pane *before* clicking "Send code" on TikTok.

---

## 3. YouTube Account & Brand Channel Registration Guide

### 3.1 Google Account Creation with Custom Domain Email

YouTube requires an underlying Google Account identity. Instead of creating an unbranded consumer `@gmail.com` address, create a Google Account bound directly to `admin@herbalharbour.co.za`:

1. Open an incognito browser window and navigate to:
   ```
   https://accounts.google.com/signup/withoutgmail
   ```
   *(Alternatively, navigate to `https://accounts.google.com/signup` and select the option: **"Use my current email address instead"**).*
2. Complete the identity input fields:
   - **First name**: `Herbal`
   - **Last name**: `Harbour Admin` (or `Apothecary`)
   - **Your email address**: `admin@herbalharbour.co.za`
   - **Password**: Generate an ultra-secure passphrase (minimum 20 characters containing uppercase, lowercase, numbers, and symbols).
3. Click **Next**.

### 3.2 Webmail Verification & Account Finalization

1. Google displays: *"Verify your email address. Enter the code we sent to admin@herbalharbour.co.za"*.
2. Switch to your Localhost Webmail portal at `http://localhost:8025/`.
3. Open the inbox for `admin@herbalharbour.co.za`.
4. Open the message from `noreply@google.com`, copy the 6-digit verification code, and paste it into Google's prompt.
5. Click **Verify**.
6. Complete Account Profile Parameters:
   - **Date of Birth**: Must reflect an age of **18 years or older** (e.g., Company Director / Founder birth date). *Do not enter an age under 18; cannabis-related entities will be permanently disabled if associated with a minor.*
   - **Gender**: Select *"Rather not say"* or enterprise preference.
   - **Recovery Mobile**: Enter a verified South African corporate mobile number (`+27 XX XXX XXXX`).
7. Accept Google's Terms of Service and Privacy Policy.

### 3.3 Account Hardening, 2FA & Recovery Provisioning

1. Navigate directly to Google Account Security:
   ```
   https://myaccount.google.com/security
   ```
2. Enable **2-Step Verification (2FA)**:
   - **Primary 2FA**: Configure an **Authenticator App (TOTP)** (scan QR code using Bitwarden, 1Password, or Google Authenticator).
   - **Single-Use Backup Codes**: Generate and download the ten 8-digit single-use backup codes. Store them in the corporate encrypted vault.
3. Configure Cross-Recovery Contacts:
   - **Recovery Email**: `info@herbalharbour.co.za`.
   - **Recovery Phone**: Corporate mobile line (`+27`).

### 3.4 YouTube Brand Channel Provisioning

> ⚠️ **ARCHITECTURAL MANDATE**: Do NOT create a personal channel directly on the personal Google profile. You must create a **Brand Account Channel**. Brand Channels allow multiple corporate identities to administer content with granular permissions and prevent channel destruction if a personal profile changes.

1. Navigate to the YouTube Channel Switcher:
   ```
   https://www.youtube.com/channel_switcher
   ```
   *(Confirm you are authenticated as `admin@herbalharbour.co.za`)*.
2. Click **Create a channel**.
3. Set **Channel Name**: `Herbal Harbour`.
4. Set **Channel Handle**: `@herbalharbour`.
   - *Fallback Handle Hierarchy if `@herbalharbour` is claimed*:
     1. `@herbalharbourza`
     2. `@herbalharbour_za`
     3. `@herbalharbourdispensary`
     4. `@herbalharbourofficial`
5. Accept the Brand Account Terms and click **Create**.

### 3.5 Multi-Tier Feature Eligibility & Phone Verification

YouTube Studio categorizes creator capabilities into three feature tiers. To enable custom thumbnails, videos longer than 15 minutes, and automated API publishing, unlock **Intermediate Features** immediately:

1. Navigate to YouTube Studio:
   ```
   https://studio.youtube.com/
   ```
2. In the bottom-left sidebar, click **Settings (Gear Icon)** -> **Channel** -> **Feature eligibility**.
3. **Standard Features**: Enabled automatically upon channel creation (video uploads, playlist creation, adding collaborators).
4. **Intermediate Features**:
   - Click **Verify phone number** (`https://www.youtube.com/verify`).
   - Select Country: `South Africa (+27)`.
   - Choose: *Text me the verification code*.
   - Input corporate mobile number and submit.
   - Enter the 6-digit SMS verification code to unlock:
     - Custom video thumbnails (essential for brand recognition).
     - Videos longer than 15 minutes.
     - Live streaming capability.
5. **Advanced Features**:
   - Submit channel history or video ID verification to prepare for expanded daily upload quotas and YouTube Data API v3 scale.

### 3.6 Permissions Delegation (Admin vs Manager Roles)

To guarantee operational continuity while isolating root credentials:

1. In YouTube Studio (`https://studio.youtube.com/`), go to **Settings** -> **Permissions**.
2. Click **Invite**.
3. In the Email field, enter: `info@herbalharbour.co.za`.
4. In the Access role dropdown, select: **Manager**.
   - *Manager Scope*: Can upload content, edit metadata, delete videos, view analytics, and manage live streams. Cannot delete the channel or alter root ownership.
5. Click **Done** -> **Save**.
6. Switch to Localhost Webmail (`http://localhost:8025/`) under `info@herbalharbour.co.za`.
7. Open the invitation email from YouTube and click **Accept Invitation**.

### 3.7 Visual Branding, Assets & Metadata Configuration

Navigate to YouTube Studio -> **Customization**:

#### Visual Branding Specifications
- **Profile Picture (Avatar)**:
  - Format: High-resolution PNG or JPG, circular crop.
  - Dimensions: **800 x 800 px** (minimum 98 x 98 px), maximum 4 MB.
  - Visual: High-contrast Herbal Harbour botanical emblem (emerald leaf on obsidian background `#10241e`).
- **Banner Image (Channel Art)**:
  - Dimensions: **2048 x 1152 px** (16:9 aspect ratio), maximum 6 MB.
  - Safe Text & Logo Zone: **1235 x 338 px** centered horizontally and vertically.
  - Color Palette: Deep Forest `#10241e` / `#143329`, Emerald Leaf `#25a86a`, Amber accents `#f59e0b`.
  - Copy: Brand mark "Herbal Harbour", tagline *"South Africa's Premier Medicinal Cannabis & Apothecary"*, Cape Town coordinates, and website `herbalharbour.co.za`.
- **Video Watermark**:
  - Dimensions: **150 x 150 px** transparent square PNG.
  - Timing: Set to *Entire video*.

#### Channel Description & Legal Disclaimer
Paste the following compliant text into **Basic info** -> **Description**:

```text
Welcome to Herbal Harbour — South Africa's trusted medicinal cannabis dispensary, botanical genetics apothecary, and patient wellness resource.

Cultivated with organic care and validated by ISO-17025 accredited third-party laboratory testing, our channel provides educational insights into cannabinoid therapy, terpene profiles, medical cannabis legislation, and responsible botanical wellness.

📍 Dispensary Hub: V&A Waterfront & Gardens, Cape Town, Western Cape, South Africa
🌐 Official Dispensary & Lab COA Reports: https://herbalharbour.co.za
📞 Dispensary Helpline: +27 (0)21 448 9120
✉️ General Inquiries: info@herbalharbour.co.za
📦 Patient Support: orders@herbalharbour.co.za

⚖️ COMPLIANCE & LEGAL DISCLAIMER:
Content published on this channel is strictly for educational, scientific, and horticultural purposes under the South African Cannabis for Private Purposes Act (Act 7 of 2024) and SAHPRA medical frameworks. This channel does not sell, facilitate transactions, or deliver scheduled or illicit substances via YouTube. Strictly 18+ only.
```

#### Social Links
Add custom links displayed in the channel header:
1. `Website`: `https://herbalharbour.co.za`
2. `TikTok`: `https://www.tiktok.com/@herbalharbour`
3. `Instagram`: `https://instagram.com/herbalharbour`

---

### 3.8 YouTube Data API v3 & Cross-Posting Readiness (R3 Handshake)

To enable automated cross-posting of Instagram Reels to YouTube Shorts (R3):

1. Access Google Cloud Console:
   ```
   https://console.cloud.google.com/
   ```
   *(Authenticate using `admin@herbalharbour.co.za`)*.
2. Create a new Google Cloud Project: `herbal-harbour-social`.
3. Go to **APIs & Services** -> **Library**, search for **YouTube Data API v3**, and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - User Type: *External*.
   - App Name: `Herbal Harbour Cross-Poster`.
   - User Support Email: `admin@herbalharbour.co.za`.
   - Scopes: Add `https://www.googleapis.com/auth/youtube.upload` and `https://www.googleapis.com/auth/youtube`.
5. Create OAuth 2.0 Credentials:
   - Navigate to **Credentials** -> **Create Credentials** -> **OAuth Client ID**.
   - Application Type: *Desktop App* (or *Web Application* with redirect URI `http://localhost:8080/oauth2callback`).
   - Download the generated credentials JSON file.
6. Populate the application environment configuration (`.env`):
   ```bash
   YOUTUBE_CLIENT_ID="<YOUR_GOOGLE_CLIENT_ID>"
   YOUTUBE_CLIENT_SECRET="<YOUR_GOOGLE_CLIENT_SECRET>"
   YOUTUBE_REFRESH_TOKEN="<OAUTH_REFRESH_TOKEN>"
   YOUTUBE_CHANNEL_ID="<HERBAL_HARBOUR_CHANNEL_ID>"
   ```

---

## 4. TikTok Business Account Registration Guide

### 4.1 Account Creation via Custom Email

1. Open your browser or the TikTok mobile application and go to:
   ```
   https://www.tiktok.com/signup
   ```
2. Select **Use phone or email**.
3. Click the tab: **Log in with email or username** / **Sign up with email**.
4. Set **Date of Birth**:
   - Must be **18 years or older** (e.g., Company Director / Founder birth date). *Accounts created with ages under 18 cannot be converted to Business Accounts and are subject to severe algorithmic restrictions.*
5. Enter Corporate Email: `info@herbalharbour.co.za` (or `admin@herbalharbour.co.za`).
6. Set Password: 8 to 20 characters with letters, numbers, and symbols.
7. Click **Send code**.

### 4.2 OTP Verification via Localhost Webmail

1. TikTok starts an active 60-second countdown timer.
2. Immediately switch to the Localhost Webmail tab at `http://localhost:8025/`.
3. Select the inbox for the registering address (`info@herbalharbour.co.za` or `admin@herbalharbour.co.za`).
4. Open the email from `verify@tiktok.com` / `account@tiktok.com`.
5. Copy the 6-digit numeric verification code (e.g., `719402`).
6. Paste the OTP into TikTok before the 60-second countdown elapses and click **Next**.

### 4.3 Handle Reservation & Identity Protection

1. TikTok prompts: *Create username*.
2. Enter the primary brand handle:
   ```
   @herbalharbour
   ```
3. *Fallback Matrix if `@herbalharbour` is claimed*:
   - Priority 2: `@herbalharbourza`
   - Priority 3: `@herbalharbour_sa`
   - Priority 4: `@herbalharbourdispensary`
   - Priority 5: `@herbalharbour_official`
4. Click **Sign up**.

### 4.4 Account Hardening & 2-Step Verification (2FA)

1. In TikTok, go to **Settings and Privacy** -> **Security** -> **2-step verification** (`https://www.tiktok.com/setting`).
2. Turn on **2-step verification**.
3. Select at least two verification methods:
   - **Authenticator App (TOTP)**: Recommended for shared team access. Scan QR code into the team vault.
   - **SMS Verification**: Link the verified South African corporate mobile number (`+27`).
   - **Email OTP**: Bound to the verified `@herbalharbour.co.za` address.
4. Verify that the **Recovery Email** is active.

### 4.5 Switching to TikTok Business Account

A standard personal TikTok account cannot display clickable external website links or access the commercial Content Posting API. Converting to a Business Account is immediate and free:

1. Navigate to **Settings and Privacy** -> **Account**.
2. Click **Switch to Business Account** (or visit TikTok Business Center at `https://ads.tiktok.com`).
3. Select Category:
   - Primary: **Health & Wellness**
   - Secondary: **Retail & Shopping**
4. Review and accept the TikTok Business Account Terms of Service.
5. Click **Next** to finalize the upgrade.

### 4.6 Profile, Bio & Business Desk Optimization

Navigate to **Edit Profile**:

#### Profile Assets & Parameters
- **Profile Photo**:
  - Dimensions: **200 x 200 px** square/circular crop.
  - Consistent Herbal Harbour green botanical emblem.
- **Display Name**: `Herbal Harbour`
- **Username**: `@herbalharbour`
- **Compliant Bio** (Strict 80-character maximum):
  ```text
  🌿 SA's Premier Medical Cannabis & CBD Apothecary. Cape Town & Nationwide 🇿🇦 18+
  ```
  *(Exactly 79 characters — informative, compliant, location-tagged, 18+ gated).*
- **Website Link**:
  - Configure to: `https://herbalharbour.co.za`
- **Business Email Action Button**:
  - Configure to: `info@herbalharbour.co.za`
- **Business Phone / WhatsApp Action Button**:
  - Configure to: `+27 21 448 9120`

---

### 4.7 TikTok Content Posting API & Developer Registration (R3 Handshake)

To prepare for automated TikTok video publishing via the R3 cross-posting engine:

1. Access the TikTok Developer Portal:
   ```
   https://developers.tiktok.com/
   ```
2. Log in using the `@herbalharbour` business account credentials.
3. Click **Create an App**:
   - App Name: `Herbal Harbour AutoPoster`.
   - App Category: *Business & Marketing*.
4. Add Products to the App:
   - Add **Content Posting API** (Direct Post).
   - Add **Login Kit** (for OAuth 2.0 user authorization).
5. Configure Permission Scopes:
   - `user.info.basic`: Account identity verification.
   - `video.upload`: Upload video binaries.
   - `video.publish`: Publish directly to the TikTok feed.
6. Developer Notes on Sandbox vs Production:
   - *Direct Post API Endpoint:* `POST https://open.tiktokapis.com/v2/post/publish/video/init/`
   - *Query Creator Info:* `POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/`
   - *Sandbox Policy:* Unaudited applications post videos with visibility automatically forced to `SELF_ONLY` (private). Upon passing TikTok's compliance audit, public visibility (`PUBLIC_TO_EVERYONE`) is activated.
7. Record credentials in the application `.env`:
   ```bash
   TIKTOK_CLIENT_KEY="<YOUR_TIKTOK_CLIENT_KEY>"
   TIKTOK_CLIENT_SECRET="<YOUR_TIKTOK_CLIENT_SECRET>"
   TIKTOK_ACCESS_TOKEN="<OAUTH_ACCESS_TOKEN>"
   TIKTOK_OPEN_ID="<HERBAL_HARBOUR_TIKTOK_OPEN_ID>"
   ```

---

## 5. Regulatory Compliance, Policy Guardrails & Shadowban Prevention

Operating a medical cannabis and botanical genetics brand requires vigilant policy compliance to avoid algorithmic strikes, shadowbans, or permanent suspensions.

### 5.1 South African Statutory Framework (Act 7 of 2024 & POPIA)

1. **Cannabis for Private Purposes Act (Act No. 7 of 2024)**:
   - Decriminalizes adult private cultivation and personal possession in private spaces.
   - Prohibits unauthorized commercial trade outside licensed medical / therapeutic cannabis frameworks.
   - All social content must emphasize patient education, botanical cultivation, terpene profiles, and medical cannabis guidance rather than illicit transactional solicitations.
2. **POPIA (Protection of Personal Information Act No. 4 of 2013)**:
   - Direct messages, user comments, email inquiries, and patient inquiries received via YouTube and TikTok must be handled in strict accordance with POPIA data privacy standards.
3. **Mandatory 18+ Adult Gating**:
   - South African law prohibits marketing cannabis to minors. All accounts and videos must enforce 18+ age restrictions.

### 5.2 YouTube Policy Compliance (Regulated Goods)

YouTube strictly prohibits content that facilitates the sale of regulated or controlled substances:

#### Allowed Content Categories
- Scientific analysis of cannabinoid pharmacology (CBD, THC, CBG, CBN) and terpenes (myrcene, limonene, caryophyllene).
- Organic horticultural tutorials (soil preparation, lighting, nutrient cycles, trichome maturity).
- Unboxing laboratory COA (Certificate of Analysis) reports and HPLC potency testing discussions.
- South African legislative updates regarding Act 7 of 2024 and SAHPRA medicinal frameworks.

#### Prohibited Content Categories (Immediate Strike)
- Direct purchase calls to action: *"Click the link below to purchase 10g of Flower for R800"*.
- Posting phone numbers or messaging links with instructions to place orders for scheduled substances.
- Depicting illicit consumption or excessive dosage.

#### Mandatory Video Upload Setting
- Audience: Always select **"No, it's not made for kids"**.
- Age Restriction (Advanced): Select **"Yes, restrict my video to viewers over 18"**.

### 5.3 TikTok Policy Compliance & Keyword Whitelist

TikTok enforces automated natural language processing and computer vision filters that instantly flag cannabis-related content:

#### Prohibited Keywords (Triggers Auto-Flag, Mute, or Shadowban)
❌ `Weed for sale`, `Buy THC`, `Cheap bud`, `Dabs`, `Get high`, `Order weed online`, pricing in captions (`R150/g`, `$10/gram`), `Stoner`, `Blunt`, `Bong hits`.

#### Approved Educational Terminology (Safe Whitelist)
✅ `Medicinal cannabis`, `Botanical wellness`, `CBD apothecary`, `Hemp remedies`, `Organic genetics`, `Terpenes`, `Trichomes`, `ISO lab tested`, `Holistic health`, `South African flora`, `Cape Town apothecary`, `Endocannabinoid system`, `Phytocannabinoids`.

---

## 6. Operational Runbook, Recovery & Credential Vault

### 6.1 Credential Matrix Template (.env)

Maintain this credential layout in the secure `.env` file for the project:

```env
# ==============================================================================
# HERBAL HARBOUR SOCIAL MEDIA & EMAIL CREDENTIAL VAULT (.env)
# ==============================================================================

# Core Corporate Identifiers
HERBAL_HARBOUR_DOMAIN="herbalharbour.co.za"
ADMIN_EMAIL="admin@herbalharbour.co.za"
INFO_EMAIL="info@herbalharbour.co.za"
HELPLINE_PHONE="+27214489120"

# Localhost Webmail Integration (Port 8025)
WEBMAIL_BASE_URL="http://localhost:8025"
WEBMAIL_API_URL="http://localhost:8025/api"

# YouTube / Google Cloud API Integration (R3 Handshake)
YOUTUBE_HANDLE="@herbalharbour"
YOUTUBE_CHANNEL_ID=""
GOOGLE_PROJECT_ID="herbal-harbour-social"
YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
YOUTUBE_REFRESH_TOKEN=""

# TikTok Developer & Content Posting API (R3 Handshake)
TIKTOK_HANDLE="@herbalharbour"
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""
TIKTOK_ACCESS_TOKEN=""
TIKTOK_OPEN_ID=""

# Instagram Source Configuration (R3 Polling)
INSTAGRAM_ACCOUNT_ID=""
INSTAGRAM_ACCESS_TOKEN=""
```

### 6.2 Emergency Account Recovery Procedure

1. **Lost Authenticator / 2FA Device**:
   - **Google / YouTube**: Access Google Account recovery using the single-use 8-digit backup codes downloaded during setup.
   - **TikTok**: Trigger SMS OTP recovery to the registered corporate mobile number (`+27 21 448 9120` or verified business SIM).
2. **Password Compromise or Immediate Reset**:
   - Navigate to the respective service login page and request a password reset to `admin@herbalharbour.co.za`.
   - Access the password reset link immediately through the Localhost Webmail Portal (`http://localhost:8025/`).
   - Create a new 20+ character random passphrase.
   - Revoke all active sessions:
     - Google: `https://myaccount.google.com/device-activity`
     - TikTok: `Settings and Privacy` -> `Security` -> `Manage devices`.

---

## 7. Acceptance Criteria & Verification Checklist

| Item | Requirement / Checkpoint | Verification Method | Pass / Fail |
| :---: | :--- | :--- | :---: |
| **AC-1** | Google Account registered with `admin@herbalharbour.co.za` without Gmail | Check Google Account profile at `myaccount.google.com` displays `admin@herbalharbour.co.za` | [ ] |
| **AC-2** | Email OTP received and validated via Localhost Webmail (Port 8025) | Inspect R1 webmail inbox log; confirm receipt of `noreply@google.com` email | [ ] |
| **AC-3** | 2FA activated with TOTP & 10 Backup Codes stored in vault | Verify 2-Step Verification shows "ON" in Google Security; codes archived | [ ] |
| **AC-4** | Brand Account YouTube channel `@herbalharbour` created | Verify channel exists at `https://youtube.com/@herbalharbour` | [ ] |
| **AC-5** | Intermediate features verified via +27 phone SMS | Check YouTube Studio Feature Eligibility status shows "Intermediate: Enabled" | [ ] |
| **AC-6** | `info@herbalharbour.co.za` assigned as YouTube Channel Manager | Check YouTube Studio -> Settings -> Permissions lists `info@` with Manager role | [ ] |
| **AC-7** | Channel avatar (800x800) and banner (2048x1152) configured | Visual inspection of YouTube channel homepage and branding assets | [ ] |
| **AC-8** | Channel bio includes Act 7 of 2024 compliance and 18+ disclaimer | Inspect YouTube "About" tab description text for statutory disclaimer | [ ] |
| **AC-9** | TikTok account created with custom email via webmail OTP (Port 8025) | Verify sign-in to TikTok using `admin@` or `info@` credentials | [ ] |
| **AC-10** | TikTok handle `@herbalharbour` reserved | Check profile URL `https://tiktok.com/@herbalharbour` | [ ] |
| **AC-11** | TikTok account switched to Business Account (Health & Wellness) | Check TikTok profile displays "Business Account" badge & Business Suite access | [ ] |
| **AC-12** | TikTok bio configured under 80 characters with website & phone | Inspect TikTok profile: bio displays website link and email action | [ ] |
| **AC-13** | Google Cloud Project & YouTube Data API v3 enabled with OAuth Client | Confirm client secrets file generated and test upload script connects | [ ] |
| **AC-14** | TikTok Developer App created with Content Posting API scopes | Confirm `video.publish` and `video.upload` scopes provisioned in developer portal | [ ] |

---
*End of Herbal Harbour YouTube & TikTok Account Registration Guide.*
