import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingCart, CalendarClock,
  Users, Settings, GitBranch, Phone, LogOut, ChevronDown,
  Menu, X, Shield, Sparkles
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Business {
  id: string;
  name: string;
  type: string;
  mode: string;
}

const ORDER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/calls", label: "AI Calls", icon: Phone },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/branches", label: "Branches", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
];

const APPOINTMENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/calls", label: "AI Calls", icon: Phone },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/branches", label: "Branches", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await api.get("/business/all");
      if (data.success && data.data.length > 0) {
        setBusinesses(data.data);
        const storedBizId = localStorage.getItem("activeBizId");
        const found = storedBizId ? data.data.find((b: Business) => b.id === storedBizId) : null;
        const selected = found || data.data[0];
        setActiveBiz(selected);
        // Always persist the active business
        if (selected && !storedBizId) {
          localStorage.setItem("activeBizId", selected.id);
        }
      }
    } catch {}
  };

  const selectBusiness = (biz: Business) => {
    setActiveBiz(biz);
    localStorage.setItem("activeBizId", biz.id);
    window.dispatchEvent(new CustomEvent("business-changed", { detail: biz }));
  };

  const navItems = activeBiz?.mode === "appointment" ? APPOINTMENT_NAV : ORDER_NAV;

  const modeLabel = activeBiz?.mode === "appointment"
    ? `${activeBiz.type.charAt(0).toUpperCase() + activeBiz.type.slice(1)} Booking`
    : activeBiz?.type
      ? activeBiz.type.charAt(0).toUpperCase() + activeBiz.type.slice(1)
      : "Restaurant";

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static z-30 flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Kimi AI</div>
            <div className="text-xs text-sidebar-foreground/50">{modeLabel} Platform</div>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Switcher */}
        {businesses.length > 0 && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sm text-white transition-colors">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 animate-pulse" />
                <span className="flex-1 text-left truncate text-sidebar-foreground">
                  {activeBiz?.name || "Select Business"}
                </span>
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-sidebar text-sidebar-foreground border-sidebar-border"
                style={{ backgroundColor: "hsl(222, 47%, 15%)" }}
              >
                {businesses.map((biz) => (
                  <DropdownMenuItem
                    key={biz.id}
                    onClick={() => selectBusiness(biz)}
                    className="cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent"
                    style={{ color: "hsl(210, 40%, 94%)" }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {activeBiz?.id === biz.id && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                      <span className={activeBiz?.id === biz.id ? "" : "ml-3.5"}>{biz.name}</span>
                      <span className="ml-auto text-xs opacity-50 capitalize">{biz.mode}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}

          {user?.role === "SUPERADMIN" && (
            <Link
              href="/superadmin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-2 border-t border-sidebar-border pt-3 ${
                location.startsWith("/superadmin")
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Shield className="w-4 h-4" />
              Superadmin
            </Link>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name || user?.email}</div>
              <div className="text-xs text-sidebar-foreground/50 capitalize">{user?.role?.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-4 lg:px-8 py-4 border-b border-border bg-card">
          <button className="lg:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {activeBiz && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${activeBiz.mode === "appointment" ? "bg-blue-500" : "bg-green-500"}`} />
              <span className="font-medium text-foreground">{activeBiz.name}</span>
              <span className="text-muted-foreground capitalize text-xs">· {activeBiz.mode}</span>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
