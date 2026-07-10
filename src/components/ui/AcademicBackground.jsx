import { useEffect, useRef } from 'react'

const icons = [
  { viewBox: '0 0 24 24', path: 'M12 14l9-5-9-5-9 5 9 5z', path2: 'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { viewBox: '0 0 24 24', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { viewBox: '0 0 24 24', path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { viewBox: '0 0 24 24', path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { viewBox: '0 0 24 24', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { viewBox: '0 0 24 24', path: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { viewBox: '0 0 24 24', path: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
]

const floatKeyframes = [
  { name: 'float1', x: [0, 30, -20, 0], y: [0, -40, 20, 0], r: [0, 10, -5, 0], dur: 20 },
  { name: 'float2', x: [0, -25, 35, 0], y: [0, 30, -45, 0], r: [0, -8, 12, 0], dur: 25 },
  { name: 'float3', x: [0, 40, -30, 0], y: [0, -25, 35, 0], r: [0, 15, -10, 0], dur: 22 },
  { name: 'float4', x: [0, -35, 25, 0], y: [0, 45, -30, 0], r: [0, -12, 8, 0], dur: 28 },
  { name: 'float5', x: [0, 20, -40, 0], y: [0, -35, 25, 0], r: [0, 6, -15, 0], dur: 18 },
]

export default function AcademicBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    const MAX = 40
    const CONNECT_DIST = 130

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < MAX; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.r * 0.08 + 0.04})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-600/6 to-violet-600/4 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-600/6 to-indigo-600/4 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-600/3 to-transparent blur-3xl" />

      {/* Floating academic icons */}
      <svg className="absolute top-[12%] left-[8%] w-8 h-8 text-indigo-600/12 animate-[float1_20s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
      <svg className="absolute top-[20%] right-[12%] w-7 h-7 text-violet-600/10 animate-[float2_25s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <svg className="absolute bottom-[18%] left-[15%] w-6 h-6 text-indigo-600/10 animate-[float3_22s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <svg className="absolute bottom-[25%] right-[18%] w-8 h-8 text-violet-600/10 animate-[float4_28s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <svg className="absolute top-[45%] left-[5%] w-5 h-5 text-indigo-600/12 animate-[float5_18s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <svg className="absolute top-[60%] right-[6%] w-6 h-6 text-violet-600/10 animate-[float2_26s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <svg className="absolute top-[75%] left-[40%] w-7 h-7 text-indigo-600/8 animate-[float1_24s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>

      {/* Canvas particle network */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Inject float keyframes */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -40px) rotate(10deg); }
          50% { transform: translate(-20px, 20px) rotate(-5deg); }
          75% { transform: translate(15px, -15px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-25px, 30px) rotate(-8deg); }
          50% { transform: translate(35px, -45px) rotate(12deg); }
          75% { transform: translate(-15px, 10px) rotate(-4deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(40px, -25px) rotate(15deg); }
          50% { transform: translate(-30px, 35px) rotate(-10deg); }
          75% { transform: translate(10px, -20px) rotate(5deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-35px, 45px) rotate(-12deg); }
          50% { transform: translate(25px, -30px) rotate(8deg); }
          75% { transform: translate(-20px, 15px) rotate(-3deg); }
        }
        @keyframes float5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -35px) rotate(6deg); }
          50% { transform: translate(-40px, 25px) rotate(-15deg); }
          75% { transform: translate(15px, -10px) rotate(4deg); }
        }
      `}</style>
    </div>
  )
}
