import { useMemo } from 'react'

const bubbleStyle = `
  @keyframes rise {
    0%   { transform: translateY(0) scale(1); opacity: 0.7; }
    100% { transform: translateY(-110vh) scale(1.1); opacity: 0; }
  }
  .bubble {
    position: fixed;
    bottom: -80px;
    border-radius: 50%;
    animation: rise linear infinite;
    pointer-events: none;
    z-index: 0;
  }
`

export default function BubbleBackground() {
  const bubbles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: Math.random() * 28 + 8,
      left: Math.random() * 100,
      duration: Math.random() * 8 + 5,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.25 + 0.1,
      color: i % 3 === 0 ? '#FF6B6B' : '#00B4D8',
    }))
  }, [])

  return (
    <>
      <style>{bubbleStyle}</style>
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            background: b.color,
            opacity: b.opacity,
          }}
        />
      ))}
    </>
  )
}
