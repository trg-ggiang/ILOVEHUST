import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import "./LoadingContext.css";

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

export const useLoading = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }

  return context;
};

export function LoadingOverlay() {
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
              {/* shadow */}
              <rect x="28" y="108" width="58" height="5" fill="#111827" opacity="0.18" />

              {/* back leg */}
              <g className="bk-leg-back">
                <rect x="54" y="76" width="10" height="24" fill="#111827" />
                <rect x="50" y="98" width="22" height="7" fill="#0f172a" />
                <rect x="66" y="101" width="10" height="4" fill="#e5e7eb" />
              </g>

              {/* front leg */}
              <g className="bk-leg-front">
                <rect x="38" y="76" width="11" height="25" fill="#1e293b" />
                <rect x="29" y="99" width="24" height="7" fill="#0f172a" />
                <rect x="27" y="101" width="12" height="4" fill="#e5e7eb" />
              </g>

              {/* backpack */}
              <rect x="23" y="42" width="21" height="33" fill="#111827" />
              <rect x="27" y="46" width="15" height="25" fill="#1f2937" />
              <rect x="29" y="50" width="10" height="3" fill="#475569" />
              <rect x="41" y="46" width="5" height="30" fill="#020617" />

              {/* body red BK shirt */}
              <rect x="43" y="39" width="34" height="39" fill="#7f1d1d" />
              <rect x="47" y="35" width="36" height="39" fill="#dc2626" />
              <rect x="47" y="35" width="36" height="5" fill="#ef4444" />
              <rect x="47" y="74" width="36" height="5" fill="#991b1b" />

              {/* collar */}
              <rect x="50" y="35" width="9" height="8" fill="#b91c1c" />
              <rect x="70" y="35" width="9" height="8" fill="#b91c1c" />

              {/* BK letters */}
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

              {/* neck */}
              <rect x="61" y="28" width="11" height="10" fill="#f2c18d" />

              {/* head */}
              <rect x="56" y="13" width="25" height="23" fill="#f2c18d" />
              <rect x="52" y="17" width="6" height="15" fill="#f2c18d" />
              <rect x="78" y="22" width="5" height="5" fill="#e0a875" />

              {/* hair */}
              <rect x="53" y="10" width="27" height="8" fill="#020617" />
              <rect x="58" y="6" width="20" height="7" fill="#020617" />
              <rect x="47" y="15" width="10" height="8" fill="#020617" />
              <rect x="72" y="17" width="10" height="5" fill="#020617" />

              {/* face */}
              <rect x="76" y="23" width="3" height="3" fill="#111827" />
              <rect x="78" y="30" width="6" height="2" fill="#9f1239" />

              {/* back arm */}
              <g className="bk-arm-back">
                <rect x="38" y="44" width="8" height="24" fill="#f2c18d" />
                <rect x="36" y="66" width="9" height="7" fill="#f2c18d" />
              </g>

              {/* front arm */}
              <g className="bk-arm-front">
                <rect x="78" y="43" width="8" height="25" fill="#f2c18d" />
                <rect x="83" y="65" width="11" height="7" fill="#f2c18d" />
              </g>

              {/* shirt sleeves */}
              <rect x="39" y="40" width="10" height="12" fill="#b91c1c" />
              <rect x="75" y="39" width="10" height="12" fill="#b91c1c" />

              {/* strap */}
              <rect x="44" y="39" width="5" height="32" fill="#020617" />
              <rect x="75" y="39" width="4" height="28" fill="#020617" />
            </svg>
          </div>
        </div>

        <p className="bk-loading-text">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}