# 🔧 TechPhono – Mobile Repair & Service Management Application

**TechPhono** is a full-stack mobile repair service management application built using **Expo (React Native)** and **Supabase**.  
The app is designed to streamline the entire mobile repair workflow — from user booking, admin repair management, real-time status tracking, to service & shop item management.

The project follows a **production-ready architecture**, focusing on scalability, real-time synchronization, clean UI, and robust authentication.

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

> All data is synced instantly between user and admin using **Supabase real-time capabilities**.

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

---

### 2️⃣ User Layer
Users interact with:
- Home screen  
- Booking screen  
- Track repair screen  
- Repair history  
- Profile & logout  

---

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

---

### 4️⃣ Database Layer
Supabase PostgreSQL tables handle:
- Users  
- Repairs  
- Repair status  
- Services  
- Shop items  
- History records  

---

## 🗂️ Project Folder Structure

TechPhono-Repair-App
│
├── app/
│ ├── (tabs)/ # Bottom tab navigation
│ ├── admin/ # Admin screens
│ ├── auth/ # Login, Register, Reset Password
│ ├── booking.tsx # Repair booking
│ ├── track-repair.tsx # Live repair tracking
│ ├── repair-history.tsx # User repair history
│ └── index.tsx # Entry screen
│
├── components/
│ ├── RepairTimeline.tsx
│ └── UI components
│
├── context/
│ └── AuthContext.tsx # Central auth logic
│
├── constants/
│ └── theme.ts # Colors, spacing, shadows
│
├── services/
│ └── supabaseClient.ts # Supabase configuration
│
├── assets/
│ └── images, logos
│
├── app.json
├── package.json
└── README.md

yaml
Copy code

---

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

---

## 🔄 Real-Time Sync
Supabase subscriptions ensure:
- Fast updates  
- No manual refresh needed  
- Pull-to-refresh for added reliability  

---

## ⚙️ Environment Setup

### Required Environment Variables
Create a `.env` file (or use Expo secrets):

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
▶️ Running the Project
Install Dependencies
bash
Copy code
npm install
Start Expo
bash
Copy code
npx expo start
Use Expo Go

Recommended: Tunnel or LAN

Web build supported, but mobile is primary

🧪 Common Issues & Fixes
App stuck on loading
Clear cache:

bash
Copy code
npx expo start -c
Check Supabase environment variables

Admin page not opening
Ensure admin email matches configured email

Verify session logic in AuthContext

Requests not syncing
Check Supabase real-time is enabled

Verify RLS policies

🚀 Future Enhancements
Push notifications for status updates

Payment integration

Technician role

Repair cost estimation

Multi-admin support

Analytics dashboard

📄 License
This project is for educational and demonstration purposes.