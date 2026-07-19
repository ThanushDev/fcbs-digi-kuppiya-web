import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { collection, getDocs, doc, updateDoc, increment, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './AuthContext'

const AdsContext = createContext(null)

const ADS_CONFIG_PATH = 'system_settings/ads_config'
const ADS_CACHE_KEY = 'fcbs_ad_view_dates'
const MAX_DAILY_VIEWS = 5

export function AdsProvider({ children }) {
  const { user, userData } = useAuth()
  const [isAdSystemEnabled, setIsAdSystemEnabled] = useState(false)
  const [currentAd, setCurrentAd] = useState(null)
  const [showAdPopup, setShowAdPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const dailyCountRef = useRef(0)

  // System status track කරන්න useRef එකක් ගන්නවා immediate checking වලට
  const isSystemEnabledRef = useRef(false)

  // Listen to the global master switch
  useEffect(() => {
    const unsub = onSnapshot(doc(db, ADS_CONFIG_PATH), (snap) => {
      if (snap.exists()) {
        const enabled = snap.data().isAdSystemEnabled === true
        setIsAdSystemEnabled(enabled)
        isSystemEnabledRef.current = enabled
      }
      setLoading(false)
    }, () => {
      setIsAdSystemEnabled(false)
      isSystemEnabledRef.current = false
      setLoading(false)
    })
    return unsub
  }, [])

  // Load daily view count from localStorage
  const getDailyCount = useCallback(() => {
    try {
      const raw = localStorage.getItem(ADS_CACHE_KEY)
      if (!raw) return 0
      const data = JSON.parse(raw)
      const today = new Date().toISOString().split('T')[0]
      if (data.date !== today) return 0
      return data.count || 0
    } catch {
      return 0
    }
  }, [])

  // Update daily view count in localStorage
  const incrementDailyCount = useCallback(() => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const count = getDailyCount() + 1
      localStorage.setItem(ADS_CACHE_KEY, JSON.stringify({ date: today, count }))
      dailyCountRef.current = count
      return count
    } catch {
      return 0
    }
  }, [getDailyCount])

  // Fetch a random active ad
  const fetchRandomAd = useCallback(async () => {
    try {
      const adsRef = collection(db, 'sponsored_ads')
      const jsNow = new Date()
      
      const allSnap = await getDocs(adsRef)
      let ads = allSnap.docs.map(d => {
        const data = d.data()
        const start = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate)
        const end = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
        return { id: d.id, ...data, _start: start, _end: end }
      }).filter(ad => ad._start <= jsNow && ad._end >= jsNow)

      // මෙතන තිබ්බ console.log එක අයින් කළා
      if (ads.length === 0) return null
      
      const picked = ads[Math.floor(Math.random() * ads.length)]
      // මෙතන තිබ්බ console.log එකත් අයින් කළා
      
      return picked
    } catch (err) {
      // එරර් එකක් ආවොත් පේන console.error එකත් අයින් කළා
      return null
    }
  }, [])

  // Record an impression
  const recordImpression = useCallback(async (adId) => {
    try {
      const adRef = doc(db, 'sponsored_ads', adId)
      await updateDoc(adRef, { impressionsCount: increment(1) })
    } catch {
      // silent
    }
  }, [])

  // Record a click
  const recordClick = useCallback(async (adId) => {
    try {
      const adRef = doc(db, 'sponsored_ads', adId)
      await updateDoc(adRef, { clicksCount: increment(1) })
    } catch {
      // silent
    }
  }, [])

  // Attempt to show an ad — called after login / dashboard mount
  const tryShowAd = useCallback(async () => {
    // state එක වෙනස් වෙනකන් ඉන්නැතුව immediate reference එකෙන් check කරනවා
    if (!user || !isSystemEnabledRef.current || (userData?.role || '').startsWith('admin') || userData?.role === 'super_admin') {
      setShowAdPopup(false)
      return
    }

    const daily = getDailyCount()
    dailyCountRef.current = daily
    if (daily >= MAX_DAILY_VIEWS) {
      setShowAdPopup(false)
      return
    }

    const ad = await fetchRandomAd()
    if (!ad) {
      setShowAdPopup(false)
      return
    }

    setCurrentAd(ad)
    setShowAdPopup(true)
    incrementDailyCount()
    recordImpression(ad.id)
  }, [user, userData, getDailyCount, fetchRandomAd, incrementDailyCount, recordImpression])

  const dismissAd = useCallback(() => {
    setShowAdPopup(false)
    setCurrentAd(null)
  }, [])

  const handleAdClick = useCallback(async (ad) => {
    if (ad?.id) {
      await recordClick(ad.id)
    }
    if (ad?.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer')
    }
  }, [recordClick])

  return (
    <AdsContext.Provider value={{
      isAdSystemEnabled,
      currentAd,
      showAdPopup,
      loading,
      tryShowAd,
      dismissAd,
      handleAdClick,
      dailyViewCount: dailyCountRef.current,
      maxDailyViews: MAX_DAILY_VIEWS
    }}>
      {children}
    </AdsContext.Provider>
  )
}

export const useAds = () => useContext(AdsContext)