import fs from 'fs';

// 1. ඔයාගේ පරණ JSON ෆයිල් එක කියවනවා
const rawData = fs.readFileSync('if0_41943903_login.json', 'utf8');
const jsonData = JSON.parse(rawData);

// 2. 'users' ටේබල් එකේ ඩේටා ටික හොයාගන්නවා
const usersTable = jsonData.find(table => table.name === 'users');

if (!usersTable || !usersTable.data) {
  console.error("❌ 'users' ටේබල් එක සොයාගත නොහැකි විය!");
  process.exit(1);
}

// 3. Firebase Auth එකට ගැලපෙන විදිහට ෆෝමැට් කරනවා
const authUsers = usersTable.data.map(user => {
  // ඊමේල් එකක් නැත්නම් හෝ වැරදි නම් placeholder එකක් දානවා (සේෆ් වෙන්න)
  const email = user.email && user.email.includes('@') ? user.email.trim() : `user_${user.id}@test.com`;
  
  return {
    localId: user.id.toString(), // පරණ SQL ID එකම UID එක විදිහට දෙනවා (Firestore එකට සින්ක් වෙන්න)
    email: email,
    emailVerified: true,
    password: "12345" // හැමෝටම පොදු තාවකාලික පාස්වර්ඩ් එක
  };
});

// 4. අලුත් 'users_auth.json' ෆයිල් එක ක්‍රියේට් කරනවා
const outputData = { users: authUsers };
fs.writeFileSync('users_auth.json', JSON.stringify(outputData, null, 2), 'utf8');

console.log(`✅ සාර්ථකයි! යූසර්ලා ${authUsers.length} දෙනෙකුගේ දත්ත 'users_auth.json' එකට පරිවර්තනය කළා.`);