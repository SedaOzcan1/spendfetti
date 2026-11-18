import { Outlet } from 'react-router-dom';
import { CelebrationProvider } from '../../features/celebrations/CelebrationProvider.jsx';
import { TransactionModalProvider } from '../../features/transactions/TransactionModalContext.jsx';
import { BottomNav, MobileTopBar } from './MobileNav.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppLayout() {
  return (
    <CelebrationProvider>
      <TransactionModalProvider>
        <div className="flex min-h-screen bg-page">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <MobileTopBar />
            <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
              <Outlet />
            </main>
          </div>
          <BottomNav />
        </div>
      </TransactionModalProvider>
    </CelebrationProvider>
  );
}
