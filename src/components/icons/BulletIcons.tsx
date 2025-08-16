export const CrossLargeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CirclePlaceholderOnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const CalendarTodayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 7H14" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
  </svg>
)

export const PencilWaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10.5 2.5L13.5 5.5L6 13H3V10L10.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 11C5 11 6.5 10 8 11C9.5 12 11 11 11 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

export const CircleDashedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.3"/>
  </svg>
)

export const LineConnector = ({ height = 20 }: { height?: number }) => (
  <svg width="2" height={height} viewBox={`0 0 2 ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-1/2 transform -translate-x-1/2">
    <line x1="1" y1="0" x2="1" y2={height} stroke="currentColor" strokeWidth="2" opacity="0.1"/>
  </svg>
)