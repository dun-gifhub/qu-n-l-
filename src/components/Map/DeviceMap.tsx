import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Device, DeviceLocation } from '../../types/index.ts';
import { MapPin, Battery, Wifi, Navigation } from 'lucide-react';

interface DeviceMapProps {
  devices?: Device[];
  selectedDevice?: Device | null;
  historyLocations?: DeviceLocation[];
  height?: string;
  zoom?: number;
  center?: [number, number];
  interactive?: boolean;
}

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
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Determine items to display
  const itemsWithLocation = (selectedDevice ? [selectedDevice] : devices).filter(
    d => typeof d.latitude === 'number' && typeof d.longitude === 'number'
  );

  const hasHistory = historyLocations.length > 0;
  const hasLocations = itemsWithLocation.length > 0 || hasHistory;

  // Initialize Map
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // We keep map or clean up on unmount
    };
  }, []);

  // Update Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const bounds: [number, number][] = [];

    // Mode 1: Location History Polyline
    if (hasHistory) {
      // Sort oldest to newest for the line
      const sortedHistory = [...historyLocations].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const latlngs: [number, number][] = sortedHistory.map(loc => [loc.latitude, loc.longitude]);

      if (latlngs.length > 0) {
        // Draw route polyline
        const polyline = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        });
        layers.addLayer(polyline);

        // Add markers for points
        sortedHistory.forEach((loc, index) => {
          bounds.push([loc.latitude, loc.longitude]);
          const isLatest = index === sortedHistory.length - 1;
          const isStart = index === 0;

          const markerHtml = `
            <div style="
              width: ${isLatest ? '28px' : '18px'};
              height: ${isLatest ? '28px' : '18px'};
              background: ${isLatest ? '#22c55e' : isStart ? '#6366f1' : '#3b82f6'};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">
              ${isLatest ? '📍' : index + 1}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-history-marker',
            iconSize: [isLatest ? 28 : 18, isLatest ? 28 : 18],
            iconAnchor: [isLatest ? 14 : 9, isLatest ? 14 : 9],
          });

          const timeStr = new Date(loc.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
          });

          const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });
          marker.bindPopup(`
            <div class="text-xs">
              <div class="font-bold text-slate-100 flex items-center gap-1 mb-1">
                <span>Điểm #${index + 1}</span>
                ${isLatest ? '<span class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold">Mới nhất</span>' : ''}
              </div>
              <div class="text-slate-300">Tọa độ: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</div>
              ${loc.accuracy ? `<div class="text-slate-400">Độ chính xác: ±${loc.accuracy}m</div>` : ''}
              <div class="text-slate-400 mt-1 text-[11px]">🕒 ${timeStr}</div>
            </div>
          `);
          layers.addLayer(marker);
        });
      }
    }
    // Mode 2: Real-time Device Markers
    else if (itemsWithLocation.length > 0) {
      itemsWithLocation.forEach(d => {
        const lat = d.latitude!;
        const lng = d.longitude!;
        bounds.push([lat, lng]);

        const isOnline = d.status === 'ONLINE';
        const isIdle = d.status === 'IDLE';
        const statusColor = isOnline ? '#22c55e' : isIdle ? '#eab308' : '#94a3b8';
        const pulseClass = isOnline ? 'pulse-marker-online' : '';

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="${pulseClass}" style="
              width: 38px;
              height: 38px;
              background: ${statusColor};
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              <span style="font-size: 16px;">
                ${d.platform === 'iOS' ? '🍎' : d.platform === 'Android' ? '🤖' : '📱'}
              </span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-device-marker',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const lastSeenStr = d.lastSeen
          ? new Date(d.lastSeen).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : 'Chưa xác định';

        marker.bindPopup(`
          <div class="p-1 min-w-[200px]">
            <div class="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
              <h4 class="font-bold text-sm text-slate-100">${d.name}</h4>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : isIdle ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
              }">
                ${d.status || 'OFFLINE'}
              </span>
            </div>
            <div class="space-y-1 text-xs text-slate-300">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Pin:</span>
                <span class="font-medium text-slate-200">${d.batteryLevel ?? 100}% ${d.charging ? '⚡ (Đang sạc)' : ''}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Mạng:</span>
                <span class="font-medium text-slate-200">${d.networkType || 'WIFI'}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Tọa độ:</span>
                <span class="font-mono text-[11px] text-indigo-300">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Cập nhật:</span>
                <span>${lastSeenStr}</span>
              </div>
            </div>
          </div>
        `);

        layers.addLayer(marker);
      });
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], zoom);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 16 });
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
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800" style={{ height }}>
      {!hasLocations && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Chưa có dữ liệu vị trí.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Vị trí sẽ hiển thị ngay khi Mobile App hoặc Bộ mô phỏng gửi tọa độ GPS lên hệ thống.
          </p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
