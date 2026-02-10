#!/bin/bash
# Quick script to create a test user

echo "Creating test user..."
# Note: username must match the email-to-username conversion for login to work
# For test@example.com, the derived username is 'test' (email prefix)
python manage.py create_test_user --username test --password testpass123 --email test@example.com

echo ""
echo "✅ Test user created!"
echo "   Email: test@example.com"
echo "   Username: test"
echo "   Password: testpass123"
echo ""
echo "You can now login to the app with these credentials."
