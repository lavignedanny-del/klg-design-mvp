# KLG Design – 3D Vanity Builder (MVP, Dark Theme)

Ready-to-run prototype (frontend) using **Vite + React + @react-three/fiber + drei + three**.

## Features
- Real-time 3D vanity with resizable Width/Height/Depth (inches)
- Finishes: Natural Oak, Matte Grey, Navy, Satin White
- Countertops: Quartz, Marble, Granite (with desktop reflections)
- Sink types: Undermount, Vessel, Integrated Slab
- Presets: Single, Double, Drawer Base
- Dark theme UI, Full Screen toggle
- High-Detail (Ultra) toggle for premium desktop rendering
- Save / Load (localStorage)
- Snapshot to PNG
- Live Pricing (simple formula you can adjust in `App.jsx`)

## Getting Started
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 to view the app.

## Notes
- This MVP is frontend-only to keep setup simple.
- Doors/Drawers are static for now (as requested).
- Pricing is a basic heuristic; adjust multipliers as needed.
- For production, connect to a real backend (Stripe/Shopify, orders, user accounts) in a `backend/` dir.
