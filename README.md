# Task Management Application

![Task Management](https://img.shields.io/badge/status-active-brightgreen)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)

A full-stack task management system with user authentication, task CRUD operations, and file attachments.

## Features

- **User Authentication**: JWT-based registration and login
- **Task Management**: Create, read, update, and delete tasks
- **File Attachments**: Upload and download PDF documents for tasks
- **Admin Dashboard**: User management for admin roles
- **Responsive UI**: Built with Tailwind CSS
- **Docker Support**: Easy containerization
- **PostgreSQL**: Relational database for data storage
- **API Documentation**: Well-defined endpoints

## Project Structure
<pre> ## 📂 Project Structure ``` task-management/ ├── backend/ │ ├── src/ │ │ ├── controllers/ │ │ ├── middleware/ │ │ ├── models/ │ │ ├── routes/ │ │ └── app.js │ ├── uploads/ │ ├── package.json │ └── Dockerfile ├── frontend/ │ ├── src/ │ │ ├── components/ │ │ ├── context/ │ │ ├── pages/ │ │ └── App.js │ ├── package.json │ └── Dockerfile ├── docker-compose.yml └── README.md ``` </pre>

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose
- Git

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-repo/task-management.git
cd task-management

# Start all services
docker-compose up --build

# Access the application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# PostgreSQL: localhost:5432

