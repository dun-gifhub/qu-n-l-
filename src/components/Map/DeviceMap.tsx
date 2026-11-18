import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Device, DeviceLocation } from '../../types/index.ts';
import { MapPin } from 'lucide-react';

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

const SMARTPHONE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
const PIN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

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

  const itemsWithLocation = (selectedDevice ? [selectedDevice] : devices).filter(
    (d) => typeof d.latitude === 'number' && typeof d.longitude === 'number'
  );

  const hasHistory = historyLocations.length > 0;
  const hasLocations = itemsWithLocation.length > 0 || hasHistory;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter: [number, number] = center || [10.7769, 106.7009];
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
    } catch (err) {
      console.warn('Leaflet map initialization warning (safely handled):', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch {
        // Safe disposal
      }
    };
  }, []);

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

    if (layerGroupRef.current) {
      layerGroupRef.current.addTo(map);
    }
  }, [mapType]);

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
        const polyline = L.polyline(latlngs, {
          color: '#0B4F9C',
          weight: 4,
          opacity: 0.9,
          lineJoin: 'round',
        });
        layers.addLayer(polyline);

        sortedHistory.forEach((loc, index) => {
          bounds.push([loc.latitude, loc.longitude]);
          const isLatest = index === sortedHistory.length - 1;
          const isStart = index === 0;

          const markerBg = isLatest ? '#A82834' : isStart ? '#1B6E47' : '#0B4F9C';
          const size = isLatest ? 28 : 20;

          const markerHtml = `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: ${markerBg};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 11px;
              font-weight: 600;
              font-family: var(--font-mono);
              font-variant-numeric: tabular-nums;
            ">
              ${isLatest ? PIN_SVG : index + 1}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'google-history-marker',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
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
            <div style="min-width: 200px; font-family: var(--font-sans); color: var(--text-primary); font-size: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid var(--border); font-weight: 600;">
                <span>Điểm #${index + 1}</span>
                ${
                  isLatest
                    ? '<span style="padding: 1px 6px; border-radius: 4px; background: var(--danger-soft); color: var(--danger); font-size: 11px; font-weight: 500;">Vị trí mới nhất</span>'
                    : ''
                }
              </div>
              <div style="color: var(--text-secondary);">Tọa độ: <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 500; color: var(--text-primary);">${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</span></div>
              ${loc.accuracy ? `<div style="color: var(--text-muted); font-size: 11px; font-family: var(--font-mono); margin-top: 2px;">Sai số: ±${Math.round(loc.accuracy)}m</div>` : ''}
              <div style="color: var(--text-muted); margin-top: 4px; font-size: 11px; font-family: var(--font-mono);">${timeStr}</div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border);">
                <a href="${googleMapsLink}" target="_blank" rel="noreferrer" style="color: var(--accent-ink); font-weight: 500; text-decoration: none; font-size: 11px;">
                  Mở trên Google Maps
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
        const isUsingDevice =
          isOnline &&
          (inClass ||
            Boolean(
              d.currentApp &&
                d.currentApp !== 'Màn hình chính' &&
                d.currentApp !== 'Khóa màn hình' &&
                d.currentApp !== 'Tắt màn hình'
            ));

        let pinColor = '#1B6E47';
        let statusBadgeText = 'Trực tuyến';
        let statusBg = 'rgba(27, 110, 71, 0.12)';
        let statusColor = '#1B6E47';

        if (isUninstalled) {
          pinColor = '#A82834';
          statusBadgeText = 'Đã gỡ ứng dụng';
          statusBg = 'rgba(168, 40, 52, 0.12)';
          statusColor = '#A82834';
        } else if (isNoNet) {
          pinColor = '#A82834';
          statusBadgeText = 'Mất kết nối mạng';
          statusBg = 'rgba(168, 40, 52, 0.12)';
          statusColor = '#A82834';
        } else if (isUsingDevice) {
          pinColor = '#9A5B0A';
          statusBadgeText = d.inClassAlert ? 'Dùng trong giờ' : 'Đang sử dụng';
          statusBg = 'rgba(154, 91, 10, 0.12)';
          statusColor = '#9A5B0A';
        }

        const pulseClass = isOnline ? 'telemetry-live-dot' : '';

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="${pulseClass}" style="
              width: 36px;
              height: 36px;
              background: ${pinColor};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 3px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
            ">
              ${SMARTPHONE_SVG}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'google-device-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
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
          <div style="min-width: 232px; font-family: var(--font-sans); color: var(--text-primary); font-size: 12px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 8px;">
              <div>
                <h4 style="font-weight: 600; font-size: 13px; color: var(--text-primary); margin: 0;">${d.studentName || d.name}</h4>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                  ${d.schoolName || 'Chưa cập nhật trường'} ${d.className ? `· Lớp ${d.className}` : ''}
                </div>
              </div>
              <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; background: ${statusBg}; color: ${statusColor}; white-space: nowrap;">
                ${statusBadgeText}
              </span>
            </div>

            ${
              inClass
                ? `<div style="background: rgba(168, 40, 52, 0.1); border-left: 2px solid #A82834; padding: 4px 8px; margin-bottom: 8px; border-radius: 4px; font-size: 11px; color: #A82834; font-weight: 500;">
                    Thiết bị đang hoạt động trong giờ học
                   </div>`
                : ''
            }

            ${
              isUninstalled
                ? `<div style="background: rgba(168, 40, 52, 0.1); border-left: 2px solid #A82834; padding: 4px 8px; margin-bottom: 8px; border-radius: 4px; font-size: 11px; color: #A82834; font-weight: 500;">
                    Thiết bị đã gỡ ứng dụng hoặc ngừng chia sẻ
                   </div>`
                : ''
            }

            <div style="display: grid; gap: 4px; font-size: 11px; color: var(--text-secondary);">
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span style="color: var(--text-muted);">Thiết bị</span>
                <span style="font-weight: 500; color: var(--text-primary);">${d.name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span style="color: var(--text-muted);">Pin</span>
                <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 500; color: var(--text-primary);">${d.batteryLevel ?? 100}% ${d.charging ? '(Đang sạc)' : ''}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span style="color: var(--text-muted);">Mạng</span>
                <span style="font-family: var(--font-mono); font-weight: 500; color: var(--text-primary);">${d.networkType || 'WIFI'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px;">
                <span style="color: var(--text-muted);">Tọa độ GPS</span>
                <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--accent-ink);">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px; padding-top: 4px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-muted);">
                <span>Cập nhật</span>
                <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums;">${lastSeenStr}</span>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); display: flex; gap: 8px;">
              <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #0B4F9C; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; text-decoration: none;">
                Google Maps
              </a>
              <a href="${googleDirectionsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #1B6E47; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; text-decoration: none;">
                Chỉ đường
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
      className="relative w-full rounded-[var(--radius-card)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)] bg-[var(--surface-muted)]"
      style={{ height }}
    >
      {/* Status Legend Overlay */}
      <div className="absolute top-3 left-3 z-[500] hidden sm:flex items-center gap-3 bg-[var(--surface)] px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] text-xs font-medium text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" />
          <span>Trực tuyến</span>
        </div>
        <span className="text-[var(--border-strong)]">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--warning)] inline-block" />
          <span>Đang sử dụng</span>
        </div>
        <span className="text-[var(--border-strong)]">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--danger)] inline-block" />
          <span>Mất mạng / Gỡ app</span>
        </div>
      </div>

      {/* Top Google Maps Layer Switcher */}
      <div className="absolute top-3 right-3 z-[500] flex items-center">
        <div className="bg-[var(--surface)] px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] text-xs font-medium flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Lớp bản đồ:</span>
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as GoogleMapType)}
            className="bg-transparent text-xs font-medium text-[var(--accent-ink)] focus:outline-none cursor-pointer"
          >
            <option value="hybrid">Vệ tinh có đường</option>
            <option value="roadmap">Bản đồ chuẩn</option>
            <option value="satellite">Ảnh vệ tinh</option>
            <option value="terrain">Địa hình</option>
          </select>
        </div>
      </div>

      {/* Quiet Monochrome Attribution */}
      <div className="absolute bottom-2 left-2 z-[400] bg-[var(--surface)] px-2.5 py-1 rounded-[6px] border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] pointer-events-none">
        Google Maps · Chế độ trực tiếp
      </div>

      {!hasLocations && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-[var(--surface-muted)] p-6 text-center">
          <div className="w-12 h-12 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Chưa có tọa độ GPS để hiển thị trên bản đồ
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm">
            Mở liên kết báo cáo trên điện thoại để truyền tọa độ GPS lên bản đồ vệ tinh
          </p>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
