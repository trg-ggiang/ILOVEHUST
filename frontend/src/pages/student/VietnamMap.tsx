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

import "./VietnamMap.css";

const VIETNAM_GEOJSON_URL =
  "https://data.opendevelopmentmekong.net/dataset/999c96d8-fae0-4b82-9a2b-e481f6f50e12/resource/234169fb-ae73-4f23-bbd4-ff20a4fca401/download/diaphantinh.geojson";

const VIETNAM_MAP_TEXT = {
  vi: {
    title: "Bản đồ Việt Nam",
    sub: "Bản đồ Việt Nam với ranh giới tỉnh/thành, các điểm nổi bật, Hoàng Sa và Trường Sa hiển thị bằng tiếng Việt.",
    north: "Miền Bắc",
    central: "Miền Trung",
    south: "Miền Nam",
    islands: "Biển đảo Việt Nam",
    hoangSa: "Hoàng Sa",
    truongSa: "Trường Sa",
    note: "Bản đồ dùng dữ liệu ranh giới hành chính Việt Nam dạng GeoJSON. Nhãn Hoàng Sa và Trường Sa được hiển thị riêng bằng tiếng Việt trên giao diện.",
    location: "Vị trí",
    sea: "Biển Đông",
    compass: "Hướng Bắc",
  },
  ja: {
    title: "ベトナム地図",
    sub: "ベトナムの行政境界、主要都市、ホアンサ・チュオンサ諸島を表示します。",
    north: "北部",
    central: "中部",
    south: "南部",
    islands: "島々",
    hoangSa: "ホアンサ",
    truongSa: "チュオンサ",
    note: "行政境界はGeoJSONデータを使用し、島名はベトナム語で表示しています。",
    location: "位置",
    sea: "南シナ海",
    compass: "北",
  },
};

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

const cityPoints = [
  {
    name: "Hà Nội",
    desc: "Thủ đô Việt Nam, khu vực có HUST.",
    position: [21.0278, 105.8342] as [number, number],
    icon: capitalIcon,
  },
  {
    name: "Hải Phòng",
    desc: "Thành phố cảng lớn ở miền Bắc.",
    position: [20.8449, 106.6881] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Huế",
    desc: "Cố đô, trung tâm văn hóa miền Trung.",
    position: [16.4637, 107.5909] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Đà Nẵng",
    desc: "Thành phố biển trung tâm miền Trung.",
    position: [16.0544, 108.2022] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Nha Trang",
    desc: "Thành phố biển thuộc Khánh Hòa.",
    position: [12.2388, 109.1967] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Đà Lạt",
    desc: "Thành phố cao nguyên thuộc Lâm Đồng.",
    position: [11.9404, 108.4583] as [number, number],
    icon: cityIcon,
  },
  {
    name: "TP. Hồ Chí Minh",
    desc: "Trung tâm kinh tế lớn ở miền Nam.",
    position: [10.8231, 106.6297] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Cần Thơ",
    desc: "Trung tâm vùng Đồng bằng sông Cửu Long.",
    position: [10.0452, 105.7469] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Cà Mau",
    desc: "Khu vực cực Nam của Việt Nam.",
    position: [9.1768, 105.1524] as [number, number],
    icon: cityIcon,
  },
  {
    name: "Phú Quốc",
    desc: "Đảo lớn ở phía Tây Nam Việt Nam.",
    position: [10.2899, 103.984] as [number, number],
    icon: islandIcon,
  },
  {
    name: "Côn Đảo",
    desc: "Quần đảo ngoài khơi Đông Nam Bộ.",
    position: [8.6864, 106.6082] as [number, number],
    icon: islandIcon,
  },
];

const islandPoints = [
  {
    name: "Hoàng Sa",
    desc: "Hoàng Sa là của Việt Nam.",
    position: [16.5, 112.0] as [number, number],
  },
  {
    name: "Trường Sa",
    desc: "Trường Sa là của Việt Nam.",
    position: [10.5, 114.0] as [number, number],
  },
];

function VietnamMapIntro({
  started,
  onStart,
}: {
  started: boolean;
  onStart: () => void;
}) {
  return (
    <section className={`vn-map-intro ${started ? "started" : ""}`}>
      <div className="vn-intro-pixel-flag">
        <div className="vn-flag-star">★</div>
      </div>

      <div className="vn-intro-content">
        <p className="vn-intro-kicker">Vietnam Digital Map</p>

        {!started ? (
          <>
            <h2>Khởi tạo bản đồ Việt Nam</h2>
            <p>
              Bấm để mở bản đồ Việt Nam. Hệ thống sẽ render ranh giới hành chính
              Việt Nam và gắn nhãn Hoàng Sa, Trường Sa bằng tiếng Việt.
            </p>

            <button type="button" className="vn-open-map-btn" onClick={onStart}>
              Mở bản đồ
            </button>
          </>
        ) : (
          <>
            <h2 className="vn-sovereignty-text">
              Trường Sa, Hoàng Sa là của Việt Nam
            </h2>
            <p className="vn-rendering-text">Đang render bản đồ...</p>

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

function getProvinceName(properties: Record<string, unknown> | undefined) {
  if (!properties) return "Tỉnh / thành phố";

  const value =
    properties.Name ||
    properties.name ||
    properties.NAME_1 ||
    properties.ten_tinh ||
    properties.province ||
    properties.shapeName ||
    properties.NAME ||
    properties.VARNAME_1;

  return String(value || "Tỉnh / thành phố");
}

function VietnamGeoJsonMap() {
  const [vietnamData, setVietnamData] = useState<GeoJsonObject | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

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
      {loadFailed ? (
        <div className="vn-map-load-warning">
          Không tải được GeoJSON Việt Nam. Bản đồ nền vẫn hoạt động, nhưng chưa
          có ranh giới tỉnh/thành.
        </div>
      ) : null}

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
              const provinceName = getProvinceName(feature.properties);

              layer.bindTooltip(provinceName, {
                sticky: true,
                direction: "top",
              });

              layer.bindPopup(`
                <strong>${provinceName}</strong><br/>
                Bản đồ hành chính Việt Nam
              `);
            }}
          />
        ) : null}

        <Marker
          position={[13.8, 112.2]}
          icon={labelIcon("BIỂN ĐÔNG", "sea")}
          interactive={false}
        />

        {cityPoints.map((point) => (
          <Marker key={point.name} position={point.position} icon={point.icon}>
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
          icon={labelIcon("Hoàng Sa", "island")}
          interactive={false}
        />

        <Marker
          position={islandPoints[1].position}
          icon={labelIcon("Trường Sa", "island")}
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
    if (!introStarted) return;

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
                Vietnam Map
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
              onStart={() => setIntroStarted(true)}
            />
          ) : (
            <div className="vn-map-grid">
              <article className="vn-map-panel reveal-card">
                <VietnamGeoJsonMap />
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
