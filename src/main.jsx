//main.js

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppWrapper from "./AppWrapper.jsx";
import CustomerStore from "./CustomerStore.jsx";
import Checkout from "./Checkout.jsx";
import LiveQueue from "./LiveQueue.jsx";
import Landing from "./Landing.jsx";
import { getSubdomain } from "./utils/subdomain.js";

import ModernFoodTemplate from "./templates/ModernFoodTemplate.jsx";
import TraditionalSATemplate from "./templates/TraditionalSATemplate.jsx";
import FastMobileTemplate from "./templates/FastMobileTemplate.jsx";

import "./index.css";
import { supabase } from "./supabaseClient";

function StorefrontRouter() {
  const [state, setState] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState("Modern Food");

  useEffect(() => {
    async function fetchStoreData() {
      // get first store
      const { data: store } = await supabase.from("stores").select("*").limit(1).single();
      if (!store) return;

      // load menu
      const { data: menu } = await supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", store.id);

      // live queue
      const { data: readyOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "ready");

      // build frontend state
      setState({
        header: { 
          storeName: store.name, 
          showLogo: store.show_logo !== false && !!store.logo_url,
          logoDataUrl: store.logo_url,
        },
        banner: {
          bannerText: store.banner_text,
          specialsText: store.specials_text,
          isOpen: store.is_open,
          showQueue: store.show_queue !== false,
          bgDataUrl: store.banner_url,
        },
        menuItems: menu || [],
        about: {
          text: store.about_text || "We serve authentic South African fast food with love ????",
          showImage: store.about_look === "with-image" && !!store.about_image_url,
          imageDataUrl: store.about_image_url,
          socials: store.socials || {},
        },
        liveQueue: readyOrders || [],
        store_id: store.id,
      });

      // detect active template
      setActiveTemplate(store.active_template || "Modern Food");
    }

    fetchStoreData();
  }, []);

  if (!state)
    return <p style={{ color: "#fff", textAlign: "center" }}>Loading store...</p>;

  // ✅ Switch template dynamically
  switch (activeTemplate) {
    case "Traditional SA":
      return <TraditionalSATemplate state={state} storeId={state.store_id} />;
    case "Fast & Mobile":
      return <FastMobileTemplate state={state} storeId={state.store_id} />;
    case "Modern Food":
    default:
      return <ModernFoodTemplate state={state} storeId={state.store_id} />;
  }
}

// Detect if we're on a subdomain to route accordingly
function AppRouter() {
  const subdomain = getSubdomain();

  // If on subdomain (e.g., joeskfc.mzansifoodconnect.com)
  // Show customer storefront routes only
  if (subdomain) {
    return (
      <Routes>
        {/* Customer Store Home */}
        <Route path="/" element={<CustomerStore />} />

        {/* Checkout Page */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Live Queue Page */}
        <Route path="/queue" element={<LiveQueue />} />

        {/* Catch all - redirect to store home */}
        <Route path="*" element={<CustomerStore />} />
      </Routes>
    );
  }

  // Main domain (e.g., mzansifoodconnect.com)
  // Show platform routes (dashboard, landing, path-based stores)
  return (
    <Routes>
      {/* Landing Page (Homepage) */}
      <Route path="/" element={<Landing />} />

      {/* Owner Dashboard/App */}
      <Route path="/app" element={<AppWrapper />} />

      {/* Legacy landing route (redirect to home) */}
      <Route path="/landing" element={<Landing />} />

      {/* Customer Storefront with Slug (path-based) */}
      <Route path="/store/:slug" element={<CustomerStore />} />

      {/* Checkout Page (path-based) */}
      <Route path="/store/:slug/checkout" element={<Checkout />} />

      {/* Live Queue Page (path-based) */}
      <Route path="/store/:slug/queue" element={<LiveQueue />} />

      {/* Legacy route for testing (uses first store) */}
      <Route path="/store" element={<StorefrontRouter />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>
);




