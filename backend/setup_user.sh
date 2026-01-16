#!/bin/bash
# Quick script to create a test user

echo "Creating test user..."
python manage.py create_test_user --username testuser --password testpass123 --email test@example.com

echo ""
echo "✅ Test user created!"
echo "   Username: testuser"
echo "   Password: testpass123"
echo ""
echo "You can now login to the app with these credentials."
