import type { SVGProps } from "react";

const PATHS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  check: "M5 13l4 4L19 7",
  close: "M6 6l12 12M18 6L6 18",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  alert: "M12 8v5M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  code: "M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14",
  flask: "M9 3h6M10 3v6l-5.5 9.2A1.9 1.9 0 0 0 6.1 21h11.8a1.9 1.9 0 0 0 1.6-2.8L14 9V3M7.5 15h9",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7",
  spark: "M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3ZM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3ZM9 12l2 2 4-4",
  eye: "M2.5 12S6 5 12 5s9.5 7 9.5 7-3.500 7-9.500 7-9.500-7-9.500-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff:
    "M3 3l18 18M10.6 5.1A9.700 9.700 0 0 1 12 5c6 0 9.500 7 9.500 7a16 16 0 0 1-3 3.900M6.600 6.600C4 8.300 2.500 12 2.500 12S6 19 12 19a9.300 9.300 0 0 0 5-1.500M9.900 9.900a3 3 0 0 0 4.200 4.200",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
