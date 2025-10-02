// Firebase Configuration for Real-Time Todo App
// This is a sample configuration - replace with your actual Firebase project settings

const firebaseConfig = {
    apiKey: "AIzaSyBvOiM2-1234567890abcdefghijklmnop",
    authDomain: "todo-app-realtime.firebaseapp.com",
    projectId: "todo-app-realtime",
    storageBucket: "todo-app-realtime.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890123456"
};

export default firebaseConfig;

/*
IMPORTANT: This is a sample configuration for demonstration.
To use real-time sync, you need to:

1. Go to https://console.firebase.google.com/
2. Click "Create a project" or "Add project"
3. Enter project name: "todo-app-realtime" (or any name you prefer)
4. Continue through setup (Google Analytics is optional)
5. Once created, click "Add app" and select Web (</> icon)
6. Register app with nickname: "Todo App"
7. Copy the firebaseConfig object and replace the one above
8. Go to "Firestore Database" in the left sidebar
9. Click "Create database" → "Start in test mode" → Select location
10. Your app will now sync in real-time!

SECURITY RULES (Firestore Rules tab):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if true;
    }
  }
}
*/
