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
export default function StoreDesigner({ onBack, menuItems = [], storeInfo = null }) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("header");

  // 🔥 FIX: Use local state to track store changes
  const [localStore, setLocalStore] = useState(storeInfo);

  // Sync local store when storeInfo prop changes
  useEffect(() => {
    if (storeInfo) {
      console.log('📦 StoreDesigner received storeInfo:', storeInfo);
      setLocalStore(storeInfo);
    }
  }, [storeInfo]);

  const { cart, addItem, removeItem, clearCart, total } = useCart();

  // Determine which store to use
  const store = localStore;
  const loading = !store;
  const error = null;

  // Update function that syncs to database AND local state
  async function updateStoreData(updates) {
    if (!store?.id) {
      console.error('❌ No store ID available');
      return;
    }

    console.log('💾 Saving updates:', updates);

    try {
      // Update database
      const { error, data } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", store.id)
        .select()
        .single();

      if (error && !error.message?.includes('updated_at') && error.code !== '42703') {
        console.error('❌ Update error:', error);
        throw error;
      }

      // 🔥 FIX: Update local state immediately with optimistic update
      const updatedStore = { ...store, ...updates };
      setLocalStore(updatedStore);
      console.log('✅ Store updated successfully:', updatedStore);

    } catch (err) {
      console.error("Update error:", err);
      throw err;
    }
  }

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
        await updateStoreData(updates);
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
      fontSize: store.header_font_size || 20,
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
      fontSize: store.banner_font_size || 28,
    },
    products: {
      layout: "grid3", // 🔥 FIX: Always use grid3 layout
      animation: store.product_animation || "fade",
    },
    about: {
      text: store.about_text || "Proudly serving authentic local food 🇿🇦",
      showImage: store.about_look === "with-image" && !!store.about_image_url,
      imageDataUrl: store.about_image_url,
      socials: store.socials || {},
      animation: store.about_animation || "fade",
      look: store.about_look || "with-image",
      fontSize: store.about_font_size || 16,
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
                  await updateStoreData(store);
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
                          // 🔥 FIX: Use updateStoreData directly instead of debounced saveChanges
                          await updateStoreData({ logo_url: url, show_logo: true });
                          alert("✅ Logo uploaded successfully!");
                        } catch (err) {
                          alert("❌ Failed to upload logo: " + err.message);
                        } finally {
                          setSaving(false);
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

                {/* Header Font Size */}
                <div className="control-group">
                  <label>Store Name Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={store.header_font_size || 20}
                    onChange={(e) => saveChanges({ header_font_size: parseInt(e.target.value) })}
                    className="slider-field"
                  />
                  <span className="slider-value">{store.header_font_size || 20}px</span>
                </div>
              </div>
            )}

            {/* ========== BANNER TAB ========== */}
            {activeTab === "banner" && (
              <div className="tab-section">
                <h3>Banner Settings</h3>

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

                {/* Announcements / Specials Text */}
                <div className="control-group">
                  <label>Announcements / Specials</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={store.specials_text || ""}
                    onBlur={(e) => saveChanges({ specials_text: e.target.value })}
                    placeholder="🔥 Special Offers Today!"
                  />
                </div>

                {/* Banner Font Size */}
                <div className="control-group">
                  <label>Banner Text Font Size</label>
                  <input
                    type="range"
                    min="16"
                    max="40"
                    value={store.banner_font_size || 28}
                    onChange={(e) => saveChanges({ banner_font_size: parseInt(e.target.value) })}
                    className="slider-field"
                  />
                  <span className="slider-value">{store.banner_font_size || 28}px</span>
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

                {/* Show Instructions Toggle */}
                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={store.show_instructions === true}
                      onChange={(e) => saveChanges({ show_instructions: e.target.checked })}
                    />
                    <span>Show Instructions Button</span>
                  </label>
                  <small>Display ordering instructions for customers</small>
                </div>

                {/* Instructions Text (if enabled) */}
                {store.show_instructions && (
                  <div className="control-group">
                    <label>Instructions Text</label>
                    <textarea
                      className="textarea-field"
                      rows={3}
                      defaultValue={store.instructions || ""}
                      onBlur={(e) => saveChanges({ instructions: e.target.value })}
                      placeholder="Enter instructions for customers (e.g., pickup location, payment methods, etc.)"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ========== PRODUCTS TAB ========== */}
            {activeTab === "products" && (
              <div className="tab-section">
                <h3>Products Settings</h3>

                {/* Product Layout - Fixed to Grid 3 */}
                <div className="control-group">
                  <label>Product Layout</label>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>▦</div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Grid (3 per row)</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem' }}>
                      Optimized layout for best customer experience
                    </div>
                  </div>
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

                    {/* Profile Picture */}
                    <div className="control-group">
                      <label>Profile Picture</label>
                      <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.75rem" }}>
                        Upload your profile picture to display in the dashboard header
                      </p>
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id="profile-upload"
                          accept="image/*"
                          className="file-input"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            try {
                              setSaving(true);
                              const url = await uploadImage(file, "profiles", store.id);
                              await updateStoreData({ profile_picture_url: url });
                              alert("✅ Profile picture uploaded successfully!");
                            } catch (err) {
                              alert("❌ Failed to upload profile picture: " + err.message);
                            } finally {
                              setSaving(false);
                            }
                          }}
                        />
                        <label htmlFor="profile-upload" className="file-label">
                          {store.profile_picture_url ? "Change Profile Picture" : "Upload Profile Picture"}
                        </label>
                      </div>
                      {store.profile_picture_url && (
                        <div className="uploaded-preview">
                          <img
                            src={store.profile_picture_url}
                            alt="profile"
                            style={{
                              borderRadius: "50%",
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              border: "3px solid #e5e7eb"
                            }}
                          />
                          <button
                            className="remove-btn"
                            onClick={() => saveChanges({ profile_picture_url: null })}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

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

                    {/* About Font Size */}
                    <div className="control-group">
                      <label>About Text Font Size</label>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={store.about_font_size || 16}
                        onChange={(e) => saveChanges({ about_font_size: parseInt(e.target.value) })}
                        className="slider-field"
                      />
                      <span className="slider-value">{store.about_font_size || 16}px</span>
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
