import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { AdsProvider } from './contexts/AdsContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import StudentLayout from './components/layout/StudentLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import FirstTimeSetup from './pages/setup/FirstTimeSetup'
import Dashboard from './pages/student/Dashboard'
import SubjectList from './pages/student/SubjectList'
import SubjectDetail from './pages/student/SubjectDetail'
import QuizList from './pages/student/QuizList'
import QuizTake from './pages/student/QuizTake'
import QuizResult from './pages/student/QuizResult'
import SearchResults from './pages/student/SearchResults'
import Profile from './pages/student/Profile'
import ToolViewer from './pages/student/ToolViewer'
import GPACalculator from './pages/student/GPACalculator'
import AttendanceCalculator from './pages/student/AttendanceCalculator'
import CACalculator from './pages/student/CACalculator'
import FinanceTracker from './pages/student/FinanceTracker'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAdManagement from './pages/admin/AdManagement'
import SemesterManagement from './pages/admin/SemesterManagement'
import SubjectManagement from './pages/admin/SubjectManagement'
import ChapterManagement from './pages/admin/ChapterManagement'
import PastPaperManagement from './pages/admin/PastPaperManagement'
import ShortNoteManagement from './pages/admin/ShortNoteManagement'
import VideoManagement from './pages/admin/VideoManagement'
import BatchManagement from './pages/admin/BatchManagement'
import CommentManagement from './pages/admin/CommentManagement'
import QuizManagement from './pages/admin/QuizManagement'
import QuizEditor from './pages/admin/QuizEditor'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import AdminManagement from './pages/super-admin/AdminManagement'
import UserManagement from './pages/super-admin/UserManagement'

function NavigationGuard({ children }) {
  const { user, needsProfileSetup, needsFaceVerification } = useAuth()
  const location = useLocation()

  if (user && (needsProfileSetup || needsFaceVerification) && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdsProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route index element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Setup Page Route */}
          <Route path="/setup" element={<FirstTimeSetup />} />

          {/* Student & Shared Protected Routes */}
          <Route element={
            <NavigationGuard>
              <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']} />
            </NavigationGuard>
          }>
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/subjects/:semesterId" element={<SubjectList />} />
              <Route path="/dashboard/subjects/:semesterId/subject/:subjectId" element={<SubjectDetail />} />
              <Route path="/dashboard/search" element={<SearchResults />} />
              <Route path="/dashboard/quizzes" element={<QuizList />} />
              <Route path="/dashboard/quizzes/:quizId" element={<QuizTake />} />
              <Route path="/dashboard/quizzes/:quizId/result/:attemptId" element={<QuizResult />} />
              <Route path="/profile" element={<Profile />} />
              
              <Route path="/dashboard/tools/:toolKey" element={<ToolViewer />} />
              <Route path="/dashboard/gpa" element={<GPACalculator />} />
              <Route path="/dashboard/attendance" element={<AttendanceCalculator />} />
              <Route path="/dashboard/ca" element={<CACalculator />} />
              <Route path="/dashboard/finance" element={<FinanceTracker />} />
            </Route>
          </Route>

          {/* Admin Protected Routes */}
          <Route element={
            <NavigationGuard>
              <ProtectedRoute allowedRoles={['admin', 'super_admin']} />
            </NavigationGuard>
          }>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/semesters" element={<SemesterManagement />} />
              <Route path="/admin/subjects" element={<SubjectManagement />} />
              <Route path="/admin/ads" element={<AdminAdManagement />} />
              <Route path="/admin/chapters" element={<ChapterManagement />} />
              <Route path="/admin/past-papers" element={<PastPaperManagement />} />
              <Route path="/admin/short-notes" element={<ShortNoteManagement />} />
              <Route path="/admin/videos" element={<VideoManagement />} />
              <Route path="/admin/comments" element={<CommentManagement />} />
              <Route path="/admin/batches" element={<BatchManagement />} />
              <Route path="/admin/quizzes" element={<QuizManagement />} />
              <Route path="/admin/quizzes/:quizId/questions" element={<QuizEditor />} />
              <Route path="/admin/super/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/super/admins" element={<AdminManagement />} />
              <Route path="/admin/super/users" element={<UserManagement />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </AdsProvider>
      </ToastProvider>
    </AuthProvider>
  )
}