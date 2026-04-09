/**
 * Mock Auth Context
 *
 * For local development: always "logged in" — no real auth flow.
 * Provides the same interface as the original Base44 AuthContext
 * so App.jsx and any consumers don't need to change.
 *
 * TO GO LIVE: Replace this with real auth (Firebase Auth, Auth0, etc.)
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider
      value={{
        user: null,             // Pages call base44.auth.me() directly — not needed here
        isAuthenticated: true,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: null,
        logout: () => { window.location.href = '/'; },
        navigateToLogin: () => {},
        checkAppState: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
