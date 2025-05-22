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

*   **Frontend:** Web interface for administrators.
*   **Backend API:** RESTful API for the frontend and client applications.
*   **Database:** Stores project information and license statuses.
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

### 6.2. For Client Applications

*   **`GET /api/license/check_status?project_identifier={identifier}`**
    *   Description: Allows a client application to check its license status.
    *   Query Parameters:
        *   `project_identifier`: The unique identifier of the client project.
    *   Response:
        *   Success (200 OK): `{ "status": "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID" }`
        *   Not Found (404 Not Found): If the project identifier is invalid.
        *   Error (500 Internal Server Error): If an unexpected error occurs.

## 7. User Interface (UI) Design - "Apple Style"

*(This section outlines the UI/UX, focusing on a clean, modern, and intuitive "Apple-like" aesthetic. The application now features a default dark theme, with a light theme as an alternative, configurable by the user.)*

*   **Overall Layout: Application Shell**
    *   **`Top-bar`**: A horizontal bar at the top of the screen.
        *   Contains placeholder breadcrumbs for navigation context.
        *   Includes a placeholder search input field.
        *   Features placeholder action buttons (e.g., notifications, user profile).
    *   **`Layout-body`**: The main area below the `Top-bar`, divided into:
        *   **`Floating-sidebar` (Left Vertical Bar)**:
            *   Replaces the previous text-based project list with an icon-based navigation.
            *   **Navigation Icons**:
                *   Dashboard/Home: Shows an overview of projects.
                *   Add Project: Opens the form to add a new project.
                *   (Placeholder icons for User, Bell, Info, Settings).
            *   **Action Icons (at the bottom)**:
                *   Theme Toggle (Light/Dark).
                *   Logout.
        *   **`Main-content-area`**: The primary workspace to the right of the `Floating-sidebar`.
            *   When no project is selected (Dashboard view): Displays `DashboardOverview` with project cards.
            *   When "Add Project" is clicked or a project is being edited: Displays the `ProjectForm`.
            *   When a project is selected from the `DashboardOverview` (or future project list): Displays `ProjectDetails` with project information (`project_name`, `project_identifier`, `client_ip_address`, `created_at`, `updated_at`, `notes`) and controls to change `license_status`.
            *   Edit/Delete project options are available within the `ProjectDetails` view.

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

## 9. Technology Stack (Proposed)

*   **Backend:** Node.js with Express.js (or Python with Flask/Django)
*   **Frontend:** React.js with a modern UI library (e.g., Tailwind CSS for utility-first styling, or a component library that can be customized for an Apple-like feel) or Svelte/Vue.js.
*   **Database:** PostgreSQL (relational, good for structured data) or MongoDB (NoSQL, flexible).
*   **Deployment:** Docker & Docker Compose.

## 10. Setup and Deployment

*(To be detailed: Instructions on how to build and run the application using Docker Compose.)*

The application is designed to be easily run using Docker Compose.

```yaml
# license-manager/docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "${BACKEND_PORT:-4000}:4000"
    env_file:
      - .env # Ensure .env file is loaded
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-admin}:${POSTGRES_PASSWORD:-password}@database:5432/${POSTGRES_DB:-license_manager_db}
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - NODE_ENV=${NODE_ENV:-development}
    volumes:
      - ./backend:/usr/src/app
      - /usr/src/app/node_modules # Prevent local node_modules from overwriting container's
    depends_on:
      database:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      # REACT_APP_API_URL is no longer needed here as Nginx handles proxying
    ports:
      # Nginx in the frontend container listens on port 80
      - "${FRONTEND_PORT:-3000}:80"
    volumes:
      # For development, mounting src might still be useful for React's hot reloading
      # if Nginx serves static files but the dev server is somehow still involved (less common with this setup).
      # For a pure Nginx static serve setup from a build, this volume mount for /app/src might be less relevant
      # as changes would require a rebuild of the React app and then the Docker image.
      # However, if the entrypoint uses react-scripts start, it's useful.
      # Given current setup, it's for the former.
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public # Mount public as well for completeness if create-react-app dev server is used
    depends_on:
      - backend
    # Environment variables for the frontend container itself (e.g. for Nginx or entrypoint scripts if any)
    # NODE_ENV is useful for react-scripts if it's used in the container.
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    restart: unless-stopped

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER} # Loaded from .env
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD} # Loaded from .env
      - POSTGRES_DB=${POSTGRES_DB} # Loaded from .env
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - ./data/db:/var/lib/postgresql/data # Persist database data locally
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-license_manager_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

# The database files will be stored in the './data/db' directory relative to your docker-compose.yml file.
# Ensure this directory is writable by the user running the Docker daemon or the user inside the container.
```

### Environment Variables

Create a `.env` file in the root of the `license-manager` project directory. This file stores sensitive configuration and is not committed to version control (ensure `.env` is in your `.gitignore` file).

**Example `.env` file:**
```env
# .env for License Manager

# Backend Configuration
BACKEND_PORT=4000
# Generate a strong, random string for JWT_SECRET (e.g., using: openssl rand -hex 32)
JWT_SECRET=yourSuperSecretAndLongRandomStringForJWT
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=yoursecurepassword
NODE_ENV=development # Switch to 'production' for deployment

# Frontend Configuration
FRONTEND_PORT=3000
# REACT_APP_API_URL is no longer directly used by the React app's build process in docker-compose.yml
# because Nginx now proxies /api/ to the backend.
# It can be removed from .env or kept for other potential uses if any.
# For clarity, we will comment it out or remove it from the example to avoid confusion.
# REACT_APP_API_URL=http://backend:4000/api 

# Database Configuration
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme # !!! IMPORTANT: Change this to a strong, unique password !!!
POSTGRES_DB=license_manager_db
DB_PORT=5432 # This is the port exposed to the host machine if needed for direct DB access.
```
**Note:** The `REACT_APP_API_URL` in the `.env` file provides a default if not overridden elsewhere, but the `docker-compose.yml` explicitly sets it for the build arguments and runtime environment of the frontend service, ensuring inter-container communication.

### Running the Application

1.  **Prerequisites:** Ensure Docker and Docker Compose are installed.
2.  **Clone the Repository (if applicable).**
3.  **Create `.env` file:** In the project root, create your `.env` file based on the example. **Crucially, set strong, unique values for `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `POSTGRES_PASSWORD`.**
4.  **Create Database Directory:**
    Create a directory for the persistent database data:
    ```bash
    mkdir -p ./data/db
    ```
    This step is important if the directory doesn't exist, as Docker might have permission issues creating it on some systems.
5.  **Build and Start Containers:**
    Open a terminal in the project root and run:
    ```bash
    docker-compose up --build
    ```
    To run in detached mode (in the background), add the `-d` flag: `docker-compose up --build -d`.
6.  **Accessing the Application:**
    *   Frontend (Web UI): `http://localhost:3000` (or the `FRONTEND_PORT` you set in `.env`).
    *   Backend API (if needed directly): `http://localhost:4000` (or `BACKEND_PORT`).
7.  **Stopping the Application:**
    *   If running in the foreground, press `Ctrl+C`.
    *   If running in detached mode, use:
        ```bash
        docker-compose down
        ```
    To stop and remove volumes (like the database data, use with caution):
    ```bash
    docker-compose down -v
    ```

## 11. Further Development & UI Polishing (Apple Style)

*(This section can be expanded with specific tasks related to achieving the "Apple style" UI, such as font choices, layout refinements, icon usage, and animations.)*

## 12. Ethical and Legal Considerations

*   The implementation of a "kill switch" mechanism must be handled with care.
*   Ensure clear communication with clients regarding how the licensing and deactivation process works.
*   Verify that this approach complies with contractual agreements and relevant laws.

## 13. Future Enhancements

*   Email notifications for license status changes or upcoming expiries (if applicable).
*   Detailed logging and auditing of license checks and status changes.
*   Role-based access control for the admin UI.
*   More sophisticated client-side validation techniques (if deemed necessary).
*   Webhook integrations for payment gateways to automatically update license status.
``` 