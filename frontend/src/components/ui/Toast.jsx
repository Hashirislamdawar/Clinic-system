import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);
const ICONS = {
  ok: <CheckCircle2 size={18} color="#10b981" />,
  err: <AlertTriangle size={18} color="#ef4444" />,
  info: <Info size={18} color="#2563eb" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const push = useCallback((type, title, msg) => {
    const key = ++id.current;
    setToasts((t) => [...t, { key, type, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 4200);
  }, []);

  const toast = {
    success: (title, msg) => push("ok", title, msg),
    error: (title, msg) => push("err", title, msg),
    info: (title, msg) => push("info", title, msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="toast-stack">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.key}
                className={`toast ${t.type}`}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="t-icon">{ICONS[t.type]}</span>
                <div>
                  <div className="t-title">{t.title}</div>
                  {t.msg && <div className="t-msg">{t.msg}</div>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
