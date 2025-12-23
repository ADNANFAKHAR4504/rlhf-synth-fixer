#!/bin/bash

# LocalStack Plan Script
# This script generates execution plans for LocalStack infrastructure for any supported platform
# Usage: ./localstack-plan.sh [path]
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
    echo -e "${CYAN}║                              📋 LocalStack Plan                                              ║${NC}"
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
    echo "  $0                                    # Generate plan for current directory"
    echo "  $0 ./lib                              # Generate plan for ./lib directory"
    echo "  $0 ./archive/tf-hcl/Pr1075           # Generate plan for specific PR"
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

# Function to get plan script name based on platform
get_plan_script() {
    local platform=$1
    case "$platform" in
        "tf"|"terraform")
            echo "localstack-terraform-plan.sh"
            ;;
        "cfn"|"cloudformation")
            echo "localstack-cloudformation-plan.sh"
            ;;
        "cdk")
            echo "localstack-cdk-plan.sh"
            ;;
        "cdktf")
            print_status $YELLOW "⚠️  CDKTF support is not yet implemented"
            return 1
            ;;
        "pulumi")
            echo "localstack-pulumi-plan.sh"
            ;;
        *)
            print_status $RED "❌ Unsupported platform: $platform"
            return 1
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
    if platform_info=$(detect_platform_language "$stack_path"); then
        local platform="${platform_info%%:*}"
        local language="${platform_info##*:}"
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
                    local platform="${platform_info%%:*}"
                    local language="${platform_info##*:}"
                    print_status $GREEN "✅ Detected platform from $fallback_path: $platform"
                    print_status $GREEN "✅ Detected language: $language"
                    found_metadata=true
                    break
                fi
            fi
        done
        
        if [[ "$found_metadata" == false ]]; then
            print_status $RED "❌ Could not detect platform. Please ensure metadata.json exists in the target directory."
            print_status $YELLOW "💡 Expected metadata.json format:"
            echo '{'
            echo '  "platform": "tf|cfn|cdk|cdktf|pulumi",'
            echo '  "language": "hcl|yaml|go|typescript|python|..."'
            echo '}'
            exit 1
        fi
        echo
    fi
    
    # Get plan script based on platform
    local plan_script
    if ! plan_script=$(get_plan_script "$platform"); then
        exit 1
    fi
    
    local script_path="$SCRIPT_DIR/$plan_script"
    
    if [[ ! -f "$script_path" ]]; then
        print_status $RED "❌ Plan script not found: $plan_script"
        exit 1
    fi
    
    print_status $MAGENTA "📋 Executing plan generation for $platform platform..."
    print_status $BLUE "📁 Working directory: $stack_path"
    echo
    
    # Change to the stack directory before executing the script
    local original_dir=$(pwd)
    cd "$stack_path" || {
        print_status $RED "❌ Could not change to directory: $stack_path"
        exit 1
    }
    
    # Execute the plan script
    if "$script_path"; then
        print_status $GREEN "🎉 Plan generation completed successfully!"
        cd "$original_dir"
        exit 0
    else
        print_status $RED "❌ Plan generation failed"
        cd "$original_dir"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"