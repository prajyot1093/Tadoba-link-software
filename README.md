# 🐅 Tadoba Smart Conservation System

An intelligent wildlife surveillance and conservation management platform for Tadoba National Park, featuring real-time animal tracking, AI-powered unauthorized entry detection, and comprehensive forest management tools.

## 🎯 Hackathon Project Overview

This system addresses critical wildlife conservation challenges through technology:
- **Real-time Surveillance**: YOLO-based detection of humans and vehicles in restricted forest areas
- **Animal Tracking**: GPS-enabled tracking of tigers and other wildlife
- **Smart Alerts**: Immediate notifications for unauthorized entry in non-patrolling zones
- **Safari Management**: Digital booking system for wildlife safaris
- **Analytics Dashboard**: Data-driven insights for forest department officials

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon serverless)
- npm or yarn

### Installation

```bash
# Clone the repository
cd Tadoba-link-software/AuthVista

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Access the application at `http://localhost:5000`

## 📁 Project Structure

```
AuthVista/
├── client/           # React frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       └── hooks/       # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database operations
│   └── surveillance/ # Surveillance module
├── shared/           # Shared TypeScript types
└── design_guidelines.md  # UI/UX specifications
```

## 🔑 Key Features

### For Forest Department Officials
- 📊 **Dashboard Analytics**: Real-time statistics on animal populations and movements
- 🐾 **Animal Management**: Track and manage wildlife data
- 🗺️ **Interactive Maps**: Visualize animal locations and movement patterns
- 📷 **Surveillance Monitoring**: Monitor camera feeds and detection alerts
- 📅 **Booking Management**: Oversee safari bookings and guide assignments

### For Local Residents
- 🚨 **Safety Alerts**: Notifications when animals are near human settlements
- 🗺️ **Safe Zone Maps**: View areas safe for movement
- 🎫 **Safari Booking**: Book wildlife safari experiences
- 💬 **AI Assistant**: Get information about wildlife and safety

### Surveillance System (Core Innovation)
- 🤖 **YOLO Object Detection**: Identify humans and vehicles in camera feeds
- 📸 **Multi-Camera Support**: Monitor multiple forest locations
- ⚡ **Real-Time Alerts**: Instant notifications for unauthorized entry
- 📈 **Detection Analytics**: Track patterns and high-risk zones
- 🗺️ **Geo-Tagged Detections**: Map view of all detection events

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + Radix UI
- TanStack Query for state management
- Leaflet for interactive maps
- Framer Motion for animations

### Backend
- Express.js with TypeScript
- Drizzle ORM + PostgreSQL
- WebSockets for real-time updates
- JWT authentication
- TensorFlow.js / YOLOv8 for object detection

### Deployment
- Frontend: Vercel
- Backend: Railway / Vercel serverless
- Database: Neon PostgreSQL
- Storage: Cloudinary / AWS S3

## 📸 Screenshots

*(Add screenshots here before hackathon presentation)*

## 🎥 Demo

Live Demo: [Coming Soon]
Video Demo: [Coming Soon]

## 🔐 Authentication

The system supports two user roles:
- **Department Officials**: Full access to all features
- **Local Residents**: Limited access to safety features

## 🗺️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Get current user

### Animals
- `GET /api/animals` - List all animals
- `POST /api/animals` - Add new animal (department only)
- `PATCH /api/animals/:id` - Update animal

### Surveillance
- `POST /api/surveillance/process-frame` - Process camera frame
- `GET /api/surveillance/detections` - Get detection history
- `GET /api/surveillance/alerts` - Get active alerts

### Safari Booking
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking

*See `HACKATHON_24HR_PLAN.md` for detailed API documentation*

## 🌱 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-secret-key-here

# Server
PORT=5000
NODE_ENV=development

# Optional: External Services
OPENAI_API_KEY=sk-...
CLOUDINARY_URL=cloudinary://...
```

## 🧪 Testing

```bash
# Run TypeScript type checking
npm run check

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

- [24-Hour Hackathon Plan](./HACKATHON_24HR_PLAN.md) - Complete execution strategy
- [Status Report](./STATUS_REPORT.md) - Current project status
- [Design Guidelines](./AuthVista/design_guidelines.md) - UI/UX specifications
- [API Documentation](./AuthVista/replit.md) - Detailed API reference

## 🤝 Team

*(Add team member names and roles)*

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Tadoba National Park for inspiration
- TensorFlow.js community
- Radix UI for component library
- shadcn/ui for design system

## 📞 Contact

For hackathon judges or inquiries:
*(Add contact information)*

---

**Built with ❤️ for wildlife conservation**
