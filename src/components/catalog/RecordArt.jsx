import React, { useEffect, useRef, useCallback } from "react";
import { SLEEVE_PALETTES } from "../../data/mockProducts";

/**
 * RecordArt – the vinyl peeks out from the sleeve corner.
 *
 * Uses a rAF loop so spin speed ramps up/down smoothly (acceleration curve)
 * instead of the abrupt CSS animation toggle.
 *
 *  props:
 *   palette  – index into SLEEVE_PALETTES
 *   spinning – true while the card is hovered  (drives ramp-up/down)
 *   size     – optional explicit size string ("200px", "100%", …)
 */
export function RecordArt({ palette, spinning, size, artworkUrl }) {
  const [top, bottom] = SLEEVE_PALETTES[palette % SLEEVE_PALETTES.length];
  const [imgError, setImgError] = React.useState(false);
  const showRealArt = artworkUrl && !imgError;

  const vinylRef   = useRef(null);   // DOM node for the vinyl disc
  const glowRef    = useRef(null);   // DOM node for the glow element
  const angleRef   = useRef(0);      // current rotation in degrees
  const speedRef   = useRef(0);      // current °/frame
  const rafRef     = useRef(null);   // rAF id
  const spinRef    = useRef(false);  // mirrors `spinning` inside rAF closure

  // target speed: ramps toward this value each frame
  const TARGET_SPEED = 1.5;         // °/frame  (~90 rpm at 60 fps — feels fast but not dizzy)
  const ACCEL        = 0.04;        // how quickly speed ramps up   (lower = more gentle)
  const DECEL        = 0.03;        // how quickly it winds down     (lower = longer coast)

  const tick = useCallback(() => {
    if (!vinylRef.current) return;

    if (spinRef.current) {
      // Accelerate toward target
      speedRef.current += (TARGET_SPEED - speedRef.current) * ACCEL;
    } else {
      // Decelerate toward 0
      speedRef.current *= (1 - DECEL);
    }

    const stillMoving = speedRef.current > 0.01;

    if (stillMoving) {
      angleRef.current = (angleRef.current + speedRef.current) % 360;
      // Slide-out offset: proportional to speed so it eases in/out with spin
      const slide = (speedRef.current / TARGET_SPEED) * 28; // 0% → 28%
      vinylRef.current.style.transform =
        `translateX(${slide}%) translateZ(0) rotate(${angleRef.current}deg)`;

      // Glow opacity follows speed too
      if (glowRef.current) {
        glowRef.current.style.opacity = (speedRef.current / TARGET_SPEED) * 0.85;
      }

      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Fully stopped – snap cleanly to 0 slide, keep last angle (looks natural)
      speedRef.current = 0;
      vinylRef.current.style.transform = `translateX(0%) translateZ(0) rotate(${angleRef.current}deg)`;
      if (glowRef.current) glowRef.current.style.opacity = 0;
      rafRef.current = null;
    }
  }, []);

  // Kick off / stop the loop when `spinning` changes
  useEffect(() => {
    spinRef.current = spinning;

    if (spinning && rafRef.current === null) {
      // Start the loop only if it's not already running
      rafRef.current = requestAnimationFrame(tick);
    }
    // If stopping, the tick() loop will self-terminate once speed reaches ~0

    return () => {};
  }, [spinning, tick]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="record-art" style={size ? { width: size, height: size } : undefined}>
      {/* Sleeve / album artwork — real art if available, gradient fallback */}
      {showRealArt ? (
        <img
          src={artworkUrl}
          alt=""
          aria-hidden="true"
          className="record-art__sleeve record-art__sleeve--img"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="record-art__sleeve"
          style={{ background: `linear-gradient(145deg, ${top} 0%, ${bottom} 55%, #0D0B12 100%)` }}
        />
      )}

      {/* Decorative sleeve lines — skip when real art is shown */}
      {!showRealArt && <div className="record-art__lines" />}

      {/* Catalog text on sleeve */}
      {!showRealArt && (
        <div className="record-art__sleeve-label">
          <span>GROOVE &amp; CO.</span>
        </div>
      )}

      {/* Glow – always mounted, opacity driven by rAF */}
      <div
        ref={glowRef}
        className="record-art__glow"
        style={{
          background: `radial-gradient(circle, ${top}88 0%, transparent 70%)`,
          opacity: 0,
          transition: "none",   // JS handles all transitions
        }}
      />

      {/* Vinyl disc – transform is 100% JS-driven */}
      <div
        ref={vinylRef}
        className="record-art__vinyl"
        style={{ transform: "translateX(0%) translateZ(0) rotate(0deg)" }}
      >
        <div className="record-art__grooves" />
        <div className="record-art__label" />
        <div className="record-art__label-text">G&amp;C</div>
        <div className="record-art__hole" />
      </div>
    </div>
  );
}
