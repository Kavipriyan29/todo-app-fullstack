// Firebase Configuration Template
// Copy this file to firebase-config.js and replace with your Firebase project settings

const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

export default firebaseConfig;

/*
HOW TO SET UP FIREBASE:

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Click "Add app" and choose "Web" (</> icon)
4. Register your app with a nickname
5. Copy the firebaseConfig object from the setup page
6. Create a new file called "firebase-config.js" in the same folder
7. Paste your config into firebase-config.js (replace the template values above)
8. In Firebase Console, go to "Firestore Database"
9. Click "Create database" and choose "Start in test mode"
10. Your app will now sync in real-time across devices!

SECURITY RULES (optional):
In Firestore Rules, you can use:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if true; // Allow all for now, customize as needed
    }
  }
}

WORKSPACE SHARING:
- You and your friend just need to enter the same workspace ID
- Example: "team123", "project-alpha", "study-group", etc.
- Anyone with the same workspace ID will see the same todos and calendar
*/
