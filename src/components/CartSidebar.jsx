// src/components/CartSidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CartSidebar.css";

export default function CartSidebar({ cart, store }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { items, addItem, removeItem, clearCart, getTotal, getTotalItems, updateItem } = cart;

  const toggleCart = () => setIsOpen(!isOpen);

  const handleCheckout = () => {
    if (items.length === 0) return;
    // Navigate to checkout page
    // Check if we're on a subdomain or path-based store
    const isSubdomain = window.location.hostname !== 'localhost' &&
                       window.location.hostname !== 'mzansifoodconnect.com' &&
                       !window.location.hostname.includes('vercel.app');

    if (isSubdomain) {
      // Subdomain: just /checkout
      navigate('/checkout');
    } else {
      // Path-based: /store/slug/checkout
      navigate(`/store/${store.slug}/checkout`);
    }
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotal();

  const togglePreference = (item, pref) => {
    const selected = new Set(item.selectedPreferences || []);
    if (selected.has(pref)) {
      if (selected.size <= 1) return; // keep at least one
      selected.delete(pref);
    } else {
      selected.add(pref);
    }
    updateItem(item.id, { selectedPreferences: Array.from(selected) });
  };

  return (
    <div className="mfc-cart-root">
      {/* Floating Cart Button */}
      <button
        className="mfc-cart-float-button"
        onClick={toggleCart}
        aria-label="View cart"
      >
        🛒
        {totalItems > 0 && (
          <span className="mfc-cart-badge">{totalItems}</span>
        )}
      </button>

      {/* Cart Sidebar */}
      <div className={`mfc-cart-sidebar ${isOpen ? "open" : ""}`}>
        <div className="mfc-cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="mfc-cart-close-btn" onClick={toggleCart}>
            ✕
          </button>
        </div>

        <div className="mfc-cart-content">
          {items.length === 0 ? (
            <div className="mfc-cart-empty">
              <p>Your cart is empty 😢</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Add some delicious items!
              </p>
            </div>
          ) : (
            <>
              <div className="mfc-cart-items">
                {items.map((item) => (
                  <div key={item.id} className="mfc-cart-item">
                    <div className="mfc-cart-item-thumb">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="mfc-cart-thumb" />
                      )}
                    </div>

                    <div className="mfc-cart-item-info">
                      <h4>{item.name}</h4>
                      <p className="mfc-cart-item-price">R{item.price}</p>

                      <div className="mfc-cart-item-controls">
                        <button
                          className="mfc-cart-qty-btn"
                          onClick={() => removeItem(item.id, item.price)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="mfc-cart-qty">{item.qty}</span>
                        <button
                          className="mfc-cart-qty-btn"
                          onClick={() => addItem({ ...item, qty: 1 })}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="mfc-cart-item-actions">
                        <button className="mfc-remove-btn" onClick={() => removeItem(item.id, 0, item.qty)}>
                          Remove
                        </button>
                      </div>

                      {Array.isArray(item.availablePreferences) && item.availablePreferences.length > 0 && (
                        <div style={{ marginTop: "0.45rem" }}>
                          <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>Preferences</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {item.availablePreferences.map((pref) => (
                              <label
                                key={pref}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.3rem 0.5rem",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  background: (item.selectedPreferences || []).includes(pref) ? "rgba(102,126,234,0.12)" : "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={(item.selectedPreferences || []).includes(pref)}
                                  onChange={() => togglePreference(item, pref)}
                                />
                                <span>{pref}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mfc-cart-item-subtotal">R{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mfc-cart-footer">
                <div className="mfc-cart-total">
                  <span>Total:</span>
                  <span className="mfc-cart-total-price">R{totalPrice.toFixed(2)}</span>
                </div>

                <button
                  className="mfc-cart-checkout-btn"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>

                <button
                  className="mfc-cart-clear-btn"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay when cart is open */}
      {isOpen && (
        <div
          className="mfc-cart-overlay"
          onClick={toggleCart}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
