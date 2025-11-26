# Dating App

A modern dating app built with React Native and Expo.

## Features

- User authentication (sign up, sign in, password reset)
- Profile creation and editing
- Swipe-based matching
- Real-time chat messaging
- Premium features (See who liked you, unlimited swipes, profile boost)
- Push notifications
- Privacy settings
- Block/report users

## Tech Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Navigation:** Expo Router
- **State Management:** React Context, Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/Douba03/Datingapp.git
cd Datingapp
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Run on device
- Scan the QR code with Expo Go (iOS/Android)
- Press `w` to open in web browser

## Environment Variables

The app uses the following environment variables (see `.env` file):

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Project Structure

```
├── src/
│   ├── app/           # Expo Router screens
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and service functions
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── admin/             # Admin panel
├── sql/               # Database migrations
└── assets/            # Images and icons
```

## Premium Features

- Unlimited swipes
- See who liked you
- Undo last swipe
- Profile boost
- Advanced filters

## License

Private - All rights reserved

