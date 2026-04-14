# 🪑 Seat Booking System - Hybrid Office Management

A modern, full-stack web application for managing seat bookings in hybrid office environments. Built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

- **User Scheduling**: Batch-based scheduling system with configurable office attendance patterns
- **Seat Booking**: Intuitive seat selection and booking interface
- **Seat Types**: Support for designated squad seats and floater seats
- **Holiday Management**: Prevent bookings on holidays
- **Real-time Status**: View seat availability in real-time
- **Weekly Overview**: Dashboard showing week schedule and availability
- **Clean UI**: Modern, responsive design with ShadCN UI components

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **State**: React hooks (no Redux needed)

## 🧠 Business Logic

### Batch Schedule

**Batch 1:**
- Week 1: Monday-Wednesday
- Week 2: Thursday-Friday

**Batch 2:**
- Week 1: Thursday-Friday
- Week 2: Monday-Wednesday

### Booking Rules

✅ **Allowed IF:**
- User is scheduled that day
- Not a holiday
- Seat is available
- Valid booking time (next day after 3 PM)

❌ **Blocked IF:**
- Non-designated day
- Holiday
- Seat already booked
- Trying to book before 3 PM (for next day)

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the database tables using the SQL from `setup.sql`
3. Get your **API URL** and **Anon Key** from project settings

### 3. Configure Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### users
- `id` (UUID, PK)
- `name` (TEXT)
- `squad_id` (INT)
- `batch` (INT: 1 or 2)
- `is_designated` (BOOLEAN)

### seats
- `id` (INT, PK)
- `type` (TEXT: 'designated' | 'floater')
- `squad_id` (INT, nullable)
- **Total**: 50 seats (40 designated + 10 floater)
- **Designated**: 4 seats per squad × 10 squads = 40 seats

### bookings
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `seat_id` (INT, FK → seats)
- `date` (DATE)
- `status` (TEXT: 'booked' | 'released')

### holidays
- `id` (UUID, PK)
- `date` (DATE)

## 📖 Pages & Features

### Dashboard (`/`)
- User selector dropdown
- Weekly overview with seat availability
- Navigation to booking and schedule pages
- Real-time seat stats

### Booking (`/booking`)
- Date picker
- Interactive 50-seat grid
- Color-coded seat status (available, booked, floater)
- Easy seat selection and confirmation

### Schedule (`/schedule`)
- Weekly schedule view
- User's batch schedule
- Current bookings
- Release booking functionality

## 🎨 UI Components

- **UserSelector**: Dropdown for user selection
- **SeatGrid**: Visual 50-seat grid with color coding
- **DateCards**: Week overview with availability stats
- **ShadCN UI** components for consistency

### Color Legend
- 🟢 Green: Available seat
- 🔴 Red: Booked seat
- 🟡 Yellow: Floater seat

## 🔌 API Endpoints

- `GET /api/seats?date=YYYY-MM-DD` - Get seats by date
- `POST /api/book` - Book a seat
- `POST /api/release` - Release a booking
- `GET /api/schedule?user_id=` - Get user schedule
- `GET /api/holidays` - Get all holidays
- `GET /api/users` - Get users list

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interface
- Optimized for all screen sizes

## 🚀 Deployment

Deploy to Vercel with one click - set environment variables in dashboard.

## 📝 Notes

- No authentication required (demo system)
- Booking time constraint: Next day after 3 PM
- Week type determined by ISO week number
- Floater seats available to all users

## 🛠️ Tech Stack

- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- ShadCN UI
- Supabase
- PostgreSQL
