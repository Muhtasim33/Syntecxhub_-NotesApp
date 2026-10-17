# 📝 NotesApp - Android WebView & React Application

A modern, responsive Android Notes Application built with **Java / Android WebView** hosting a **React Single Page Application (SPA)**. It features state management via `useState`, field auto-focusing via `useRef`, local data persistence via `window.localStorage`, page navigation, note favoriting, reminders, and settings analytics.

---

## 🌟 Key Features

### 📋 1. Notes List Dashboard
* **Search Filter**: Live title and content search filtering.
* **Note Cards**: Display titles, body snippets, created/updated timestamps, and favourite stars.
* **Badge Counter**: Real-time counter displaying total matching notes.
* **Empty State**: Friendly illustration when no notes exist or match search queries.

### 📄 2. Note Detail View
* Full-screen reading mode for individual notes.
* **Metadata Badges**: Shows created/updated date, total word count, character count, and active reminder schedules.
* **Quick Actions**: Edit, Delete, or Star/Unstar directly from the detail header.

### ✏️ 3. Spacious Note Editor
* **Spacious Editing Canvas**: Generous title input and large body text editing area.
* **`useRef` Auto-Focus**: Automatically focuses the title field using `useRef` upon opening the editor.
* **Reminder Scheduler**: Set optional date and time reminders (`datetime-local`).

### ⭐ 4. Favourites & Starred Notes
* Star important notes with a single tap (⭐ / ☆).
* Filter and view all starred notes inside the Settings dashboard.

### ⏰ 5. Reminder Scheduling
* Attach date and time alerts to notes.
* Active reminders list available in Settings with quick `🔕 Clear` options.

### ⚙️ 6. App Settings & Usage Overview
* Total saved notes and total word count analytics.
* **📌 All Notes List**: Quick bulleted list of all note titles with direct navigation.
* **⭐ Favourites Overview**: Dedicated list of starred notes.
* **⏰ Active Reminders**: Overview of scheduled note reminders.
* **Data Management**: Clear all saved data from `localStorage` with a custom confirmation modal.

---

## 🛠️ Tech Stack

* **Android / Native Layer**:
  * **Language**: Java
  * **UI Container**: `WebView` with `WebChromeClient` and `WebViewClient`
  * **Permissions**: `INTERNET`
  * **SDK**: Min SDK 24 (`Android 7.0`), Target SDK 37
  * **Build System**: Gradle KTS (`AGP 9.4.1`)
* **Frontend Layer**:
  * **Framework**: React 18 (UMD) with standalone Babel transpiler & offline runtime fallback
  * **Hooks**: `useState`, `useRef`, `useEffect`
  * **Persistence Engine**: `window.localStorage`
  * **Styling**: Modern CSS3 Custom Properties (Variables), Flexbox, Responsive Cards & Modals

---

## 📱 App Navigation Architecture

The application uses client-side SPA view routing (`currentView` state):

| View State | Description |
|---|---|
| **`LIST`** | Home screen displaying all notes in cards with search filter |
| **`DETAIL`** | Dedicated screen for reading note details and metadata |
| **`EDITOR`** | Spacious writing canvas for creating or editing notes |
| **`SETTINGS`** | Overview of app analytics, starred notes, bulleted titles, and active reminders |

---

## 🚀 Getting Started

### Prerequisites
* **Android Studio** (2024.1+ recommended)
* **JDK 11+**
* Android Emulator or physical device running Android 7.0+ (API 24+)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Muhtasim33/Syntecxhub_-NotesApp.git
   cd Syntecxhub_-NotesApp
   ```

2. **Open in Android Studio**:
   Open Android Studio -> **Open...** -> Select the project root folder.

3. **Build the project**:
   ```bash
   ./gradlew assembleDebug
   ```

4. **Deploy to Device / Emulator**:
   Run the project using **Run 'app'** (`Shift + F10`) or via CLI:
   ```bash
   ./gradlew installDebug
   ```

---

## 📁 Project Structure

```
NotesApp/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── assets/
│           │   └── index.html       # React Single Page App (UI, Logic, Styling, LocalStorage)
│           ├── java/com/example/notesapp/
│           │   └── MainActivity.java # WebView host with JavaScript & DOMStorage enabled
│           └── res/
│               └── layout/
│                   └── activity_main.xml # WebView layout
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

---

## 📝 License
This project is open source and available under the [MIT License](LICENSE).
