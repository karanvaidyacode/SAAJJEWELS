import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Edit,
  Trash2,
  RefreshCw,
  Search,
  X,
  Scissors,
  Eye,
  EyeOff,
  Plus,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { fetchApi } from "../../lib/api";
import Cropper from "react-easy-crop";
import { getCroppedImgFile } from "../../utils/cropImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

const AllProductsList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Inactive

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editDragActive, setEditDragActive] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState("soft"); // "soft" or "hard"

  // Media management
  const [mediaManageProductId, setMediaManageProductId] = useState(null);
  const [mediaManageProduct, setMediaManageProduct] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [removingMediaIndex, setRemovingMediaIndex] = useState(null);

  // Cropping State for edit
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentFileToCrop, setCurrentFileToCrop] = useState(null);

  // Predefined categories
  const categories = [
    "All",
    "Necklace",
    "Bracelet",
    "Earrings",
    "Rings",
    "Hamper",
    "Pendants",
    "Scrunchies",
    "Claws",
    "Hairbows",
    "Hairclips",
    "Studs",
    "Jhumka",
    "Custom Packaging",
    "Bouquet",
    "Chocolate Tower",
    "Jhumka Box",
    "Men's Hamper",
  ];

  // Fetch ALL products (including inactive) via admin endpoint
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("adminToken");
      const data = await fetchApi("/api/products/admin/all", {
        headers: { "x-admin-token": adminToken },
      });
      setProducts(Array.isArray(data) ? data : []);
      setFilteredProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch products error", err);
      setMessage(
        "Error fetching products: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search, category, and status
  useEffect(() => {
    let filtered = products;

    // Filter by status
    if (statusFilter === "Active") {
      filtered = filtered.filter((p) => p.isActive !== false);
    } else if (statusFilter === "Inactive") {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    // Filter by category
    if (categoryFilter !== "All") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, statusFilter, products]);

  const handleEditDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEditDragActive(true);
    } else if (e.type === "dragleave") {
      setEditDragActive(false);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const applyCrop = async () => {
    try {
      const croppedFile = await getCroppedImgFile(
        imageToCrop,
        croppedAreaPixels,
        currentFileToCrop.name
      );

      const preview = {
        url: URL.createObjectURL(croppedFile),
        type: "image",
        file: croppedFile,
      };

      setEditForm((f) => ({
        ...f,
        newMediaFiles: [...(f.newMediaFiles || []), preview],
      }));

      setCropModalOpen(false);
      setImageToCrop(null);
      setCurrentFileToCrop(null);
      setMessage("Image cropped successfully");
    } catch (e) {
      console.error(e);
      setMessage("Error cropping image");
    }
  };

  const handleEditDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (mediaFiles.length === 0) {
      setMessage("Please upload image or video files");
      return;
    }

    if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
      setImageToCrop(URL.createObjectURL(mediaFiles[0]));
      setCurrentFileToCrop(mediaFiles[0]);
      setCropModalOpen(true);
    } else {
      const previews = mediaFiles.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file,
      }));
      setEditForm((f) => ({
        ...f,
        newMediaFiles: [...(f.newMediaFiles || []), ...previews],
      }));
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const mediaFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/")
      );

      if (mediaFiles.length === 0) {
        setMessage("Please upload image or video files");
        return;
      }

      if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
        setImageToCrop(URL.createObjectURL(mediaFiles[0]));
        setCurrentFileToCrop(mediaFiles[0]);
        setCropModalOpen(true);
      } else {
        const previews = mediaFiles.map((file) => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith("video/") ? "video" : "image",
          file,
        }));
        setEditForm((f) => ({
          ...f,
          newMediaFiles: [...(f.newMediaFiles || []), ...previews],
        }));
      }
    }
  };

  // Handle edit product
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMessage("");

    try {
      if (!editForm.name) throw new Error("Name is required");
      if (!editForm.originalPrice)
        throw new Error("Original price is required");
      if (!editForm.category) throw new Error("Category is required");

      const originalPrice = parseFloat(editForm.originalPrice);
      const discountedPrice = editForm.discountedPrice
        ? parseFloat(editForm.discountedPrice)
        : originalPrice;

      if (isNaN(originalPrice))
        throw new Error("Original price must be a valid number");
      if (editForm.discountedPrice && isNaN(discountedPrice))
        throw new Error("Discounted price must be a valid number");

      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("originalPrice", originalPrice);
      formData.append("discountedPrice", discountedPrice);
      formData.append(
        "description",
        editForm.description
          ? editForm.description.trim()
          : `${editForm.name.trim()} - A beautiful piece from our collection`
      );
      formData.append("category", editForm.category.trim());
      formData.append("rating", Number(editForm.rating) || 4.5);
      formData.append("quantity", parseInt(editForm.quantity) || 0);

      const existingMedia = editForm.media || [];
      formData.append("media", JSON.stringify(existingMedia));

      if (editForm.newMediaFiles) {
        editForm.newMediaFiles.forEach((m) => {
          formData.append("media", m.file);
        });
      }

      const adminToken = localStorage.getItem("adminToken");

      await fetchApi(`/api/products/${editing}`, {
        method: "PUT",
        headers: {
          "x-admin-token": adminToken,
        },
        body: formData,
      });

      if (editForm.newMediaFiles) {
        editForm.newMediaFiles.forEach((m) => {
          if (m.url) URL.revokeObjectURL(m.url);
        });
      }

      setEditing(null);
      setEditForm({});
      setMessage("Product updated successfully!");
      fetchProducts();
    } catch (err) {
      console.error("Edit product error:", err);
      let errorMessage = "Failed to update product";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMessage = JSON.stringify(err);
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setMessage("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ──────── Soft Delete (Toggle Active) ────────
  const handleToggleActive = async (product) => {
    setLoading(true);
    setMessage("");
    try {
      const adminToken = localStorage.getItem("adminToken");
      const response = await fetchApi(
        `/api/products/${product.id || product._id}/toggle-active`,
        {
          method: "PATCH",
          headers: {
            "x-admin-token": adminToken,
            "Content-Type": "application/json",
          },
        }
      );
      setMessage(response.message || "Product status toggled!");
      fetchProducts();
    } catch (err) {
      console.error("Toggle active error:", err);
      setMessage("Error: " + (err.message || "Failed to toggle product status"));
    } finally {
      setLoading(false);
    }
  };

  // ──────── Hard Delete (Permanent) ────────
  const handleHardDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    setMessage("");

    try {
      const adminToken = localStorage.getItem("adminToken");

      await fetchApi(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken,
        },
      });

      setDeleteId(null);
      setDeleteType("soft");
      setMessage("Product permanently deleted!");
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      let errorMessage = "Failed to delete product";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMessage = JSON.stringify(err);
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setMessage("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ──────── Per-Image: Add media to product ────────
  const handleAddMediaToProduct = async (productId, files) => {
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    setMessage("");

    try {
      const adminToken = localStorage.getItem("adminToken");
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("media", f));

      const updatedProduct = await fetchApi(
        `/api/products/${productId}/media`,
        {
          method: "POST",
          headers: { "x-admin-token": adminToken },
          body: formData,
        }
      );

      setMessage("Media added successfully!");
      setMediaManageProduct(updatedProduct);
      fetchProducts();
    } catch (err) {
      console.error("Add media error:", err);
      setMessage("Error: " + (err.message || "Failed to add media"));
    } finally {
      setUploadingMedia(false);
    }
  };

  // ──────── Per-Image: Remove specific media from product ────────
  const handleRemoveMediaFromProduct = async (productId, mediaIndex) => {
    setRemovingMediaIndex(mediaIndex);
    setMessage("");

    try {
      const adminToken = localStorage.getItem("adminToken");

      const updatedProduct = await fetchApi(
        `/api/products/${productId}/media/${mediaIndex}`,
        {
          method: "DELETE",
          headers: { "x-admin-token": adminToken },
        }
      );

      setMessage("Media removed successfully!");
      setMediaManageProduct(updatedProduct);
      fetchProducts();
    } catch (err) {
      console.error("Remove media error:", err);
      setMessage("Error: " + (err.message || "Failed to remove media"));
    } finally {
      setRemovingMediaIndex(null);
    }
  };

  // Get product image for display
  const getProductImage = (product) => {
    if (Array.isArray(product.media) && product.media.length > 0) {
      const firstM = product.media[0];
      return typeof firstM === "string" ? firstM : firstM.url;
    }
    return (
      product.image ||
      product.imageUrl ||
      product.img ||
      "/images/placeholder.svg"
    );
  };

  // Count active / inactive
  const activeCount = products.filter((p) => p.isActive !== false).length;
  const inactiveCount = products.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-lg">
              All Products ({filteredProducts.length})
            </h3>
            <div className="flex gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-green-600" /> {activeCount}{" "}
                Active
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-red-500" /> {inactiveCount}{" "}
                Hidden
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={fetchProducts} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active (Visible)</SelectItem>
              <SelectItem value="Inactive">Hidden (Soft Deleted)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {message && (
          <div
            className={`mb-4 p-2 rounded text-sm ${
              message.includes("successfully") || message.includes("success")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found</p>
            {(searchQuery ||
              categoryFilter !== "All" ||
              statusFilter !== "All") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isInactive = product.isActive === false;
                  return (
                    <tr
                      key={product.id || product._id}
                      className={`border-b hover:bg-gray-50 ${
                        isInactive ? "opacity-50 bg-gray-50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                            {product.media && product.media.length > 1 && (
                              <Badge
                                className="absolute -top-2 -right-1 text-[10px] px-1 h-4 min-w-4 justify-center"
                                variant="secondary"
                              >
                                +{product.media.length - 1}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          ₹
                          {(Number(product.discountedPrice) || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          ₹{(Number(product.originalPrice) || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-4">
                        {Number(product.quantity) <= 0 && (
                          <Badge variant="destructive">Sold Out</Badge>
                        )}
                        {Number(product.quantity) > 0 &&
                          Number(product.quantity) <= 5 && (
                            <Badge variant="warning">
                              Low ({product.quantity})
                            </Badge>
                          )}
                        {Number(product.quantity) > 5 && (
                          <span className="text-sm">
                            {product.quantity} in stock
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isInactive ? (
                          <Badge
                            variant="destructive"
                            className="bg-red-100 text-red-700 border-red-200"
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {/* Edit */}
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit product"
                            onClick={() => {
                              setEditing(product.id || product._id);
                              setEditForm({
                                name: product.name,
                                originalPrice: product.originalPrice,
                                discountedPrice: product.discountedPrice,
                                media: product.media,
                                image: product.image,
                                description: product.description,
                                category: product.category,
                                quantity: product.quantity,
                                rating: product.rating || 4.5,
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Manage Media */}
                          <Button
                            variant="outline"
                            size="sm"
                            title="Manage images"
                            onClick={() => {
                              setMediaManageProductId(
                                product.id || product._id
                              );
                              setMediaManageProduct(product);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>

                          {/* Soft Delete / Restore Toggle */}
                          <Button
                            variant={isInactive ? "default" : "outline"}
                            size="sm"
                            title={
                              isInactive
                                ? "Restore (make visible)"
                                : "Hide from website"
                            }
                            className={
                              isInactive
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : ""
                            }
                            onClick={() => handleToggleActive(product)}
                          >
                            {isInactive ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Hard Delete */}
                          <Button
                            variant="destructive"
                            size="sm"
                            title="Permanently delete"
                            onClick={() => {
                              setDeleteId(product.id || product._id);
                              setDeleteType("hard");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Product Dialog */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Original Price (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.originalPrice}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        originalPrice: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discounted Price (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.discountedPrice}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        discountedPrice: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm({ ...editForm, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c !== "All")
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Existing Media */}
              {editForm.media && editForm.media.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Media
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {editForm.media.map((m, i) => (
                      <div key={i} className="relative w-20 h-20">
                        {typeof m === "object" && m.type === "video" ? (
                          <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[8px]">
                            VIDEO
                          </div>
                        ) : (
                          <img
                            src={typeof m === "string" ? m : m.url}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/80x80?text=Error";
                            }}
                          />
                        )}
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={() => {
                            const updated = [...editForm.media];
                            updated.splice(i, 1);
                            setEditForm({ ...editForm, media: updated });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Media Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  editDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-500"
                }`}
                onDragEnter={handleEditDrag}
                onDragLeave={handleEditDrag}
                onDragOver={handleEditDrag}
                onDrop={handleEditDrop}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEditFileChange}
                  className="hidden"
                  id="edit-image-upload"
                />
                <label htmlFor="edit-image-upload" className="cursor-pointer">
                  {editForm.newMediaFiles &&
                  editForm.newMediaFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {editForm.newMediaFiles.map((m, i) => (
                        <div key={i} className="relative w-20 h-20">
                          {m.type === "video" ? (
                            <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[8px]">
                              VIDEO
                            </div>
                          ) : (
                            <img
                              src={m.url}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                            onClick={() => {
                              const updated = [...editForm.newMediaFiles];
                              updated.splice(i, 1);
                              setEditForm({
                                ...editForm,
                                newMediaFiles: updated,
                              });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Click or drag to add new media
                    </p>
                  )}
                </label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Update Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Media Management Dialog */}
      {mediaManageProductId && mediaManageProduct && (
        <Dialog
          open={!!mediaManageProductId}
          onOpenChange={() => {
            setMediaManageProductId(null);
            setMediaManageProduct(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage Images — {mediaManageProduct.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current images */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Images ({mediaManageProduct.media?.length || 0})
                </label>
                {mediaManageProduct.media &&
                mediaManageProduct.media.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {mediaManageProduct.media.map((m, i) => (
                      <div
                        key={i}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                      >
                        {typeof m === "object" && m.type === "video" ? (
                          <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
                            VIDEO
                          </div>
                        ) : (
                          <img
                            src={typeof m === "string" ? m : m.url}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/200x200?text=Error";
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={removingMediaIndex === i}
                            onClick={() =>
                              handleRemoveMediaFromProduct(
                                mediaManageProductId,
                                i
                              )
                            }
                          >
                            {removingMediaIndex === i ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 text-[10px]"
                        >
                          {i + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No images for this product.
                  </p>
                )}
              </div>

              {/* Add new images */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add New Images
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    id="media-manage-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAddMediaToProduct(
                          mediaManageProductId,
                          e.target.files
                        );
                        e.target.value = ""; // reset
                      }
                    }}
                  />
                  <label
                    htmlFor="media-manage-upload"
                    className="cursor-pointer"
                  >
                    {uploadingMedia ? (
                      <div className="flex flex-col items-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to select images/videos to add
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Supports JPG, PNG, GIF, MP4
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setMediaManageProductId(null);
                  setMediaManageProduct(null);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Hard Delete Confirmation Dialog */}
      {deleteId && deleteType === "hard" && (
        <Dialog
          open={!!deleteId}
          onOpenChange={() => {
            setDeleteId(null);
            setDeleteType("soft");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Permanently Delete Product
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to <strong>permanently delete</strong>{" "}
                this product? This will:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Remove the product from the database</li>
                <li>Delete all associated images from S3 storage</li>
                <li>
                  This action <strong>cannot be undone</strong>
                </li>
              </ul>
              <p className="text-sm text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                💡 <strong>Tip:</strong> Use the{" "}
                <EyeOff className="inline h-3.5 w-3.5" /> Hide button instead
                to soft-delete — you can restore it later.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteType("soft");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleHardDelete(deleteId)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-96 bg-gray-100">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyCrop}>Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllProductsList;
