import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, RefreshCw, Trash2, X } from "lucide-react";
import { fetchApi } from "../../lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const AddProductForm = ({ onProductAdded }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

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

  // Full image preview state
  const [previewImage, setPreviewImage] = useState(null);

  // Predefined categories
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

    const previews = mediaFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      file
    }));
    setAddForm((f) => ({ ...f, mediaFiles: [...(f.mediaFiles || []), ...previews] }));
    setMessage(`${mediaFiles.length} file(s) added`);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const mediaFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
      
      if (mediaFiles.length === 0) {
        setMessage("Please upload image or video files");
        return;
      }

      const previews = mediaFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file
      }));
      setAddForm((f) => ({ ...f, mediaFiles: [...(f.mediaFiles || []), ...previews] }));
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
        body: formData,
      });

      // Revoke the blob URL to free memory
      addForm.mediaFiles.forEach(m => {
        if (m.url) URL.revokeObjectURL(m.url);
      });

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
      setMessage("Product added successfully!");
      
      // Notify parent component
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error("Add product error:", err);
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

  return (
    <>
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
                    <div key={i} className="relative w-24 h-24 group">
                      {m.type === "video" ? (
                        <div className="w-full h-full bg-black rounded flex items-center justify-center text-white text-[10px]">VIDEO</div>
                      ) : (
                        <img
                          src={m.url}
                          alt="Preview"
                          className="w-full h-full object-cover rounded shadow cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage(m.url);
                          }}
                        />
                      )}
                      <button 
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const updated = [...addForm.mediaFiles];
                          updated.splice(i, 1);
                          setAddForm({...addForm, mediaFiles: updated});
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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

      {/* Full Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2">
              <img
                src={previewImage}
                alt="Full preview"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          )}
          <button
            className="absolute top-3 right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddProductForm;
