# FarmConnect

FarmConnect is a cross-platform marketplace for discovering local farms, buying produce and meats, booking slaughter appointments, and finding farm activities. It gives customers and farmers one place to manage local farm commerce instead of relying on scattered WhatsApp or social media groups.

## Features

### Customers

- Browse nearby farms and featured produce or meat listings.
- View farm profiles with ratings, certifications, products, slaughter offerings, and activities.
- Browse farms on a map using location-based discovery.
- Add produce and meat to a cart.
- Book slaughter appointments and split whole-animal costs with invitees.
- Register for Eid al-Adha slaughtering and track ticket status.

### Farmers and vendors

- Create a farm profile and choose a farm type: slaughter only, produce and meats, or mixed.
- Add produce, meat, whole-animal slaughter offerings, and activities.
- Add an image from the camera or photo library to an item.
- Set fixed or weight-based pricing and optionally track inventory.
- Create availability slots for slaughter and farm activities.
- Review and manage customer bookings.
- Manage Eid al-Adha registrations and assign time slots.

## Tech stack

- React Native with Expo SDK 57
- TypeScript
- Expo Router for file-based navigation
- HeroUI Native for native UI components
- Uniwind and Tailwind CSS utilities
- Supabase Auth for email/password, Google, and Facebook sign-in
- Supabase PostgreSQL for application data and Row Level Security
- Supabase Storage for item photos
- Expo Location and React Native Maps for farm discovery
- Expo Image Picker and Expo Image for photos
- React Native Reanimated and Gesture Handler for animation and interaction

## Prerequisites

- Node.js compatible with Expo SDK 57
- npm
- An Expo account
- Expo Go installed on an iOS or Android device
- A Supabase project with Auth enabled

Android Studio is not required to run the app on a physical device with Expo Go. It is only needed for a local Android emulator or native Android builds.

## Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_publishable_key
SUPABASE_DB_PASSWORD=your_database_password
```

Never commit `.env.local` or expose the database password in the client bundle. The `EXPO_PUBLIC_` values are intentionally available to the app.

### Supabase Auth

Email and password is enabled by default. For local testing you can turn off **Confirm email** under **Authentication > Providers > Email** so sign-up creates a session immediately.

Add these redirect URLs under **Authentication > URL Configuration**:

- `farmconnect://**` (app scheme)
- `exp://**` (Expo Go)
- `http://localhost:8081/**` (web)

Then enable social providers:

1. **Google** — create a Web OAuth client in Google Cloud, add the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI, and paste the client ID and secret into **Authentication > Providers > Google**.
2. **Facebook** — create a Facebook app, add the same Supabase callback URL as a valid OAuth redirect URI, enable the email permission, and paste the App ID and secret into **Authentication > Providers > Facebook**.

Disable the Clerk third-party auth integration in Supabase if it is still enabled.

## Database and Storage setup

Apply the migrations to the Supabase project. The Storage migration creates the public `item-photos` bucket and its upload policies:

```bash
node scripts/apply-supabase-sql.mjs \
  supabase/migrations/20260905180000_farmconnect_schema.sql \
  supabase/migrations/20260905180100_farmconnect_seed.sql \
  supabase/migrations/20260905190000_slot_reservation.sql \
  supabase/migrations/20260905200000_add_availability_slot_updated_at.sql \
  supabase/migrations/20260905210000_farm_price_tier.sql \
  supabase/migrations/20260906000000_item_photos.sql \
  supabase/migrations/20260908000000_supabase_auth.sql
```

The script requires `SUPABASE_DB_PASSWORD` in `.env.local`. Alternatively, run the SQL files in the Supabase SQL Editor. The item photos migration is safe to run again: it reuses the bucket and recreates the policies.

## Run with Expo Go

Install dependencies and start the development server:

```bash
npm install
npx expo start
```

Then:

1. Open Expo Go on your iOS or Android phone.
2. Put the phone and development computer on the same Wi-Fi network.
3. Scan the QR code shown in the Expo terminal or browser dashboard.
4. Choose a customer or farmer role, then sign up with email, Google, or Facebook.

If the phone cannot connect, try starting Expo with tunnel mode:

```bash
npx expo start --tunnel
```

After changing `.env.local`, restart Expo and clear its cache if needed:

```bash
npx expo start -c
```

## Other run commands

```bash
npm run web       # Run in a browser
npm run ios       # Open the iOS simulator
npm run android   # Open an Android emulator
npx expo lint     # Run ESLint
npx tsc --noEmit  # Run TypeScript validation
```

The iOS simulator requires Xcode. The Android emulator requires Android Studio with the Android SDK, Platform-Tools, and an Android Virtual Device installed.

## Project structure

```text
src/app/          Expo Router screens and route layouts
src/components/   Reusable UI components
src/hooks/        Shared auth, profile, theme, and data hooks
src/lib/          Supabase, cart, upload, and domain utilities
supabase/         Database migrations and seed data
assets/           App icons, splash assets, and images
```

## Development notes

- Authentication is handled by Supabase Auth (email/password, Google, Facebook). Application data lives in Postgres with RLS keyed off `auth.uid()`.
- Photos are uploaded to the `item-photos` Supabase Storage bucket before the item record is saved.
- The app supports iOS, Android, and web, but some native capabilities behave differently in Expo Go and may require a development build.
