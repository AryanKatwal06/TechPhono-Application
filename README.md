# 🔧 TechPhono – Mobile Repair & Service Management Application

TechPhono is a **full-stack mobile repair service management application** built using **Expo (React Native)** and **Supabase**.  
The app is designed to streamline the entire mobile repair workflow — from user booking, admin repair management, real-time status tracking, to service & shop item management.

The project follows a **production-ready architecture**, focusing on **scalability**, **real-time synchronization**, **clean UI**, and **robust authentication**.

---

## 📱 What is TechPhono?

TechPhono is a **customer–admin based repair ecosystem** where:

### 👤 Users can:
- Register & log in securely  
- Book repair requests  
- Track repair status in real time  
- View repair history  
- Cancel requests when needed  
- Browse available services and shop items  

### 🛠️ Admins can:
- Log in through a protected admin panel  
- View and manage incoming repair requests  
- Update repair status step-by-step  
- Add notes for each repair  
- Mark repairs as completed or cancelled  
- Manage services and shop items (add/delete)  
- View full repair history  

➡️ All data is synced instantly between user and admin using **Supabase real-time capabilities**.

---

## 🧠 Core Philosophy

The app is built with the following principles:

- **Single Source of Truth** → Supabase Database  
- **No AsyncStorage for Auth Logic** → Fully Supabase-driven  
- **Real-time Sync** → Admin updates reflect instantly on user side  
- **Clean UI/UX** → Proper spacing, padding, and smooth interactions  
- **Scalable Architecture** → Easy to extend features later  

---

## 🧩 Tech Stack

### 📱 Frontend (Mobile App)
- Expo (React Native)  
- TypeScript  
- Expo Router (File-based routing)  
- React Context API  
- Expo Vector Icons / Lucide Icons  
- Expo Haptics  
- Expo Image Picker  

### 🗄️ Backend & Database
- Supabase  
- Authentication (Email & Password)  
- PostgreSQL Database  
- Row Level Security (RLS)  
- Real-time subscriptions  

### 🛠️ Tooling
- Node.js  
- npm  
- Git  
- Expo Go (for testing)  

---

## 🏗️ Application Architecture

### 1️⃣ Authentication Layer
Supabase Auth handles:
- Email + Password login  
- Email verification  
- Forgot password via email OTP  
- Admin access via email-based role logic  
- Secure session persistence  

### 2️⃣ User Layer
Users interact with:
- Home screen  
- Booking screen  
- Track repair screen  
- Repair history  
- Profile & logout  

### 3️⃣ Admin Layer
Admins have access to:
- Admin dashboard  
- Active repair requests  
- Repair details screen  
- Repair status timeline  
- Notes section  
- Manage services  
- Manage shop items  
- History view  

### 4️⃣ Database Layer
Supabase PostgreSQL tables handle:
- Users  
- Repairs  
- Repair status  
- Services  
- Shop items  
- History records  

---

## 📁 Project Folder Structure

```
TechPhono-Repair-App
│
├── .expo/                          # Expo internal files
├── android/                        # Android native build files
│
├── app/                            # Expo Router (App entry point)
│   │
│   ├── (tabs)/                     # Bottom tab navigation (User)
│   │   ├── _layout.tsx             # Tabs layout
│   │   ├── index.tsx               # Home screen
│   │   ├── cart.tsx                # Cart screen
│   │   ├── services.tsx            # Services listing
│   │   └── shop.tsx                # Shop screen
│   │
│   ├── admin/                      # Admin-only screens
│   │   ├── repair/
│   │   │   └── [id].tsx             # Repair details (dynamic route)
│   │   ├── _layout.tsx              # Admin layout
│   │   ├── index.tsx                # Admin dashboard
│   │   ├── history.tsx              # Completed & cancelled repairs
│   │   ├── repairs.tsx              # All repair requests
│   │   ├── manage-items.tsx         # Manage shop items
│   │   └── manage-services.tsx      # Manage services
│   │
│   ├── auth/                       # Authentication screens
│   │   ├── callback.tsx            # Auth callback handler
│   │   ├── login.tsx               # Login screen
│   │   ├── register.tsx            # Registration screen
│   │   ├── forgot-password.tsx     # Forgot password
│   │   └── reset-password.tsx      # Reset password
│   │
│   ├── _layout.tsx                 # Root layout
│   ├── +not-found.tsx              # 404 screen
│   ├── index.tsx                   # App entry / role-based redirect
│   ├── booking.tsx                 # Repair booking
│   ├── feedback.tsx                # User feedback
│   ├── repair-history.tsx          # User repair history
│   ├── reset-password.tsx          # Reset password (route)
│   └── track-repair.tsx            # Live repair tracking
│
├── assets/                         # Static assets
│   └── images/
│       └── logo.png
│
├── components/
│   └── ui/                         # Reusable UI components
│       ├── AppLogo.tsx
│       ├── AnimatedPressable.tsx
│       ├── RatingStars.tsx
│       ├── RepairTimeline.tsx
│       ├── Skeleton.tsx
│       ├── SkeletonLoader.tsx
│       ├── WhatsAppFAB.tsx
│       ├── collapsible.tsx
│       ├── haptic-tab.tsx
│       ├── icon-symbol.tsx
│       ├── icon-symbol.ios.tsx
│       ├── themed-text.tsx
│       └── themed-view.tsx
│
├── config/                         # App security & configuration
│   ├── security.ts
│   └── securityEnhancements.ts
│
├── constants/                      # App-wide constants
│   ├── products.ts
│   ├── repairSteps.ts
│   ├── services.ts
│   └── theme.ts
│
├── context/                        # Global state management
│   ├── AuthContext.tsx
│   └── TechPhonoContext.tsx
│
├── hooks/                          # Custom React hooks
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   ├── use-theme-color.ts
│   └── useSecureStorage.ts
│
├── middleware/                     # App middleware
│   ├── apiSecurity.ts
│   └── securityMonitor.ts
│
├── scripts/                        # Utility scripts
│   └── reset-project.js
│
├── services/                       # External services
│   ├── supabaseClient.ts
│   └── whatsapp.ts
│
├── types/                          # TypeScript types
│   ├── cart.ts
│   └── database.ts
│
├── utils/                          # Helper utilities
│   ├── errorHandler.ts
│   ├── sessionManager.ts
│   ├── statusUtils.ts
│   └── validation.ts
│
├── .env                            # Environment variables
├── .env.local                      # Local environment variables
├── .gitignore
├── app.json                        # Expo configuration
├── eas.json                        # EAS build config
├── eslint.config.js
├── expo-env.d.ts
├── metro.config.js
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## 🔐 Authentication Flow

### 📝 Registration
- User signs up using email & password  
- Supabase handles verification  
- User metadata is stored securely  
- Admin role is determined internally (email-based)  

### 🔑 Login
- Email + password authentication  
- Session persists across app restarts  
- Admin users are redirected to the admin dashboard  

### 🔄 Forgot Password
- User enters email  
- Supabase sends password reset email  
- Secure OTP-based reset flow  

---

## 🛠️ Repair Booking Flow
1. User submits a repair request  
2. Status defaults to **Received**  
3. Request appears instantly on admin dashboard  
4. Admin updates repair stages:
   - Received  
   - Diagnosing  
   - Repairing  
   - Repaired  
   - Completed  
5. User sees real-time updates  
6. Completed or cancelled requests move to history automatically  

---

## 📊 Repair Status Management
- Status updates are controlled only by admin  
- Notes can be added per repair  
- Users have read-only access to repair status  
- Completed & cancelled requests are:
  - Removed from active list  
  - Added to history with proper labels  

---

## 🛍️ Services & Shop Items

### 👨‍💼 Admin Capabilities
- Add services  
- Delete services  
- Add shop items (image, price, description)  
- Delete shop items  

### 👤 User Capabilities
- View updated services  
- Browse shop items  
- Consistent UI for newly added items  

> All changes reflect instantly on the user side.

# 📱 Real-Time Sync with Supabase

This project uses **Supabase subscriptions** to enable real-time data synchronization, ensuring a smooth and responsive user experience.

---

## 🔄 Real-Time Sync

Supabase subscriptions ensure:

- ⚡ Fast updates
- 🔄 No manual refresh required
- 👆 Pull-to-refresh for added reliability

---

## ⚙️ Environment Setup

### 📌 Required Environment Variables

Add your Supabase credentials to a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Installation

Install all required dependencies:

```bash
npm install
```

---

## ▶️ Running the App

Start the Expo development server:

```bash
npx expo start
```

### 📲 Testing Options

- Use **Expo Go** for testing
- Recommended modes:
  - **Tunnel**
  - **LAN**
- 🌐 Web build is supported, but **mobile is the primary platform**

---

## 🧪 Common Issues & Fixes

### ⏳ App Stuck on Loading

**Fix:**

```bash
npx expo start -c
```

- Check Supabase environment variables
- Ensure `.env` file is correctly loaded

---

### 🔐 Admin Page Not Opening

**Fix:**

- Ensure admin email matches the configured email
- Verify session logic inside `AuthContext`

---

### 🔁 Requests Not Syncing

**Fix:**

- Ensure **Supabase Realtime** is enabled
- Verify **Row Level Security (RLS)** policies
- Check subscription listeners

---

## 🚀 Future Enhancements

- 🔔 Push notifications for status updates
- 💳 Payment integration
- 🧑‍🔧 Technician role support
- 💰 Repair cost estimation
- 👥 Multi-admin support
- 📊 Analytics dashboard

---

## 📄 License

This project is intended for **educational and demonstration purposes only**.
