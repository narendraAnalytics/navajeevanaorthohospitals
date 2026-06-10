'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const VIDEO_URL =
  'https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1781019203/navajeevanavideo_t63kvt.mp4'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function HowItWorksPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [mounted, setMounted] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    // catch cached/already-loaded case where onLoadedMetadata never fires
    const v = videoRef.current
    if (v && v.duration && !isNaN(v.duration)) setDuration(v.duration)
  }, [])

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [resetHideTimer])

  const handlePlayPause = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setIsPlaying(true) }
    else { v.pause(); setIsPlaying(false) }
  }

  const handleStop = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const skip = (sec: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.currentTime + sec, v.duration || 0))
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (v) setCurrentTime(v.currentTime)
  }

  const handleLoaded = () => {
    const v = videoRef.current
    if (v && !isNaN(v.duration)) setDuration(v.duration)
  }

  const seekTo = (clientX: number) => {
    const el = trackRef.current
    const v = videoRef.current
    if (!el || !v || !v.duration) return
    const rect = el.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = pct * v.duration
    setCurrentTime(v.currentTime)
  }

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    isDragging.current = true
    seekTo(e.clientX)
    const v = videoRef.current
    if (v && v.paused) { v.play(); setIsPlaying(true) }
    const onMove = (me: MouseEvent) => { if (isDragging.current) seekTo(me.clientX) }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const vol = Number(e.target.value)
    v.volume = vol
    setVolume(vol)
  }

  const handleEnded = () => setIsPlaying(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hiw-root {
          position: fixed; inset: 0;
          background: #05101E;
          font-family: 'Sora', sans-serif;
          overflow: hidden;
          cursor: none;
        }
        .hiw-root * { cursor: none; }

        /* grain */
        .hiw-grain {
          position: fixed; inset: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.035;
          pointer-events: none;
          z-index: 2;
          animation: grain-shift 8s steps(2) infinite;
        }
        @keyframes grain-shift {
          0%   { transform: translate(0, 0) }
          25%  { transform: translate(-2%, 1%) }
          50%  { transform: translate(1%, -2%) }
          75%  { transform: translate(-1%, 2%) }
          100% { transform: translate(0, 0) }
        }

        /* vignette */
        .hiw-vignette {
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(2,8,18,0.85) 100%),
            linear-gradient(to bottom, rgba(2,8,18,0.5) 0%, transparent 18%, transparent 82%, rgba(2,8,18,0.7) 100%);
          pointer-events: none;
          z-index: 3;
        }

        /* scanlines */
        .hiw-scanlines {
          position: fixed; inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px
          );
          pointer-events: none;
          z-index: 4;
        }

        /* close */
        .hiw-close {
          position: fixed; top: 24px; right: 28px;
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(5,16,30,0.55);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.75);
          font-size: 20px; line-height: 1;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          z-index: 20;
          cursor: pointer !important;
        }
        .hiw-close:hover {
          border-color: #11B5A4;
          color: #11B5A4;
          background: rgba(17,181,164,0.12);
        }

        /* title badge */
        .hiw-badge {
          position: fixed; top: 24px; left: 50%;
          transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
          padding: 6px 18px;
          border: 1px solid rgba(17,181,164,0.25);
          border-radius: 100px;
          background: rgba(5,16,30,0.6);
          backdrop-filter: blur(12px);
          color: rgba(255,255,255,0.6);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          z-index: 20;
        }
        .hiw-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #11B5A4;
          box-shadow: 0 0 8px #11B5A4;
          animation: badge-pulse 2s ease-in-out infinite;
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        /* video */
        .hiw-video {
          position: fixed; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          z-index: 1;
          filter: brightness(0.85);
        }

        /* play overlay (big center button when paused) */
        .hiw-play-overlay {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 10;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .hiw-play-overlay.hidden { opacity: 0; }
        .hiw-center-btn {
          width: 80px; height: 80px;
          border-radius: 50%;
          border: 2px solid rgba(17,181,164,0.6);
          background: rgba(5,16,30,0.65);
          backdrop-filter: blur(16px);
          display: flex; align-items: center; justify-content: center;
          color: #11B5A4;
          pointer-events: all;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 32px rgba(17,181,164,0.15);
          cursor: pointer !important;
        }
        .hiw-center-btn:hover {
          transform: scale(1.1);
          border-color: #11B5A4;
          box-shadow: 0 0 48px rgba(17,181,164,0.35);
        }

        /* controls bar */
        .hiw-controls {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 16px 28px 28px;
          background: linear-gradient(to top, rgba(2,8,18,0.92) 0%, transparent 100%);
          backdrop-filter: blur(4px);
          z-index: 15;
          transition: opacity 0.4s, transform 0.4s;
        }
        .hiw-controls.hidden {
          opacity: 0;
          transform: translateY(16px);
          pointer-events: none;
        }

        /* timeline */
        .hiw-timeline {
          position: relative; height: 4px; margin-bottom: 16px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer !important;
        }
        .hiw-timeline-fill {
          position: absolute; left: 0; top: 0; height: 100%;
          background: linear-gradient(90deg, #11B5A4, #6EE7B7);
          border-radius: 4px;
          transition: width 0.1s linear;
          pointer-events: none;
        }
        .hiw-timeline-input {
          position: absolute; inset: -8px 0;
          width: 100%; height: calc(100% + 16px);
          opacity: 0;
          cursor: pointer !important;
          -webkit-appearance: none;
        }

        /* scrubber thumb — visible on hover */
        .hiw-scrubber-wrap {
          position: relative; height: 20px; margin-bottom: 8px;
          display: flex; align-items: center;
          cursor: pointer !important;
        }
        .hiw-scrubber-track {
          position: absolute; left: 0; right: 0;
          height: 4px; border-radius: 4px;
          background: rgba(255,255,255,0.1);
          transition: background 0.15s;
        }
        .hiw-scrubber-fill {
          position: absolute; left: 0;
          height: 4px; border-radius: 4px;
          background: linear-gradient(90deg, #11B5A4, #6EE7B7);
          pointer-events: none;
        }
        .hiw-scrubber-thumb {
          position: absolute;
          width: 14px; height: 14px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px rgba(17,181,164,0.6);
          transform: translateX(-50%) scale(0);
          transition: transform 0.15s;
          pointer-events: none;
          top: 50%; margin-top: -7px;
        }
        .hiw-scrubber-wrap:hover .hiw-scrubber-thumb { transform: translateX(-50%) scale(1); }
        .hiw-scrubber-wrap:hover .hiw-scrubber-track { background: rgba(255,255,255,0.22); }

        /* buttons row */
        .hiw-btn-row {
          display: flex; align-items: center; gap: 10px;
        }
        .hiw-ctrl-btn {
          width: 38px; height: 38px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.8);
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          cursor: pointer !important;
          flex-shrink: 0;
        }
        .hiw-ctrl-btn:hover {
          border-color: #11B5A4;
          color: #11B5A4;
          background: rgba(17,181,164,0.1);
        }
        .hiw-ctrl-btn.play-main {
          width: 44px; height: 44px;
          border-color: rgba(17,181,164,0.4);
          color: #11B5A4;
        }
        .hiw-ctrl-btn.play-main:hover {
          background: rgba(17,181,164,0.18);
          box-shadow: 0 0 20px rgba(17,181,164,0.25);
        }

        .hiw-time {
          font-size: 12px; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.45);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .hiw-time span { color: rgba(255,255,255,0.75); }

        .hiw-spacer { flex: 1; }

        /* volume */
        .hiw-vol-wrap {
          display: flex; align-items: center; gap: 8px;
        }
        .hiw-vol-icon { color: rgba(255,255,255,0.45); flex-shrink: 0; }
        .hiw-vol-slider {
          -webkit-appearance: none;
          width: 72px; height: 3px;
          border-radius: 3px;
          background: rgba(255,255,255,0.15);
          outline: none;
          cursor: pointer !important;
        }
        .hiw-vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px; border-radius: 50%;
          background: #11B5A4;
          cursor: pointer;
        }
        .hiw-vol-slider::-moz-range-thumb {
          width: 12px; height: 12px; border-radius: 50%;
          background: #11B5A4; border: none;
          cursor: pointer;
        }

        /* mount animation */
        @keyframes hiw-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hiw-animate {
          animation: hiw-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .hiw-animate-d1 { animation-delay: 0.1s; }
        .hiw-animate-d2 { animation-delay: 0.25s; }
        .hiw-animate-d3 { animation-delay: 0.4s; }
      `}</style>

      <div
        className="hiw-root"
        onMouseMove={resetHideTimer}
        onClick={resetHideTimer}
      >
        {/* layers */}
        <div className="hiw-grain" />
        <div className="hiw-vignette" />
        <div className="hiw-scanlines" />

        {/* video */}
        <video
          ref={videoRef}
          className="hiw-video hiw-animate hiw-animate-d1"
          src={VIDEO_URL}
          preload="auto"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoaded}
          onDurationChange={handleLoaded}
          onEnded={handleEnded}
          onClick={handlePlayPause}
          style={{ cursor: 'pointer' }}
        />

        {/* top badge */}
        <div className={`hiw-badge hiw-animate hiw-animate-d2${!showControls ? ' hidden' : ''}`}
          style={{ transition: 'opacity 0.4s', opacity: showControls ? 1 : 0 }}>
          <span className="hiw-badge-dot" />
          How It Works
        </div>

        {/* close */}
        <button
          className={`hiw-close hiw-animate hiw-animate-d2`}
          style={{ transition: 'opacity 0.4s, border-color 0.2s, color 0.2s, background 0.2s', opacity: showControls ? 1 : 0, cursor: 'pointer' }}
          onClick={() => router.push('/?entered=1')}
          aria-label="Close"
        >
          ✕
        </button>

        {/* center play overlay */}
        <div className={`hiw-play-overlay${isPlaying ? ' hidden' : ''}`}>
          <button className="hiw-center-btn" onClick={handlePlayPause} aria-label="Play">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>

        {/* controls */}
        {mounted && (
          <div className={`hiw-controls hiw-animate hiw-animate-d3${!showControls ? ' hidden' : ''}`}>
            {/* scrubber */}
            <div
              ref={trackRef}
              className="hiw-scrubber-wrap"
              onMouseDown={handleTrackMouseDown}
            >
              <div className="hiw-scrubber-track" />
              <div className="hiw-scrubber-fill" style={{ width: `${progress}%` }} />
              <div className="hiw-scrubber-thumb" style={{ left: `${progress}%` }} />
            </div>

            {/* buttons row */}
            <div className="hiw-btn-row">
              {/* backward */}
              <button className="hiw-ctrl-btn" onClick={() => skip(-10)} aria-label="Rewind 10 seconds">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  <text x="9" y="15" fontSize="7" fill="currentColor" stroke="none" fontFamily="Sora,sans-serif" fontWeight="600">10</text>
                </svg>
              </button>

              {/* play/pause */}
              <button className="hiw-ctrl-btn play-main" onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              {/* stop */}
              <button className="hiw-ctrl-btn" onClick={handleStop} aria-label="Stop">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>

              {/* forward */}
              <button className="hiw-ctrl-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-.49-4.5" />
                  <text x="9" y="15" fontSize="7" fill="currentColor" stroke="none" fontFamily="Sora,sans-serif" fontWeight="600">10</text>
                </svg>
              </button>

              {/* time */}
              <div className="hiw-time">
                <span>{fmt(currentTime)}</span> / {fmt(duration)}
              </div>

              <div className="hiw-spacer" />

              {/* volume */}
              <div className="hiw-vol-wrap">
                <svg className="hiw-vol-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                  {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                  {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
                </svg>
                <input
                  type="range"
                  className="hiw-vol-slider"
                  min={0}
                  max={1}
                  step={0.02}
                  value={volume}
                  onChange={handleVolume}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
