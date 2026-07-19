import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, AlertTriangle, Target } from 'lucide-react'

const GRADE_PERCENTAGES = {
  'A+': 75,
  'A': 70,
  'A-': 65,
  'B+': 60,
  'B': 55,
  'B-': 50,
  'C+': 45,
  'C': 40,
  'C-': 35,
}

export default function CACalculator() {
  const navigate = useNavigate()
  const [caMarks, setCaMarks] = useState('')
  const [desiredGrade, setDesiredGrade] = useState('')
  const [resultHTML, setResultHTML] = useState(null)

  const handleCalculate = () => {
    const ca = parseFloat(caMarks)
    const grade = desiredGrade
    const requiredPercentage = GRADE_PERCENTAGES[grade]

    if (isNaN(ca) || ca < 0 || ca > 35) {
      setResultHTML(<span className="text-red-600 font-medium">Please enter a valid CA mark between 0 and 35.</span>)
      return
    }
    if (!grade || !requiredPercentage) {
      setResultHTML(<span className="text-red-600 font-medium">Please select a desired grade.</span>)
      return
    }

    const requiredTotalMarks = requiredPercentage
    const neededPaperContribution = requiredTotalMarks - ca

    if (neededPaperContribution < 0) {
      setResultHTML(
        <div className="space-y-1">
          <p className="text-lg font-bold text-emerald-600 flex items-center gap-2">
            <Trophy className="w-5 h-5 inline text-emerald-600" /> Congratulations! <Trophy className="w-5 h-5 inline text-emerald-600" />
          </p>
          <p className="text-gray-700">
            Your current <strong>CA Marks ({ca})</strong> are already high enough to guarantee an{' '}
            <strong>{grade}</strong> or better, even if you score 0 on the paper.
          </p>
        </div>
      )
      return
    }

    const neededPaperMarkOutOf100 = neededPaperContribution / 0.65

    if (neededPaperMarkOutOf100 > 100) {
      setResultHTML(
        <div className="space-y-1">
          <p className="text-lg font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 inline text-red-600" /> Grade IMPOSSIBLE! <AlertTriangle className="w-5 h-5 inline text-red-600" />
          </p>
          <p className="text-gray-700">
            To get an <strong>{grade}</strong> (min {requiredPercentage}%), you need{' '}
            {neededPaperContribution.toFixed(2)} marks out of 65 from the paper. This would require you to score{' '}
            <strong>{neededPaperMarkOutOf100.toFixed(2)} out of 100</strong> on the final paper, which is impossible.
          </p>
        </div>
      )
    } else {
      setResultHTML(
        <div className="space-y-1">
          <p className="text-lg font-bold text-indigo-600 flex items-center gap-2">
            <Target className="w-5 h-5 inline text-indigo-600" /> To achieve an {grade}: <Target className="w-5 h-5 inline text-indigo-600" />
          </p>
          <p className="text-gray-700">
            You need a minimum of <strong>{neededPaperMarkOutOf100.toFixed(2)} out of 100</strong> on the final paper.
          </p>
        </div>
      )
    }
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 transition flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">CA Grade Target Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">
        CA Marks are out of 35. Final Paper Marks are out of 65 (calculated from 100).
      </p>

      <div className="card p-6 mb-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current CA Marks (out of 35):
            </label>
            <input
              type="number"
              value={caMarks}
              onChange={e => setCaMarks(e.target.value)}
              min="0"
              max="35"
              className="input-field"
              placeholder="Enter CA marks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Final Grade:
            </label>
            <select
              value={desiredGrade}
              onChange={e => setDesiredGrade(e.target.value)}
              className="select-field"
            >
              <option value="">-- Select Grade --</option>
              <option value="A+">A+ (75% and above)</option>
              <option value="A">A (70% - 74%)</option>
              <option value="A-">A- (65% - 69%)</option>
              <option value="B+">B+ (60% - 64%)</option>
              <option value="B">B (55% - 59%)</option>
              <option value="B-">B- (50% - 54%)</option>
              <option value="C+">C+ (45% - 49%)</option>
              <option value="C">C (40% - 44%)</option>
              <option value="C-">C- (35% - 39%)</option>
            </select>
          </div>

          <button onClick={handleCalculate} className="btn-primary w-full">
            Calculate Paper Mark
          </button>
        </div>

        {resultHTML && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
              {resultHTML}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
