/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

interface KakaoMapProps {
  places: string[];      // 방문 순서대로 장소명 배열
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const JEJU_CENTER = { lat: 33.4996, lng: 126.5312 };

// SDK를 모듈 수준에서 한 번만 로드
let _sdkReady = false;
let _sdkLoading = false;
const _waiters: (() => void)[] = [];

function loadSDK(appKey: string, cb: () => void) {
  if (_sdkReady) { cb(); return; }
  _waiters.push(cb);
  if (_sdkLoading) return;
  _sdkLoading = true;
  const s = document.createElement("script");
  s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
  s.async = true;
  s.onload = () => {
    window.kakao.maps.load(() => {
      _sdkReady = true;
      _sdkLoading = false;
      _waiters.forEach((fn) => fn());
      _waiters.length = 0;
    });
  };
  document.head.appendChild(s);
}

export default function KakaoMap({ places, style, className }: KakaoMapProps) {
  const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const polyline = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // SDK 로드
  useEffect(() => {
    if (!APP_KEY) return;
    loadSDK(APP_KEY, () => setReady(true));
  }, [APP_KEY]);

  // 지도 초기화 + 경로 렌더링
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    if (!mapObj.current) {
      mapObj.current = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        level: 8,
      });
    }

    drawRoute(mapObj.current, places, overlays, polyline);
  }, [ready, places]);

  const baseStyle: React.CSSProperties = { width: "100%", height: "240px", ...style };

  if (!APP_KEY) {
    return (
      <div
        className={className}
        style={{ ...baseStyle, background: "#dce8e0", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ fontSize: 13, color: "#868e96", margin: 0 }}>
          .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해 주세요
        </p>
      </div>
    );
  }

  return <div ref={mapRef} className={className} style={baseStyle} />;
}

// ── 경로 그리기 ────────────────────────────────────────────────
function drawRoute(
  map: any,
  placeNames: string[],
  overlaysRef: React.MutableRefObject<any[]>,
  polylineRef: React.MutableRefObject<any>,
) {
  // 기존 오버레이/폴리라인 제거
  overlaysRef.current.forEach((o) => o.setMap(null));
  overlaysRef.current = [];
  if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }

  const names = placeNames.filter(Boolean);
  if (names.length === 0) return;

  const ps = new window.kakao.maps.services.Places();
  const coords: any[] = new Array(names.length).fill(null);
  let done = 0;
  // 세션 ID로 race condition 방지
  const session = Symbol();
  (drawRoute as any)._session = session;

  names.forEach((name, i) => {
    ps.keywordSearch(
      `제주 ${name}`,
      (result: any[], status: string) => {
        if ((drawRoute as any)._session !== session) return;
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          coords[i] = new window.kakao.maps.LatLng(
            parseFloat(result[0].y),
            parseFloat(result[0].x),
          );
        }
        done++;
        if (done === names.length) renderMarkers(map, coords, overlaysRef, polylineRef);
      },
      { size: 1 },
    );
  });
}

function renderMarkers(
  map: any,
  coords: any[],
  overlaysRef: React.MutableRefObject<any[]>,
  polylineRef: React.MutableRefObject<any>,
) {
  const valid = coords.filter(Boolean);
  if (valid.length === 0) return;

  const bounds = new window.kakao.maps.LatLngBounds();
  const path: any[] = [];

  coords.forEach((coord, i) => {
    if (!coord) return;
    path.push(coord);
    bounds.extend(coord);

    const el = document.createElement("div");
    el.style.cssText = `
      width:30px;height:30px;border-radius:50%;
      background:#2D6A4F;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.28);
      cursor:default;
    `;
    el.textContent = String(i + 1);

    const overlay = new window.kakao.maps.CustomOverlay({
      position: coord,
      content: el,
      yAnchor: 0.5,
    });
    overlay.setMap(map);
    overlaysRef.current.push(overlay);
  });

  if (path.length > 1) {
    const pl = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 4,
      strokeColor: "#52B788",
      strokeOpacity: 0.85,
      strokeStyle: "solid",
    });
    pl.setMap(map);
    polylineRef.current = pl;
  }

  map.setBounds(bounds);
}
