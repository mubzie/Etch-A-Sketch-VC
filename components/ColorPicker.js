export default function ColorPicker({ label, value, onChange }) {
  return (
    <div className="panel">
      <p className="panel-label">Color</p>
      <div className="color-row">
        <label htmlFor="color-pick">{label}</label>
        <input
          id="color-pick"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
