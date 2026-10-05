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
  name: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/auth`,
  withCredentials: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check whether the user is already logged in
  // when the page loads or refreshes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authApi.get("/profile");

        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login
  // Backend has already created the HttpOnly cookie.
  // We only store the user information in React state.
  const login = (userData: User) => {
    setUser(userData);
  };

  // Logout
  // Backend clears the HttpOnly cookie.
  const logout = async () => {
    try {
      await authApi.post("/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};