import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config";

export interface User {
  id: string;
  name?: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN" | string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPinVerified: boolean;
  setIsPinVerified: (verified: boolean) => void;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/auth`,
  withCredentials: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore PIN status from sessionStorage on reload/refresh
  const [isPinVerified, setIsPinVerifiedState] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_pin_verified") === "true";
  });

  const setIsPinVerified = (verified: boolean) => {
    setIsPinVerifiedState(verified);
    if (verified) {
      sessionStorage.setItem("admin_pin_verified", "true");
    } else {
      sessionStorage.removeItem("admin_pin_verified");
    }
  };

  // Check existing session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authApi.get("/profile");
        
        // Normalize multiple common API payload structures
        const fetchedUser: User | null =
          response.data?.user ??
          response.data?.data?.user ??
          response.data?.data ??
          response.data ??
          null;

        console.log("[AuthContext] Session checked successfully:", fetchedUser);
        setUser(fetchedUser);
      } catch (error) {
        console.warn("[AuthContext] No active session found or request failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login action
  const login = (userData: User) => {
    setIsPinVerified(false);
    setUser(userData);
  };

  // Logout action
  const logout = async () => {
    try {
      await authApi.post("/logout");
    } catch (error) {
      console.error("[AuthContext] Logout failed:", error);
    } finally {
      setIsPinVerified(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPinVerified,
        setIsPinVerified,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};