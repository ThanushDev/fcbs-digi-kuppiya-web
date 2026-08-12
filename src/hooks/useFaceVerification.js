import { useCallback, useRef, useState } from 'react'

const MODEL_URL = '/models/face-api'
const MIN_SCORE = 0.5

let faceapi = null
let modelsPromise = null

async function ensureFaceApi() {
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api')
  }
  return faceapi
}

export async function preloadFaceModels() {
  const api = await ensureFaceApi()
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]).catch((err) => {
      modelsPromise = null
      throw err
    })
  }
  return modelsPromise
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export default function useFaceVerification() {
  const [status, setStatus] = useState('idle') // idle | analyzing | passed | failed | error
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const runIdRef = useRef(0)

  const reset = useCallback(() => {
    runIdRef.current += 1
    setStatus('idle')
    setProgress(0)
    setResult(null)
  }, [])

  // Analyze an image URL automatically. Exactly ONE high-confidence
  // human face → 'passed'; zero or multiple faces (or non-human images) → 'failed'.
  // drawCanvasRef (optional): a ref to an overlay <canvas> that receives the
  // real bounding-box + landmark drawing once detection completes.
  const analyze = useCallback(async (src, drawCanvasRef = null) => {
    const runId = ++runIdRef.current
    setStatus('analyzing')
    setProgress(0.12)
    setResult(null)

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(0.85, prev + Math.max(0.03, (0.85 - prev) * 0.15)))
    }, 180)

    const cleanup = () => {
      clearInterval(progressTimer)
      if (runIdRef.current === runId) setProgress(1)
    }

    try {
      const api = await ensureFaceApi()
      const img = await loadImage(src)
      if (runIdRef.current !== runId) { cleanup(); return }

      await preloadFaceModels()
      if (runIdRef.current !== runId) { cleanup(); return }

      const options = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
      const results = await api.detectAllFaces(img, options).withFaceLandmarks()
      if (runIdRef.current !== runId) { cleanup(); return }

      const faces = results.filter((r) => r.detection.score >= MIN_SCORE)
      const detections = faces.length ? faces : (results.length ? results : null)

      if (drawCanvasRef?.current && detections) {
        const dims = { width: img.width, height: img.height }
        api.matchDimensions(drawCanvasRef.current, dims)
        const resized = api.resizeResults(detections, dims)
        api.draw.drawDetections(drawCanvasRef.current, resized)
        api.draw.drawFaceLandmarks(drawCanvasRef.current, resized)
      }

      cleanup()
      setResult(detections)
      setStatus(faces.length === 1 ? 'passed' : 'failed')
    } catch (error) {
      cleanup()
      console.error('Face verification error:', error)
      if (runIdRef.current === runId) setStatus('error')
    }
  }, [])

  return { status, progress, result, analyze, reset }
}