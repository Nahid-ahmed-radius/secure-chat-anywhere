
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { StorageProvider } from "@/contexts/StorageContext";
import { EncryptionProvider } from "@/contexts/EncryptionContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StorageSetup from "./pages/StorageSetup";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user is authenticated (from localStorage for simplicity)
  const isAuthenticated = localStorage.getItem("user") !== null;
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <StorageProvider>
        <EncryptionProvider>
          <MessageProvider>
            <TooltipProvider>
              <Toaster />
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/storage-setup" element={
                    <ProtectedRoute>
                      <StorageSetup />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </TooltipProvider>
          </MessageProvider>
        </EncryptionProvider>
      </StorageProvider>
    </AuthProvider>
  );
};

export default App;
