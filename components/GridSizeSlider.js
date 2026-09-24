export default function GridSizeSlider({ value, min, max, step, onChange }) {
  return (
    <div className="panel">
      <p className="panel-label">Grid size</p>
      <div className="grid-size-row">
        <input
          id="grid-size"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span id="grid-label">
          {value}×{value}
        </span>
      </div>
    </div>
  );
}
