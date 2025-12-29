#!/bin/bash

# Test script for Supabase Edge Functions
# Set environment variables before running:
#   export SUPABASE_URL="https://your-project.supabase.co"
#   export SUPABASE_ANON_KEY="your-anon-key"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
  echo ""
  echo "Usage:"
  echo "  export SUPABASE_URL='https://your-project.supabase.co'"
  echo "  export SUPABASE_ANON_KEY='your-anon-key'"
  echo "  ./test-functions.sh"
  exit 1
fi

ANON_KEY="$SUPABASE_ANON_KEY"

echo "🧪 Testing Supabase Edge Functions..."
echo ""

echo "1️⃣ Testing get-idea..."
curl -s "${SUPABASE_URL}/functions/v1/get-idea?date=2025-12-18" \
  -H "apikey: ${ANON_KEY}" | jq '.'
echo ""
echo ""

echo "2️⃣ Testing roast-idea..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/roast-idea" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"idea": "Uber for cats - a ride-sharing service exclusively for felines"}' | jq '.'
echo ""
echo ""

echo "3️⃣ Testing chat..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/chat" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"history": [], "message": "Is my startup doomed?"}' | head -n 20
echo ""
echo ""

echo "✅ All tests complete!"
