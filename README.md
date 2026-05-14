# TechPhono Repair App

TechPhono is a React Native CLI app for repair booking, repair tracking, admin workflows, shop items, and Firebase-backed authentication/data.

## Setup

```bash
npm install
```

## Run

```bash
npm run start
npm run android
```

On macOS for iOS:

```bash
npm run pods
npm run ios
```

## Build

```bash
npm run android:release
npm run bundle:android
```

## Checks

```bash
npm run lint
npm run typecheck
```

Runtime public config lives in `config/publicConfig.ts`. Deep linking uses `techphono://` and `https://techphono-e47ec.web.app`.
