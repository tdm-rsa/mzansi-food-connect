import { useState, useEffect } from "react";
import "./StoreDesigner.css";
import PreviewStore from "./PreviewStore.jsx";
import { useStoreData } from "../hooks/useStoreData";
import { useCart } from "../hooks/useCart";
import { supabase } from "../supabaseClient";

/* -----------------------------------------------
   Upload image to Supabase Storage
------------------------------------------------- */
async function uploadImage(file, folder, storeId) {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(uploadError.message || "Upload failed");
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("store-assets")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    alert(`Upload failed: ${err.message}\n\nPlease make sure the 'store-assets' bucket exists in Supabase Storage and has proper RLS policies.`);
    throw err;
  }
}

/* -----------------------------------------------
   🎨 Store Designer Component
------------------------------------------------- */
export default function StoreDesigner({ onBack, menuItems = [] }) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const { store, loading, error, updateStore } = useStoreData();
  const { cart, addItem, removeItem, clearCart, total } = useCart();

  // Auto-save debounce
  const [saveTimeout, setSaveTimeout] = useState(null);

  async function saveChanges(updates) {
    if (!store) return;
    
    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);
    
    // Debounce saves
    const timeout = setTimeout(async () => {
      try {
        setSaving(true);
        await updateStore(updates);
      } catch (err) {
        console.error("Save failed:", err.message);
      } finally {
        setSaving(false);
      }
    }, 500);
    
    setSaveTimeout(timeout);
  }

  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  if (loading) {
    return (
      <div className="designer-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="designer-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-secondary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="designer-container">
        <div className="error-message">
          <p>No store found. Please create a store first.</p>
          <button className="btn-secondary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  // Build live preview state
  const previewState = {
    header: {
      showLogo: store.show_logo !== false && !!store.logo_url,
      logoDataUrl: store.logo_url,
      storeName: store.name || "My Store",
      layout: store.header_layout || "center",
    },
    banner: {
      type: store.banner_type || "text-queue",
      animation: store.banner_animation || "fade",
      bannerText: store.banner_text || "Welcome to our store!",
      specialsText: store.specials_text || "",
      isOpen: store.is_open !== false,
      showQueue: store.show_queue !== false,
      bgDataUrl: store.banner_url,
      theme: store.banner_theme || "warm",
    },
    products: {
      layout: store.product_layout || "grid3",
      animation: store.product_animation || "fade",
    },
    about: {
      text: store.about_text || "Proudly serving authentic local food 🇿🇦",
      showImage: store.about_look === "with-image" && !!store.about_image_url,
      imageDataUrl: store.about_image_url,
      socials: store.socials || {},
      animation: store.about_animation || "fade",
      look: store.about_look || "with-image",
    },
    menuItems: menuItems || [],
    liveQueue: [],
    show_about: store.show_about !== false,
    cart,
    addItem,
    removeItem,
    clearCart,
    total,
  };

  // Banner type options
  const bannerTypes = [
    { id: "text-queue", label: "Text + Live Queue", icon: "📝" },
    { id: "text-specials", label: "Text + Specials", icon: "🔥" },
    { id: "image-queue", label: "Image + Queue", icon: "🖼️" },
    { id: "text-only", label: "Text Only", icon: "💬" },
  ];

  const productLayouts = [
    { id: "grid3", label: "Grid (3 per row)", icon: "▦" },
    { id: "grid2", label: "Grid (2 per row)", icon: "▥" },
    { id: "swipe", label: "Swipe Sideways", icon: "↔️" },
    { id: "list", label: "List View", icon: "☰" },
    { id: "categories", label: "Fixed Categories", icon: "📂" },
  ];

  const animations = [
    { id: "none", label: "None" },
    { id: "fade", label: "Fade In" },
    { id: "slide", label: "Slide Up" },
    { id: "zoom", label: "Zoom In" },
    { id: "bounce", label: "Bounce" },
  ];

  /* -----------------------------------------------
     🎨 UI Layout
  ------------------------------------------------- */
  return (
    <div className="designer-container">
      {/* Header */}
      <header className="designer-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1>🎨 Store Designer</h1>
          <p>Customize your storefront and see live changes</p>
        </div>
        <div className="header-actions">
          {saving ? (
            <div className="save-indicator">
              <span className="saving-dot"></span>
              Saving...
            </div>
          ) : (
            <button 
              className="btn-save-changes"
              onClick={async () => {
                setSaving(true);
                try {
                  await updateStore(store);
                  alert("✅ All changes saved successfully!");
                } catch (err) {
                  alert("❌ Failed to save changes: " + err.message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              💾 Save All Changes
            </button>
          )}
        </div>
      </header>

      <div className="designer-layout">
        {/* --- Design Controls Sidebar --- */}
        <aside className="designer-sidebar">
          {/* Tabs */}
          <div className="design-tabs">
            <button
              className={`tab-btn ${activeTab === "header" ? "active" : ""}`}
              onClick={() => setActiveTab("header")}
            >
              🏠 Header
            </button>
            <button
              className={`tab-btn ${activeTab === "banner" ? "active" : ""}`}
              onClick={() => setActiveTab("banner")}
            >
              🎬 Banner
            </button>
            <button
              className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              🍔 Products
            </button>
            <button
              className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              📖 About
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* ========== HEADER TAB ========== */}
            {activeTab === "header" && (
              <div className="tab-section">
                <h3>Header Settings</h3>

                {/* Store Name */}
                <div className="control-group">
                  <label>Store Name</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={store.name || ""}
                    onBlur={(e) => saveChanges({ name: e.target.value })}
                    placeholder="Enter your store name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="control-group">
                  <label>Logo</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="file-input"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          setSaving(true);
                          const url = await uploadImage(file, "logos", store.id);
                          await saveChanges({ logo_url: url, show_logo: true });
                        } catch (err) {
                          alert("Failed to upload logo");
                        }
                      }}
                    />
                    <label htmlFor="logo-upload" className="file-label">
                      {store.logo_url ? "Change Logo" : "Upload Logo"}
                    </label>
                  </div>
                  {store.logo_url && (
                    <div className="uploaded-preview">
                      <img src={store.logo_url} alt="logo" />
                      <button
                        className="remove-btn"
                        onClick={() => saveChanges({ logo_url: null, show_logo: false })}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Show/Hide Logo */}
                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={store.show_logo !== false && !!store.logo_url}
                      onChange={(e) => saveChanges({ show_logo: e.target.checked })}
                      disabled={!store.logo_url}
                    />
                    <span>Show Logo in Header</span>
                  </label>
                  <small>Display your logo next to the store name</small>
                </div>
              </div>
            )}

            {/* ========== BANNER TAB ========== */}
            {activeTab === "banner" && (
              <div className="tab-section">
                <h3>Banner Settings</h3>

                {/* Banner Type Selection */}
                <div className="control-group">
                  <label>Banner Type</label>
                  <div className="option-grid">
                    {bannerTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`option-card ${
                          store.banner_type === type.id ? "selected" : ""
                        }`}
                        onClick={() => saveChanges({ banner_type: type.id })}
                      >
                        <span className="option-icon">{type.icon}</span>
                        <span className="option-label">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Text */}
                <div className="control-group">
                  <label>Banner Text</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={store.banner_text || ""}
                    onBlur={(e) => saveChanges({ banner_text: e.target.value })}
                    placeholder="Welcome to our store!"
                  />
                </div>

                {/* Specials Text (if type includes specials) */}
                {store.banner_type === "text-specials" && (
                  <div className="control-group">
                    <label>Specials Text</label>
                    <input
                      type="text"
                      className="input-field"
                      defaultValue={store.specials_text || ""}
                      onBlur={(e) => saveChanges({ specials_text: e.target.value })}
                      placeholder="🔥 Special Offers Today!"
                    />
                  </div>
                )}

                {/* Banner Image Upload (for image types) */}
                {store.banner_type === "image-queue" && (
                  <div className="control-group">
                    <label>Banner Background Image</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        id="banner-upload"
                        accept="image/*"
                        className="file-input"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            setSaving(true);
                            const url = await uploadImage(file, "banners", store.id);
                            await saveChanges({ banner_url: url });
                          } catch (err) {
                            alert("Failed to upload banner");
                          }
                        }}
                      />
                      <label htmlFor="banner-upload" className="file-label">
                        {store.banner_url ? "Change Banner" : "Upload Banner"}
                      </label>
                    </div>
                    {store.banner_url && (
                      <div className="uploaded-preview banner">
                        <img src={store.banner_url} alt="banner" />
                        <button
                          className="remove-btn"
                          onClick={() => saveChanges({ banner_url: null })}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <small>Recommended: Wide image (1200x400px) like a YouTube thumbnail</small>
                  </div>
                )}

                {/* Banner Theme */}
                <div className="control-group">
                  <label>Banner Theme</label>
                  <select
                    className="select-field"
                    value={store.banner_theme || "warm"}
                    onChange={(e) => saveChanges({ banner_theme: e.target.value })}
                  >
                    <option value="warm">🔥 Warm Orange</option>
                    <option value="cool">💧 Cool Blue</option>
                    <option value="green">🌿 Fresh Green</option>
                    <option value="dark">🌙 Dark Minimal</option>
                    <option value="vibrant">✨ Vibrant Purple</option>
                  </select>
                </div>

                {/* Banner Animation */}
                <div className="control-group">
                  <label>Banner Animation</label>
                  <select
                    className="select-field"
                    value={store.banner_animation || "fade"}
                    onChange={(e) => saveChanges({ banner_animation: e.target.value })}
                  >
                    {animations.map((anim) => (
                      <option key={anim.id} value={anim.id}>
                        {anim.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Store Open/Closed Toggle */}
                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={store.is_open !== false}
                      onChange={(e) => saveChanges({ is_open: e.target.checked })}
                    />
                    <span>Store is Open</span>
                  </label>
                  <small>Toggle your store status for customers</small>
                </div>

                {/* Show Live Queue */}
                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={store.show_queue !== false}
                      onChange={(e) => saveChanges({ show_queue: e.target.checked })}
                    />
                    <span>Show Live Queue Button</span>
                  </label>
                  <small>Display ready orders for customer pickup</small>
                </div>
              </div>
            )}

            {/* ========== PRODUCTS TAB ========== */}
            {activeTab === "products" && (
              <div className="tab-section">
                <h3>Products Settings</h3>

                {/* Product Layout */}
                <div className="control-group">
                  <label>Product Layout</label>
                  <div className="option-grid">
                    {productLayouts.map((layout) => (
                      <button
                        key={layout.id}
                        className={`option-card ${
                          store.product_layout === layout.id ? "selected" : ""
                        }`}
                        onClick={() => saveChanges({ product_layout: layout.id })}
                      >
                        <span className="option-icon">{layout.icon}</span>
                        <span className="option-label">{layout.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Animation */}
                <div className="control-group">
                  <label>Product Animation</label>
                  <select
                    className="select-field"
                    value={store.product_animation || "fade"}
                    onChange={(e) => saveChanges({ product_animation: e.target.value })}
                  >
                    {animations.map((anim) => (
                      <option key={anim.id} value={anim.id}>
                        {anim.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ========== ABOUT TAB ========== */}
            {activeTab === "about" && (
              <div className="tab-section">
                <h3>About Section</h3>

                {/* Show About Section */}
                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={store.show_about !== false}
                      onChange={(e) => saveChanges({ show_about: e.target.checked })}
                    />
                    <span>Show About Section</span>
                  </label>
                </div>

                {store.show_about !== false && (
                  <>
                    {/* About Look */}
                    <div className="control-group">
                      <label>About Style</label>
                      <div className="option-grid two-col">
                        <button
                          className={`option-card ${
                            store.about_look === "with-image" ? "selected" : ""
                          }`}
                          onClick={() => saveChanges({ about_look: "with-image" })}
                        >
                          <span className="option-icon">🖼️</span>
                          <span className="option-label">With Image</span>
                        </button>
                        <button
                          className={`option-card ${
                            store.about_look === "text-only" ? "selected" : ""
                          }`}
                          onClick={() => saveChanges({ about_look: "text-only" })}
                        >
                          <span className="option-icon">📝</span>
                          <span className="option-label">Text Only</span>
                        </button>
                      </div>
                    </div>

                    {/* About Text */}
                    <div className="control-group">
                      <label>About Text</label>
                      <textarea
                        className="textarea-field"
                        rows={4}
                        defaultValue={store.about_text || ""}
                        onBlur={(e) => saveChanges({ about_text: e.target.value })}
                        placeholder="Tell customers about your business..."
                      />
                    </div>

                    {/* About Image (if look is with-image) */}
                    {store.about_look === "with-image" && (
                      <div className="control-group">
                        <label>About Image</label>
                        <div className="file-upload-area">
                          <input
                            type="file"
                            id="about-upload"
                            accept="image/*"
                            className="file-input"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              try {
                                setSaving(true);
                                const url = await uploadImage(file, "about", store.id);
                                await saveChanges({ about_image_url: url });
                              } catch (err) {
                                alert("Failed to upload image");
                              }
                            }}
                          />
                          <label htmlFor="about-upload" className="file-label">
                            {store.about_image_url ? "Change Image" : "Upload Image"}
                          </label>
                        </div>
                        {store.about_image_url && (
                          <div className="uploaded-preview">
                            <img src={store.about_image_url} alt="about" />
                            <button
                              className="remove-btn"
                              onClick={() => saveChanges({ about_image_url: null })}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="control-group">
                      <label>Social Media Links</label>
                      <div className="social-inputs">
                        {[
                          { key: "facebook", icon: "📘", label: "Facebook" },
                          { key: "instagram", icon: "📷", label: "Instagram" },
                          { key: "whatsapp", icon: "💬", label: "WhatsApp" },
                          { key: "youtube", icon: "📺", label: "YouTube" },
                          { key: "tiktok", icon: "🎵", label: "TikTok" },
                        ].map(({ key, icon, label }) => (
                          <div key={key} className="social-input-row">
                            <span className="social-icon">{icon}</span>
                            <input
                              type="text"
                              className="input-field"
                              placeholder={`${label} URL or phone number`}
                              defaultValue={store.socials?.[key] || ""}
                              onBlur={(e) =>
                                saveChanges({
                                  socials: { ...store.socials, [key]: e.target.value },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* About Animation */}
                    <div className="control-group">
                      <label>About Animation</label>
                      <select
                        className="select-field"
                        value={store.about_animation || "fade"}
                        onChange={(e) => saveChanges({ about_animation: e.target.value })}
                      >
                        {animations.map((anim) => (
                          <option key={anim.id} value={anim.id}>
                            {anim.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </aside>

        {/* --- Live Preview --- */}
        <main className="designer-preview">
          <div className="preview-header">
            <h2>Live Preview</h2>
            <span className="preview-badge">Updates in real-time</span>
          </div>
          <div className="preview-wrapper">
            <PreviewStore state={previewState} />
          </div>
        </main>
      </div>
    </div>
  );
}
