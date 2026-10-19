# MPPSC IQ E-Learning — Firebase backend setup

This repository now contains a backend setup scaffold. The live e-learning HTML currently remains a front-end prototype; shared accounts, paid enrollment and shared progress are **not active until Firebase is configured and the app is connected to it**.

## 1. Create Firebase project
1. Open https://console.firebase.google.com/ and create a project named for MPPSC IQ.
2. Add a Web App and copy its Firebase web configuration.
3. In Authentication → Sign-in method, enable Email/Password. Add Google sign-in only if you need it.
4. In Firestore Database, create a production database.
5. In Storage, enable a bucket for course files.
6. In Project settings → General, register the deployed GitHub Pages domain in authorized domains if required.

## 2. Add web configuration
1. Copy `firebase-config.example.js` to `firebase-config.js`.
2. Replace the placeholder values with the Firebase Web App config.
3. Do not put service-account JSON, private keys, payment gateway secrets, or admin credentials in this file.
4. Firebase web config identifies the project; Firestore/Storage rules and Authentication control access.

## 3. Deploy rules
Install Firebase CLI on a trusted computer, sign in, select your project, and deploy:
```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```
Check `firebase.json` and make sure the selected project is correct before deployment. Test rules in the Firebase Emulator first if possible.

## 4. Data model
- `users/{uid}`: student profile; Auth UID is the document ID.
- `courses/{courseId}`: title, description, category, published, pricePaise, createdAt.
- `lessons/{lessonId}`: courseId, title, type, storagePath/url, published, order.
- `enrollments/{id}`: uid, courseId, status, providerOrderId, createdAt. Only trusted admin/server grants enrollment.
- `questions/{questionId}`: courseId/testId, questionHi, questionEn, options, answerIndex, explanationHi, explanationEn, published.
- `attempts/{attemptId}`: uid, courseId, testId, score, correct, wrong, unanswered, total, createdAt.

## 5. Admin access
The security rules expect a Firebase custom claim `admin: true`. Set it only from a trusted Admin SDK environment using a service account that is never shipped to the browser. Do not make a public “make me admin” form.

## 6. Paid courses
Payment must be verified server-side using a trusted backend/Cloud Function and the payment provider's signature verification. Only after successful verification should the server create/update an enrollment. Never unlock a paid course based only on a browser redirect or client-side flag. No payment gateway is configured in this repository yet.

## 7. Important security notes
- Review and test all rules before real students use the platform.
- Current storage read rule allows authenticated users to read course materials; for paid/private materials, tighten it to require a matching active enrollment before uploading real paid content.
- Do not upload copyrighted or private student data without permission.
- GitHub Pages is static hosting; it cannot safely run payment verification or server-only admin code. Use Firebase Cloud Functions or another trusted backend for those operations.
