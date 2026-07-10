import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../services/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const EXPENSE_CATEGORIES = ['Rent', 'Tuition/Books', 'Groceries', 'Dining Out', 'Transport', 'Utilities', 'Social/Fun', 'Health', 'Other']
const INCOME_CATEGORIES = ['Job/Salary', 'Scholarship', 'Loan', 'Parents/Gift', 'Other Income']
const CHART_COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#8B5CF6']
const HIGH_EXPENSE_THRESHOLD = 10000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const formatCurrency = (amount) =>
  `LKR ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

export default function FinanceTracker() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formType, setFormType] = useState('expense')
  const [formDate, setFormDate] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedDayTxns, setSelectedDayTxns] = useState(null)
  const modalRef = useRef(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  // Real-time Firestore listener
  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user?.uid])

  // Filter transactions for current month
  const monthTransactions = transactions.filter(t => {
    if (!t.date) return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === month && d.getFullYear() === year
  })

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netBalance = totalIncome - totalExpenses

  // Expense category breakdown for chart
  const expenseCategories = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {})

  const categoryLabels = Object.keys(expenseCategories).filter(c => expenseCategories[c] > 0)
  const categoryValues = categoryLabels.map(c => expenseCategories[c])

  // Savings tips
  const savingsTips = []
  if (categoryLabels.length > 0) {
    let maxCat = null, maxAmt = 0
    for (const cat in expenseCategories) {
      if (expenseCategories[cat] > maxAmt) {
        maxAmt = expenseCategories[cat]
        maxCat = cat
      }
    }
    if (maxCat && maxAmt > totalExpenses * 0.15) {
      const pct = (maxAmt / totalExpenses * 100).toFixed(0)
      savingsTips.push(`Major Spending Alert: ${maxCat} accounts for ${pct}% of your total expenses!`)
    }
    if (expenseCategories['Dining Out'] && expenseCategories['Dining Out'] > 15000) {
      savingsTips.push(`Try cooking at home! Your Dining Out expenses (${formatCurrency(expenseCategories['Dining Out'])}) are quite high this month.`)
    }
    if (expenseCategories['Other'] && expenseCategories['Other'] > 7500) {
      savingsTips.push(`High 'Other' spending (${formatCurrency(expenseCategories['Other'])}). Try categorizing these items better.`)
    }
  }

  const goPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const openAddModal = (dateStr) => {
    setFormType('expense')
    setFormDate(dateStr || '')
    setFormAmount('')
    setFormCategory('')
    setFormDescription('')
    setShowModal(true)
  }

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayTxns = transactions.filter(t => t.date === dateStr)
    if (dayTxns.length > 0) {
      setSelectedDayTxns({ date: dateStr, transactions: dayTxns })
    } else {
      setSelectedDayTxns(null)
    }
    openAddModal(dateStr)
  }

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await deleteDoc(doc(db, 'transactions', txnId))
    } catch (err) {
      alert('Error deleting transaction: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formDate || !formAmount || !formCategory) {
      alert('Please fill in all required fields.')
      return
    }
    const amount = parseFloat(formAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        title: formDescription || `${formType === 'expense' ? 'Expense' : 'Income'} - ${formCategory}`,
        amount,
        type: formType,
        category: formCategory,
        date: formDate,
        createdAt: serverTimestamp(),
      })
      setShowModal(false)
    } catch (err) {
      alert('Error saving transaction: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Close modal on backdrop click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModal(false)
      }
    }
    if (showModal) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [showModal])

  // Doughnut chart conic gradient
  const totalCatValue = categoryValues.reduce((a, b) => a + b, 0)
  let cumPct = 0
  const gradientParts = categoryLabels.map((label, i) => {
    const pct = categoryValues[i] / totalCatValue
    const start = cumPct * 100
    cumPct += pct
    const end = cumPct * 100
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${end}%`
  })

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-indigo-600 transition flex items-center gap-1">
          <span>&larr;</span> Back to Dashboard
        </button>
        <button onClick={() => openAddModal('')}
          className="btn-primary text-sm">
          + Add Transaction
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance Tracker</h1>

      {/* Month Navigation */}
      <div className="card p-4 mb-6 flex items-center justify-between">
        <button onClick={goPrevMonth} className="text-gray-500 hover:text-indigo-600 text-xl px-2">&larr;</button>
        <h2 className="text-lg font-bold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={goNextMonth} className="text-gray-500 hover:text-indigo-600 text-xl px-2">&rarr;</button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar + Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Calendar</h3>
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {WEEKDAYS.map(d => (
                  <div key={d} className="bg-gray-50 text-center text-[11px] font-bold text-gray-500 py-2">{d}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white min-h-[60px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayTxns = monthTransactions.filter(t => t.date === dateStr)
                  const dayExpense = dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
                  const dayIncome = dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

                  let indicatorColor = 'bg-emerald-400'
                  if (dayExpense > 0 && dayExpense <= HIGH_EXPENSE_THRESHOLD) indicatorColor = 'bg-amber-400'
                  else if (dayExpense > HIGH_EXPENSE_THRESHOLD) indicatorColor = 'bg-red-500'

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className="bg-white min-h-[60px] p-1.5 cursor-pointer hover:bg-indigo-50 transition relative"
                    >
                      <span className="text-xs font-semibold text-gray-800">{day}</span>
                      {dayTxns.length > 0 && (
                        <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${indicatorColor}`} />
                      )}
                      {dayExpense > 0 && (
                        <p className="text-[9px] text-red-500 leading-tight mt-0.5 truncate">-{formatCurrency(dayExpense)}</p>
                      )}
                      {dayIncome > 0 && (
                        <p className="text-[9px] text-emerald-600 leading-tight truncate">+{formatCurrency(dayIncome)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium">Total Income</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium">Total Expenses</p>
                <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className={`${netBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} rounded-xl p-4`}>
                <p className={`text-xs ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'} font-medium`}>Net Balance</p>
                <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-red-700'} mt-1`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
            </div>

            {/* Transaction List */}
            {transactions.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h3>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {transactions.slice(0, 20).map(t => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.title || t.category}</p>
                          <p className="text-[10px] text-gray-400">{t.date} {t.category && `· ${t.category}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        <button onClick={() => handleDeleteTransaction(t.id)}
                          className="text-gray-300 hover:text-red-500 transition text-sm">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chart + Tips */}
          <div className="space-y-6">
            {/* Expense Chart */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Distribution</h3>
              {categoryValues.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 rounded-full" style={{
                    background: `conic-gradient(${gradientParts.join(', ')})`
                  }}>
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                  <div className="mt-4 w-full space-y-1.5">
                    {categoryLabels.map((label, i) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-gray-600">{label}</span>
                        </div>
                        <span className="font-medium text-gray-800">{formatCurrency(categoryValues[i])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No expenses recorded this month.</p>
              )}
            </div>

            {/* Savings Tips */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Savings Suggestions</h3>
              {savingsTips.length > 0 ? (
                <ul className="space-y-2">
                  {savingsTips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {tip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  {transactions.length === 0
                    ? 'No transactions yet. Start tracking to get personalized tips!'
                    : 'Great job! No major spending alerts this month.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <div className={`px-5 py-3 rounded-t-2xl flex items-center justify-between ${formType === 'expense' ? 'bg-red-500' : 'bg-emerald-500'}`}>
              <h3 className="text-sm font-bold text-white">
                Add New {formType === 'expense' ? 'Expense' : 'Income'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type switcher */}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setFormType('expense'); setFormCategory('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${formType === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
                  Expense
                </button>
                <button type="button" onClick={() => { setFormType('income'); setFormCategory('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${formType === 'income' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="input-field" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (LKR)</label>
                <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                  className="input-field" placeholder="0.00" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="select-field" required>
                  <option value="">-- Select Category --</option>
                  {(formType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  className="input-field" placeholder="Optional" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition ${formType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:opacity-50`}>
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
