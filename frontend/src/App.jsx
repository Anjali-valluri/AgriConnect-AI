import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "./components/Home";
import { ThemeProvider } from "./theme/ThemeContext";
import MarketView from "./features/market/MarketView";
import DiseaseDetector from "./features/Disease/DiseaseDetector";
import VoiceControl from "./features/voice/VoiceControl";
import YieldPredictor from "./features/yield/YieldPredictor";
import ChatAssistant from "./features/chat/ChatAssistant";
import Navbar from "./components/Navbar";
import Microfarm from "./features/microfarm/Microfarm";
import Marketplace from "./features/bookings/Marketplace";
import { AuthProvider } from "./features/auth/AuthContext";
import { useAuth } from "./features/auth/useAuth";
import { AuthPages } from "./features/auth/AuthPages";

function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="auth-loading" role="status">Loading your account...</div>;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function PublicOnly({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="auth-loading" role="status">Loading your account...</div>;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicOnly><AuthPages /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><AuthPages /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><AuthPages /></PublicOnly>} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/market" element={<RequireAuth><MarketView /></RequireAuth>} />
        <Route path="/disease" element={<RequireAuth><DiseaseDetector /></RequireAuth>} />
        <Route path="/voice" element={<RequireAuth><VoiceControl /></RequireAuth>} />
        <Route path="/yield" element={<RequireAuth><YieldPredictor /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><ChatAssistant /></RequireAuth>} />
        <Route path="/microfarm" element={<RequireAuth><Microfarm /></RequireAuth>} />
        <Route path="/workers" element={<RequireAuth><Marketplace page="workers" /></RequireAuth>} />
        <Route path="/equipment" element={<RequireAuth><Marketplace page="equipment" /></RequireAuth>} />
        <Route path="/bookings" element={<RequireAuth><Marketplace page="bookings" /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
