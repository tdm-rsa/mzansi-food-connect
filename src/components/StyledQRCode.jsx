import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { supabase } from "../supabaseClient";
import logo from "../images/logo.png";

export default function StyledQRCode({ storeName }) {
  const ref = useRef(null);
  const whatsappQrRef = useRef(null);
  const yocoQrRef = useRef(null);
  const [qr, setQr] = useState(null);
  const [whatsappQr, setWhatsappQr] = useState(null);
  const [yocoQr, setYocoQr] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🎨 Customizable state
  const [color, setColor] = useState("#ff6b35");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [frameStyle, setFrameStyle] = useState("rounded");
  const [tagline, setTagline] = useState("Scan to order online 🍴");
  const [logoFile, setLogoFile] = useState(null);
  const [ownerWebsite, setOwnerWebsite] = useState("");
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
  const [storeId, setStoreId] = useState(null);
  const [storeSlug, setStoreSlug] = useState("");
  const [yocoPaymentLink, setYocoPaymentLink] = useState("");

  // ✅ Load saved QR design from Supabase
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase.from("tenants").select("*").limit(1).single();
      if (error) 

      if (data) {
        setColor(data.qr_color || "#ff6b35");
        setBgColor(data.qr_bg || "#ffffff");
        setFrameStyle(data.qr_frame || "rounded");
        setTagline(data.qr_tagline || "Scan to order online 🍴");
        setOwnerWebsite(data.qr_custom_url || "");
        setWhatsappGroupLink(data.whatsapp_group_link || "");
        setStoreId(data.id);
        setStoreSlug(data.slug || "");
        setYocoPaymentLink(data.yoco_payment_link || "");
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  // 🔥 Default to subdomain URL: https://slug.mzansifoodconnect.app
  const storeUrl = ownerWebsite?.trim()
    ? ownerWebsite.trim()
    : storeSlug
      ? `https://${storeSlug}.mzansifoodconnect.app`
      : `${window.location.origin}/store/${encodeURIComponent(storeName)}`;

  // Initialize Store URL QR (Black theme - fixed color)
  useEffect(() => {
    if (loading) return;
    const qrCode = new QRCodeStyling({
      width: 250,
      height: 250,
      data: storeUrl,
      margin: 10,
      dotsOptions: {
        color: "#1a1a1a", // Fixed black color for store QR
        type: frameStyle,
      },
      backgroundOptions: {
        color: "#ffffff", // White background
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
      },
    });

    setQr(qrCode);
    qrCode.append(ref.current);
  }, [loading]);

  // Update Store QR when settings change
  useEffect(() => {
    if (qr) {
      qr.update({
        data: storeUrl,
        dotsOptions: { color: "#1a1a1a", type: frameStyle }, // Fixed black
        backgroundOptions: { color: "#ffffff" }, // Fixed white
        image: logoFile ? URL.createObjectURL(logoFile) : null,
      });
    }
  }, [qr, frameStyle, logoFile, storeUrl]);

  // Initialize WhatsApp Group QR (Green theme - fixed color)
  useEffect(() => {
    if (!whatsappGroupLink || loading) {
      // Clear WhatsApp QR if no link
      if (whatsappQrRef.current) {
        whatsappQrRef.current.innerHTML = "";
      }
      setWhatsappQr(null);
      return;
    }

    // Create WhatsApp QR code with fixed green color
    const whatsappQrCode = new QRCodeStyling({
      width: 250,
      height: 250,
      data: whatsappGroupLink,
      margin: 10,
      dotsOptions: {
        color: "#25D366", // Fixed WhatsApp green
        type: frameStyle,
      },
      backgroundOptions: {
        color: "#ffffff", // Fixed white background
      },
    });

    setWhatsappQr(whatsappQrCode);
    if (whatsappQrRef.current) {
      whatsappQrRef.current.innerHTML = ""; // Clear previous
      whatsappQrCode.append(whatsappQrRef.current);
    }
  }, [whatsappGroupLink, loading, frameStyle]);

  // Update WhatsApp QR when settings change
  useEffect(() => {
    if (whatsappQr && whatsappGroupLink) {
      whatsappQr.update({
        data: whatsappGroupLink,
        dotsOptions: { color: "#25D366", type: frameStyle }, // Fixed green
        backgroundOptions: { color: "#ffffff" }, // Fixed white
      });
    }
  }, [whatsappQr, whatsappGroupLink, frameStyle]);

  // Initialize Yoco Payment QR (Purple theme - fixed color)
  useEffect(() => {
    if (!yocoPaymentLink || loading) {
      // Clear Yoco QR if no link
      if (yocoQrRef.current) {
        yocoQrRef.current.innerHTML = "";
      }
      setYocoQr(null);
      return;
    }

    // Use the vendor's actual Yoco payment link
    // This is the link they get from their Yoco Business Portal
    // Supports open amount - customer can enter any amount
    const yocoPaymentUrl = yocoPaymentLink.trim();

    // Create Yoco Payment QR code with fixed purple color
    const yocoQrCode = new QRCodeStyling({
      width: 250,
      height: 250,
      data: yocoPaymentUrl,
      margin: 10,
      dotsOptions: {
        color: "#667eea", // Fixed purple/Yoco brand color
        type: frameStyle,
      },
      backgroundOptions: {
        color: "#ffffff", // Fixed white background
      },
    });

    setYocoQr(yocoQrCode);
    if (yocoQrRef.current) {
      yocoQrRef.current.innerHTML = ""; // Clear previous
      yocoQrCode.append(yocoQrRef.current);
    }
  }, [yocoPaymentLink, loading, frameStyle]);

  // Update Yoco QR when settings change
  useEffect(() => {
    if (yocoQr && yocoPaymentLink) {
      const yocoPaymentUrl = yocoPaymentLink.trim();
      yocoQr.update({
        data: yocoPaymentUrl,
        dotsOptions: { color: "#667eea", type: frameStyle }, // Fixed purple
        backgroundOptions: { color: "#ffffff" }, // Fixed white
      });
    }
  }, [yocoQr, yocoPaymentLink, frameStyle]);

  const downloadQR = async () => {
    try {
      if (!qr) {
        alert("QR code not ready yet. Please wait.");
        return;
      }

      // Create a canvas to design the full QR poster
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size for print quality (A5 size at 300 DPI)
      const width = 1748; // A5 width at 300 DPI
      const height = 2480; // A5 height at 300 DPI
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f8f9fa");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Load and draw MFC logo
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = (err) => {
          
          reject(err);
        };
        logoImg.src = logo;
      });

      // Draw logo at top (centered)
      const logoWidth = 400;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      ctx.drawImage(logoImg, (width - logoWidth) / 2, 100, logoWidth, logoHeight);

      // Draw store name
      ctx.fillStyle = color;
      ctx.font = "bold 90px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(storeName, width / 2, logoHeight + 280);

      // Draw tagline
      ctx.fillStyle = "#666";
      ctx.font = "48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText(tagline, width / 2, logoHeight + 380);

      // Get QR code as blob and draw it
      const qrBlob = await qr.getRawData("png");
      const qrImage = new Image();

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = (err) => {
          
          reject(err);
        };
        qrImage.src = URL.createObjectURL(qrBlob);
      });

      // Draw QR code (larger, centered)
      const qrSize = 900;
      const qrX = (width - qrSize) / 2;
      const qrY = logoHeight + 480;

      // Add white background with shadow for QR
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#ffffff";
      const borderRadius = 40;
      ctx.beginPath();
      ctx.roundRect(qrX - 60, qrY - 60, qrSize + 120, qrSize + 120, borderRadius);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Draw URL below QR
      ctx.fillStyle = "#333";
      ctx.font = "42px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      const displayUrl = storeUrl.replace(/^https?:\/\//, "");
      ctx.fillText(displayUrl, width / 2, qrY + qrSize + 160);

      // Draw footer text
      ctx.fillStyle = color;
      ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText("Scan to Order Online", width / 2, qrY + qrSize + 260);

      // Add decorative line
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, qrY + qrSize + 300);
      ctx.lineTo(width / 2 + 200, qrY + qrSize + 300);
      ctx.stroke();

      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Failed to create image. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${storeName}-QR-Poster.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png", 1.0);
    } catch (error) {
      
      alert(`Failed to create QR poster: ${error.message}`);
    }
  };

  const downloadYocoQR = async () => {
    try {
      if (!yocoQr) {
        alert("Yoco QR code not ready. Please add your Yoco payment link first.");
        return;
      }

      // Create a canvas for the Yoco payment QR poster
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size for print quality
      const width = 1748;
      const height = 2480;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw "Scan to Pay" heading
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 140px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan to Pay", width / 2, 300);

      // Get Yoco QR code as blob and draw it
      const yocoBlob = await yocoQr.getRawData("png");
      const yocoImage = new Image();

      await new Promise((resolve, reject) => {
        yocoImage.onload = resolve;
        yocoImage.onerror = reject;
        yocoImage.src = URL.createObjectURL(yocoBlob);
      });

      // Draw QR code (larger, centered)
      const qrSize = 1000;
      const qrX = (width - qrSize) / 2;
      const qrY = 450;

      // Add white background with shadow for QR
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = "#ffffff";
      const borderRadius = 50;
      ctx.beginPath();
      ctx.roundRect(qrX - 80, qrY - 80, qrSize + 160, qrSize + 160, borderRadius);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw QR code
      ctx.drawImage(yocoImage, qrX, qrY, qrSize, qrSize);

      // Draw store name below QR
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 100px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(storeName, width / 2, qrY + qrSize + 220);

      // Draw instructions
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText("Scan with camera • Enter amount • Pay", width / 2, qrY + qrSize + 340);

      // Add Yoco branding
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText("Powered by Yoco", width / 2, height - 150);

      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Failed to create payment QR. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${storeName}-Payment-QR.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png", 1.0);
    } catch (error) {
      
      alert(`Failed to create payment QR: ${error.message}`);
    }
  };

  const downloadWhatsappQR = async () => {
    try {
      if (!whatsappQr) {
        alert("WhatsApp QR code not ready. Please add your WhatsApp group link first.");
        return;
      }

      // Create a canvas for the WhatsApp group QR poster
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size for print quality
      const width = 1748;
      const height = 2480;
      canvas.width = width;
      canvas.height = height;

      // Background gradient (WhatsApp green theme)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#25D366");
      gradient.addColorStop(1, "#128C7E");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw "Join Our Group" heading
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 140px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Join Our Group", width / 2, 300);

      // Get WhatsApp QR code as blob and draw it
      const whatsappBlob = await whatsappQr.getRawData("png");
      const whatsappImage = new Image();

      await new Promise((resolve, reject) => {
        whatsappImage.onload = resolve;
        whatsappImage.onerror = reject;
        whatsappImage.src = URL.createObjectURL(whatsappBlob);
      });

      // Draw QR code (larger, centered)
      const qrSize = 1000;
      const qrX = (width - qrSize) / 2;
      const qrY = 450;

      // Add white background with shadow for QR
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = "#ffffff";
      const borderRadius = 50;
      ctx.beginPath();
      ctx.roundRect(qrX - 80, qrY - 80, qrSize + 160, qrSize + 160, borderRadius);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw QR code
      ctx.drawImage(whatsappImage, qrX, qrY, qrSize, qrSize);

      // Draw store name below QR
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 100px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(storeName, width / 2, qrY + qrSize + 220);

      // Draw instructions
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText("Scan • Join • Get updates & offers", width / 2, qrY + qrSize + 340);

      // Add WhatsApp branding
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText("WhatsApp Group", width / 2, height - 150);

      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Failed to create WhatsApp QR. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${storeName}-WhatsApp-Group-QR.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png", 1.0);
    } catch (error) {
      
      alert(`Failed to create WhatsApp QR: ${error.message}`);
    }
  };

  const saveDesign = async () => {
    if (!storeId) return;
    const { error } = await supabase
      .from("tenants")
      .update({
        qr_color: color,
        qr_bg: bgColor,
        qr_frame: frameStyle,
        qr_tagline: tagline,
        qr_custom_url: ownerWebsite,
        whatsapp_group_link: whatsappGroupLink,
        yoco_payment_link: yocoPaymentLink,
      })
      .eq("id", storeId);
    if (error) alert("⚠️ Could not save design.");
    else alert("✅ QR design saved successfully!");
  };

  if (loading)
    return (
      <p style={{ color: "#fff", textAlign: "center" }}>
        Loading QR designer...
      </p>
    );

  return (
    <div className="qr-designer-card">
      <h3 style={{ marginBottom: "1rem" }}>📱 QR Code Designer</h3>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Configure and download three separate QR codes for your store
      </p>

      {/* 1️⃣ STORE URL QR CODE - BLACK THEME */}
      <div style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <h4 style={{ color: "#1a1a1a", background: "#fff", display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          🏪 Store URL QR Code (Black)
        </h4>

        {/* QR Preview Card */}
        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            display: "inline-block",
            borderRadius: frameStyle === "rounded" ? "20px" : "0px",
            boxShadow: "0 0 12px rgba(0,0,0,0.25)",
          }}
        >
          <div ref={ref}></div>

          {/* Store branding below QR */}
          <div
            style={{
              marginTop: "1rem",
              background: "#fff",
              padding: "0.5rem 0.8rem",
              borderRadius: "8px",
              border: "2px solid #1a1a1a",
            }}
          >
            <h4 style={{ color: "#1a1a1a", margin: 0, fontSize: "1.1rem" }}>{storeName}</h4>
            <p style={{ margin: 0, color: "#333", fontSize: "0.85rem" }}>
              {storeUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>

        {/* Tagline */}
        {tagline && (
          <p
            style={{
              marginTop: "1rem",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.9)",
              fontWeight: "500",
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        {/* Frame Style */}
        <div>
          <label>QR Code Frame Style (applies to all QR codes)</label>
          <select
            className="design-select"
            value={frameStyle}
            onChange={(e) => setFrameStyle(e.target.value)}
          >
            <option value="rounded">Rounded</option>
            <option value="dots">Dots</option>
            <option value="square">Square</option>
            <option value="extra-rounded">Extra Rounded</option>
          </select>
        </div>

        {/* Tagline */}
        <div>
          <label>Tagline</label>
          <input
            type="text"
            className="design-select"
            placeholder="Enter tagline text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>

        {/* Website */}
        <div>
          <label>Custom Website (optional - defaults to subdomain)</label>
          <input
            type="text"
            className="design-select"
            placeholder={`Default: https://${storeSlug}.mzansifoodconnect.app`}
            value={ownerWebsite}
            onChange={(e) => setOwnerWebsite(e.target.value)}
          />
          <small style={{ color: "#999", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}>
            Leave blank to use your subdomain URL
          </small>
        </div>

        {/* Logo Upload */}
        <div>
          <label>Upload Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0])}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={saveDesign}
            style={{
              background: "#333",
              border: "none",
              padding: "0.7rem 1.4rem",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            💾 Save Settings
          </button>
        </div>
      </div>

      {/* Store QR Download Button */}
      <button
        onClick={downloadQR}
        style={{
          background: "#1a1a1a",
          border: "none",
          padding: "0.7rem 1.4rem",
          borderRadius: "8px",
          cursor: "pointer",
          color: "#fff",
          fontWeight: "600",
          marginTop: "1rem",
          display: "block",
        }}
      >
        ⬇️ Download Store QR
      </button>

      <p style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontStyle: "italic" }}>
        Print this QR and display at your store. Customers scan to visit your online store.
      </p>

      <p style={{ marginTop: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
        Scans to: <strong style={{ color: "rgba(255,255,255,0.9)" }}>{storeUrl}</strong>
      </p>

      {/* 2️⃣ WHATSAPP GROUP QR CODE - GREEN THEME */}
      <div style={{ marginTop: "3rem", paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <h4 style={{ color: "#25D366", background: "#fff", display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          📱 WhatsApp Group QR Code (Green)
        </h4>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            display: "inline-block",
            borderRadius: frameStyle === "rounded" ? "20px" : "0px",
            boxShadow: "0 0 12px rgba(0,0,0,0.25)",
          }}
        >
          <div ref={whatsappQrRef}></div>

          <div
            style={{
              marginTop: "1rem",
              background: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "2px solid #25D366",
            }}
          >
            <h4 style={{ color: "#25D366", margin: 0, fontSize: "1.1rem" }}>Join our WhatsApp Group</h4>
            <p style={{ margin: "0.25rem 0 0 0", color: "#333", fontSize: "0.85rem" }}>
              Get updates & special offers
            </p>
          </div>
        </div>

        <button
          onClick={downloadWhatsappQR}
          style={{
            background: "#25D366",
            border: "none",
            padding: "0.7rem 1.4rem",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#fff",
            fontWeight: "600",
            marginTop: "1rem",
          }}
        >
          ⬇️ Download WhatsApp QR
        </button>

        <p style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontStyle: "italic" }}>
          Print this QR and display at your store. Customers scan to join your WhatsApp group for updates and offers.
        </p>

        {/* WhatsApp Group Link Input */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
            WhatsApp Group Link (optional)
          </label>
          <input
            type="text"
            className="design-select"
            placeholder="https://chat.whatsapp.com/..."
            value={whatsappGroupLink}
            onChange={(e) => setWhatsappGroupLink(e.target.value)}
            style={{
              width: "100%",
              padding: "0.7rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          />
          <small style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", display: "block", marginTop: "0.5rem" }}>
            Create a WhatsApp group, then get the invite link to add here
          </small>
        </div>
      </div>

      {/* 3️⃣ YOCO PAYMENT QR CODE - PURPLE THEME */}
      <div style={{ marginTop: "3rem", paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
        <h4 style={{ color: "#667eea", background: "#fff", display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          💳 Yoco Payment QR Code (Purple)
        </h4>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            display: "inline-block",
            borderRadius: frameStyle === "rounded" ? "20px" : "0px",
            boxShadow: "0 0 12px rgba(0,0,0,0.25)",
          }}
        >
          <div ref={yocoQrRef}></div>

          <div
            style={{
              marginTop: "1rem",
              background: "#fff",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "2px solid #667eea",
            }}
          >
            <h4 style={{ color: "#667eea", margin: 0, fontSize: "1.1rem" }}>Scan to Pay</h4>
            <p style={{ margin: "0.25rem 0 0 0", color: "#333", fontSize: "0.9rem", fontWeight: "600" }}>
              {storeName}
            </p>
            <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.75rem" }}>
              Customer enters amount • Pays instantly
            </p>
          </div>
        </div>

        <button
          onClick={downloadYocoQR}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            padding: "0.7rem 1.4rem",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#fff",
            fontWeight: "600",
            marginTop: "1rem",
          }}
        >
          ⬇️ Download Payment QR
        </button>

        <p style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontStyle: "italic" }}>
          Print this QR and display at your store counter. Customers scan, enter amount, and pay directly to your Yoco account.
        </p>

        {/* Yoco Payment Link Input */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
            Yoco Payment Link (for QR code payments)
          </label>
          <input
            type="text"
            className="design-select"
            placeholder="https://pay.yoco.com/..."
            value={yocoPaymentLink}
            onChange={(e) => setYocoPaymentLink(e.target.value)}
            style={{
              width: "100%",
              padding: "0.7rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          />
          <small style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", display: "block", marginTop: "0.5rem" }}>
            Get this from your Yoco Business Portal → Payment Links. Must support open amounts.
          </small>
        </div>
      </div>
    </div>
  );
}
