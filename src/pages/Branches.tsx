import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Plus, Loader2, GitBranch, Pencil, Trash2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface Branch {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  isMain: boolean;
  createdAt: string;
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "", phone: "", isMain: false });
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
      const data = await api.get(`/branches?businessId=${bizId}`);
      if (data.success) setBranches(data.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", address: "", city: "", country: "", phone: "", isMain: false });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      city: branch.city || "",
      country: branch.country || "",
      phone: branch.phone || "",
      isMain: branch.isMain
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address) { setError("Name and address are required"); return; }
    const bizId = getActiveBusinessId();
    if (!bizId && !editing) { setError("Please select a business first"); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        const data = await api.put(`/branches/${editing.id}`, form);
        if (data.success) {
          setBranches((prev) => form.isMain
            ? prev.map((b) => ({ ...b, isMain: b.id === editing.id ? true : false })).map((b) => b.id === editing.id ? data.data : b)
            : prev.map((b) => b.id === editing.id ? data.data : b)
          );
        }
      } else {
        const data = await api.post("/branches", { ...form, businessId: bizId });
        if (data.success) {
          setBranches((prev) => form.isMain
            ? [data.data, ...prev.map((b) => ({ ...b, isMain: false }))]
            : [data.data, ...prev]
          );
        }
      }
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save branch");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/branches/${confirmDelete.id}`);
      setBranches((prev) => prev.filter((b) => b.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-muted-foreground mt-1">{branches.length} location{branches.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <GitBranch className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No branches yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your restaurant locations here</p>
          <Button onClick={openAdd} variant="outline" className="mt-4" size="sm">Add first branch</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <Card key={branch.id} className={`border-border ${branch.isMain ? "border-primary/50" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${branch.isMain ? "bg-primary" : "bg-muted"}`}>
                      <MapPin className={`w-4.5 h-4.5 ${branch.isMain ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{branch.name}</h4>
                      {branch.isMain && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500" />
                          Main Branch
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(branch)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(branch)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{branch.address}</p>
                  {(branch.city || branch.country) && (
                    <p className="text-sm text-muted-foreground">
                      {[branch.city, branch.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {branch.phone && <p className="text-xs text-muted-foreground">{branch.phone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Branch Name *</Label>
              <Input placeholder="e.g. Downtown Location, Main Street" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input placeholder="123 Main Street" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="New York" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input placeholder="USA" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1 555 0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isMain}
                onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-sm">Set as main branch</span>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? "Save Changes" : "Add Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Branch"
        description={`Are you sure you want to delete "${confirmDelete?.name}"?`}
        onConfirm={handleDelete}
        confirmLabel="Delete Branch"
      />
    </div>
  );
}
