# ReturnDesk — Support Portal

ReturnDesk is a high-performance support desk portal designed for processing and managing product return requests. The system provides support agents with search, status filtering, metadata configuration, note timelines, and status flow control following strict backend business rules.

## Live Demo

*Not deployed yet. The application is configured and ready for local development or Vercel + Neon deployment.*

---

## Technology Stack

* **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
* **Backend API**: Next.js Route Handlers (Node.js)
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Validation**: Zod (for request queries, request bodies, and database input sanitization)
* **Testing**: Vitest (test suite covering all core business rule validation limits)

---

## Setup Instructions

Ensure you have **Node.js (v18+)** and a running **PostgreSQL** instance. Follow these steps to run ReturnDesk locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AyushYadav1113/Frido-Return_Desk.git
   cd Frido-Return_Desk
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your connection string:
   ```bash
   cp .env.example .env
   ```
   Example `.env` content:
   ```text
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/returndesk?schema=public"
   ```

4. **Initialize Database & Seed**:
   Run Prisma migrations to create the schema, sequence, and indexes:
   ```bash
   npx prisma db push
   ```
   Execute the seeding script to insert 30 return requests:
   ```bash
   npm run db:seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## API Overview

### Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| **GET** | `/api/requests` | Fetch paginated requests matching filters, search, and sort order. |
| **POST** | `/api/requests` | Create a new return request. Reference is generated server-side. |
| **GET** | `/api/requests/:id` | Get details and notes for a specific request. |
| **PATCH** | `/api/requests/:id` | Update metadata fields (locks automatically if decided). |
| **DELETE** | `/api/requests/:id` | Soft-deletes a request by setting `removedAt = NOW()`. |
| **POST** | `/api/requests/:id/status` | Transitions status and applies resolution details. |
| **POST** | `/api/requests/:id/notes` | Appends a note logs to the request. |

### Query Parameters for `GET /api/requests`

* `search`: Search against customerName, customerEmail, customerPhone, orderNumber, reference.
* `status`: Filter by status (`OPEN`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `COMPLETED`).
* `reason`: Filter by reason (`DAMAGED`, `WRONG_ITEM`, `SIZE_ISSUE`, `NOT_AS_DESCRIBED`, `CHANGED_MIND`).
* `sortBy`: Sort field (`createdAt`, `updatedAt`, `customerName`, `orderNumber`, `status`, `reference`).
* `sortOrder`: `asc` or `desc` (default: `desc`).
* `page`: Page index (default: `1`).
* `pageSize`: Records per page (default: `10`).

---

## Business Rules

ReturnDesk implements 5 core business rules enforced on the server-side to guarantee integrity:

1. **Status Flow Validation**:
   Status transitions can only move in the following sequence:
   * `OPEN` &rarr; `IN_REVIEW`
   * `IN_REVIEW` &rarr; `APPROVED` or `REJECTED`
   * `APPROVED` &rarr; `COMPLETED`
   * Final statuses (`REJECTED`, `COMPLETED`) are locked and cannot transition. Violations throw `INVALID_STATUS_TRANSITION` (409).
2. **Approval Resolution**:
   A status cannot become `APPROVED` without a resolution (`REFUND`, `REPLACEMENT`, `STORE_CREDIT`). If resolution is `REFUND`, `refundAmount > 0` is required. For others, `refundAmount` must be null. Violations throw `RESOLUTION_REQUIRED` or `INVALID_REFUND_AMOUNT` (400).
3. **One Live Request Per Item**:
   A customer cannot have multiple active (non-decided, non-deleted) requests for the same `orderNumber` + `itemSku`. Enforced through transaction checks and a PostgreSQL partial unique index. Violations throw `DUPLICATE_LIVE_REQUEST` (409).
4. **Metadata Locking**:
   Once a request reaches a decided status (`APPROVED`, `REJECTED`, `COMPLETED`), its core metadata (customer details, item details, quantity, reason) is locked and cannot be edited. Note additions are still allowed. Violations throw `REQUEST_LOCKED` (409).
5. **Soft Deletion**:
   `DELETE` does not physically purge the database row; it sets `removedAt = NOW()`. Only requests in `OPEN` or `REJECTED` status can be soft-deleted. Attempting to soft-delete `IN_REVIEW`, `APPROVED`, or `COMPLETED` requests throws `INVALID_REMOVAL_STATUS` (409).

---

## Architecture Flow

```text
       [ Next.js App Router (React) ]
                     │
                     ▼ (Client Fetch / Server Actions)
      [ Route Handlers (app/api/) ]
                     │
                     ▼ (Validations & Errors)
   [ Central Business Rules (lib/business-rules/) ]
                     │
                     ▼ (ORM)
            [ Prisma Client ]
                     │
                     ▼ (Database Engine)
             [ PostgreSQL ]
```

---

<<<<<<< HEAD
# Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js 20+
* npm
* PostgreSQL, or access to a hosted PostgreSQL database

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/returndesk.git
cd returndesk
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env
```

Set the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

Never commit the real `.env` file.

---

## 4. Run Database Migrations

```bash
npx prisma migrate dev
```

This creates the required PostgreSQL tables and applies the schema.

---

## 5. Seed the Database

```bash
npm run db:seed
```

The seed creates at least 30 requests distributed across all statuses and return reasons, with notes attached to several requests.

---

## 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Database Design

ReturnDesk uses two primary models.

## ReturnRequest

Stores the customer, order, item, workflow state, resolution, and lifecycle information.

Important fields include:

```text
id
reference
customerName
customerEmail
customerPhone
orderNumber
itemName
itemSku
quantity
reason
status
resolution
refundAmount
removedAt
createdAt
updatedAt
```

## Note

Notes belong to a request and are append-only.

```text
id
requestId
content
createdAt
```

Relationship:

```text
ReturnRequest 1 ───────── N Note
```

Existing notes are never edited or deleted.

---

# Request Lifecycle

A request follows a fixed lifecycle:

```text
OPEN
  │
  ▼
IN_REVIEW
  │
  ├───────────────┐
  ▼               ▼
APPROVED        REJECTED
  │
  ▼
COMPLETED
```

The only valid transitions are:

```text
OPEN → IN_REVIEW

IN_REVIEW → APPROVED
IN_REVIEW → REJECTED

APPROVED → COMPLETED
```

`REJECTED` and `COMPLETED` are terminal states.

Invalid transitions are rejected by the API even if a client attempts to call the endpoint directly.

---

# Business Rules

## 1. Status Flow

The server only permits valid lifecycle transitions.

For example:

```text
OPEN → IN_REVIEW        ✓
IN_REVIEW → APPROVED   ✓
IN_REVIEW → REJECTED   ✓
APPROVED → COMPLETED   ✓
```

But:

```text
OPEN → APPROVED        ✗
OPEN → COMPLETED       ✗
IN_REVIEW → COMPLETED  ✗
COMPLETED → OPEN       ✗
REJECTED → OPEN        ✗
```

Invalid transitions return a `409 Conflict`.

---

## 2. Approval Requires a Resolution

A request cannot become `APPROVED` without one of:

```text
REFUND
REPLACEMENT
STORE_CREDIT
```

When the resolution is `REFUND`, the refund amount must be greater than zero.

When the resolution is `REPLACEMENT` or `STORE_CREDIT`, no refund amount may be recorded.

Invalid approval attempts are rejected by the server.

---

## 3. One Live Request Per Item

A customer cannot have two live return requests for the same item on the same order.

A request is considered live when it:

* has not been removed
* is not `REJECTED`
* is not `COMPLETED`

The duplicate check is performed against PostgreSQL before creating a new request.

Once an existing request is rejected or completed, another request for the same order/item combination is allowed.

---

## 4. Locked Once Decided

After a request reaches:

```text
APPROVED
REJECTED
COMPLETED
```

customer and item details cannot be changed.

This includes:

* Customer name
* Customer email
* Customer phone
* Order number
* Item name
* Item SKU
* Quantity
* Return reason

The server rejects attempts to modify these fields.

Notes can still be added after a request has been decided.

---

## 5. Removal

Removing a request is implemented as a soft delete.

The record remains in PostgreSQL with:

```text
removedAt != null
```

Only `OPEN` and `REJECTED` requests can be removed.

Removed requests:

* disappear from the active request list
* cannot be fetched through normal request endpoints
* remain in the database

Requests are never physically deleted as part of the normal removal workflow.

---

# API

## List Requests

```http
GET /api/requests
```

Supported query parameters:

```text
search
status
reason
sortBy
sortOrder
page
pageSize
```

Example:

```text
GET /api/requests?search=rahul&status=OPEN&page=1&pageSize=10
```

Search supports:

* customer
* order number
* reference

Filtering, sorting, and pagination are performed on the server using PostgreSQL queries.

---

## Create Request

```http
POST /api/requests
```

Example:

```json
{
  "customerName": "Rahul Sharma",
  "customerEmail": "rahul@example.com",
  "customerPhone": "9876543210",
  "orderNumber": "ORD-1001",
  "itemName": "Running Shoes",
  "itemSku": "SHOE-001",
  "quantity": 1,
  "reason": "DAMAGED"
}
```

The server generates the request reference.

---

## Get Request

```http
GET /api/requests/:id
```

Returns request details and notes.

Removed requests return `404 Not Found`.

---

## Update Request

```http
PATCH /api/requests/:id
```

Used to modify request details while the request is still editable.

The server checks the locked-state rule before updating.

---

## Change Status

```http
POST /api/requests/:id/status
```

Used for lifecycle transitions.

Example:

```json
{
  "status": "APPROVED",
  "resolution": "REFUND",
  "refundAmount": 1499
}
```

---

## Add Note

```http
POST /api/requests/:id/notes
```

Example:

```json
{
  "content": "Customer provided photos of the damaged item."
}
```

Notes are immutable after creation.

---

## Remove Request

```http
DELETE /api/requests/:id
```

This performs a soft removal rather than physically deleting the record.

---

# Error Handling

API errors use a consistent JSON structure:

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "A request in Open status can only move to In Review."
  }
}
```

Examples of error codes include:

```text
INVALID_STATUS_TRANSITION
RESOLUTION_REQUIRED
INVALID_REFUND_AMOUNT
DUPLICATE_LIVE_REQUEST
REQUEST_LOCKED
REQUEST_NOT_FOUND
VALIDATION_ERROR
```

HTTP status codes are used according to the type of failure.

```text
400 Bad Request
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Predictable business-rule failures are not returned as `500` errors.

---

# Server-Side Search, Filtering & Pagination

The request list does not load the entire database into the browser.

For example:

```text
GET /api/requests?search=rahul&status=OPEN&page=2&pageSize=10
```

is translated into a database query containing the appropriate:

* search conditions
* filters
* ordering
* offset
* limit

This keeps the amount of data transferred to the client small and ensures the implementation scales better as the number of requests increases.

---

# Frontend

The frontend contains three main views.

## Request Dashboard

```text
/requests
```

Provides:

* Search
* Filters
* Sorting
* Pagination
* Request table/cards
* Status badges
* Create request action

## Create Request

```text
/requests/new
```

Allows agents to create a new request.

The reference is generated by the server.

## Request Details

```text
/requests/:id
```

Displays:

* Request information
* Current status
* Resolution
* Refund amount
* Notes timeline
* Legal workflow actions
* Editing controls where applicable

---

# Responsive Design

The interface is designed to remain usable down to `375px`.

On smaller screens, wide request-table content is adapted to a mobile-friendly layout.

The application also provides appropriate:

* loading states
* empty states
* error states
* mutation feedback
* confirmation dialogs

Search is debounced so that the application does not issue an API request for every keystroke.

---

# Seed Data

The seed script creates at least 30 requests.

The dataset covers all statuses:

```text
6 OPEN
6 IN_REVIEW
6 APPROVED
6 REJECTED
6 COMPLETED
```

It also covers all return reasons:

```text
DAMAGED
WRONG_ITEM
SIZE_ISSUE
NOT_AS_DESCRIBED
CHANGED_MIND
```

Several requests contain notes so the notes timeline can be tested immediately after setup.

Run:

```bash
npm run db:seed
```

---

# Testing

Business-rule tests cover the most important server-side behavior.

The test suite verifies:

* valid status transitions
* invalid status transitions
* approval without resolution
* invalid refund amounts
* duplicate live requests
* creating a request after the previous request is closed
* locked requests
* allowed removals
* rejected removals
* removed requests returning `404`
* notes on decided requests

Run tests with:

=======
## Database Design

### ReturnRequest
* `id` (String, Primary Key, UUID)
* `reference` (String, Unique, Indexed)
* `customerName` (String)
* `customerEmail` (String, Indexed)
* `customerPhone` (String, Optional)
* `orderNumber` (String, Indexed)
* `itemName` (String)
* `itemSku` (String)
* `quantity` (Int)
* `reason` (Enum Reason, Indexed)
* `status` (Enum Status, Indexed)
* `resolution` (Enum Resolution, Optional)
* `refundAmount` (Decimal, Optional)
* `removedAt` (DateTime, Optional)
* `createdAt` (DateTime, Default now(), Indexed)
* `updatedAt` (DateTime, Auto update)

### Note
* `id` (String, Primary Key, UUID)
* `requestId` (String, Foreign Key, Cascade)
* `content` (String)
* `createdAt` (DateTime, Default now(), Indexed)

---

## Design Decisions

1. **PostgreSQL**: Selected for strict ACID transactions, complex query capabilities, and powerful indexing.
2. **Prisma ORM**: Offers type-safe queries, auto-generated TypeScript models, and easy schema migrations.
3. **Zod Validation**: Used on both frontend and backend for strong schema runtime type validations.
4. **Soft Deletion**: Keeps history log audit trails intact while preventing deleted entries from showing in views.
5. **PostgreSQL Sequence & Partial Unique Index**: Prevents reference collisions and guarantees race-safe live request checks at the database layer.

---

## Assumptions Made

1. **Phone Number**: Optional field for ease of submission, while customer email and name are strictly required.
2. **Global Sequence**: A single sequence is used to track references across multiple years, ensuring collision-free numbering.

---

## Testing Commands

Run the Vitest test suite to verify all business rules:
>>>>>>> da406b3 (Phase 2 Frontend, UX, Testing & Deployment)
```bash
npm test
```

---

<<<<<<< HEAD
# Development Commands

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run database migrations:

```bash
npx prisma migrate dev
```

Seed database:

```bash
npm run db:seed
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# Environment Variables

Create a `.env` file locally.

Required variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

See `.env.example` for the complete list.

Real environment files and credentials must never be committed to Git.

---

# Deployment

The application is designed to run on Vercel with PostgreSQL hosted by Neon.

Production setup requires:

1. Create a PostgreSQL database.
2. Add the production `DATABASE_URL` to the hosting provider.
3. Deploy the Next.js application.
4. Apply Prisma migrations.
5. Run the seed script if seed data is required in the deployed environment.

The production deployment should contain the seeded dataset before submission.

---

# Design Decisions

## Why PostgreSQL?

The application has naturally relational data between return requests and notes.

PostgreSQL also provides:

* durable persistence
* transactions
* indexes
* relational constraints
* efficient filtering and pagination

This is a better fit than a document database for this workflow.

## Why Prisma?

Prisma provides strongly typed database access while keeping the schema and migrations easy to understand.

It also works well with TypeScript and PostgreSQL.

## Why Next.js Route Handlers?

ReturnDesk is small enough that a separate Express service would introduce unnecessary deployment and infrastructure complexity.

Next.js Route Handlers allow the frontend and API to live in the same application while still exposing a clear API boundary.

## Why Zod?

Zod provides runtime validation at the API boundary and gives predictable validation errors.

TypeScript alone cannot validate data received over HTTP, so runtime validation is necessary.

## Why Soft Delete?

The assignment explicitly requires that removing a request must not destroy its record.

`removedAt` allows the active application to hide the request while retaining the underlying database record.

## Why Centralized Business Rules?

The lifecycle and workflow constraints are the core of the application.

Keeping these rules in dedicated modules makes them:

* easier to test
* easier to reason about
* reusable by different API endpoints
* harder to accidentally bypass

The frontend only controls what actions are presented to the user. The server remains the final authority.

---

# Assumptions

The assignment does not specify an authentication system, so ReturnDesk does not implement authentication or role-based access control.

The application assumes the current user is a support agent.

The assignment also does not specify a separate product/order database, so order and item information required for a return request is stored directly on the request.

The item is identified by `itemSku` for the live-request uniqueness rule.

Removing a request is treated as an operational "take off the desk" action and therefore uses soft deletion.

---

# What Is Not Included

The following are intentionally outside the scope of the assignment:

* Authentication
* Role-based permissions
* Real payment/refund processing
* Email notifications
* Customer-facing return portal
* External order-management integration
* File/image uploads
* Analytics/reporting dashboard

These could be added later without changing the core request workflow.

---

# Future Improvements

If additional development time were available, possible improvements would include:

* Authentication and agent accounts
* Audit log for every status change
* Agent attribution on notes and actions
* Real refund-provider integration
* Customer notification emails
* File attachments for damaged-item evidence
* Advanced filtering
* Request activity timeline
* Observability and structured logging
* More comprehensive end-to-end browser tests

---

# Submission Notes

This project was built specifically for the ReturnDesk take-home assignment.

The implementation prioritizes:

1. Server-side business-rule enforcement
2. Correct relational data modeling
3. Predictable API behavior
4. Server-side search/filter/sort/pagination
5. A usable responsive interface
6. Test coverage for critical workflow rules
7. Clear documentation

---

# Project Architecture

<img width="1536" height="1024" alt="ReturnDesk-ARC" src="https://github.com/user-attachments/assets/7db9c2fa-0c96-41d1-be97-bd3a5e9bd503" />

---

# Time Spent

Approximately **[X hours]**.
=======
## Deployment Configuration

For deploying to production (e.g. Vercel + Neon PostgreSQL):
1. Configure `DATABASE_URL` in environment configuration variables.
2. Run migrations automatically during build step in Vercel:
   ```bash
   npx prisma db push --accept-data-loss
   ```

---

## Incomplete Features

None. All Phase 1 and Phase 2 functionalities are complete and fully tested.

---

## Time Spent

* **Phase 1 (Database, APIs, Business Rules, Tests)**: ~2 hours
* **Phase 2 (Tailwind Setup, Components, Pages, Responsive Integration)**: ~2 hours
* **Total Time Spent**: **4 hours**
>>>>>>> da406b3 (Phase 2 Frontend, UX, Testing & Deployment)
