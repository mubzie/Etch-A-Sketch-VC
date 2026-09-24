"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import NftGallery from "../features/gallery/NftGallery";

export default function GalleryModal({ onClose, onSelectArtwork }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <div
        className="gallery-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="NFT gallery"
      >
        <div className="gallery-modal-head">
          <span className="panel-label" style={{ marginBottom: 0 }}>
            Pixel NFT gallery
          </span>
          <button
            type="button"
            className="gallery-close"
            onClick={onClose}
            aria-label="Close gallery"
          >
            <X strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <NftGallery onSelectArtwork={onSelectArtwork} />
      </div>
    </div>
  );
}
