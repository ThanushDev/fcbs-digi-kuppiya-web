import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
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
import AdminDashboard from './pages/admin/AdminDashboard'
import SemesterManagement from './pages/admin/SemesterManagement'
import SubjectManagement from './pages/admin/SubjectManagement'
import ChapterManagement from './pages/admin/ChapterManagement'
import ResourceManagement from './pages/admin/ResourceManagement'
import BatchManagement from './pages/admin/BatchManagement'
import CommentManagement from './pages/admin/CommentManagement'
import QuizManagement from './pages/admin/QuizManagement'
import QuizEditor from './pages/admin/QuizEditor'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import AdminManagement from './pages/super-admin/AdminManagement'
import UserManagement from './pages/super-admin/UserManagement'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/setup" element={<FirstTimeSetup />} />

        <Route element={<ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/subjects/:semesterId" element={<SubjectList />} />
            <Route path="/dashboard/subjects/:semesterId/subject/:subjectId" element={<SubjectDetail />} />
            <Route path="/dashboard/search" element={<SearchResults />} />
            <Route path="/dashboard/quizzes" element={<QuizList />} />
            <Route path="/dashboard/quizzes/:quizId" element={<QuizTake />} />
            <Route path="/dashboard/quizzes/:quizId/result/:attemptId" element={<QuizResult />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/semesters" element={<SemesterManagement />} />
            <Route path="/admin/subjects" element={<SubjectManagement />} />
            <Route path="/admin/chapters" element={<ChapterManagement />} />
            <Route path="/admin/resources" element={<ResourceManagement />} />
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
      </ToastProvider>
    </AuthProvider>
  )
}
