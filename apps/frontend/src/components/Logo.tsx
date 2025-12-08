// Logo SVG component cho Workflow Platform
// Design: 3 layers stacked - biểu tượng cho workflow automation

interface LogoProps {
  size?: number
  className?: string
  variant?: 'default' | 'white' | 'gradient'
}

export default function Logo({ size = 40, className = '', variant = 'default' }: LogoProps) {
  const colors = {
    default: {
      layer1: '#6366f1',
      layer2: '#8b5cf6', 
      layer3: '#a855f7',
      stroke: '#6366f1'
    },
    white: {
      layer1: 'white',
      layer2: 'white',
      layer3: 'white',
      stroke: 'white'
    },
    gradient: {
      layer1: 'url(#logoGradient)',
      layer2: 'url(#logoGradient)',
      layer3: 'url(#logoGradient)',
      stroke: 'url(#logoGradient)'
    }
  }

  const c = colors[variant]

  return (
    <svg 
      viewBox="0 0 48 48" 
      width={size} 
      height={size} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      
      {/* Top layer - filled */}
      <path 
        d="M24 8L8 17L24 26L40 17L24 8Z" 
        fill={c.layer1}
        fillOpacity={variant === 'white' ? '1' : '0.9'}
      />
      
      {/* Middle layer - stroke */}
      <path 
        d="M8 24L24 33L40 24" 
        stroke={c.layer2}
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        strokeOpacity={variant === 'white' ? '0.8' : '1'}
        fill="none"
      />
      
      {/* Bottom layer - stroke */}
      <path 
        d="M8 31L24 40L40 31" 
        stroke={c.layer3}
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        strokeOpacity={variant === 'white' ? '0.5' : '0.7'}
        fill="none"
      />
    </svg>
  )
}

// Logo with background box (như trong ảnh thứ 2)
export function LogoBox({ size = 60, className = '' }: { size?: number, className?: string }) {
  return (
    <div 
      className={`logo-box ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: size * 0.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)'
      }}
    >
      <Logo size={size * 0.6} variant="white" />
    </div>
  )
}
