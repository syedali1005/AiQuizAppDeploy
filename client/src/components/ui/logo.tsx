interface LogoProps {
  className?: string;
}

export function SparkAILogo({ className = "h-10 w-auto" }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lightning bolt icon */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Lightning bolt shape */}
      <path
        d="M15 10 L25 10 L20 25 L30 25 L18 45 L22 30 L12 30 L15 10 Z"
        fill="url(#logoGradient)"
        className="drop-shadow-lg"
      />
      
      {/* Spark AI Text */}
      <text
        x="45"
        y="25"
        className="fill-white font-bold text-xl"
        fontSize="18"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Spark
      </text>
      
      <text
        x="105"
        y="25"
        className="fill-white font-bold text-xl"
        fontSize="18"
        fontFamily="Inter, system-ui, sans-serif"
      >
        AI
      </text>
      
      {/* Subtle glow effect */}
      <circle
        cx="22"
        cy="27"
        r="20"
        fill="url(#logoGradient)"
        opacity="0.2"
        className="blur-sm"
      />
    </svg>
  );
}