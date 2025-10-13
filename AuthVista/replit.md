# Tadoba Smart Conservation

A comprehensive wildlife conservation management system for Tadoba Tiger Reserve featuring dual-portal dashboards, real-time animal tracking, geo-fencing alerts, AI assistance, and safari booking.

## Overview

Tadoba Smart Conservation is a modern web application built to protect wildlife while empowering local communities. The system provides role-based access for Department Officials and Local Citizens with specialized features for each user group.

## Features

### Department Portal (Forest Officers, Admins)
- **Live Animal Dashboard**: Real-time analytics and wildlife monitoring statistics
- **Animal Management**: Add, track, and manage tiger lineage and bloodline data
- **Live Map Tracking**: Interactive map showing real-time animal locations with GPS coordinates
- **AI Camera Feed**: Upload and analyze camera footage for wildlife activity
- **Safari Booking Management**: View and manage all tourist bookings
- **Alert System**: Create and broadcast proximity alerts to local communities

### Local Portal (Villagers, Tourists)
- **Personal Dashboard**: Safety statistics and nearby wildlife information
- **Safe Grazing Zones**: Interactive map highlighting protected cattle grazing areas
- **Tiger Family Tracker**: Explore tiger bloodlines and family trees
- **AI Assistant**: Chatbot for wildlife information and animal image identification
- **Safari Booking**: Book wildlife tours with transparent pricing and guide selection
- **Real-time Alerts**: Receive proximity warnings when animals approach your area

## Technology Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS with custom jungle theme
- Leaflet.js for interactive maps
- Framer Motion for animations

### Backend
- Express.js REST API
- PostgreSQL with Drizzle ORM
- Replit Auth for authentication
- WebSocket for real-time notifications
- Role-based access control

## Recent Changes

**October 2025**: Initial MVP implementation
- Implemented dual-portal authentication system with role-based dashboards
- Created comprehensive animal tracking and management features
- Built interactive map systems with geo-fencing capabilities
- Integrated AI chatbot interface for wildlife assistance
- Developed safari booking system with guide selection
- Set up real-time WebSocket alerts for proximity warnings
- Applied jungle-themed glassmorphic design with green-orange palette

## Project Architecture

### Database Schema
- **users**: User accounts with role-based access (department/local)
- **animals**: Wildlife data including tigers, leopards, and other species
- **animal_locations**: GPS tracking history for animal movements
- **safe_zones**: Protected grazing areas for cattle
- **safari_bookings**: Tourist booking management
- **alerts**: Proximity alert system for community safety
- **sessions**: Authentication session storage

### Key Components
- `/client/src/pages/`: All page components (dashboards, maps, booking, etc.)
- `/client/src/components/`: Reusable UI components and sidebar
- `/server/routes.ts`: API endpoints and WebSocket server
- `/server/storage.ts`: Database operations layer
- `/shared/schema.ts`: Shared TypeScript types and Drizzle schemas

## User Preferences

- **Design**: Jungle-themed dark mode with glassmorphism effects
- **Colors**: Primary green (#4ade80) and tiger orange (#fb923c)
- **Typography**: Poppins for headings, Montserrat for body text
- **Maps**: Leaflet with custom animal markers and 2km alert radius

## API Endpoints

### Authentication
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/logout` - User logout
- `GET /api/auth/user` - Get current user info

### Animals
- `GET /api/animals` - List all animals
- `POST /api/animals` - Add new animal (department only)
- `GET /api/animals/:id` - Get animal details
- `PATCH /api/animals/:id` - Update animal (department only)
- `GET /api/animals/:id/locations` - Get location history

### Bookings
- `GET /api/bookings/my` - User's bookings
- `GET /api/bookings/all` - All bookings (department only)
- `POST /api/bookings` - Create new booking

### Alerts
- `GET /api/alerts/my` - User's alerts
- `GET /api/alerts/recent` - Recent alerts
- `POST /api/alerts` - Create alert (department only)

### Safe Zones
- `GET /api/safe-zones` - List all safe zones
- `POST /api/safe-zones` - Create safe zone (department only)

### WebSocket
- `WS /ws` - Real-time alert notifications

## Environment Variables

Required secrets:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Session encryption key (auto-configured)
- `OPENAI_API_KEY` - For AI chatbot features (optional for MVP)

## Development

The application runs on a single port using Express + Vite:
- Frontend: React SPA with hot reload
- Backend: Express server with WebSocket support
- Database: PostgreSQL with Drizzle ORM

To add new features:
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to sync database
3. Add routes in `server/routes.ts`
4. Create UI components in `client/src/`

## Notes

- User role defaults to 'local' on signup (can be changed to 'department' via database)
- Safe zones and initial animal data can be seeded using seed scripts
- WebSocket connection enables real-time proximity alerts with 2km radius
- Maps use Tadoba coordinates (20.2347, 79.3401) as default center
- AI features ready for YOLO/vision model integration
