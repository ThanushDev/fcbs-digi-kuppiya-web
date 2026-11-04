require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Validate required env vars
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '))
  console.error('Make sure your .env file contains all VITE_FIREBASE_* variables')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const MENTORS = [
  { 
    name: "Mr.Thanush Nethsika", 
    nickname: "සයිබර්", 
    batch: "22/23", 
    role: "Author of FCBS DIGI KUPPIYA", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/cyber_jz6wx6.jpg", 
    department: "both",
    isOwner: true,
    title: "Mr",
    firstName: "Thanush",
    lastName: "Nethsika"
  },
  { 
    name: "Ms. Imalsha Sathsarani", 
    nickname: "", 
    batch: "22/23", 
    role: "Economics", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/ima_h6xjz3.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Imalsha",
    lastName: "Sathsarani"
  },
  { 
    name: "Ms. Kasuni Gaurika", 
    nickname: "", 
    batch: "22/23", 
    role: "Mathematics", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/kasuni_omcklq.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Kasuni",
    lastName: "Gaurika"
  },
  { 
    name: "Ms. Kavindi Nawodhya", 
    nickname: "", 
    batch: "22/23", 
    role: "Mathematics", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614076/nawodhya_ylxmlr.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Kavindi",
    lastName: "Nawodhya"
  },
  { 
    name: "Ms. Jayathri Indrachapa", 
    nickname: "මෙඩුසා", 
    batch: "22/23", 
    role: "Mathematics", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614067/chapa_drbwzz.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Jayathri",
    lastName: "Indrachapa"
  },
  { 
    name: "Ms. Kavithma Damindi", 
    nickname: "", 
    batch: "22/23", 
    role: "Management", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/kavithma_mmfkmr.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Kavithma",
    lastName: "Damindi"
  },
  { 
    name: "Ms. Naduni Rathnayaka", 
    nickname: "", 
    batch: "22/23", 
    role: "MIS", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614073/naduni_u9czqe.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Naduni",
    lastName: "Rathnayaka"
  },
  { 
    name: "Ms. Liyoni Kaushalya", 
    nickname: "ආල්‍යා", 
    batch: "21/22", 
    role: "MIS", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614069/liyoni_c4yb0l.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Liyoni",
    lastName: "Kaushalya"
  },
  { 
    name: "Ms. Thakshila Wijesekara", 
    nickname: "රපුන්සල්", 
    batch: "21/22", 
    role: "MIS", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614084/rapunsall_rbr0y0.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Thakshila",
    lastName: "Wijesekara"
  },
  { 
    name: "Ms. Dakshila Dilshani", 
    nickname: "", 
    batch: "22/23", 
    role: "Accounting", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/dakshi_vvtivc.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Dakshila",
    lastName: "Dilshani"
  },
  { 
    name: "Ms. Shashini Herath", 
    nickname: "ශ්‍රිනී", 
    batch: "21/22", 
    role: "Accounting", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614078/shashini_rhwepa.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Shashini",
    lastName: "Herath"
  },
  { 
    name: "Ms. Lihini Himasha", 
    nickname: "ලාරා", 
    batch: "21/22", 
    role: "Accounting", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614071/lihini_s8ymh1.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Lihini",
    lastName: "Himasha"
  },
  { 
    name: "Ms. Diwangani Kavindya", 
    nickname: "විනී", 
    batch: "21/22", 
    role: "Accounting", 
    image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614068/diwangani_cyokye.jpg", 
    department: "bms",
    isOwner: false,
    title: "Ms",
    firstName: "Diwangani",
    lastName: "Kavindya"
  },
]

async function migrateMentors() {
  console.log('Starting mentor migration...')
  const mentorsCol = collection(db, 'mentors')
  
  for (const mentor of MENTORS) {
    try {
      const docRef = await addDoc(mentorsCol, {
        ...mentor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      console.log(`✓ Added mentor: ${mentor.name} (ID: ${docRef.id})`)
    } catch (error) {
      console.error(`✗ Failed to add mentor ${mentor.name}:`, error)
    }
  }
  
  console.log('Migration complete!')
}

migrateMentors().then(() => {
  console.log('All mentors migrated successfully')
  process.exit(0)
}).catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})