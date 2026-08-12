# IDP Assess360 - Admin Assessment Portal

A production-grade React + Vite single-page application (SPA) serving as the management console for the **IDP Assess360 Online Recruitment Assessment Platform**. 

This portal enables administrators to design assessment question banks, configure customizable test links for candidates, track proctoring security anomalies in real-time, and manually grade coding and MCQ submissions.

---

## 🚀 Key Modules & Capabilities

### 1. Question Bank Module
* Create and manage Question Sets (e.g. `RIT-2026-CODING`, `SET001`).
* Manage MCQ (Multiple Choice Questions) and Coding Questions.
* Uses DynamoDB NoSQL Single Table Design with partition key `questionSetId` and sort key `questionId` (metadata row uses sorting key `METADATA`) for efficient database queries.

### 2. Test Configuration Module
* Schedule assessments and manage test sections.
* **Default Inactive State**: New tests are set as inactive by default (`active: false`) on creation to prevent premature test links from being taken.
* **Link Generator**: Generates candidate test portal URLs based on unique test identifiers mapping to CloudFront:
  `https://d1t6qh90xvpukg.cloudfront.net/{link_id}`
* **Active Status Toggles**: Integrated toggles to manually activate or deactivate test links.

### 3. Reports & Grading Module
* Displays post-exam candidates' analytics, completion status, and warning markers.
* **Coded Scoring breakdown**: Separate columns for **MCQ %** and **Coding %** alongside an overall aggregated percentage.
* **Proctoring Logs**: Displays warnings and proctoring session statuses (e.g. tab switches, copy-pasting, face verification logs).
* **Code Review Panel**: Allows admins to review student-submitted code and assign manual marks.

---

## 🛠️ Technology Stack
* **Runtime**: React 19 + Vite 8
* **Styling**: Tailwind CSS 4 + PostCSS
* **APIs & Data**: Axios, AWS Amplify SDK
* **Excel Utilities**: ExcelJS, XLSX

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The portal will open locally at `http://localhost:5173`.

### 🔄 Local CORS Bypass Proxy
To bypass browser CORS preflight checks when running locally, the Vite dev server acts as a reverse proxy. Local calls are made to relative endpoints (`/api/*`), which Vite forwards directly to AWS on the server side:
* `/api` maps to the Question Bank API Gateway.
* `/test-api` maps to the Test Config API Gateway.
* `/reports-api` maps to the Reports/Proctoring API Gateway.

---

## 📦 Production Build & AWS Deployment

### 1. Environment Config (`.env.production`)
The environment file `.env.production` defines the production API URL base path:
```properties
VITE_API_URL=/default
```

### 2. Build Project
```bash
npm run build
```
This builds static assets (HTML, CSS, JS bundles) into the `dist/` directory.

### 3. Deploy to S3
Sync the `dist/` directory to the production S3 bucket:
```bash
aws s3 sync dist s3://idp-test-portal-admin --profile Natish --region ap-southeast-1 --delete
```

### 4. Invalidate CloudFront Cache
Clear CloudFront caching locations so changes reflect instantly:
```bash
aws cloudfront create-invalidation --distribution-id E29D7T593WCJ0Y --paths "/*" --profile Natish
```

### 5. Production CloudFront API Routing
In production, CloudFront routes traffic based on path behaviors:
* **Static Assets**: Handled by the `Default (*)` behavior pointing to the S3 bucket `idp-test-portal-admin`.
* **API Traffic**: Requests sent to `/default/*` are matched by the `/default/*` CloudFront behavior and forwarded straight to the AWS API Gateway stage (`yee9ggnjni.../default`), completely bypassing CORS preflight blocks.

---

## ⚡ Engineering Enhancements & Optimizations

* **DynamoDB Write Conflict Mitigation (Sequential Saves)**: To prevent transactions from overlapping in DynamoDB during manual code review grading, parallel saves (`Promise.all`) were refactored into a sequential `for...of` loop with `await` to write question scores one by one.
* **Flexible Coding Section Detection**: Instead of strict section name matches (`=== 'CODING'`), the system checks the `questionType` of the questions in the section. This ensures custom section names like `"Technical Round"` are identified and render the **Code Review** button correctly.
* **Unsubmitted Code Handling**: If a candidate did not submit code for a question:
  * The score input field is hidden.
  * A badge displays: `Score automatically set to 0 (Unsubmitted)`.
  * Saving the score automatically posts `0` marks to the database, ensuring candidate statistics remain accurate.
* **Scrollable Layout Optimization**: 
  * Wrapped reports table in scrollable containers (`overflow-x-auto min-w-[880px] scrollbar-thin`) to prevent candidate columns from squishing on standard laptop viewports.
  * Configured sticky headers (`sticky top-0 bg-white z-10`) with blur elements to lock table labels during vertical scrolling.
