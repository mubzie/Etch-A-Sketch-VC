export default function ToolSelector({ label, options, value, onChange }) {
  return (
    <div className="panel">
      <p className="panel-label">{label}</p>
      <div className="tools-grid">
        {options.map((option) => {
          const Icon = option.Icon;
          return (
            <button
              key={option.value}
              type="button"
              className={`tool-btn${value === option.value ? " active" : ""}`}
              title={option.title}
              onClick={() => onChange(option.value)}
            >
              {Icon ? (
                <Icon className="tool-icon" strokeWidth={1.75} />
              ) : (
                <span className="tool-icon">{option.icon}</span>
              )}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
