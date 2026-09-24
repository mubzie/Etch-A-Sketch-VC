export default function CanvasFooterControls({
  showGrid,
  onToggleGrid,
  modeLabel,
}) {
  return (
    <div className="canvas-footer">
      <label className="grid-toggle">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(event) => onToggleGrid(event.target.checked)}
        />
        show grid
      </label>
      <span className="mode-indicator">● {modeLabel}</span>
    </div>
  );
}
