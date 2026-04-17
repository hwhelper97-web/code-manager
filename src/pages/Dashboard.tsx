import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart, CalendarClock, Phone, DollarSign,
  TrendingUp, Clock, CheckCircle, XCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getActiveBusinessId() {
  return localStorage.getItem("activeBizId") || "";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    scheduled: "bg-purple-100 text-purple-800 border-purple-200",
    preparing: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium capitalize ${classes[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {status}
    </span>
  );
}

interface Analytics {
  totals: {
    orders: number;
    ordersToday: number;
    appointments: number;
    appointmentsToday: number;
    calls: number;
    callsToday: number;
    revenue: number;
  };
  recentOrders: Array<{ id: string; customerName: string; total: number; status: string; createdAt: string; business?: { name: string } }>;
  recentAppointments: Array<{ id: string; customerName: string; serviceName: string; date: string; status: string }>;
  recentCalls: Array<{ id: string; business: { name: string }; duration: number; createdAt: string }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("business-changed", handler);
    return () => window.removeEventListener("business-changed", handler);
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const bizId = getActiveBusinessId();
      const query = bizId ? `?businessId=${bizId}` : "";
      const data = await api.get(`/dashboard/analytics${query}`);
      if (data.success) setAnalytics(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-destructive mb-3">{error}</p>
        <button onClick={load} className="text-sm text-primary hover:underline">Retry</button>
      </div>
    </div>
  );

  const t = analytics?.totals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening at your restaurant today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: t?.orders ?? 0, today: t?.ordersToday ?? 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Appointments", value: t?.appointments ?? 0, today: t?.appointmentsToday ?? 0, icon: CalendarClock, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "AI Calls", value: t?.calls ?? 0, today: t?.callsToday ?? 0, icon: Phone, color: "text-green-600", bg: "bg-green-50" },
          { label: "Revenue", value: formatCurrency(t?.revenue ?? 0), today: null, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, today, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                  {today !== null && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {today} today
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.recentOrders?.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">No orders yet</div>
            ) : (
              <div className="divide-y divide-border">
                {analytics?.recentOrders?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.recentAppointments?.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">No appointments yet</div>
            ) : (
              <div className="divide-y divide-border">
                {analytics?.recentAppointments?.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{appt.customerName}</p>
                      <p className="text-xs text-muted-foreground">{appt.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(appt.date)}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Calls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            Recent AI Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {analytics?.recentCalls?.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">No calls recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Business</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics?.recentCalls?.map((call) => (
                    <tr key={call.id} className="hover:bg-muted/30">
                      <td className="px-6 py-3">{call.business?.name || "Unknown"}</td>
                      <td className="px-6 py-3 text-muted-foreground">{call.duration}s</td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDate(call.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
