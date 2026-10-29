import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6" /></>,
  dumbbell: <path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" />,
  tag: <><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  card: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />,
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </>
  ),
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>,
  coach: <><circle cx="12" cy="7" r="4" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></>,
  renew: <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  // Môn thể thao
  badminton: <><circle cx="12" cy="18.5" r="2.5" /><path d="M9.8 17.2 6 4h12l-3.8 13.2M10 4l1.2 12.2M14 4l-1.2 12.2M7 8h10" /></>,
  pickleball: <><rect x="3" y="2.5" width="11" height="12" rx="4.5" /><path d="M8.5 14.5V21" /><circle cx="18" cy="17.5" r="3" /><path d="M17 16.6h.01M19 18.4h.01" /></>,
  tennis: <><circle cx="12" cy="12" r="9" /><path d="M6 4.6c2.5 2 3.8 4.6 3.8 7.4S8.5 17.4 6 19.4M18 4.6c-2.5 2-3.8 4.6-3.8 7.4s1.3 5.4 3.8 7.4" /></>,
  football: <><circle cx="12" cy="12" r="9" /><path d="m12 7.5 4 2.9-1.5 4.6h-5L8 10.4zM12 7.5V3M16 10.4l4.2-1.4M14.5 15l2.6 3.6M9.5 15l-2.6 3.6M8 10.4 3.8 9" /></>,
  basketball: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18M5.6 5.6c3 3.3 3 9.5 0 12.8M18.4 5.6c-3 3.3-3 9.5 0 12.8" /></>,
  volleyball: <><circle cx="12" cy="12" r="9" /><path d="M12 3c-.3 4.6 1.7 8 6.4 9.6M12 12c-4.3 1.5-6.6 4.3-7.2 7M12 12c3.6 2.3 5.6 5.1 5.6 7.3M12 12c-1.8-3.9-5-6.4-8.7-6.6" /></>,
  trophy: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />,
  idcard: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.5" /><path d="M5.5 16.5c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5M14 9h5M14 12h5M14 15h3" /></>,
  // Tùy chỉnh
  sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M14 4v4M8 10v4M16 16v4" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={'ic ' + className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      {PATHS[name]}
    </svg>
  );
}
