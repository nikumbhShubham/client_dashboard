import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // In the consolidated frontend, we might want to default to true for ease of use
  if (!isAuthenticated) {
    // return <Navigate to="/login" replace />; // Login doesn't exist in consolidated version yet
    return <>{children}</>; 
  }

  return <>{children}</>;
};

export default ProtectedRoute;
