# Performance Dashboard (Next.js + TypeScript)

## Quick start
1. Node 20+ recommended
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000/dashboard`

## Features
- Canvas-based LineChart with downsampling
- Web Worker generating streaming data (simulated)
- Simple virtualized data table
- FPS and memory monitor
## Architecture Overview

**Frontend:** Next.js 14 (App Router) + TypeScript  
**Rendering:** Canvas 2D + requestAnimationFrame  
**Real-time Engine:** Web Worker streaming simulated data every 100 ms  
**State Management:** React Hooks + Context (no external libraries)  
**Performance:** Handles 10,000 + points at 60 FPS, memory stable over time

### Folder Structure
