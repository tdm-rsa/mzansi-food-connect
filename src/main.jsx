//main.js

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppWrapper from "./AppWrapper.jsx";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppWrapper />} />
        <Route path="/store" element={<StorefrontRouter />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);




