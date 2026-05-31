import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { getStoredLanguage } from "../i18n/language";

const LOADING_OVERLAY_TEXT = {
  vi: {
    loading: "Đang tải dữ liệu...",
    slowLoading: "Sắp xong rồi...",
  },
  ja: {
    loading: "データを読み込み中...",
    slowLoading: "もうすぐ完了します...",
  },
};

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  resetLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingCountRef = useRef(0);

  const startLoading = useCallback(() => {
    loadingCountRef.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(loadingCountRef.current - 1, 0);

    if (loadingCountRef.current === 0) {
      setIsLoading(false);
    }
  }, []);

  const resetLoading = useCallback(() => {
    loadingCountRef.current = 0;
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        startLoading,
        stopLoading,
        resetLoading,
      }}
    >
      {children}
      {isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }

  return context;
};

export function LoadingOverlay() {
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const language = getStoredLanguage();
  const text = LOADING_OVERLAY_TEXT[language] || LOADING_OVERLAY_TEXT.vi;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSlowLoading(true);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="bk-loading-overlay" role="status" aria-live="polite">
      <div className="bk-loader-card">
        <div className="bk-pixel-stage">
          <div className="bk-crosswalk" />

          <div className="bk-student-runner">
            <svg
              className="bk-student-sprite"
              viewBox="0 0 120 120"
              aria-hidden="true"
              shapeRendering="crispEdges"
            >
              <rect x="28" y="108" width="58" height="5" fill="#111827" opacity="0.18" />

              <g className="bk-leg-back">
                <rect x="54" y="76" width="10" height="24" fill="#111827" />
                <rect x="50" y="98" width="22" height="7" fill="#0f172a" />
                <rect x="66" y="101" width="10" height="4" fill="#e5e7eb" />
              </g>

              <g className="bk-leg-front">
                <rect x="38" y="76" width="11" height="25" fill="#1e293b" />
                <rect x="29" y="99" width="24" height="7" fill="#0f172a" />
                <rect x="27" y="101" width="12" height="4" fill="#e5e7eb" />
              </g>

              <rect x="23" y="42" width="21" height="33" fill="#111827" />
              <rect x="27" y="46" width="15" height="25" fill="#1f2937" />
              <rect x="29" y="50" width="10" height="3" fill="#475569" />
              <rect x="41" y="46" width="5" height="30" fill="#020617" />

              <rect x="43" y="39" width="34" height="39" fill="#7f1d1d" />
              <rect x="47" y="35" width="36" height="39" fill="#dc2626" />
              <rect x="47" y="35" width="36" height="5" fill="#ef4444" />
              <rect x="47" y="74" width="36" height="5" fill="#991b1b" />

              <rect x="50" y="35" width="9" height="8" fill="#b91c1c" />
              <rect x="70" y="35" width="9" height="8" fill="#b91c1c" />

              <text
                x="56"
                y="59"
                fill="#ffffff"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="900"
              >
                BK
              </text>

              <rect x="61" y="28" width="11" height="10" fill="#f2c18d" />

              <rect x="56" y="13" width="25" height="23" fill="#f2c18d" />
              <rect x="52" y="17" width="6" height="15" fill="#f2c18d" />
              <rect x="78" y="22" width="5" height="5" fill="#e0a875" />

              <rect x="53" y="10" width="27" height="8" fill="#020617" />
              <rect x="58" y="6" width="20" height="7" fill="#020617" />
              <rect x="47" y="15" width="10" height="8" fill="#020617" />
              <rect x="72" y="17" width="10" height="5" fill="#020617" />

              <rect x="76" y="23" width="3" height="3" fill="#111827" />
              <rect x="78" y="30" width="6" height="2" fill="#9f1239" />

              <g className="bk-arm-back">
                <rect x="38" y="44" width="8" height="24" fill="#f2c18d" />
                <rect x="36" y="66" width="9" height="7" fill="#f2c18d" />
              </g>

              <g className="bk-arm-front">
                <rect x="78" y="43" width="8" height="25" fill="#f2c18d" />
                <rect x="83" y="65" width="11" height="7" fill="#f2c18d" />
              </g>

              <rect x="39" y="40" width="10" height="12" fill="#b91c1c" />
              <rect x="75" y="39" width="10" height="12" fill="#b91c1c" />

              <rect x="44" y="39" width="5" height="32" fill="#020617" />
              <rect x="75" y="39" width="4" height="28" fill="#020617" />
            </svg>
          </div>

          {isSlowLoading ? (
            <svg
              className="bk-pixel-penguin"
              viewBox="0 0 80 80"
              aria-hidden="true"
              shapeRendering="crispEdges"
            >
              <rect x="28" y="8" width="24" height="8" fill="#020617" />
              <rect x="20" y="16" width="40" height="40" fill="#020617" />
              <rect x="16" y="28" width="8" height="20" fill="#020617" />
              <rect x="56" y="28" width="8" height="20" fill="#020617" />

              <rect x="28" y="24" width="24" height="30" fill="#f8fafc" />
              <rect x="24" y="20" width="8" height="10" fill="#020617" />
              <rect x="48" y="20" width="8" height="10" fill="#020617" />

              <rect x="30" y="25" width="5" height="5" fill="#f8fafc" />
              <rect x="45" y="25" width="5" height="5" fill="#f8fafc" />
              <rect x="32" y="27" width="3" height="3" fill="#020617" />
              <rect x="45" y="27" width="3" height="3" fill="#020617" />
          {isSlowLoading ? text.slowLoading : text.loading}
              <rect x="36" y="34" width="8" height="5" fill="#f97316" />
              <rect x="39" y="39" width="4" height="3" fill="#ea580c" />

              <rect x="24" y="56" width="12" height="6" fill="#f97316" />
              <rect x="44" y="56" width="12" height="6" fill="#f97316" />

              <rect x="22" y="64" width="36" height="4" fill="#0f172a" opacity="0.2" />
            </svg>
          ) : null}
        </div>

        <p className="bk-loading-text">
          {isSlowLoading ? text.slowLoading : text.loading}
        </p>
      </div>
    </div>
  );
}
