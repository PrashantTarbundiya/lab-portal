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
      // Suppress Leaflet zoom transition crash
    }
  };
  L.Map.prototype._safeGuardedZoom = true;
}

// Fix Leaflet's missing marker icon assets in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LiveSampleTrackingMap({
  bookingId = 'HC-841920',
  hospitalName = 'Labora Diagnostic Network',
  patientAddress = 'Benz Circle, Vijayawada',
  phlebotomistName = 'Ravi Teja',
  phlebotomistPhone = '+91 98480 22119',
  temperature = 4.2,
  etaMinutes = 14,
  height = '340px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Dynamic coordinates based on active booking location
    const addr = (patientAddress || '').toLowerCase();
    let patientLatLng = [16.5015, 80.6480]; // Benz Circle / MG Road default
    let centralLabLatLng = [16.5120, 80.6350];
    let phlebotomistLatLng = [16.5060, 80.6410];

    if (addr.includes('benz') || addr.includes('sai heights') || bookingId?.includes('928101')) {
      patientLatLng = [16.4985, 80.6520]; // Benz Circle
      centralLabLatLng = [16.5010, 80.6490]; // Apollo Hospital
      phlebotomistLatLng = [16.4995, 80.6505];
    } else if (addr.includes('governorpet') || addr.includes('manipal') || bookingId?.includes('551020')) {
      patientLatLng = [16.5135, 80.6290]; // Governorpet
      centralLabLatLng = [16.5150, 80.6270]; // Manipal Hospital
      phlebotomistLatLng = [16.5140, 80.6280];
    } else if (addr.includes('old hospital') || addr.includes('ggh') || bookingId?.includes('440192')) {
      patientLatLng = [16.5220, 80.6190]; // GGH Area
      centralLabLatLng = [16.5240, 80.6170]; // GGH Vijayawada
      phlebotomistLatLng = [16.5230, 80.6180];
    } else if (addr.includes('suryaraopet') || bookingId?.includes('689100')) {
      patientLatLng = [16.5080, 80.6320]; // Suryaraopet
      centralLabLatLng = [16.5100, 80.6300]; // Central Reference Lab
      phlebotomistLatLng = [16.5090, 80.6310];
    } else if (bookingId?.includes('719304') || addr.includes('labbipet')) {
      patientLatLng = [16.5040, 80.6420];
      centralLabLatLng = [16.5120, 80.6350];
      phlebotomistLatLng = [16.5080, 80.6380];
    }

    const map = L.map(mapContainerRef.current, {
      center: patientLatLng,
      zoom: 14,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // Standard open OpenStreetMap tiles (no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      className: 'osm-clinical-dark-tiles',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Vector Icon SVGs
    const homeSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
    const labSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`;
    const courierSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="12 8 8 12 12 16 16 12 12 8"/></svg>`;

    // Custom Icon Creators
    const createPillIcon = (svgHtml, label, colorBg, colorBorder) => {
      return L.divIcon({
        className: 'custom-leaflet-pill',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${colorBg};
            color: #ffffff;
            border: 2px solid ${colorBorder};
            padding: 4px 10px;
            border-radius: 9999px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.45);
            font-family: system-ui, sans-serif;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <span>${svgHtml}</span>
            <span>${label}</span>
          </div>
        `,
        iconSize: [120, 32],
        iconAnchor: [60, 16],
      });
    };

    // 1. Patient Home Marker
    const homeIcon = createPillIcon(homeSvg, 'Patient Collection', '#0F5E57', '#4edea3');
    L.marker(patientLatLng, { icon: homeIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; font-size: 12px; color: #0c1a24; padding: 4px;">
          <strong style="color: #0F5E57;">Collection Address</strong><br/>
          <span>${patientAddress}</span><br/>
          <span style="font-size: 10px; color: #64748b; font-family: monospace;">Order #${bookingId}</span>
        </div>
      `);

    // 2. Hospital / Central Reference Lab Marker
    const labIcon = createPillIcon(labSvg, 'Hospital / Lab', '#1e293b', '#38bdf8');
    L.marker(centralLabLatLng, { icon: labIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; font-size: 12px; color: #0c1a24; padding: 4px;">
          <strong style="color: #0284c7;">${hospitalName}</strong><br/>
          <span>NABL Accredited Testing Facility</span>
        </div>
      `);

    // 3. Phlebotomist Live Transit Marker
    const phlebIcon = createPillIcon(courierSvg, `${phlebotomistName} (${etaMinutes}m ETA)`, '#064e3b', '#10b981');
    L.marker(phlebotomistLatLng, { icon: phlebIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; font-size: 12px; color: #0c1a24; padding: 4px;">
          <strong style="color: #059669;">Phlebotomist In Transit</strong><br/>
          <span>${phlebotomistName}</span> • <span style="font-family: monospace;">${phlebotomistPhone}</span><br/>
          <div style="margin-top: 4px; padding: 3px 6px; background: #ecfdf5; border-radius: 6px; font-weight: bold; color: #065f46; font-size: 11px;">
            Cold Box Temp: ${temperature}°C (Safe Window 2°C–8°C)
          </div>
        </div>
      `)
      .openPopup();

    // 4. Route Polyline
    const routeCoords = [centralLabLatLng, phlebotomistLatLng, patientLatLng];
    const routeLine = L.polyline(routeCoords, {
      color: '#10b981',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85,
    }).addTo(map);

    try {
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    } catch {
      // safe fallback
    }

    return () => {
      try {
        map.stop();
        map.off();
        map.remove();
      } catch (err) {
        console.warn('Live tracking map cleanup warning:', err);
      }
      mapInstanceRef.current = null;
    };
  }, [bookingId, patientAddress, phlebotomistName, phlebotomistPhone, temperature, etaMinutes]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating HUD Telemetry Badge (Responsive Wrap for Mobile) */}
      <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-3 sm:left-3 z-[1000] glass-card px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-white/20 shadow-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 backdrop-blur-xl text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono font-black text-emerald-300">LIVE GPS</span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-1">
          <span className="text-slate-300">ETA:</span>
          <strong className="text-white font-mono font-bold">{etaMinutes} mins</strong>
        </div>
        <div className="hidden sm:block h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18l3 3m-3-3l-3 3m0 12l3 3m-3-3l-3-3m-6-6h18m-18 0l3 3m-3-3l3-3m12 0l3 3m-3-3l-3 3" />
          </svg>
          <span className="text-slate-300">Cold Chain:</span>
          <strong className="text-emerald-400 font-mono font-black">{temperature}°C</strong>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
            VALID
          </span>
        </div>
      </div>

      <style>{`
        .custom-leaflet-pill {
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

