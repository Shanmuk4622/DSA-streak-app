import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full text-gray-100">
      {!session ? <LandingPage /> : <Layout />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
