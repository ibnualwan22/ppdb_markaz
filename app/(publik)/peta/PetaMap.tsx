"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LokasiSakan } from "./page";

interface PetaMapProps {
  lokasi: LokasiSakan[];
  allLokasi: LokasiSakan[];
  posisiSaya: LokasiSakan | null;
  tujuan: LokasiSakan | null;
  gpsPosition: { lat: number; lng: number } | null;
  onSelectPosisi: (l: LokasiSakan) => void;
  onSelectTujuan: (l: LokasiSakan) => void;
}

const CAMPUS_CENTER: [number, number] = [-7.7535, 112.1837];

const createIcon = (color: string, size: number = 28, glow: boolean = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:${size}px; height:${size}px; 
      background:${color}; 
      border-radius:50%; 
      border:3px solid rgba(255,255,255,0.9); 
      box-shadow: 0 2px 8px rgba(0,0,0,0.4)${glow ? `, 0 0 20px ${color}` : ''}; 
      display:flex; align-items:center; justify-content:center;
      transition: transform 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const createGpsIcon = () => {
  return L.divIcon({
    className: "gps-marker",
    html: `<div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:40px; height:40px; background:rgba(59,130,246,0.15); border-radius:50%; animation:gpsPulse 2s ease-out infinite;"></div>
      <div style="position:absolute; width:24px; height:24px; background:rgba(59,130,246,0.25); border-radius:50%; animation:gpsPulse 2s ease-out infinite 0.5s;"></div>
      <div style="width:14px; height:14px; background:#3b82f6; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(59,130,246,0.6); position:relative; z-index:2;"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
};

const ICONS = {
  BANIN: createIcon("#3b82f6"),
  BANAT: createIcon("#ec4899"),
  UMUM: createIcon("#f59e0b"),
  POSISI: createIcon("#10b981", 34, true),
  TUJUAN: createIcon("#d4af37", 34, true),
};

export default function PetaMap({ lokasi, allLokasi, posisiSaya, tujuan, gpsPosition, onSelectPosisi, onSelectTujuan }: PetaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CAMPUS_CENTER,
      zoom: 18,
      maxZoom: 19,
      minZoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // Satellite view (ArcGIS max zoom = 19)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: '&copy; Esri',
      maxNativeZoom: 19,
      maxZoom: 19,
    }).addTo(map);

    // Labels overlay
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 19,
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update location markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    lokasi.forEach(l => {
      const isPosisi = posisiSaya?.id === l.id;
      const isTujuan = tujuan?.id === l.id;
      const icon = isPosisi ? ICONS.POSISI : isTujuan ? ICONS.TUJUAN : ICONS[l.kategori];

      const marker = L.marker([l.lat, l.lng], { icon }).addTo(markersRef.current!);

      const kategoriLabel = l.kategori === "BANIN" ? "Putra" : l.kategori === "BANAT" ? "Putri" : "Umum";
      const kategoriColor = l.kategori === "BANIN" ? "#3b82f6" : l.kategori === "BANAT" ? "#ec4899" : "#f59e0b";

      marker.bindPopup(`
        <div style="font-family:'Inter',sans-serif; min-width:180px;">
          <div style="font-weight:900; font-size:15px; color:#1a1a1a; margin-bottom:4px;">${l.nama}</div>
          <div style="display:inline-block; padding:2px 8px; border-radius:6px; background:${kategoriColor}20; color:${kategoriColor}; font-size:10px; font-weight:700; border:1px solid ${kategoriColor}40; margin-bottom:8px;">
            ${kategoriLabel}
          </div>
          ${l.deskripsi ? `<p style="font-size:12px; color:#666; margin:6px 0;">${l.deskripsi}</p>` : ''}
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button onclick="window.__petaSetPosisi(${l.id})" style="flex:1; padding:6px; border-radius:8px; border:1px solid #10b981; background:#10b98110; color:#10b981; font-size:10px; font-weight:700; cursor:pointer;">
              📍 Posisi Saya
            </button>
            <button onclick="window.__petaSetTujuan(${l.id})" style="flex:1; padding:6px; border-radius:8px; border:1px solid #d4af37; background:#d4af3710; color:#d4af37; font-size:10px; font-weight:700; cursor:pointer;">
              🏁 Tujuan
            </button>
          </div>
        </div>
      `, { className: "custom-popup" });
    });
  }, [lokasi, posisiSaya, tujuan]);

  // GPS marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (gpsMarkerRef.current) {
      mapRef.current.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }

    if (gpsPosition) {
      gpsMarkerRef.current = L.marker([gpsPosition.lat, gpsPosition.lng], { icon: createGpsIcon(), zIndexOffset: 1000 })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:'Inter',sans-serif; text-align:center;">
            <div style="font-weight:900; font-size:14px; color:#3b82f6; margin-bottom:4px;">📍 Lokasi Anda</div>
            <p style="font-size:11px; color:#666; margin:0;">${gpsPosition.lat.toFixed(6)}, ${gpsPosition.lng.toFixed(6)}</p>
          </div>
        `, { className: "custom-popup" });
    }
  }, [gpsPosition]);

  // Route with OSRM
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing route
    if (routeRef.current) {
      mapRef.current.removeLayer(routeRef.current);
      routeRef.current = null;
    }
    setRouteInfo(null);

    // Determine start point: GPS position if no posisiSaya selected, or posisiSaya coordinates
    let startLat: number | null = null;
    let startLng: number | null = null;

    if (posisiSaya) {
      startLat = posisiSaya.lat;
      startLng = posisiSaya.lng;
    } else if (gpsPosition) {
      startLat = gpsPosition.lat;
      startLng = gpsPosition.lng;
    }

    if (startLat && startLng && tujuan) {
      // Fetch route from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${tujuan.lng},${tujuan.lat}?overview=full&geometries=geojson&steps=true`;

      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          if (!mapRef.current || !data.routes || data.routes.length === 0) {
            // Fallback: straight line
            drawStraightLine(startLat!, startLng!, tujuan.lat, tujuan.lng);
            return;
          }

          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

          routeRef.current = L.polyline(coords, {
            color: "#d4af37",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapRef.current!);

          // Add animated dashes overlay
          const dashOverlay = L.polyline(coords, {
            color: "#ffffff",
            weight: 2,
            opacity: 0.4,
            dashArray: "8, 12",
            lineCap: "round",
          }).addTo(mapRef.current!);

          // Store dash overlay for cleanup
          (routeRef.current as any).__dashOverlay = dashOverlay;

          setRouteInfo({
            distance: Math.round(route.distance),
            duration: Math.round(route.duration / 60),
          });

          // Fit bounds but keep a reasonable zoom (don't zoom out too far on mobile)
          const bounds = L.latLngBounds(coords);
          mapRef.current!.fitBounds(bounds.pad(0.15), { maxZoom: 18, animate: true, duration: 0.5 });
        })
        .catch(() => {
          // Fallback: straight line
          drawStraightLine(startLat!, startLng!, tujuan.lat, tujuan.lng);
        });
    }

    function drawStraightLine(lat1: number, lng1: number, lat2: number, lng2: number) {
      if (!mapRef.current) return;
      routeRef.current = L.polyline(
        [[lat1, lng1], [lat2, lng2]],
        { color: "#d4af37", weight: 4, opacity: 0.8, dashArray: "10, 8", lineCap: "round" }
      ).addTo(mapRef.current);

      const bounds = L.latLngBounds([lat1, lng1], [lat2, lng2]);
      mapRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 18, animate: true, duration: 0.5 });
    }

    return () => {
      if (routeRef.current && mapRef.current) {
        // Cleanup dash overlay if exists
        const dash = (routeRef.current as any).__dashOverlay;
        if (dash) mapRef.current.removeLayer(dash);
      }
    };
  }, [posisiSaya, tujuan, gpsPosition]);

  // Expose route info globally for parent component
  useEffect(() => {
    (window as any).__petaRouteInfo = routeInfo;
    window.dispatchEvent(new CustomEvent("petaRouteUpdate", { detail: routeInfo }));
  }, [routeInfo]);

  // Global handlers for popup buttons
  useEffect(() => {
    (window as any).__petaSetPosisi = (id: number) => {
      const found = allLokasi.find(l => l.id === id);
      if (found) onSelectPosisi(found);
    };
    (window as any).__petaSetTujuan = (id: number) => {
      const found = allLokasi.find(l => l.id === id);
      if (found) onSelectTujuan(found);
    };
    return () => {
      delete (window as any).__petaSetPosisi;
      delete (window as any).__petaSetTujuan;
    };
  }, [allLokasi, onSelectPosisi, onSelectTujuan]);

  return (
    <div className="relative w-full h-[55vh] md:h-[70vh] lg:h-[calc(100vh-80px)] rounded-2xl overflow-hidden border border-gold-500/10 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Route info overlay */}
      {routeInfo && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-dark-900/95 backdrop-blur-md border border-gold-500/30 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jarak</div>
            <div className="text-lg font-black text-white">{routeInfo.distance >= 1000 ? `${(routeInfo.distance / 1000).toFixed(1)} km` : `${routeInfo.distance} m`}</div>
          </div>
          <div className="w-px h-8 bg-gray-700"></div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Waktu</div>
            <div className="text-lg font-black text-gold-400">~{routeInfo.duration} mnt</div>
          </div>
          <div className="w-px h-8 bg-gray-700"></div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mode</div>
            <div className="text-lg">🚶</div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: #1a1a1a;
          color: white;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-tip {
          background: #1a1a1a;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #999 !important;
          font-size: 18px !important;
          padding: 6px 8px !important;
        }
        .custom-marker:hover div {
          transform: scale(1.2) !important;
        }
        @keyframes gpsPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
