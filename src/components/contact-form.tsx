"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactForm({ isUg = false }: { isUg?: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus("error");
      setErrorMessage(
        isUg
          ? "Илтимас, барлиқ мәжбурий орунларни тошуруң."
          : "ئىلتىماس، بارلىق مەجبۇرىي ئورۇنلارنى تولدۇرۇڭ."
      );
      return;
    }

    setStatus("submitting");

    // Simulate sending / submit to contact handler
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrorMessage(
        isUg ? "Учур әвәтиштә хаталиق көрүلди." : "ئۇچۇر ئەۋەتىشتە خاتالىق كۆرۈلدى."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      {status === "success" && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "16px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={20} />
          <span>
            {isUg
              ? "Учуриңиз мувәппәқийәтлик йолланди! Сиз билән тез арада алақилишимиз."
              : "ئۇچۇرىڭىز مۇۋەپپەقىيەتلىك يوللاندى! تەكلىپ ياكى سوئالىڭىزغا پات ئارىدا جاۋاب قايتۇرىمىز."}
          </span>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">
          {isUg ? "Исим-фамилийә *" : "ئىسىم-فامىلە *"}
        </label>
        <input
          id="name"
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={isUg ? "Исмиңизни йезиң..." : "ئىسمىڭىزنى يېزىڭ..."}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">
          {isUg ? "Елхәт ئادرېسى *" : "ئېلخەت ئادرېسى *"}
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          className="form-input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="example@domain.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">
          {isUg ? "Тема" : "تېما"}
        </label>
        <input
          id="subject"
          type="text"
          className="form-input"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder={isUg ? "Мақалә тәклипи, пикир йаки соал..." : "ماقالە تەكلىپى، پىكىر ياكى سوئال..."}
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">
          {isUg ? "Учуриңиз *" : "ئۇچۇرىڭىز *"}
        </label>
        <textarea
          id="message"
          rows={5}
          className="form-textarea"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder={isUg ? "Учуриңизни бу йәргә йезиң..." : "ئۇچۇرىڭىزنى بۇ يەرگە تولدۇرۇڭ..."}
          required
        />
      </div>

      <button
        type="submit"
        className="btn-submit"
        disabled={status === "submitting"}
      >
        <Send size={16} />
        <span>
          {status === "submitting"
            ? isUg
              ? "Йоллиниватиду..."
              : "يوللىنىۋاتىدۇ..."
            : isUg
            ? "Йоллаш"
            : "يوللاش"}
        </span>
      </button>
    </form>
  );
}

