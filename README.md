# Operion - Workforce Management System

A modern, full-featured workforce management application built with React, TypeScript, and TanStack Router. Operion helps organizations manage employees, departments, attendance, leaves, projects, and tasks in a unified interface.

## Features

- **Dashboard**: Comprehensive overview of workforce metrics and statistics
- **Employee Management**: Manage employee profiles, roles, and permissions
- **Department Management**: Organize teams and organizational structure
- **Attendance Tracking**: Clock in/out functionality with attendance history
- **Leave Management**: Request and manage leave requests
- **Project Management**: Create and track projects with detailed views
- **Task Management**: Kanban-style task boards with drag-and-drop functionality
- **Role-Based Access Control**: Granular permissions for different user roles

## Screenshots

### Admin Dashboard
![Admin Dashboard](/public/admin-dashboard.png)

### Employees
![Employees](/public/employees.png)

### Projects
![Projects](/public/projects.png)

### Project Details
![Project Details](/public/project-details.png)

### Tasks
![Tasks](/public/tasks.png)

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **State Management**: Zustand, TanStack Query
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Charts**: Recharts
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Development

```bash
# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
operion-client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Shared components (PageHeader, StatusBadge, etc.)
│   │   ├── layout/      # Layout components (Sidebar, Header, etc.)
│   │   └── ui/          # Radix UI components
│   ├── lib/             # Utilities and helpers
│   │   ├── api/         # API client and endpoints
│   │   └── permissions/ # Role-based permissions
│   ├── routes/          # File-based routing
│   ├── stores/          # Zustand stores
│   └── styles/          # Global styles
├── public/              # Static assets
└── package.json
```

## Key Features Implementation

### Role-Based Access Control
The application uses a permission system where each role has specific permissions:
- **Admin**: Full access to all features
- **Manager**: Access to department and team management
- **Employee**: Self-service access to attendance, leaves, and assigned tasks

### Task Management
- Kanban board with drag-and-drop task organization
- Task status tracking (TODO, IN_PROGRESS, DONE)
- Priority levels with visual indicators
- Task filtering by project and assignee

### Attendance System
- Clock in/out functionality
- Attendance history with status badges
- Real-time status tracking
- Admin view of all employee attendance

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.
