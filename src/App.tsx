import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Menu from "@/pages/Menu";
import Orders from "@/pages/Orders";
import Appointments from "@/pages/Appointments";
import Staff from "@/pages/Staff";
import Settings from "@/pages/Settings";
import Branches from "@/pages/Branches";
import Calls from "@/pages/Calls";
import Superadmin from "@/pages/Superadmin";
import { Loader2 } from "lucide-react";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function RequireSuperadmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "SUPERADMIN") return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>

      <Route path="/menu">
        <RequireAuth><Menu /></RequireAuth>
      </Route>

      <Route path="/orders">
        <RequireAuth><Orders /></RequireAuth>
      </Route>

      <Route path="/appointments">
        <RequireAuth><Appointments /></RequireAuth>
      </Route>

      <Route path="/staff">
        <RequireAuth><Staff /></RequireAuth>
      </Route>

      <Route path="/settings">
        <RequireAuth><Settings /></RequireAuth>
      </Route>

      <Route path="/branches">
        <RequireAuth><Branches /></RequireAuth>
      </Route>

      <Route path="/calls">
        <RequireAuth><Calls /></RequireAuth>
      </Route>

      <Route path="/superadmin">
        <RequireAuth>
          <RequireSuperadmin><Superadmin /></RequireSuperadmin>
        </RequireAuth>
      </Route>

      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>

      <Route>
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRoutes />
      </WouterRouter>
      <Toaster />
    </AuthProvider>
  );
}
