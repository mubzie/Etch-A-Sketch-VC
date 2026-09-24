import { Trash2 } from "lucide-react";

export default function ClearConfirm({ onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-card">
        <p className="confirm-title">Clear the canvas?</p>
        <p className="confirm-sub">This erases your current drawing. You can undo it afterwards.</p>
        <div className="confirm-actions">
          <button type="button" className="action-btn danger" onClick={onConfirm}>
            <Trash2 className="btn-icon" strokeWidth={1.75} aria-hidden="true" />
            <span>clear</span>
          </button>
          <button type="button" className="action-btn" onClick={onCancel}>
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}
