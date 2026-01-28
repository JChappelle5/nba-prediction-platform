import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

// Protected Route wrapper
function ProtectedRoute({ children }) 
{
  const { isAuthenticated, loading } = useAuth();

  if (loading) 
  {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) 
  {
    return <Navigate to = "/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect to dashboard if already logged in)
function PublicRoute({ children }) 
{
  const { isAuthenticated, loading } = useAuth();

  if (loading) 
  {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) 
  {
    return <Navigate to = "/dashboard" replace />;
  }

  return children;
}

function AppRoutes() 
{
  return (
    <Routes>
      <Route
        path = "/"
        element = {<Navigate to = "/login" replace />}
      />
      <Route
        path = "/login"
        element =
        {
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path = "/register"
        element =
        {
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path = "/dashboard"
        element =
        {
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element = 
        {
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() 
{
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;