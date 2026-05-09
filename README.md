# TechPhono Repair App

TechPhono is a mobile repair and service management application built with Expo and React Native, backed by Firebase. It supports the full workflow for a repair shop: customer sign-up, repair booking, live status tracking, repair history, admin review and status updates, service management, and shop item management.

The codebase is structured to be public-repo friendly: local secrets are kept out of source control, Firebase rules are committed separately, and the app uses environment-based configuration for all external services.

## What The App Does

### Customer experience

- Create an account and sign in with Firebase Auth.
- Submit a repair booking with device details and issue description.
- Track repair progress in real time.
- View closed repair history.
- Submit feedback after a repair is completed.
- Browse services and shop items.
- Use the WhatsApp shortcut for direct shop contact.

### Admin experience

- Open a protected admin dashboard.
- View active repairs and repair history.
- Update repair status from one stage to the next.
- Add internal notes to repair records.
- Archive or close repairs.
- Add, edit, and soft-delete services.
- Add and remove shop items with image uploads through Cloudinary.

## Tech Stack

### App runtime

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router for file-based routing

### Firebase backend

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions
- Firestore security rules
- Storage security rules

### Supporting services

- Cloudinary for client-side item image uploads
- WhatsApp deep-linking for repair booking messages
- AsyncStorage for local persistence where needed

### Tooling

- ESLint
- TypeScript type checking
- Expo CLI / EAS-ready project structure

## Key Features

### Authentication

- Email and password sign-up and login
- Password reset via Firebase email action links
- Native session persistence through Firebase Auth + AsyncStorage
- Admin route gating based on configured admin emails

### Repair workflow

- Repair booking creates a Firestore repair document
- Real-time tracking updates are delivered through Firestore listeners
- Repairs move through the standard lifecycle:
  - pending
  - received
  - diagnosing
  - repairing
  - repaired
  - completed
  - cancelled

### Admin workflow

- Admin dashboard shows the current repair load and status snapshot
- Active repairs and history are separated by status
- Repair detail screens support status changes and note updates
- Completed and cancelled repairs are filtered into history views

### Catalog management

- Services can be created, edited, and soft-deleted
- Shop items can be added and removed from the catalog
- Item images are uploaded directly to Cloudinary

### Security and public-release hardening

- Environment variables are used for all sensitive config
- Firebase Firestore and Storage rules are committed separately
- Local build output and Firebase CLI state are ignored in Git
- Debug and validation logic is centralized in `config/security.ts`

## Architecture Overview

### App layers

1. Presentation layer

   - `app/` contains all screens and routes.
   - `components/` contains reusable UI pieces like the logo, timeline, feedback modal, and floating action button.

2. State and business logic

   - `context/AuthContext.tsx` handles authentication state and auth actions.
   - `context/TechPhonoContext.tsx` manages cart and repair operations.
   - `utils/` contains validation, error handling, status helpers, and session logic.

3. Data and services

   - `services/firebaseClient.ts` initializes Firebase app, Auth, Firestore, and Storage.
   - `services/whatsapp.ts` builds the repair booking message and opens WhatsApp.
   - `services/dynamicLinks.ts` parses Firebase action links and wrapped dynamic links.

4. Security and configuration

   - `config/security.ts` reads environment variables and validates required values.
   - `config/securityEnhanced.ts` includes sanitization, password checks, logging helpers, and CSP settings.
   - `middleware/apiSecurity.ts` manages request/security token handling.

### Data model

The app uses Firestore collections instead of a relational database.

#### `repairs`

Stores repair requests and their lifecycle state.

Typical fields:

- `job_id`
- `name`
- `phone`
- `device_type`
- `model`
- `issue`
- `service`
- `status`
- `admin_notes`
- `rating`
- `feedback`
- `is_deleted`
- `deleted_at`
- `user_id`
- `created_at`
- `updated_at`

#### `items`

Stores shop inventory items.

Typical fields:

- `name`
- `description`
- `price`
- `image_url`
- `is_active`
- `is_deleted`
- `created_at`

#### `services`

Stores repair service offerings.

Typical fields:

- `name`
- `description`
- `price`
- `is_deleted`
- `created_at`
- `updated_at`

#### `users`

Stores profile and verification metadata.

Typical fields:

- `email`
- `name`
- `phone`
- `avatar_url`
- `isVerified`
- `verifiedAt`
- `authProvider`
- `createdAt`
- `updatedAt`

#### `users/{uid}/security_tokens`

Stores short-lived token data such as CSRF protection payloads.

## Project Structure

```text
app/
  _layout.tsx
  index.tsx
  booking.tsx
  feedback.tsx
  repair-history.tsx
  track-repair.tsx
  reset-password.tsx
  auth/
  admin/
  (tabs)/

components/
  AppLogo.tsx
  AuthFeedback.tsx
  RepairTimeline.tsx
  SplashScreen.tsx
  WhatsAppFAB.tsx
  ...

config/
  security.ts
  securityEnhanced.ts

constants/
  theme.ts
  typography.ts
  services.ts
  repairSteps.ts
  products.ts

context/
  AuthContext.tsx
  TechPhonoContext.tsx

functions/
  src/index.ts
  package.json
  tsconfig.json

middleware/
  apiSecurity.ts
  securityMonitor.ts

services/
  firebaseClient.ts
  dynamicLinks.ts
  whatsapp.ts

types/
  cart.ts
  database.ts

utils/
  responsive.ts
  statusUtils.ts
  validation.ts
  errorHandler.ts
  sessionManager.ts
```

## Screens And Routes

### Public and auth routes

- `/` - startup redirect and splash handling
- `/auth/login` - sign in
- `/auth/register` - create account
- `/auth/forgot-password` - password reset request
- `/auth/callback` - Firebase action link callback handler
- `/auth/reset-password` - password reset screen

### Customer routes

- `/(tabs)` - main user navigation
- `/booking` - submit a repair request
- `/track-repair` - track a repair by job ID
- `/repair-history` - view previous repair requests
- `/feedback` - submit repair feedback

### Admin routes

- `/admin` - dashboard
- `/admin/repairs` - active repairs list
- `/admin/history` - completed and cancelled repairs
- `/admin/repair/[id]` - repair detail screen
- `/admin/manage-items` - catalog items
- `/admin/manage-services` - service catalog

## Authentication Flow

### Sign up

1. User enters name, email, password, and phone.
2. Firebase Auth creates the account.
3. User profile data is written to Firestore.
4. The app marks the user session as active.
5. The main app redirects based on the auth state.

### Sign in

1. User enters email and password.
2. Firebase Auth validates credentials.
3. Firebase persistence stores the session on device.
4. The app routes the user to the correct area.

### Password reset

1. User requests a reset email.
2. Firebase sends an action link to the configured app URL.
3. The callback route parses the `mode` and `oobCode` values.
4. The reset screen confirms the code and updates the password.

## Repair Booking Flow

1. Customer opens the booking screen.
2. They select a service and describe the device problem.
3. The app generates a job ID.
4. A Firestore document is created in `repairs`.
5. A WhatsApp message is built so the customer can share the booking quickly.
6. The repair appears in the admin dashboard and tracking screens.

## Real-Time Sync Behavior

The app uses Firestore listeners, not a polling loop, for live updates.

- Admin dashboards subscribe to `repairs` changes.
- Repair tracking screens subscribe to the matching job ID.
- Catalog screens refresh after Firestore mutations.
- Closed jobs are filtered into history views automatically.

## Security Model

### App-side checks

- `SecurityConfig.adminEmails` controls which accounts the UI treats as admins.
- Environment values are read through `config/security.ts`.
- Inputs are sanitized before being persisted or used in requests.

### Firestore and Storage rules

- Firestore rules require authenticated access for user data.
- Privileged writes require the Firebase `admin` custom claim.
- Storage rules allow public reads for item assets and user-scoped uploads for user directories.

### Public-repo hygiene

- `.env` is intentionally not committed.
- Firebase CLI state and local build output are ignored.
- Service account files should remain local-only if you use them for admin tooling.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values for your Firebase project, Cloudinary account, and admin settings.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here

EXPO_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com

EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES=60
EXPO_PUBLIC_MAX_LOGIN_ATTEMPTS=5
EXPO_PUBLIC_LOCKOUT_DURATION_MINUTES=15

EXPO_PUBLIC_APP_NAME=TechPhono Repair App
EXPO_PUBLIC_SUPPORT_EMAIL=support@techphono.com
EXPO_PUBLIC_WHATSAPP_NUMBER=+1234567890

EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_APP_URL=https://your-domain.example
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password authentication.
3. Register your Android and iOS app bundles in Firebase.
4. Copy the Firebase web config values into `.env`.
5. Create a Firestore database.
6. Enable Firebase Storage.
7. Deploy the committed Firestore and Storage rules.
8. If you use admin-only writes, set the `admin` custom claim for privileged accounts.
9. Configure the authorized action-link domain for password reset.

Related docs:

- [Firebase setup guide](FIREBASE_SETUP.md)
- [Dynamic links guide](docs/DYNAMIC_LINKS.md)

## Cloudinary Setup

The admin item screen uploads images directly to Cloudinary.

1. Create a Cloudinary account.
2. Create an unsigned upload preset.
3. Add the cloud name and upload preset to `.env`.
4. Test item creation in the admin panel.

If Cloudinary is not configured, the item upload screen will fail fast with a clear error.

## Cloud Functions

The `functions/` folder contains Firebase Cloud Functions code for server-side tasks.

Current function behavior:

- Sync Auth users into Firestore user documents.
- Keep verification metadata aligned with the authenticated user record.

Build and deploy from the `functions/` folder when you need to update Cloud Functions:

```bash
cd functions
npm install
npm run build
```

Use the Firebase CLI to deploy functions, rules, and indexes when you are ready.

## Installation

```bash
npm install
```

If you are setting up Firebase Functions as well:

```bash
cd functions
npm install
```

## Running The App

### Start the dev server

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

## Code Quality Checks

```bash
npm run lint
npm run typecheck
```

These checks are useful before pushing to GitHub or preparing a release build.

## Deployment Notes

### Expo / mobile builds

- Use EAS builds for store-ready Android and iOS binaries.
- Keep environment variables in the appropriate build profile.
- Verify that Firebase configuration is present in the build environment.

### Firebase deployment

- Deploy Firestore rules and indexes.
- Deploy Storage rules.
- Deploy Cloud Functions after building the `functions/` project.

### Public release checklist

- Confirm no `.env` file is committed.
- Confirm Firebase keys are only in environment config.
- Confirm no service account JSON files are tracked.
- Confirm `firebase-debug.log`, `.firebase/`, and Functions build output remain ignored.

## Troubleshooting

### App stays on the splash screen

- Run `npm start -c` to clear the Expo cache.
- Confirm Firebase environment variables are present.
- Make sure the app can initialize Firebase without falling back to demo config.

### Login or registration fails

- Confirm Email/Password sign-in is enabled in Firebase Auth.
- Verify the Firebase project ID and API key in `.env`.
- Check the console for `auth/...` error codes.

### Password reset email does not open the app

- Make sure `EXPO_PUBLIC_APP_URL` matches the authorized action-link domain.
- Confirm the callback route is reachable in the app.
- Verify the reset code is being passed through the callback correctly.

### Admin screens do not open

- Confirm the account email is included in `EXPO_PUBLIC_ADMIN_EMAILS`.
- Confirm the account has the `admin` custom claim if the Firestore rule requires it.
- Check that the user is authenticated before navigating to the admin route.

### Item image upload fails

- Confirm Cloudinary cloud name and upload preset are set.
- Confirm the upload preset allows the client upload flow you configured.

### Real-time updates are not appearing

- Confirm the device is online.
- Make sure Firestore listeners are allowed by the current security rules.
- Check that the repair document status is being updated in the same collection the app reads.

## Key Documentation

- [Responsive refactoring guide](RESPONSIVE_REFACTORING_GUIDE.md)
- [Responsive quick reference](RESPONSIVE_QUICK_REFERENCE.md)
- [Responsive refactoring summary](RESPONSIVE_REFACTORING_SUMMARY.md)
- [Implementation status](IMPLEMENTATION_STATUS.md)
- [Migration report](MIGRATION_REPORT.md)

## Security Reminders

- Never commit `.env` or service account credentials.
- Keep Cloudinary upload settings limited to the minimal required permissions.
- Review Firestore and Storage rules before a public release.
- Treat any local admin tooling as sensitive if it touches privileged Firebase actions.

## License

No license file is included in the repository. Add one before public redistribution if you want to define reuse terms.
