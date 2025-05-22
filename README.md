# License Manager

A web application to manage software licenses for client applications. Administrators can control the operational status of client software based on their payment status.

## Overview

The License Manager provides a central dashboard to:
*   Register and manage client projects (applications).
*   Set license statuses for each project: "Not Paid," "Partially Paid," or "Fully Paid."
*   Provide an API endpoint for client applications to check their current license status.

Client applications are expected to contact the License Manager periodically (e.g., daily) to verify their license. Based on the response, client applications will adjust their functionality:
*   **Not Paid**: The client application should be disabled or run in a very limited mode.
*   **Partially Paid**: The client application is fully functional but must continue periodic checks.
*   **Fully Paid**: The client application is fully functional, and periodic checks can cease.

## Features

*   **Admin Dashboard**: Modern, Apple-style UI for managing projects and licenses.
*   **Project Management**: CRUD operations for client projects.
*   **License Status Control**: Easily update the license status for each project.
*   **Client API**: A simple GET endpoint for client applications to check their status.
*   **JWT Authentication**: Secure admin actions.
*   **Admin Password Management**: Securely change admin passwords via the settings page. Admin credentials from `.env` are used for initial setup if no admin exists.
*   **Notification System**: View important system and application events (e.g., project changes, logins, password updates) on a dedicated notifications page.
*   **Dockerized**: Easy to deploy using Docker Compose.

For more detailed information on the database schema and all API endpoints, please refer to `license-manager.md`.

## Technology Stack

*   **Backend**: Node.js with Express.js
*   **Frontend**: React.js (with Context API for state management)
*   **Database**: PostgreSQL
*   **Web Server (Frontend)**: Nginx (serving static React build and proxying API requests)
*   **Deployment**: Docker & Docker Compose

## Project Structure

```
license-manager/
├── backend/                 # Node.js Express backend application
│   ├── db/                  # Database connection and initialization
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # API routes (projects.js, license.js, auth.js, notifications.js)
│   ├── services/            # Business logic services (e.g., notificationService.js)
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── frontend/                # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # React components (Login.js, ProjectList.js, SettingsPage.js, NotificationsPage.js etc.)
│   │   ├── contexts/
│   │   ├── services/        # API service
│   │   ├── App.js
│   │   ├── index.js
│   │   └── ...
│   ├── Dockerfile
│   ├── nginx.conf           # Nginx configuration for serving and proxying
│   └── package.json
├── data/                    # Persistent PostgreSQL data (mounted volume)
│   └── db/
├── .env.example             # Example environment variables (rename to .env and fill in)
├── .gitignore
├── docker-compose.yml
├── license-manager.md       # Detailed project documentation (database schema, all API endpoints, etc.)
└── README.md                # This file
```

## Setup and Deployment

1.  **Prerequisites**:
    *   Docker installed ([https://www.docker.com/get-started](https://www.docker.com/get-started))
    *   Docker Compose installed (usually comes with Docker Desktop)

2.  **Clone the Repository (if you haven't already)**:
    ```bash
    git clone git@github.com:BangerTech/license-manager.git
    cd license-manager
    ```

3.  **Environment Configuration**:
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and provide your own secure values for:
        *   `JWT_SECRET` (generate a strong random string)
        *   `ADMIN_USERNAME`
        *   `ADMIN_PASSWORD`
        *   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (can be kept as default for local dev, but change for production)
        *   Other ports if needed (defaults are usually fine for local setup).

4.  **Create Database Directory**:
    This step ensures the directory for persistent database data exists with correct permissions.
    ```bash
    mkdir -p ./data/db
    ```

5.  **Build and Run with Docker Compose**:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Forces a rebuild of the images if there are changes in `Dockerfile` or application code.
    *   `-d`: Runs the containers in detached mode (in the background).

6.  **Accessing the Application**:
    *   **Frontend (Admin UI)**: `http://localhost:3000` (or the `FRONTEND_PORT` you set in `.env`)
    *   **Backend API (if direct access is needed)**: `http://localhost:4000` (or the `BACKEND_PORT` you set in `.env`)

7.  **Default Admin Credentials**:
    *   Use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you configured in your `.env` file to log in for the first time (if no admin user exists in the database).
    *   It is highly recommended to change the default password immediately after the first login using the "Settings" page.

8.  **Stopping the Application**:
    ```bash
    docker-compose down
    ```
    To stop and remove volumes (including database data, use with caution!):
    ```bash
    docker-compose down -v
    ```

## Client Application Integration

Client applications should make a GET request to:
`/api/license/check_status?project_identifier=YOUR_PROJECT_IDENTIFIER`

*   Replace `YOUR_PROJECT_IDENTIFIER` with the unique identifier you set for the project in the admin dashboard.
*   The license manager will respond with a JSON object:
    ```json
    {
      "status": "NOT_PAID" // or "PARTIALLY_PAID", "FULLY_PAID"
    }
    ```
*   Clients should handle these statuses accordingly. See `client_license_check_example.js` for a basic Node.js client implementation example and `license-manager.md` for detailed client integration logic.

## Further Development

*   Refine UI/UX elements further.
*   Implement a Notification Context to display unread notification counts in the sidebar.
*   Enhance error handling and user feedback across the application.
*   Consider adding more robust security measures for production environments (e.g., rate limiting, advanced logging).
*   Explore role-based access control (RBAC) for different admin levels.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

(This is a basic README. You can expand it with more details about specific API endpoints, advanced configuration, or deployment to specific platforms.) 