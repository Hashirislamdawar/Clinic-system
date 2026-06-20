import { AlertCircle } from "lucide-react";

function Label({ label, required }) {
  if (!label) return null;
  return (
    <label>
      {label} {required && <span className="req">*</span>}
    </label>
  );
}

export function Input({ label, required, error, hint, className = "", ...props }) {
  return (
    <div className="field">
      <Label label={label} required={required} />
      <input className={`input ${error ? "invalid" : ""} ${className}`} {...props} />
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && (
        <div className="field-error">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}

export function Select({ label, required, error, children, className = "", ...props }) {
  return (
    <div className="field">
      <Label label={label} required={required} />
      <select className={`select ${error ? "invalid" : ""} ${className}`} {...props}>
        {children}
      </select>
      {error && (
        <div className="field-error">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}

export function Textarea({ label, required, hint, rows = 3, ...props }) {
  return (
    <div className="field">
      <Label label={label} required={required} />
      <textarea className="textarea" rows={rows} {...props} />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
