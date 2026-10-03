import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router';
import { Toaster } from 'sonner';
import { AppErrorScreen } from './components/AppErrorScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TooltipProvider } from './components/ui/Tooltip';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteFallback } from './pages/RouteFallback';
import { useUiStore } from './state/uiStore';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));

function Root() {
  const theme = useUiStore((s) => s.theme);
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <Toaster
        theme={theme}
        position="bottom-right"
        closeButton
        toastOptions={{ className: 'font-sans', duration: 5000 }}
      />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: (
      <AppErrorScreen
        error={new Error('This page failed to load.')}
        onRetry={() => window.location.reload()}
      />
    ),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/app', element: <DashboardPage /> },
      { path: '/app/resume/:id', element: <EditorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <ErrorBoundary fallback={(error, reset) => <AppErrorScreen error={error} onRetry={reset} />}>
      <TooltipProvider delayDuration={400} skipDelayDuration={200}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
