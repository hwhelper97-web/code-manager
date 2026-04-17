import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Plus, Pencil, Trash2, Loader2, Search, UtensilsCrossed, Tag,
  DollarSign, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MenuSize {
  id: string;
  name: string;
  price: number;
}

interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  sizes: MenuSize[];
  addons: MenuAddon[];
}

function getActiveBusinessId() {
  return localStorage.getItem("activeBizId") || "";
}

const CATEGORIES = ["Starters", "Mains", "Burgers", "Pizza", "Pasta", "Salads", "Desserts", "Drinks", "Sides", "Specials", "Breakfast", "Lunch", "Dinner", "General"];

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category: "General", available: true, imageUrl: "",
    sizes: [] as { name: string; price: string }[],
    addons: [] as { name: string; price: string }[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sizeInput, setSizeInput] = useState({ name: "", price: "" });
  const [addonInput, setAddonInput] = useState({ name: "", price: "" });
  const [addingSize, setAddingSize] = useState<string | null>(null);
  const [addingAddon, setAddingAddon] = useState<string | null>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const addonRef = useRef<HTMLInputElement>(null);

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
      const data = await api.get(`/menu?businessId=${bizId}`);
      if (data.success) setItems(data.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", category: "General", available: true, imageUrl: "", sizes: [], addons: [] });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price ?? ""),
      category: item.category || "General",
      available: item.available,
      imageUrl: item.imageUrl || "",
      sizes: [],
      addons: []
    });
    setError("");
    setModalOpen(true);
  };

  const addSizeToForm = () => {
    if (!sizeInput.name) return;
    setForm((f) => ({ ...f, sizes: [...f.sizes, { name: sizeInput.name, price: sizeInput.price || "0" }] }));
    setSizeInput({ name: "", price: "" });
  };

  const addAddonToForm = () => {
    if (!addonInput.name) return;
    setForm((f) => ({ ...f, addons: [...f.addons, { name: addonInput.name, price: addonInput.price || "0" }] }));
    setAddonInput({ name: "", price: "" });
  };

  const handleSave = async () => {
    if (!form.name) { setError("Name is required"); return; }
    const bizId = getActiveBusinessId();
    if (!bizId) { setError("Please select a business first"); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        const data = await api.put(`/menu/${editing.id}`, {
          name: form.name, description: form.description,
          price: parseFloat(form.price) || 0, category: form.category,
          available: form.available, imageUrl: form.imageUrl || null
        });
        if (data.success) setItems((prev) => prev.map((i) => i.id === editing.id ? data.data : i));
      } else {
        const data = await api.post("/menu", {
          name: form.name, description: form.description,
          price: parseFloat(form.price) || 0, category: form.category,
          available: form.available, imageUrl: form.imageUrl || null,
          businessId: bizId,
          sizes: form.sizes.map((s) => ({ name: s.name, price: parseFloat(s.price) || 0 })),
          addons: form.addons.map((a) => ({ name: a.name, price: parseFloat(a.price) || 0 }))
        });
        if (data.success) setItems((prev) => [data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/menu/${confirmDelete.id}`);
      setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
    } catch {} finally { setConfirmDelete(null); }
  };

  const toggleAvailable = async (item: MenuItem) => {
    try {
      const data = await api.put(`/menu/${item.id}`, { available: !item.available });
      if (data.success) setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i));
    } catch {}
  };

  const handleAddSize = async (itemId: string) => {
    if (!sizeInput.name) return;
    try {
      const data = await api.post(`/menu/${itemId}/sizes`, { name: sizeInput.name, price: parseFloat(sizeInput.price) || 0 });
      if (data.success) {
        setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, sizes: [...i.sizes, data.data] } : i));
        setSizeInput({ name: "", price: "" });
        setAddingSize(null);
      }
    } catch {}
  };

  const handleDeleteSize = async (itemId: string, sizeId: string) => {
    try {
      await api.delete(`/menu/${itemId}/sizes/${sizeId}`);
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, sizes: i.sizes.filter((s) => s.id !== sizeId) } : i));
    } catch {}
  };

  const handleAddAddon = async (itemId: string) => {
    if (!addonInput.name) return;
    try {
      const data = await api.post(`/menu/${itemId}/addons`, { name: addonInput.name, price: parseFloat(addonInput.price) || 0 });
      if (data.success) {
        setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, addons: [...i.addons, data.data] } : i));
        setAddonInput({ name: "", price: "" });
        setAddingAddon(null);
      }
    } catch {}
  };

  const handleDeleteAddon = async (itemId: string, addonId: string) => {
    try {
      await api.delete(`/menu/${itemId}/addons/${addonId}`);
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, addons: i.addons.filter((a) => a.id !== addonId) } : i));
    } catch {}
  };

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || i.category === filterCat;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">{items.length} items across {Object.keys(grouped).length} categories</p>
        </div>
        <Button onClick={openAdd} className="sm:w-auto w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No menu items found</p>
          <Button onClick={openAdd} variant="outline" className="mt-4" size="sm">Add your first item</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{category}</h3>
                <Badge variant="secondary" className="text-xs">{catItems.length}</Badge>
              </div>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <Card key={item.id} className={`border-border ${!item.available ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description || "No description"}</p>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                            title="Manage sizes & addons"
                          >
                            {expandedItem === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(item)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-bold text-green-700">${(item.price ?? 0).toFixed(2)}</span>
                          {item.sizes.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">+{item.sizes.length} sizes</span>
                          )}
                          {item.addons.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">+{item.addons.length} addons</span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleAvailable(item)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                            item.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.available
                            ? <><ToggleRight className="w-3.5 h-3.5" /> Available</>
                            : <><ToggleLeft className="w-3.5 h-3.5" /> Unavailable</>}
                        </button>
                      </div>

                      {/* Expanded: Sizes & Addons */}
                      {expandedItem === item.id && (
                        <div className="mt-3 pt-3 border-t border-border space-y-4">
                          {/* Sizes */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sizes</p>
                              <button
                                onClick={() => { setAddingSize(item.id); setTimeout(() => sizeRef.current?.focus(), 50); }}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Size
                              </button>
                            </div>
                            {item.sizes.length === 0 && addingSize !== item.id && (
                              <p className="text-xs text-muted-foreground italic">No sizes yet</p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizes.map((size) => (
                                <span key={size.id} className="flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs">
                                  {size.name} (+${size.price.toFixed(2)})
                                  <button onClick={() => handleDeleteSize(item.id, size.id)} className="text-muted-foreground hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            {addingSize === item.id && (
                              <div className="flex gap-2 mt-2">
                                <Input ref={sizeRef} placeholder="e.g. Large" value={sizeInput.name} onChange={(e) => setSizeInput((s) => ({ ...s, name: e.target.value }))} className="h-7 text-xs flex-1" />
                                <Input placeholder="Price" type="number" value={sizeInput.price} onChange={(e) => setSizeInput((s) => ({ ...s, price: e.target.value }))} className="h-7 text-xs w-20" />
                                <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleAddSize(item.id)}>Add</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingSize(null)}>Cancel</Button>
                              </div>
                            )}
                          </div>

                          {/* Addons */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add-ons</p>
                              <button
                                onClick={() => { setAddingAddon(item.id); setTimeout(() => addonRef.current?.focus(), 50); }}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Add-on
                              </button>
                            </div>
                            {item.addons.length === 0 && addingAddon !== item.id && (
                              <p className="text-xs text-muted-foreground italic">No add-ons yet</p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {item.addons.map((addon) => (
                                <span key={addon.id} className="flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs">
                                  {addon.name} (+${addon.price.toFixed(2)})
                                  <button onClick={() => handleDeleteAddon(item.id, addon.id)} className="text-muted-foreground hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            {addingAddon === item.id && (
                              <div className="flex gap-2 mt-2">
                                <Input ref={addonRef} placeholder="e.g. Extra Cheese" value={addonInput.name} onChange={(e) => setAddonInput((a) => ({ ...a, name: e.target.value }))} className="h-7 text-xs flex-1" />
                                <Input placeholder="Price" type="number" value={addonInput.price} onChange={(e) => setAddonInput((a) => ({ ...a, price: e.target.value }))} className="h-7 text-xs w-20" />
                                <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleAddAddon(item.id)}>Add</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingAddon(null)}>Cancel</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input placeholder="e.g. Margherita Pizza" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Base Price ($)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>

            {!editing && (
              <>
                {/* Sizes inline */}
                <div className="space-y-2 border border-border rounded-lg p-3">
                  <p className="text-sm font-medium">Sizes (optional)</p>
                  {form.sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="flex-1">{s.name}</span>
                      <span className="text-muted-foreground">+${parseFloat(s.price || "0").toFixed(2)}</span>
                      <button onClick={() => setForm((f) => ({ ...f, sizes: f.sizes.filter((_, ii) => ii !== i) }))} className="text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Size name" value={sizeInput.name} onChange={(e) => setSizeInput((s) => ({ ...s, name: e.target.value }))} className="h-7 text-xs" />
                    <Input type="number" placeholder="+Price" value={sizeInput.price} onChange={(e) => setSizeInput((s) => ({ ...s, price: e.target.value }))} className="h-7 text-xs w-20" />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addSizeToForm}>Add</Button>
                  </div>
                </div>

                {/* Addons inline */}
                <div className="space-y-2 border border-border rounded-lg p-3">
                  <p className="text-sm font-medium">Add-ons (optional)</p>
                  {form.addons.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="flex-1">{a.name}</span>
                      <span className="text-muted-foreground">+${parseFloat(a.price || "0").toFixed(2)}</span>
                      <button onClick={() => setForm((f) => ({ ...f, addons: f.addons.filter((_, ii) => ii !== i) }))} className="text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Add-on name" value={addonInput.name} onChange={(e) => setAddonInput((a) => ({ ...a, name: e.target.value }))} className="h-7 text-xs" />
                    <Input type="number" placeholder="+Price" value={addonInput.price} onChange={(e) => setAddonInput((a) => ({ ...a, price: e.target.value }))} className="h-7 text-xs w-20" />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addAddonToForm}>Add</Button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked }) } className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm">Available for ordering</span>
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
