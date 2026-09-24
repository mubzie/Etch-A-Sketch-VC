import {
  Download,
  Redo2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";

function Btn({ Icon, variant, children, ...props }) {
  return (
    <button
      type="button"
      className={`action-btn${variant ? ` ${variant}` : ""}`}
      {...props}
    >
      <Icon className="btn-icon" strokeWidth={1.75} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export default function ActionButtons({
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClear,
  onImport,
  className = "",
  showClear = true,
}) {
  return (
    <div className={`panel actions-panel ${className}`.trim()}>
      <Btn Icon={Undo2} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/⌘+Z)">
        undo
      </Btn>
      <Btn Icon={Redo2} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/⌘+Shift+Z)">
        redo
      </Btn>
      {onImport ? (
        <Btn Icon={Upload} variant="import" onClick={onImport} title="Import a sample image onto the canvas">
          import image
        </Btn>
      ) : null}
      <Btn Icon={Download} variant="save" onClick={onSave} title="Download PNG">
        download png
      </Btn>
      {showClear ? (
        <Btn Icon={Trash2} variant="danger" onClick={onClear} title="Clear canvas">
          clear canvas
        </Btn>
      ) : null}
    </div>
  );
}
