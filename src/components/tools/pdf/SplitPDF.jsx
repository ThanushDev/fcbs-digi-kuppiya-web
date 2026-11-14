import { useState, useCallback } from 'react'
import { Scissors, Loader2, FileType } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

export default function SplitPDF() {
  const [file, setFile] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  // Freshly read the File into an ArrayBuffer on demand.
  // A brand-new buffer is created every time, so it can never be detached.
  const readBuffer = useCallback(async () => {
    if (!file) return null
    return await file.arrayBuffer()
  }, [file])

  const loadPdf = useCallback(async (selectedFile) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`"${selectedFile.name}" exceeds the 15 MB limit.`)
      return
    }
    try {
      const pdf = await PDFDocument.load(await selectedFile.arrayBuffer())
      const pages = pdf.getPageCount()
      setFile(selectedFile)
      setTotalPages(pages)
      setStartPage(1)
      setEndPage(pages)
      setError(null)
      setProgress(0)
    } catch (err) {
      setError('Failed to load PDF. Please upload a valid PDF file.')
      console.error(err)
    }
  }, [])

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file first.')
      return
    }
    const start = Math.max(1, Math.min(startPage, totalPages))
    const end = Math.max(start, Math.min(endPage, totalPages))
    setStartPage(start)
    setEndPage(end)

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Freshly read buffer each time — never shares/detaches state.
      const arrayBuffer = await readBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const newPdf = await PDFDocument.create()

      // Map 1-indexed user input (page 1, 2, ...) to 0-indexed pdf-lib indices.
      const pageIndices = []
      for (let p = start - 1; p <= end - 1; p++) pageIndices.push(p)

      // copyPages must be called on the DESTINATION document (newPdf),
      // passing the SOURCE document (pdf). Copying from the same document
      // into itself causes ForeignPageError.
      const copiedPages = await newPdf.copyPages(pdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `split-pages-${start}-to-${end}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      setProgress(100)
    } catch (err) {
      setError('Failed to split PDF. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setTotalPages(0)
    setStartPage(1)
    setEndPage(1)
    setError(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Split PDF</h2>
        <p className="text-sm text-gray-500">Extract a page range into a new PDF.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Upload */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-emerald-200 hover:bg-emerald-50 transition" onDrop={(e) => {
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
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          Browse PDF
        </button>
      </div>

      {/* Page range controls */}
      {file && (
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Document</p>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalPages} page{totalPages !== 1 ? 's' : ''} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button onClick={removeFile} className="text-xs text-rose-500 hover:underline">
              Change file
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start page</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={startPage}
                onChange={(e) => setStartPage(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages)))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End page</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={endPage}
                onChange={(e) => setEndPage(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages)))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Pages {startPage} to {endPage} will be extracted ({endPage - startPage + 1} page{endPage - startPage + 1 !== 1 ? 's' : ''}).
          </p>
        </div>
      )}

      {/* Action */}
      <div className="pt-2">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span className="text-sm font-medium text-gray-900">Splitting… {progress}%</span>
          </div>
        ) : file ? (
          <button
            onClick={handleSplit}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <Scissors className="w-4 h-4 mr-2" /> Extract & Download
          </button>
        ) : null}
      </div>
    </div>
  )
}
