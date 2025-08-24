import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast, Toaster } from "react-hot-toast";
import "../../styles/Admin.css"; 
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    trimester:"",
    featured: false,
    imageFile: null,
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const fetchedProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(fetchedProducts);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `product_images/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleAddOrUpdate = async () => {
    setLoading(true);
    try {
      let imageUrl = newProduct.imageUrl;

      if (newProduct.imageFile) {
        const uploadedUrl = await uploadImage(newProduct.imageFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        trimester: newProduct.trimester,
        featured: newProduct.featured,
        image: imageUrl,
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        toast.success("Product updated successfully");
      } else {
        await addDoc(collection(db, "products"), productData);
        toast.success("Product added successfully");
      }

      setNewProduct({
        name: "",
        price: "",
        category: "",
        description: "",
        trimester: "",
        featured: false,
        imageFile: null,
        imageUrl: "",
      });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      toast.error("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      trimester: product.trimester,
      featured: product.featured,
      imageFile: null,
      imageUrl: product.image || "",
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

const exportToExcel = () => {
  const exportData = products.map((prod) => ({
    Name: prod.name,
    Price: prod.price,
    Category: prod.category,
    Trimester: prod.trimester,
    Description: prod.description,
    Featured: prod.featured ? "Yes" : "No",
    ImageURL: prod.image,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, "products_export.xlsx");
};


  return (
    <div className="products-admin">
      <h2>{editingId ? "Edit Product" : "Add Product"}</h2>
      <div className="form">
        <input
          type="text"
          placeholder="Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, price: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Category"
          value={newProduct.category}
          onChange={(e) =>
            setNewProduct({ ...newProduct, category: e.target.value })
          }
        />
          <input
          type="text"
          placeholder="Trimester"
          value={newProduct.trimester}
          onChange={(e) =>
            setNewProduct({ ...newProduct, trimester: e.target.value })
          }
        />
        <textarea
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
        />
        <label>
          Featured:{" "}
          <input
            type="checkbox"
            checked={newProduct.featured}
            onChange={(e) =>
              setNewProduct({ ...newProduct, featured: e.target.checked })
            }
          />
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNewProduct({ ...newProduct, imageFile: e.target.files[0] })
          }
        />
        {newProduct.imageUrl && !newProduct.imageFile && (
          <img
            src={newProduct.imageUrl}
            alt="Preview"
            style={{ width: "100px", marginTop: "10px" }}
          />
        )}
        <button onClick={handleAddOrUpdate} disabled={loading}>
          {loading
            ? "Processing..."
            : editingId
            ? "Update Product"
            : "Add Product"}
        </button>
      </div>

      <h2>Product List</h2>
      <div className="admin-actions">
  <button onClick={exportToExcel}>Export to Excel</button>
  <button onClick={() => navigate("/admin")}>← Back to Dashboard</button>
</div>
      <div className="product-list">
        {products.map((prod) => (
          <div key={prod.id} className="product-card">
            <img src={prod.image} alt={prod.name} className="product-image" />
            <h4>{prod.name}</h4>
            <p>₹{prod.price}</p>
            <p>{prod.category}</p>
            <p>{prod.description}</p>
            <p>{prod.trimester}</p>
            <p>Featured: {prod.featured ? "Yes" : "No"}</p>
            <div className="buttons">
              <button onClick={() => handleEdit(prod)}>Edit</button>
              <button onClick={() => handleDelete(prod.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsAdmin;
