import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Global Defensive Leaflet Polyfill to prevent "Cannot read properties of undefined (reading '_leaflet_pos')"
if (typeof window !== 'undefined' && L && L.DomUtil && !L.DomUtil._safeGuarded) {
  const origGetPos = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el) {
    if (!el) return new L.Point(0, 0);
    try {
      return origGetPos.call(this, el) || new L.Point(0, 0);
    } catch {
      return new L.Point(0, 0);
    }
  };
  L.DomUtil._safeGuarded = true;
}

if (typeof window !== 'undefined' && L && L.Map && !L.Map.prototype._safeGuardedZoom) {
  const origZoomEnd = L.Map.prototype._onZoomTransitionEnd;
  L.Map.prototype._onZoomTransitionEnd = function () {
    if (!this._mapPane || !this._container) return;
    try {
      origZoomEnd.apply(this, arguments);
    } catch (e) {
      // Suppress Leaflet zoom transition end crash when unmounting
    }
  };
  L.Map.prototype._safeGuardedZoom = true;
}

const FACILITY_COORDS_FALLBACK = {
  'HOSP-01': [16.5085, 80.6430], // Company A Main Super-Specialty Hospital (MG Road)
  'HOSP-02': [16.4998, 80.6548], // Apollo Specialty Hospital (Benz Circle)
  'HOSP-03': [16.5142, 80.6315], // Manipal Super-Specialty Hospital (Governorpet)
  'HOSP-04': [16.5205, 80.6220], // Government General Hospital (GGH) (Old Hospital Road)
  'LAB-01': [16.5110, 80.6390],  // Company A Central Reference Diagnostics (Suryaraopet)
  'LAB-02': [16.5180, 80.6450],  // Labora Coastal Diagnostic Center (Eluru Road)
};

export default function HospitalNetworkMap({
  facilities = [],
  userLocation = null,
  selectedFacility = null,
  onSelectFacility = null,
  height = '380px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Leaflet cleanup exception suppressed:', err);
      }
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Default center: Vijayawada MG Road healthcare enclave
    const defaultCenter = userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : [16.5062, 80.6480];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      scrollWheelZoom: false, // Prevents ScrollWheelZoom crashes when scrolling past map
      doubleClickZoom: true,
      touchZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors | Labora Healthcare Network',
      className: 'osm-clinical-dark-tiles',
    }).addTo(map);

    // Invalidate size on container layout changes to prevent map disappearance
    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {
        // safe
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // safe
      }
    }, 120);

    const markerGroup = L.featureGroup();

    // 1. Add User Current Location Pin (if detected)
    if (userLocation?.lat && userLocation?.lng) {
      const userIcon = L.divIcon({
        className: 'user-live-gps-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(16, 185, 129, 0.3); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background: #10B981; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; padding: 4px; text-align: center; color: #0f172a;">
            <strong style="color: #059669; display: block; font-size: 13px;">You Are Here</strong>
            <span style="color: #64748B; font-size: 10px;">Live GPS Geolocation Coordinates</span>
          </div>
        `)
        .addTo(map);

      markerGroup.addLayer(userMarker);
    }

    // 2. Add Hospital and Lab Markers
    markersRef.current = {};
    facilities.forEach((facility) => {
      let coords = facility.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) {
        coords =
          FACILITY_COORDS_FALLBACK[facility.id] ||
          (facility.name?.toLowerCase().includes('apollo')
            ? [16.4998, 80.6548]
            : facility.name?.toLowerCase().includes('manipal')
            ? [16.5142, 80.6315]
            : facility.name?.toLowerCase().includes('general')
            ? [16.5205, 80.6220]
            : facility.category === 'LABORATORY'
            ? [16.511, 80.639]
            : [16.5085, 80.643]);
      }
      if (!Array.isArray(coords) || coords.length < 2) return;

      const isHospital = facility.category === 'HOSPITAL';
      const bgColor = isHospital ? '#059669' : '#7c3aed';
      const borderColor = isHospital ? '#34d399' : '#a78bfa';
      const iconSvg = isHospital
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12m-6-6h12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`;

      const displayName = facility.shortName || (facility.name ? facility.name.split(' ')[0] : 'Facility');

      const customIcon = L.divIcon({
        className: 'facility-custom-marker !bg-transparent !border-0',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${bgColor};
            color: #ffffff;
            padding: 4px 10px 4px 6px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5);
            border: 2px solid ${borderColor};
            cursor: pointer;
            white-space: nowrap;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 700;
            pointer-events: auto;
            transform: translate(-50%, -50%);
          " title="${facility.name}">
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: rgba(255,255,255,0.22);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              ${iconSvg}
            </div>
            <span>${displayName}</span>
          </div>
        `,
        iconSize: [140, 36],
        iconAnchor: [70, 18],
      });

      const distBadge = facility.distanceKm
        ? `<span style="background: rgba(16, 185, 129, 0.15); color: #6ee7b7; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 9999px; border: 1px solid rgba(110, 231, 183, 0.3); font-family: monospace;">${facility.distanceKm} km away</span>`
        : '';

      const ratingBadge = facility.rating
        ? `<span style="background: rgba(245, 158, 11, 0.15); color: #fcd34d; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 9999px; border: 1px solid rgba(252, 211, 77, 0.3); font-family: monospace;">Score ${facility.rating}</span>`
        : '';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: ${bgColor};">
              ${isHospital ? 'Super-Specialty Hospital' : 'NABL Diagnostic Laboratory'}
            </span>
            ${ratingBadge}
          </div>
          <strong style="display: block; font-size: 13px; color: #0F172A; line-height: 1.2; margin-bottom: 4px;">
            ${facility.name}
          </strong>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.3;">
            ${facility.address}
          </p>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            ${distBadge}
            ${facility.emergency24x7 ? '<span style="background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 9px; padding: 2px 5px; border-radius: 9999px;">24x7</span>' : ''}
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-book-opd-${facility.id}" style="flex: 1; background: #0F5E57; color: white; border: none; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
              Book OPD
            </button>
            <button id="btn-book-lab-${facility.id}" style="flex: 1; background: #1E293B; color: white; border: none; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
              Book Lab
            </button>
          </div>
        </div>
      `;

      const marker = L.marker(coords, { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(map);

      // Attach button clicks inside popup
      marker.on('popupopen', () => {
        const opdBtn = document.getElementById(`btn-book-opd-${facility.id}`);
        const labBtn = document.getElementById(`btn-book-lab-${facility.id}`);
        if (opdBtn && onSelectFacility) {
          opdBtn.onclick = () => onSelectFacility(facility, 'DOCTOR_OPD_CONSULTATION');
        }
        if (labBtn && onSelectFacility) {
          labBtn.onclick = () => onSelectFacility(facility, 'DIAGNOSTIC_TEST');
        }
      });

      markersRef.current[facility.id] = marker;
      markerGroup.addLayer(marker);
    });

    // Auto-fit bounds to display all facilities
    if (markerGroup.getLayers().length > 0) {
      try {
        map.fitBounds(markerGroup.getBounds(), { padding: [40, 40], maxZoom: 15 });
      } catch (e) {
        // suppress
      }
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (err) {
          // suppress
        }
        mapInstanceRef.current = null;
      }
    };
  }, [facilities, userLocation]);

  // Pan to facility when selected
  useEffect(() => {
    if (selectedFacility && markersRef.current[selectedFacility.id] && mapInstanceRef.current) {
      try {
        const marker = markersRef.current[selectedFacility.id];
        mapInstanceRef.current.flyTo(marker.getLatLng(), 15, { duration: 1 });
        marker.openPopup();
      } catch (err) {
        // suppress
      }
    }
  }, [selectedFacility]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg">
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-10" />

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0c1a24]/90 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/15 shadow-xl text-[11px] font-bold text-slate-200 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm"></span>
          <span>Hospitals</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-sm"></span>
          <span>Laboratories</span>
        </span>
        {userLocation && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            <span className="text-emerald-300">You</span>
          </span>
        )}
      </div>

      {/* Recenter Map Button */}
      <button
        type="button"
        onClick={() => {
          if (mapInstanceRef.current) {
            try {
              const target = userLocation ? [userLocation.lat, userLocation.lng] : [16.5062, 80.6480];
              mapInstanceRef.current.flyTo(target, 14);
            } catch (e) {
              // suppress
            }
          }
        }}
        className="absolute top-3 right-3 z-[1000] bg-[#0c1a24]/90 hover:bg-[#132330] text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition active:scale-95"
        title="Recenter to my location"
      >
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span>Recenter</span>
      </button>

      {/* Override default Leaflet divIcon box style and apply clinical dark map theme */}
      <style>{`
        .facility-custom-marker, .user-live-gps-marker {
          background: transparent !important;
          border: none !important;
        }
        .osm-clinical-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
    </div>
  );
}

