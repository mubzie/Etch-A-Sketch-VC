export default function NftCard({ artwork, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`nft-card${selected ? " selected" : ""}`}
      onClick={() => onSelect(artwork)}
    >
      <img
        className="nft-preview"
        src={artwork.previewUrl}
        alt={artwork.name}
      />
      <div className="nft-meta">
        <div className="nft-name">{artwork.name}</div>
        <div className="nft-tag">
          {artwork.shape} · {artwork.size}px
        </div>
      </div>
    </button>
  );
}
