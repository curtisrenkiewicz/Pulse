interface IconProps {
  className?: string
  size?: 16 | 20
}

export const CheckmarkIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M4.5 8.70807L6.6 10.8331L11.5 5.16641" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CrossSmallIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M5 5L11 11M11 5L5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CrossLargeIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M3.16667 3.16667L12.8333 12.8333M12.8333 3.16667L3.16667 12.8333" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

export const ArrowRightIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M3.16666 8.16667H12.8333M8.83333 4.16667L12.8333 8.16667L8.83333 12.1667" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ArrowLeftIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M12.8333 8.16667H3.16666M7.16666 4.16667L3.16666 8.16667L7.16666 12.1667" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CalendarIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M13.5 4.83333V4.5C13.5 3.39543 12.6046 2.5 11.5 2.5H4.5C3.39543 2.5 2.5 3.39543 2.5 4.5V4.83333M13.5 4.83333V11.5C13.5 12.6046 12.6046 13.5 11.5 13.5H4.5C3.39543 13.5 2.5 12.6046 2.5 11.5V4.83333M13.5 4.83333H2.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
)

export const PencilWaveIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M14 12.0002C14 12.0002 13.1107 13.0298 12.1107 13.0298C11.1107 13.0298 10.3063 12.0768 9.3244 12.0768C8.34253 12.0768 7.7732 12.5242 7.16667 13.1668M12.4167 5.0835L4.58579 12.9144C4.21071 13.2894 3.70201 13.5002 3.17157 13.5002H1.83333V12.1619C1.83333 11.6315 2.04405 11.1228 2.41912 10.7477L10.25 2.91683C10.8483 2.31852 11.8183 2.31852 12.4167 2.91683C13.015 3.51514 13.015 4.48519 12.4167 5.0835Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CircleIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M14.1654 7.99967C14.1654 11.4054 11.4044 14.1663 7.9987 14.1663C4.59294 14.1663 1.83203 11.4054 1.83203 7.99967C1.83203 4.59392 4.59294 1.83301 7.9987 1.83301C11.4044 1.83301 14.1654 4.59392 14.1654 7.99967Z" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
  </svg>
)

export const CircleDashedIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    className={className}
  >
    <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3"/>
  </svg>
)

export const ClockIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M8 5.16667V8L9.83333 9.83333M14.1667 8C14.1667 11.4057 11.4057 14.1667 8 14.1667C4.59425 14.1667 1.83333 11.4057 1.83333 8C1.83333 4.59425 4.59425 1.83333 8 1.83333C11.4057 1.83333 14.1667 4.59425 14.1667 8Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const PencilLineIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M8.498 14.1667H14.163M1.83333 12.1623V14.1667H3.83764C4.36791 14.1667 4.87647 13.956 5.25143 13.5811L13.5823 5.2502C14.3631 4.46939 14.3607 3.20098 13.5798 2.42017C12.799 1.63936 11.5306 1.6369 10.7498 2.41772L2.41895 10.7485C2.04399 11.1235 1.83333 11.6321 1.83333 12.1623Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const AtIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    className={className}
  >
    <path d="M11.1579 13.1027C10.2407 13.6715 9.15867 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 9.28413 13.3619 10.6103 11.8734 10.475C10.6489 10.3637 9.76747 9.24913 9.9414 8.03193L10.2849 5.66667M9.9054 8.31167C9.706 9.73067 8.53773 10.7395 7.29613 10.5651C6.0545 10.3905 5.20963 9.09873 5.40905 7.67973C5.60848 6.26073 6.77667 5.25185 8.01833 5.42635C9.25993 5.60085 10.1049 6.89267 9.9054 8.31167Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

export const ArrowUpIcon = ({ className = "", size = 18 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    className={className}
  >
    <path d="M8.7959 2.0625C9.11644 2.0625 9.40544 2.197 9.61035 2.41211L14.1104 6.93066C14.5487 7.37085 14.5475 8.08304 14.1074 8.52148C13.6672 8.95973 12.955 8.95858 12.5166 8.51855L9.9209 5.91113V14.4375C9.92079 15.0587 9.41715 15.5625 8.7959 15.5625C8.17485 15.5623 7.671 15.0586 7.6709 14.4375V5.91016L5.07422 8.51855C4.63584 8.9587 3.92365 8.95977 3.4834 8.52148C3.04347 8.08311 3.04133 7.37085 3.47949 6.93066L7.99707 2.39355C8.06641 2.32392 8.14498 2.26545 8.22852 2.2168C8.27132 2.1917 8.31516 2.16779 8.36133 2.14844C8.40721 2.12933 8.45483 2.11448 8.50293 2.10156C8.59638 2.07637 8.69449 2.06254 8.7959 2.0625Z" fill="currentColor" fillOpacity="0.97"/>
  </svg>
)

export const PulseyAvatar = ({ className = "", size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 21" 
    fill="none" 
    className={className}
  >
    <path d="M9.14857 0.769531C12.6947 0.769751 14.1886 3.19531 14.1886 3.19531C14.2509 3.20196 17.8119 3.59331 19.4142 6.36816C21.019 9.14875 18.6997 12.4822 18.6681 12.5273C18.678 12.5749 19.3992 16.0887 17.1749 18.3135C14.9542 20.5343 11.2651 19.6356 11.2023 19.6201C11.2023 19.6201 8.58913 21.9323 5.22963 19.9932C1.89453 18.0676 2.23807 14.4476 2.2433 14.3945C2.2433 14.3945 -0.773042 12.1544 0.189588 8.6084C1.15261 5.06213 4.10951 4.31543 4.10951 4.31543C4.11127 4.31125 5.60443 0.769712 9.14857 0.769531ZM9.7101 5.46387C8.63742 5.46387 7.76791 6.45773 7.76771 7.68359C7.76771 8.90965 8.6373 9.9043 9.7101 9.9043C10.7828 9.90422 11.6525 8.9096 11.6525 7.68359C11.6523 6.45778 10.7827 5.46395 9.7101 5.46387ZM14.1515 5.46387C13.079 5.46415 12.2093 6.45791 12.2091 7.68359C12.2091 8.90947 13.0789 9.90401 14.1515 9.9043C15.2243 9.9043 16.0949 8.90965 16.0949 7.68359C16.0947 6.45773 15.2242 5.46387 14.1515 5.46387Z" fill="#585858"/>
  </svg>
)