# Activity App - Firebase Migration

A couple's activity checklist app built with React, TypeScript, Vite, and Firebase (Firestore + Auth).

## Features

- 🔐 Google OAuth authentication
- 📝 Activity management with sections
- 🔄 Recurring activities tracking
- 🗑️ Soft delete with restore
- 👥 Couple linking with invite codes
- 🎯 Status tracking (not started, in progress, finished)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Local Development with Docker

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for running the dev server)

### Quick Start

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start Firebase emulators with Docker**:
   ```bash
   docker-compose up
   ```

   This starts:
   - Firebase Auth Emulator: http://localhost:9099
   - Firestore Emulator: http://localhost:8080
   - Emulator UI: http://localhost:4000

3. **Start the development server** (in a new terminal):
   ```bash
   npm run dev
   ```

4. **Open the app**: http://localhost:5173

### Environment Variables

For local development, the `.env` file is already configured to use emulators:

```env
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_PROJECT_ID=demo-activity-app
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
```

For production Firebase:
1. Copy `.env.example` to `.env`
2. Fill in your Firebase project credentials
3. Set `VITE_USE_FIREBASE_EMULATOR=false`

## Project Structure

```
src/
├── components/          # React components
│   ├── ActivityList.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── DeletedItems.tsx
│   ├── OnboardingFlow.tsx
│   ├── ReminderPrompt.tsx
│   └── SectionManager.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities & Firebase setup
│   ├── firebase.ts    # Firebase initialization
│   └── firestore.ts   # Firestore helpers
├── App.tsx
└── main.tsx
```

## Firebase Collections

### `profiles`
- `id` (document ID = user UID)
- `full_name`
- `created_at`, `updated_at`

### `couples`
- `user1_id` (profile ref)
- `user2_id` (profile ref, nullable)
- `anniversary_date`
- `invite_code` (unique)
- `created_at`

### `sections`
- `couple_id`
- `title`
- `parent_section_id` (nullable)
- `display_order`
- `created_at`

### `activities`
- `couple_id`
- `section_id` (nullable)
- `title`, `description`
- `status` ('not_started' | 'in_progress' | 'finished')
- `is_deleted`, `is_recurring`
- `recurrence_interval` ('weekly' | 'monthly' | 'yearly')
- `last_completed_at`
- `display_order`
- `created_at`, `updated_at`

### `activity_reminders`
- `couple_id`
- `activity_title`
- `dismissed`
- `created_at`

### `activity_history`
- `activity_id`
- `completed_at`
- `completed_by`

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## Docker Commands

```bash
docker-compose up              # Start emulators
docker-compose up -d           # Start in background
docker-compose down            # Stop emulators
docker-compose logs -f         # View logs
```

## Testing Locally

1. Start the emulators and dev server
2. Open http://localhost:4000 to view Firebase Emulator UI
3. Click "Sign in with Google" in the app - the auth emulator will create a test account
4. Create activities, sections, and test all features
5. View data in the Emulator UI at http://localhost:4000

## Deployment

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Google Auth provider in Authentication
3. Create a Firestore database
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### App Deployment

1. Update `.env` with production Firebase credentials
2. Build the app:
   ```bash
   npm run build
   ```
3. Deploy to your preferred hosting (Vercel, Netlify, Firebase Hosting, etc.)

## Migration Notes

This app was migrated from Supabase to Firebase. Key changes:

- ✅ Auth: Supabase Auth → Firebase Auth (Google OAuth)
- ✅ Database: Supabase PostgreSQL → Firestore
- ✅ Local testing: Docker-based Firebase emulators
- ✅ Security: Row-Level Security → Firestore Rules

## License

MIT
