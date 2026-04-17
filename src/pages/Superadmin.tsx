import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Plus, Loader2, Shield, Users, Building, ShoppingCart, Phone,
  Trash2, CalendarClock, TrendingUp, Upload, Image, X, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Business {
  id: string;
  name: string;
  mode: string;
  type: string;
  phoneNumber: string;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
  logoUrl?: string;
  createdAt: string;
  businesses: Business[];
  _count: { users: number; businesses: number; orders: number; calls: number; appointments: number };
}

interface Analytics {
  totalTenants: number;
  totalUsers: number;
  totalOrders: number;
  totalCalls: number;
  totalAppointments: number;
  totalMenuItems: number;
  callsToday: number;
  ordersToday: number;
  appointmentsToday: number;
  newTenantsThisMonth: number;
  totalRevenue: number;
}

const BUSINESS_TYPES_ORDER = ["restaurant", "cafe", "pizza", "burger", "bakery", "food truck", "takeaway", "bar"];
const BUSINESS_TYPES_APPT = ["clinic", "salon", "dental", "barbershop", "spa", "physiotherapy", "veterinary", "gym"];

export default function Superadmin() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    tenantName: "", email: "", password: "", name: "",
    businessMode: "order", businessType: "restaurant",
    phoneNumber: "", logoUrl: ""
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tenantsData, analyticsData] = await Promise.all([
        api.get("/superadmin/tenants"),
        api.get("/superadmin/analytics")
      ]);
      if (tenantsData.success) setTenants(tenantsData.data);
      if (analyticsData.success) setAnalytics(analyticsData.data);
    } catch {} finally { setLoading(false); }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!form.tenantName || !form.email || !form.password) {
      setError("Business name, email, and password are required"); return;
    }
    setSaving(true); setError("");
    try {
      const data = await api.post("/superadmin/create-tenant", form);
      if (data.success) {
        await loadAll();
        setModalOpen(false);
        setForm({ tenantName: "", email: "", password: "", name: "", businessMode: "order", businessType: "restaurant", phoneNumber: "", logoUrl: "" });
        setLogoPreview("");
      } else {
        setError(data.message || "Failed to create");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create tenant");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/superadmin/tenants/${confirmDelete.id}`);
      setTenants((prev) => prev.filter((t) => t.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  const businessTypeOptions = form.businessMode === "appointment" ? BUSINESS_TYPES_APPT : BUSINESS_TYPES_ORDER;

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Superadmin Panel</h1>
          <p className="text-muted-foreground text-sm">Platform-wide management — maker access only</p>
        </div>
      </div>

      {/* Platform analytics */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tenants", value: analytics.totalTenants, sub: `+${analytics.newTenantsThisMonth} this month`, icon: Building, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Users", value: analytics.totalUsers, sub: "across all accounts", icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40" },
            { label: "Orders", value: analytics.totalOrders, sub: `${analytics.ordersToday} today`, icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/40" },
            { label: "AI Calls", value: analytics.totalCalls, sub: `${analytics.callsToday} today`, icon: Phone, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Appointments", value: analytics.totalAppointments, sub: `${analytics.appointmentsToday} today`, icon: CalendarClock, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40" },
            { label: "Menu Items", value: analytics.totalMenuItems, sub: "platform-wide", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/40" },
            { label: "Revenue", value: `$${analytics.totalRevenue.toFixed(0)}`, sub: "all time", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <Card key={label} className="col-span-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tenant management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Registered Businesses ({tenants.length})</CardTitle>
            <Button size="sm" onClick={() => { setModalOpen(true); setError(""); setLogoPreview(""); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No businesses registered yet</div>
          ) : (
            <div className="divide-y divide-border">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20">
                  {/* Logo */}
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant.name} className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{tenant.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{tenant.name}</p>
                      {tenant.businesses[0] && (
                        <Badge variant={tenant.businesses[0].mode === "appointment" ? "default" : "secondary"} className="text-xs capitalize">
                          {tenant.businesses[0].mode}
                        </Badge>
                      )}
                      {tenant.businesses[0] && (
                        <span className="text-xs text-muted-foreground capitalize">{tenant.businesses[0].type}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tenant._count.users} users · {tenant._count.businesses} locations · {tenant._count.orders} orders · {tenant._count.calls} calls · {tenant._count.appointments} appointments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Plan: <span className="capitalize font-medium">{tenant.plan}</span> · Joined {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <BadgeCheck className="w-4 h-4 text-green-500" />
                    <button
                      onClick={() => setConfirmDelete(tenant)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Business Logo (optional)</Label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-border" />
                    <button onClick={() => { setLogoPreview(""); setForm((f) => ({ ...f, logoUrl: "" })); }} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input placeholder="e.g. The Golden Fork" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
            </div>

            {/* Business Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Business Mode *</Label>
                <Select value={form.businessMode} onValueChange={(v) => setForm({ ...form, businessMode: v, businessType: v === "order" ? "restaurant" : "clinic" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order-Based (Food)</SelectItem>
                    <SelectItem value="appointment">Appointment-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Type *</Label>
                <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {businessTypeOptions.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Phone (optional)</Label>
              <Input placeholder="+1 555 0100" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Owner Account</p>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input placeholder="e.g. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Owner Email *</Label>
                <Input type="email" placeholder="owner@business.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Register Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Business Account"
        description={`Are you sure you want to permanently delete "${confirmDelete?.name}" and ALL their data? This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
