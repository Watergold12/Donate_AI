import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FullPageSpinner } from './components/atoms/Spinner'
import { useAuthContext } from './store/authStore'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { NotFoundPage } from './pages/shared/NotFoundPage'
import { SettingsPage } from './pages/shared/SettingsPage'
import { LandingPage } from './pages/shared/LandingPage'
import { DonorDashboardPage } from './pages/donor/DonorDashboardPage'
import { DonationPage } from './pages/donor/DonationPage'
import { CameraPage } from './pages/donor/CameraPage'
import { PickupSchedulePage } from './pages/donor/PickupSchedulePage'
import { DonationHistoryPage } from './pages/donor/DonationHistoryPage'
import { DonorPickupsPage } from './pages/donor/DonorPickupsPage'
import { DonorAnalyticsPage } from './pages/donor/DonorAnalyticsPage'
import { NGODashboardPage } from './pages/ngo/NGODashboardPage'
import { NGODemandsPage } from './pages/ngo/NGODemandsPage'
import { NGOMatchesPage } from './pages/ngo/NGOMatchesPage'
import { NGOPickupsPage } from './pages/ngo/NGOPickupsPage'
import { NGOAnalyticsPage } from './pages/ngo/NGOAnalyticsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminNGOsPage } from './pages/admin/AdminNGOsPage'
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage'
import type { UserRole } from './types/index'
import type { ReactNode } from 'react'

function RequireAuth({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  if (isLoading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) {
    if (user?.role === 'donor') return <Navigate to="/donor" replace />
    if (user?.role === 'ngo') return <Navigate to="/ngo" replace />
    return <Navigate to="/admin" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        {/* Donor */}
        <Route path="/donor" element={<RequireAuth role="donor"><DonorDashboardPage /></RequireAuth>} />
        <Route path="/donor/donate" element={<RequireAuth role="donor"><DonationPage /></RequireAuth>} />
        <Route path="/donor/camera" element={<RequireAuth role="donor"><CameraPage /></RequireAuth>} />
        <Route path="/donor/pickup-schedule" element={<RequireAuth role="donor"><PickupSchedulePage /></RequireAuth>} />
        <Route path="/donor/history" element={<RequireAuth role="donor"><DonationHistoryPage /></RequireAuth>} />
        <Route path="/donor/pickups" element={<RequireAuth role="donor"><DonorPickupsPage /></RequireAuth>} />
        <Route path="/donor/analytics" element={<RequireAuth role="donor"><DonorAnalyticsPage /></RequireAuth>} />

        {/* NGO */}
        <Route path="/ngo" element={<RequireAuth role="ngo"><NGODashboardPage /></RequireAuth>} />
        <Route path="/ngo/demands" element={<RequireAuth role="ngo"><NGODemandsPage /></RequireAuth>} />
        <Route path="/ngo/matches" element={<RequireAuth role="ngo"><NGOMatchesPage /></RequireAuth>} />
        <Route path="/ngo/pickups" element={<RequireAuth role="ngo"><NGOPickupsPage /></RequireAuth>} />
        <Route path="/ngo/analytics" element={<RequireAuth role="ngo"><NGOAnalyticsPage /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboardPage /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth role="admin"><AdminUsersPage /></RequireAuth>} />
        <Route path="/admin/ngos" element={<RequireAuth role="admin"><AdminNGOsPage /></RequireAuth>} />
        <Route path="/admin/analytics" element={<RequireAuth role="admin"><AdminAnalyticsPage /></RequireAuth>} />

        {/* Shared */}
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
