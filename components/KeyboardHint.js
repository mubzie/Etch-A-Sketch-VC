const SHORTCUTS = [
  { keys: "D / E / I / F / R", label: "switch tool" },
  { keys: "Ctrl/⌘ Z", label: "undo" },
  { keys: "Ctrl/⌘ ⇧ Z", label: "redo" },
];

export default function KeyboardHint() {
  return (
    <div className="panel kb-hint">
      <p className="panel-label">Shortcuts</p>
      <ul className="kb-list">
        {SHORTCUTS.map((entry) => (
          <li key={entry.keys}>
            <kbd>{entry.keys}</kbd>
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
