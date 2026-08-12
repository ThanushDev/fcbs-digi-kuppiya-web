# FCBS Digi Kuppiya — Full Project Details

Complete read-only audit report. Generated 2026-08-11. No source files were modified.

---

## 1. Project Overview & Executive Summary

- **App**: FCBS Digi Kuppiya — a study/resource portal for the FCBS BMS/LCS undergraduate community.
- **Platform**: Single-page React web app, deployed on Vercel (SPA rewrite in `vercel.json`).
- **Tech stack** (`package.json`):
  - `react` / `react-dom` 19.2.7, `vite` 8.1.1, `@vitejs/plugin-react`
  - `tailwindcss` 4.3.2 via `@tailwindcss/vite` (CSS-first config in `src/index.css`, no `tailwind.config.js`)
  - `react-router-dom` 7.18.1
  - `firebase` 12.15.0 (Auth, Firestore, Storage), `firebase-admin` 14.1.0 (dev/migration scripts)
  - `@google/generative-ai` 0.24.1 (AI question generator in QuizEditor)
  - `cloudinary` 2.10.0 (dev scripts; production uses direct Cloudinary URLs)
  - `framer-motion` 12.42.2, `lucide-react` 1.25.0
  - Dev: `oxlint`, `@types/react`
- **Build config** (`vite.config.js`): `react()` + `tailwindcss()` plugins only.
- **Entry** (`index.html` → `src/main.jsx`): `BrowserRouter` + `StrictMode`; production `console.log/error/warn` suppressed.
- **Routing guard** (`src/App.jsx`): `NavigationGuard` redirects any logged-in user with `needsProfileSetup || needsFaceVerification` to `/setup`; `ProtectedRoute` handles auth + role (`allowedRoles`); `PublicOnlyRoute` keeps guest pages away from logged-in users. Fallback `*` → `/login`. On mount, legacy localStorage keys `FCBS_EXECUTIVE_SIM_V2` and `FCBS_GAME_SAVE_V1` are purged.
- **Roles**: `student`, `admin`, `super_admin`.
- **Departments**: `BMS` (Business Management Studies) and `LCS` (Languages & Communication Studies).
- **Batches**: `20/21`, `21/22`, `22/23`, `23/24`, `24/25` (`src/utils/constants.js`).
- **Semesters**: default list `Y1S1, Y1S2, Y2S1, Y2S2, Y3S1, Y3S2`; internal/semester-management IDs `11,12,21,22,31,32,41,42` (Y1S1…Y4S2) across `BatchManagement`, `SemesterManagement`, `GPACalculator`, and `AdminDashboard`.
- **Firestore collections**: `users`, `semesters`, `subjects`, `chapters`, `resources`, `quizzes`, `questions`, `attempts`, `comments`, `important_documents`, `sponsored_ads`, `batchPermissions`, plus singleton docs under `settings/` (`system_settings/ads_config` for ads master switch, `settings/setup` first-run flag).
- **Design language**: Light theme, indigo/violet palette, glass-morphism cards (`.card`, `.glass-panel`, `.header-glass`, `.sidebar-item`, `.loader-glow`), Tailwind v4. `html/body/#root` have `overflow:hidden`.

### ⚠️ Notable findings (call-outs)
1. **Exposed Cloudinary secret** — `update_images.js` hardcodes the Cloudinary `api_secret` in plain text (repo root). Rotate/remove.
2. **Sensitive files in repo root** — `serviceAccountKey.json` (Firebase Admin service account), `users_auth.json` (exported auth dump with temporary passwords), `if0_41943903_login.json` (legacy SQL export of InfinityFree host). These should not be committed.
3. **Inconsistent Cloudinary config** — `src/components/CompleteProfileModal.jsx` hardcodes `cloud_name: "ddn08cpkt"` and a placeholder preset `"your_cloudinary_preset"`, while `src/services/auth.js` and `src/pages/student/Profile.jsx` read `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` from env.
4. **Broken image paths** — `AttendanceCalculator.jsx` references `/img/lcs/...` images, but `public/img/` contains only `01.png`, `02.png`, `03.png`, `04.png`, `1234.png`, `4321.png` (no `lcs/` subfolder).
5. **Default passwords** — `convert.js` assigns every imported user the same temporary password (`"12345"`, padded to `"1234567"` in `import_auth.js`). Existing users flagged by `isOldUser`/`requiresPasswordReset` in the DB should reset via the password-change flow.
6. **Vercel rewrite** — `vercel.json` rewrites all paths to `index.html` (SPA support).

---

## 2. Authentication & Profile System

### 2.1 Firebase init (`src/services/firebase.js`)
- `app`, `auth`, `db`, `storage` exported from one module.
- Env vars (see `.env.example`):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Cloudinary (elsewhere):
  - `VITE_CLOUDINARY_CLOUD_NAME`
  - `VITE_CLOUDINARY_UPLOAD_PRESET`
- Groq (Dashboard AI): `VITE_GROQ_API_KEY`.

### 2.2 Auth service (`src/services/auth.js`)
- **Login**: by email **or** registration number. Reg-number login does a Firestore lookup on `users` to find the email, then `signInWithEmailAndPassword`.
- **Legacy users**: if Firestore `isOldUser === true` or `requiresPasswordReset === true`, login returns `OLD_USER_DETECTED` so the UI forces a password reset (login blocked until password changed).
- **Register**: creates Firebase Auth user, then a Firestore `users` doc. Profile photo uploaded to Cloudinary (via unsigned preset) and stored as `photoURL`; if env missing, falls back to a null/placeholder path.
- **Reset password**: `sendPasswordResetEmail`; throws `USER_NOT_FOUND` when no matching account.
- Custom claim `role` + Firestore `users/{uid}` doc is the source of truth.

### 2.3 Auth context (`src/contexts/AuthContext.jsx`)
- Exposes `user`, `userData`, `role` (`userData?.role || 'guest'`), `isAdmin` (admin|super_admin), `isSuperAdmin`, `loading`, `needsProfileSetup`, `needsFaceVerification`, and auth helpers.
- Registers a Firestore `onSnapshot` on the user doc to react to role/flag changes live.

### 2.4 Profile flows
- **First-time setup** (`src/pages/setup/FirstTimeSetup.jsx`): the gate for new/legacy users. Simulated face-verification camera UI with states `idle / analyzing / passed / failed`, retry logic; on success marks setup flags done and redirects.
- **Complete profile** (`src/pages/setup/CompleteProfile.jsx`): collects full-name, reg-number, batch, department. Validates reg format per department (BMS must contain `/ms/`, LCS must contain `/cs/`) using regex `/^\d{2}\/(ms|cs)\/\d+$/i` plus batch-year consistency check.
- **CompleteProfileModal** (`src/components/CompleteProfileModal.jsx`): in-app modal variant of the same flow, with the Cloudinary preset inconsistency noted above.

### 2.5 Validation rules (`src/utils/validators.js`)
- Reg-number regex + batch-year match; 10-digit mobile (07XXXXXXXX); password ≥ 8 chars.

### 2.6 Auth pages
- **Login** (`pages/auth/Login.jsx`): email/reg + password, shows which mode is detected, `AnimatedAvatar` loading state, error handling for `OLD_USER_DETECTED`, forgot-password link, register link.
- **Register** (`pages/auth/Register.jsx`): form with department, name, email, reg, batch, password, confirmation, Cloudinary avatar upload (preview), client-side validation.
- **ForgotPassword** (`pages/auth/ForgotPassword.jsx`): email → `resetPassword`.

---

## 3. Dashboard & Navigation Layout

### 3.1 Route shells
- **PublicOnlyRoute** → `/`, `/login`, `/register`, `/forgot-password`.
- **/setup** → `FirstTimeSetup` (accessible once logged-in mid-flow).
- **Student shell** (`StudentLayout`): shared header + `Sidebar`, wraps `/dashboard*`, `/profile`, tool/calculator routes. `allowedRoles`: student, admin, super_admin.
- **Admin shell** (`AdminLayout`): distinct sidebar, wraps `/admin*` including super-admin pages. `allowedRoles`: admin, super_admin.
- **ProtectedRoute** (`src/components/layout/ProtectedRoute.jsx`): loading screen while auth loads; redirects `/login` if no user; if a user doc exists but is missing, it signs the user out; `needsProfileSetup || needsFaceVerification` → `/setup`; role mismatch → `/admin` or `/dashboard`.

### 3.2 Sidebar (`src/components/layout/Sidebar.jsx`)
- Student links: Dashboard, Subjects, Quizzes, Attendance, GPA, CA, Finance, Documents, Tools (external iframe links), Profile.
- Legacy external links still present: `../qindex.php`, `../atdbms/index.html`, `../gpa/index.php`, `../ca/index.html`, `../finance/index.php`.

### 3.3 Student Dashboard (`src/pages/student/Dashboard.jsx`)
- Semester cards with color themes (per-semester theme arrays), batch-permission gating via `getBatchPermission`, live recent-comments feed (`getCommentsLive`), notices, **Groq AI assistant** (`VITE_GROQ_API_KEY`) chat box, and `MentorsSection`.
- **MentorsSection** (`src/components/dashboard/MentorsSection.jsx`): hardcoded 13 mentor cards (author + subject tutors) with Cloudinary avatars, auto-rotating every 4s, dot navigation.

### 3.4 Admin Dashboard (`src/pages/admin/AdminDashboard.jsx`)
- KPI cards, per-batch semester access management (batchPermissions), notices, batch registration counts, quick links into every management page.

### 3.5 Super-Admin pages
- **SuperAdminDashboard**: global counts (users/admins/bms/lcs/semesters/subjects/chapters/resources), batch stats, recent users.
- **AdminManagement**: create/disable admins. Creates accounts through a **second, throwaway Firebase app instance** (`initializeApp` + `deleteApp` + `createUserWithEmailAndPassword`), lists users with `role in ['admin','super_admin']`.
- **UserManagement**: paginated user table (`PAGE_SIZE = 20`), filters, CSV export, **`fixCloudinaryUrl`** repair (reconstructs legacy `profile_*` URLs as `https://res.cloudinary.com/ddn08cpkt/image/upload/<v...>/profile_xxx.jpg` with `f_auto`).

### 3.6 Global Search (`src/components/search/GlobalSearch.jsx`)
- `/` keyboard shortcut opens search overlay; searches subjects, chapters, resources, documents via Firestore.

---

## 4. Academic & LMS Modules

### 4.1 Data layer (`src/services/firestore.js`) — full API inventory
- **Semesters**: `getSemesters` (orderBy `order`), `addSemester`, `updateSemester`, `deleteSemester`.
- **Subjects**: `getSubjects(semesterId?)`, `getAllSubjects`, `addSubject`, `updateSubject`, `deleteSubject` (cascade: chapters + their storage resources + Firestore docs).
- **Chapters**: `getChapters(subjectId)` (orderBy `order`), `addChapter`, `updateChapter`, `deleteChapter` (cascade resources).
- **Resources**: `getResources(chapterId)`, `addDocumentResource` (uploads to Storage `resources/{chapterId}/...`, stores `fileURL`+`filePath`), `addVideoResource` (stores `youtubeId` + `duration`, type `video`), `deleteResource` (also deletes storage object).
- **Resource by type** (past papers / short notes / videos): `getResourcesBySubjectAndType(subjectId, type)` (needs composite index), `getAllResourcesByType(type)`, plus generic `addResourceItem` / `updateResourceItem` / `deleteResourceItem` (used by video/past-paper/short-note management, which store `subjectId` on resources).
- **Quizzes**: `getQuizzes`, `getQuiz`, `addQuiz({title, timeLimit(Number)|10, password, subjectId})`, `updateQuiz`, `deleteQuiz` (cascade deletes questions + attempts).
- **Questions**: `getQuestions(quizId)`, `addQuestion({quizId, text, allowMultiple, options[]})`, `updateQuestion`, `deleteQuestion`.
- **Attempts**: `getAttempts(quizId)`, `getUserAttempts(userId)`, `submitAttempt({quizId,userId,userName,userEmail,answers,score,total})`.
- **Comments**: `addComment`, `getCommentsLive(callback)` (onSnapshot, orderBy createdAt desc), `getAllComments`, `deleteComment`, plus legacy `getComments` (all) and `updateCommentStatus(id, status)` for the old status-flow. Code comments in Sinhala.
- **Batch permissions**: `getBatchPermissions`, `getBatchPermission(batchName)`, `setBatchPermission(batchName, semesterIds)` (upsert with `active: true`), `deleteBatchPermission`.

### 4.2 Firestore security (`firestore.rules`)
- Role helpers `isAuth`, `isSuperAdmin`, `isAdmin`, `isOwner`.
- `users`: create own doc only; read own or admin; update own **non-role-changing** fields, **except** the first-run escalation that lets a student claim `super_admin` when `settings/setup` does not exist (self-bootstrap); delete super-admin only.
- `semesters`, `subjects`, `chapters`, `resources`, `quizzes`, `questions`: read if authenticated; write if admin.
- `attempts`: read own or admin; create own (userId must match auth.uid); update/delete admin only.
- `settings`: read if authenticated; create if authenticated; update/delete admin only.
- `batchPermissions`: read if authenticated; write admin only.
- `comments`: read if authenticated; create own; update admin; delete owner or admin.
- `important_documents`, `sponsored_ads`, `system_settings` are **not** matched by rules (default deny, unless the deployed rules differ — worth verifying, since `AdsContext` reads `system_settings/ads_config`).
- **Indexes** (`firestore.indexes.json`): subjects(semesterId,name), chapters(subjectId,order), resources(chapterId,createdAt), questions(quizId,createdAt), attempts(quizId,createdAt desc), attempts(userId,createdAt desc), users(department,createdAt desc), users(role,createdAt desc), semesters(order).

### 4.3 Storage security (`storage.rules`)
- `profiles/{userId}/**`: read authed; write own; delete own or admin.
- `resources/{chapterId}/**`: read authed; write/delete admin.

### 4.4 Student academic pages
- **SubjectList** (`pages/student/SubjectList.jsx`): grid of subjects for a semester; honors-track `?spec=` filtering for BMS Y3/Y4 specializations; chapter counts.
- **SubjectDetail** (`pages/student/SubjectDetail.jsx`): tabs **chapters / past papers / short notes / videos**; chapters sorted by `order`; resources via `getResourcesBySubjectAndType(subjectId, 'past_paper'|'short_note'|'video')`; document preview, YouTube embed, downloads, and per-chapter `CommentSection`.
- **CommentSection** (`src/components/comments/CommentSection.jsx`): submits `{chapterId: targetId, userId, userDisplayName, userPhotoURL, content}`; displays only `status === 'approved'`.
- **ImportantDocuments** (student): lists active documents filtered by `targetBatch === 'all' || userBatch` and `targetDepartment`, opens `driveUrl`.
- **SearchResults**: federated search results view.

### 4.5 Admin content management
- **SemesterManagement**: manages semesters; order via `indexOf` against `LOCAL_SEMESTERS` (Y1S1..Y4S2).
- **SubjectManagement**: CRUD subjects per semester; specializations: BMS = `all/accounting/marketing/hrm/management/info_management`; LCS = `all/communication/languages`.
- **ChapterManagement**: CRUD chapters, reorder via order numbers.
- **PastPaperManagement / ShortNoteManagement**: per-subject past papers / short notes with file uploads.
- **VideoManagement** ("Video Matrix Management"): per-subject YouTube videos (`youtubeId`, duration) with black uppercase styling.
- **BatchManagement**: toggles which semester IDs (`11..42` = Y1S1..Y4S2) each batch can access; merges `INITIAL_BATCHES` with DB batches.
- **ImportantDocuments** (admin): form fields `title`, `driveUrl`, `targetBatch`, `targetDepartment`, `active`.
- **CommentManagement**: live comments via `getCommentsLive`, search by name/email/batch/content, delete, status, CSV export via `exportToCSV`.

### 4.6 Quiz system
- **QuizList** (student): password-gated list; unlock via password, then navigates with `window.location.href` (full reload) into the quiz.
- **QuizTake**: loads quiz + questions, countdown timer `timeLimit * 60`, auto-submit on timeout, single/multi-answer per `allowMultiple`.
- **QuizResult**: reads the `attempts/{attemptId}` doc directly, computes percentage + grade band.
- **QuizManagement** (admin): CRUD quizzes `{title, timeLimit:'10', password, subjectId, department:'both'}`, view attempts, CSV export.
- **QuizEditor** (admin): question bank editor with multi-answer support and **Google Gemini (`@google/generative-ai`)** question generator from subject/chapter context.

### 4.7 Calculators
- **GPACalculator**: `GRADE_POINTS` (A+/A=4.0 … E=0.0); hardcoded `BMS_COURSES` keyed by semester (`11`,`12`,`21`,…) with codes like `BMT 1013`; uses `getBatchPermissions`; semester GPA/CGPA.
- **CACalculator**: CA grade mapping via `GRADE_PERCENTAGES` (A+=75 … C-=35); CA maximum 35 marks.
- **AttendanceCalculator**: session-based percentage calculator; `BMS_IMAGES` (`/img/...`) and `LCS_IMAGES` (`/img/lcs/...`) header art — LCS paths broken (see finding 4). Local `BMS_SPECIALIZATIONS = ['IS','HR','ACC','Mkt','M','G']`.
- **FinanceTracker**: expense/income ledger with categories, `CHART_COLORS`, `HIGH_EXPENSE_THRESHOLD = 10000` alert, weekly view (`WEEKDAYS`), LKR formatting.

---

## 5. AI Productivity & Utility Tools

### 5.1 ToolViewer (`src/pages/student/ToolViewer.jsx`) — embedded external tools (iframes)
| Tool key | URL |
|---|---|
| `qr` | https://thanushdev.github.io/Qr-Genarater/ |
| `ai-humanizer` | https://thanushdev.github.io/AI-Humanizer/ |
| `cv-maker` | https://thanushdev.github.io/DigiSolutionsCV/ |
| `pdf-tool` | https://thanushdev.github.io/Pdftool/ |

Accessed via `/dashboard/tools/:toolKey`. Full-screen iframe wrapper with back button.

### 5.2 Groq AI assistant
- `src/pages/student/Dashboard.jsx` — chat widget calling Groq (via `VITE_GROQ_API_KEY`) for Q&A/study help.

### 5.3 Gemini question generator
- `src/pages/admin/QuizEditor.jsx` — generates quiz questions from a topic using `@google/generative-ai`.

### 5.4 Visualization / animation components
- **`src/components/ui/AcademicBackground.jsx`**: fixed full-viewport background — gradient orbs, 7 floating academic SVG icons (book, cap, monitor, layers, code, flask, terminal) with injected `float1..float5` keyframes, plus an HTML canvas particle-network (40 particles, connect distance 130px, indigo strokes).
- **`src/components/AnimatedBg.jsx`**: framer-motion dark gradient (`from-indigo-900 via-slate-900 to-purple-900`) with floating white blur particles — used on dark/auth surfaces.
- **`src/hooks/useDynamicBackgroundColors.js`**: palette-switching hook; currently only a `bright` palette (slate/white/indigo base + teal/violet/chartreuse corner blurs), rotates every 60s (placeholder).
- **`src/components/ui/Skeleton.jsx`**: exports `Skeleton`, `CardSkeleton`, `TableSkeleton({rows, cols})`, `DetailSkeleton`.

---

## 6. Business & Integrations

### 6.1 Ad system (sponsorship)
- **AdsContext** (`src/contexts/AdsContext.jsx`):
  - Reads master switch doc `system_settings/ads_config` (`isAdSystemEnabled`).
  - Loads active ads from `sponsored_ads` within `startDate`/`endDate`.
  - `MAX_DAILY_VIEWS = 5` per user per day, tracked in localStorage key `fcbs_ad_view_dates`; refs used for instant checks.
- **AdPopupModal** (`src/components/ads/AdPopupModal.jsx`):
  - Image or video types; countdown ring with `circumference = 2π*42`; default `countdownDuration = 7`s (falls back when missing); mute toggle for videos; content unlocks only after countdown **and** media loaded.
- **AdManagement** (admin): form `{adType: 'image'|'video', mediaUrl, countdownDuration: 7, targetUrl, startDate, endDate}`; CRUD against `sponsored_ads`.

### 6.2 Cloudinary (media CDN)
- Cloud name **`ddn08cpkt`** throughout.
- Production uploads: `auth.js` (register) and `Profile.jsx` (avatar update) via env-configured unsigned preset; `CompleteProfileModal` hardcodes name + placeholder preset (finding 3).
- Legacy URL repair in `UserManagement` (`fixCloudinaryUrl`) — supports `.jpg`/extensions appended, `f_auto`, and strips bad `uploads/` segments.
- Dev migration scripts: `update_images.js` scans Cloudinary (max 500) and rewrites every `users` profile field (`photoURL`, `profile_pic`, `profilePic`) to matching `profile_*` secure URLs.

### 6.3 Legacy data migration tooling (repo root)
- `if0_41943903_login.json` — export from the legacy InfinityFree MySQL host (contains the `users` table).
- `convert.js` — converts the legacy `users` table into Firebase Auth import format (`users_auth.json`), fabricating emails (`user_{id}@test.com`) for missing ones and a shared temp password.
- `import_auth.js` — uses `firebase-admin` with `serviceAccountKey.json` to bulk-create those auth users (fixed uid = legacy SQL id, min 6-char password).
- `users_auth.json` — the generated auth import payload.

### 6.4 Integrations summary
- Firebase Auth + Firestore + Storage (client SDK, and Admin SDK in scripts).
- Google Gemini (`@google/generative-ai`) — quiz question generation.
- Groq API — student dashboard assistant.
- Cloudinary — image hosting/upload.
- External sites embedded via iframe — QR generator, AI Humanizer, CV maker, PDF tools.
- Vercel — hosting/SPA rewrites.
- Firebase Hosting config (`firebase.json`) also present for rules/index deployment.

---

## 7. File Structure & Routing Table

### 7.1 Directory tree
```
FCBS DIGI KUPPIYA/
├─ index.html                    # SPA entry, title "FCBS Digi Kuppiya"
├─ package.json                  # deps/scripts (vite, oxlint)
├─ vite.config.js                # react + tailwind plugins
├─ vercel.json                   # SPA rewrite
├─ firebase.json                 # rules/indexes refs
├─ firestore.rules               # security rules
├─ storage.rules                 # storage rules
├─ firestore.indexes.json        # composite indexes
├─ .env.example                  # VITE_FIREBASE_* template
├─ convert.js                    # legacy SQL → auth JSON converter
├─ import_auth.js                # bulk Firebase Auth import
├─ update_images.js              # Cloudinary URL migration      ⚠ contains api_secret
├─ serviceAccountKey.json        # Firebase Admin creds           ⚠ sensitive
├─ users_auth.json               # exported auth users            ⚠ sensitive
├─ if0_41943903_login.json       # legacy MySQL export            ⚠ sensitive
├─ public/
│  ├─ favicon.svg, icons.svg, logo.png
│  └─ img/ {01-04.png, 1234.png, 4321.png}   # no lcs/ subfolder ⚠
├─ src/
│  ├─ main.jsx                   # BrowserRouter + StrictMode bootstrap
│  ├─ App.jsx                    # all routes + NavigationGuard
│  ├─ index.css                  # Tailwind v4 theme + utilities
│  ├─ assets/  {logo.png, logo.svg, hero.png, happy.png, hide.png, sad.png, react.svg, vite.svg}
│  ├─ services/
│  │  ├─ firebase.js             # Firebase init
│  │  ├─ auth.js                 # auth API + Cloudinary upload
│  │  └─ firestore.js            # full Firestore data-access API
│  ├─ contexts/
│  │  ├─ AuthContext.jsx         # user/role/provider + live user doc
│  │  ├─ AdsContext.jsx          # ad master switch, daily-view cap
│  │  └─ ToastContext.jsx        # toast notifications
│  ├─ hooks/
│  │  └─ useDynamicBackgroundColors.js
│  ├─ utils/
│  │  ├─ constants.js            # DEPARTMENTS, BATCHES, SEMESTERS
│  │  ├─ validators.js           # reg/mobile/password validation
│  │  └─ export.js               # exportToCSV
│  ├─ components/
│  │  ├─ layout/  {ProtectedRoute.jsx, PublicOnlyRoute, StudentLayout.jsx, AdminLayout.jsx, Sidebar.jsx}
│  │  ├─ ui/      {Skeleton.jsx, AcademicBackground.jsx}
│  │  ├─ ads/     {AdPopupModal.jsx}
│  │  ├─ comments/{CommentSection.jsx}
│  │  ├─ dashboard/{MentorsSection.jsx}
│  │  ├─ search/  {GlobalSearch.jsx}
│  │  └─ CompleteProfileModal.jsx
│  └─ pages/
│     ├─ auth/       {Login, Register, ForgotPassword}
│     ├─ setup/      {FirstTimeSetup, CompleteProfile}
│     ├─ student/    {Dashboard, SubjectList, SubjectDetail, QuizList, QuizTake, QuizResult,
│     │                SearchResults, Profile, ToolViewer, GPACalculator, AttendanceCalculator,
│     │                CACalculator, FinanceTracker, ImportantDocuments}
│     ├─ admin/      {AdminDashboard, SemesterManagement, SubjectManagement, ChapterManagement,
│     │                PastPaperManagement, ShortNoteManagement, VideoManagement, BatchManagement,
│     │                ImportantDocuments, CommentManagement, QuizManagement, QuizEditor, AdManagement}
│     └─ super-admin/ {SuperAdminDashboard, AdminManagement, UserManagement}
```

### 7.2 Routing table (`src/App.jsx`)
| Path | Component | Guard / Shell |
|---|---|---|
| `/` | Login | PublicOnlyRoute |
| `/login` | Login | PublicOnlyRoute |
| `/register` | Register | PublicOnlyRoute |
| `/forgot-password` | ForgotPassword | PublicOnlyRoute |
| `/setup` | FirstTimeSetup | logged-in, mid-setup |
| `/dashboard` | Dashboard | StudentLayout |
| `/dashboard/subjects/:semesterId` | SubjectList | StudentLayout |
| `/dashboard/subjects/:semesterId/subject/:subjectId` | SubjectDetail | StudentLayout |
| `/dashboard/search` | SearchResults | StudentLayout |
| `/dashboard/quizzes` | QuizList | StudentLayout |
| `/dashboard/quizzes/:quizId` | QuizTake | StudentLayout |
| `/dashboard/quizzes/:quizId/result/:attemptId` | QuizResult | StudentLayout |
| `/profile` | Profile | StudentLayout |
| `/dashboard/tools/:toolKey` | ToolViewer | StudentLayout |
| `/dashboard/gpa` | GPACalculator | StudentLayout |
| `/dashboard/attendance` | AttendanceCalculator | StudentLayout |
| `/dashboard/ca` | CACalculator | StudentLayout |
| `/dashboard/finance` | FinanceTracker | StudentLayout |
| `/dashboard/documents` | ImportantDocuments (student) | StudentLayout |
| `/admin` | AdminDashboard | AdminLayout |
| `/admin/semesters` | SemesterManagement | AdminLayout |
| `/admin/subjects` | SubjectManagement | AdminLayout |
| `/admin/documents` | ImportantDocuments (admin) | AdminLayout |
| `/admin/ads` | AdManagement | AdminLayout |
| `/admin/chapters` | ChapterManagement | AdminLayout |
| `/admin/past-papers` | PastPaperManagement | AdminLayout |
| `/admin/short-notes` | ShortNoteManagement | AdminLayout |
| `/admin/videos` | VideoManagement | AdminLayout |
| `/admin/comments` | CommentManagement | AdminLayout |
| `/admin/batches` | BatchManagement | AdminLayout |
| `/admin/quizzes` | QuizManagement | AdminLayout |
| `/admin/quizzes/:quizId/questions` | QuizEditor | AdminLayout |
| `/admin/super/dashboard` | SuperAdminDashboard | AdminLayout (super_admin) |
| `/admin/super/admins` | AdminManagement | AdminLayout (super_admin) |
| `/admin/super/users` | UserManagement | AdminLayout (super_admin) |
| `*` | Navigate → `/login` | fallback |

---

*End of report.*
