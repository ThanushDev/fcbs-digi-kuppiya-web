import { useState, useCallback, useEffect } from 'react'
import { ImageMinus, Download, Loader2, RefreshCw } from 'lucide-react'
import { getDocument, GlobalWorkerOptions, VerbosityLevel } from 'pdfjs-dist'
import JSZip from 'jszip'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

// Configure the PDF.js worker source so pdfjs-dist never throws a missing
// workerSrc error. The worker is not used at runtime (disableWorker: true),
// but workerSrc must be defined for the library to initialize cleanly.
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs`

export default function PDFToImage() {
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [previews, setPreviews] = useState([])
  const [isRendering, setIsRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Revoke the previous object URL when the file changes to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  const loadPdf = useCallback(async (selectedFile) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`"${selectedFile.name}" exceeds the 15 MB limit.`)
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
      setPreviews([])
      setError(null)
      setProgress(0)
    } catch (err) {
      const msg = err?.message || 'Failed to load PDF.'
      setError(`Unable to read "${selectedFile.name}". ${msg}`)
      console.error('PDFToImage loadPdf error:', err)
    }
  }, [fileUrl])

  const renderPages = async () => {
    if (!fileUrl) return
    setIsRendering(true)
    setProgress(0)
    setError(null)

    try {
      const loadingTask = getDocument({ url: fileUrl, disableWorker: true, verbosity: VerbosityLevel.ERRORS })
      const pdf = await loadingTask.promise

      const pages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const dataUrl = canvas.toDataURL('image/png')
        pages.push({ page: i, dataUrl })
        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      setPreviews(pages)
    } catch (err) {
      const msg = err?.message || 'Failed to render PDF pages.'
      setError(`Rendering failed: ${msg}`)
      console.error('PDFToImage renderPages error:', err)
    } finally {
      setIsRendering(false)
    }
  }

  const downloadImage = (dataUrl, fileName) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName
    link.click()
  }

  const downloadAll = async () => {
    if (previews.length === 0) return
    const zip = new JSZip()
    const folder = zip.folder('pdf-images')
    previews.forEach((p) => {
      const base64 = p.dataUrl.split(',')[1]
      folder.file(`page-${String(p.page).padStart(3, '0')}.png`, base64, { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pdf-images.zip'
    link.click()
    URL.revokeObjectURL(url)
  }

  const removeFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    setFile(null)
    setFileUrl(null)
    setNumPages(0)
    setPreviews([])
    setError(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">PDF to Image</h2>
        <p className="text-sm text-gray-500">Convert PDF pages to high-resolution PNG images.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Upload */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-rose-200 hover:bg-rose-50 transition" onDrop={(e) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f && f.type === 'application/pdf') loadPdf(f)
      }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => e.preventDefault()}>
        <ImageMinus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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
          className="text-sm font-semibold text-rose-600 hover:underline"
        >
          Browse PDF
        </button>
      </div>

      {/* Controls */}
      {file && (
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Document</p>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{numPages} page{numPages !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={removeFile} className="text-xs text-rose-500 hover:underline">
              Change file
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isRendering ? (
              <button
                onClick={renderPages}
                disabled
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm font-bold text-gray-500 cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Rendering {progress}%
              </button>
            ) : (
              <button
                onClick={renderPages}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Render Pages
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Previews ({previews.length})</h3>
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 hover:bg-gray-50 transition"
            >
              <Download className="w-3 h-3" /> Download All (ZIP)
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {previews.map((p) => (
              <div key={p.page} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
                <img
                  src={p.dataUrl}
                  alt={`Page ${p.page}`}
                  className="w-full h-40 object-cover bg-gray-50"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900">Page {p.page}</p>
                  <button
                    onClick={() => downloadImage(p.dataUrl, `page-${String(p.page).padStart(3, '0')}.png`)}
                    className="w-full mt-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Download PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
