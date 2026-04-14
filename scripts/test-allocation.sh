#!/bin/bash

# Test script for seat allocation system
# Usage: ./scripts/test-allocation.sh

echo "🧪 Testing Seat Allocation System"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with CRON_SECRET"
    exit 1
fi

# Get the base URL (default to localhost)
BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Check if API is running
echo "1️⃣  Testing API health..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/seats?date=2026-04-16")
if [ "$response" = "200" ]; then
    echo "✅ API is running"
else
    echo "❌ API not responding (HTTP $response)"
    echo "   Make sure the dev server is running: npm run dev"
    exit 1
fi
echo ""

# Test 2: Manual allocation trigger
echo "2️⃣  Testing manual allocation trigger..."
response=$(curl -s -X POST "$BASE_URL/api/auto-lock" \
    -H "Content-Type: application/json")
echo "Response: $response"
if echo "$response" | grep -q "success"; then
    echo "✅ Manual trigger works"
else
    echo "⚠️  Check response above"
fi
echo ""

# Test 3: Check allocations
echo "3️⃣  Checking allocations for tomorrow..."
tomorrow=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
response=$(curl -s "$BASE_URL/api/allocations?date=$tomorrow")
echo "Response: $response"
if echo "$response" | grep -q "allocations"; then
    echo "✅ Allocations endpoint works"
else
    echo "⚠️  Check response above"
fi
echo ""

# Test 4: Check holidays
echo "4️⃣  Checking holidays..."
response=$(curl -s "$BASE_URL/api/holidays")
if echo "$response" | grep -q "holidays"; then
    echo "✅ Holidays endpoint works"
else
    echo "⚠️  Check response above"
fi
echo ""

# Test 5: Check floater seats
echo "5️⃣  Checking floater seats..."
response=$(curl -s "$BASE_URL/api/floater-booking?date=$tomorrow")
if echo "$response" | grep -q "available_seats"; then
    echo "✅ Floater booking endpoint works"
else
    echo "⚠️  Check response above"
fi
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Visit http://localhost:3000/admin to test manual trigger"
echo "   2. Set up cron job (see CRON_SETUP.md)"
echo "   3. Deploy to production"
echo ""
