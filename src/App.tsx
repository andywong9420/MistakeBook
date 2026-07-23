import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import StudentDashboard from './pages/student/Dashboard';
import AddMistake from './pages/student/AddMistake';
import MyMistakes from './pages/student/MyMistakes';
import Review from './pages/student/Review';
import MistakeDetail from './pages/student/MistakeDetail';
import TeacherDashboard from './pages/teacher/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageSettings from './pages/admin/ManageSettings';
import Navbar from './components/Navbar';
import Header from './components/Header';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center">載入中...</div>;
  if (!currentUser || !userData) return <Navigate to="/login" replace />;
  if (!userData.isActive) return <div className="p-8 text-center text-red-600">您的帳號已被停用。</div>;
  if (userData.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const RoleBasedRedirect = () => {
  const { userData } = useAuth();
  if (!userData) return <Navigate to="/login" />;
  if (userData.role === 'student') return <Navigate to="/student" />;
  if (userData.role === 'teacher') return <Navigate to="/teacher" />;
  if (userData.role === 'admin') return <Navigate to="/admin/users" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
          <Navbar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
              <div className="max-w-6xl mx-auto space-y-6">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                  
                  {/* Student Routes */}
                  <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                  <Route path="/student/add" element={<ProtectedRoute allowedRoles={['student']}><AddMistake /></ProtectedRoute>} />
                  <Route path="/student/mistakes" element={<ProtectedRoute allowedRoles={['student']}><MyMistakes /></ProtectedRoute>} />
                  <Route path="/student/review" element={<ProtectedRoute allowedRoles={['student']}><Review /></ProtectedRoute>} />
                  <Route path="/mistake/:id" element={<ProtectedRoute><MistakeDetail /></ProtectedRoute>} />

                  {/* Teacher Routes */}
                  <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><ManageSettings /></ProtectedRoute>} />
                  
                  <Route path="/" element={<RoleBasedRedirect />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
