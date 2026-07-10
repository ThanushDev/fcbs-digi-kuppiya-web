import { useParams } from 'react-router-dom'

const TOOLS_MAP = {
  'qr': { title: 'QR Code Generator', url: 'https://thanushdev.github.io/Qr-Genarater/' },
  'ai-humanizer': { title: 'AI Humanizer', url: 'https://thanushdev.github.io/AI-Humanizer/' },
  'cv-maker': { title: 'Premium CV Maker', url: 'https://thanushdev.github.io/DigiSolutionsCV/' },
  'pdf-tool': { title: 'PDF Generator Tool', url: 'https://thanushdev.github.io/Pdftool/' },
}

export default function ToolViewer() {
  const { toolKey } = useParams()
  const tool = TOOLS_MAP[toolKey]

  if (!tool) {
    return <div className="text-center py-16 text-gray-500">Tool not found.</div>
  }

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white/[0.02]">
      {/* Dynamic Tool Title Header */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span>🛠️</span> {tool.title}
        </h1>
        <span className="text-[10px] bg-indigo-600/10 border border-indigo-500/20 px-2.5 py-1 rounded-md text-indigo-400 font-semibold uppercase tracking-wider">
          In-App Mode
        </span>
      </div>

      {/* 🔮 Embedded Iframe Player */}
      <div className="flex-1 bg-white">
        <iframe
          src={tool.url}
          title={tool.title}
          className="w-full h-full border-none"
          allow="clipboard-write"
        />
      </div>
    </div>
  )
}