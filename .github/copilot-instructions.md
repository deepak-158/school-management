# Copilot Instructions for School Management Portal

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive school management portal built with Next.js 15, TypeScript, and Tailwind CSS. The application features role-based authentication and dashboards for three types of users:

### User Roles
1. **Students**: View profile, academic results, timetable, attendance, announcements, and submit leave requests
2. **Teachers**: Manage student attendance, enter results, create announcements, view/manage timetables, and handle leave requests
3. **Principal/Admin**: Full system access including user management, analytics, system-wide announcements, and approvals

### Technical Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Authentication**: Role-based access control
- **Database**: SQLite with better-sqlite3 for local development
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: React Context for user session and app state

### Code Standards
- Use TypeScript for all components and utilities
- Follow Next.js App Router conventions
- Implement responsive design with mobile-first approach
- Use semantic HTML and accessible components
- Prefer server components where possible
- Use client components only when necessary (user interactions, state management)

### File Organization
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions, database, and types
- `/src/context` - React Context providers
- `/database` - Database schema and seed data

### Security Considerations
- Implement proper authentication middleware
- Validate user permissions for all protected routes
- Sanitize user inputs
- Use environment variables for sensitive configuration
