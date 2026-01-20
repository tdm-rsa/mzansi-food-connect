import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./MenuManagement.css";
import { getMaxProducts } from "../utils/planFeatures";

// Upload image helper
async function uploadProductImage(file, storeId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });
      
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("store-assets")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    
    throw err;
  }
}

export default function MenuManagement({ storeInfo, menuItems, onBack, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [customPreference, setCustomPreference] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image_url: "",
    preferences: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [commonPreferences, setCommonPreferences] = useState([
    "Chilli",
    "Tomato",
    "Salt",
    "No Salt",
    "Extra Sauce",
    "Onion",
    "No Onion",
    "Cheese",
  ]);

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "", description: "", image_url: "", preferences: "" });
    setImageFile(null);
    setImagePreview(null);
    setEditingItem(null);
    setCustomPreference("");
  };

  const parsePreferences = (raw) =>
    raw
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

  const updatePreferences = (updater) => {
    setFormData((prev) => {
      const current = parsePreferences(prev.preferences);
      const next = updater(current);
      return { ...prev, preferences: next.join(", ") };
    });
  };

  const handleTogglePreference = (pref) => {
    updatePreferences((current) =>
      current.includes(pref) ? current.filter((p) => p !== pref) : [...current, pref]
    );
  };

  const handleAddCustomPreference = () => {
    const next = customPreference.trim();
    if (!next) return;
    setCommonPreferences((current) => (current.includes(next) ? current : [...current, next]));
    updatePreferences((current) => (current.includes(next) ? current : [...current, next]));
    setCustomPreference("");
  };

  const handleRemoveCommonPreference = (pref) => {
    setCommonPreferences((current) => current.filter((item) => item !== pref));
    updatePreferences((current) => current.filter((item) => item !== pref));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Name and price are required");
      return;
    }

    // Check product limit for Free Trial
    const maxProducts = getMaxProducts(storeInfo.plan);
    if (!editingItem && menuItems.length >= maxProducts) {
      alert(`❌ Product Limit Reached\n\nYou've reached the maximum of ${maxProducts} products on the Free Trial plan.\n\nUpgrade to Pro for unlimited products!`);
      return;
    }

    try {
      setSaving(true);
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, storeInfo.id);
      }

      const itemData = {
        store_id: storeInfo.id,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim() || "General",
        description: formData.description.trim(),
        image_url: imageUrl,
        preferences: parsePreferences(formData.preferences),
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);
        if (error) throw error;
        alert("✅ Item updated successfully!");
      } else {
        // Create new item
        const { error } = await supabase
          .from("menu_items")
          .insert([itemData]);
        if (error) throw error;
        alert("✅ Item added successfully!");
      }

      resetForm();
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      
      alert(`❌ Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category || "",
      description: item.description || "",
      image_url: item.image_url || "",
      preferences: Array.isArray(item.preferences) ? item.preferences.join(", ") : "",
    });
    setImagePreview(item.image_url || null);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      alert("✅ Item deleted");
      onRefresh();
    } catch (err) {
      
      alert(`❌ Delete failed: ${err.message}`);
    }
  };

  const selectedPreferences = parsePreferences(formData.preferences);

  return (
    <div className="menu-management">
      <div className="view-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div>
          <h2>📋 Menu Management</h2>
          <p>Add, edit, and manage your menu items</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          ➕ Add Item
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="menu-items-grid">
        {menuItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>No menu items yet</h3>
            <p>Click "Add Item" to create your first dish</p>
          </div>
        ) : (
          menuItems.map((item) => (
            <div key={item.id} className="menu-item-card">
              {item.image_url && (
                <div className="item-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
              )}
              <div className="item-content">
                <h3>{item.name}</h3>
                {item.description && <p className="item-description">{item.description}</p>}
                <div className="item-meta">
                  <span className="item-category">{item.category || "General"}</span>
                  <span className="item-price">R{item.price}</span>
                </div>
                {Array.isArray(item.preferences) && item.preferences.length > 0 && (
                  <div className="item-preferences">
                    {item.preferences.map((p, idx) => (
                      <span key={idx} className="preference-pill">{p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button className="btn-edit" onClick={() => handleEdit(item)}>
                  ✏️ Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="menu-form">
              {/* Image Upload */}
              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-area">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setFormData({ ...formData, image_url: "" });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="image-upload" className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span>Click to upload image</span>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beef Burger"
                  required
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label>Price (R) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Burgers, Drinks, Sides"
                />
              </div>

              {/* Preferences */}
              <div className="form-group">
                <label>Preferences</label>
                <div className="preference-selector">
                  <div className="preference-options">
                    {commonPreferences.map((pref) => (
                      <div key={pref} className="preference-chip-group">
                        <button
                          type="button"
                          className={`preference-chip ${selectedPreferences.includes(pref) ? "active" : ""}`}
                          onClick={() => handleTogglePreference(pref)}
                        >
                          {pref}
                        </button>
                        <button
                          type="button"
                          className="preference-chip-remove"
                          aria-label={`Remove ${pref}`}
                          onClick={() => handleRemoveCommonPreference(pref)}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="preference-custom">
                    <input
                      type="text"
                      value={customPreference}
                      onChange={(e) => setCustomPreference(e.target.value)}
                      placeholder="Add custom preference"
                    />
                    <button
                      type="button"
                      className="btn-add-pref"
                      onClick={handleAddCustomPreference}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <small style={{ opacity: 0.75 }}>
                  These show as checkboxes in the cart. Leave blank if the item has no preferences.
                </small>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your dish..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
