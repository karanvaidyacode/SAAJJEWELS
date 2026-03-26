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
  Tag,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Copy,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Archive,
  ArrowLeft,
  Menu,
  LogOut,
  LayoutDashboard,
  ListOrdered,
  Users,
  List,
  Megaphone,
} from "lucide-react";

export default function CouponManagement() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "0",
    maxUses: "",
    perUserLimit: "1",
    isActive: true,
    expiresAt: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("soft");
  const [viewCoupon, setViewCoupon] = useState(null);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Tag, label: "Coupons", path: "/admin/coupons" },
    { icon: Megaphone, label: "Popups & Promos", path: "/admin/popups" },
  ];

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsRes, statsRes] = await Promise.all([
        fetchApi(`/api/admin/coupons/?include_deleted=${showDeleted}`),
        fetchApi("/api/admin/coupons/stats"),
      ]);
      setCoupons(couponsRes.coupons || []);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const resetForm = () => {
    setForm({ code: "", description: "", discountType: "percentage", discountValue: "", maxDiscount: "", minOrderValue: "0", maxUses: "", perUserLimit: "1", isActive: true, expiresAt: "" });
    setEditing(null);
    setFormError("");
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      minOrderValue: String(coupon.minOrderValue || 0),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      perUserLimit: String(coupon.perUserLimit || 1),
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const payload = {
      code: form.code,
      description: form.description || null,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      minOrderValue: parseFloat(form.minOrderValue || "0"),
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : 1,
      isActive: form.isActive,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editing) {
        await fetchApi(`/api/admin/coupons/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchApi("/api/admin/coupons/", { method: "POST", body: JSON.stringify(payload) });
      }
      setFormOpen(false);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setFormError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(`/api/admin/coupons/${deleteTarget.id}/${deleteType}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) { console.error("Delete failed:", err); }
  };

  const handleRestore = async (id) => {
    try { await fetchApi(`/api/admin/coupons/${id}/restore`, { method: "POST" }); fetchCoupons(); } catch (err) { console.error("Restore failed:", err); }
  };

  const copyCode = async (code) => { try { await navigator.clipboard.writeText(code); } catch {} };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never";
  const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
  const getStatus = (c) => {
    if (c.isDeleted) return { label: "Deleted", color: "bg-gray-400 text-white" };
    if (!c.isActive) return { label: "Inactive", color: "bg-orange-100 text-orange-700" };
    if (isExpired(c)) return { label: "Expired", color: "bg-red-100 text-red-700" };
    if (c.maxUses && c.usedCount >= c.maxUses) return { label: "Exhausted", color: "bg-red-100 text-red-700" };
    return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
  };

  const handleLogout = () => { localStorage.removeItem("adminToken"); navigate("/admin/login"); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <span className="sr-only">Close</span>✕
          </Button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = item.path === "/admin/coupons";
              return (
                <li key={i}>
                  <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start" onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                    <Icon className="mr-2 h-4 w-4" /> {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Coupon Management</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchCoupons}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> New Coupon
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Coupons</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalCoupons ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Coupons</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeCoupons ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Uses</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalUses ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Toggle deleted */}
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="accent-primary" />
              Show deleted coupons
            </label>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-lg">All Coupons</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Discount</th>
                    <th className="text-left p-4">Usage</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Expiry</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Loading...</td></tr>
                  ) : coupons.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No coupons found. Create your first coupon!</td></tr>
                  ) : (
                    coupons.map((c) => {
                      const status = getStatus(c);
                      return (
                        <tr key={c.id} className={`border-b hover:bg-gray-50 transition-colors ${c.isDeleted ? "opacity-50" : ""}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{c.code}</span>
                              <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy code">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{c.description}</p>}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold">{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</span>
                            {c.maxDiscount && <span className="text-xs text-muted-foreground block">max ₹{c.maxDiscount}</span>}
                          </td>
                          <td className="p-4">{c.usedCount} / {c.maxUses ?? "∞"}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                          </td>
                          <td className="p-4 text-muted-foreground text-xs">{formatDate(c.expiresAt)}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setViewCoupon(c)} className="p-2 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              {!c.isDeleted && (
                                <button onClick={() => openEdit(c)} className="p-2 text-muted-foreground hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors" title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {c.isDeleted ? (
                                <button onClick={() => handleRestore(c.id)} className="p-2 text-muted-foreground hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="Restore">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => { setDeleteTarget(c); setDeleteType("soft"); }} className="p-2 text-muted-foreground hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors" title="Archive">
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => { setDeleteTarget(c); setDeleteType("hard"); }} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Permanently delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold">{editing ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {editing ? "Update coupon details." : "Fill in the details to create a new coupon code."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code *</label>
              <Input placeholder="E.G. WELCOME20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!editing} className="uppercase tracking-widest" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input placeholder="e.g. Welcome discount for new users" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value * ({form.discountType === "percentage" ? "%" : "₹"})</label>
                <Input type="number" placeholder={form.discountType === "percentage" ? "20" : "500"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
                <Input type="number" placeholder="e.g. 500" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Order (₹)</label>
                <Input type="number" placeholder="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Max Uses</label>
                <Input type="number" placeholder="Unlimited" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Per User Limit</label>
                <Input type="number" placeholder="1" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} min="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires At</label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            {formError && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">{formError}</div>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : editing ? "Update Coupon" : "Create Coupon"}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {deleteType === "hard" ? "Permanently Delete" : "Archive"} Coupon
          </DialogTitle>
          <DialogDescription>
            {deleteType === "hard"
              ? `This will permanently remove "${deleteTarget?.code}" from the database. This cannot be undone.`
              : `This will archive "${deleteTarget?.code}". You can restore it later.`}
          </DialogDescription>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleDelete} variant={deleteType === "hard" ? "destructive" : "default"} className="flex-1">
              {deleteType === "hard" ? "Delete Permanently" : "Archive"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail */}
      <Dialog open={!!viewCoupon} onOpenChange={(o) => { if (!o) setViewCoupon(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogTitle className="text-lg font-bold">Coupon Details</DialogTitle>
          <DialogDescription className="sr-only">Details for coupon {viewCoupon?.code}</DialogDescription>
          {viewCoupon && (
            <div className="space-y-3 mt-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono font-bold">{viewCoupon.code}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{viewCoupon.discountType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Value</span><span>{viewCoupon.discountType === "percentage" ? `${viewCoupon.discountValue}%` : `₹${viewCoupon.discountValue}`}</span></div>
              {viewCoupon.maxDiscount && <div className="flex justify-between"><span className="text-muted-foreground">Max Discount</span><span>₹{viewCoupon.maxDiscount}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Min Order</span><span>₹{viewCoupon.minOrderValue || 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Usage</span><span>{viewCoupon.usedCount} / {viewCoupon.maxUses ?? "∞"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Per User</span><span>{viewCoupon.perUserLimit ?? "∞"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatus(viewCoupon).color}`}>{getStatus(viewCoupon).label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>{formatDate(viewCoupon.expiresAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(viewCoupon.createdAt)}</span></div>
              {viewCoupon.description && <div className="pt-2 border-t"><span className="text-muted-foreground block mb-1">Description</span><p>{viewCoupon.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
