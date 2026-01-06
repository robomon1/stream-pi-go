#!/bin/bash
# Version management script for robo-stream with separate server/client versioning
# Usage: ./scripts/bump-version.sh [server|client|both] [major|minor|patch]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
ORANGE='\033[0;33m'  # Darker than bright yellow
NC='\033[0m'

# Version file locations
VERSION_FILE_NAME="version.txt"
SERVER_VERSION_FILE="server/$VERSION_FILE_NAME"
CLIENT_VERSION_FILE="client/$VERSION_FILE_NAME"

# Get current version from file
get_version() {
    local version_file=$1
    if [ -f "$version_file" ]; then
        cat "$version_file"
    else
        echo "0.0.0"
    fi
}

# Parse semantic version
parse_version() {
    echo "$1" | sed -E 's/([0-9]+)\.([0-9]+)\.([0-9]+)/\1 \2 \3/'
}

# Bump version
bump_version() {
    local current_version=$1
    local bump_type=$2
    
    read -r major minor patch <<< "$(parse_version "$current_version")"
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Error: Invalid bump type. Use major, minor, or patch${NC}"
            exit 1
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# Update version in a JSON file
update_json_version() {
    local version=$1
    local file=$2
    local json_path=$3
    
    if command -v jq &> /dev/null; then
        jq "${json_path} = \"$version\"" "$file" > "${file}.tmp"
        mv "${file}.tmp" "$file"
    else
        # Fallback to sed
        sed -i.bak "s/\"productVersion\": \"[^\"]*\"/\"productVersion\": \"$version\"/" "$file"
        sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$file"
        rm -f "${file}.bak"
    fi
}

# Update version for a component (server or client)
update_component_version() {
    local component=$1
    local new_version=$2
    
    echo -e "${ORANGE}Updating ${component} to ${new_version}...${NC}"
    
    # Update VERSION file
    echo "$new_version" > "${component}/$VERSION_FILE_NAME"
    echo "  ✓ Updated ${component}/$VERSION_FILE_NAME"
    
    # Update wails.json
    if [ -f "${component}/wails.json" ]; then
        update_json_version "$new_version" "${component}/wails.json" '.info.productVersion'
        echo "  ✓ Updated ${component}/wails.json"
    fi
    
    # Update frontend package.json if exists
    if [ -f "${component}/frontend/package.json" ]; then
        update_json_version "$new_version" "${component}/frontend/package.json" '.version'
        echo "  ✓ Updated ${component}/frontend/package.json"
    fi
}

# Show current versions
show_versions() {
    local server_version=$(get_version "$SERVER_VERSION_FILE")
    local client_version=$(get_version "$CLIENT_VERSION_FILE")
    
    echo -e "${GREEN}Current versions:${NC}"
    echo "  Server: ${server_version}"
    echo "  Client: ${client_version}"
}

# Main script
main() {
    # Check if we're in the repo root
    if [ ! -d ".git" ]; then
        echo -e "${RED}Error: Must be run from repository root${NC}"
        exit 1
    fi
    
    # Parse arguments
    local target=${1:-both}
    local bump_type=${2:-patch}
    
    # Validate target
    if [[ ! "$target" =~ ^(server|client|both)$ ]]; then
        echo -e "${RED}Error: Target must be 'server', 'client', or 'both'${NC}"
        echo "Usage: $0 [server|client|both] [major|minor|patch]"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${ORANGE}Warning: You have uncommitted changes${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Show current versions
    show_versions
    echo
    
    # Get current versions
    local server_version=$(get_version "$SERVER_VERSION_FILE")
    local client_version=$(get_version "$CLIENT_VERSION_FILE")
    
    # Calculate new versions
    local new_server_version=$server_version
    local new_client_version=$client_version
    
    if [ "$target" == "server" ] || [ "$target" == "both" ]; then
        new_server_version=$(bump_version "$server_version" "$bump_type")
    fi
    
    if [ "$target" == "client" ] || [ "$target" == "both" ]; then
        new_client_version=$(bump_version "$client_version" "$bump_type")
    fi
    
    # Show what will change
    echo -e "${GREEN}Proposed changes:${NC}"
    if [ "$target" == "server" ] || [ "$target" == "both" ]; then
        echo "  Server: ${server_version} → ${new_server_version}"
    fi
    if [ "$target" == "client" ] || [ "$target" == "both" ]; then
        echo "  Client: ${client_version} → ${new_client_version}"
    fi
    echo
    
    # Confirm
    read -p "Proceed with version bump? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
    
    # Update versions
    if [ "$target" == "server" ] || [ "$target" == "both" ]; then
        update_component_version "server" "$new_server_version"
    fi
    
    if [ "$target" == "client" ] || [ "$target" == "both" ]; then
        update_component_version "client" "$new_client_version"
    fi
    
    # Stage changes
    git add server/VERSION server/wails.json server/frontend/package.json 2>/dev/null || true
    git add client/VERSION client/wails.json client/frontend/package.json 2>/dev/null || true
    
    # Create commit message
    local commit_msg=""
    if [ "$target" == "both" ]; then
        commit_msg="Bump version to server ${new_server_version}, client ${new_client_version}"
    elif [ "$target" == "server" ]; then
        commit_msg="Bump server version to ${new_server_version}"
    else
        commit_msg="Bump client version to ${new_client_version}"
    fi
    
    git commit -m "$commit_msg"
    
    # Create git tags
    if [ "$target" == "server" ] || [ "$target" == "both" ]; then
        git tag -a "server/v${new_server_version}" -m "Server release ${new_server_version}"
        echo "  ✓ Created tag: server/v${new_server_version}"
    fi
    
    if [ "$target" == "client" ] || [ "$target" == "both" ]; then
        git tag -a "client/v${new_client_version}" -m "Client release ${new_client_version}"
        echo "  ✓ Created tag: client/v${new_client_version}"
    fi
    
    echo
    echo -e "${GREEN}✓ Version bump complete!${NC}"
    echo -e "${ORANGE}Next steps:${NC}"
    echo "  1. Review changes: git show"
    echo "  2. Push commit: git push"
    echo "  3. Push tags: git push --tags"
    echo "  4. GitHub Actions will build releases for tagged components"
}

# Show usage
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    cat << EOF
Usage: ./scripts/bump-version.sh [TARGET] [TYPE]

TARGET:
  server  - Bump server version only
  client  - Bump client version only  
  both    - Bump both versions (default)

TYPE:
  patch   - Bug fixes (0.1.0 -> 0.1.1) [default]
  minor   - New features (0.1.0 -> 0.2.0)
  major   - Breaking changes (0.1.0 -> 1.0.0)

Examples:
  ./scripts/bump-version.sh server patch   # Server: 0.1.0 -> 0.1.1
  ./scripts/bump-version.sh client minor   # Client: 0.1.0 -> 0.2.0
  ./scripts/bump-version.sh both major     # Both:   0.1.0 -> 1.0.0
  ./scripts/bump-version.sh                # Both:   patch bump
  
  # Check current versions
  cat server/VERSION
  cat client/VERSION
  
  # Or use this script
  ./scripts/bump-version.sh --status

Version Files:
  server/VERSION              - Server version (source of truth)
  server/wails.json           - Synced from server/VERSION
  server/frontend/package.json - Synced from server/VERSION
  
  client/VERSION              - Client version (source of truth)
  client/wails.json           - Synced from client/VERSION
  client/frontend/package.json - Synced from client/VERSION (if exists)

Git Tags:
  server/v0.1.0  - Triggers server build
  client/v0.1.0  - Triggers client build
EOF
    exit 0
fi

# Show status
if [ "$1" == "--status" ] || [ "$1" == "-s" ]; then
    show_versions
    exit 0
fi

main "$@"
