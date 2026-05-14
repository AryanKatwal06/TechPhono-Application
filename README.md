# TechPhono Repair App

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb?logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Functions-orange?logo=firebase)](https://firebase.google.com/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey)](https://reactnative.dev/)

TechPhono Repair App is a React Native CLI application for customer repair booking, live repair tracking, product browsing, WhatsApp-based checkout, and Firebase-backed admin operations.

## Overview

TechPhono is built for a repair shop workflow where customers can book a device repair, track status by Job ID, leave feedback, and browse a small catalog of accessories or parts. The same app also provides an admin workspace for managing incoming repair requests, updating repair statuses, maintaining service definitions, and publishing shop items.

The primary goal is to connect customer intake, service tracking, and store operations in one mobile-first system. Customers use the app to submit requests and follow progress. Staff use the admin screens to process repairs, manage catalog data, and respond through WhatsApp.

Target users:

- Customers who need phone or gadget repair services.
- Shop users who want to order accessories or parts.
- Admin staff who need to manage repair flow and catalog data.

## Features

### Customer Experience

- Repair booking form with name, phone, device type, model, service, and issue description.
- Repair request submission to Firestore with generated Job IDs.
- WhatsApp handoff after booking so the shop can confirm the request quickly.
- Real-time repair tracking by Job ID using Firestore queries and live listeners.
- Repair history view for signed-in users.
- Feedback submission with star rating and written comments.
- In-app support shortcut through a floating WhatsApp button.
- Shop catalog with accessories and parts pulled from Firestore.
- Cart management with add, increase, decrease, remove, and clear actions.
- WhatsApp checkout flow that sends the cart summary and total to the shop.

### Authentication and Account Management

- Email/password registration and login with Firebase Auth.
- Automatic sign-in after successful registration.
- Password reset request flow with Firebase action links.
- Deep-link callback handling for password reset links.
- Session persistence through AsyncStorage-backed Firebase Auth.
- Admin role detection by allowlisted email address.

### Admin Workspace

- Admin dashboard with repair statistics and quick actions.
- Active repair queue with live updates from Firestore.
- Detailed repair screen for updating status and writing internal notes.
- Repair history screen for closed or archived work.
- Service management for adding, editing, and soft-deleting services.
- Item management for adding shop items with image upload support.
- Cloudinary-backed image upload for catalog items.

### Platform and UX

- Bottom-tab navigation for the customer area.
- Deep linking support for app routes and password reset callbacks.
- Haptic feedback on key interactions.
- Responsive layouts tuned for phone, tablet, and larger screens.
- Skeleton loading and animated UI transitions.
- Safe area and gesture-handler integration for native navigation stability.

## Tech Stack

| Category | Stack |
| --- | --- |
| Frontend | React Native 0.81.5, React 19.1.0, TypeScript |
| Navigation | React Navigation v7, native stack, bottom tabs |
| State management | React Context, AsyncStorage persistence, React Query provider at the app root |
| Backend | Firebase Authentication, Firestore, Firebase Cloud Functions, Firebase Admin SDK |
| Storage and uploads | Firebase Storage configured in the app, Cloudinary used for admin item image uploads |
| Messaging and linking | WhatsApp click-to-chat, React Native Linking, deep links |
| UI and motion | react-native-linear-gradient, lucide-react-native, gesture handler, safe area context, screens, haptics |
| Local persistence | @react-native-async-storage/async-storage |
| Build tools | React Native CLI, Metro, TypeScript, ESLint, Babel, Android Gradle, CocoaPods |

## Project Structure

```text
TechPhono-Repair-App/
├── App.tsx
├── index.js
├── app/
│   ├── index.tsx
│   ├── booking.tsx
│   ├── track-repair.tsx
│   ├── repair-history.tsx
│   ├── feedback.tsx
│   ├── reset-password.tsx
│   ├── auth/
│   ├── admin/
│   └── (tabs)/
├── components/
├── config/
├── constants/
├── context/
├── navigation/
├── services/
├── types/
├── utils/
├── middleware/
├── android/
├── ios/
├── functions/
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

### Notable folders and files

- `App.tsx` wires the root providers and mounts the navigator.
- `navigation/RootNavigator.tsx` defines app routes, tabs, deep linking, and admin redirection.
- `navigation/router.tsx` provides router helpers and route-name mapping.
- `context/AuthContext.tsx` manages Firebase Auth state and role checks.
- `context/TechPhonoContext.tsx` owns cart state and Firestore repair helpers.
- `services/firebaseClient.ts` initializes Firebase Auth, Firestore, and Storage.
- `services/whatsapp.ts` builds WhatsApp message payloads for booking and checkout.
- `config/publicConfig.ts` contains the runtime public configuration values used by `SecurityConfig`.
- `functions/src/index.ts` contains the scheduled Firebase Cloud Function.
- `firestore.rules` and `storage.rules` hold the Firebase security rules.

## Installation Guide

### Prerequisites

- Node.js and npm.
- Android Studio with Android SDK and an emulator or device.
- JDK required by the Android toolchain.
- macOS and Xcode are required to run iOS locally.
- CocoaPods for iOS dependency installation.

### Setup

1. Install dependencies.

```bash
npm install
```

2. Review `config/publicConfig.ts` and confirm the Firebase, Cloudinary, WhatsApp, admin email, and app URL values match your environment.

3. For iOS on macOS, install pods.

```bash
npm run pods
```

### Run the app

Start the Metro bundler.

```bash
npm run start
```

Run on Android.

```bash
npm run android
```

Run on iOS from macOS.

```bash
npm run ios
```

### Run on an emulator or device

- Android: launch an emulator from Android Studio or connect a device with USB debugging enabled, then run `npm run android`.
- iOS: open the workspace from Xcode or use `npm run ios` on macOS.

## Environment Variables

This project does not currently rely on a standalone `.env` file. Runtime configuration is read from `config/publicConfig.ts` and exposed through `SecurityConfig`.

| Key | Used for |
| --- | --- |
| `firebaseApiKey` | Firebase app initialization |
| `firebaseAuthDomain` | Firebase Auth configuration |
| `firebaseProjectId` | Firestore/Auth project binding |
| `firebaseStorageBucket` | Firebase Storage configuration |
| `firebaseMessagingSenderId` | Firebase app configuration |
| `firebaseAppId` | Firebase app configuration |
| `cloudinaryCloudName` | Admin item image uploads |
| `cloudinaryUploadPreset` | Admin item image uploads |
| `adminEmails` | Admin role allowlist |
| `sessionTimeoutMinutes` | Security/session policy |
| `maxLoginAttempts` | Login rate limiting |
| `lockoutDurationMinutes` | Login lockout duration |
| `appName` | Application display name |
| `supportEmail` | Support contact configuration |
| `whatsappNumber` | WhatsApp support and order routing |
| `appUrl` | Firebase password-reset action links |
| `devMode` | Development behavior flags |
| `debugMode` | Validation and config checks |

## Scripts

| Script | Description |
| --- | --- |
| `npm run start` | Start the React Native Metro bundler. |
| `npm run start:clear` | Start Metro with cache reset. |
| `npm run android` | Build and launch the app on Android. |
| `npm run ios` | Build and launch the app on iOS. |
| `npm run android:release` | Launch Android using release mode. |
| `npm run bundle:android` | Generate the Android JS bundle and assets into `android/app/src/main`. |
| `npm run pods` | Install CocoaPods dependencies in `ios/`. |
| `npm run lint` | Run ESLint on the app screens. |
| `npm run typecheck` | Run the TypeScript compiler in no-emit mode. |

## Architecture / Workflow

1. The app boots from `index.js`, mounts `App.tsx`, and wraps the UI with gesture, safe-area, query, alert, auth, and domain providers.
2. `RootNavigator` configures the navigation stack, tab bar, deep links, and app theme.
3. `app/index.tsx` acts as the splash gate and routes users to login, the customer tab area, or the admin workspace depending on auth state and the admin allowlist.
4. `AuthContext` subscribes to Firebase Auth state changes, exposes the current user, and derives `isAdmin` from the configured admin email list.
5. Customer repair booking writes a document to Firestore `repairs`, then opens a WhatsApp message with the booking summary.
6. Repair tracking queries Firestore by `job_id` and listens with `onSnapshot` so the status view updates in real time.
7. The shop reads active Firestore `items`, stores the cart locally in AsyncStorage, and sends checkout details to WhatsApp.
8. The admin area reads and updates Firestore collections directly for repairs, items, and services.
9. Password reset uses Firebase action links, a deep-link callback screen, and the reset-password screen to finish the flow.

### Data flow

- `users`: created during sign-up and marked verified by the Firebase Admin scheduled function.
- `repairs`: created by booking and updated by tracking, feedback, and admin actions.
- `services`: read by the public home screen and managed by admins.
- `items`: read by the shop and managed by admins with Cloudinary image upload.

### State flow

- Global auth state lives in `AuthContext`.
- Cart state lives in `TechPhonoContext` and is persisted to AsyncStorage.
- UI feedback is handled through the alert context and local component state.

### API flow

- Firebase Auth handles login, sign-up, sign-out, password reset, and session persistence.
- Firestore stores repair requests, services, items, and user profile records.
- Cloudinary receives catalog image uploads from the admin item form.
- WhatsApp deep links handle booking confirmation and cart checkout.

## Screenshots

Add project screenshots here after capturing production or emulator views.

| Home | Booking | Repair Tracking | Admin Dashboard |
| --- | --- | --- | --- |
| Screenshot placeholder | Screenshot placeholder | Screenshot placeholder | Screenshot placeholder |

| Shop | Cart | Repair History | Service Management |
| --- | --- | --- | --- |
| Screenshot placeholder | Screenshot placeholder | Screenshot placeholder | Screenshot placeholder |

## Build & Release

### Android

Development install:

```bash
npm run android
```

Create the Android JS bundle and assets:

```bash
npm run bundle:android
```

For a production APK or AAB, use the Android project under `android/` with your signing configuration in place. Standard Gradle release targets are:

```bash
cd android
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

On macOS or Linux, use `./gradlew assembleRelease` and `./gradlew bundleRelease` instead.

### iOS

Install pods first:

```bash
npm run pods
```

Then run the app locally:

```bash
npm run ios
```

For production IPA builds, archive the app from Xcode after configuring signing, bundle identifiers, and release credentials.

## Performance / Optimizations

- Real-time Firestore listeners reduce manual refresh requirements.
- AsyncStorage persists auth and cart state across app restarts.
- Skeleton loaders improve perceived performance while data is loading.
- Haptic feedback provides lightweight interaction confirmation.
- Responsive sizing adapts layouts for phones, tablets, and larger screens.
- Splash gating avoids showing the splash screen on every launch.
- The navigation container uses a stable ref-based router layer for screen transitions and deep links.

## Security

- Firebase Auth protects sign-in, sign-up, password reset, and session persistence.
- Admin access is restricted by an email allowlist in `SecurityConfig`.
- Login attempts are rate-limited and lockouts are enforced through the auth/session utilities.
- Firestore and Storage rules are included in the repository for server-side access control.
- Password reset links are handled through Firebase action codes and deep-link validation.
- The backend includes a scheduled Firebase Cloud Function that syncs verification state into Firestore user documents.

## Known Issues / Limitations

- Native phone authentication is not implemented for React Native; `signUpWithPhone` currently throws an error instructing users to use email authentication.
- Product and repair checkout flows depend on WhatsApp, so there is no in-app payment gateway or order payment capture.
- Runtime configuration is stored in `config/publicConfig.ts` rather than a dedicated `.env` file.

## Future Improvements

- Move public configuration into a safer build-time or environment-driven setup.
- Add native OTP or phone-auth support for mobile sign-up flows.
- Add a payment gateway for product checkout and service booking deposits.
- Add richer admin analytics, export tools, and search/filter capabilities.
- Add automated tests for auth, booking, cart, and admin workflows.
- Replace ad hoc messaging with structured notifications or push messages if the business needs scale.

## Contributing

1. Fork or branch from the current repository.
2. Make focused changes that match the existing React Native and Firebase architecture.
3. Run `npm run lint` and `npm run typecheck` before submitting.
4. Validate Android or iOS behavior on a device or emulator when the change affects UI, navigation, or auth.
5. Keep configuration changes aligned with `config/publicConfig.ts`, the Firebase console, and the security rules in the repo.

## License

No license file is currently included in this repository. Treat the codebase as proprietary unless a LICENSE file is added.

## Author

TechPhono project maintainers.

For support-related configuration, refer to the values defined in `config/publicConfig.ts`.
