#!/bin/bash

# LocalStack Archive Script
# This script archives the current LocalStack project structure into organized folders
# Usage: ./localstack-archive.sh [source_path]
# Source path: defaults to current directory if not specified

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print banner
print_banner() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                            📦 LocalStack Archive                                             ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [source_path]"
    echo
    echo "Arguments:"
    echo "  source_path      Path to the source directory to archive (defaults to current directory)"
    echo
    echo "This script will:"
    echo "  1. Create 'archive-localstack' folder if it doesn't exist"
    echo "  2. Extract metadata from metadata.json (po_id, platform, language)"
    echo "  3. Get current git branch name"
    echo "  4. Create folder: LS-{po_id}-{platform}-{language}"
    echo "  5. Move lib/, test/, cfn-outputs/, and metadata.json to the new folder"
    echo
    echo "Examples:"
    echo "  $0                          # Archive current directory"
    echo "  $0 ./my-stack              # Archive specific directory"
    echo
}

# Function to extract metadata
extract_metadata() {
    local source_path=$1
    local metadata_file="$source_path/metadata.json"
    
    if [[ ! -f "$metadata_file" ]]; then
        print_status $RED "❌ No metadata.json found in $source_path"
        return 1
    fi
    
    print_status $YELLOW "🔍 Extracting metadata from $metadata_file..."
    
    # Extract fields using jq or fallback to grep/sed
    if command -v jq >/dev/null 2>&1; then
        local po_id=$(jq -r '.po_id // "unknown"' "$metadata_file")
        local platform=$(jq -r '.platform // "unknown"' "$metadata_file")
        local language=$(jq -r '.language // "unknown"' "$metadata_file")
    else
        # Fallback parsing without jq
        local po_id=$(grep '"po_id"' "$metadata_file" | sed 's/.*"po_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)
        local platform=$(grep '"platform"' "$metadata_file" | sed 's/.*"platform"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)
        local language=$(grep '"language"' "$metadata_file" | sed 's/.*"language"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)
        
        # Handle case where po_id might be a number without quotes
        if [[ -z "$po_id" || "$po_id" == "null" ]]; then
            po_id=$(grep '"po_id"' "$metadata_file" | sed 's/.*"po_id"[[:space:]]*:[[:space:]]*\([0-9][^,]*\).*/\1/' | head -1)
        fi
    fi
    
    # Validate extracted data
    if [[ -z "$po_id" || "$po_id" == "null" || "$po_id" == "unknown" ]]; then
        print_status $RED "❌ Could not extract po_id from metadata.json"
        return 1
    fi
    
    if [[ -z "$platform" || "$platform" == "null" || "$platform" == "unknown" ]]; then
        print_status $RED "❌ Could not extract platform from metadata.json"
        return 1
    fi
    
    if [[ -z "$language" || "$language" == "null" || "$language" == "unknown" ]]; then
        print_status $RED "❌ Could not extract language from metadata.json"
        return 1
    fi
    
    # Clean up values (remove quotes if present)
    po_id=$(echo "$po_id" | tr -d '"')
    platform=$(echo "$platform" | tr -d '"')
    language=$(echo "$language" | tr -d '"')
    
    echo "$po_id:$platform:$language"
    return 0
}

# Function to get current git branch
get_git_branch() {
    if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
        local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        echo "$branch"
    else
        echo "unknown"
    fi
}

# Function to check if directory/file exists and can be moved
check_movable_items() {
    local source_path=$1
    local items=("lib" "test" "cfn-outputs" "metadata.json")
    local found_items=()
    
    for item in "${items[@]}"; do
        local item_path="$source_path/$item"
        if [[ -e "$item_path" ]]; then
            found_items+=("$item")
        fi
    done
    
    if [[ ${#found_items[@]} -eq 0 ]]; then
        print_status $RED "❌ No archivable items found (lib/, test/, cfn-outputs/, metadata.json)"
        return 1
    fi
    
    echo "${found_items[@]}"
    return 0
}

# Function to move items to archive
move_items_to_archive() {
    local source_path=$1
    local archive_folder=$2
    local items_to_move=("$@")
    # Remove first two parameters to get the items array
    shift 2
    items_to_move=("$@")
    
    print_status $YELLOW "📦 Moving items to archive..."
    
    local moved_items=()
    local failed_items=()
    
    for item in "${items_to_move[@]}"; do
        local source_item="$source_path/$item"
        local dest_item="$archive_folder/$item"
        
        if [[ -e "$source_item" ]]; then
            print_status $BLUE "  📁 Moving $item..."
            if mv "$source_item" "$dest_item" 2>/dev/null; then
                moved_items+=("$item")
                print_status $GREEN "    ✅ Moved $item successfully"
            else
                failed_items+=("$item")
                print_status $RED "    ❌ Failed to move $item"
            fi
        else
            print_status $YELLOW "    ⚠️  $item not found, skipping"
        fi
    done
    
    echo
    print_status $CYAN "📊 Archive Summary:"
    if [[ ${#moved_items[@]} -gt 0 ]]; then
        print_status $GREEN "✅ Successfully moved: ${moved_items[*]}"
    fi
    
    if [[ ${#failed_items[@]} -gt 0 ]]; then
        print_status $RED "❌ Failed to move: ${failed_items[*]}"
        return 1
    fi
    
    return 0
}

# Main function
main() {
    print_banner
    
    # Parse arguments
    local source_path="."
    
    # Check if first argument is a help flag
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # If path provided, use it
    if [[ -n "$1" ]]; then
        source_path="$1"
    fi
    
    # Convert to absolute path
    source_path="$(cd "$source_path" 2>/dev/null && pwd || realpath "$source_path" 2>/dev/null || echo "$source_path")"
    
    print_status $BLUE "📍 Source Path: $source_path"
    
    # Check if source path exists
    if [[ ! -d "$source_path" ]]; then
        print_status $RED "❌ Source directory does not exist: $source_path"
        exit 1
    fi
    
    # Extract metadata
    local metadata_info
    if ! metadata_info=$(extract_metadata "$source_path"); then
        exit 1
    fi
    
    local po_id="${metadata_info%%:*}"
    local remaining="${metadata_info#*:}"
    local platform="${remaining%%:*}"
    local language="${remaining##*:}"
    
    print_status $GREEN "✅ Extracted po_id: $po_id"
    print_status $GREEN "✅ Extracted platform: $platform"
    print_status $GREEN "✅ Extracted language: $language"
    
    # Get git branch
    local branch=$(get_git_branch)
    print_status $GREEN "✅ Git branch: $branch"
    echo
    
    # Create archive directory name
    local archive_folder_name="LS-${po_id}-${platform}-${language}"
    local archive_base_dir="$PROJECT_ROOT/archive-localstack"
    local archive_full_path="$archive_base_dir/$archive_folder_name"
    
    print_status $MAGENTA "📂 Archive folder will be: $archive_folder_name"
    
    # Create archive-localstack directory if it doesn't exist
    if [[ ! -d "$archive_base_dir" ]]; then
        print_status $YELLOW "📁 Creating archive-localstack directory..."
        if mkdir -p "$archive_base_dir"; then
            print_status $GREEN "✅ Created $archive_base_dir"
        else
            print_status $RED "❌ Failed to create $archive_base_dir"
            exit 1
        fi
    else
        print_status $GREEN "✅ archive-localstack directory already exists"
    fi
    
    # Check if archive folder already exists
    if [[ -d "$archive_full_path" ]]; then
        print_status $YELLOW "⚠️  Archive folder already exists: $archive_folder_name"
        echo -n "Do you want to overwrite it? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status $YELLOW "🛑 Archive cancelled"
            exit 0
        fi
        print_status $YELLOW "🗑️  Removing existing archive folder..."
        rm -rf "$archive_full_path"
    fi
    
    # Create the specific archive folder
    print_status $YELLOW "📁 Creating archive folder: $archive_folder_name..."
    if mkdir -p "$archive_full_path"; then
        print_status $GREEN "✅ Created $archive_full_path"
    else
        print_status $RED "❌ Failed to create $archive_full_path"
        exit 1
    fi
    
    # Check what items can be moved
    local movable_items
    if ! movable_items=$(check_movable_items "$source_path"); then
        exit 1
    fi
    
    # Convert string to array
    read -ra items_array <<< "$movable_items"
    
    print_status $CYAN "📋 Items to archive: ${items_array[*]}"
    echo
    
    # Move items to archive
    if move_items_to_archive "$source_path" "$archive_full_path" "${items_array[@]}"; then
        echo
        print_status $GREEN "🎉 Archive completed successfully!"
        print_status $CYAN "📦 Archive location: $archive_full_path"
        
        # Show archive contents
        echo
        print_status $BLUE "📁 Archive contents:"
        if command -v tree >/dev/null 2>&1; then
            tree "$archive_full_path" || ls -la "$archive_full_path"
        else
            ls -la "$archive_full_path"
        fi
        
    else
        print_status $RED "❌ Archive completed with errors"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"