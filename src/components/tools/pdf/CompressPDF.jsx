import { useState, useCallback, useEffect } from 'react'
import { FileType, Loader2, RefreshCw } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions, VerbosityLevel } from 'pdfjs-dist'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

// Configure the PDF.js worker source so pdfjs-dist never throws a missing
// workerSrc error. The worker is not used at runtime (disableWorker: true),
// but workerSrc must be defined for the library to initialize cleanly.
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs`

// Compression level presets: { scale, jpegQuality, label, description }
const COMPRESSION_LEVELS = [
  {
    value: 'extreme',
    label: 'Extreme',
    desc: 'Targets <2 MB — aggressive optimization',
    scale: 1.0,
    quality: 0.6,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    desc: 'Great balance of size and quality',
    scale: 1.5,
    quality: 0.75,
  },
  {
    value: 'low',
    label: 'Low',
    desc: 'Light optimization — minimal quality loss',
    scale: 2.0,
    quality: 0.9,
  },
]

export default function CompressPDF() {
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [level, setLevel] = useState('balanced')
  const [isProcessing, setIsProcessing] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [newSize, setNewSize] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Revoke the previous object URL when the file changes to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  // Freshly read the File into an ArrayBuffer on demand.
  const readBuffer = useCallback(async () => {
    if (!file) return null
    return await file.arrayBuffer()
  }, [file])

  const loadPdf = useCallback(async (selectedFile) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`"${selectedFile.name}" exceeds the 20 MB limit.`)
      return
    }
    try {
      // Revoke any previously created object URL.
      if (fileUrl) URL.revokeObjectURL(fileUrl)

      const url = URL.createObjectURL(selectedFile)
      setFileUrl(url)
      setFile(selectedFile)

      const loadingTask = getDocument({ url, disableWorker: true, verbosity: VerbosityLevel.ERRORS })
      const pdf = await loadingTask.promise

      setNumPages(pdf.numPages)
      setOriginalSize(selectedFile.size)
      setNewSize(0)
      setProgress(0)
      setError(null)
    } catch (err) {
      const msg = err?.message || 'Failed to load PDF.'
      setError(`Unable to read "${selectedFile.name}". ${msg}`)
      console.error('CompressPDF loadPdf error:', err)
    }
  }, [fileUrl])

const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file first.')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const arrayBuffer = await readBuffer()
      const loadingTask = getDocument({ data: arrayBuffer, disableWorker: true, verbosity: VerbosityLevel.ERRORS })
      const pdf = await loadingTask.promise

      const newPdf = await PDFDocument.create()
      const levelConfig = COMPRESSION_LEVELS.find((l) => l.value === level)

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1)

        // Render page to canvas at 1x for clarity, then compress via JPEG quality
        const viewport = page.getViewport({ scale: levelConfig.scale })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: ctx, viewport }).promise

        const jpegBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', levelConfig.quality)
        })

        const jpegArrayBuffer = await jpegBlob.arrayBuffer()
        const embeddedImage = await newPdf.embedJpg(jpegArrayBuffer)

        const newPage = newPdf.addPage([embeddedImage.width, embeddedImage.height])
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        })

        setProgress(Math.round(((i + 1) / pdf.numPages) * 100))
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const compressedSize = pdfBytes.length
      setNewSize(compressedSize)

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `compressed-${file.name}`
      link.click()
      URL.revokeObjectURL(url)

      setProgress(100)
    } catch (err) {
      const msg = err?.message || 'Failed to compress PDF.'
      setError(`Compression failed: ${msg}`)
      console.error('CompressPDF handleCompress error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    setFile(null)
    setFileUrl(null)
    setNumPages(0)
    setOriginalSize(0)
    setNewSize(0)
    setProgress(0)
    setError(null)
  }

const savings = originalSize > 0 && newSize > 0 ? originalSize - newSize : 0
  const savingsPct = originalSize > 0 && newSize > 0 ? Math.round((savings / originalSize) * 100) : 0

  const fmtSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Compress PDF</h2>
        <p className="text-sm text-gray-500">
          Render each page to canvas and re-embed as compressed JPEG.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Upload */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-amber-200 hover:bg-amber-50 transition" onDrop={(e) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f && f.type === 'application/pdf') loadPdf(f)
      }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => e.preventDefault()}>
        <FileType className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-900 mb-1">Drop a PDF file here</p>
        <p className="text-xs text-gray-500 mb-3">or click to browse</p>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files[0] && loadPdf(e.target.files[0])}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('input[type="file"]').click()
          }}
          className="text-sm font-semibold text-amber-600 hover:underline"
        >
          Browse PDF
        </button>
      </div>

      {/* Compression level selector */}
      {file && (
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Document</p>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {numPages} page{numPages !== 1 ? 's' : ''} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button onClick={removeFile} className="text-xs text-rose-500 hover:underline">
              Change file
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Compression level</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {COMPRESSION_LEVELS.map((l) => {
                const isSelected = level === l.value
                return (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{l.label}</p>
                        <p className="text-[10px] text-gray-500">{l.desc}</p>
                      </div>
                      <div className="text-xs font-bold">{l.quality * 100}% quality</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Size comparison */}
      {newSize > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Results</p>
            </div>
            <button onClick={removeFile} className="text-xs text-rose-500 hover:underline">
              New file
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Original</p>
              <p className="text-sm font-bold text-gray-900">{fmtSize(originalSize)}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Compressed</p>
              <p className="text-sm font-bold text-amber-600">{fmtSize(newSize)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Reduction</p>
              <p className="text-sm font-bold text-gray-900">{savingsPct}%</p>
            </div>
          </div>

          {savings > 0 && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-800">Space saved</span>
              <span className="text-xs font-bold text-amber-800">{fmtSize(savings)}</span>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div className="pt-2">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span className="text-sm font-medium text-gray-900">Compressing… {progress}%</span>
          </div>
        ) : file ? (
          <button
            onClick={handleCompress}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Compress & Download
          </button>
        ) : null}
      </div>
    </div>
  )
}
