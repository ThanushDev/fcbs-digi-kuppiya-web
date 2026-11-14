import { useState, useCallback } from 'react'
import { Trash2, ArrowUp, ArrowDown, FilePlus, Download, Loader2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

export default function MergePDF() {
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const addFiles = useCallback((newFiles) => {
    const invalid = newFiles.find((f) => f.size > MAX_FILE_SIZE)
    if (invalid) {
      setError(`"${invalid.name}" exceeds the 15 MB limit.`)
      return
    }
    setFiles((prev) => [...prev, ...newFiles])
    setError(null)
  }, [])

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const moveFile = (index, direction) => {
    setFiles((prev) => {
      const next = [...prev]
      const target = direction === -1 ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const clearAll = () => {
    setFiles([])
    setError(null)
    setProgress(0)
  }

  const handleMerge = async () => {
    if (files.length === 0) {
      setError('Please add at least one PDF file.')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const mergedPdf = await PDFDocument.create()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'merged-document.pdf'
      link.click()
      URL.revokeObjectURL(url)

      setProgress(100)
    } catch (err) {
      setError('Failed to merge PDFs. Please ensure all files are valid PDFs.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Merge PDF</h2>
        <p className="text-sm text-gray-500">Combine multiple PDFs into a single file.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-indigo-200 hover:bg-indigo-50 transition" onDrop={(e) => {
        e.preventDefault()
        addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf'))
      }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => e.preventDefault()}>
        <FilePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-900 mb-1">Drop PDF files here</p>
        <p className="text-xs text-gray-500 mb-3">or click to browse</p>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files).filter((f) => f.type === 'application/pdf'))}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('input[type="file"]').click()
          }}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Browse PDFs
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Files to merge ({files.length})</span>
            <button onClick={clearAll} className="text-xs text-rose-500 hover:underline ml-auto">Clear all</button>
          </div>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs">
                PDF
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => moveFile(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveFile(index, 1)}
                  disabled={index === files.length - 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="pt-2">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">Merging… {progress}%</span>
          </div>
        ) : (
          <button
            onClick={handleMerge}
            disabled={files.length === 0 || isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <Download className="w-4 h-4 mr-2" /> Merge & Download PDF
          </button>
        )}
      </div>
    </div>
  )
}
