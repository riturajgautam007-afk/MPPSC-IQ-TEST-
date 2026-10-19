const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

/**
 * Ranked scores are calculated only from published Firestore question documents.
 * Never accept score/correct/accuracy supplied by the browser.
 */
exports.submitRankedAttempt = onCall({ region: "asia-south1", enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "कृपया पहले लॉगिन करें।");

  const uid = request.auth.uid;
  const payload = request.data || {};
  const responses = payload.responses;
  const attemptId = String(payload.attemptId || "");
  const testId = String(payload.testId || "ranked-test").slice(0, 120);
  const topic = String(payload.topic || "All Topics").slice(0, 160);

  if (!/^[A-Za-z0-9_-]{12,100}$/.test(attemptId)) {
    throw new HttpsError("invalid-argument", "अमान्य attempt ID.");
  }
  if (!Array.isArray(responses) || responses.length < 1 || responses.length > 100) {
    throw new HttpsError("invalid-argument", "टेस्ट में 1 से 100 प्रश्न होने चाहिए।");
  }

  const seen = new Set();
  const normalized = [];
  for (const item of responses) {
    const questionId = String(item && item.questionId || "");
    const selected = item && item.selectedIndex;
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(questionId) || seen.has(questionId)) {
      throw new HttpsError("invalid-argument", "प्रश्न सूची अमान्य है।");
    }
    if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected > 3)) {
      throw new HttpsError("invalid-argument", "उत्तर विकल्प अमान्य है।");
    }
    seen.add(questionId);
    normalized.push({ questionId, selectedIndex: selected === null ? null : selected });
  }

  const userRef = db.collection("users").doc(uid);
  const attemptRef = db.collection("attempts").doc(attemptId);
  const leaderboardRef = db.collection("leaderboard").doc(uid);

  // Fetch answer keys from trusted Firestore documents, never from client payload.
  const questionDocs = await Promise.all(normalized.map(x => db.collection("questions").doc(x.questionId).get()));
  let correct = 0, wrong = 0, unanswered = 0;
  for (let i = 0; i < normalized.length; i++) {
    const doc = questionDocs[i];
    if (!doc.exists || doc.data().published !== true) {
      throw new HttpsError("failed-precondition", "इस टेस्ट का कोई प्रश्न प्रकाशित प्रश्न बैंक में उपलब्ध नहीं है।");
    }
    const q = doc.data();
    if (!Array.isArray(q.opts) || q.opts.length !== 4 || !Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
      throw new HttpsError("failed-precondition", "प्रश्न बैंक में उत्तर कुंजी अमान्य है।");
    }
    const selected = normalized[i].selectedIndex;
    if (selected === null) unanswered++;
    else if (selected === q.ans) correct++;
    else wrong++;
  }
  const score = correct * 3 - wrong;
  const total = normalized.length;
  const userSnap = await userRef.get();
  const name = String((userSnap.exists && userSnap.data().displayName) || request.auth.token.name || request.auth.token.email || "Student").slice(0, 80);

  await db.runTransaction(async tx => {
    const [oldAttempt, oldBoard] = await Promise.all([tx.get(attemptRef), tx.get(leaderboardRef)]);
    if (oldAttempt.exists) throw new HttpsError("already-exists", "यह टेस्ट पहले ही जमा किया जा चुका है।");
    const old = oldBoard.exists ? oldBoard.data() : {};
    const oldTotal = Number(old.totalQuestions || 0);
    const oldCorrect = Number(old.correct || 0);
    tx.create(attemptRef, {
      uid, courseId: "pre2027", testId, topic, score, correct, wrong, unanswered, total,
      ranked: true, createdAt: FieldValue.serverTimestamp()
    });
    tx.set(leaderboardRef, {
      uid, name,
      quizzes: Number(old.quizzes || 0) + 1,
      totalQuestions: oldTotal + total,
      correct: oldCorrect + correct,
      score: Number(old.score || 0) + score,
      best: Math.max(Number(old.best || 0), score),
      accuracy: Math.round(((oldCorrect + correct) / (oldTotal + total)) * 100),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { ok: true, score, correct, wrong, unanswered, total, accuracy: Math.round(correct / total * 100) };
});
