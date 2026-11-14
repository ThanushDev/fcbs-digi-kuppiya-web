import { useState, useCallback } from 'react'
import { Download, Loader2, Trash2, ArrowUp, ArrowDown, FilePlus } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per image

export default function ImageToPDF() {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const addFiles = useCallback((newFiles) => {
    const images = newFiles.filter((f) => f.type.startsWith('image/'))
    const invalid = newFiles.find((f) => f.type.startsWith('image/') && f.size > MAX_FILE_SIZE)
    if (invalid) {
      setError(`"${invalid.name}" exceeds the 10 MB limit.`)
      return
    }
    const nonImage = newFiles.find((f) => !f.type.startsWith('image/'))
    if (nonImage) {
      setError(`"${nonImage.name}" is not an image file.`)
      return
    }
    setFiles((prev) => {
      const next = [...prev, ...images]
      return next
    })
    setError(null)

    // Generate previews
    images.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => ({ ...prev, [f.name + f.size]: e.target.result }))
      }
      reader.readAsDataURL(f)
    })
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
    setPreviews({})
    setError(null)
  }

  const handleCreate = async () => {
    if (files.length === 0) {
      setError('Please add at least one image.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const pdfDoc = await PDFDocument.create()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const arrayBuffer = await file.arrayBuffer()
        let image
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer)
        } else {
          image = await pdfDoc.embedPng(arrayBuffer)
        }

        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'images-combined.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to create PDF. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Image to PDF</h2>
        <p className="text-sm text-gray-500">Combine JPG/PNG images into a single PDF.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-blue-200 hover:bg-blue-50 transition" onDrop={(e) => {
        e.preventDefault()
        addFiles(Array.from(e.dataTransfer.files))
      }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => e.preventDefault()}>
        <FilePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-900 mb-1">Drop images here</p>
        <p className="text-xs text-gray-500 mb-3">or click to browse</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files))}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('input[type="file"]').click()
          }}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Browse Images
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Images ({files.length})</span>
            <button onClick={clearAll} className="text-xs text-rose-500 hover:underline ml-auto">Clear all</button>
          </div>
          {files.map((file, index) => {
            const previewKey = file.name + file.size
            return (
              <div key={previewKey} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs">
                  IMG
                </span>
                {previews[previewKey] && (
                  <img
                    src={previews[previewKey]}
                    alt={file.name}
                    className="h-8 w-8 rounded-md object-cover bg-gray-50"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
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
            )}
          )}
        </div>
      )}

      {/* Action */}
      <div className="pt-2">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Creating PDF…</span>
          </div>
        ) : (
          <button
            onClick={handleCreate}
            disabled={files.length === 0 || isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <Download className="w-4 h-4 mr-2" /> Create PDF
          </button>
        )}
      </div>
    </div>
  )
}
