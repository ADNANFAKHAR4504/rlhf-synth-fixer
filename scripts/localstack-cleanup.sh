#!/bin/bash

# LocalStack Cleanup Script
# This script cleans up LocalStack resources for any supported platform
# Usage: ./localstack-cleanup.sh [path]
# Path: defaults to current directory if not specified

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
    echo -e "${CYAN}║                             🧹 LocalStack Cleanup                                            ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [path]"
    echo
    echo "Arguments:"
    echo "  path         Path to the stack directory (defaults to current directory)"
    echo
    echo "Examples:"
    echo "  $0                                    # Cleanup resources for current directory"
    echo "  $0 ./lib                              # Cleanup resources for ./lib directory"
    echo "  $0 ./archive/tf-hcl/Pr1075           # Cleanup resources for specific PR"
    echo
}

# Function to check if LocalStack is running
check_localstack() {
    print_status $YELLOW "🔍 Checking LocalStack status..."
    if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
        print_status $RED "❌ LocalStack is not running!"
        print_status $YELLOW "💡 Please start LocalStack first using: docker run -d -p 4566:4566 localstack/localstack-pro:latest"
        exit 1
    fi
    print_status $GREEN "✅ LocalStack is running"
    echo
}

# Function to detect platform and language from metadata.json
detect_platform_language() {
    local stack_path=$1
    local metadata_file="$stack_path/metadata.json"
    
    if [[ ! -f "$metadata_file" ]]; then
        print_status $YELLOW "⚠️  No metadata.json found in $stack_path"
        return 1
    fi
    
    # Extract platform and language using jq or fallback to grep/sed
    if command -v jq >/dev/null 2>&1; then
        local platform=$(jq -r '.platform // "unknown"' "$metadata_file")
        local language=$(jq -r '.language // "unknown"' "$metadata_file")
    else
        # Fallback parsing without jq
        local platform=$(grep '"platform"' "$metadata_file" | sed 's/.*"platform"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
        local language=$(grep '"language"' "$metadata_file" | sed 's/.*"language"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    fi
    
    if [[ -z "$platform" || "$platform" == "null" || "$platform" == "unknown" ]]; then
        print_status $RED "❌ Could not determine platform from metadata.json"
        return 1
    fi
    
    echo "$platform:$language"
    return 0
}

# Function to get cleanup script name based on platform
get_cleanup_script() {
    local platform=$1
    case "$platform" in
        "tf"|"terraform")
            echo "localstack-terraform-cleanup.sh"
            ;;
        "cfn"|"cloudformation")
            echo "localstack-cloudformation-cleanup.sh"
            ;;
        "cdk")
            echo "localstack-cdk-cleanup.sh"
            ;;
        "cdktf")
            print_status $YELLOW "⚠️  CDKTF support is not yet implemented"
            return 1
            ;;
        "pulumi")
            echo "localstack-pulumi-cleanup.sh"
            ;;
        *)
            # For unsupported platforms, fall back to generic cleanup
            print_status $YELLOW "⚠️  Platform '$platform' not specifically supported, using generic cleanup"
            echo "localstack-clean.sh"
            ;;
    esac
}

# Main function
main() {
    print_banner
    
    # Parse arguments
    local stack_path="."
    
    # Check if first argument is a help flag
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # If path provided, use it
    if [[ -n "$1" ]]; then
        stack_path="$1"
    fi
    
    # Convert to absolute path
    stack_path="$(cd "$stack_path" 2>/dev/null && pwd || realpath "$stack_path" 2>/dev/null || echo "$stack_path")"
    
    print_status $BLUE "📍 Stack Path: $stack_path"
    echo
    
    # Check if path exists
    if [[ ! -d "$stack_path" ]]; then
        print_status $RED "❌ Directory does not exist: $stack_path"
        exit 1
    fi
    
    # Check LocalStack status
    check_localstack
    
    # Detect platform and language
    print_status $YELLOW "🔍 Detecting platform and language..."
    
    local platform_info
    local platform="unknown"
    local language="unknown"
    
    if platform_info=$(detect_platform_language "$stack_path"); then
        platform="${platform_info%%:*}"
        language="${platform_info##*:}"
        print_status $GREEN "✅ Detected platform: $platform"
        print_status $GREEN "✅ Detected language: $language"
        echo
    else
        # Fallback: try to detect from lib, test, or metadata in current directory
        print_status $YELLOW "🔍 Trying fallback detection from root directory..."
        
        local fallback_paths=("$PROJECT_ROOT/lib" "$PROJECT_ROOT/test" "$PROJECT_ROOT")
        local found_metadata=false
        
        for fallback_path in "${fallback_paths[@]}"; do
            if [[ -d "$fallback_path" ]]; then
                if platform_info=$(detect_platform_language "$fallback_path"); then
                    platform="${platform_info%%:*}"
                    language="${platform_info##*:}"
                    print_status $GREEN "✅ Detected platform from $fallback_path: $platform"
                    print_status $GREEN "✅ Detected language: $language"
                    found_metadata=true
                    break
                fi
            fi
        done
        
        if [[ "$found_metadata" == false ]]; then
            print_status $YELLOW "⚠️  Could not detect platform. Using generic cleanup."
            platform="unknown"
        fi
        echo
    fi
    
    # Get cleanup script based on platform
    local cleanup_script
    if ! cleanup_script=$(get_cleanup_script "$platform"); then
        exit 1
    fi
    
    local script_path="$SCRIPT_DIR/$cleanup_script"
    
    if [[ ! -f "$script_path" ]]; then
        print_status $RED "❌ Cleanup script not found: $cleanup_script"
        exit 1
    fi
    
    print_status $MAGENTA "🧹 Executing cleanup for $platform platform..."
    print_status $BLUE "📁 Working directory: $stack_path"
    echo
    
    # Change to the stack directory before executing the script
    local original_dir=$(pwd)
    cd "$stack_path" || {
        print_status $RED "❌ Could not change to directory: $stack_path"
        exit 1
    }
    
    # Execute the cleanup script
    if "$script_path"; then
        print_status $GREEN "🎉 Cleanup completed successfully!"
        cd "$original_dir"
        exit 0
    else
        print_status $RED "❌ Cleanup failed"
        cd "$original_dir"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"