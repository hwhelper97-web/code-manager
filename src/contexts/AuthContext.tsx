import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string;
  businessId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Auto-set activeBizId from stored user if not already set
        if (parsedUser.businessId && !localStorage.getItem("activeBizId")) {
          localStorage.setItem("activeBizId", parsedUser.businessId);
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    // Auto-set active business from login response
    if (data.user?.businessId) {
      const existing = localStorage.getItem("activeBizId");
      if (!existing) {
        localStorage.setItem("activeBizId", data.user.businessId);
      }
    }
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("activeBizId");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
