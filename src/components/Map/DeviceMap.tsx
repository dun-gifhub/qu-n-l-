import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Device, DeviceLocation } from '../../types/index.ts';
import { MapPin, Battery, Wifi, Navigation, ExternalLink, Layers, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DeviceMapProps {
  devices?: Device[];
  selectedDevice?: Device | null;
  historyLocations?: DeviceLocation[];
  height?: string;
  zoom?: number;
  center?: [number, number];
  interactive?: boolean;
}

type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const GOOGLE_TILE_URLS: Record<GoogleMapType, string> = {
  roadmap: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  satellite: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  hybrid: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  terrain: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
};

export const DeviceMap: React.FC<DeviceMapProps> = ({
  devices = [],
  selectedDevice = null,
  historyLocations = [],
  height = '420px',
  zoom = 13,
  center,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapType, setMapType] = useState<GoogleMapType>('hybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Determine items to display
  const itemsWithLocation = (selectedDevice ? [selectedDevice] : devices).filter(
    (d) => typeof d.latitude === 'number' && typeof d.longitude === 'number'
  );

  const hasHistory = historyLocations.length > 0;
  const hasLocations = itemsWithLocation.length > 0 || hasHistory;

  // Initialize Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = center || [10.7769, 106.7009]; // Default Ho Chi Minh City
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
      });

      const tile = L.tileLayer(GOOGLE_TILE_URLS[mapType], {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>',
      }).addTo(map);

      tileLayerRef.current = tile;
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on component unmount
    };
  }, []);

  // Handle Layer Type Change (Google Roadmap, Satellite, Hybrid, Terrain)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(GOOGLE_TILE_URLS[mapType], {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>',
    }).addTo(map);

    tileLayerRef.current = newTile;

    // Ensure markers sit on top of new tiles
    if (layerGroupRef.current) {
      layerGroupRef.current.addTo(map);
    }
  }, [mapType]);

  // Update Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const bounds: [number, number][] = [];

    // Mode 1: Location History Polyline
    if (hasHistory) {
      const sortedHistory = [...historyLocations].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const latlngs: [number, number][] = sortedHistory.map((loc) => [loc.latitude, loc.longitude]);

      if (latlngs.length > 0) {
        // Draw route polyline with Google Maps blue style
        const polyline = L.polyline(latlngs, {
          color: '#1a73e8',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
        });
        layers.addLayer(polyline);

        sortedHistory.forEach((loc, index) => {
          bounds.push([loc.latitude, loc.longitude]);
          const isLatest = index === sortedHistory.length - 1;
          const isStart = index === 0;

          const markerHtml = `
            <div style="
              width: ${isLatest ? '30px' : '20px'};
              height: ${isLatest ? '30px' : '20px'};
              background: ${isLatest ? '#ea4335' : isStart ? '#34a853' : '#1a73e8'};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: bold;
              font-family: sans-serif;
            ">
              ${isLatest ? '📍' : index + 1}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'google-history-marker',
            iconSize: [isLatest ? 30 : 20, isLatest ? 30 : 20],
            iconAnchor: [isLatest ? 15 : 10, isLatest ? 15 : 10],
          });

          const timeStr = new Date(loc.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
          });

          const googleMapsLink = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;

          const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });
          marker.bindPopup(`
            <div class="text-xs p-1" style="min-width: 190px; font-family: sans-serif;">
              <div class="font-bold text-slate-900 flex items-center justify-between mb-1 border-b pb-1">
                <span>Điểm #${index + 1}</span>
                ${isLatest ? '<span class="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">Vị trí mới nhất</span>' : ''}
              </div>
              <div class="text-slate-700">Tọa độ: <b>${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</b></div>
              ${loc.accuracy ? `<div class="text-slate-500 text-[11px]">Sai số: ±${Math.round(loc.accuracy)}m</div>` : ''}
              <div class="text-slate-500 mt-1 text-[11px]">🕒 ${timeStr}</div>
              <div class="mt-2 pt-1.5 border-t">
                <a href="${googleMapsLink}" target="_blank" rel="noreferrer" style="color: #1a73e8; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; font-size: 11px;">
                  🗺️ Mở trên Google Maps ↗
                </a>
              </div>
            </div>
          `);
          layers.addLayer(marker);
        });
      }
    }
    // Mode 2: Real-time Device Markers
    else if (itemsWithLocation.length > 0) {
      itemsWithLocation.forEach((d) => {
        const lat = d.latitude!;
        const lng = d.longitude!;
        bounds.push([lat, lng]);

        const isUninstalled = Boolean(d.isUninstalled);
        const inClass = Boolean(d.inClassAlert);
        const isNoNet = Boolean(d.isNoNetwork || d.networkType === 'NONE' || d.status === 'OFFLINE');
        const isOnline = d.status === 'ONLINE' && !isNoNet && !isUninstalled;
        const isUsingDevice = isOnline && (
          inClass ||
          Boolean(d.currentApp && d.currentApp !== 'Màn hình chính' && d.currentApp !== 'Khóa màn hình' && d.currentApp !== 'Tắt màn hình')
        );

        // Required Color Coding:
        // 🟢 Đang trực tuyến / Kết nối bình thường
        // 🟡 Đang sử dụng thiết bị
        // 🔴 Mất kết nối / Đã gỡ ứng dụng
        let pinColor = '#16a34a'; // 🟢 Green
        let badgeEmoji = '🟢';
        let statusBadgeText = 'Trực tuyến';
        let statusBg = '#dcfce7';
        let statusColor = '#166534';

        if (isUninstalled) {
          pinColor = '#dc2626'; // 🔴 Red
          badgeEmoji = '🔴';
          statusBadgeText = 'ĐÃ GỠ ỨNG DỤNG';
          statusBg = '#fee2e2';
          statusColor = '#991b1b';
        } else if (isNoNet) {
          pinColor = '#dc2626'; // 🔴 Red
          badgeEmoji = '🔴';
          statusBadgeText = 'MẤT KẾT NỐI MẠNG';
          statusBg = '#fee2e2';
          statusColor = '#991b1b';
        } else if (isUsingDevice) {
          pinColor = '#eab308'; // 🟡 Yellow
          badgeEmoji = '🟡';
          statusBadgeText = d.inClassAlert ? 'DÙNG TRONG GIỜ' : 'ĐANG SỬ DỤNG';
          statusBg = '#fef9c3';
          statusColor = '#854d0e';
        }

        const pulseClass = isOnline ? 'pulse-marker-online' : '';

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="${pulseClass}" style="
              width: 40px;
              height: 40px;
              background: ${pinColor};
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 14px rgba(0,0,0,0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              <span style="font-size: 18px;">
                ${d.platform === 'iOS' ? '🍎' : d.platform === 'Android' ? '🤖' : '📱'}
              </span>
            </div>
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: #ffffff;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              font-size: 11px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            ">
              ${badgeEmoji}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'google-device-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        const lastSeenStr = d.lastSeen
          ? new Date(d.lastSeen).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Chưa xác định';

        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        marker.bindPopup(`
          <div class="p-1 min-w-[230px]" style="font-family: sans-serif;">
            <div class="flex items-center justify-between border-b pb-1.5 mb-2">
              <div>
                <h4 style="font-weight: 700; font-size: 13px; color: #1e293b; margin: 0;">${d.studentName || d.name}</h4>
                <div style="font-size: 10px; color: #64748b;">
                  ${d.schoolName || 'Chưa cập nhật trường'} ${d.className ? `· Lớp ${d.className}` : ''}
                </div>
              </div>
              <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                ${statusBadgeText}
              </span>
            </div>

            ${
              inClass
                ? `<div style="background: #ffe4e6; border-left: 3px solid #e11d48; padding: 4px 8px; margin-bottom: 6px; border-radius: 4px; font-size: 11px; color: #9f1239; font-weight: 600;">
                    🚨 Cảnh báo: Thiết bị đang hoạt động trong giờ học!
                   </div>`
                : ''
            }

            ${
              isUninstalled
                ? `<div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 4px 8px; margin-bottom: 6px; border-radius: 4px; font-size: 11px; color: #991b1b; font-weight: 600;">
                    ⚠️ Cảnh báo: Học sinh đã gỡ app hoặc tắt định vị!
                   </div>`
                : ''
            }

            <div style="space-y: 4px; font-size: 11px; color: #334155;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Thiết bị:</span>
                <b>${d.name}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Pin:</span>
                <b>${d.batteryLevel ?? 100}% ${d.charging ? '⚡ (Đang sạc)' : ''}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Mạng:</span>
                <b>${d.networkType || 'WIFI'}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Tọa độ GPS:</span>
                <span style="font-family: monospace; color: #1a73e8;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8;">
                <span>Cập nhật:</span>
                <span>${lastSeenStr}</span>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; gap: 6px;">
              <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #1a73e8; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;">
                🗺️ Google Maps
              </a>
              <a href="${googleDirectionsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #0f9d58; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;">
                🧭 Chỉ đường
              </a>
            </div>
          </div>
        `);
        layers.addLayer(marker);
      });
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], zoom);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 17 });
    }
  }, [devices, selectedDevice, historyLocations]);

  // Clean map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800"
      style={{ height }}
    >
      {/* Status Legend Overlay */}
      <div className="absolute top-3 left-3 z-[500] hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Trực tuyến</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Đang sử dụng</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Mất mạng / Gỡ app</span>
        </div>
      </div>

      {/* Top Google Maps Layer Switcher */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md text-xs font-semibold flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span className="text-red-500 font-extrabold">G</span>
            <span>Google Maps:</span>
          </span>
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as GoogleMapType)}
            className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
          >
            <option value="hybrid">Vệ tinh có đường (Hybrid)</option>
            <option value="roadmap">Bản đồ chuẩn (Roadmap)</option>
            <option value="satellite">Ảnh vệ tinh (Satellite)</option>
            <option value="terrain">Địa hình (Terrain)</option>
          </select>
        </div>
      </div>

      {/* Google Maps Attribution Watermark Badge (bottom left) */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs pointer-events-none">
        <span className="text-blue-500 font-black">G</span>
        <span className="text-red-500 font-black">o</span>
        <span className="text-amber-500 font-black">o</span>
        <span className="text-blue-500 font-black">g</span>
        <span className="text-emerald-500 font-black">l</span>
        <span className="text-red-500 font-black">e</span>
        <span className="text-slate-500 font-medium">Maps Live View</span>
      </div>

      {!hasLocations && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Chưa có tọa độ GPS để hiển thị trên Google Maps
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Mở link báo cáo trên điện thoại để truyền tọa độ GPS thời gian thực lên bản đồ vệ tinh Google Maps.
          </p>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
