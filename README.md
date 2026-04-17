# Studysync
# StudySync API – Server‑Side Components
**Course:** BSc in Computing (Year 3)  
**Module:** Web Technologies (WT) – Assignment 2  
**Authors:**  
- Ireoluwatomiwa Awonola  
- Olimeh Kelvin  
- Francis Ngonadi  
---

## 1. Overview
StudySync is a collaborative study platform that allows users to create/join study groups, share resources (links/notes), schedule study sessions, and manage group tasks. This submission implements the **server‑side API** using Node.js, Express, MongoDB, and follows the requirements set out in Assignment 2.

The API is fully functional, supports multiple users with session/cookie management, and provides complete CRUD operations for groups, resources, sessions, and tasks. All routes are protected by authentication middleware.

**Deployed URL:**  
https://studysync-iqaq.onrender.com/
---

## 2. Implementation Status (vs Assignment 1)

Our original proposal (Assignment 1) described a platform where students could:

- Create and join study groups  
- Share useful links and notes  
- Schedule study sessions with deadlines  
- Assign and track tasks  

All of these features have been fully implemented as RESTful endpoints.  
**No major changes** from the initial plan – the database schema and route structure follow the original design exactly.

---

## 3. How the Assignment Requirements Are Met

### 3.1 Database
- MongoDB (via Mongoose) is used as the persistent data store.  
- Models: `User`, `Group`, `Resource`, `Session`, `Task`.  
- Connection is established in `app.js` using `mongoose.connect()`.

### 3.2 SESSION
- `express-session` is configured with MongoDB store (`connect-mongo`).  
- After login/registration, `req.session.userId` and `req.session.userName` are stored.  
- Sessions persist across server restarts because they are saved in the database.

### 3.3 COOKIE
- `cookie-parser` middleware is used.  
- On successful login, a `userName` cookie is set (`httpOnly`, 1‑day expiry).  
- The cookie is cleared on logout.

### 3.4 CRUD & Users Management
Every resource supports full CRUD:

| Resource | Create (POST) | Read (GET) | Update (PUT) | Delete (DELETE) |
|----------|---------------|------------|--------------|-----------------|
| Users    | `/register`   | `/profile` | `/profile`   | `/profile`      |
| Groups   | `/groups`     | `/groups`, `/groups/:id` | `/groups/:id` | `/groups/:id` |
| Resources| `/resources`  | `/resources?groupId=`, `/resources/:id` | `/resources/:id` | `/resources/:id` |
| Sessions | `/sessions`   | `/sessions?groupId=`, `/sessions/:id` | `/sessions/:id` | `/sessions/:id` |
| Tasks    | `/tasks`      | `/tasks?groupId=`, `/tasks/:id` | `/tasks/:id` | `/tasks/:id` |

- Returning users access their existing data (groups they created/joined, tasks assigned to them, etc.) via session‑authenticated endpoints.  
- Business logic: only the creator of a group/resource/session/task can update or delete it. Group members can view group content.  
- All operations are performed through the API – no direct database access.

### 3.5 Validation – Server Side
- **Required fields:** Every model uses `required: [true, 'message']`.  
- **Data type validation:** `enum` for resource type, `Date` for dates.  
- **Custom validation:**  
  - Link resources: content must be a valid URL (checked with `new URL(content)`).  
  - Session date cannot be in the past.  
  - Task deadline cannot be in the past.  
  - Assigned user must be a member of the group.  
- **Error messages:** Appropriate HTTP status codes (400, 403, 404, 500) with descriptive JSON messages are returned to the client.

### 3.6 Hosting Online (10 marks)
- The application is configured to use `process.env.PORT` and `process.env.MONGO_URI`.  
- Ready to be deployed on Render.com (or any Node.js hosting platform).  
- A live has been provided at the top of this file and on the pdf submitted.

### 3.7 Documentation (10 marks)
- This `README.md` describes the implementation, team contributions, and references.  
- All code files are commented.  
- External resources used are listed below.

---

## 4. Division of Labour

| Team Member                     | Percentage |
|--------------------------------|------------|
| **Ireoluwatomiwa Awonola**     |  40% |
| **Olimeh Kelvin**                 | 30% |
| **Francis Ngonadi**               | 30% |

*Hey Ellen, please note: Work was divided evenly in terms of effort; percentages reflect specific responsibilities.*

---

**AI Use Declaration (per AI Assessment Scale – Support Tasks only):**  
- No generative AI was used to write whole blocks of code, reports, or comments.  
- No AI was used to create diagrams or wireframes.  m.

---

## 6. How to Run Locally

```bash
git clone <repository-url>
cd Studysync/api
npm install
cp .env.example .env   # add MONGO_URI, SESSION_SECRET, PORT
npm start