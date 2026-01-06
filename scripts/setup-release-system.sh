#!/bin/bash
# Initial setup script for RoboStream build/release system
# Run once after cloning repository

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
ORANGE='\033[0;33m'  # Darker than bright yellow
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}RoboStream Release Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo

# Check we're in repo root
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Must be run from repository root${NC}"
    exit 1
fi

# 1. Create scripts directory
echo -e "${ORANGE}1. Creating scripts directory...${NC}"
mkdir -p scripts
echo "   ✓ scripts/ created"

# 2. Create workflows directory
echo -e "${ORANGE}2. Creating GitHub workflows directory...${NC}"
mkdir -p .github/workflows
echo "   ✓ .github/workflows/ created"

# 3. Make version script executable
echo -e "${ORANGE}3. Setting up version management...${NC}"
if [ -f "scripts/bump-version.sh" ]; then
    chmod +x scripts/bump-version.sh
    echo "   ✓ Version script is executable"
else
    echo -e "   ${RED}✗ scripts/bump-version.sh not found${NC}"
    echo "     Download from: /mnt/user-data/outputs/scripts/bump-version.sh"
fi

# 4. Check for required tools
echo -e "${ORANGE}4. Checking required tools...${NC}"

check_tool() {
    if command -v "$1" &> /dev/null; then
        echo "   ✓ $1 installed"
        return 0
    else
        echo "   ✗ $1 not found"
        return 1
    fi
}

all_tools_ok=true

if ! check_tool "go"; then
    echo "     Install: https://go.dev/dl/"
    all_tools_ok=false
fi

if ! check_tool "node"; then
    echo "     Install: https://nodejs.org/"
    all_tools_ok=false
fi

if ! check_tool "wails"; then
    echo "     Install: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    all_tools_ok=false
fi

if ! check_tool "git"; then
    echo "     Install: https://git-scm.com/"
    all_tools_ok=false
fi

# Optional tools
if ! check_tool "jq"; then
    echo "   ⚠ jq not found (optional, but recommended)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "     Install: brew install jq"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "     Install: sudo apt-get install jq"
    fi
fi

# 5. Setup icons
echo -e "${ORANGE}5. Setting up icons...${NC}"
cd server
if make setup-icons 2>/dev/null; then
    echo "   ✓ Server icons ready"
else
    echo "   ⚠ Could not setup server icons (run 'cd server && make setup-icons')"
fi
cd ..

cd client
if make setup-icons 2>/dev/null; then
    echo "   ✓ Client icons ready"
else
    echo "   ⚠ Could not setup client icons (run 'cd client && make setup-icons')"
fi
cd ..

# 6. Check current version
echo -e "${ORANGE}6. Checking version status...${NC}"
current_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
if [ "$current_tag" == "none" ]; then
    echo "   ℹ No version tags found"
    echo "   → Run: ./scripts/bump-version.sh patch (to create v0.1.0)"
else
    echo "   ✓ Current version: $current_tag"
fi

# 7. Check workflow files
echo -e "${ORANGE}7. Checking GitHub Actions workflows...${NC}"
if [ -f ".github/workflows/ci.yml" ]; then
    echo "   ✓ CI workflow present"
else
    echo "   ✗ CI workflow missing"
    echo "     Copy from: /mnt/user-data/outputs/.github/workflows/ci.yml"
fi

if [ -f ".github/workflows/release.yml" ]; then
    echo "   ✓ Release workflow present"
else
    echo "   ✗ Release workflow missing"
    echo "     Copy from: /mnt/user-data/outputs/.github/workflows/release.yml"
fi

# 8. Test builds
echo -e "${ORANGE}8. Testing local builds...${NC}"
echo "   Testing server build..."
cd server
if make build 2>&1 | tail -5; then
    echo "   ✓ Server builds successfully"
else
    echo "   ✗ Server build failed (check errors above)"
fi
cd ..

echo "   Testing client build..."
cd client
if make build 2>&1 | tail -5; then
    echo "   ✓ Client builds successfully"
else
    echo "   ✗ Client build failed (check errors above)"
fi
cd ..

# Summary
echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo

if [ "$all_tools_ok" = true ] && [ -f ".github/workflows/ci.yml" ] && [ -f ".github/workflows/release.yml" ]; then
    echo -e "${GREEN}✓ All systems ready!${NC}"
    echo
    echo "Next steps:"
    echo "  1. Commit workflow files:"
    echo "     git add .github/ scripts/"
    echo "     git commit -m 'Add build and release workflows'"
    echo
    echo "  2. Create first version:"
    echo "     ./scripts/bump-version.sh patch"
    echo
    echo "  3. Push to GitHub:"
    echo "     git push && git push --tags"
    echo
    echo "  4. Watch build progress:"
    echo "     https://github.com/robomon1/robo-stream/actions"
else
    echo -e "${ORANGE}⚠ Some issues found (see above)${NC}"
    echo
    echo "Fix issues then commit:"
    echo "  git add .github/ scripts/"
    echo "  git commit -m 'Add build and release workflows'"
    echo "  git push"
fi

echo
echo "Documentation:"
echo "  • Full guide: RELEASE.md"
echo "  • Quick ref: RELEASE-QUICK-REF.md"
echo
