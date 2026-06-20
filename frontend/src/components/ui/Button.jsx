import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, icon: Icon, children, className = "", disabled, ...props },
  ref
) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    !children ? "btn-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {loading ? <Loader2 className="spin" /> : Icon ? <Icon /> : null}
      {children}
    </motion.button>
  );
});

export default Button;
