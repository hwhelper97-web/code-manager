import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Plus, Loader2, Search, CalendarClock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Appointment {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  status: string;
  notes?: string;
  phone?: string;
  business?: { name: string };
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

const STATUSES = ["scheduled", "confirmed", "completed", "cancelled", "no-show"];

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    scheduled: "bg-purple-100 text-purple-800 border-purple-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    "no-show": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium capitalize ${classes[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ customerName: "", serviceName: "", date: "", phone: "", notes: "", status: "scheduled" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const data = await api.get(`/appointment?businessId=${bizId}`);
      if (data.success) setAppointments(data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.customerName || !form.serviceName || !form.date) {
      setError("Customer name, service, and date are required");
      return;
    }
    const bizId = getActiveBusinessId();
    if (!bizId) { setError("Please select a business first"); return; }
    setSaving(true); setError("");
    try {
      const data = await api.post("/appointment", {
        customerName: form.customerName,
        serviceName: form.serviceName,
        date: form.date,
        phone: form.phone || null,
        notes: form.notes || null,
        status: form.status,
        businessId: bizId
      });
      if (data.success) {
        setAppointments((prev) => [data.data, ...prev]);
        setModalOpen(false);
        setForm({ customerName: "", serviceName: "", date: "", phone: "", notes: "", status: "scheduled" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create appointment");
    } finally { setSaving(false); }
  };

  const updateStatus = async (appt: Appointment, status: string) => {
    try {
      const data = await api.patch(`/appointment/${appt.id}/status`, { status });
      if (data.success) setAppointments((prev) => prev.map((a) => a.id === appt.id ? { ...a, status } : a));
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/appointment/${confirmDelete.id}`);
      setAppointments((prev) => prev.filter((a) => a.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  const filtered = appointments.filter((a) => {
    const matchSearch = a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">{appointments.length} total appointments</p>
        </div>
        <Button onClick={() => { setModalOpen(true); setError(""); setForm({ customerName: "", serviceName: "", date: "", phone: "", notes: "", status: "scheduled" }); }}>
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <CalendarClock className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No appointments found</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{appt.customerName}</div>
                      {appt.phone && <div className="text-xs text-muted-foreground">{appt.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{appt.serviceName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br />
                      <span className="text-xs">{new Date(appt.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={appt.status} onValueChange={(v) => updateStatus(appt, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs border-0 p-0 bg-transparent">
                          <StatusBadge status={appt.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDelete(appt)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Customer Name *</Label>
                <Input placeholder="e.g. Jane Doe" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Service *</Label>
                <Input placeholder="e.g. Table Reservation, Catering" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555 0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any special requests..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Cancel Appointment"
        description={`Are you sure you want to delete the appointment for "${confirmDelete?.customerName}"?`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
