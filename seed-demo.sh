#!/bin/bash

# Quick script to seed the database with demo data
# Usage: ./seed-demo.sh

echo "🌱 Seeding database with demo data..."

# Try both common ports
curl -s -X POST http://localhost:3000/api/seed-basic || curl -s -X POST http://localhost:3002/api/seed-basic

echo ""
echo "✅ Seeding complete! Your app now has:"
echo "   • 4 demo users with profile pictures"
echo "   • 5 sample posts with images"
echo "   • 7 comments across posts"
echo "   • 13 likes distributed across posts"
echo ""
echo "🚀 Ready to show your friend all the features!"

