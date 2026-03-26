import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Edit, Trash2, Plus, Eye, EyeOff, RefreshCw, Scissors } from "lucide-react";
import { fetchApi } from "../../lib/api";
import Cropper from "react-easy-crop";
import { getCroppedImgFile } from "../../utils/cropImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    originalPrice: "",
    discountedPrice: "",
    mediaFiles: [],
    quantity: 1,
    description: "",
    category: "",
    rating: 4.5,
  });

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editDragActive, setEditDragActive] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isEditCrop, setIsEditCrop] = useState(false);
  const [currentFileToCrop, setCurrentFileToCrop] = useState(null);

  // Predefined categories from CategoriesSection
  const categories = [
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

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/products");
      setProducts(Array.isArray(data) ? data : []);
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

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

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
        file: croppedFile
      };

      if (isEditCrop) {
        setEditForm((f) => ({ ...f, newMediaFiles: [...(f.newMediaFiles || []), preview] }));
      } else {
        setAddForm((f) => ({ ...f, mediaFiles: [...(f.mediaFiles || []), preview] }));
      }
      
      setCropModalOpen(false);
      setImageToCrop(null);
      setCurrentFileToCrop(null);
      setMessage("Image cropped successfully");
    } catch (e) {
      console.error(e);
      setMessage("Error cropping image");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
    
    if (mediaFiles.length === 0) {
      setMessage("Please upload image or video files");
      return;
    }

    if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
      setIsEditCrop(false);
      setImageToCrop(URL.createObjectURL(mediaFiles[0]));
      setCurrentFileToCrop(mediaFiles[0]);
      setCropModalOpen(true);
    } else {
      const previews = mediaFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file
      }));
      setAddForm((f) => ({ ...f, mediaFiles: [...(f.mediaFiles || []), ...previews] }));
    }
    setMessage(`${mediaFiles.length} files processed`);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const mediaFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
      
      if (mediaFiles.length === 0) {
        setMessage("Please upload image or video files");
        return;
      }

      if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
        setIsEditCrop(false);
        setImageToCrop(URL.createObjectURL(mediaFiles[0]));
        setCurrentFileToCrop(mediaFiles[0]);
        setCropModalOpen(true);
      } else {
        const previews = mediaFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith("video/") ? "video" : "image",
          file
        }));
        setAddForm((f) => ({ ...f, mediaFiles: [...(f.mediaFiles || []), ...previews] }));
      }
    }
  };

  const handleEditDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
    
    if (mediaFiles.length === 0) {
      setMessage("Please upload image or video files");
      return;
    }

    if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
      setIsEditCrop(true);
      setImageToCrop(URL.createObjectURL(mediaFiles[0]));
      setCurrentFileToCrop(mediaFiles[0]);
      setCropModalOpen(true);
    } else {
      const previews = mediaFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file
      }));
      setEditForm((f) => ({ ...f, newMediaFiles: [...(f.newMediaFiles || []), ...previews] }));
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const mediaFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
      
      if (mediaFiles.length === 0) {
        setMessage("Please upload image or video files");
        return;
      }

      if (mediaFiles.length === 1 && mediaFiles[0].type.startsWith("image/")) {
        setIsEditCrop(true);
        setImageToCrop(URL.createObjectURL(mediaFiles[0]));
        setCurrentFileToCrop(mediaFiles[0]);
        setCropModalOpen(true);
      } else {
        const previews = mediaFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith("video/") ? "video" : "image",
          file
        }));
        setEditForm((f) => ({ ...f, newMediaFiles: [...(f.newMediaFiles || []), ...previews] }));
      }
    }
  };

  // Handle add product
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Validate required fields
      if (!addForm.name) throw new Error("Name is required");
      if (!addForm.originalPrice) throw new Error("Original price is required");
      if (!addForm.category) throw new Error("Category is required");
      if (!addForm.mediaFiles || addForm.mediaFiles.length === 0) throw new Error("At least one image or video is required");

      // Validate numeric fields
      const originalPrice = parseFloat(addForm.originalPrice);
      const discountedPrice = addForm.discountedPrice
        ? parseFloat(addForm.discountedPrice)
        : originalPrice;
      const quantity = parseInt(addForm.quantity) || 0;

      if (isNaN(originalPrice))
        throw new Error("Original price must be a valid number");
      if (addForm.discountedPrice && isNaN(discountedPrice))
        throw new Error("Discounted price must be a valid number");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", addForm.name.trim());
      formData.append("originalPrice", originalPrice);
      formData.append("discountedPrice", discountedPrice);
      formData.append(
        "description",
        addForm.description
          ? addForm.description.trim()
          : `${addForm.name.trim()} - A beautiful piece from our collection`
      );
      formData.append("category", addForm.category.trim());
      formData.append("rating", Number(addForm.rating) || 4.5);
      formData.append("quantity", quantity);
      

      // Append all media files
      addForm.mediaFiles.forEach(m => {
        formData.append("media", m.file);
      });

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");

      const response = await fetchApi("/api/products", {
        method: "POST",
        headers: {
          "x-admin-token": adminToken,
        },
        body: formData, // Use FormData instead of JSON
      });

      // Revoke the blob URL to free memory
      if (addForm.imagePreview) {
        URL.revokeObjectURL(addForm.imagePreview);
      }

      setAddForm({
        name: "",
        originalPrice: "",
        discountedPrice: "",
        mediaFiles: [],
        description: "",
        category: "",
        quantity: 1,
        rating: 4.5,
      });
      setImagePreview("");
      setMessage("Product added successfully!");
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Add product error:", err);
      // Better error handling to avoid [object Object] error
      let errorMessage = "Failed to add product";
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

  // Handle edit product
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMessage("");

    try {
      // Validate required fields
      if (!editForm.name) throw new Error("Name is required");
      if (!editForm.originalPrice)
        throw new Error("Original price is required");
      if (!editForm.category) throw new Error("Category is required");

      // Validate numeric fields
      const originalPrice = parseFloat(editForm.originalPrice);
      const discountedPrice = editForm.discountedPrice
        ? parseFloat(editForm.discountedPrice)
        : originalPrice;

      if (isNaN(originalPrice))
        throw new Error("Original price must be a valid number");
      if (editForm.discountedPrice && isNaN(discountedPrice))
        throw new Error("Discounted price must be a valid number");

      // Create FormData for file upload
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


      // Append existing media if not deleted
      const existingMedia = editForm.media || [];
      formData.append("media", JSON.stringify(existingMedia));

      // If a new media files were uploaded, append them
      if (editForm.newMediaFiles) {
        editForm.newMediaFiles.forEach(m => {
          formData.append("media", m.file);
        });
      }

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");

      const response = await fetchApi(`/api/products/${editing}`, {
        method: "PUT",
        headers: {
          "x-admin-token": adminToken,
        },
        body: formData, // Use FormData instead of JSON
      });

      // Revoke the blob URL if it exists to free memory
      if (editForm.imagePreview) {
        URL.revokeObjectURL(editForm.imagePreview);
      }

      setEditing(null);
      setEditForm({});
      setEditImagePreview("");
      setMessage("Product updated successfully!");
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Edit product error:", err);
      // Better error handling to avoid [object Object] error
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

  // Handle delete product
  const handleDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    setMessage("");

    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");

      const response = await fetchApi(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken,
        },
      });

      setDeleteId(null);
      setMessage("Product deleted successfully!");
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Delete product error:", err);
      // Better error handling to avoid [object Object] error
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

  return (
    <div className="space-y-6">
      {/* Add Product Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg">Add New Product</h3>
        {message && (
          <div
            className={`mb-4 p-2 rounded text-sm ${
              message.includes("successfully")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <Input
              placeholder="Enter product name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Original Price (₹)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter original price"
              value={addForm.originalPrice}
              onChange={(e) =>
                setAddForm({ ...addForm, originalPrice: e.target.value })
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
              placeholder="Enter discounted price"
              value={addForm.discountedPrice}
              onChange={(e) =>
                setAddForm({ ...addForm, discountedPrice: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Quantity / Stock
            </label>
            <Input
              type="number"
              placeholder="Enter available quantity"
              value={addForm.quantity}
              onChange={(e) =>
                setAddForm({ ...addForm, quantity: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={addForm.category}
              onValueChange={(value) =>
                setAddForm({ ...addForm, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              placeholder="Enter product description"
              value={addForm.description}
              onChange={(e) =>
                setAddForm({ ...addForm, description: e.target.value })
              }
              rows={3}
            />
          </div>


          <div
            className={`md:col-span-3 border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {addForm.mediaFiles && addForm.mediaFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {addForm.mediaFiles.map((m, i) => (
                    <div key={i} className="relative w-24 h-24">
                      {m.type === "video" ? (
                        <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[10px]">VIDEO</div>
                      ) : (
                        <img
                          src={m.url}
                          alt="Preview"
                          className="w-full h-full object-cover rounded shadow"
                        />
                      )}
                      <div className="absolute top-1 right-1 flex gap-1">
                        {m.type === "image" && (
                          <button
                            className="bg-blue-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              setImageToCrop(m.url);
                              setCurrentFileToCrop(m.file);
                              setIsEditCrop(false);
                              // We need to remove the image first then add the cropped one
                              const updated = [...addForm.mediaFiles];
                              updated.splice(i, 1);
                              setAddForm({...addForm, mediaFiles: updated});
                              setCropModalOpen(true);
                            }}
                          >
                            <Scissors className="w-3 h-3" />
                          </button>
                        )}
                        <button 
                          className="bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            const updated = [...addForm.mediaFiles];
                            updated.splice(i, 1);
                            setAddForm({...addForm, mediaFiles: updated});
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                    <Plus className="w-6 h-6" />
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    Drag & drop photos/videos here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG, GIF, MP4
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="md:col-span-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding Product...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Products List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Product List</h3>
          <Button variant="outline" onClick={fetchProducts} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id || product._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="relative">
                        <img
                          src={(() => {
                            if (Array.isArray(product.media) && product.media.length > 0) {
                              const firstM = product.media[0];
                              return typeof firstM === 'string' ? firstM : firstM.url;
                            }
                            return product.image || product.imageUrl || product.img || "/images/placeholder.svg";
                          })()}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                        {product.media && product.media.length > 1 && (
                          <Badge className="absolute -top-2 -right-1 text-[10px] px-1 h-4 min-w-4 justify-center" variant="secondary">
                            +{product.media.length - 1}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {product.name}
                          {Number(product.quantity) <= 0 && <Badge variant="destructive">Sold Out</Badge>}
                          {Number(product.quantity) > 0 && Number(product.quantity) <= 5 && <Badge variant="warning">Low Stock ({product.quantity})</Badge>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        ₹{(Number(product.discountedPrice) || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        ₹{(Number(product.originalPrice) || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                           onClick={() => {
                             setEditing(product.id || product._id);
                             setEditForm({
                               name: product.name,
                               originalPrice: product.originalPrice,
                               discountedPrice: product.discountedPrice,
                               media: product.media,
                               image: product.image, // Include legacy image
                               description: product.description,
                               category: product.category,
                               quantity: product.quantity,
                               rating: product.rating || 4.5,
                             });
                             
                             let preview = "";
                             if (Array.isArray(product.media) && product.media.length > 0) {
                               const firstM = product.media[0];
                               preview = typeof firstM === 'string' ? firstM : firstM.url;
                             } else {
                               preview = product.image || product.imageUrl || product.img || "";
                             }
                             setEditImagePreview(preview);
                           }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(product.id || product._id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit Product Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-semibold mb-4 text-lg">Edit Product</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name
                  </label>
                  <Input
                    placeholder="Enter product name"
                    value={editForm.name || ""}
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
                      placeholder="Enter original price"
                      value={editForm.originalPrice || ""}
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
                      placeholder="Enter discounted price"
                      value={editForm.discountedPrice || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          discountedPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                 <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Select
                    value={editForm.category || ""}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                 <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={editForm.quantity || 0}
                      onChange={(e) =>
                        setEditForm({ ...editForm, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Enter product description"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

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
                    {(editForm.media?.length > 0 || editForm.newMediaFiles?.length > 0 || editForm.image) ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {/* Legacy Image Fallback */}
                        {(!editForm.media || editForm.media.length === 0) && (editForm.image || editForm.imageUrl || editForm.img) && (
                          <div className="relative w-24 h-24">
                            <img src={editForm.image || editForm.imageUrl || editForm.img} className="w-full h-full object-cover rounded shadow border-2 border-amber-200" />
                            <div className="absolute -top-2 -left-2 bg-amber-500 text-[8px] text-white px-1 rounded uppercase font-bold">Legacy</div>
                          </div>
                        )}
                        {/* Existing Media */}
                        {editForm.media && editForm.media.map((m, i) => (
                          <div key={`old-${i}`} className="relative w-24 h-24">
                            {m.type === "video" ? (
                              <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[10px]">VIDEO</div>
                            ) : (
                              <img src={typeof m === 'string' ? m : m.url} className="w-full h-full object-cover rounded shadow" />
                            )}
                            <button 
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                              onClick={(e) => {
                                e.preventDefault();
                                const updated = [...editForm.media];
                                updated.splice(i, 1);
                                setEditForm({...editForm, media: updated});
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {/* New Media Previews */}
                        {editForm.newMediaFiles && editForm.newMediaFiles.map((m, i) => (
                          <div key={`new-${i}`} className="relative w-24 h-24 border-2 border-blue-400 rounded">
                            {m.type === "video" ? (
                              <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[10px]">NEW VIDEO</div>
                            ) : (
                              <img src={m.url} className="w-full h-full object-cover rounded" />
                            )}
                             <div className="absolute top-1 right-1 flex gap-1">
                               {m.type === "image" && (
                                <button
                                  className="bg-blue-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setImageToCrop(m.url);
                                    setCurrentFileToCrop(m.file);
                                    setIsEditCrop(true);
                                    const updated = [...editForm.newMediaFiles];
                                    updated.splice(i, 1);
                                    setEditForm({...editForm, newMediaFiles: updated});
                                    setCropModalOpen(true);
                                  }}
                                >
                                  <Scissors className="w-3 h-3" />
                                </button>
                               )}
                               <button
                                 className="bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   const updated = [...editForm.newMediaFiles];
                                   updated.splice(i, 1);
                                   setEditForm({...editForm, newMediaFiles: updated});
                                 }}
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                          </div>
                        ))}
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                          <Plus className="w-6 h-6" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center">
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">
                          Drag & drop photos/videos here, or click to select
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Supports JPG, PNG, GIF, MP4
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setEditForm({});
                      setEditImagePreview("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Product"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
      {/* Cropper Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-80 w-full bg-black rounded-lg overflow-hidden">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1} // You can change this or make it dynamic
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="flex-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCropModalOpen(false);
              setImageToCrop(null);
            }}>
              Cancel
            </Button>
            <Button onClick={applyCrop}>
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
