import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, LocateFixed, MapPinned, Waves } from "lucide-react";

import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";

import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredSidebarState,
  setStoredSidebarState,
} from "../../i18n/language";

import StudentTaskbar from "../../components/student/StudentTaskbar";
import StudentHeader from "../../components/student/StudentHeader";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";

const VIETNAM_GEOJSON_URL =
  "https://data.opendevelopmentmekong.net/dataset/999c96d8-fae0-4b82-9a2b-e481f6f50e12/resource/234169fb-ae73-4f23-bbd4-ff20a4fca401/download/diaphantinh.geojson";

const VIETNAM_MAP_TEXT = {
  vi: {
    eyebrow: "Bản đồ Việt Nam",
    title: "Bản đồ Việt Nam",
    sub: "Bản đồ Việt Nam với ranh giới tỉnh/thành, các điểm nổi bật, Hoàng Sa và Trường Sa.",
    introKicker: "Vietnam Digital Map",
    introTitle: "Khởi tạo bản đồ Việt Nam",
    introBody:
      "Bấm để mở bản đồ Việt Nam. Hệ thống sẽ render ranh giới hành chính Việt Nam và gắn nhãn Hoàng Sa, Trường Sa.",
    openMap: "Mở bản đồ",
    sovereignty: "Trường Sa, Hoàng Sa là của Việt Nam",
    rendering: "Đang render bản đồ...",
    loadFailed:
      "Không tải được GeoJSON Việt Nam. Bản đồ nền vẫn hoạt động, nhưng chưa có ranh giới tỉnh/thành.",
    provinceFallback: "Tỉnh / thành phố",
    adminMapPopup: "Bản đồ hành chính Việt Nam",
    north: "Miền Bắc",
    central: "Miền Trung",
    south: "Miền Nam",
    islands: "Biển đảo Việt Nam",
    hoangSa: "Hoàng Sa",
    truongSa: "Trường Sa",
    note:
      "Bản đồ dùng dữ liệu ranh giới hành chính Việt Nam dạng GeoJSON. Nhãn Hoàng Sa và Trường Sa được hiển thị riêng trên giao diện.",
    location: "Vị trí",
    sea: "Biển Đông",
    compass: "Hướng Bắc",
    cities: {
      hanoi: ["Hà Nội", "Thủ đô Việt Nam, khu vực có HUST."],
      haiPhong: ["Hải Phòng", "Thành phố cảng lớn ở miền Bắc."],
      hue: ["Huế", "Cố đô, trung tâm văn hóa miền Trung."],
      daNang: ["Đà Nẵng", "Thành phố biển trung tâm miền Trung."],
      nhaTrang: ["Nha Trang", "Thành phố biển thuộc Khánh Hòa."],
      daLat: ["Đà Lạt", "Thành phố cao nguyên thuộc Lâm Đồng."],
      hcmc: ["TP. Hồ Chí Minh", "Trung tâm kinh tế lớn ở miền Nam."],
      canTho: ["Cần Thơ", "Trung tâm vùng Đồng bằng sông Cửu Long."],
      caMau: ["Cà Mau", "Khu vực cực Nam của Việt Nam."],
      phuQuoc: ["Phú Quốc", "Đảo lớn ở phía Tây Nam Việt Nam."],
      conDao: ["Côn Đảo", "Quần đảo ngoài khơi Đông Nam Bộ."],
    },
    islandDescriptions: {
      hoangSa: "Hoàng Sa là của Việt Nam.",
      truongSa: "Trường Sa là của Việt Nam.",
    },
  },
  ja: {
    eyebrow: "ベトナム地図",
    title: "ベトナム地図",
    sub: "ベトナムの省・市の境界、主要地点、ホアンサ諸島とチュオンサ諸島を表示します。",
    introKicker: "Vietnam Digital Map",
    introTitle: "ベトナム地図を初期化",
    introBody:
      "ボタンを押すとベトナム地図を開きます。行政境界を描画し、ホアンサ諸島とチュオンサ諸島のラベルを表示します。",
    openMap: "地図を開く",
    sovereignty: "チュオンサ諸島、ホアンサ諸島はベトナムのものです",
    rendering: "地図を描画中...",
    loadFailed:
      "ベトナムのGeoJSONを読み込めませんでした。背景地図は利用できますが、省・市の境界はまだ表示されません。",
    provinceFallback: "省 / 市",
    adminMapPopup: "ベトナム行政地図",
    north: "北部",
    central: "中部",
    south: "南部",
    islands: "ベトナムの島々",
    hoangSa: "ホアンサ",
    truongSa: "チュオンサ",
    note:
      "行政境界はGeoJSONデータを使用しています。ホアンサ諸島とチュオンサ諸島のラベルは地図上に個別表示されます。",
    location: "位置",
    sea: "南シナ海",
    compass: "北",
    cities: {
      hanoi: ["ハノイ", "ベトナムの首都で、HUSTがある地域です。"],
      haiPhong: ["ハイフォン", "北部の主要な港湾都市です。"],
      hue: ["フエ", "中部の歴史と文化の中心地です。"],
      daNang: ["ダナン", "中部を代表する沿岸都市です。"],
      nhaTrang: ["ニャチャン", "カインホア省の海沿いの都市です。"],
      daLat: ["ダラット", "ラムドン省の高原都市です。"],
      hcmc: ["ホーチミン市", "南部最大の経済中心地です。"],
      canTho: ["カントー", "メコンデルタ地域の中心都市です。"],
      caMau: ["カマウ", "ベトナム最南端の地域です。"],
      phuQuoc: ["フーコック", "ベトナム南西部の大きな島です。"],
      conDao: ["コンダオ", "南東部沖にある諸島です。"],
    },
    islandDescriptions: {
      hoangSa: "ホアンサ諸島はベトナムのものです。",
      truongSa: "チュオンサ諸島はベトナムのものです。",
    },
  },
};

type VietnamMapText = typeof VIETNAM_MAP_TEXT.vi;

const vietnamBounds: L.LatLngBoundsExpression = [
  [6.3, 99.2],
  [23.9, 118.8],
];

const cityIcon = L.divIcon({
  className: "vn-map-div-icon",
  html: `<span class="vn-marker-dot city"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const capitalIcon = L.divIcon({
  className: "vn-map-div-icon",
  html: `<span class="vn-marker-dot capital"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const islandIcon = L.divIcon({
  className: "vn-map-div-icon",
  html: `<span class="vn-marker-dot island"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const labelIcon = (label: string, type: "sea" | "island") =>
  L.divIcon({
    className: "vn-map-label-icon",
    html: `<div class="vn-map-fixed-label ${type}">${label}</div>`,
    iconSize: [170, 36],
    iconAnchor: [85, 18],
  });

function getCityPoints(text: VietnamMapText) {
  return [
    { key: "hanoi", position: [21.0278, 105.8342] as [number, number], icon: capitalIcon },
    { key: "haiPhong", position: [20.8449, 106.6881] as [number, number], icon: cityIcon },
    { key: "hue", position: [16.4637, 107.5909] as [number, number], icon: cityIcon },
    { key: "daNang", position: [16.0544, 108.2022] as [number, number], icon: cityIcon },
    { key: "nhaTrang", position: [12.2388, 109.1967] as [number, number], icon: cityIcon },
    { key: "daLat", position: [11.9404, 108.4583] as [number, number], icon: cityIcon },
    { key: "hcmc", position: [10.8231, 106.6297] as [number, number], icon: cityIcon },
    { key: "canTho", position: [10.0452, 105.7469] as [number, number], icon: cityIcon },
    { key: "caMau", position: [9.1768, 105.1524] as [number, number], icon: cityIcon },
    { key: "phuQuoc", position: [10.2899, 103.984] as [number, number], icon: islandIcon },
    { key: "conDao", position: [8.6864, 106.6082] as [number, number], icon: islandIcon },
  ].map((point) => {
    const [name, desc] = text.cities[point.key as keyof VietnamMapText["cities"]];
    return { ...point, name, desc };
  });
}

function getIslandPoints(text: VietnamMapText) {
  return [
    {
      name: text.hoangSa,
      desc: text.islandDescriptions.hoangSa,
      position: [16.5, 112.0] as [number, number],
    },
    {
      name: text.truongSa,
      desc: text.islandDescriptions.truongSa,
      position: [10.5, 114.0] as [number, number],
    },
  ];
}

function VietnamMapIntro({
  started,
  text,
  onStart,
}: {
  started: boolean;
  text: VietnamMapText;
  onStart: () => void;
}) {
  return (
    <section className={`vn-map-intro ${started ? "started" : ""}`}>
      <div className="vn-intro-pixel-flag">
        <div className="vn-flag-star">★</div>
      </div>

      <div className="vn-intro-content">
        <p className="vn-intro-kicker">{text.introKicker}</p>

        {!started ? (
          <>
            <h2>{text.introTitle}</h2>
            <p>{text.introBody}</p>

            <button type="button" className="vn-open-map-btn" onClick={onStart}>
              {text.openMap}
            </button>
          </>
        ) : (
          <>
            <h2 className="vn-sovereignty-text">{text.sovereignty}</h2>
            <p className="vn-rendering-text">{text.rendering}</p>

            <div className="vn-loading-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FitVietnamBounds() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(vietnamBounds, {
      padding: [24, 24],
    });
  }, [map]);

  return null;
}

function getProvinceName(
  properties: Record<string, unknown> | undefined,
  fallback: string
) {
  if (!properties) return fallback;

  const value =
    properties.Name ||
    properties.name ||
    properties.NAME_1 ||
    properties.ten_tinh ||
    properties.province ||
    properties.shapeName ||
    properties.NAME ||
    properties.VARNAME_1;

  return String(value || fallback);
}

function VietnamGeoJsonMap({ text }: { text: VietnamMapText }) {
  const [vietnamData, setVietnamData] = useState<GeoJsonObject | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const cityPoints = useMemo(() => getCityPoints(text), [text]);
  const islandPoints = useMemo(() => getIslandPoints(text), [text]);

  useEffect(() => {
    let mounted = true;

    async function loadGeoJson() {
      try {
        const response = await fetch(VIETNAM_GEOJSON_URL);

        if (!response.ok) {
          throw new Error("Cannot load Vietnam GeoJSON");
        }

        const data = (await response.json()) as GeoJsonObject;

        if (mounted) {
          setVietnamData(data);
          setLoadFailed(false);
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setLoadFailed(true);
        }
      }
    }

    loadGeoJson();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="vn-real-leaflet-card">
      {loadFailed ? <div className="vn-map-load-warning">{text.loadFailed}</div> : null}

      <MapContainer
        className="vn-real-leaflet-map"
        center={[14.0583, 108.2772]}
        zoom={5}
        minZoom={4}
        maxZoom={10}
        maxBounds={vietnamBounds}
        scrollWheelZoom
      >
        <FitVietnamBounds />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vietnamData ? (
          <GeoJSON
            data={vietnamData}
            style={() => ({
              color: "#991b1b",
              weight: 1.2,
              fillColor: "#ef4444",
              fillOpacity: 0.42,
            })}
            onEachFeature={(feature, layer) => {
              const provinceName = getProvinceName(
                feature.properties,
                text.provinceFallback
              );

              layer.bindTooltip(provinceName, {
                sticky: true,
                direction: "top",
              });

              layer.bindPopup(`
                <strong>${provinceName}</strong><br/>
                ${text.adminMapPopup}
              `);
            }}
          />
        ) : null}

        <Marker
          position={[13.8, 112.2]}
          icon={labelIcon(text.sea.toUpperCase(), "sea")}
          interactive={false}
        />

        {cityPoints.map((point) => (
          <Marker key={point.key} position={point.position} icon={point.icon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {point.name}
            </Tooltip>
            <Popup>
              <strong>{point.name}</strong>
              <br />
              {point.desc}
            </Popup>
          </Marker>
        ))}

        {islandPoints.map((point) => (
          <Marker key={point.name} position={point.position} icon={islandIcon}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              {point.name}
            </Tooltip>
            <Popup>
              <strong>{point.name}</strong>
              <br />
              {point.desc}
            </Popup>
          </Marker>
        ))}

        <Marker
          position={islandPoints[0].position}
          icon={labelIcon(text.hoangSa, "island")}
          interactive={false}
        />

        <Marker
          position={islandPoints[1].position}
          icon={labelIcon(text.truongSa, "island")}
          interactive={false}
        />
      </MapContainer>
    </div>
  );
}

export default function VietnamMapPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [activeMenu, setActiveMenu] = useState("vietnam-map");
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [introStarted, setIntroStarted] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const text = useMemo(
    () => VIETNAM_MAP_TEXT[language] || VIETNAM_MAP_TEXT.vi,
    [language]
  );

  const fullName = localStorage.getItem("fullName") || "Student";
  const studentCode = localStorage.getItem("studentCode") || "";

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!introStarted) return undefined;

    const timer = window.setTimeout(() => {
      setShowMap(true);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [introStarted]);

  function handleMenuClick(key: string) {
    if (!handleStudentMenuNavigation(key, navigate, "vietnam-map")) {
      setActiveMenu(key);
    }
  }

  return (
    <div className={`student-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <div className="dashboard-blob blob-one" />
      <div className="dashboard-blob blob-two" />

      <StudentTaskbar
        language={language}
        activeKey={activeMenu}
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={fullName}
        studentCode={studentCode}
        language={language}
        onLanguageChange={setLanguage}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <section className="student-main-content">
          <div className="vn-map-hero">
            <div>
              <p className="vn-eyebrow">
                <MapPinned size={16} />
                {text.eyebrow}
              </p>

              <h1>{text.title}</h1>
              <p>{text.sub}</p>
            </div>

            <div className="vn-compass-card">
              <Compass size={22} />
              <span>{text.compass}</span>
            </div>
          </div>

          {!showMap ? (
            <VietnamMapIntro
              started={introStarted}
              text={text}
              onStart={() => setIntroStarted(true)}
            />
          ) : (
            <div className="vn-map-grid">
              <article className="vn-map-panel reveal-card">
                <VietnamGeoJsonMap text={text} />
              </article>

              <aside className="vn-info-panel reveal-card">
                <div className="vn-info-card north">
                  <LocateFixed size={20} />
                  <div>
                    <span>{text.location}</span>
                    <strong>{text.north}</strong>
                  </div>
                </div>

                <div className="vn-info-card central">
                  <LocateFixed size={20} />
                  <div>
                    <span>{text.location}</span>
                    <strong>{text.central}</strong>
                  </div>
                </div>

                <div className="vn-info-card south">
                  <LocateFixed size={20} />
                  <div>
                    <span>{text.location}</span>
                    <strong>{text.south}</strong>
                  </div>
                </div>

                <div className="vn-info-card island">
                  <Waves size={20} />
                  <div>
                    <span>{text.islands}</span>
                    <strong>
                      {text.hoangSa} / {text.truongSa}
                    </strong>
                  </div>
                </div>

                <p className="vn-map-note">{text.note}</p>
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
