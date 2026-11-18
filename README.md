# 🎟️ CityPass

**CityPass** is a full-stack event discovery and booking platform designed to help users discover, explore, and book tickets for events happening across different cities. Built with a modular client-server architecture and role-based access control, CityPass provides dedicated workflows for general users, event organisers, administrators, and super administrators.

---

## 📋 Table of Contents
- [Project Overview & Objectives](#-project-overview--objectives)
- [Key Features & Modules](#-key-features--modules)
- [Software Requirements Specification (SRS)](#-software-requirements-specification-srs)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [API Documentation (`/v1`)](#-api-documentation-v1)
- [Authentication & Security](#-authentication--security)
- [System Workflows](#-system-workflows)
- [Testing & Validation](#-testing--validation)
- [Installation & Setup](#-installation--setup)
- [Deployment & Maintenance](#-deployment--maintenance)
- [Limitations & Future Enhancements](#-limitations--future-enhancements)

---

## 🎯 Project Overview & Objectives

| Attribute | Details |
| :--- | :--- |
| **Project Name** | CityPass |
| **Project Type** | Event Discovery and Booking Platform |
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | Node.js, Express.js 5, TypeScript |
| **Database** | MySQL |
| **Image Storage** | Cloudinary |
| **API Structure** | REST API (`/v1`) |
| **Authentication** | JWT, HttpOnly Cookies |
| **Author** | Niveditha M |

### Core Objectives
* Provide a centralised event discovery platform across multiple cities and categories.
* Enable users to register, log in, manage profiles, book tickets, and request cancellations.
* Empower approved event organisers to create events, configure ticket tiers, and track bookings/attendees.
* Equip administrators and super administrators with centralised moderation over users, organisers, events, cities, and categories.
* Enforce secure authentication and strict role-based access control (RBAC).

---

## ✨ Key Features & Modules

### 👤 User Module
* **Account Management:** Registration, login/logout, profile updates, password management, and account deactivation/reactivation.
* **Event Discovery:** Browse available events across supported cities and categories, and view detailed event pages via URL slugs.
* **Ticketing & Bookings:** Explore ticket tiers, create bookings, view booking history, and request booking cancellations with automated refund calculation.

### 🎪 Organiser Module
* **Onboarding:** Users can submit organiser applications for administrative review.
* **Event & Ticket Management:** Approved organisers can create, edit, cancel, and manage event statuses along with multiple ticket categories.
* **Attendee Tracking:** Monitor event bookings and manage attendees.

### 🛡️ Admin & Super Admin Module
* **Platform Oversight:** Manage users, events, approved organisers, cities, and event categories.
* **Approval Workflows:** Review, approve, or reject incoming organiser requests and manage event statuses.

---

## 📄 Software Requirements Specification (SRS)

### Functional Requirements
* **FR-01 (User Registration):** Allow new users to create an account with required registration details.
* **FR-02 (User Authentication):** Validate credentials for registered users and establish an authenticated session.
* **FR-03 (Event Discovery):** Display available events through the event listing functionality.
* **FR-04 (Event Details):** Render detailed information for individual events via their URL or slug.
* **FR-05 (Ticket Management):** Display available ticket categories and pricing per event.
* **FR-06 (Booking Management):** Allow authenticated users to create bookings and view booking records.
* **FR-07 (Booking Cancellation):** Allow users to request booking cancellations.
* **FR-08 (Organiser Requests):** Enable users to apply for organiser privileges and administrators to review them.
* **FR-09 (Event Management):** Enable approved organisers to create, update, manage, and cancel their events.
* **FR-10 (Administrative Management):** Allow administrators to manage users, events, cities, categories, organisers, and organiser requests.

### Non-Functional Requirements
* **Performance:** Efficient processing of REST API requests and database connection pooling.
* **Security:** Password hashing with `bcrypt`, HttpOnly cookie JWTs, and token versioning.
* **Scalability & Maintainability:** Modular MVC backend and component-driven frontend architecture.
* **Reliability & Data Integrity:** Consistent relational records and structured error handling.
* **Usability:** Responsive, intuitive user interface across desktop and mobile viewports.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 19** | Building reusable UI components |
| **TypeScript** | Static typing |
| **Vite** | Frontend development and build tooling |
| **React Router DOM** | Client-side navigation |
| **Context API** | Global state (`AuthContext`, `UserContext`, `CityContext`) |
| **Axios** | HTTP communication with backend APIs |
| **Lucide React & React Icons** | UI iconography |
| **Date-fns & React Datepicker** | Date formatting and selection |

### Backend & Storage
| Technology | Purpose |
| :--- | :--- |
| **Node.js & Express.js 5** | JavaScript runtime and REST API framework |
| **TypeScript & `tsx`** | Type-safe backend development and execution |
| **MySQL & `mysql2`** | Relational database with `mysql2/promise` connection pooling |
| **JWT & `bcrypt`** | Token-based authentication and password hashing |
| **Express Validator** | Incoming request validation |
| **Cookie Parser & CORS** | Cookie handling and cross-origin resource sharing |
| **Multer & Cloudinary SDK** | Multipart file uploads and cloud-based image storage |
| **dotenv** | Environment variable management |

---

## 🏗️ System Architecture

CityPass follows a layered **client-server MVC architecture**:

```text
[ CityPass User ]
       │
       ▼
[ React 19 + Vite Frontend ] ──(Axios HTTP Requests + HttpOnly Cookies)──┐
                                                                        ▼
[ Cloudinary Image Storage ] ◄──(Multer / SDK)── [ Express 5 Backend (Node.js) ]
                                                        │
                                                        ├─► Routes (/v1)
                                                        ├─► Middlewares (JWT & RBAC)
                                                        ├─► Validators (Express Validator)
                                                        ├─► Controllers (Business Logic)
                                                        └─► Models ──► [ MySQL Database ]
```

* **Frontend Layer:** Renders UI, manages navigation via `AppRoutes.tsx`, maintains global authentication/city state via Context API, and communicates with the backend via Axios.
* **Backend Layer:** Separates routing (`/v1`), authentication/role middlewares, input validation (`express-validator`), business logic (controllers), and SQL queries (models).

---

## 🗄️ Database Schema

The relational MySQL database is structured around the following core tables:

| Table | Purpose |
| :--- | :--- |
| `users` | Stores user credentials, roles, account status, and token version for session invalidation |
| `organizers` | Stores approved organiser profiles linked to user accounts |
| `organizer_requests` | Stores pending and reviewed organiser applications submitted by users |
| `cities` | Maintains supported cities for location-based event discovery |
| `categories` | Stores event classifications and filtering categories |
| `events` | Stores event details, schedules, slugs, statuses, and organiser associations |
| `event_tickets` | Stores ticket categories, pricing, and availability per event |
| `bookings` | Stores user ticket reservations, confirmation statuses, and cancellation records |

### Conceptual Relationships
```text
users ──┬──► organizer_requests
        ├──► organizers ──► events ──► event_tickets ──► bookings
        └──► bookings

cities ──── categories ──── events
```

---

## 📁 Project Structure

```text
CityPass/
├── backend/
│   ├── config/          # Database pool, JWT, and Cloudinary configuration
│   ├── routes/v1/       # Versioned REST API route definitions
│   ├── controllers/     # Request handlers and application business logic
│   ├── models/          # MySQL database queries and data operations
│   ├── middleware/      # JWT authentication and role-based access control
│   ├── validators/      # Express Validator request rules
│   ├── types/           # TypeScript interfaces and custom types
│   ├── server.ts        # Application entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application views and dashboards
│   │   ├── context/     # AuthContext, UserContext, and CityContext
│   │   ├── config/      # API and frontend configuration
│   │   ├── routes/      # AppRoutes.tsx navigation setup
│   │   ├── assets/      # Static assets
│   │   ├── App.tsx      # Root component & health check initialization
│   │   └── main.tsx     # React DOM entry point
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## 🔌 API Documentation (`/v1`)

All backend endpoints are versioned under the `/v1` prefix and return standardized JSON responses:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

### Authentication Endpoints
| Endpoint | Description |
| :--- | :--- |
| `POST /v1/auth/register` | Register a new user account |
| `POST /v1/auth/login` | Authenticate credentials and issue an HttpOnly JWT cookie |
| `POST /v1/auth/logout` | Clear authentication cookie and end session |
| `GET /v1/auth/profile` | Retrieve or manage authenticated user profile |

### Event & Booking Endpoints
| Endpoint | Description |
| :--- | :--- |
| `GET /v1/events/events` | Retrieve filtered event listings |
| `GET /v1/events/:slug` | Retrieve detailed event information by URL slug |
| `GET /v1/events/:eventId/tickets` | Retrieve available ticket tiers for an event |
| `GET / POST /v1/bookings` | Create a new booking or fetch user booking history |
| `POST /v1/bookings/:id/cancel` | Cancel an existing booking and calculate refund |

> Additional protected route groups handle **User** account management (password changes, account deactivation/reactivation), **Organiser** operations (profile, event CRUD, ticket tiers, attendee lists), and **Admin / Super Admin** moderation (users, events, cities, categories, organiser approvals).

---

## 🔐 Authentication & Security

* **HttpOnly Cookie JWTs:** Upon login, a signed JWT is stored in an `HttpOnly` cookie (`userToken` / `token`), mitigating client-side XSS token theft.
* **Token Versioning:** Authentication middleware validates the JWT payload's token version against the `users` table in MySQL to support immediate server-side session invalidation.
* **Password Hashing:** All user passwords are salted and hashed using `bcrypt` prior to storage.
* **Role-Based Access Control (RBAC):** Middleware guards protected routes across `USER`, `ORGANIZER` / `ORGANISER`, `ADMIN`, and `SUPER_ADMIN` roles.

---

## 🔄 System Workflows

1. **User Registration & Login:** Frontend submits credentials → Backend validates input, hashes/verifies password via `bcrypt`, stores/fetches record in MySQL, and sets an `HttpOnly` JWT cookie.
2. **Event Discovery:** Frontend fetches city/category-filtered listings from `/v1/events/events` and renders event details via `/v1/events/:slug`.
3. **Ticket Booking & Cancellation:** Authenticated users select ticket tiers and submit a booking to MySQL. Cancellation requests verify ownership, update booking status, and calculate the eligible refund amount.
4. **Organiser Onboarding & Event Creation:** Users submit an organiser application → Admin approves request → Organiser creates events with Cloudinary-hosted images and configures ticket tiers.

---

## 🧪 Testing & Validation

Recommended validation matrix before production deployment:

| Category | Key Scenarios |
| :--- | :--- |
| **Functional** | User registration/login, event discovery & slug routing, ticket retrieval, booking creation/cancellation, organiser request submission, and admin approval workflows. |
| **Security** | Invalid/expired JWT rejection, token version invalidation, RBAC route enforcement, input validation, file upload MIME checks, secure cookie flags, and parameterized SQL queries. |

---

## 🚀 Installation & Setup

### Prerequisites
* **Hardware:** Intel i3 or above, minimum 8 GB RAM, 10 GB free storage
* **Software:** Node.js (v18+ recommended), npm, MySQL Server (v8.0+), Git
* **Services:** Cloudinary account for image storage

### 1. Clone the Repository
```bash
git clone [https://github.com/NivedithaDevang/CityPass.git](https://github.com/NivedithaDevang/CityPass.git)
cd CityPass
```

### 2. Database Setup
Create the MySQL database and initialize the required schema tables (`users`, `organizers`, `organizer_requests`, `cities`, `categories`, `events`, `event_tickets`, `bookings`):
```sql
CREATE DATABASE citypass;
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=citypass
JWT_SECRET=your_jwt_secret
REACT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file inside `frontend/` (ensure the API client configuration reads from this variable rather than a hardcoded URL):
```env
VITE_API_BASE_URL=http://localhost:5000
```
Start the frontend development server:
```bash
npm run dev
```

---

## 🌐 Deployment & Maintenance

* **Frontend:** Build static assets using `npm run build` and deploy to Vercel, Netlify, or similar static hosting with production `VITE_API_BASE_URL` configured.
* **Backend:** Deploy to a Node.js hosting environment with production environment variables, HTTPS, secure cookie flags, and CORS restricted to the production frontend origin.
* **Database & Maintenance:** Host MySQL with restricted network access and automated backups; periodically audit dependencies, Cloudinary storage quotas, and backend error logs.

---

## 🗺️ Limitations & Future Enhancements

### Current Limitations
* Bookings are marked as confirmed directly without a live payment gateway transaction; cancellations calculate refund amounts without external payout execution.
* SQL schema/migration scripts and an automated test suite are not yet bundled in the repository.
* Frontend API configuration currently references a local development URL (`http://localhost:5000`) and should be fully wired to `VITE_API_BASE_URL` prior to deployment.

### Future Enhancements
* [ ] **Payment & Refund Gateway:** Integrate Razorpay for live ticket checkout and automated refund payouts.
* [ ] **QR Code E-Tickets:** Generate unique scannable QR codes for confirmed bookings and venue entry verification.
* [ ] **Email Notifications:** Send automated booking confirmations, cancellation receipts, and event reminders.
* [ ] **Advanced Search & Filters:** Filter events by date range, price tier, popularity, and location.
* [ ] **Organiser Analytics Dashboard:** Provide visual insights into ticket sales, revenue, and attendee demographics.
* [ ] **Production Hardening:** Add Helmet security headers, API rate limiting, CSRF protection, strict MIME upload validation, and automated unit/integration tests.
