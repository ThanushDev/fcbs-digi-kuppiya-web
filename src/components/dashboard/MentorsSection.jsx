import { useState, useEffect } from 'react'

// 🧑‍🏫 මෙන්ටර්ස්ලාගේ ඩේටා ටික (ඔයාට කැමති විදිහට මේවා වෙනස් කරගන්න පුළුවන් මචං)
const MENTORS = [
  {
    name: "Mr.Thanush Nethsika",
    nickname: "සයිබර්",
    batch: "22/23",
    role: "Author of FCBS DIGI KUPPIYA ",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/cyber_jz6wx6.jpg", // මෙතනට ඔයාගේ ඉමේජ් පාත් එක දෙන්න
  },
  {
    name: "Ms. Imalsha Sathsarani",
    batch: "22/23",
    role: "Economics",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/ima_h6xjz3.jpg",
  },
  {
    name: "Ms. Kasuni Gaurika",
    batch: "22/23",
    role: "Mathematics",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/kasuni_omcklq.jpg",
  },
  {
    name: "Ms. Kavindi Nawodhya",
    batch: "22/23",
    role: "Mathematics",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614076/nawodhya_ylxmlr.jpg",
  },
  {
    name: "Ms. Jayathri Indrachapa",
    nickname: "මෙඩුසා",
    batch: "22/23",
    role: "Mathematics",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614067/chapa_drbwzz.jpg",
  },
  {
    name: "Ms. Kavithma Damindi",
    batch: "22/23",
    role: "Management",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/kavithma_mmfkmr.jpg",
  },
  {
    name: "Ms.Naduni Rathnayaka",
    batch: "22/23",
    role: "MIS",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614073/naduni_u9czqe.jpg",
  },
  {
    name: "Ms.Liyoni Kaushalya",
    nickname: "ආල්‍යා",
    batch: "21/22",
    role: "MIS",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614069/liyoni_c4yb0l.jpg",
  },
  {
    name: "Ms. Thakshila Wijesekara",
    nickname: "රපුන්සල්",
    batch: "21/22",
    role: "MIS",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614084/rapunsall_rbr0y0.jpg",
  },
  {
    name: "Ms. Dakshila Dilshani",
    batch: "22/23",
    role: "Accounting",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/dakshi_vvtivc.jpg",
  },
  {
    name: "Ms. Shashini Herath",
    nickname: "ශ්‍රිනී",
    batch: "21/22",
    role: "Accounting",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614078/shashini_rhwepa.jpg",
  },
  {
    name: "Ms. Lihini Himasha",
    nickname: "ලාරා",
    batch: "21/22",
    role: "Accounting",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614071/lihini_s8ymh1.jpg",
  },
  {
    name: "Ms. Diwangani Kavindya",
    nickname: "විනී",
    batch: "21/22",
    role: "Accounting",
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614068/diwangani_cyokye.jpg",
  },
]

export default function MentorsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  // ⏱️ තත්පර 4න් හතරට මෙන්ටර්ස්ලා auto transition වෙන්න හැදුවා
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % MENTORS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 max-w-4xl mx-auto overflow-hidden">
      {/* Section Title */}
      <div className="mb-6 border-b border-gray-100 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-wide uppercase">Our Mentors</h3>
          <p className="text-xs text-gray-500">Learn from the experienced undergraduates</p>
        </div>
        {/* Manual Dots Controls */}
        <div className="flex space-x-1.5">
          {MENTORS.map((_, idx) => (
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
        {MENTORS.map((mentor, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={mentor.name}
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
                  src={mentor.image}
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

                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-gray-500">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                    Batch: {mentor.batch}
                  </span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  <span>Faculty Mentor</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}