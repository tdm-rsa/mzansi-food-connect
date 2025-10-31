import React, { useState } from "react";
import "./PreviewStore.css";

export default function PreviewStore({ state }) {
  const [activeCategory, setActiveCategory] = useState(null);

  if (!state) {
    return (
      <div className="preview-store">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  const { header, banner, products, about, menuItems = [], show_about } = state;

  // Get animation class
  const getAnimClass = (animType) => {
    if (!animType || animType === "none") return "anim-none";
    return `anim-${animType}`;
  };

  // Group menu items by category
  const groupedItems = menuItems.reduce((groups, item) => {
    const cat = item.category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
    return groups;
  }, {});

  const categories = Object.keys(groupedItems);
  
  // Initialize active category on first render
  React.useEffect(() => {
    if (activeCategory === null && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories.length, activeCategory]);

  // Render products based on layout
  const renderProducts = (items, layout) => {
    if (!items || items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p>No menu items yet</p>
        </div>
      );
    }

    const layoutClass = `product-layout-${layout}`;

    return (
      <div className={`${layoutClass} ${getAnimClass(products?.animation)}`}>
        {items.map((item) => (
          <div key={item.id} className="product-card">
            {item.image_url && (
              <div className="product-card-image">
                <img src={item.image_url} alt={item.name} />
              </div>
            )}
            <div className="product-card-info">
              <div className="product-card-name">{item.name}</div>
              <div className="product-card-price">R{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="preview-store">
      {/* ========== HEADER ========== */}
      <header className="preview-header">
        <div className="preview-header-logo">
          {header?.showLogo && header?.logoDataUrl && (
            <img src={header.logoDataUrl} alt="Logo" />
          )}
          <h1>{header?.storeName || "My Store"}</h1>
        </div>
      </header>

      {/* ========== BANNER ========== */}
      <section
        className={`preview-banner theme-${banner?.theme || "warm"} ${
          banner?.type === "image-queue" && banner?.bgDataUrl ? "has-image" : ""
        } ${getAnimClass(banner?.animation)}`}
        style={{
          backgroundImage:
            banner?.type === "image-queue" && banner?.bgDataUrl
              ? `url(${banner.bgDataUrl})`
              : undefined,
        }}
      >
        <div className="preview-banner-content">
          <h2>{banner?.bannerText || "Welcome!"}</h2>

          {/* Specials (text-specials banner type) */}
          {banner?.type === "text-specials" && banner?.specialsText && (
            <div className="preview-banner-specials">{banner.specialsText}</div>
          )}

          {/* Store Status */}
          <div className={`preview-banner-status ${banner?.isOpen ? "open" : "closed"}`}>
            {banner?.isOpen ? "🟢 Open Now" : "🔴 Closed"}
          </div>

          {/* Live Queue Button (for queue-enabled banner types) */}
          {banner?.showQueue &&
            (banner?.type === "text-queue" || banner?.type === "image-queue") && (
              <button className="preview-queue-btn">🕒 View Live Queue</button>
            )}
        </div>
      </section>

      {/* ========== PRODUCTS ========== */}
      <section className="preview-products">
        <h3>Our Menu</h3>

        {/* Categories Layout - Fixed Tabs */}
        {products?.layout === "categories" && categories.length > 0 ? (
          <>
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${cat === activeCategory ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {activeCategory &&
              renderProducts(
                groupedItems[activeCategory],
                "grid3" // Always use grid for category view
              )}
          </>
        ) : (
          // Regular layouts (grid3, grid2, list, swipe)
          renderProducts(menuItems, products?.layout || "grid3")
        )}
      </section>

      {/* ========== ABOUT ========== */}
      {show_about !== false && (
        <section className={`preview-about ${getAnimClass(about?.animation)}`}>
          <h3>About Us</h3>
          <p>{about?.text || "Proudly serving authentic local food 🇿🇦"}</p>
          {about?.showImage && about?.imageDataUrl && (
            <img src={about.imageDataUrl} alt="About us" />
          )}
        </section>
      )}
    </div>
  );
}
