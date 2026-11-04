import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
const rawData = fs.readFileSync('users_auth.json', 'utf8');
const { users } = JSON.parse(rawData);

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

console.log(`🚀 යූසර්ලා ${users.length} දෙනාව Firebase Auth එකට සින්ක් කිරීම ආරම්භ කළා...`);

async function importUsers() {
  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      let userPassword = user.password;

      // 🔐 පාස්වර්ඩ් එක අකුරු 6කට වඩා අඩු නම්, ඒක අකුරු 6ක default එකකට කන්වර්ට් කරනවා
      if (!userPassword || userPassword.length < 6) {
        userPassword = "1234567"; 
      }

      await auth.createUser({
        uid: user.localId, 
        email: user.email,
        emailVerified: true,
        password: userPassword // මෙතනට සේෆ් පාස්වර්ඩ් එක දෙනවා
      });
      successCount++;
      console.log(`✅ Success: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists' || error.code === 'auth/uid-already-exists') {
        console.log(`ℹ️ Already Exists: ${user.email}`);
        successCount++;
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log(`\n🎉 වැඩේ අවසන්!`);
  console.log(`🟩 සාර්ථකව ඇතුළත් කළා: ${successCount}`);
  console.log(`🟥 අසාර්ථක වුණා: ${errorCount}`);
  process.exit(0);
}

importUsers();