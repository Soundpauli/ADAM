import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/layout/Layout';
import FieldConfigPage from './pages/FieldConfigPage';
import ProductsPage from './pages/ProductsPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import GoldstandardConfigPage from './pages/GoldstandardConfigPage';
import ClaimsPage from './pages/ClaimsPage';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { FieldProvider } from './contexts/FieldContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { EnhancedProductProvider } from './contexts/EnhancedProductContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <FieldProvider>
            <LanguageProvider>
              <EnhancedProductProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route 
                        index
                        element={
                          <ProtectedRoute roles={['admin', 'manager', 'editor']}>
                            <ProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/fields"
                        element={
                          <ProtectedRoute roles={['admin', 'manager', 'editor']}>
                            <FieldConfigPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/goldstandard"
                        element={
                          <ProtectedRoute roles={['admin', 'manager', 'editor']}>
                            <GoldstandardConfigPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/claims"
                        element={
                          <ProtectedRoute roles={['admin', 'manager', 'editor']}>
                            <ClaimsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute roles={['admin', 'manager', 'editor']}>
                            <UserProfilePage />
                          </ProtectedRoute>
                        } 
                      />
                    </Route>
                  </Routes>
                </Router>
              </EnhancedProductProvider>
            </LanguageProvider>
          </FieldProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;