# ReturnDesk

ReturnDesk is a simple web app for managing customer return requests.

Support agents can create return requests, review them, approve or reject them, add notes, complete requests, and remove requests when allowed.

## Live App

**Website:** [https://frido-return-desk.vercel.app/](https://frido-return-desk.vercel.app/?utm_source=chatgpt.com)

**GitHub:** [ReturnDesk GitHub Repository](https://github.com/AyushYadav1113/Frido-Return_Desk.git?utm_source=chatgpt.com)

---

## Architecture Diagram

<img width="1536" height="1024" alt="ReturnDesk-ARC" src="https://github.com/user-attachments/assets/5c29d8da-c237-41c9-84c6-0f63d7a7e5c0" />

---

## Tech Stack

* **Next.js** - Frontend and backend
* **React** - UI
* **TypeScript** - Type safety
* **Tailwind CSS** - Styling
* **Node.js** - Backend runtime
* **PostgreSQL** - Database
* **Prisma** - Database access
* **Zod** - Data validation

---

## Features

* Create a return request
* Automatically generate a unique request reference
* Search by customer, order, or reference
* Filter by status and return reason
* Sort requests
* Paginate requests
* View complete request details
* Add notes to requests
* Approve requests
* Reject requests
* Complete approved requests
* Select Refund, Replacement, or Store Credit
* Add a refund amount when required
* Edit request details when allowed
* Remove requests without deleting them from the database
* Responsive design for mobile screens
* Loading, empty, and error states
* Server-side validation and business rules

---

## Return Flow

A request follows this flow:

```text
Open
  ↓
In Review
  ↓
Approved
  ↓
Completed
```

A request can also be rejected:

```text
In Review
  ↓
Rejected
```

`Rejected` and `Completed` are final states.

---

## Business Rules

The main business rules are checked on the server.

### 1. Status Flow

Only these status changes are allowed:

```text
Open → In Review
In Review → Approved
In Review → Rejected
Approved → Completed
```

Other status changes are rejected.

### 2. Approval

A request cannot be approved without a resolution.

Available resolutions:

* Refund
* Replacement
* Store Credit

If the resolution is **Refund**, the refund amount must be greater than `0`.

If the resolution is **Replacement** or **Store Credit**, no refund amount can be recorded.

### 3. Duplicate Requests

A customer cannot have two active requests for the same item on the same order.

After the previous request is rejected or completed, a new request can be created.

### 4. Locked Requests

After a request becomes:

* Approved
* Rejected
* Completed

its customer and item details cannot be changed.

Notes can still be added.

### 5. Removing Requests

Only `Open` and `Rejected` requests can be removed.

Removing a request does not delete it from PostgreSQL. It is treated as a soft delete.

Removed requests are hidden from the normal request list and cannot be fetched through the normal request view.

---

## Search, Filter and Pagination

Search, filtering, sorting, and pagination are handled on the server.

The application does not load all requests into the browser and filter them there.

Agents can search using:

* Customer name
* Order number
* Request reference

They can also filter by:

* Status
* Return reason

---

## Notes

Agents can add notes at any point during the request lifecycle.

Notes are:

* Stored in PostgreSQL
* Shown in order
* Not editable
* Not deletable

---

## API

The application provides API endpoints for the main request actions.

```text
GET    /api/requests
POST   /api/requests
GET    /api/requests/:id
PATCH  /api/requests/:id
DELETE /api/requests/:id

POST   /api/requests/:id/status
POST   /api/requests/:id/notes
```

The API returns proper HTTP status codes and JSON error messages when an action is not allowed.

---

## Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/AyushYadav1113/Frido-Return_Desk.git
cd Frido-Return_Desk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env` file in the project root.

```env
DATABASE_URL="your_postgresql_database_url"
```

Do not commit the real `.env` file.

Use `.env.example` as a reference.

### 4. Setup the database

Run the Prisma migrations:

```bash
npx prisma migrate dev
```

### 5. Add seed data

```bash
npm run db:seed
```

The seed script adds 30+ sample return requests across different statuses and return reasons.

### 6. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Useful Commands

Start development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Seed the database:

```bash
npm run db:seed
```

---

## Database

ReturnDesk uses PostgreSQL for permanent data storage.

The main data includes:

* Return requests
* Customer information
* Order information
* Item information
* Request status
* Return reason
* Resolution
* Refund amount
* Notes
* Created and updated dates
* Removal information

Prisma is used to communicate with PostgreSQL.

---

## Responsive Design

The application is designed to work on different screen sizes, including mobile screens down to approximately `375px` width.

The UI includes:

* Responsive request list
* Mobile-friendly forms
* Responsive filters
* Responsive request details
* Clear status indicators
* Loading states
* Empty states
* Error messages

---

## Error Handling

The server returns useful errors when an action is not allowed.

For example:

```json
{
  "error": {
    "code": "REQUEST_LOCKED",
    "message": "Request details cannot be changed after approval."
  }
}
```

The frontend shows these errors to the user instead of silently ignoring them.

---

## Seed Data

The seed script creates at least 30 requests.

The data covers:

* Open
* In Review
* Approved
* Rejected
* Completed

It also includes all return reasons:

* Damaged
* Wrong Item
* Size Issue
* Not As Described
* Changed Mind

Some requests also contain notes for testing the notes timeline.

---

## Assumptions

Authentication is not included because it was not required in the assignment.

The application assumes that the person using ReturnDesk is a support agent.

An external order or product system is also not included. The required order and item information is stored with the return request.

---

## Future Improvements

If more time was available, I would consider adding:

* Agent authentication
* Agent names on notes and actions
* Activity/audit history
* Email notifications
* File uploads for damaged products
* Real refund integration
* Customer return portal
* More automated tests

---

## Time Spent

Approximately 4 Hours in Development and 30 Min in Deployment 

---

## Author

**Ayush Yadav**

📧 **Email:** [ayushyadav212121@gmail.com](mailto:ayushyadav212121@gmail.com)

📱 **Phone:** 7651885203

🐙 **GitHub:** [Ayush Yadav](https://github.com/AyushYadav1113?utm_source=chatgpt.com)
