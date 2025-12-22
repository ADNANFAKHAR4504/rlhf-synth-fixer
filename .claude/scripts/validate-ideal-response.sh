#!/bin/bash

# validate-ideal-response.sh
# Validates that IDEAL_RESPONSE.md contains exact code from infrastructure files and tests
# Exit 0: validation passed
# Exit 1: validation failed

set -e

IDEAL_RESPONSE="lib/IDEAL_RESPONSE.md"
METADATA_FILE="metadata.json"

echo "========================================="
echo "IDEAL_RESPONSE.md Validation"
echo "========================================="
echo ""

# Check if IDEAL_RESPONSE.md exists
if [ ! -f "$IDEAL_RESPONSE" ]; then
    echo "ERROR: lib/IDEAL_RESPONSE.md not found"
    exit 1
fi

# Check if metadata.json exists
if [ ! -f "$METADATA_FILE" ]; then
    echo "ERROR: metadata.json not found"
    exit 1
fi

# Extract platform and language from metadata.json
PLATFORM=$(jq -r '.platform' "$METADATA_FILE")
LANGUAGE=$(jq -r '.language' "$METADATA_FILE")

echo "Platform: $PLATFORM"
echo "Language: $LANGUAGE"
echo ""

VALIDATION_FAILED=0
MISSING_FILES=()
MISMATCHED_FILES=()

# Function to check if file content exists in IDEAL_RESPONSE.md
check_file_in_ideal_response() {
    local file_path="$1"
    local file_name=$(basename "$file_path")

    if [ ! -f "$file_path" ]; then
        echo "  WARNING: File not found: $file_path"
        return 0
    fi

    # Get actual file content
    ACTUAL_CONTENT=$(cat "$file_path")

    # Check if the file content appears in IDEAL_RESPONSE.md
    # We need to handle code blocks properly
    if ! grep -qF "$ACTUAL_CONTENT" "$IDEAL_RESPONSE"; then
        echo "  FAIL: $file_name code not found in IDEAL_RESPONSE.md"
        MISMATCHED_FILES+=("$file_name")
        return 1
    else
        echo "  PASS: $file_name found in IDEAL_RESPONSE.md"
        return 0
    fi
}

# Check infrastructure files based on platform
echo "Checking infrastructure files..."
echo ""

case "$PLATFORM" in
    "cdk")
        if [ "$LANGUAGE" = "ts" ] || [ "$LANGUAGE" = "js" ]; then
            check_file_in_ideal_response "lib/tap-stack.ts" || VALIDATION_FAILED=1
            check_file_in_ideal_response "lib/tap-stack.js" || true
        elif [ "$LANGUAGE" = "py" ]; then
            check_file_in_ideal_response "lib/tap_stack.py" || VALIDATION_FAILED=1
        elif [ "$LANGUAGE" = "java" ]; then
            check_file_in_ideal_response "lib/Main.java" || VALIDATION_FAILED=1
            # Check for any other Java files in lib/
            for java_file in lib/*.java; do
                if [ -f "$java_file" ] && [ "$java_file" != "lib/Main.java" ]; then
                    check_file_in_ideal_response "$java_file" || VALIDATION_FAILED=1
                fi
            done
        fi
        ;;

    "cdktf")
        if [ "$LANGUAGE" = "ts" ]; then
            check_file_in_ideal_response "lib/tap-stack.ts" || VALIDATION_FAILED=1
        elif [ "$LANGUAGE" = "py" ]; then
            check_file_in_ideal_response "lib/tap_stack.py" || VALIDATION_FAILED=1
            check_file_in_ideal_response "lib/__main__.py" || true
        fi
        ;;

    "cfn")
        if [ "$LANGUAGE" = "yaml" ] || [ "$LANGUAGE" = "yml" ]; then
            check_file_in_ideal_response "lib/TapStack.yml" || check_file_in_ideal_response "lib/TapStack.yaml" || VALIDATION_FAILED=1
        elif [ "$LANGUAGE" = "json" ]; then
            check_file_in_ideal_response "lib/TapStack.json" || VALIDATION_FAILED=1
        fi
        ;;

    "tf")
        # Check all .tf files in lib/
        for tf_file in lib/*.tf; do
            if [ -f "$tf_file" ]; then
                check_file_in_ideal_response "$tf_file" || VALIDATION_FAILED=1
            fi
        done
        ;;

    "pulumi")
        if [ "$LANGUAGE" = "py" ]; then
            check_file_in_ideal_response "lib/__main__.py" || VALIDATION_FAILED=1
            check_file_in_ideal_response "lib/tap_stack.py" || true
        elif [ "$LANGUAGE" = "ts" ]; then
            check_file_in_ideal_response "lib/index.ts" || VALIDATION_FAILED=1
        elif [ "$LANGUAGE" = "java" ]; then
            check_file_in_ideal_response "lib/Main.java" || VALIDATION_FAILED=1
            for java_file in lib/*.java; do
                if [ -f "$java_file" ] && [ "$java_file" != "lib/Main.java" ]; then
                    check_file_in_ideal_response "$java_file" || VALIDATION_FAILED=1
                fi
            done
        elif [ "$LANGUAGE" = "go" ]; then
            check_file_in_ideal_response "lib/main.go" || VALIDATION_FAILED=1
        fi
        ;;

    *)
        echo "WARNING: Unknown platform: $PLATFORM"
        ;;
esac

echo ""
echo "Checking test files..."
echo ""

# Check unit test files
if [ -d "test" ]; then
    TEST_DIR="test"
elif [ -d "tests" ]; then
    TEST_DIR="tests"
else
    TEST_DIR=""
fi

if [ -n "$TEST_DIR" ]; then
    # Find unit test files
    for test_file in $(find "$TEST_DIR" -name "*.unit.test.*" -o -name "*_unit_test.*" -o -name "*UnitTest.*"); do
        if [ -f "$test_file" ]; then
            check_file_in_ideal_response "$test_file" || VALIDATION_FAILED=1
        fi
    done

    # Find integration test files
    for test_file in $(find "$TEST_DIR" -name "*.int.test.*" -o -name "*_int_test.*" -o -name "*IntTest.*" -o -name "*IntegrationTest.*"); do
        if [ -f "$test_file" ]; then
            check_file_in_ideal_response "$test_file" || VALIDATION_FAILED=1
        fi
    done
else
    echo "  WARNING: No test directory found (test/ or tests/)"
fi

echo ""
echo "========================================="
echo "Validation Summary"
echo "========================================="

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo "RESULT: PASSED"
    echo ""
    echo "All infrastructure code and test files are correctly documented in IDEAL_RESPONSE.md"
    exit 0
else
    echo "RESULT: FAILED"
    echo ""
    echo "The following files are missing or do not match in IDEAL_RESPONSE.md:"
    for file in "${MISMATCHED_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "IDEAL_RESPONSE.md must contain the EXACT code from all infrastructure files and tests."
    echo "Please update IDEAL_RESPONSE.md to include the complete, character-for-character code from these files."
    exit 1
fi
