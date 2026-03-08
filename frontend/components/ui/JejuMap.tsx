"use client";

interface JejuMapProps {
  selectedRegions: string[];
  onToggleRegion?: (region: string) => void;
  className?: string;
}

// Figma SVG path data (viewBox="0 0 334 217")
const REGIONS: Record<string, { d: string; lx: number; ly: number }> = {
  제주시:   { d: "M198.5 36.5H144.5V90.5H198.5V36.5Z",                                              lx: 171.5, ly: 63.5 },
  조천읍:   { d: "M189.5 99.5H234.5V36.5H198.5V90.5H189.5V99.5Z",                                  lx: 214,   ly: 68   },
  구좌읍:   { d: "M234.5 27.5V90.5H252.5V81.5H279.5V45.5H261.5V27.5H234.5Z",                       lx: 257,   ly: 59   },
  성산읍:   { d: "M288.5 81.5H252.5V144.5H270.5V117.5H288.5V81.5Z",                                lx: 271,   ly: 113  },
  표선면:   { d: "M252.5 162.5V90.5H234.5V99.5H216.5V126.5H225.5V162.5H252.5Z",                    lx: 235,   ly: 128  },
  남원읍:   { d: "M189.5 99.5V117.5H180.5V162.5H225.5V126.5H216.5V99.5H189.5Z",                    lx: 204,   ly: 131  },
  서귀포시: { d: "M153.5 108.5V117.5H180.5V171.5H108.5V144.5H126.5V108.5H153.5Z",                  lx: 145,   ly: 140  },
  애월읍:   { d: "M144.5 45.5H108.5V108.5H153.5V90.5H144.5V45.5Z",                                 lx: 131,   ly: 77   },
  안덕면:   { d: "M90.5 108.5H126.5V144.5H108.5V171.5H81.5V117.5H90.5V108.5Z",                     lx: 104,   ly: 140  },
  대정읍:   { d: "M54.5 126.5H81.5V180.5H63.5V162.5H54.5V126.5Z",                                  lx: 68,    ly: 154  },
  한림읍:   { d: "M108.5 54.5H90.5V63.5H81.5V117.5H90.5V108.5H108.5V54.5Z",                        lx: 95,    ly: 87   },
  한경면:   { d: "M54.5 81.5H81.5V126.5H45.5V90.5H54.5V81.5Z",                                     lx: 63,    ly: 104  },
  한라산:   { d: "M189.5 90.5H153.5V117.5H189.5V90.5Z",                                             lx: 171.5, ly: 104  },
  비양도:   { d: "M90.5 27.5H72.5V45.5H90.5V27.5Z",                                                lx: 81.5,  ly: 36.5 },
  가파도:   { d: "M81.5 198.5H63.5V216.5H81.5V198.5Z",                                             lx: 72.5,  ly: 207.5},
  우도:     { d: "M333.5 81.5H306.5V108.5H333.5V81.5Z",                                             lx: 320,   ly: 95   },
  추자도:   { d: "M27.5 18.5V0.5H0.5V27.5H9.5V45.5H36.5V18.5H27.5Z",                               lx: 18,    ly: 23   },
};

const SMALL_REGIONS = new Set(["한경면", "비양도", "우도", "가파도", "추자도"]);

const SELECTED = "#ff9900";
const DEFAULT  = "#e0e0e0";
const STROKE   = "#ffffff";

export default function JejuMap({ selectedRegions, onToggleRegion, className }: JejuMapProps) {
  return (
    <svg
      viewBox="0 0 334 217"
      style={{ width: "100%", height: "auto", display: "block" }}
      className={className}
    >
      {Object.entries(REGIONS).map(([name, { d, lx, ly }]) => {
        const selected = selectedRegions.includes(name);
        const isSmall  = SMALL_REGIONS.has(name);
        return (
          <g
            key={name}
            onClick={() => onToggleRegion?.(name)}
            style={{ cursor: onToggleRegion ? "pointer" : "default" }}
          >
            <path
              d={d}
              fill={selected ? SELECTED : DEFAULT}
              stroke={STROKE}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {!isSmall && (
              <text
                x={lx}
                y={ly}
                fontSize={name === "서귀포시" ? 6 : 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={selected ? "#ffffff" : "#444444"}
                fontWeight="600"
                fontFamily="sans-serif"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
