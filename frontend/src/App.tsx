import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Login } from './components/Login';
import { useAuth, LoginOptions } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { AppRoutes } from './routes';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  const authHook = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toasterTheme = theme === 'dark' ? 'dark' : 'light';

  return (
    <BrowserRouter>
      <AppContent auth={authHook} toasterTheme={toasterTheme} />
    </BrowserRouter>
  );
}

type AuthHook = ReturnType<typeof useAuth>;

interface AppContentProps {
  auth: AuthHook;
  toasterTheme: 'dark' | 'light';
}

function AppContent({ auth, toasterTheme }: AppContentProps) {
  if (auth.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            auth.isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginRoute auth={auth} />
            )
          }
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
              <AppRoutes
                onLogout={auth.logout}
                user={auth.user}
                token={auth.token}
              />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster position="top-right" theme={toasterTheme} richColors />
    </>
  );
}

interface LoginRouteProps {
  auth: AuthHook;
}

function LoginRoute({ auth }: LoginRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: Location } | undefined;
  const redirectTarget = state?.from ?? { pathname: '/' };

  const handleLogin = async (
    username: string,
    password: string,
    options?: LoginOptions,
  ) => {
    const success = await auth.login(username, password, options);
    if (success) {
      navigate(redirectTarget, { replace: true });
    }

    return success;
  };

  return <Login onLogin={handleLogin} />;
}
