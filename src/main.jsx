//main.js

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppWrapper from "./AppWrapper.jsx";
import CustomerStore from "./CustomerStore.jsx";
import Checkout from "./Checkout.jsx";
import LiveQueue from "./LiveQueue.jsx";
import Landing from "./Landing.jsx";
import ResetPassword from "./ResetPassword.jsx";
import PaymentSuccess from "./PaymentSuccess.jsx";
import PaymentFailed from "./PaymentFailed.jsx";
import UpgradeSuccess from "./UpgradeSuccess.jsx";
import UpgradeFailed from "./UpgradeFailed.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminDashboardPage from "./AdminDashboardPage.jsx";
import AffiliateSignup from "./AffiliateSignup.jsx";
import AffiliateDashboard from "./AffiliateDashboardSecure.jsx";
import AffiliateTerms from "./AffiliateTerms.jsx";
import Portfolio from "./Portfolio.jsx";
import { getSubdomain } from "./utils/subdomain.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import ModernFoodTemplate from "./templates/ModernFoodTemplate.jsx";
import TraditionalSATemplate from "./templates/TraditionalSATemplate.jsx";
import FastMobileTemplate from "./templates/FastMobileTemplate.jsx";
import GhostKitchenProTemplate from "./templates/GhostKitchenProTemplate.jsx";
import LateNightFiestaTemplate from "./templates/LateNightFiestaTemplate.jsx";

import "./index.css";
import { supabase } from "./supabaseClient";

function StorefrontRouter() {
  const [state, setState] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState("Modern Food");

  useEffect(() => {
    async function fetchStoreData() {
      // get first store
      const { data: store } = await supabase.from("tenants").select("*").limit(1).single();
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
    case "Ghost Kitchen Pro":
      return <GhostKitchenProTemplate state={state} storeId={state.store_id} />;
    case "Late Night Fiesta":
      return <LateNightFiestaTemplate state={state} storeId={state.store_id} />;
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

        {/* Payment Success Page */}
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Payment Failed Page */}
        <Route path="/payment-failed" element={<PaymentFailed />} />

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

      {/* Password Reset Page */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Payment Success Page */}
      <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* Payment Failed Page */}
      <Route path="/payment-failed" element={<PaymentFailed />} />

      {/* Upgrade Success Page */}
      <Route path="/upgrade-success" element={<UpgradeSuccess />} />

      {/* Upgrade Failed Page */}
      <Route path="/upgrade-failed" element={<UpgradeFailed />} />

      {/* Admin Login Page */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* Admin Dashboard Page */}
      <Route path="/admin-dashboard" element={<AdminDashboardPage />} />

      {/* Affiliate Program Routes */}
      <Route path="/become-affiliate" element={<AffiliateSignup />} />
      <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
      <Route path="/affiliate-terms" element={<AffiliateTerms />} />

      {/* Portfolio/Creator Route */}
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/creator" element={<Portfolio />} />

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
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);



