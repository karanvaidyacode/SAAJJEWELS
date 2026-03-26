import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  AlertTriangle,
  Archive,
  Power,
  Gift,
  Menu,
  LogOut,
  LayoutDashboard,
  ListOrdered,
  Users,
  Tag,
} from "lucide-react";

export default function PopupManagement() {
  const navigate = useNavigate();
  const [popups, setPopups] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", couponId: "", delaySeconds: "5", showOnPages: "all", isActive: true, startsAt: "", endsAt: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("soft");
  const [viewPopup, setViewPopup] = useState(null);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Tag, label: "Coupons", path: "/admin/coupons" },
    { icon: Megaphone, label: "Popups & Promos", path: "/admin/popups" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [popupsRes, couponsRes] = await Promise.all([
        fetchApi(`/api/admin/popups/?include_deleted=${showDeleted}`),
        fetchApi("/api/admin/coupons/"),
      ]);
      setPopups(popupsRes.popups || []);
      setCoupons(couponsRes.coupons || []);
    } catch (err) { console.error("Failed to fetch popups:", err); }
    finally { setLoading(false); }
  }, [showDeleted]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => { setForm({ title: "", description: "", couponId: "", delaySeconds: "5", showOnPages: "all", isActive: true, startsAt: "", endsAt: "" }); setEditing(null); setFormError(""); };
  const openCreate = () => { resetForm(); setFormOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description || "", couponId: p.couponId ? String(p.couponId) : "", delaySeconds: String(p.delaySeconds), showOnPages: p.showOnPages || "all", isActive: p.isActive, startsAt: p.startsAt ? new Date(p.startsAt).toISOString().slice(0, 16) : "", endsAt: p.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : "" });
    setFormError(""); setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(""); setSaving(true);
    const payload = { title: form.title, description: form.description || null, couponId: form.couponId ? parseInt(form.couponId) : null, delaySeconds: parseInt(form.delaySeconds) || 5, showOnPages: form.showOnPages || "all", isActive: form.isActive, startsAt: form.startsAt || null, endsAt: form.endsAt || null };
    try {
      if (editing) await fetchApi(`/api/admin/popups/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await fetchApi("/api/admin/popups/", { method: "POST", body: JSON.stringify(payload) });
      setFormOpen(false); resetForm(); fetchData();
    } catch (err) { setFormError(err.message || "Failed to save popup"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => { if (!deleteTarget) return; try { await fetchApi(`/api/admin/popups/${deleteTarget.id}/${deleteType}`, { method: "DELETE" }); setDeleteTarget(null); fetchData(); } catch (err) { console.error("Delete failed:", err); } };
  const handleRestore = async (id) => { try { await fetchApi(`/api/admin/popups/${id}/restore`, { method: "POST" }); fetchData(); } catch (err) { console.error("Restore failed:", err); } };
  const handleToggle = async (id) => { try { await fetchApi(`/api/admin/popups/${id}/toggle`, { method: "PATCH" }); fetchData(); } catch (err) { console.error("Toggle failed:", err); } };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const getStatus = (p) => {
    if (p.isDeleted) return { label: "Deleted", color: "bg-gray-200 text-gray-600" };
    if (!p.isActive) return { label: "Inactive", color: "bg-orange-100 text-orange-700" };
    const now = new Date();
    if (p.startsAt && new Date(p.startsAt) > now) return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
    if (p.endsAt && new Date(p.endsAt) < now) return { label: "Ended", color: "bg-red-100 text-red-700" };
    return { label: "Live", color: "bg-emerald-100 text-emerald-700" };
  };

  const handleLogout = () => { localStorage.removeItem("adminToken"); navigate("/admin/login"); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>✕</Button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = item.path === "/admin/popups";
              return (
                <li key={i}><Button variant={isActive ? "default" : "ghost"} className="w-full justify-start" onClick={() => { navigate(item.path); setSidebarOpen(false); }}><Icon className="mr-2 h-4 w-4" /> {item.label}</Button></li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
            <h1 className="text-xl font-semibold">Popups & Promotions</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
              <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Popup</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Popups</p>
              <p className="text-3xl font-bold mt-1">{popups.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Now</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{popups.filter(p => getStatus(p).label === "Live").length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">With Coupon</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{popups.filter(p => p.couponCode).length}</p>
            </Card>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="accent-primary" />
              Show deleted popups
            </label>
          </div>

          {/* Popup list */}
          <div className="grid gap-4">
            {loading ? (
              <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
            ) : popups.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No popups configured yet. Create your first promotional popup!</Card>
            ) : popups.map((p) => {
              const status = getStatus(p);
              return (
                <Card key={p.id} className={`p-5 ${p.isDeleted ? "opacity-50" : ""}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg truncate">{p.title}</h3>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground mb-2">{p.description}</p>}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Delay: {p.delaySeconds}s</span>
                        <span>Pages: {p.showOnPages || "all"}</span>
                        {p.couponCode && (
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Gift className="w-3 h-3" />
                            {p.couponCode} ({p.couponDiscountType === "percentage" ? `${p.couponDiscountValue}%` : `₹${p.couponDiscountValue}`})
                          </span>
                        )}
                        {p.startsAt && <span>Starts: {formatDate(p.startsAt)}</span>}
                        {p.endsAt && <span>Ends: {formatDate(p.endsAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setViewPopup(p)} className="p-2 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-blue-50" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleToggle(p.id)} className={`p-2 rounded-lg transition-colors ${p.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:bg-gray-100"}`} title={p.isActive ? "Deactivate" : "Activate"}><Power className="w-4 h-4" /></button>
                      {!p.isDeleted && <button onClick={() => openEdit(p)} className="p-2 text-muted-foreground hover:text-amber-600 rounded-lg hover:bg-amber-50" title="Edit"><Pencil className="w-4 h-4" /></button>}
                      {p.isDeleted ? (
                        <button onClick={() => handleRestore(p.id)} className="p-2 text-muted-foreground hover:text-emerald-600 rounded-lg hover:bg-emerald-50" title="Restore"><RotateCcw className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => { setDeleteTarget(p); setDeleteType("soft"); }} className="p-2 text-muted-foreground hover:text-orange-600 rounded-lg hover:bg-orange-50" title="Archive"><Archive className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => { setDeleteTarget(p); setDeleteType("hard"); }} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50" title="Permanently delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold">{editing ? "Edit Popup" : "Create New Popup"}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">{editing ? "Update popup settings." : "Configure a new promotional popup for the storefront."}</DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input placeholder="e.g. Claim 10% OFF" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input placeholder="e.g. Enter your email to receive the coupon code" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Linked Coupon</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.couponId} onChange={(e) => setForm({ ...form, couponId: e.target.value })}>
                <option value="">No coupon (info-only popup)</option>
                {coupons.filter(c => c.isActive && !c.isDeleted).map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Delay (seconds)</label>
                <Input type="number" value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: e.target.value })} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Show On Pages</label>
                <Input placeholder="all" value={form.showOnPages} onChange={(e) => setForm({ ...form, showOnPages: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Starts At</label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ends At</label>
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            {formError && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">{formError}</div>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : editing ? "Update Popup" : "Create Popup"}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold"><AlertTriangle className="w-5 h-5 text-amber-500" />{deleteType === "hard" ? "Permanently Delete" : "Archive"} Popup</DialogTitle>
          <DialogDescription>{deleteType === "hard" ? `This will permanently remove "${deleteTarget?.title}". This cannot be undone.` : `This will archive "${deleteTarget?.title}". You can restore it later.`}</DialogDescription>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleDelete} variant={deleteType === "hard" ? "destructive" : "default"} className="flex-1">{deleteType === "hard" ? "Delete Permanently" : "Archive"}</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail */}
      <Dialog open={!!viewPopup} onOpenChange={(o) => { if (!o) setViewPopup(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogTitle className="text-lg font-bold">Popup Details</DialogTitle>
          <DialogDescription className="sr-only">Details for popup {viewPopup?.title}</DialogDescription>
          {viewPopup && (
            <div className="space-y-3 mt-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-bold">{viewPopup.title}</span></div>
              {viewPopup.description && <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{viewPopup.description}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatus(viewPopup).color}`}>{getStatus(viewPopup).label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delay</span><span>{viewPopup.delaySeconds}s</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pages</span><span>{viewPopup.showOnPages || "all"}</span></div>
              {viewPopup.couponCode && <div className="flex justify-between"><span className="text-muted-foreground">Coupon</span><span className="text-purple-600 font-medium">{viewPopup.couponCode}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Starts</span><span>{formatDate(viewPopup.startsAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ends</span><span>{formatDate(viewPopup.endsAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(viewPopup.createdAt)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
