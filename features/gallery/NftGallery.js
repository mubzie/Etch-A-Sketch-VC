"use client";

import { useEffect, useState } from "react";
import { generateNftCollection } from "../../lib/nft/generate";
import { renderPixelsToDataUrl } from "../../lib/nft/render";
import NftCard from "./NftCard";
import NftGalleryHeader from "./NftGalleryHeader";

function buildGalleryArtworks() {
  return generateNftCollection(4, 16).map((artwork) => ({
    ...artwork,
    previewUrl: renderPixelsToDataUrl(artwork.pixels, artwork.size),
  }));
}

export default function NftGallery({ onSelectArtwork }) {
  const [artworks, setArtworks] = useState([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);

  useEffect(() => {
    setArtworks(buildGalleryArtworks());
  }, []);

  const handleRefresh = () => {
    setSelectedArtworkId(null);
    setArtworks(buildGalleryArtworks());
  };

  const handleSelectArtwork = (artwork) => {
    setSelectedArtworkId(artwork.id);
    onSelectArtwork(artwork);
  };

  return (
    <section className="nft-section">
      <NftGalleryHeader title="Pixel NFT gallery" onRefresh={handleRefresh} />
      <div className="nft-grid">
        {artworks.map((artwork) => (
          <NftCard
            key={artwork.id}
            artwork={artwork}
            selected={selectedArtworkId === artwork.id}
            onSelect={handleSelectArtwork}
          />
        ))}
      </div>
    </section>
  );
}
