#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Synk Backend Server...${NC}\n"

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Check if virtual environment exists, if not create one
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
pip install --quiet --upgrade pip 2>/dev/null || true
pip install -r requirements.txt

# Run migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
python3 manage.py migrate --noinput

# Check if test user exists, if not create one
echo -e "${YELLOW}👤 Checking for test user...${NC}"
python3 manage.py shell << 'PYTHON_EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='testuser').exists():
    print("Creating test user...")
    from django.core.management import call_command
    call_command('create_test_user')
else:
    print("Test user already exists")
PYTHON_EOF

# Start the server
echo -e "\n${GREEN}✅ All set! Starting Django server...${NC}\n"
echo -e "${GREEN}📡 Server will be available at: http://localhost:8000${NC}"
echo -e "${GREEN}👤 Test credentials:${NC}"
echo -e "   Username: ${YELLOW}testuser${NC}"
echo -e "   Password: ${YELLOW}testpass123${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

python3 manage.py runserver
