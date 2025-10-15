// One-time data wipe for Firestore collections and RTDB root.
// Keeps Storage files, Auth users, rules, indexes, hosting intact.

import admin from 'firebase-admin'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

const saJson = JSON.parse(requireEnv('FIREBASE_SERVICE_ACCOUNT'))
const projectId = process.env.FIREBASE_PROJECT_ID || saJson.project_id
const collectionsEnv = process.env.COLLECTIONS || 'people,products,projects'
const collectionsToWipe = collectionsEnv.split(',').map(s => s.trim()).filter(Boolean)

admin.initializeApp({
  credential: admin.credential.cert(saJson),
  databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
})

const db = admin.firestore()
const rtdb = admin.database()

async function deleteDocumentRecursive(docRef) {
  // Delete all subcollections first
  const subcollections = await docRef.listCollections()
  for (const sub of subcollections) {
    const snap = await sub.get()
    // delete subcollection docs (and their subcollections) sequentially for safety
    for (const subDoc of snap.docs) {
      await deleteDocumentRecursive(subDoc.ref)
    }
  }
  await docRef.delete()
}

async function wipeCollection(name) {
  const col = db.collection(name)
  let total = 0
  for (;;) {
    const snap = await col.limit(200).get()
    if (snap.empty) break
    const deletions = []
    for (const doc of snap.docs) {
      deletions.push(deleteDocumentRecursive(doc.ref))
    }
    await Promise.all(deletions)
    total += snap.size
    console.log(`Deleted ${total} document(s) so far from "${name}"...`)
  }
  console.log(`Done with "${name}".`)
}

async function main() {
  console.log(`Project: ${projectId}`)
  console.log(`Collections to wipe: ${collectionsToWipe.join(', ') || '(none)'} `)

  for (const name of collectionsToWipe) {
    await wipeCollection(name)
  }

  try {
    console.log('Clearing Realtime Database root "/" ...')
    await rtdb.ref('/').set({})
    console.log('RTDB cleared.')
  } catch (e) {
    console.warn('Skipping RTDB clear (RTDB may not be provisioned):', e?.message || e)
  }

  console.log('All done. Storage files, Auth users, and rules were not modified.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
