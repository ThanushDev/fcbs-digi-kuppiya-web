import { useState, useEffect } from 'react'
import { getMentors } from '../../services/firestore'

export default function MentorsSection() {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await getMentors()
        setMentors(data)
      } catch (error) {
        console.error('Error loading mentors:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMentors()
  }, [])

  // Auto-transition mentors: Author (index 0) stays 10 minutes, others 4 seconds
  useEffect(() => {
    if (mentors.length === 0) return;

    let delay;
    if (activeIndex === 0) {
      delay = 600000; // 10 minutes for the Author (first mentor)
    } else {
      delay = 4000; // 4 seconds for all other mentors
    }

    const timer = setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % mentors.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [activeIndex, mentors.length]);

  if (loading) {
    return (
      <div className="card glass-panel mt-12 max-w-4xl mx-auto overflow-hidden">
        <div className="p-8 text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading mentors...</p>
        </div>
      </div>
    )
  }

  if (mentors.length === 0) {
    return (
      <div className="card glass-panel mt-12 max-w-4xl mx-auto overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <p className="text-sm text-gray-500">No mentors found. Contact your admin to add mentors.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card glass-panel mt-12 max-w-4xl mx-auto overflow-hidden">
      {/* Section Title */}
      <div className="mb-6 border-b border-gray-100 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-wide uppercase">Our Mentors</h3>
          <p className="text-xs text-gray-500">Learn from the experienced undergraduates</p>
        </div>
        {/* Manual Dots Controls */}
        <div className="flex space-x-1.5">
          {mentors.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative min-h-[220px] sm:min-h-[180px] flex items-center justify-center">
        {mentors.map((mentor, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={mentor.id}
              className={`absolute w-full flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 ease-in-out transform ${
                isActive
                  ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
              }`}
            >
              {/* Profile Image with Ring Effect */}
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl rotate-6 opacity-20 animate-pulse"></div>
                <img
                  src={mentor.imageUrl || mentor.image || '/default-avatar.png'}
                  alt={mentor.name}
                  className="h-full w-full object-cover rounded-2xl border-2 border-white shadow-md relative z-10"
                />
              </div>

              {/* Mentor Details */}
              <div className="text-center sm:text-left flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 justify-center sm:justify-start">
                  <h4 className="text-2xl font-extrabold text-gray-950 tracking-tight">{mentor.name}</h4>
                  {mentor.nickname && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full w-max mx-auto sm:mx-0">
                      "{mentor.nickname}"
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase">
                  {mentor.role}
                </p>

                <div className="pt-2 flex items-center justify-center sm:justify-start text-xs font-medium text-gray-500">
                  <span>Faculty Mentor</span>
                </div>
              </div>
            </div>
          )}
        )}
      </div>
    </div>
  )
}
