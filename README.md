# 🎟️ CityPass

**CityPass** is a full-stack city experience and event discovery platform where users can explore events and attractions across cities, purchase passes, and manage their bookings. Event organizers can create and manage events, while administrators oversee users, organizers, events, and platform content using JWT authentication and role-based authorization.

---

## ✨ Key Features

* **Authentication & Role-Based Access Control (RBAC):** Secure user registration and login powered by JWT and `bcrypt`, supporting distinct workflows for **Users**, **Organizers**, and **Admins**.
* **Event & Attraction Discovery:** Browse and filter events, activities, and concerts by city and category.
* **Pass Booking & Management:** Seamless pass purchasing workflow with dedicated booking history tracking for users.
* **Organizer Dashboard:** End-to-end tools for organizers to submit organizer requests, create listings, and manage event passes.
* **Admin Control Panel:** Centralized system for approving organizer requests and moderating users, events, and bookings.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, TypeScript, CSS
* **Backend:** Node.js, Express.js, TypeScript (MVC Architecture)
* **Database:** MySQL
* **Security & Auth:** JSON Web Tokens (JWT), bcrypt, RESTful API validation

---

## 🗄️ Database Schema

The relational database is structured around the following core entities:

| Table | Description |
| :--- | :--- |
| `Users` | Stores user credentials, profile info, and assigned roles |
| `Organizers` | Verified organizer profiles linked to user accounts |
| `Organizer Requests` | Pending applications from users requesting organizer privileges |
| `Cities` | Supported cities for event discovery |
| `Categories` | Event classifications (e.g., Concerts, Activities, Attractions) |
| `Events` | Event details, schedules, locations, and organizer associations |
| `Passes` | Ticket tiers, pricing, and availability per event |
| `Bookings` | Transaction records linking users to purchased event passes |

---

## 📁 Project Structure

```text
CityPass/
├── backend/          # Express & TypeScript REST API (MVC architecture)
│   ├── src/
│   │   ├── config/       # Database and environment configuration
│   │   ├── controllers/  # Request handlers and business logic
│   │   ├── middlewares/  # JWT auth, role checks, and input validation
│   │   ├── models/       # MySQL queries and data models
│   │   ├── routes/       # API route definitions
│   │   └── app.ts        # Express app entry point
│   └── package.json
│
├── frontend/         # React & TypeScript web client
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Event discovery, concerts, activities, and dashboards
│   │   ├── services/     # API integration layer
│   │   └── App.tsx
│   └── package.json
│
└── README.md
