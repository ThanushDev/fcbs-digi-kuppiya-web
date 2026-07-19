import { useState, useEffect, useRef } from 'react'
import { X, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { useAds } from '../../contexts/AdsContext'

export default function AdPopupModal() {
  const { currentAd, showAdPopup, dismissAd, handleAdClick } = useAds()
  const [countdown, setCountdown] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isAdLoaded, setIsAdLoaded] = useState(false)
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  const duration = currentAd?.countdownDuration || 7
  const isVideo = currentAd?.adType === 'video'
  const circumference = 2 * Math.PI * 42
  const progress = ((duration - countdown) / duration) * circumference
  const isUnlocked = countdown <= 0 && isAdLoaded

  // Start countdown only after ad content has loaded
  useEffect(() => {
    if (!showAdPopup || !currentAd) {
      setCountdown(0)
      setIsAdLoaded(false)
      return
    }

    setCountdown(duration)
    setIsAdLoaded(false)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [showAdPopup, currentAd, duration])

  // Tick the timer only after media is loaded
  useEffect(() => {
    if (!isAdLoaded || countdown <= 0) return

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isAdLoaded, countdown <= 0])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!showAdPopup || !currentAd) return null

  const handleMediaClick = () => {
    if (!isUnlocked) return
    handleAdClick(currentAd)
  }

  const handleMediaLoad = () => {
    setIsAdLoaded(true)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 md:p-6 select-none">
      <div className="relative w-full max-w-2xl bg-black rounded-3xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Ad media area — immersive dark canvas */}
        <div className="relative w-full bg-black flex items-center justify-center"
          style={{ aspectRatio: isVideo ? '16/9' : '4/3' }}>
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentAd.mediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onCanPlay={handleMediaLoad}
              className={`w-full h-full object-contain cursor-pointer transition-opacity duration-500 ${isAdLoaded ? 'opacity-100' : 'opacity-0'}`}
              onClick={handleMediaClick}
            />
          ) : (
            <img
              src={currentAd.mediaUrl}
              alt="Sponsored"
              onLoad={handleMediaLoad}
              className={`w-full h-full object-contain cursor-pointer transition-opacity duration-500 ${isAdLoaded ? 'opacity-100' : 'opacity-0'}`}
              onClick={handleMediaClick}
            />
          )}

          {/* Loading skeleton — hidden only after media fully loads */}
          {!isAdLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-3">
                <div className="loader-glow !w-8 !h-8" />
                <p className="text-[11px] font-medium text-slate-500">Loading sponsored content...</p>
              </div>
            </div>
          )}

          {/* Mute toggle — always visible for video */}
          {isVideo && isAdLoaded && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Floating countdown ring — top-right, visible while timer is active */}
        {!isUnlocked && isAdLoaded && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="5"
                strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className="text-xs font-bold text-white/80">{countdown}s</span>
          </div>
        )}

        {/* Floating close button — appears only after ad is complete */}
        {isUnlocked && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              onClick={dismissAd}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white transition-all active:scale-90"
              aria-label="Close ad"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={dismissAd}
              className="text-xs font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 transition-all active:scale-95 border border-white/10"
            >
              Continue
            </button>
          </div>
        )}

        {/* Click to visit — bottom-left overlay when unlocked */}
        {isUnlocked && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <ExternalLink className="w-3 h-3 text-white/70" />
            <span className="text-[9px] font-bold text-white/70 tracking-wider">Click to visit</span>
          </div>
        )}
      </div>
    </div>
  )
}
