import { useParams } from 'react-router-dom'
import ToolViewer from '../../pages/student/ToolViewer'

// New in-app tools
import MergePDF from './pdf/MergePDF'
import SplitPDF from './pdf/SplitPDF'
import PDFToImage from './pdf/PDFToImage'
import ImageToPDF from './pdf/ImageToPDF'
import CompressPDF from './pdf/CompressPDF'
import CitationGenerator from './writing/CitationGenerator'
import TextAnalyzer from './writing/TextAnalyzer'
import TextSummarizer from './writing/TextSummarizer'

// Legacy external iframe tools handled by ToolViewer
const LEGACY_TOOLS = ['qr', 'ai-humanizer', 'cv-maker']

const IN_APP_TOOLS = {
  'merge-pdf': MergePDF,
  'split-pdf': SplitPDF,
  'pdf-to-image': PDFToImage,
  'image-to-pdf': ImageToPDF,
  'compress-pdf': CompressPDF,
  'citation-generator': CitationGenerator,
  'text-analyzer': TextAnalyzer,
  'ai-summarizer': TextSummarizer,
}

export default function ToolRouter() {
  const { toolId } = useParams()

  if (LEGACY_TOOLS.includes(toolId)) {
    return <ToolViewer toolKey={toolId} />
  }

  const ToolComponent = IN_APP_TOOLS[toolId]
  if (ToolComponent) {
    return <ToolComponent />
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen flex flex-col items-center justify-center py-20 text-center text-gray-900 dark:text-white">
      <div className="text-gray-400 text-xs font-bold uppercase tracking-wider dark:text-gray-500">Tool not found</div>
    </div>
  )
}
