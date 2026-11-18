import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { GuestOnly, RequireAuth } from './features/auth/RequireAuth.jsx';
import { PageLoading } from './components/ui/PageState.jsx';
import { MonthProvider } from './lib/MonthContext.jsx';

const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage.jsx'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const SavingsPage = lazy(() => import('./pages/SavingsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'));

export default function App() {
  return (
    <MonthProvider>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MonthProvider>
  );
}
