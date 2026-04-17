import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Plus, Loader2, Search, Users, Pencil, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  business?: { id: string; name: string };
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

const ROLES = ["OWNER", "MANAGER", "STAFF"];
const DESIGNATIONS = [
  "Head Chef", "Sous Chef", "Chef de Partie", "Commis Chef",
  "Restaurant Manager", "Floor Manager", "Assistant Manager",
  "Waiter/Waitress", "Cashier", "Host/Hostess",
  "Bartender", "Barista", "Delivery Driver", "Kitchen Staff", "Other"
];

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; class: string }> = {
    OWNER: { label: "Owner", class: "bg-amber-100 text-amber-800 border-amber-200" },
    MANAGER: { label: "Manager", class: "bg-blue-100 text-blue-800 border-blue-200" },
    STAFF: { label: "Staff", class: "bg-gray-100 text-gray-700 border-gray-200" },
  };
  const c = config[role] || config["STAFF"];
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${c.class}`}>{c.label}</span>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", designation: "", role: "STAFF", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.role === "OWNER" || user?.role === "SUPERADMIN";
  const isManager = user?.role === "MANAGER";

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("business-changed", handler);
    return () => window.removeEventListener("business-changed", handler);
  }, []);

  const load = async () => {
    const bizId = getActiveBusinessId();
    if (!bizId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/staff?businessId=${bizId}`);
      if (data.success) setStaff(data.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", designation: "", role: "STAFF", isActive: true });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      designation: member.designation || "",
      role: member.role,
      isActive: member.isActive
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    const bizId = getActiveBusinessId();
    if (!bizId && !editing) { setError("Please select a business first"); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        const data = await api.put(`/staff/${editing.id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          designation: form.designation,
          role: form.role,
          isActive: form.isActive
        });
        if (data.success) setStaff((prev) => prev.map((s) => s.id === editing.id ? data.data : s));
      } else {
        const data = await api.post("/staff", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          designation: form.designation,
          role: form.role,
          businessId: bizId
        });
        if (data.success) setStaff((prev) => [data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save staff member");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/staff/${confirmDelete.id}`);
      setStaff((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || s.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">{staff.length} team members</p>
        </div>
        {(isOwner || isManager) && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Role explanation */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { role: "OWNER", label: "Owner", desc: "Full access to all features", color: "bg-amber-50 border-amber-200", icon: "👑" },
          { role: "MANAGER", label: "Manager", desc: "Can manage menu, staff & orders", color: "bg-blue-50 border-blue-200", icon: "👔" },
          { role: "STAFF", label: "Staff", desc: "Can view orders & appointments", color: "bg-gray-50 border-gray-200", icon: "👤" },
        ].map((r) => (
          <div key={r.role} className={`p-3 rounded-xl border ${r.color}`}>
            <div className="text-lg mb-1">{r.icon}</div>
            <div className="text-xs font-semibold">{r.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No staff members found</p>
          {(isOwner || isManager) && (
            <Button onClick={openAdd} variant="outline" className="mt-4" size="sm">Add first staff member</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <Card key={member.id} className={`border-border ${!member.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(isOwner || isManager) && (
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setConfirmDelete(member)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{member.name}</h4>
                  <p className="text-xs text-muted-foreground">{member.designation || "Team Member"}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{member.email}</p>
                  {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <RoleBadge role={member.role} />
                  <span className={`text-xs ${member.isActive ? "text-green-600" : "text-gray-400"}`}>
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="john@restaurant.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555 0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(isOwner ? ROLES : ROLES.filter((r) => r !== "OWNER")).map((r) => (
                      <SelectItem key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Designation</Label>
                <Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editing && (
                <div className="space-y-2 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm">Active employee</span>
                  </label>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Remove Staff Member"
        description={`Are you sure you want to remove "${confirmDelete?.name}" from the team? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Remove"
      />
    </div>
  );
}
