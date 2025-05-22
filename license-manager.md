# License Manager

## 1. Introduction

The License Manager is a web application designed to control the operational status of client applications based on their license and payment status. It provides a central dashboard to manage various projects (client applications), allowing the administrator to set their status to "Not Paid," "Partially Paid," or "Fully Paid."

Client applications will periodically check in with the License Manager to ascertain their current status and adjust their functionality accordingly.

## 2. Core Goals

*   Provide a secure and reliable way to manage software licenses.
*   Offer a modern, intuitive, and aesthetically pleasing user interface (Apple-style).
*   Enable remote enabling/disabling of client applications based on payment status.
*   Minimize overhead on client applications, especially once fully licensed.
*   Deployable via Docker Compose.

## 3. Features

*   **Project Management:**
    *   Add new client projects (applications) to be managed.
    *   View a list of all managed projects.
    *   Each project will have a unique identifier.
*   **License Status Control:**
    *   For each project, set one of three statuses:
        *   `NOT_PAID`: The client application should be disabled.
        *   `PARTIALLY_PAID`: The client application functions normally but must continue daily checks.
        *   `FULLY_PAID`: The client application functions normally and no longer needs to check in with the license server.
*   **Client Application Interaction:**
    *   Client applications query an API endpoint to get their current license status.
    *   The License Manager responds with the status, guiding the client app's behavior.

## 4. High-Level Architecture

*(To be detailed: This section will describe the main components of the License Manager, e.g., Frontend, Backend API, Database, and how they interact. We'll likely use a Node.js backend with a React/Vue/Svelte frontend, and a PostgreSQL or MongoDB database, all containerized with Docker.)*

### 4.1. Components

*   **Frontend:** Web interface for administrators, built with React.
    *   **Core Structure (`frontend/src/`):**
        *   `App.js`: Main application component, sets up routing and global providers.
        *   `index.js`: Entry point for the React application.
        *   `services/api.js`: Centralized Axios instance for API communication.
    *   **Contexts (`frontend/src/context/`):**
        *   `AuthContext.js`: Manages user authentication state, token, user details, and provides login/logout functionality.
        *   `ProjectContext.js`: Manages project data (fetching, adding, updating, deleting), selected project state, and current view mode within the main content area.
        *   `ThemeContext.js`: Manages the application's theme (dark/light mode) and persistence in `localStorage`.
    *   **UI Components (`frontend/src/components/`):**
        *   `Login.js`: Handles user login.
        *   `ProjectList.js`: The floating icon-based sidebar for navigation and actions.
        *   `DashboardOverview.js`: Displays project cards on the main dashboard.
        *   `ProjectDetails.js`: Shows detailed information for a selected project.
        *   `ProjectForm.js`: Form used for creating new projects and editing existing ones.
        *   `MainContentHeader.js`: Component at the top of the main content area, displaying breadcrumbs, page title, and a (placeholder) search bar.
        *   `InfoPage.js`: Displays application information, features, and copyright.
        *   `SettingsPage.js`: Allows authenticated users to change their password.
        *   `NotificationsPage.js`: Displays a list of system notifications with pagination and read-status management.
*   **Backend API:** RESTful API (Node.js/Express) for the frontend and client applications.
*   **Database:** PostgreSQL, stores project information, admin credentials, and license statuses.
*   **Docker Orchestration:** `docker-compose.yml` to manage services.

## 5. Database Schema

*(To be detailed: This section will define the structure of the database tables/collections. We'll need at least a `Projects` table/collection.)*

### 5.1. `Projects` Table/Collection

| Column/Field        | Data Type     | Description                                     | Constraints/Notes                 |
| ------------------- | ------------- | ----------------------------------------------- | --------------------------------- |
| `id`                | UUID/ObjectID | Primary Key                                     | Auto-generated, Unique            |
| `project_name`      | String        | User-friendly name of the client application  | Required, Unique                  |
| `project_identifier`| String        | Unique identifier used by the client app for API calls | Required, Unique, Indexed         |
| `client_ip_address` | String        | Optional: IP address or hostname of client app  |                                   |
| `license_status`    | Enum/String   | Current license status                          | `NOT_PAID`, `PARTIALLY_PAID`, `FULLY_PAID`. Default: `NOT_PAID` |
| `created_at`        | Timestamp     | Date and time of project creation             | Auto-generated                    |
| `updated_at`        | Timestamp     | Date and time of last status update           | Auto-generated                    |
| `notes`             | Text          | Optional: Administrator notes about the project |                                   |

### 5.2. `Admins` Table

This table stores credentials for administrators who can log into the admin UI.

| Column/Field  | Data Type     | Description                                      | Constraints/Notes                                  |
|---------------|---------------|--------------------------------------------------|----------------------------------------------------|
| `id`          | SERIAL        | Primary Key, auto-incrementing integer           | Unique                                             |
| `username`    | VARCHAR(255)  | Username for the admin                           | Required, Unique                                   |
| `password_hash`| VARCHAR(255)  | Hashed password for the admin                    | Required                                           |
| `created_at`  | TIMESTAMPTZ   | Date and time of admin account creation          | Default: `NOW()`                                   |
| `updated_at`  | TIMESTAMPTZ   | Date and time of last admin account update       | Default: `NOW()`, updates on password change       |

**Note on Initial Admin:** The `ADMIN_USERNAME` and `ADMIN_PASSWORD` specified in the `.env` file are used to create an initial admin user if the `admins` table is empty upon application startup. Subsequent logins and password management will use this table.

### 5.3. `Notifications` Table

This table stores records of important events that occur within the application, which are then displayed to the administrator on the Notifications page.

| Column/Field   | Data Type     | Description                                                                 | Constraints/Notes                                                               |
|----------------|---------------|-----------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `id`           | SERIAL        | Primary Key, auto-incrementing integer                                      | Unique                                                                          |
| `event_type`   | VARCHAR(100)  | Type of event (e.g., `PROJECT_CREATED`, `ADMIN_LOGIN_SUCCESS`)            | Required                                                                        |
| `message`      | TEXT          | Human-readable message describing the notification                          | Required                                                                        |
| `project_id`   | UUID          | Foreign key to the `projects` table (if related to a project)             | Optional, `ON DELETE SET NULL`                                                  |
| `admin_id`     | INTEGER       | Foreign key to the `admins` table (if related to an admin action)         | Optional, `ON DELETE SET NULL`                                                  |
| `details`      | JSONB         | Additional structured data related to the event (e.g., old/new values)    | Optional                                                                        |
| `is_read`      | BOOLEAN       | Indicates if the notification has been read by an admin                     | Default: `FALSE`                                                                |
| `created_at`   | TIMESTAMPTZ   | Date and time the notification was created                                  | Default: `CURRENT_TIMESTAMP`                                                    |

## 6. API Endpoints

*(To be detailed: This section will describe the API endpoints exposed by the License Manager's backend.)*

### 6.1. For Administrative UI

*   **`GET /api/projects`**
    *   Description: Retrieves a list of all projects.
    *   Response: Array of project objects.
*   **`POST /api/projects`**
    *   Description: Creates a new project.
    *   Request Body: `{ "project_name": "string", "project_identifier": "string", "client_ip_address": "string" (optional), "notes": "string" (optional) }`
    *   Response: The newly created project object.
*   **`PUT /api/projects/{projectId}/status`**
    *   Description: Updates the license status of a specific project.
    *   Request Body: `{ "license_status": "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID" }`
    *   Response: The updated project object.
*   **`DELETE /api/projects/{projectId}`**
    *   Description: Deletes a project.
    *   Response: Success/failure message.

### 6.2. For Authentication & Authorization

*   **`POST /api/auth/login`**
    *   Description: Authenticates an administrator.
    *   Request Body: `{ "username": "string", "password": "string" }`
    *   Response: `{ "token": "JWT_TOKEN", "user": { "id": "integer", "username": "string" } }`
    *   Note: This endpoint now authenticates against the `admins` table in the database.

*   **`PUT /api/auth/change-password`**
    *   Description: Allows an authenticated administrator to change their password.
    *   Authentication: Requires JWT Bearer token.
    *   Request Body: `{ "currentPassword": "string", "newPassword": "string", "confirmPassword": "string" }`
    *   Response (Success 200 OK): `{ "message": "Password changed successfully." }`
    *   Response (Error 400 Bad Request): If input is invalid (e.g., passwords don't match, new password too short).
    *   Response (Error 401 Unauthorized): If `currentPassword` is incorrect or token is invalid/expired.

### 6.3. For Notifications (Admin UI)

All notification endpoints require JWT Bearer token authentication.

*   **`GET /api/notifications`**
    *   Description: Retrieves a list of notifications for the administrator.
    *   Query Parameters:
        *   `limit` (integer, optional, default: 20): Number of notifications per page.
        *   `offset` (integer, optional, default: 0): Number of notifications to skip (for pagination).
        *   `unreadOnly` (boolean, optional, default: false): If true, returns only unread notifications.
    *   Response: `{ notifications: [...], totalCount: integer, limit: integer, offset: integer }`

*   **`PUT /api/notifications/{notificationId}/read`**
    *   Description: Marks a specific notification as read.
    *   Response: The updated notification object.

*   **`PUT /api/notifications/read-all`**
    *   Description: Marks all unread notifications as read for the current admin (or globally, depending on implementation nuances).
    *   Response: `{ message: "All unread notifications marked as read." }`

### 6.4. For Client Applications

*   **`GET /api/license/check_status?project_identifier={identifier}`**
    *   Description: Allows a client application to check its license status.
    *   Query Parameters:
        *   `project_identifier`: The unique identifier of the client project.
    *   Response:
        *   Success (200 OK): `{ "status": "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID" }`
        *   Not Found (404 Not Found): If the project identifier is invalid.
        *   Error (500 Internal Server Error): If an unexpected error occurs.

## 7. User Interface (UI) Design - "Apple Style"

*(This section outlines the UI/UX, focusing on a clean, modern, and intuitive "Apple-like" aesthetic. The application now features a default dark theme, with a light theme as an alternative, configurable by the user. The overall page layout has been updated to an "inset" style where the main application content (sidebar and main area) has padding, but the page background extends to the browser edges. State management is handled via React's Context API: `AuthContext`, `ProjectContext`, and `ThemeContext`.)*

*   **Overall Layout: Application Shell**
    *   The previous full-width `Top-bar` has been removed. Its functionalities (breadcrumbs, page title, search bar) are now integrated into a `MainContentHeader` component displayed at the top of the `Main-content-area`.
    *   **`Layout-body`**: The main application area, characterized by an "inset" appearance, is divided into:
        *   **`Floating-sidebar` (Left Vertical Bar)**:
            *   Icon-based navigation.
            *   **Navigation Icons (from top to bottom)**:
                *   Logo/Dashboard (Home): Shows an overview of projects (`DashboardOverview`).
                *   Add Project (`PlusCircle`): Opens the form to add a new project (`ProjectForm`).
                *   Notifications (`Bell`): Navigates to the `NotificationsPage`. (Functionality Added)
                *   Information (`Info`): Displays the `InfoPage`.
            *   **Action Icons (at the bottom, from top to bottom)**:
                *   Theme Toggle (Sun/Moon): Toggles between Light and Dark themes.
                *   Settings (`SettingsIcon`): Navigates to the `SettingsPage` for password changes.
                *   Logout (`LogOut`): Logs out the current administrator.
        *   **`Main-content-area`**: The primary workspace to the right of the `Floating-sidebar`.
            *   Starts with the `MainContentHeader` (displaying dynamic breadcrumbs, page title based on `ProjectContext`'s `viewMode`, and a search bar placeholder).
            *   `DashboardOverview.js`: Shown by default or when navigating "Home". Displays project cards or a "No Projects Yet" message.
            *   `ProjectForm.js`: Shown when `viewMode` is `add_form` or `edit_form`.
            *   `ProjectDetails.js`: Shown when `viewMode` is `details`.
            *   `InfoPage.js`: Shown when `viewMode` is `info`.
            *   `SettingsPage.js`: Shown when `viewMode` is `settings`.
            *   `NotificationsPage.js`: Shown when `viewMode` is `notifications`.

*   **Styling:**
    *   Minimalist design, generous use of space, consistent with the new CSS variables for colors, radii, and transitions.
    *   **Default Dark Theme:** The UI defaults to a dark theme, with a light theme available via a toggle. Color variables are defined for both themes.
    *   High-quality typography (Apple-inspired font stack).
    *   Subtle animations and transitions.
    *   Clear iconography (using `react-feather` icons).
    *   Responsive design considerations are ongoing.
    *   Content presentation uses `.Content-card` for a consistent look and feel.
    *   Forms (`.Form-container`) and buttons (`.Form-actions`) are styled for clarity and modern aesthetics.

## 8. Client Application Integration Logic

Client applications need to implement logic to communicate with the License Manager.

### 8.1. Configuration on Client Side

*   `LICENSE_SERVER_URL`: The base URL of the License Manager (e.g., `http://your-license-server.com`).
*   `PROJECT_IDENTIFIER`: The unique identifier for this specific client instance.
*   `CURRENT_LICENSE_STATUS`: Locally cached status (e.g., `ACTIVE`, `DISABLED_PAYMENT_DUE`, `FULLY_LICENSED`). Initialized to a state that allows first check-in or a grace period.
*   `LAST_LICENSE_CHECK_DATE`: Timestamp of the last successful check.

An example Node.js client implementation can be found in `client_license_check_example.js` in the repository.

### 8.2. Daily Scheduled Job (Client Side)

1.  **Check Local Status:**
    *   If `CURRENT_LICENSE_STATUS` is `FULLY_LICENSED`, the job does nothing further.
2.  **Perform API Call:**
    *   Otherwise, send an HTTP GET request to:
        `{LICENSE_SERVER_URL}/api/license/check_status?project_identifier={PROJECT_IDENTIFIER}`
3.  **Process Response:**
    *   **On successful response (e.g., HTTP 200 with JSON):**
        *   Parse the `status` from the JSON response (e.g., `{"status": "NOT_PAID"}`).
        *   If `status` is `NOT_PAID`:
            *   Update `CURRENT_LICENSE_STATUS` to `DISABLED_PAYMENT_DUE`.
            *   Trigger application disablement logic (e.g., block incoming requests, show a "license invalid" message, shut down non-critical services).
            *   Update `LAST_LICENSE_CHECK_DATE`.
        *   If `status` is `PARTIALLY_PAID`:
            *   Update `CURRENT_LICENSE_STATUS` to `ACTIVE`.
            *   Ensure the application is fully functional.
            *   Update `LAST_LICENSE_CHECK_DATE`. The check will run again the next day.
        *   If `status` is `FULLY_PAID`:
            *   Update `CURRENT_LICENSE_STATUS` to `FULLY_LICENSED`.
            *   Ensure the application is fully functional.
            *   Update `LAST_LICENSE_CHECK_DATE`. The daily job will no longer make API calls.
    *   **On API call failure (server unreachable, network error, non-200 response):**
        *   Implement a grace period: The application should continue to function for a predefined number of days or failed attempts (e.g., 3-7 days).
        *   Log the error.
        *   If the grace period expires after repeated failures, the application may choose to enter a disabled state or a limited functionality mode.
4.  **Application Behavior Based on Status:**
    *   `DISABLED_PAYMENT_DUE`: Core functionalities are blocked.
    *   `ACTIVE`: Full functionality.
    *   `FULLY_LICENSED`: Full functionality indefinitely (from the perspective of license checks).

### 8.3. Security Considerations for Client Side

*   While the client-side check can be bypassed by a technically savvy user with access to the client's environment, this mechanism serves as a control for honest customers.
*   Obfuscation of client-side checking logic can be considered but is not foolproof.

## 9. Recent Development Milestones

*   **UI Overhaul (Apple Style)**: Significant update to the user interface based on a reference image, implementing a floating icon-based sidebar, removing the top bar, and integrating its elements into a new main content header. Achieved an "inset" layout design.
*   **Info Page Implementation**: Added a dedicated "Information" page accessible via the sidebar, providing key details about the application, its features, and the technology stack, along with a copyright notice.
*   **Dark Theme by Default**: The application now defaults to a dark theme, with a light theme toggle available.
*   **GitHub Integration**: Initial project structure pushed to `git@github.com:BangerTech/license-manager.git`.
*   **Client Check Example**: Provided `client_license_check_example.js` to demonstrate client-side integration.

## 10. Technology Stack (Confirmed)

*   **Backend:**
    *   Node.js
    *   Express.js (Web Framework)
    *   PostgreSQL (Database)
    *   `pg` (Node.js PostgreSQL client)
    *   `jsonwebtoken` (JWT for authentication)
    *   `bcryptjs` (Password hashing)
    *   `cors` (Cross-Origin Resource Sharing)
    *   `dotenv` (Environment variable management)
*   **Frontend:**
    *   React (UI Library)
    *   React Context API (State Management - `AuthContext`, `ProjectContext`, `ThemeContext`)
    *   `react-scripts` (Create React App tooling)
    *   `web-vitals`
    *   `jwt-decode` (Decoding JWTs on the client-side)
    *   `react-feather` (Icons)
    *   CSS (Custom styling, CSS Variables for theming)
*   **DevOps/Environment:**
    *   Docker & Docker Compose
    *   Nginx (as a reverse proxy for the frontend and API, serving static frontend assets)
*   **Version Control:**
    *   Git
    *   GitHub

## 11. Project Structure Overview

### Backend (`./backend/`)
*   `server.js`: Main application file, sets up Express server, middleware, routes.
*   `Dockerfile`: Defines the Docker image for the backend service.
*   `package.json`: Node.js project manifest and dependencies.
*   `routes/`: Contains route handlers for different API endpoints (e.g., `projects.js`, `auth.js`, `license.js`, `notifications.js`).
*   `db/index.js`: Manages database connection pool and table initialization logic.
*   `middleware/auth.js`: JWT authentication middleware.
*   `services/notificationService.js`: Service for creating and managing notifications.

### Frontend (`./frontend/`)
*   `Dockerfile`: Defines the multi-stage Docker build for the React application and Nginx server.
*   `package.json`: Frontend project manifest and dependencies.
*   `public/`: Contains static assets like `index.html` and `favicon.ico`.
*   `src/`:
    *   `index.js`: Main entry point of the React application.
    *   `App.js`: Root component, defines global layout and routing logic using Contexts.
    *   `App.css`, `index.css`: Global stylesheets and theme variables.
    *   `assets/`: Static assets like images (e.g., `logo.png`).
    *   `components/`: Reusable React UI components (e.g., `Login.js`, `ProjectList.js`, `DashboardOverview.js`, `MainContentHeader.js`, `InfoPage.js`, `SettingsPage.js`, `NotificationsPage.js`).
    *   `context/`: React Context API providers and consumers (e.g., `AuthContext.js`, `ProjectContext.js`, `ThemeContext.js`).
    *   `services/api.js`: Axios instance configured for API communication.

### Root Directory (`./`)
*   `docker-compose.yml`: Defines and configures all services (backend, frontend, database).
*   `.env`, `.env.example`: Environment variable configuration.
*   `license-manager.md`: This document.
*   `README.md`: General project readme.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `client_license_check_example.js`: Example Node.js script for client-side license checking.
*   `data/db/`: (Gitignored) Stores persistent PostgreSQL data.

## 12. Setup and Running the Application

1.  **Prerequisites:** Docker and Docker Compose must be installed.
2.  **Clone Repository:** `git clone git@github.com:BangerTech/license-manager.git` (or your fork)
3.  **Environment Configuration:**
    *   Navigate to the project root.
    *   Copy `.env.example` to `.env`: `cp .env.example .env`
    *   Edit `.env` and fill in the required values, especially for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET`.
4.  **Build and Run:**
    *   From the project root, run: `docker compose up --build -d`
    *   The `-d` flag runs the containers in detached mode.
    *   Use `docker compose logs -f frontend` or `docker compose logs -f backend` to view logs.
5.  **Accessing the Application:**
    *   Frontend (Admin UI): `http://localhost:3000` (or the `FRONTEND_PORT` specified in `.env`)
    *   Backend API: `http://localhost:4000/api` (or the `BACKEND_PORT` specified in `.env`, accessible via Nginx reverse proxy at `/api/` from the frontend's perspective)

## 13. Known Issues / TODOs

*   **Build Error Investigation:**
    *   The frontend build process sometimes fails with `Module not found: Error: Can't resolve '../contexts/AuthContext' in '/app/src/components'`. This occurs even after verifying and correcting import paths to use `../context/AuthContext` (singular) from within component files. Further investigation is needed, potentially related to Docker build caching or a more subtle import issue.
*   **Search Functionality:** The search bar in `MainContentHeader.js` is currently a placeholder and needs to be implemented.
*   **Client IP Address:** The `client_ip_address` field in the `projects` table is optional and not currently used extensively in the client check logic, but could be enhanced for security or logging.
*   **Error Handling & User Feedback:** While basic error handling is in place, it can be made more robust and user-friendly across the application.
*   **Testing:** Comprehensive unit and integration tests are needed for both backend and frontend.
*   **Full Light Theme Review:** Ensure all components are styled correctly for the light theme.
*   **Advanced Notification Features:** Consider real-time notifications or more detailed filtering.
*   **Security Hardening:** Conduct a thorough security review, especially for API endpoints and authentication mechanisms.

---
_This document was last updated on: YYYY-MM-DD_ (Will be replaced by a script or manually at actual update)
``` 