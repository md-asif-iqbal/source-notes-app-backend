# Secure Note-Taking Application - Backend API

A production-grade RESTful API built with Node.js, Express, and MongoDB/Mongoose. Features JSON Web Token (JWT) authentication, Role-Based Access Control (RBAC), fine-tuned database indexing strategy, and optimized MongoDB aggregation pipelines.

---

## 1. Core Architecture & Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with Bearer token authentication
- **Password Security**: Salted hashing with `bcryptjs`
- **Architecture**: Modular Controller-Service-Route pattern with isolated middleware

---

## 2. Roles & Permissions (RBAC)

| Capability | Regular User | Admin |
| :--- | :---: | :---: |
| Register & Login | Yes | Yes |
| Create, Edit, Delete Own Notes | Yes | Yes |
| View Own Notes (Paginated) | Yes | Yes |
| View All Notes (Across All Users) | No | Yes |
| Manage Users (Add, Update, Remove, List) | No | Yes |
| View Interests Aggregation (Scenario 1) | Yes | Yes |
| Query User Posts Aggregation (Scenario 2) | Yes | Yes |

---

## 3. Database Indexing Strategy

Per architectural requirements, all indexes are explicitly defined in the code using Mongoose's `schema.index()` method for direct auditing and maximum query performance.

> **Strict Efficiency Principle**: Only required indexes are created. Redundant or duplicate single-field indexes covered by compound indexes are strictly avoided.

### User Schema (`src/models/User.js`)
- `userSchema.index({ email: 1 }, { unique: true })`
  - **Purpose**: Fast single-document lookups during authentication (`/api/auth/login`) and enforcing database-level email uniqueness.
- `userSchema.index({ interests: 1 })`
  - **Purpose**: Multi-key index to optimize Scenario 1 Aggregation Pipeline (`$unwind` and grouping by user interests).
- `userSchema.index({ createdAt: -1 })`
  - **Purpose**: Supports the Admin users list view sorted by newest first with pagination (`skip()` & `limit()`).

### Note Schema (`src/models/Note.js`)
- `noteSchema.index({ userId: 1, createdAt: -1 })`
  - **Purpose**: Compound index specifically designed for the most frequent query: a user listing their own notes sorted by creation date descending with pagination.
- `noteSchema.index({ createdAt: -1 })`
  - **Purpose**: Supports Admin list view displaying all notes across all users sorted by creation date descending with pagination.
- *(Note lookup by `_id` is automatically handled by MongoDB's default primary index `_id_` without requiring additional indexes).*

### Post Schema (`src/models/Post.js`)
- `postSchema.index({ userId: 1, createdAt: -1 })`
  - **Purpose**: Foreign-key index supporting Scenario 2 Aggregation Pipeline (`$lookup` joining user posts by `userId`) and date sorting.
- `postSchema.index({ createdAt: -1 })`
  - **Purpose**: Supports public post feed view with pagination.

---

## 4. Aggregation Pipelines

### Scenario 1: Group by Interests
- **Route**: `GET /api/users/group-by-interests`
- **Constraint**: Executed in exactly **one** `User.aggregate()` call.
- **Pipeline Stages**:
  1. `$unwind: "$interests"`: Unpacks each interest from user arrays into distinct stream documents.
  2. `$group`: Groups by normalized interest name, calculates `count` (`$sum: 1`), and collects the users list (`$push`).
  3. `$sort: { _id: 1 }`: Alphabetical ordering of interests.
  4. `$project`: Formats output fields cleanly for API consumers.

### Scenario 2: User Posts ($lookup)
- **Route**: `GET /api/posts/user/:userId`
- **Constraint**: Executed in a single aggregation pipeline with a `$lookup` stage.
- **Pipeline Stages**:
  1. `$match: { _id: targetUserId }`: Filters the primary user document using the indexed `_id`.
  2. `$lookup`: Performs a left outer join with the `posts` collection on `localField: "_id"` and `foreignField: "userId"`, sorting posts newest first.
  3. `$project`: Excludes sensitive information like password hashes.
  4. `$addFields`: Appends total `postCount` calculated from array size.

---

## 5. API Reference

### Authentication
- `POST /api/auth/register` - Create new user account (name, email, password, optional interests)
- `POST /api/auth/login` - Authenticate with email & password, returns JWT token
- `GET /api/auth/me` - Get current user profile (requires `Bearer <token>`)

### Notes (Protected)
- `GET /api/notes?page=1&limit=10` - List notes (Regular users see their own; Admin sees all or adds `?scope=mine`)
- `POST /api/notes` - Create new note (title, content, tags)
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Users & Aggregations
- `GET /api/users/group-by-interests` - **Scenario 1**: View all users grouped by interest
- `GET /api/users?page=1&limit=10` - List users with pagination (Admin only)
- `POST /api/users` - Create user (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin or Self)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Remove user (Admin only)

### Posts
- `GET /api/posts?page=1&limit=10` - List all posts (Public, paginated)
- `POST /api/posts` - Create post (Authenticated)
- `GET /api/posts/user/:userId` - **Scenario 2**: Aggregation with `$lookup` retrieving all posts of a specific user

---

## 6. Local Setup & Running

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env and adjust MONGODB_URI if needed
cp .env.example .env

# 3. Seed sample data (Admin & User accounts, notes, posts)
npm run seed

# 4. Start development server
npm run dev
```

### Pre-configured Seed Credentials:
- **Admin**: `admin@example.com` / `password123`
- **User 1**: `alice@example.com` / `password123`
- **User 2**: `bob@example.com` / `password123`
- **User 3**: `charlie@example.com` / `password123`
