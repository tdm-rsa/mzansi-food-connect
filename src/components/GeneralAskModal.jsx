// src/components/GeneralAskModal.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import PhoneInput from "./PhoneInput";
import "./GeneralAskModal.css";

export default function GeneralAskModal({ isOpen, onClose, storeId, storeName }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !question.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from("general_questions")
        .insert([
          {
            store_id: storeId,
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            question: question.trim(),
            status: "pending"
          }
        ]);

      if (error) throw error;

      // Send WhatsApp notification to vendor
      try {
        // Get vendor WhatsApp number
        const { data: storeData } = await supabase
          .from("tenants")
          .select("vendor_whatsapp_number")
          .eq("id", storeId)
          .single();

        if (storeData?.vendor_whatsapp_number) {
          const vendorMessage = `📩 *New Customer Question*\n\nFrom: *${name.trim()}*\nPhone: ${phone.trim()}\n\n❓ Question:\n${question.trim()}\n\n👉 Reply via WhatsApp or check your dashboard!`;

          await supabase.functions.invoke('send-whatsapp', {
            body: {
              phoneNumber: storeData.vendor_whatsapp_number,
              message: vendorMessage
            }
          });
        }
      } catch (whatsappError) {
        console.error('Failed to send vendor notification:', whatsappError);
        // Don't fail the whole operation if WhatsApp fails
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setPhone("");
        setQuestion("");
        onClose();
      }, 2000);
    } catch (err) {

      alert("Failed to send question. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="general-ask-overlay" onClick={onClose}>
      <div className="general-ask-modal" onClick={(e) => e.stopPropagation()}>
        <div className="general-ask-header">
          <h3>💬 Ask {storeName}</h3>
          <button onClick={onClose} className="general-ask-close">×</button>
        </div>

        {success ? (
          <div className="general-ask-success">
            <div className="success-icon">✅</div>
            <h4>Question Sent!</h4>
            <p>The vendor will respond soon</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="general-ask-form">
            <div className="form-group">
              <label htmlFor="ask-name">Your Name *</label>
              <input
                type="text"
                id="ask-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ask-phone">WhatsApp Number *</label>
              <PhoneInput
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={sending}
              />
              <small>We'll send the vendor's response via WhatsApp</small>
            </div>

            <div className="form-group">
              <label htmlFor="ask-question">Your Question *</label>
              <textarea
                id="ask-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about delivery, menu options, operating hours, etc..."
                rows="4"
                required
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              className="general-ask-submit"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Question"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
