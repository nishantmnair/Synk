#!/bin/bash

# Script to migrate all code from current workspace to existing GitHub repository
# while preserving git history

set -e  # Exit on error

REPO_URL="git@github.com:nishantmnair/Synk.git"
SOURCE_DIR="/Users/nishantnair/Downloads/synk 2"
TEMP_DIR="/tmp/synk_migration_$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting migration to GitHub repository...${NC}"
echo "Repository: $REPO_URL"
echo "Source: $SOURCE_DIR"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: Source directory does not exist: $SOURCE_DIR${NC}"
    exit 1
fi

# Step 1: Clone the existing repository
echo -e "${YELLOW}📥 Cloning existing repository...${NC}"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

if [ -d "synk_repo" ]; then
    echo "⚠️  Existing clone found. Removing..."
    rm -rf synk_repo
fi

git clone "$REPO_URL" synk_repo
cd synk_repo

# Detect default branch
DEFAULT_BRANCH=$(git symbolic-ref --short HEAD || echo "main")
echo "📌 Default branch: $DEFAULT_BRANCH"

# Step 2: Remove all files except .git directory and .gitignore
echo -e "${YELLOW}🗑️  Removing existing files (preserving .git)...${NC}"
# Keep .gitignore temporarily to merge with new one
if [ -f ".gitignore" ]; then
    cp .gitignore .gitignore.backup
fi

find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.gitignore.backup' -exec rm -rf {} + 2>/dev/null || true

# Step 3: Copy all files from source directory
echo -e "${YELLOW}📋 Copying files from source directory...${NC}"
rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='.env.local' \
  --exclude='frontend/.env.local' \
  --exclude='backend/.env.local' \
  "$SOURCE_DIR/" .

# Merge .gitignore files if backup exists
if [ -f ".gitignore.backup" ]; then
    echo "🔀 Merging .gitignore files..."
    # Combine both gitignore files, removing duplicates
    cat .gitignore.backup .gitignore | sort -u > .gitignore.tmp
    mv .gitignore.tmp .gitignore
    rm .gitignore.backup
fi

# Step 4: Stage all changes
echo -e "${YELLOW}📝 Staging all changes...${NC}"
git add -A

# Step 5: Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit. Repository is already up to date.${NC}"
    echo "Repository location: $TEMP_DIR/synk_repo"
    exit 0
fi

# Show what will be committed
echo ""
echo -e "${GREEN}📊 Summary of changes:${NC}"
git status --short | head -20
if [ $(git status --short | wc -l) -gt 20 ]; then
    echo "... and more files"
fi
echo ""

# Step 6: Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "Replace all code, workflows, and test suites with new codebase

- Complete replacement of frontend (React + TypeScript + Vite)
- Complete replacement of backend (Django + Django REST Framework)
- Updated Docker configuration
- Updated documentation
- Preserved git history"

# Step 7: Push to repository
echo ""
echo -e "${GREEN}🚀 Ready to push to GitHub!${NC}"
echo ""
read -p "Do you want to push to the repository now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📤 Pushing to origin/$DEFAULT_BRANCH...${NC}"
    git push origin "$DEFAULT_BRANCH"
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}⏸️  Skipped push. You can push manually later.${NC}"
fi

echo ""
echo -e "${GREEN}✨ Migration complete!${NC}"
echo "Repository location: $TEMP_DIR/synk_repo"
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "To push manually later:"
    echo "  cd $TEMP_DIR/synk_repo"
    echo "  git push origin $DEFAULT_BRANCH"
    echo ""
fi
