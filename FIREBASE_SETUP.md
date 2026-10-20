# MPPSC IQ E-Learning — Firebase setup and launch

The e-learning page now includes Firebase Email/Password registration/login, password reset, Firestore course loading/publishing for verified admins, and cloud saving of quiz attempts. The live features depend on Firebase Console services and rules being enabled.

## Firebase project already identified
The existing Android configuration identifies:
- Project ID: `mppsc-iq`
- Project number / sender ID: `933540789062`
- Android package: `com.mppsciq.app`

The page currently reuses values recovered from the supplied Android `google-services.json`. **For a correct web deployment, register a Web App in this same Firebase project and replace the `appId` in `e-learning-app.html` with the Web App's appId.** Do not create a second Firebase project.

## 1. Enable Firebase services
1. Open Firebase Console and select project `mppsc-iq`.
2. In Project settings → General, add a **Web App** and copy its config. Replace `appId` in the configuration near the top of `e-learning-app.html` with the Web App appId. The other project values should remain for `mppsc-iq`.
3. In Authentication → Sign-in method, enable **Email/Password**.
4. In Authentication → Settings → Authorized domains, ensure the GitHub Pages domain is allowed.
5. Create a Cloud Firestore database.

## 2. Deploy Firestore rules
Install Firebase CLI on a trusted computer, sign in, select the existing project, and deploy:
```bash
firebase login
firebase use --add
# Select the existing project: mppsc-iq
firebase deploy --only firestore:rules,storage
```
Verify the selected project before deployment. Test rules before inviting students.

## 3. Admin access
The page intentionally does not let a user grant themselves admin access. The Firestore rules require the Firebase custom claim `admin: true`; without it, the Admin Panel stays locked and a normal student cannot publish or delete courses.

Set this claim only with the Firebase Admin SDK in a trusted environment. Never commit service-account JSON or admin credentials to this repository. The Admin Panel then publishes course records in `courses/{courseId}`; student accounts can read only documents with `published: true`.

## 4. What is connected
- Email/password registration and login through Firebase Authentication.
- Password reset email.
- Student profile document in `users/{uid}`.
- Published course reads from Firestore.
- Admin-only course/lesson publishing and deletion (custom claim required).
- Quiz attempts written to `attempts` for signed-in students.
- Mains draft, wrong-question list, test history, completed lessons, and quiz attempts are synced to Firebase for signed-in students.

## 5. Not yet enabled
- Paid-course checkout and secure payment verification.
- Server-controlled paid enrollment creation / payment verification (rules now require an active enrollment for paid course records and Storage files).
- Private course-file uploads and protected video delivery.
- Full cross-device sync for every progress item and mains draft.
- Production admin-claim provisioning automation.

Payment must be verified server-side using a trusted backend/Cloud Function and the payment provider's signature verification. Never unlock paid content from a browser redirect or client-side flag. GitHub Pages cannot safely run server-only admin/payment code.

## Data model
- `users/{uid}`: student profile.
- `courses/{courseId}`: course fields, `pricePaise` (integer paise), and nested lesson list; `published` controls visibility. Use `pricePaise: 0` for free courses.
- `enrollments/{uid_courseId}`: server/admin-controlled course access grant; the document ID must be the student UID, an underscore, then course ID (for example `abc123_pre2027`), with `uid`, `courseId`, and `status: "active"` fields.
- `questions/{questionId}`: question bank (rules support published questions).
- `attempts/{attemptId}`: signed-in student's quiz attempts.

Before publishing paid courses, add and test the trusted server-side payment verifier and create enrollment documents only after verified payment. Never put service-account private keys, payment secrets, or passwords in HTML/JavaScript. Firebase web config is project-identification data; actual authorization is enforced by Firebase rules and Auth.


## 6. Secure, server-verified leaderboard (Cloud Functions)
The repository now includes a callable Cloud Function, `submitRankedAttempt`. It calculates +3/−1/0 from the answer keys stored in published `questions/{questionId}` documents and writes the trusted attempt and aggregate leaderboard record with the Admin SDK. A browser must never send a score as the source of truth.

### Deploy to the existing Firebase project
From the repository root on a trusted computer:
```bash
npm install -g firebase-tools
firebase login
firebase use mppsc-iq
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```
Confirm the project shown by `firebase use` is `mppsc-iq` before deploying. Cloud Functions deployment may require the project to be on the Blaze billing plan. Do not commit service-account keys.

### Ranked-question requirements
- Each ranked question must be a document in `questions/{questionId}` with `published: true`, a four-item `opts` array, and integer answer index `ans` from 0 to 3.
- Questions loaded only from the local/demo bank cannot be independently verified by the server and must not be counted in the competitive leaderboard.
- The callable function rejects duplicate question IDs and repeated attempt IDs. The function is not considered live until deployment completes successfully.
- Existing unverified legacy leaderboard records should be cleared by an administrator before announcing a clean competitive ranking.



## 7. No-cost Firebase Spark plan
The automatic Firebase deployment workflow is intentionally disabled for the Spark (no-cost) plan because deploying Cloud Functions requires the Blaze plan and can incur charges. The app remains usable for authentication, Firestore-backed content, and practice tests within Firebase's free quotas. The secure competitive leaderboard must not accept client-calculated scores; server-verified leaderboard scoring remains disabled until a suitable backend is deliberately configured.
