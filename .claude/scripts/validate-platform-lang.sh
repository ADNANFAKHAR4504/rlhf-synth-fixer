#!/bin/bash
# validate-platform-lang.sh
# Validates that platform and language combination is valid
# Referenced by: .claude/docs/references/validation-checkpoints.md (Checkpoint B)

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if arguments provided
if [ $# -eq 2 ]; then
    # Arguments provided
    PLATFORM="$1"
    LANGUAGE="$2"
    echo "Validating provided combination:"
else
    # No arguments - read from metadata.json
    if [ ! -f "metadata.json" ]; then
        print_error "metadata.json not found and no arguments provided"
        exit 1
    fi
    PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
    LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
    echo "Validating combination from metadata.json:"
fi

echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo ""

# Validate platform-language combination against compatibility matrix
VALID=false
VALID_LANGUAGES=""

case "$PLATFORM" in
    cdk)
        VALID_LANGUAGES="ts, js, py, java, go"
        if [[ "$LANGUAGE" =~ ^(ts|js|py|java|go)$ ]]; then
            VALID=true
        fi
        ;;
    cdktf)
        VALID_LANGUAGES="ts, py, go, java"
        if [[ "$LANGUAGE" =~ ^(ts|py|go|java)$ ]]; then
            VALID=true
        fi
        ;;
    pulumi)
        VALID_LANGUAGES="ts, js, py, java, go"
        if [[ "$LANGUAGE" =~ ^(ts|js|py|java|go)$ ]]; then
            VALID=true
        fi
        ;;
    tf)
        VALID_LANGUAGES="hcl"
        if [[ "$LANGUAGE" = "hcl" ]]; then
            VALID=true
        fi
        ;;
    cfn)
        VALID_LANGUAGES="yaml, json"
        if [[ "$LANGUAGE" =~ ^(yaml|json)$ ]]; then
            VALID=true
        fi
        ;;
    cicd)
        VALID_LANGUAGES="yaml, yml"
        if [[ "$LANGUAGE" =~ ^(yaml|yml)$ ]]; then
            VALID=true
        fi
        ;;
    analysis)
        VALID_LANGUAGES="py"
        if [[ "$LANGUAGE" = "py" ]]; then
            VALID=true
        fi
        ;;
    *)
        print_error "Unknown platform: $PLATFORM"
        echo ""
        echo "Valid platforms: cdk, cdktf, pulumi, tf, cfn, cicd, analysis"
        exit 1
        ;;
esac

# Report results
if [ "$VALID" = true ]; then
    print_success "Valid combination: $PLATFORM + $LANGUAGE"
    echo ""
    echo "This platform-language combination is supported."
    exit 0
else
    print_error "Invalid combination: $PLATFORM + $LANGUAGE"
    echo ""
    print_warning "Platform '$PLATFORM' does not support language '$LANGUAGE'"
    echo "  Valid languages for $PLATFORM: $VALID_LANGUAGES"
    echo ""
    echo "Please update metadata.json with a valid combination."
    exit 1
fi
