import React, { useEffect } from "react";
import { X } from "lucide-react";
import { RecordArt } from "../catalog/RecordArt";

export function ArtworkZoom({ palette, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="artwork-zoom-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Expanded artwork">
      <button className="artwork-zoom-close" onClick={onClose} aria-label="Close zoomed artwork">
        <X size={24} />
      </button>
      <div className="artwork-zoom-overlay__inner" onClick={(e) => e.stopPropagation()}>
        <RecordArt palette={palette} spinning={true} size="100%" />
      </div>
    </div>
  );
}
