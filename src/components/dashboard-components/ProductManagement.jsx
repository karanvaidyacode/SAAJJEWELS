import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff,
  RefreshCw
} from "lucide-react";
import { fetchApi } from "../../lib/api";

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
    image: "",
    description: "",
    category: "",
    rating: 4.5,
  });

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editDragActive, setEditDragActive] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  
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
    "Bouquet"
  ];

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch products error", err);
      setMessage("Error fetching products: " + (err.message || "Unknown error"));
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        setMessage("Please upload an image file");
        return;
      }

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Store the file for upload - don't use the blob URL as the image path
      setAddForm((f) => ({ ...f, imageFile: file, imagePreview: previewUrl }));
      setMessage("Image selected successfully");
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setMessage("Please upload an image file");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Store the file for upload - don't use the blob URL as the image path
      setAddForm((f) => ({ ...f, imageFile: file, imagePreview: previewUrl }));
      setMessage("Image selected successfully");
    }
  };

  // Handle drag events for edit form
  const handleEditDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEditDragActive(true);
    } else if (e.type === "dragleave") {
      setEditDragActive(false);
    }
  };

  const handleEditDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(true);
  };

  const handleEditDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);
  };

  const handleEditDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        setMessage("Please upload an image file");
        return;
      }

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);

      // Store the file for upload - don't use the blob URL as the image path
      setEditForm((f) => ({ ...f, imageFile: file, imagePreview: previewUrl }));
      setMessage("Image selected successfully");
    }
  };

  // Handle file input change for edit form
  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setMessage("Please upload an image file");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
      
      // Store the file for upload - don't use the blob URL as the image path
      setEditForm((f) => ({ ...f, imageFile: file, imagePreview: previewUrl }));
      setMessage("Image selected successfully");
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
      if (!addForm.imageFile) throw new Error("Image is required");
      
      // Validate numeric fields
      const originalPrice = parseFloat(addForm.originalPrice);
      const discountedPrice = addForm.discountedPrice ? parseFloat(addForm.discountedPrice) : 0;
      
      if (isNaN(originalPrice)) throw new Error("Original price must be a valid number");
      if (addForm.discountedPrice && isNaN(discountedPrice)) throw new Error("Discounted price must be a valid number");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', addForm.name);
      formData.append('originalPrice', originalPrice);
      formData.append('discountedPrice', discountedPrice || originalPrice);
      formData.append('description', addForm.description || `${addForm.name} - A beautiful piece from our collection`);
      formData.append('category', addForm.category);
      formData.append('rating', Number(addForm.rating) || 4.5);
      formData.append('image', addForm.imageFile); // Append the image file

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      const response = await fetchApi("/api/products", {
        method: "POST",
        headers: {
          "x-admin-token": adminToken
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
        imageFile: null,
        imagePreview: "",
        description: "",
        category: "",
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
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else if (typeof err === 'string') {
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
      if (!editForm.originalPrice) throw new Error("Original price is required");
      if (!editForm.category) throw new Error("Category is required");
      
      // Validate numeric fields
      const originalPrice = parseFloat(editForm.originalPrice);
      const discountedPrice = editForm.discountedPrice ? parseFloat(editForm.discountedPrice) : 0;
      
      if (isNaN(originalPrice)) throw new Error("Original price must be a valid number");
      if (editForm.discountedPrice && isNaN(discountedPrice)) throw new Error("Discounted price must be a valid number");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('originalPrice', originalPrice);
      formData.append('discountedPrice', discountedPrice || originalPrice);
      formData.append('description', editForm.description || `${editForm.name} - A beautiful piece from our collection`);
      formData.append('category', editForm.category);
      formData.append('rating', Number(editForm.rating) || 4.5);
      
      // If a new image was uploaded, append it; otherwise use existing image URL
      if (editForm.imageFile) {
        formData.append('image', editForm.imageFile); // Append the new image file
      } else {
        formData.append('image', editForm.image || '/images/placeholder.jpg'); // Use existing image URL
      }

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      const response = await fetchApi(`/api/products/${editing}`, {
        method: "PUT",
        headers: {
          "x-admin-token": adminToken
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
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else if (typeof err === 'string') {
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
      
      console.log("Deleting product with ID:", id);
      console.log("Admin token:", adminToken);
      
      const response = await fetchApi(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken
        }
      });

      console.log("Delete response:", response);
      
      setDeleteId(null);
      setMessage("Product deleted successfully!");
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Delete product error:", err);
      // Better error handling to avoid [object Object] error
      let errorMessage = "Failed to delete product";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else if (typeof err === 'string') {
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
          <div className={`mb-4 p-2 rounded text-sm ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {message}
          </div>
        )}
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <Input
              placeholder="Enter product name"
              value={addForm.name}
              onChange={(e) => setAddForm({...addForm, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter original price"
              value={addForm.originalPrice}
              onChange={(e) => setAddForm({...addForm, originalPrice: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Discounted Price (₹)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter discounted price"
              value={addForm.discountedPrice}
              onChange={(e) => setAddForm({...addForm, discountedPrice: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select 
              value={addForm.category} 
              onValueChange={(value) => setAddForm({...addForm, category: value})}
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
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              placeholder="Enter product description"
              value={addForm.description}
              onChange={(e) => setAddForm({...addForm, description: e.target.value})}
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
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">Drag & drop an image here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF</p>
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
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                {products.map(product => (
                  <tr key={product.id || product._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-12 h-12 object-cover rounded mr-3"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">₹{(Number(product.discountedPrice) || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-500 line-through">₹{(Number(product.originalPrice) || 0).toFixed(2)}</div>
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
                              image: product.image,
                              description: product.description,
                              category: product.category,
                              rating: product.rating || 4.5
                            });
                            setEditImagePreview(product.image);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(product.id || product._id)}
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
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <Input
                    placeholder="Enter product name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter original price"
                      value={editForm.originalPrice || ""}
                      onChange={(e) => setEditForm({...editForm, originalPrice: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Discounted Price (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter discounted price"
                      value={editForm.discountedPrice || ""}
                      onChange={(e) => setEditForm({...editForm, discountedPrice: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select 
                    value={editForm.category || ""} 
                    onValueChange={(value) => setEditForm({...editForm, category: value})}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Enter product description"
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
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
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="cursor-pointer">
                    {editImagePreview || editForm.image ? (
                      <div>
                        <img
                          src={editImagePreview || editForm.image}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm text-gray-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center">
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">Drag & drop an image here, or click to select</p>
                        <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF</p>
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
    </div>
  );
};

export default ProductManagement;