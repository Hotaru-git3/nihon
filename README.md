# Nihongo App 🌸

A comprehensive, full-stack Japanese learning application built with TypeScript, Express, and Firebase. Nihongo App helps you master Japanese through structured studying, spaced repetition, and AI-powered sentence analysis.

## Features ✨

- **Spaced Repetition System (SRS)**: Optimize your study sessions by reviewing vocabulary, kanji, and grammar exactly when you need to.
- **AI Sentence Breakdown**: Leverage Google's Gemini AI to instantly analyze any Japanese sentence, breaking it down into individual words, particles, and grammar points.
- **Study Tracking**: Track your daily progress, review streaks, and JLPT (N5-N1) milestones directly from your dashboard.
- **Comprehensive Library**: Add, manage, and study custom Vocabulary, Kanji, and Grammar entries.
- **Secure Authentication**: User authentication and secure cloud data persistence powered by Firebase.

## Tech Stack 🛠️

### Frontend
- **Language**: TypeScript / Vanilla JS
- **Styling**: Tailwind CSS for responsive and elegant UI design
- **State Management**: Local storage for user preferences, Firebase for persistent state
- **Charts**: Chart.js for visualizing learning progress

### Backend
- **Server**: Express.js with Node.js
- **AI Integration**: `@google/genai` (Gemini API) for natural language processing and sentence breakdown
- **Database & Auth**: Firebase Firestore (NoSQL) and Firebase Authentication

## Project Structure 📁

- `/src`: Frontend source code
  - `/pages`: Main application views (Dashboard, Study, Library, Settings, Login)
  - `/components`: Reusable UI components (Sidebar, BottomNav, ProfileDrawer)
  - `/services`: API and Firebase service integrations
  - `/types`: TypeScript interfaces for the application data
- `/backend`: Express backend for handling AI requests securely

## Getting Started 🚀

### Prerequisites
- Node.js installed
- A Firebase project with Firestore and Authentication enabled
- A Google Gemini API key

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Configure Firebase: The app automatically detects environment variables for Firebase configuration. Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Deploying to Vercel (Using your own Firebase Project)

If you are seeing a "Failed to initialize Firebase" error when deploying to Vercel, it means Vercel does not know your Firebase credentials. Follow these step-by-step instructions to connect your own Firebase project (e.g., `nihon-6040d`):

#### 1. Setup Firebase Project (Nihon)
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your project **NIhon** (Project ID: `nihon-6040d`).
3. Under Project Settings -> General, scroll down to **Your apps**.
4. If you don't have a Web App, click the `</>` icon to add one.
5. Under "Firebase SDK snippet", select the **Config** option to see your credentials.

#### 2. Enable Required Firebase Services
- **Authentication**: Go to Build -> Authentication. Enable the **Email/Password** provider.
- **Firestore Database**: Go to Build -> Firestore Database. Create a database in Production mode.
- **Firestore Rules**: Go to the Rules tab in Firestore and paste the contents of `firestore.rules` from this repository and publish it.

#### 3. Add Environment Variables to Vercel
1. Go to your Vercel Dashboard and select your project.
2. Go to **Settings** -> **Environment Variables**.
3. Add the following environment variables using the config you got from Firebase:
   - `VITE_FIREBASE_API_KEY` = (Your apiKey)
   - `VITE_FIREBASE_AUTH_DOMAIN` = (Your authDomain, usually `nihon-6040d.firebaseapp.com`)
   - `VITE_FIREBASE_PROJECT_ID` = `nihon-6040d`
   - `VITE_FIREBASE_STORAGE_BUCKET` = (Your storageBucket)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = (Your messagingSenderId)
   - `VITE_FIREBASE_APP_ID` = (Your appId)
   - `GEMINI_API_KEY` = (Your Gemini API Key for the backend)
4. Go to **Deployments** in Vercel, click on the latest one, and select **Redeploy** to apply the new environment variables.

### Building for Production

To build the application for production, run:
```bash
npm run build
```

This will compile the frontend assets into the `dist` folder and prepare the Express server for production deployment.

## Design Philosophy 🎨

Nihongo App focuses on a clean, distraction-free learning environment. It utilizes a warm, aesthetic design inspired by Japanese minimalism, prioritizing readability and focus during study sessions. 
