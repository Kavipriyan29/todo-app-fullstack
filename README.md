# Local Todo App with Monthly Planner & Notifications

A beautiful, responsive todo application with monthly calendar planning and smart notification reminders.

## Features

- ✅ **Todo Management**: Add, complete, delete tasks with priority levels
- 🔄 **Daily Tasks**: Tasks that automatically reset every day
- 📅 **Monthly Planner**: Calendar view with per-day notes
- 🔔 **Smart Reminders**: Set custom reminder times for tasks
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📊 **Statistics**: Track your productivity with live stats
- 🔊 **Audio Notifications**: Optional sound alerts for reminders

## Quick Start

1. Open `index.html` in your web browser
2. Allow notifications when prompted (for reminder alerts)
3. Start adding todos and setting reminders!

## Notification Features

### 🔔 Task Reminders
- **Set Reminders**: Check "Set reminder" when adding a todo
- **Custom Times**: Pick any future date and time
- **Browser Notifications**: Get desktop notifications even when tab is closed
- **Audio Alerts**: Optional sound notification
- **Visual Indicators**: See reminder times on your tasks

### **Notification Types**
- **Browser Push Notifications**: Desktop alerts with task details
- **In-App Notifications**: Visual alerts within the app
- **Audio Beeps**: Gentle sound alerts (can be disabled)
- **Visual Reminders**: icons show which tasks have reminders

## How to Use

### Todo Management
- **Add Todo**: Type in the input field and press Enter or click "Add Todo"
- **Daily Tasks**: Check the "daily task" checkbox for tasks that reset each day
- **Complete**: Click the checkbox next to any task
- **Delete**: Click the icon (appears on hover)
- **Filter**: Use "All Tasks", "Active", "Completed" buttons

### Monthly Planner
- **Switch View**: Click "Monthly Planner" filter
- **Add Notes**: Click in any day cell and type your notes
- **Navigate**: Use "Prev" and "Next" buttons
- **Clear**: Use "Clear" button for individual days or "Clear All" for the month

### Real-Time Collaboration
- **Join Workspace**: Enter the same workspace ID on multiple devices
- **Instant Sync**: Changes appear immediately on all connected devices
- **Status**: Check the sync status in the top-right corner

## File Structure

```
TODO/
├── index.html                          # Main HTML file
├── assets/
│   ├── app.js                         # Main application logic with Firebase
│   ├── firebase-config.example.js     # Firebase config template
│   └── firebase-config.js             # Your Firebase config (create this)
└── README.md                          # This file
```

## Firebase Security Rules

For production use, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if true; // Customize as needed
    }
  }
}
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Troubleshooting

**"Firebase not configured" message:**
- Make sure you've created `assets/firebase-config.js` with your Firebase settings

**Real-time sync not working:**
- Check your internet connection
- Verify Firebase config is correct
- Make sure Firestore is enabled in Firebase Console

**App not loading:**
- Make sure you're opening `index.html` via a web server (not file://)
- For local testing, use Live Server extension in VS Code or similar

## Development

The app uses ES6 modules and Firebase v10. No build process required - just open in a modern browser!

## License

MIT License - feel free to use and modify as needed.

---

**Enjoy staying organized with your real-time todo app! 🎉**
