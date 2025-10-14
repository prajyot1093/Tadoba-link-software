# 🐅 Tadoba Conservation System

> **AI-Powered Wildlife Surveillance & Anti-Poaching Platform**  
> Built for 24-hour hackathon | Conservation Technology | YOLO Detection Integration

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/prajyot1093/Tadoba-link-software)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)

---

## 🎯 Project Overview

**Tadoba Conservation System** is a comprehensive wildlife management and anti-poaching surveillance platform designed for Tadoba Tiger Reserve. The system leverages AI-powered object detection (YOLO) to identify threats in real-time, providing rangers and forest officials with critical tools to protect endangered wildlife.

### ✨ Key Features

#### 🎥 **Surveillance System**
- **12 Strategic Camera Locations** across Tadoba Tiger Reserve
- **Real-time YOLO Detection** for humans, weapons, and vehicles
- **4-Level Threat Classification**: Critical → High → Medium → Low
- **WebSocket Alerts** with browser notifications and sound
- **Interactive Map View** with Leaflet integration
- **Detection Timeline** with filtering and search

#### 📊 **Analytics Dashboard**
- **7-Day Trend Analysis** with threat level breakdown
- **Threat Distribution Charts** (pie, bar, line graphs)
- **Top 5 Cameras** by detection frequency
- **24-Hour Activity Patterns** for identifying peak risk times
- **Object Type Analysis** (person, weapon, car, truck, motorcycle)
- **Auto-refresh** every 60 seconds

#### ⚙️ **Settings & Configuration**
- **Camera Parameters**: Detection confidence, alert thresholds
- **Notifications**: Sound/browser alerts, quiet hours
- **Display Preferences**: Theme, map zoom, grid layout
- **System Monitoring**: Database status, storage usage
- **Demo Data Generator** with one-click UI trigger

#### 🐯 **Wildlife Management**
- **Animal Tracking**: GPS location history, sighting logs
- **Safe Zones**: Geofenced protected areas
- **Tiger Tracker**: Individual tiger monitoring
- **Safari Booking**: Tourist permit system
- **AI Chat Assistant**: Natural language queries

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** with TypeScript 5.6.3
- **Wouter** for client-side routing
- **TanStack Query** (React Query) for data fetching
- **Shadcn UI** + **Tailwind CSS** for components
- **Recharts** for data visualization
- **Leaflet** for interactive maps
- **Vite 5.4.20** for blazing-fast development

### Backend
- **Express.js 4.21.2** with TypeScript
- **PostgreSQL** (Drizzle ORM) for data persistence
- **JWT Authentication** with bcrypt password hashing
- **WebSocket (ws 8.18.0)** for real-time alerts
- **Multer 2.0.2** for image upload handling

### AI/ML Integration
- **YOLO (Pretrained Model)** for object detection
- Mock detection service for hackathon demo
- Supports: person, weapon, car, truck, motorcycle classes
- Confidence scoring and bounding box coordinates

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/prajyot1093/Tadoba-link-software.git
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

The application will be available at `http://localhost:5000`

### Demo Data Generation

1. Navigate to **Settings** → **System** tab
2. Click **"Generate Data"** button in the Demo Data Generator card
3. System will create:
   - 12 cameras across Tadoba
   - 100-150 detections over past 7 days
   - Realistic threat distribution

---

## 📁 Project Structure

```
AuthVista/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn UI components
│   │   │   ├── surveillance/ # Surveillance-specific components
│   │   │   └── app-sidebar.tsx
│   │   ├── pages/           # Route pages
│   │   │   ├── surveillance/ # Surveillance dashboard & detection
│   │   │   ├── analytics/   # Analytics dashboard
│   │   │   ├── settings/    # Settings panel
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and configurations
├── server/                   # Backend Express application
│   ├── routes/              # API route handlers
│   │   └── settings.ts
│   ├── auth/                # JWT authentication
│   ├── surveillance/        # Surveillance logic
│   │   └── mock-detection.ts
│   ├── scripts/             # Utility scripts
│   │   └── generate-demo-data.ts
│   ├── storage/             # Database operations
│   └── routes.ts            # Main route registration
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Database schema (Drizzle)
└── db/                      # Database configuration
```

---

## 🎨 Screenshots

### Surveillance Dashboard
![Surveillance Dashboard](docs/screenshots/surveillance-dashboard.png)
- Real-time camera grid with status indicators
- Recent detection timeline with threat badges
- Quick actions for upload, analytics, and settings

### Analytics Dashboard
![Analytics](docs/screenshots/analytics.png)
- 7-day detection trends with 4 threat levels
- Threat distribution pie chart
- Top 5 cameras bar chart
- 24-hour activity heatmap

### Interactive Map
![Map View](docs/screenshots/map.png)
- Leaflet map with Tadoba boundary polygon
- Color-coded camera markers (active/maintenance/offline)
- Click for camera details and recent detections

### Settings Panel
![Settings](docs/screenshots/settings.png)
- 4-tab configuration (Camera, Notifications, Display, System)
- Sliders for confidence threshold and refresh intervals
- Demo data generator with one-click button

---

## 🔒 Authentication

The system uses **JWT (JSON Web Tokens)** for secure authentication:

- **Department Users**: Full access to surveillance, analytics, settings
- **Local Users**: Limited access focused on wildlife tracking

### Default Test Accounts
```
Department User:
- Email: department@tadoba.gov
- Password: admin123

Local User:
- Email: local@tadoba.com
- Password: local123
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/user` - Get current user

### Surveillance
- `GET /api/surveillance/cameras` - List all cameras
- `POST /api/surveillance/cameras` - Create camera
- `GET /api/surveillance/detections` - List detections (with filters)
- `GET /api/surveillance/detections/:id` - Get detection details
- `POST /api/surveillance/upload` - Upload image for detection

### Analytics
- `GET /api/surveillance/detections?limit=1000` - Bulk detections for charts

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/category/:category` - Get by category

### Demo
- `POST /api/demo/generate` - Generate demo data

---

## 🧪 Detection Logic

### Threat Level Classification

```typescript
CRITICAL: weapon detected (firearms, guns)
HIGH: person + vehicle (potential poaching setup)
MEDIUM: person only (monitoring required)
LOW: vehicle only (authorized patrol)
```

### Detection Confidence
- Default threshold: **70%** (configurable in settings)
- Adjustable range: 50% - 95%
- Higher values reduce false positives

### Time Patterns
Detections weighted by hour:
- **00:00-05:59**: High risk (0.1-0.5 weight)
- **06:00-17:59**: Low risk (0.1-0.3 weight)
- **18:00-23:59**: High risk (0.3-0.7 weight)

---

## 🌟 Highlights for Judges

### Technical Excellence
✅ **Full-stack TypeScript** - Type safety from DB to UI  
✅ **Real-time WebSocket** - Instant threat alerts  
✅ **Responsive Design** - Mobile, tablet, desktop  
✅ **Error Boundaries** - Graceful error handling  
✅ **Loading States** - Skeleton screens for UX  
✅ **Empty States** - Helpful guidance when no data

### Conservation Impact
🐅 **Anti-Poaching Focus** - Weapon detection = immediate alert  
🌳 **Strategic Coverage** - 12 cameras at high-risk zones  
📈 **Data-Driven Insights** - Analytics identify patterns  
🚨 **Rapid Response** - WebSocket + browser notifications  
🗺️ **Geospatial Intelligence** - Map-based threat visualization

### Hackathon Execution
⚡ **24-Hour Build** - Complete system in one day  
📦 **30+ Commits** - Organized, incremental development  
🎨 **Polished UI** - Professional design with Shadcn  
🔧 **Demo Ready** - One-click data generation  
📝 **Well Documented** - Comprehensive README

---

## 🤝 Contributing

This project was built for a 24-hour hackathon. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Prajyot Chougule**  
GitHub: [@prajyot1093](https://github.com/prajyot1093)

Built with ❤️ for wildlife conservation and anti-poaching technology.

---

## 🙏 Acknowledgments

- **Tadoba Tiger Reserve** for conservation inspiration
- **YOLO** (You Only Look Once) for object detection framework
- **Shadcn UI** for beautiful component library
- **Recharts** for data visualization
- **Leaflet** for mapping capabilities

---

## 🔮 Future Enhancements

- [ ] Real YOLO model integration with TensorFlow.js
- [ ] Mobile app for field rangers (React Native)
- [ ] SMS alerts for critical threats
- [ ] Drone footage integration
- [ ] Machine learning for animal identification
- [ ] Blockchain for tamper-proof evidence logging
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Offline mode with sync capability

---

**Made for 24-hour Hackathon | Conservation Technology Track**

🌟 **Star this repo if you find it useful!** 🌟
