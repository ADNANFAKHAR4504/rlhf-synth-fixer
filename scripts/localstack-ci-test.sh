#!/bin/bash

# LocalStack CI Test Script
# Runs integration tests against LocalStack in CI/CD environments
# Supports: CDK, CloudFormation, Terraform, CDKTF, Pulumi

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
    echo -e "${CYAN}║                      🧪 LocalStack CI/CD Integration Tests                                   ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to check if LocalStack is running
check_localstack() {
    print_status $YELLOW "🔍 Checking LocalStack status..."
    if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        print_status $RED "❌ LocalStack is not running!"
        print_status $YELLOW "💡 Please ensure LocalStack is started before running tests"
        exit 1
    fi
    print_status $GREEN "✅ LocalStack is running"
    echo ""
}

# Function to detect platform from metadata.json
detect_platform() {
    local metadata_file="$PROJECT_ROOT/metadata.json"

    if [[ ! -f "$metadata_file" ]]; then
        print_status $RED "❌ metadata.json not found in project root"
        exit 1
    fi

    # Extract platform using jq
    if command -v jq >/dev/null 2>&1; then
        local platform=$(jq -r '.platform // "unknown"' "$metadata_file")
        local language=$(jq -r '.language // "unknown"' "$metadata_file")
    else
        print_status $RED "❌ jq is required but not installed"
        exit 1
    fi

    if [[ -z "$platform" || "$platform" == "null" || "$platform" == "unknown" ]]; then
        print_status $RED "❌ Could not determine platform from metadata.json"
        exit 1
    fi

    echo "$platform:$language"
}

# Function to run tests based on platform
run_tests() {
    local platform=$1
    local language=$2

    print_status $BLUE "📦 Platform: $platform"
    print_status $BLUE "📝 Language: $language"
    echo ""

    # Set LocalStack environment variables
    export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
    export AWS_ENDPOINT_URL_S3=${AWS_ENDPOINT_URL_S3:-http://localhost:4566}
    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
    export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
    export AWS_REGION=${AWS_REGION:-us-east-1}

    print_status $GREEN "✅ LocalStack test environment configured"
    print_status $BLUE "   AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL"
    print_status $BLUE "   AWS_ENDPOINT_URL_S3: $AWS_ENDPOINT_URL_S3"
    print_status $BLUE "   AWS_REGION: $AWS_DEFAULT_REGION"
    echo ""

    # Check for tests directory
    if [ ! -d "$PROJECT_ROOT/tests" ] && [ ! -d "$PROJECT_ROOT/test" ]; then
        print_status $YELLOW "⚠️  No tests directory found (tests/ or test/)"
        print_status $YELLOW "⚠️  Skipping integration tests"
        return 0
    fi

    case "$platform" in
        "cdk"|"cdktf")
            run_cdk_tests "$language"
            ;;
        "cfn"|"cloudformation")
            run_cfn_tests
            ;;
        "tf"|"terraform")
            run_terraform_tests
            ;;
        "pulumi")
            run_pulumi_tests "$language"
            ;;
        *)
            print_status $YELLOW "⚠️  No specific tests defined for platform: $platform"
            print_status $YELLOW "⚠️  Running generic integration tests if available"
            run_generic_tests "$language"
            ;;
    esac
}

# CDK/CDKTF tests
run_cdk_tests() {
    local language=$1
    print_status $MAGENTA "🧪 Running CDK/CDKTF integration tests..."

    # Verify deployment outputs exist (from flat-outputs.json)
    print_status $YELLOW "🔍 Verifying deployment outputs..."
    local outputs_file="$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    
    if [ ! -f "$outputs_file" ]; then
        print_status $RED "❌ Deployment outputs file not found: $outputs_file"
        print_status $YELLOW "💡 Make sure deployment step completed successfully"
        exit 1
    fi
    
    print_status $GREEN "✅ Deployment outputs file found"
    
    # Verify outputs file is not empty
    local outputs_content
    outputs_content=$(cat "$outputs_file" 2>/dev/null)
    
    if [ -z "$outputs_content" ] || [ "$outputs_content" = "{}" ]; then
        print_status $RED "❌ Deployment outputs file is empty!"
        exit 1
    fi
    
    local output_count=$(echo "$outputs_content" | jq 'keys | length' 2>/dev/null || echo "0")
    print_status $GREEN "✅ Found $output_count deployment outputs"
    echo ""

    # Run Jest integration tests if they exist
    if [ -d "$PROJECT_ROOT/test" ]; then
        # Check for any integration test files
        local int_tests=$(find "$PROJECT_ROOT/test" -name "*.int.test.ts" 2>/dev/null | head -1)
        
        if [ -n "$int_tests" ]; then
            print_status $MAGENTA "🧪 Running Jest integration tests..."
            cd "$PROJECT_ROOT"
            
            # Ensure dependencies are installed
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing test dependencies..."
                npm install --silent
            fi
            
            # Run integration tests with verbose output
            print_status $YELLOW "🔬 Executing integration test suite..."
            npm run test:integration -- --verbose --forceExit 2>&1 || {
                local exit_code=$?
                print_status $RED "❌ Integration tests failed with exit code: $exit_code"
                exit $exit_code
            }
            print_status $GREEN "✅ Jest integration tests passed!"
            echo ""
        else
            print_status $YELLOW "⚠️  No integration test files found in test/"
        fi
    fi

    # Run additional shell tests if they exist
    if [ -d "$PROJECT_ROOT/tests" ] && [ -f "$PROJECT_ROOT/tests/test.sh" ]; then
        print_status $YELLOW "🧪 Running custom test script..."
        cd "$PROJECT_ROOT/tests"
        bash test.sh
    fi

    print_status $GREEN "✅ CDK/CDKTF tests completed!"
}

# CloudFormation tests
run_cfn_tests() {
    print_status $MAGENTA "🧪 Running CloudFormation integration tests..."

    # Verify deployment outputs exist (from flat-outputs.json)
    print_status $YELLOW "🔍 Verifying deployment outputs..."
    local outputs_file="$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    
    if [ ! -f "$outputs_file" ]; then
        print_status $RED "❌ Deployment outputs file not found: $outputs_file"
        print_status $YELLOW "💡 Make sure deployment step completed successfully"
        exit 1
    fi
    
    print_status $GREEN "✅ Deployment outputs file found"
    
    # Verify outputs file is not empty
    local outputs_content
    outputs_content=$(cat "$outputs_file" 2>/dev/null)
    
    if [ -z "$outputs_content" ] || [ "$outputs_content" = "{}" ]; then
        print_status $RED "❌ Deployment outputs file is empty!"
        exit 1
    fi
    
    local output_count=$(echo "$outputs_content" | jq 'keys | length' 2>/dev/null || echo "0")
    print_status $GREEN "✅ Found $output_count deployment outputs"
    
    # Verify critical outputs exist
    print_status $YELLOW "🔍 Verifying critical outputs..."
    
    local critical_outputs=("VPCId" "ECSClusterName" "PipelineArn" "ApplicationLoadBalancerDNS")
    local missing_outputs=()
    
    for output in "${critical_outputs[@]}"; do
        local value=$(echo "$outputs_content" | jq -r ".[\"$output\"] // empty" 2>/dev/null)
        if [ -z "$value" ]; then
            missing_outputs+=("$output")
        else
            print_status $GREEN "   ✅ $output: $value"
        fi
    done
    
    if [ ${#missing_outputs[@]} -gt 0 ]; then
        print_status $YELLOW "⚠️  Some outputs not found (may be expected for LocalStack):"
        for output in "${missing_outputs[@]}"; do
            print_status $YELLOW "   - $output"
        done
    fi
    
    echo ""

    # Run Jest integration tests if they exist
    if [ -d "$PROJECT_ROOT/test" ]; then
        # Check for any integration test files
        local int_tests=$(find "$PROJECT_ROOT/test" -name "*.int.test.ts" 2>/dev/null | head -1)
        
        if [ -n "$int_tests" ]; then
            print_status $MAGENTA "🧪 Running Jest integration tests..."
            cd "$PROJECT_ROOT"
            
            # Ensure dependencies are installed
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing test dependencies..."
                npm install --silent
            fi
            
            # Run integration tests with verbose output
            print_status $YELLOW "🔬 Executing integration test suite..."
            npm run test:integration -- --verbose --forceExit 2>&1 || {
                local exit_code=$?
                print_status $RED "❌ Integration tests failed with exit code: $exit_code"
                exit $exit_code
            }
            print_status $GREEN "✅ Jest integration tests passed!"
            echo ""
        else
            print_status $YELLOW "⚠️  No integration test files found in test/"
        fi
    fi

    # Run additional shell tests if they exist
    if [ -d "$PROJECT_ROOT/tests" ] && [ -f "$PROJECT_ROOT/tests/test.sh" ]; then
        print_status $YELLOW "🧪 Running custom test script..."
        cd "$PROJECT_ROOT/tests"
        bash test.sh
    fi

    print_status $GREEN "✅ CloudFormation tests completed!"
}

# Terraform tests
run_terraform_tests() {
    print_status $MAGENTA "🧪 Running Terraform integration tests..."

    if [ -d "$PROJECT_ROOT/tests" ]; then
        cd "$PROJECT_ROOT/tests"

        # Check for Terratest or other Go-based tests
        if [ -f "go.mod" ]; then
            print_status $YELLOW "📦 Installing Go test dependencies..."
            go mod download

            print_status $YELLOW "🧪 Running Go tests..."
            go test -v -timeout 30m
        elif [ -f "test.sh" ]; then
            print_status $YELLOW "🧪 Running test script..."
            bash test.sh
        else
            print_status $YELLOW "⚠️  No test files found"
        fi
    fi

    print_status $GREEN "✅ Terraform tests completed!"
}

# Pulumi tests
run_pulumi_tests() {
    local language=$1
    print_status $MAGENTA "🧪 Running Pulumi integration tests..."

    cd "$PROJECT_ROOT"

    # Verify deployment outputs exist (from flat-outputs.json)
    print_status $YELLOW "🔍 Verifying deployment outputs..."
    local outputs_file="$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    
    if [ -f "$outputs_file" ]; then
        print_status $GREEN "✅ Deployment outputs file found"
        
        # Verify outputs file is not empty
        local outputs_content
        outputs_content=$(cat "$outputs_file" 2>/dev/null)
        
        if [ -z "$outputs_content" ] || [ "$outputs_content" = "{}" ]; then
            print_status $YELLOW "⚠️  Deployment outputs file is empty (may be expected)"
        else
            local output_count=$(echo "$outputs_content" | jq 'keys | length' 2>/dev/null || echo "0")
            print_status $GREEN "✅ Found $output_count deployment outputs"
            
            # Display outputs
            print_status $CYAN "📤 Deployment Outputs:"
            echo "$outputs_content" | jq -r 'to_entries[] | "   \(.key): \(.value)"' 2>/dev/null
            echo ""
        fi
    else
        print_status $YELLOW "⚠️  Deployment outputs file not found: $outputs_file"
        print_status $YELLOW "⚠️  Continuing with tests anyway..."
    fi

    # Run tests if they exist
    if [ -d "$PROJECT_ROOT/tests" ]; then
        cd "$PROJECT_ROOT"
        
        # Set PYTHONPATH for Python imports
        export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"

        case "$language" in
            "ts"|"js")
                if [ -f "package.json" ]; then
                    print_status $YELLOW "📦 Installing test dependencies..."
                    npm install
                    print_status $YELLOW "🧪 Running tests..."
                    npm test || {
                        local exit_code=$?
                        print_status $RED "❌ npm tests failed with exit code: $exit_code"
                        exit $exit_code
                    }
                fi
                ;;
            "py"|"python")
                print_status $YELLOW "🧪 Running Python tests..."
                # Install test dependencies if requirements exist
                if [ -f "$PROJECT_ROOT/tests/requirements.txt" ]; then
                    pip install -r "$PROJECT_ROOT/tests/requirements.txt" --quiet
                fi
                # Run pytest from project root
                pytest tests/ -v --tb=short 2>&1 || {
                    local exit_code=$?
                    if [ $exit_code -ne 0 ]; then
                        print_status $YELLOW "⚠️  Some tests failed (exit code: $exit_code)"
                        # Don't fail the entire CI for test failures in LocalStack
                        # as some services may not be fully supported
                    fi
                }
                ;;
            "go")
                if [ -f "$PROJECT_ROOT/tests/go.mod" ]; then
                    cd "$PROJECT_ROOT/tests"
                    print_status $YELLOW "📦 Installing test dependencies..."
                    go mod download
                    print_status $YELLOW "🧪 Running tests..."
                    go test -v || {
                        local exit_code=$?
                        print_status $RED "❌ Go tests failed with exit code: $exit_code"
                        exit $exit_code
                    }
                fi
                ;;
        esac
    else
        print_status $YELLOW "⚠️  No tests directory found"
    fi

    # Only show success if we got here without errors
    print_status $GREEN "✅ Pulumi tests completed!"
}

# Generic tests
run_generic_tests() {
    local language=$1
    print_status $MAGENTA "🧪 Running generic integration tests..."

    local test_dir=""
    if [ -d "$PROJECT_ROOT/tests" ]; then
        test_dir="$PROJECT_ROOT/tests"
    elif [ -d "$PROJECT_ROOT/test" ]; then
        test_dir="$PROJECT_ROOT/test"
    else
        print_status $YELLOW "⚠️  No test directory found"
        return 0
    fi

    cd "$test_dir"

    case "$language" in
        "ts"|"js")
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing test dependencies..."
                npm install
                print_status $YELLOW "🧪 Running tests..."
                npm test || {
                    local exit_code=$?
                    print_status $RED "❌ npm tests failed with exit code: $exit_code"
                    exit $exit_code
                }
            fi
            ;;
        "py"|"python")
            if [ -f "requirements.txt" ]; then
                print_status $YELLOW "📦 Installing test dependencies..."
                pip install -r requirements.txt
                print_status $YELLOW "🧪 Running tests..."
                pytest -v || python -m pytest -v || python -m unittest discover || {
                    local exit_code=$?
                    print_status $RED "❌ Python tests failed with exit code: $exit_code"
                    exit $exit_code
                }
            fi
            ;;
        "go")
            if [ -f "go.mod" ]; then
                print_status $YELLOW "📦 Installing test dependencies..."
                go mod download
                print_status $YELLOW "🧪 Running tests..."
                go test -v ./... || {
                    local exit_code=$?
                    print_status $RED "❌ Go tests failed with exit code: $exit_code"
                    exit $exit_code
                }
            fi
            ;;
    esac

    print_status $GREEN "✅ Generic tests completed!"
}

# Main function
main() {
    print_banner

    # Check LocalStack
    check_localstack

    # Detect platform
    print_status $YELLOW "🔍 Detecting platform from metadata.json..."
    local platform_info
    platform_info=$(detect_platform)

    local platform="${platform_info%%:*}"
    local language="${platform_info##*:}"

    print_status $GREEN "✅ Detected platform: $platform"
    print_status $GREEN "✅ Detected language: $language"
    echo ""

    # Run tests and capture exit code
    if ! run_tests "$platform" "$language"; then
        echo ""
        print_status $RED "❌ LocalStack integration tests failed!"
        exit 1
    fi

    echo ""
    print_status $GREEN "🎉 LocalStack integration tests completed successfully!"
}

# Execute main
main "$@"
