# Museum Visitor Management System

React (Vite) frontend + Node.js/Express backend (JavaScript) + Supabase (PostgreSQL).

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor -> paste `database/schema.sql` -> Run.
3. Project Settings -> API -> copy the **Project URL** and the **service_role** key.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # fill SUPABASE_URL and SUPABASE_KEY
npm run dev              # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxies /api to the backend)
```

## Data structures (5) - `backend/src/dsa/`
| Structure | File | Used for |
|---|---|---|
| HashMap (chaining) | HashMap.js | O(1) ticket-code and id lookup, counting stats |
| Queue (FIFO) | Queue.js | Regular visitor waiting line |
| Min-Heap (priority queue) | MinHeap.js | Priority lane: VIP, then Senior/PWD |
| Stack (LIFO) | Stack.js | Undo delete |
| Linked List | LinkedList.js | Activity log (newest first) |

## Algorithms (6) - `backend/src/algorithms/` and `dsa/`
| Algorithm | File | Used for |
|---|---|---|
| Merge Sort - O(n log n), stable | sorting.js | Sort visitor table |
| Quick Sort - O(n log n) avg | sorting.js | Alternative sort (switch in UI) |
| Binary Search - O(log n) | searching.js | "Exact name" search |
| Linear Search - O(n) | searching.js | "Contains" search and filters |
| djb2 hashing | HashMap.js | Bucket index for HashMap |
| Heap sift-up / sift-down | MinHeap.js | Priority scheduling, "call next visitor" |

## Features
- **Add** (Register visitor), **Update** (Edit), **Delete** (+ Undo), **Display** (table, dashboard, queue, activity).
- **Search**: contains (linear) or exact name (binary); filter by type and status.
- **Sort**: name, age, group size, type, visit date, date registered; asc/desc; choose Merge or Quick Sort.
- **Validation** (frontend and backend): name, email, age 1-120, group 1-50, valid non-past date, Senior >= 60, Student <= 30, duplicate email per date.
- **Persistence**: Supabase tables `visitors` and `visit_logs`. The waiting lines are rebuilt from the database (`status = Queued`, ordered by `queued_at`) after each change or restart.

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/visitors?q=&exact=&type=&status=&sortBy=&order=&algo= | List, search, sort |
| GET | /api/visitors/ticket/:code | HashMap lookup |
| POST | /api/visitors | Register |
| PUT | /api/visitors/:id | Update |
| DELETE | /api/visitors/:id | Delete (pushed to undo stack) |
| POST | /api/visitors/undo | Restore last deleted |
| POST | /api/queue/:id | Add to waiting line |
| POST | /api/queue/next | Call next (priority first) |
| POST | /api/visitors/:id/checkout | Check out |
| GET | /api/queue, /api/stats, /api/logs | Queue, dashboard, activity |

Note: Supabase returns up to 1000 rows by default; the backend asks for 5000 (raise the API max rows setting if you need more).
