import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Plus, Loader2, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Order {
  id: string;
  customerName: string;
  total: number;
  status: string;
  notes?: string;
  createdAt: string;
  business?: { name: string };
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice?: number;
    menuItem: { name: string; price: number };
  }>;
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

const STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    preparing: "bg-orange-100 text-orange-800 border-orange-200",
    ready: "bg-teal-100 text-teal-800 border-teal-200",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium capitalize ${classes[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [form, setForm] = useState({ customerName: "", total: "", notes: "", status: "pending" });
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
      const data = await api.get(`/order?businessId=${bizId}&limit=100`);
      if (data.success) setOrders(data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.customerName) { setError("Customer name is required"); return; }
    const bizId = getActiveBusinessId();
    if (!bizId) { setError("Please select a business first"); return; }
    setSaving(true); setError("");
    try {
      const data = await api.post("/order", {
        customerName: form.customerName,
        total: parseFloat(form.total) || 0,
        notes: form.notes || null,
        status: form.status,
        businessId: bizId
      });
      if (data.success) {
        setOrders((prev) => [data.data, ...prev]);
        setModalOpen(false);
        setForm({ customerName: "", total: "", notes: "", status: "pending" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally { setSaving(false); }
  };

  const updateStatus = async (order: Order, status: string) => {
    try {
      const data = await api.patch(`/order/${order.id}/status`, { status });
      if (data.success) setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status } : o));
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/order/${confirmDelete.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">{orders.length} total orders</p>
        </div>
        <Button onClick={() => { setModalOpen(true); setError(""); setForm({ customerName: "", total: "", notes: "", status: "pending" }); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customerName}</div>
                      {order.notes && <div className="text-xs text-muted-foreground">{order.notes}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">${(order.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Select value={order.status} onValueChange={(v) => updateStatus(order, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs border-0 p-0 bg-transparent">
                          <StatusBadge status={order.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDelete(order)}
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
          <DialogHeader><DialogTitle>Create New Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input placeholder="e.g. John Smith" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Special instructions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Order"
        description={`Are you sure you want to delete the order for "${confirmDelete?.customerName}"?`}
        onConfirm={handleDelete}
        confirmLabel="Delete Order"
      />
    </div>
  );
}
