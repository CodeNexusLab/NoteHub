import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import "./Toast.css";

const TOAST_META = {
  success: { icon: CheckCircle2, label: "Success" },
  error: { icon: AlertCircle, label: "Error" },
  info: { icon: Info, label: "Information" },
  warning: { icon: AlertTriangle, label: "Attention" },
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, toast.duration || 3800);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const meta = TOAST_META[toast.type] || TOAST_META.info;
  const Icon = meta.icon;

  return (
    <div className={`nh-toast nh-toast-${toast.type || "info"}`} role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"}>
      <span className="nh-toast-icon" aria-hidden="true"><Icon size={21} strokeWidth={2.2} /></span>
      <span className="nh-toast-copy">
        <strong>{toast.title || meta.label}</strong>
        <span>{toast.message}</span>
      </span>
      <button className="nh-toast-close" type="button" onClick={onClose} aria-label="Dismiss notification">
        <X size={17} />
      </button>
      <span className="nh-toast-progress" aria-hidden="true" />
    </div>
  );
}
