# Tadoba Smart Conservation - Design Guidelines

## Design Approach: Custom Thematic Design
**Rationale:** Wildlife conservation platform requires unique jungle-themed identity that balances professional data visualization with immersive natural aesthetics.

---

## Core Design Elements

### A. Color Palette

**Dark Theme Foundation (Primary)**
- Background Base: 15 15% 8% (deep forest dark)
- Surface: 140 20% 12% (dark moss green)
- Card/Panel: 140 15% 16% with glassmorphism overlay

**Brand Colors**
- Primary Green: 140 65% 45% (vibrant jungle green)
- Accent Orange: 25 85% 55% (tiger orange)
- Alert Red: 0 70% 50% (danger/proximity alerts)

**Functional Colors**
- Success: 140 60% 50% (safe zone green)
- Warning: 40 90% 60% (caution yellow)
- Info: 200 70% 55% (water blue)

**Text Colors**
- Primary Text: 140 15% 95%
- Secondary Text: 140 10% 70%
- Muted Text: 140 8% 50%

### B. Typography

**Font Families**
- Primary: 'Poppins' (headings, navigation, buttons)
- Secondary: 'Montserrat' (body text, cards, data)
- Mono: 'JetBrains Mono' (data timestamps, coordinates)

**Scale**
- Hero/Display: text-5xl to text-7xl, font-bold
- Page Titles: text-3xl to text-4xl, font-semibold
- Section Headers: text-2xl, font-semibold
- Card Titles: text-lg to text-xl, font-medium
- Body: text-base, font-normal
- Small/Meta: text-sm, font-light

### C. Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20
- Card gaps: gap-4 to gap-6
- Icon margins: m-2 to m-4

**Grid Systems**
- Dashboard: 12-column grid with lg:grid-cols-3 for analytics cards
- Map View: Full-width with overlaid sidebar (w-80 to w-96)
- Animal Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

### D. Component Library

**Login Portals**
- Split-screen design with left side: tiger forest imagery (40%), right side: login form (60%)
- Glassmorphic login card with backdrop-blur-xl and border border-green-500/20
- Toggle between Department/Local login with animated indicator
- Input fields with green glow on focus

**Navigation**
- Left sidebar (w-64) with icon + label navigation
- Icons: Home (house), Map (map-pin), AI Chat (message-square), Animals (paw-print), Bookings (calendar)
- Active state: green accent bar + background highlight
- Collapsed mobile version with icon-only bottom nav

**Dashboard Cards**
- Glassmorphic cards: bg-slate-900/40 backdrop-blur-md border border-green-500/20
- Rounded corners: rounded-xl to rounded-2xl
- Hover: transform scale-[1.02] with transition-all duration-300
- Include tiger paw print watermark as subtle background

**Maps & Geo-fencing**
- Full-viewport map with dark Leaflet/Google Maps theme
- Animal markers: Custom tiger/leopard SVG icons with green pulse animation
- 2km radius circle: stroke-orange-500 with fill-orange-500/20
- Safe zones: fill-green-500/30 with dashed borders
- Alert popup: Fixed bottom-right with sound icon, shake animation

**Data Visualization**
- Animal lineage: Tree diagram with connecting lines (green), circular avatar nodes
- Live count: Large number displays with animated counter effect
- Analytics charts: Line/bar charts in green-orange gradient, dark grid lines

**AI Chatbot**
- Fixed bottom-right bubble icon (green with pulse)
- Expanded modal: h-[600px] with chat history + input
- Message bubbles: User (orange), AI (green), glass-morphic backgrounds
- Image upload zone: Dashed border with drag-drop functionality

**Safari Booking**
- Calendar grid with available slots in green, booked in gray
- Time slot cards with guide info, vehicle type, pricing
- Booking confirmation: Full-screen modal with ticket design (orange-green gradient border)

**Animal Cards**
- Card header: Tiger image (aspect-video) with gradient overlay
- Body: Species name, last seen location, threat level badge
- Footer: View details button (outline green), track button (solid orange)

### E. Thematic Elements

**Jungle Aesthetics**
- Subtle leaf illustrations floating/drifting across dashboard (position: absolute, slow animation)
- Tiger stripe pattern as decorative borders on hero sections
- Tree branch silhouettes in sidebar backgrounds
- Forest texture overlays on dark backgrounds (opacity: 0.05)

**Glassmorphism Implementation**
- backdrop-filter: blur(12px)
- background: rgba(20, 25, 20, 0.4)
- border: 1px solid rgba(74, 222, 128, 0.2)
- box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37)

**Neon Accents**
- Button glows: shadow-[0_0_20px_rgba(74,222,128,0.5)]
- Active navigation glow: shadow-[0_0_15px_rgba(251,146,60,0.6)]
- Alert indicators: Pulsing neon red ring animation

### F. Animations

**Ambient Animations (Subtle)**
- Floating leaves: translateY + rotate keyframes, 8-12s duration
- Tiger eye blink: Periodic opacity animation on login illustration
- Pulse rings: Around animal markers, 2s infinite
- Data counter: Count-up animation on dashboard load

**Interaction Animations**
- Card hover: scale(1.02) + lift shadow
- Button press: scale(0.98)
- Alert popup: slideInUp + shake
- Sidebar navigation: Smooth height/width transitions (300ms)

**Alert System**
- Proximity alert: Red pulsing border + sound icon bounce
- Toast notifications: Slide from bottom-right with auto-dismiss

---

## Images

**Login Page**
- Left panel hero image: Majestic Tadoba tiger in natural habitat, dusk lighting, 40% screen width, full height
- Background overlay: Dark green gradient (opacity: 0.6) for text contrast

**Dashboard Headers**
- Department Dashboard: Wide banner showing forest patrol camera footage, 16:4 aspect ratio
- Local Dashboard: Cattle grazing in safe zone with distant tiger, 16:4 aspect ratio

**Animal Cards**
- Individual tiger portraits with identifying features visible, 16:9 aspect ratio
- Bloodline tree: Generational tiger family photos in circular frames

**Map Markers**
- No hero image (map is the focal point)
- Custom illustrated marker icons instead of photos

**Safari Booking**
- Safari vehicle with tourists in Tadoba landscape, 16:9 cards
- Guide profile photos: Circular, 80x80px

---

## Responsive Behavior

- Desktop (lg): Full sidebar + 3-column grids + expanded map view
- Tablet (md): Collapsed sidebar + 2-column grids + side-panel map
- Mobile (base): Bottom nav + single column + full-screen map modal
- Touch targets: minimum 44x44px for all interactive elements