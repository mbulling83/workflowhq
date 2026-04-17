// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthView } from '@neondatabase/neon-js/auth/react'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Neon Auth handles sign-in, sign-up, forgot-password at /auth/* */}
        <Route path="/auth/:path" element={
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <AuthView />
          </div>
        } />
        <Route path="/onboard" element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        } />
        <Route path="/app" element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard>
            <SettingsPage />
          </AuthGuard>
        } />
        {/* Legacy redirects */}
        <Route path="/signin" element={<Navigate to="/auth/sign-in" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/sign-up" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
