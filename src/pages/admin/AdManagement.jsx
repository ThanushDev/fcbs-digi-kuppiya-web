import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useToast } from '../../contexts/ToastContext'
import {
  Image, Video, Plus, Trash2, ExternalLink, Power, Eye, MousePointerClick,
  Calendar, Clock, Link, Save, AlertTriangle, Play, List, BarChart3, ToggleLeft, ToggleRight
} from 'lucide-react'

const ADS_CONFIG_PATH = 'system_settings/ads_config'

export default function AdManagement() {
  const { showToast } = useToast()
  const [ads, setAds] = useState([])
  const [isSystemEnabled, setIsSystemEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    adType: 'image',
    mediaUrl: '',
    countdownDuration: 7,
    targetUrl: '',
    startDate: '',
    endDate: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Listen to global switch
  useEffect(() => {
    const unsub = onSnapshot(doc(db, ADS_CONFIG_PATH), (snap) => {
      if (snap.exists()) {
        setIsSystemEnabled(snap.data().isAdSystemEnabled === true)
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsub
  }, [])

  // Load ads
  const loadAds = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'sponsored_ads'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setAds(list)
    } catch {
      showToast('Failed to load ads', 'error')
    }
  }, [showToast])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  // Toggle global system switch
  const toggleSystem = async () => {
    try {
      const ref = doc(db, ADS_CONFIG_PATH)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { isAdSystemEnabled: !isSystemEnabled })
      } else {
        await setDoc(ref, { isAdSystemEnabled: true })
      }
      showToast(`Ad system ${!isSystemEnabled ? 'enabled' : 'disabled'}`, 'success')
    } catch {
      showToast('Failed to toggle system', 'error')
    }
  }

  const handleFormChange = (key) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm({ ...form, [key]: value })
  }

  const resetForm = () => {
    setForm({ adType: 'image', mediaUrl: '', countdownDuration: 7, targetUrl: '', startDate: '', endDate: '' })
    setShowForm(false)
  }

  const handleCreateAd = async (e) => {
    e.preventDefault()

    if (!form.mediaUrl.trim()) return showToast('Media URL is required', 'error')
    if (!form.targetUrl.trim()) return showToast('Target URL is required', 'error')
    if (!form.startDate) return showToast('Start date is required', 'error')
    if (!form.endDate) return showToast('End date is required', 'error')
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return showToast('End date must be after start date', 'error')
    }
    if (form.countdownDuration < 3) return showToast('Countdown must be at least 3 seconds', 'error')

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'sponsored_ads'), {
        adType: form.adType,
        mediaUrl: form.mediaUrl.trim(),
        countdownDuration: form.countdownDuration,
        targetUrl: form.targetUrl.trim(),
        startDate: Timestamp.fromDate(new Date(form.startDate + 'T00:00:00')),
        endDate: Timestamp.fromDate(new Date(form.endDate + 'T23:59:59')),
        impressionsCount: 0,
        clicksCount: 0,
        createdAt: new Date().toISOString()
      })
      showToast('Ad created successfully', 'success')
      resetForm()
      loadAds()
    } catch {
      showToast('Failed to create ad', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Delete this ad?')) return
    try {
      await deleteDoc(doc(db, 'sponsored_ads', adId))
      showToast('Ad deleted', 'success')
      loadAds()
    } catch {
      showToast('Failed to delete ad', 'error')
    }
  }

  const totalImpressions = ads.reduce((s, a) => s + (a.impressionsCount || 0), 0)
  const totalClicks = ads.reduce((s, a) => s + (a.clicksCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Ad Management
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage sponsored advertisements and view analytics</p>
        </div>
      </div>

      {/* Global Master Switch & Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Master Toggle */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSystemEnabled ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                <Power className={`w-4 h-4 ${isSystemEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Global Ad System</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                  isSystemEnabled ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  {isSystemEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSystem}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                isSystemEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-label="Toggle ad system"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isSystemEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
            {isSystemEnabled
              ? 'Active ads will be shown to users on dashboard visit with forced countdown.'
              : 'All ad popups are bypassed site-wide.'}
          </p>
        </div>

        {/* Impressions */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalImpressions}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Impressions</p>
            </div>
          </div>
        </div>

        {/* Clicks */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalClicks}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Clicks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ad Button + Form */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-800">{showForm ? 'Close Form' : 'Create New Ad'}</span>
          </div>
          <span className={`text-slate-400 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`}>
            <Plus className="w-4 h-4" />
          </span>
        </button>

        {showForm && (
          <form onSubmit={handleCreateAd} className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            {/* Ad Type Toggle */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-2 block">Ad Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, adType: 'image' })}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    form.adType === 'image'
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  <Image className="w-3.5 h-3.5" /> Image
                </button>
                <button type="button" onClick={() => setForm({ ...form, adType: 'video' })}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    form.adType === 'video'
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  <Video className="w-3.5 h-3.5" /> Video
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Media URL */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Image className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Media URL <span className="text-rose-400">*</span>
                </label>
                <input type="url" value={form.mediaUrl} onChange={handleFormChange('mediaUrl')}
                  placeholder="https://example.com/ad-image.jpg"
                  className="input-field py-2 text-xs" required />
              </div>

              {/* Target URL */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Link className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Target URL <span className="text-rose-400">*</span>
                </label>
                <input type="url" value={form.targetUrl} onChange={handleFormChange('targetUrl')}
                  placeholder="https://example.com/landing-page"
                  className="input-field py-2 text-xs" required />
              </div>

              {/* Countdown Duration */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Countdown (seconds)
                </label>
                <input type="number" min={3} max={60} value={form.countdownDuration}
                  onChange={handleFormChange('countdownDuration')}
                  className="input-field py-2 text-xs" />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Start Date <span className="text-rose-400">*</span>
                </label>
                <input type="date" value={form.startDate} onChange={handleFormChange('startDate')}
                  className="input-field py-2 text-xs" required />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  End Date <span className="text-rose-400">*</span>
                </label>
                <input type="date" value={form.endDate} onChange={handleFormChange('endDate')}
                  className="input-field py-2 text-xs" required />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition shadow-sm shadow-indigo-200 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Ad'}
            </button>
          </form>
        )}
      </div>

      {/* Ads List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <List className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">All Ads ({ads.length})</span>
        </div>

        {ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BarChart3 className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-xs font-medium">No ads created yet</p>
            <p className="text-[10px] text-slate-300 mt-1">Click "Create New Ad" above to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ads.map((ad) => {
              const start = ad.startDate?.toDate ? ad.startDate.toDate() : new Date(ad.startDate);
              const end = ad.endDate?.toDate ? ad.endDate.toDate() : new Date(ad.endDate);
              const now = new Date();
              return (
                <div key={ad.id} className="px-5 py-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Type Badge */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        ad.adType === 'video' ? 'bg-purple-100' : 'bg-indigo-100'
                      }`}>
                        {ad.adType === 'video'
                          ? <Video className={`w-4 h-4 text-purple-500`} />
                          : <Image className="w-4 h-4 text-indigo-500" />
                        }
                      </div>

                      {/* Ad Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            ad.adType === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {ad.adType}
                          </span>
                          {end >= now && start <= now && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Active</span>
                          )}
                          {end < now && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Expired</span>
                          )}
                          {start > now && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Scheduled</span>
                          )}
                        </div>

                        {/* URL Preview */}
                        <p className="text-[11px] text-slate-500 mt-1 truncate">{ad.mediaUrl}</p>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {start.toLocaleDateString()} - {end.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ad.countdownDuration || 7}s
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {ad.impressionsCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" />
                            {ad.clicksCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => handleDeleteAd(ad.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}