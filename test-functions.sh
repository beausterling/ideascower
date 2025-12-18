#!/bin/bash

# Test script for Supabase Edge Functions
# Make sure to replace YOUR_ANON_KEY with your actual key

SUPABASE_URL="https://ujtlptjowaillhhqnwrb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdGxwdGpvd2FpbGxoaHFud3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODQ0MzgsImV4cCI6MjA4MTY2MDQzOH0.M8pl4tG7akBNr2hFVl7OTEdZnSD9tKLNYcM_IjEFnlU"

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
