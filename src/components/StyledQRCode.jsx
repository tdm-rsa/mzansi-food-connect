import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { supabase } from "../supabaseClient";

export default function StyledQRCode({ storeName }) {
  const ref = useRef(null);
  const whatsappQrRef = useRef(null);
  const [qr, setQr] = useState(null);
  const [whatsappQr, setWhatsappQr] = useState(null);
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

  // ✅ Load saved QR design from Supabase
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase.from("stores").select("*").limit(1).single();
      if (error) console.error("Error loading store:", error.message);

      if (data) {
        setColor(data.qr_color || "#ff6b35");
        setBgColor(data.qr_bg || "#ffffff");
        setFrameStyle(data.qr_frame || "rounded");
        setTagline(data.qr_tagline || "Scan to order online 🍴");
        setOwnerWebsite(data.qr_custom_url || "");
        setWhatsappGroupLink(data.whatsapp_group_link || "");
        setStoreId(data.id);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const storeUrl = ownerWebsite?.trim()
    ? ownerWebsite.trim()
    : `${window.location.origin}/store?shop=${encodeURIComponent(storeName)}`;

  // Initialize QR
  useEffect(() => {
    if (loading) return;
    const qrCode = new QRCodeStyling({
      width: 250,
      height: 250,
      data: storeUrl,
      margin: 10,
      dotsOptions: {
        color,
        type: frameStyle,
      },
      backgroundOptions: {
        color: bgColor,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
      },
    });

    setQr(qrCode);
    qrCode.append(ref.current);
  }, [loading]);

  // Update when settings change
  useEffect(() => {
    if (qr) {
      qr.update({
        data: storeUrl,
        dotsOptions: { color, type: frameStyle },
        backgroundOptions: { color: bgColor },
        image: logoFile ? URL.createObjectURL(logoFile) : null,
      });
    }
  }, [qr, color, bgColor, frameStyle, logoFile, storeUrl]);

  // Initialize WhatsApp Group QR
  useEffect(() => {
    if (!whatsappGroupLink || loading) {
      // Clear WhatsApp QR if no link
      if (whatsappQrRef.current) {
        whatsappQrRef.current.innerHTML = "";
      }
      setWhatsappQr(null);
      return;
    }

    // Create WhatsApp QR code
    const whatsappQrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      data: whatsappGroupLink,
      margin: 8,
      dotsOptions: {
        color: "#25D366", // WhatsApp green
        type: frameStyle,
      },
      backgroundOptions: {
        color: bgColor,
      },
    });

    setWhatsappQr(whatsappQrCode);
    if (whatsappQrRef.current) {
      whatsappQrRef.current.innerHTML = ""; // Clear previous
      whatsappQrCode.append(whatsappQrRef.current);
    }
  }, [whatsappGroupLink, loading, frameStyle, bgColor]);

  // Update WhatsApp QR when settings change
  useEffect(() => {
    if (whatsappQr && whatsappGroupLink) {
      whatsappQr.update({
        data: whatsappGroupLink,
        dotsOptions: { color: "#25D366", type: frameStyle },
        backgroundOptions: { color: bgColor },
      });
    }
  }, [whatsappQr, whatsappGroupLink, frameStyle, bgColor]);

  const downloadQR = () => {
    qr.download({
      name: `${storeName}-QR`,
      extension: "png",
    });
  };

  const saveDesign = async () => {
    if (!storeId) return;
    const { error } = await supabase
      .from("stores")
      .update({
        qr_color: color,
        qr_bg: bgColor,
        qr_frame: frameStyle,
        qr_tagline: tagline,
        qr_custom_url: ownerWebsite,
        whatsapp_group_link: whatsappGroupLink,
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
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "1.5rem",
        textAlign: "center",
        color: "#fff",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>📱 QR Code Designer</h3>

      {/* QR Preview Card */}
      <div
        style={{
          background: "#fff",
          padding: "1rem",
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
            border: `1px solid ${color}`,
          }}
        >
          <h4 style={{ color, margin: 0, fontSize: "1.1rem" }}>{storeName}</h4>
          <p style={{ margin: 0, color: "#333", fontSize: "0.85rem" }}>
            {ownerWebsite || storeUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>

      {/* Tagline */}
      {tagline && (
        <p
          style={{
            marginTop: "1rem",
            fontStyle: "italic",
            color,
            fontWeight: "500",
          }}
        >
          {tagline}
        </p>
      )}

      {/* Controls */}
      <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        {/* Accent Color */}
        <div>
          <label>Accent Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ marginLeft: "0.5rem", border: "none" }}
          />
        </div>

        {/* Background Color */}
        <div>
          <label>Background Color</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{ marginLeft: "0.5rem", border: "none" }}
          />
        </div>

        {/* Frame Style */}
        <div>
          <label>Frame Style</label>
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
          <label>Store Website (optional)</label>
          <input
            type="text"
            className="design-select"
            placeholder="https://yourstore.mzansifoodconnect.co.za"
            value={ownerWebsite}
            onChange={(e) => setOwnerWebsite(e.target.value)}
          />
        </div>

        {/* WhatsApp Group Link */}
        <div>
          <label>WhatsApp Group Link (optional)</label>
          <input
            type="text"
            className="design-select"
            placeholder="https://chat.whatsapp.com/..."
            value={whatsappGroupLink}
            onChange={(e) => setWhatsappGroupLink(e.target.value)}
          />
          <small style={{ color: "#999", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}>
            Create a WhatsApp group, then get the invite link to add here
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
            💾 Save Design
          </button>

          <button
            onClick={downloadQR}
            style={{
              background: color,
              border: "none",
              padding: "0.7rem 1.4rem",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            ⬇️ Download QR
          </button>
        </div>
      </div>

      <p style={{ marginTop: "1rem", opacity: 0.7, fontSize: "0.9rem" }}>
        Scans to: <br />
        <strong style={{ color }}>{storeUrl}</strong>
      </p>

      {/* WhatsApp Group QR Code */}
      {whatsappGroupLink && (
        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <h3 style={{ marginBottom: "1rem", color: "#25D366" }}>📱 WhatsApp Group QR</h3>
          <div
            style={{
              background: "#fff",
              padding: "1rem",
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
                padding: "0.5rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #25D366",
              }}
            >
              <h4 style={{ color: "#25D366", margin: 0, fontSize: "1rem" }}>Join our WhatsApp Group</h4>
              <p style={{ margin: 0, color: "#333", fontSize: "0.8rem" }}>
                Get updates & special offers
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (whatsappQr) {
                whatsappQr.download({
                  name: `${storeName}-WhatsApp-Group-QR`,
                  extension: "png",
                });
              }
            }}
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
        </div>
      )}
    </div>
  );
}
