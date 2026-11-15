"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  /** Short text shown on the pin, usually the price. */
  label: string;
  title: string;
  sub: string;
  href: string;
  image?: string;
};

const ADDIS_CENTER: [number, number] = [9.01, 38.77];

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Map of listings with price pins. `activeId` highlights one pin (used to sync
 * with the hovered card); `interactive={false}` gives a still preview.
 */
export function ListingsMap({
  points,
  activeId = null,
  onActive,
  interactive = true,
  className = "",
}: {
  points: MapPoint[];
  activeId?: string | null;
  onActive?: (id: string | null) => void;
  interactive?: boolean;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, Marker>());
  const onActiveRef = useRef(onActive);

  useEffect(() => {
    onActiveRef.current = onActive;
  }, [onActive]);

  useEffect(() => {
    let map: LeafletMap | undefined;
    let cancelled = false;
    const store = markers.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;

      map = L.map(el.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
        attributionControl: true,
      });

      // Standard OpenStreetMap tiles: free and keyless, meant for light traffic.
      // Switch to a paid tile provider before a high-traffic launch.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      for (const p of points) {
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "price-pin-wrap",
            html: `<span class="price-pin">${esc(p.label)}</span>`,
            iconSize: [0, 0],
          }),
          keyboard: interactive,
          title: p.title,
        }).addTo(map);

        if (interactive) {
          marker.bindPopup(
            `<a class="map-popup" href="${esc(p.href)}">${
              p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" />` : ""
            }<span class="map-popup-body"><strong>${esc(p.sub)}</strong><span>${esc(p.title)}</span></span></a>`,
            { closeButton: false, offset: [0, -30], minWidth: 220, maxWidth: 220 },
          );
          marker.on("mouseover", () => onActiveRef.current?.(p.id));
          marker.on("mouseout", () => onActiveRef.current?.(null));
        }
        store.set(p.id, marker);
      }

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
          padding: [48, 48],
          maxZoom: 15,
        });
      } else if (points.length === 1) {
        map.setView([points[0]!.lat, points[0]!.lng], 15);
      } else {
        map.setView(ADDIS_CENTER, 12);
      }
    })();

    return () => {
      cancelled = true;
      store.clear();
      map?.remove();
    };
  }, [points, interactive]);

  useEffect(() => {
    markers.current.forEach((marker, id) => {
      const active = id === activeId;
      marker.getElement()?.classList.toggle("is-active", active);
      marker.setZIndexOffset(active ? 1000 : 0);
    });
  }, [activeId]);

  return <div ref={el} className={`listings-map ${className}`} />;
}
