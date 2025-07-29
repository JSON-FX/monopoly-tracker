# Docker Installation and Management for MonopolyTracker

This document provides instructions on how to install, start, and stop the MonopolyTracker application using Docker and Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Docker Desktop**: Includes Docker Engine and Docker Compose. Download from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).

## Installation and Setup

1.  **Clone the Repository (if you haven't already):**

    ```bash
    git clone <repository_url>
    cd monopolytracker
    ```

2.  **Build and Start the Docker Containers:**

    Navigate to the root directory of the `monopolytracker` project (where `docker-compose.yml` is located) and run the following command:

    ```bash
    docker-compose up --build -d
    ```

    *   `up`: Creates and starts containers.
    *   `--build`: Builds images before starting containers. This is important for the first run or after code changes.
    *   `-d`: Runs containers in detached mode (in the background).

    This command will:
    *   Build the `frontend` (React app with Nginx) and `backend` (Node.js API) Docker images.
    *   Pull the `mysql:8.0` Docker image for the database.
    *   Create and start the `frontend`, `backend`, and `db` containers.
    *   Initialize the MySQL database with the schema from `backend/src/config/schema.sql`.

3.  **Configure your Hosts File:**

    To access the application using the `monopolytracker.local` domain, you need to add an entry to your system's hosts file. This file maps hostnames to IP addresses.

    *   **Linux/macOS:** Open your terminal and run:
        ```bash
        sudo nano /etc/hosts
        ```
    *   **Windows:** Open Notepad as an administrator and open `C:\Windows\System32\drivers\etc\hosts`.

    Add the following line to the end of the file:

    ```
    127.0.0.1 monopolytracker.local
    ```

    Save and close the file.

## Starting the Application

If the containers are stopped, you can start them again without rebuilding the images:

```bash
docker-compose start
```

## Stopping the Application

To stop the running containers without removing them:

```bash
docker-compose stop
```

To stop and remove all containers, networks, and volumes created by `docker-compose.yml`:

```bash
docker-compose down --volumes
```

*   `down`: Stops and removes containers and networks.
*   `--volumes`: Removes named volumes declared in the `volumes` section of the `docker-compose.yml` file. This is useful for a clean slate, especially for the database.

## Accessing the Application

Once the containers are running and your hosts file is configured, you can access the application in your web browser at:

[http://monopolytracker.local](http://monopolytracker.local)
