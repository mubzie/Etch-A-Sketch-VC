import { RefreshCw } from "lucide-react";

export default function NftGalleryHeader({ title, onRefresh }) {
  return (
    <div className="nft-header">
      <span className="panel-label" style={{ marginBottom: 0 }}>
        {title}
      </span>
      <button type="button" className="refresh-btn" onClick={onRefresh}>
        <RefreshCw className="refresh-icon" strokeWidth={1.75} aria-hidden="true" />
        <span>refresh</span>
      </button>
    </div>
  );
}
