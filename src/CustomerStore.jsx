// src/CustomerStore.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getSubdomain } from "./utils/subdomain";

// Import your existing templates
import ModernFoodTemplate from "./templates/ModernFoodTemplate";
import TraditionalSATemplate from "./templates/TraditionalSATemplate";
import FastMobileTemplate from "./templates/FastMobileTemplate";

// Import cart hook and UI
import { useCart } from "./hooks/useCart";
import CartSidebar from "./components/CartSidebar";

export default function CustomerStore() {
  const { slug: pathSlug } = useParams(); // Slug from URL path
  const subdomainSlug = getSubdomain(); // Slug from subdomain

  // Priority: subdomain > path param
  const slug = subdomainSlug || pathSlug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Initialize cart (scope cart per store slug)
  const cart = useCart(slug);

  /* -------------------------------------------------------
     Fetch store data by slug
  ------------------------------------------------------- */
  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch store by slug
        console.log("🔍 Looking for store with slug:", slug);
        const { data: store, error: storeError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .single();

        if (storeError) {
          console.error("❌ Store fetch error:", storeError);
          if (storeError.code === "PGRST116") {
            setError("Store not found 😢");
          } else {
            setError("Failed to load store");
          }
          setLoading(false);
          return;
        }

        console.log("✅ Store found:", store.name, "| Store ID:", store.id, "| Owner ID:", store.owner_id);
        setStoreData(store);
        setIsOpen(store.is_open);

        // 2. Fetch menu items
        console.log("🔍 Fetching menu items for store_id:", store.id);
        console.log("🔍 Store plan:", store.plan);

        // FIRST: Check ALL menu items in database (debug)
        const { data: allMenuItems } = await supabase
          .from("menu_items")
          .select("id, name, store_id");
        console.log("📊 ALL menu items in database:", allMenuItems);

        // THEN: Fetch menu items for this specific store
        const { data: menu, error: menuError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("store_id", store.id)
          .order("created_at", { ascending: true });

        if (menuError) {
          console.error("❌ Menu error:", menuError);
        } else {
          console.log("✅ Menu items loaded for this store:", menu?.length || 0, "items");
          console.log("📋 Menu data:", menu);
          setMenuItems(menu || []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Load store error:", err);
        setError("Something went wrong");
        setLoading(false);
      }
    }

    if (slug) {
      loadStore();
    }
  }, [slug]);

  /* -------------------------------------------------------
     Realtime: Listen for ALL store updates from Store Designer
  ------------------------------------------------------- */
  useEffect(() => {
    if (!storeData?.id) return;

    const channel = supabase
      .channel(`store-${storeData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stores",
          filter: `id=eq.${storeData.id}`,
        },
        (payload) => {
          const updated = payload.new;
          console.log("Store updated in realtime:", updated);
          setStoreData(updated);
          setIsOpen(updated.is_open);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeData?.id]);

  /* -------------------------------------------------------
     Realtime: Listen for menu_items changes (INSERT, UPDATE, DELETE)
  ------------------------------------------------------- */
  useEffect(() => {
    if (!storeData?.id) return;

    const menuChannel = supabase
      .channel(`menu-items-${storeData.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "menu_items",
          filter: `store_id=eq.${storeData.id}`,
        },
        async (payload) => {
          console.log("Menu items changed in realtime:", payload);

          // Refetch all menu items to ensure consistency
          const { data: menu, error: menuError } = await supabase
            .from("menu_items")
            .select("*")
            .eq("store_id", storeData.id)
            .order("created_at", { ascending: true });

          if (!menuError && menu) {
            setMenuItems(menu);
            console.log("✅ Menu items updated:", menu.length, "items");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
    };
  }, [storeData?.id]);

  /* -------------------------------------------------------
     Loading & Error States
  ------------------------------------------------------- */
  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading store...</h2>
        <p>Please wait</p>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div style={styles.error}>
        <h2>😢 {error || "Store not found"}</h2>
        <p>The store "{slug}" doesn't exist or is unavailable.</p>
      </div>
    );
  }

  /* -------------------------------------------------------
     Select Template Based on active_template
  ------------------------------------------------------- */
  const renderTemplate = () => {
    // Build state object expected by templates
    const state = {
      header: {
        showLogo: storeData.show_logo !== false && !!storeData.logo_url,
        logoDataUrl: storeData.logo_url,
        storeName: storeData.name || "My Store",
      },
      banner: {
        bannerText: storeData.banner_text || "Welcome to our store!",
        specialsText: storeData.specials_text || "",
        isOpen: isOpen,
        showQueue: storeData.show_queue !== false,
        bgDataUrl: storeData.banner_url,
      },
      products: {
        layout: storeData.product_layout || "grid3",
        animation: storeData.product_animation || "fade",
      },
      about: {
        text: storeData.about_text || "Proudly serving authentic local food 🇿🇦",
        showImage: storeData.about_look === "with-image" && !!storeData.about_image_url,
        imageDataUrl: storeData.about_image_url,
        socials: storeData.socials || {},
        animation: storeData.about_animation || "fade",
        look: storeData.about_look || "with-image",
      },
      menuItems: menuItems || [],
      liveQueue: [],
      show_about: storeData.show_about !== false,
      estimated_time: storeData.estimated_time || 0,
      show_instructions: storeData.show_instructions === true,
      instructions: storeData.instructions || "",
      accept_card_payments: storeData.accept_card_payments !== false,
      yoco_public_key: storeData.yoco_public_key || "",
      yoco_secret_key: storeData.yoco_secret_key || "",
      slug: slug,
    };

    console.log("🎨 Rendering template:", storeData.active_template);
    console.log("🍔 Menu items to render:", menuItems?.length || 0);
    console.log("🔑 Yoco keys being passed to template:", {
      public: storeData.yoco_public_key ? storeData.yoco_public_key.substring(0, 20) + '...' : 'MISSING',
      secret: storeData.yoco_secret_key ? storeData.yoco_secret_key.substring(0, 20) + '...' : 'MISSING'
    });

    const commonProps = { state, storeId: storeData.id, cart };

    switch (storeData.active_template) {
      case "Traditional SA":
        return <TraditionalSATemplate {...commonProps} />;
      case "Fast & Mobile":
        return <FastMobileTemplate {...commonProps} />;
      case "Modern Food":
      default:
        return <ModernFoodTemplate {...commonProps} />;
    }
  };

  return (
    <div className="customer-store">
      {renderTemplate()}
      {/* Floating Cart Sidebar */}
      <CartSidebar cart={cart} store={storeData} />
    </div>
  );
}

/* -------------------------------------------------------
   Basic Styles
------------------------------------------------------- */
const styles = {
  loading: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  error: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center",
    padding: "2rem",
  },
};
