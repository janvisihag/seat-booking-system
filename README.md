# 🪑 SeatFlow - Smart Seat Booking System

A modern seat booking system with automated allocation, batch scheduling, and role-based access control.

## 🚀 Quick Start

### 1. Setup Database
```bash
# Run setup.sql in your Supabase SQL Editor
# This creates all tables and seeds demo data
```

### 2. Configure Environment
```bash
# Create .env file with:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
CRON_SECRET=your-secret-key
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Login
- Visit `http://localhost:3000`
- **Users**: `user1` / `user1` (or user2, user3, ... user80)
- **Admin**: `admin` / `Admin@2026!`

---

## ✨ Features

### For Users
- 🔐 **Secure Login** - Username/password authentication
- 📅 **Weekly View** - See available dates (tomorrow onwards)
- 🪑 **Seat Grid** - Visual seat selection
  - Blue = Your squad's designated seats
  - F = Free floater seats (green)
  - B = Booked seats (red)
  - C = Cancelled seats (yellow)
- 📋 **Booking Display** - See your booking below seat grid
- ❌ **Cancel Anytime** - Cancel bookings with one click

### For Admin
- 🔧 **Manual Allocation** - Trigger seat allocation on-demand
- ⏰ **Auto-Allocation** - Runs daily at 3 PM via cron
- 📊 **System Status** - View allocation logs
- 🔐 **Secure Access** - Admin-only panel

---

## 🏗️ System Architecture

### Batch Scheduling
- **Batch 1**: Week 1 (Mon-Wed), Week 2 (Thu-Fri)
- **Batch 2**: Week 1 (Thu-Fri), Week 2 (Mon-Wed)
- 5 squads per batch, 8 users per squad
- 40 designated seats allocated daily

### Seat Types
- **Designated (80 seats)**: Fixed seats per squad
- **Floater (10 seats)**: First-come-first-served

### Auto-Allocation
- Runs daily at 3 PM
- Allocates seats for next working day
- Skips weekends and holidays
- Blocks non-scheduled squads

---

## 📊 Database Schema

### Core Tables
- `squads` - 10 squads (5 per batch)
- `users` - 80 users (8 per squad)
- `seats` - 90 seats (80 designated + 10 floater)
- `auth_users` - Login credentials

### Booking Tables
- `seat_allocations` - Designated seat assignments
- `floater_bookings` - Floater seat bookings
- `user_leaves` - Leave records
- `seat_blocking` - Blocked seats
- `holidays` - Holiday calendar
- `auto_locks` - Allocation lock tracking

---

## 🔑 Demo Credentials

### Regular Users
```
user1 / user1
user2 / user2
...
user80 / user80
```

### Admin
```
admin / Admin@2026!
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom username/password
- **Deployment**: Vercel (with cron jobs)

---

## 📁 Project Structure

```
app/
├── login/              # Login page
├── admin/              # Admin panel
├── api/                # API routes
│   ├── auth/          # Authentication
│   ├── seats/         # Seat management
│   ├── allocations/   # Seat allocations
│   └── ...
└── page.tsx           # User dashboard

lib/
├── auth.ts            # Auth utilities
├── supabase.ts        # Database client
└── *-service.ts       # Business logic

components/
├── SeatGrid.tsx       # Seat visualization
├── BookingDialog.tsx  # Booking modal
└── ui/                # UI components
```

---

## 🔄 User Flow

1. **Login** → Enter credentials
2. **Dashboard** → See weekly calendar
3. **Select Date** → Choose tomorrow or future date
4. **View Seats** → See available seats (F/B/C for floaters)
5. **Book Seat** → Click and confirm
6. **See Booking** → Displayed below seat grid
7. **Cancel** → Click cancel button if needed

---

## 🎯 Admin Flow

1. **Login** → Use admin credentials
2. **Admin Panel** → Access system controls
3. **Trigger Allocation** → Manual seat allocation
4. **View Status** → Check allocation results
5. **Logout** → Secure exit

---

## 🕐 Cron Setup (Production)

### Vercel (Recommended)
Already configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-allocation",
    "schedule": "0 15 * * *"
  }]
}
```

### Manual Setup
1. Deploy to Vercel
2. Set `CRON_SECRET` environment variable
3. Cron runs automatically at 3 PM daily

---

## 🧪 Testing

```bash
# Start dev server
npm run dev

# Test login
# Visit http://localhost:3000
# Login as user1 / user1

# Test booking
# Select tomorrow's date
# Click a seat
# Confirm booking
# See booking below grid

# Test admin
# Logout
# Login as admin / Admin@2026!
# Click "Trigger Allocation Now"
# Check success message
```

---

## 📝 License

MIT

---

## 🤝 Support

For issues or questions, please check the code comments or database schema.

---

**Built with ❤️ using Next.js and Supabase**
