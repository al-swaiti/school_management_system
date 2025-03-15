import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SystemSettings from './pages/admin/SystemSettings';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import ClassesList from './pages/teacher/ClassesList';
import ClassDetail from './pages/teacher/ClassDetail';
import ContentManagement from './pages/teacher/ContentManagement';
import StudentProgress from './pages/teacher/StudentProgress';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import CoursesList from './pages/student/CoursesList';
import CourseDetail from './pages/student/CourseDetail';
import Assignments from './pages/student/Assignments';
import Grades from './pages/student/Grades';

// Shared Pages
import Profile from './pages/shared/Profile';
import Messages from './pages/shared/Messages';
import Announcements from './pages/shared/Announcements';
import NotFound from './pages/shared/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" />;
    } else if (user.role === 'student') {
      return <Navigate to="/student/dashboard" />;
    }
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      
      {/* Admin Routes */}
      <Route element={<MainLayout />}>
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/classes" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemSettings />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Teacher Routes */}
      <Route element={<MainLayout />}>
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/classes" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ClassesList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/classes/:id" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ClassDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/content" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ContentManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/students" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <StudentProgress />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Student Routes */}
      <Route element={<MainLayout />}>
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/courses" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <CoursesList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/courses/:id" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <CourseDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/assignments" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Assignments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/grades" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Grades />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Shared Routes */}
      <Route element={<MainLayout />}>
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/announcements" 
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
