import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { v2: cloudinary } = require('cloudinary');

// 1. Firebase Initialize කිරීම
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 2. Cloudinary Configuration (Credentials ටික ගානට සෙට් කළා මචං)
cloudinary.config({
  cloud_name: 'ddn08cpkt',
  api_key: '767641318885295', 
  api_secret: 'XHfYyBVRZTrjPhi47GpKSuk-rYI' // 👈 මෙතනට ඔයාගේ API Secret එක පේස්ට් කරන්න
});

async function syncAllUsersImages() {
  console.log('🚀 Cloudinary එකෙන් සැබෑ ලින්ක්ස් ලබා ගනිමින් පවතී...');
  
  try {
    // Cloudinary එකේ තියෙන ඔක්කොම ඉමේජ් ලිස්ට් එක එකපාර ගන්නවා
    const cloudinaryResources = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500
    });

    const cloudinaryImages = cloudinaryResources.resources;
    console.log(`📸 Cloudinary එකෙන් පින්තූර ${cloudinaryImages.length}ක් හම්බවුණා.`);

    // Firebase එකේ යූසර්ලා ඔක්කොම ගන්නවා
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('❌ users collection එකේ කිසිම යූසර් කෙනෙක් නැහැ.');
      return;
    }

    let updatedCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      let dbPath = userData.profilePic || userData.photoURL || userData.profile_pic || '';
      
      if (!dbPath) continue;

      // ලින්ක් එකෙන් පිරිසිදු ෆයිල් නම විතරක් වෙන් කරගන්නවා (profile_xxx)
      let pureFileName = dbPath.includes('/') ? dbPath.substring(dbPath.lastIndexOf('/') + 1) : dbPath;
      pureFileName = pureFileName.split('.')[0]; 

      if (pureFileName.startsWith('profile_')) {
        // 🔥 Cloudinary එකේ තියෙන පින්තූර අතරින් මේ ID එක තියෙන පින්තූරේ හොයනවා
        // මේකෙන් extension එක (.jpg/.jpeg) සහ අගට වැටුණු රැන්ඩම් කේත ඔක්කොම ඔටෝ මැච් වෙනවා!
        const matchedCloudinaryImg = cloudinaryImages.find(img => img.public_id.includes(pureFileName));

        if (matchedCloudinaryImg) {
          const secureUrl = matchedCloudinaryImg.secure_url;

          // fields ඔක්කොම අලුත්ම 100%ක් නිවැරදි ලින්ක් එකෙන් අප්ඩේට් කරනවා
          await db.collection('users').doc(doc.id).update({
            photoURL: secureUrl,
            profile_pic: secureUrl,
            profilePic: secureUrl
          });

          console.log(`✅ ${userData.firstName || doc.id} ගේ පින්තූරය සාර්ථකව අප්ඩේට් වුණා!`);
          updatedCount++;
        } else {
          console.log(`⚠️ ${userData.firstName || doc.id} ගේ පින්තූරය (${pureFileName}) Cloudinary එකේ නැත.`);
        }
      }
    }

    console.log(`\n🎉 මුළු වැඩේම සර්ව සම්පූර්ණයි මචං!`);
    console.log(`🟩 සාර්ථකව අප්ඩේට් කළ මුළු යූසර්ලා ගණන: ${updatedCount}`);

  } catch (error) {
    console.error('❌ දෝෂයක් සිදු වුණා:', error.message);
  }
}

syncAllUsersImages();