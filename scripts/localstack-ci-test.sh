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

# Function to verify deployment outputs exist
# This is required for all platforms - integration tests MUST have deployment outputs
verify_deployment_outputs() {
    print_status $YELLOW "🔍 Verifying deployment outputs..."
    local outputs_file="$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    
    if [ ! -f "$outputs_file" ]; then
        print_status $RED "❌ Deployment outputs file not found: $outputs_file"
        print_status $RED "❌ Integration tests require deployment outputs to run"
        print_status $YELLOW "💡 Make sure deployment step completed successfully"
        exit 1
    fi
    
    print_status $GREEN "✅ Deployment outputs file found"
    
    # Verify outputs file is not empty
    local outputs_content
    outputs_content=$(cat "$outputs_file" 2>/dev/null)
    
    if [ -z "$outputs_content" ] || [ "$outputs_content" = "{}" ]; then
        print_status $RED "❌ Deployment outputs file is empty!"
        print_status $RED "❌ Integration tests require deployment outputs to run"
        exit 1
    fi
    
    local output_count=$(echo "$outputs_content" | jq 'keys | length' 2>/dev/null || echo "0")
    if [ "$output_count" -eq 0 ]; then
        print_status $RED "❌ No deployment outputs found in file"
        print_status $RED "❌ Integration tests require deployment outputs to run"
        exit 1
    fi
    
    print_status $GREEN "✅ Found $output_count deployment outputs"
    echo ""
}

# Function to determine test directory based on platform and language
# CDK/CDKTF: tests/ for go/java/py/python, test/ for ts/js
# CloudFormation: test/ for yaml/json
# Pulumi: tests/ for go/java/py, test/ for ts/js
# Terraform: test/ for hcl
get_test_directory() {
    local platform=$1
    local language=$2
    
    case "$platform" in
        "cdk"|"cdktf")
            case "$language" in
                "ts"|"js")
                    if [ -d "$PROJECT_ROOT/test" ]; then
                        echo "$PROJECT_ROOT/test"
                    fi
                    ;;
                "go"|"java"|"py"|"python")
                    if [ -d "$PROJECT_ROOT/tests" ]; then
                        echo "$PROJECT_ROOT/tests"
                    fi
                    ;;
            esac
            ;;
        "cfn"|"cloudformation")
            # CloudFormation always uses test/
            if [ -d "$PROJECT_ROOT/test" ]; then
                echo "$PROJECT_ROOT/test"
            fi
            ;;
        "pulumi")
            case "$language" in
                "ts"|"js")
                    if [ -d "$PROJECT_ROOT/test" ]; then
                        echo "$PROJECT_ROOT/test"
                    fi
                    ;;
                "go"|"java"|"py"|"python")
                    if [ -d "$PROJECT_ROOT/tests" ]; then
                        echo "$PROJECT_ROOT/tests"
                    fi
                    ;;
            esac
            ;;
        "tf"|"terraform")
            # Terraform always uses test/
            if [ -d "$PROJECT_ROOT/test" ]; then
                echo "$PROJECT_ROOT/test"
            fi
            ;;
        *)
            # Generic: try tests/ first, then test/
            if [ -d "$PROJECT_ROOT/tests" ]; then
                echo "$PROJECT_ROOT/tests"
            elif [ -d "$PROJECT_ROOT/test" ]; then
                echo "$PROJECT_ROOT/test"
            fi
            ;;
    esac
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

    # Verify deployment outputs - required for all platforms
    verify_deployment_outputs

    # Get test directory
    local test_dir=$(get_test_directory "$platform" "$language")
    
    if [ -z "$test_dir" ]; then
        print_status $YELLOW "⚠️  No test directory found for platform '$platform' with language '$language'"
        print_status $YELLOW "⚠️  Expected: test/ for ts/js, tests/ for other languages"
        return 0
    fi
    
    print_status $BLUE "📁 Test directory: $test_dir"
    echo ""

    case "$platform" in
        "cdk"|"cdktf")
            run_cdk_tests "$language" "$test_dir"
            ;;
        "cfn"|"cloudformation")
            run_cfn_tests "$language" "$test_dir"
            ;;
        "tf"|"terraform")
            run_terraform_tests "$language" "$test_dir"
            ;;
        "pulumi")
            run_pulumi_tests "$language" "$test_dir"
            ;;
        *)
            print_status $YELLOW "⚠️  No specific tests defined for platform: $platform"
            print_status $YELLOW "⚠️  Running generic integration tests"
            run_generic_tests "$language" "$test_dir"
            ;;
    esac
}

# CDK/CDKTF tests
# Languages: go, java, js, py, python, ts
# Test directory: tests/ for go/java/py/python, test/ for ts/js
run_cdk_tests() {
    local language=$1
    local test_dir=$2
    print_status $MAGENTA "🧪 Running CDK/CDKTF integration tests..."
    echo ""

    cd "$PROJECT_ROOT"

    case "$language" in
        "ts"|"js")
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing dependencies..."
                npm install --silent
                
                # Check for integration test files
                local int_tests=$(find "$test_dir" -name "*.int.test.ts" -o -name "*.int.test.js" 2>/dev/null | head -1)
                
                if [ -n "$int_tests" ]; then
                    print_status $YELLOW "🧪 Running Jest integration tests..."
                    npm run test:integration -- --verbose --forceExit 2>&1
                    local exit_code=$?
                    if [ $exit_code -ne 0 ]; then
                        print_status $RED "❌ Integration tests failed with exit code: $exit_code"
                        exit $exit_code
                    fi
                else
                    print_status $YELLOW "🧪 Running npm test..."
                    npm test 2>&1
                    local exit_code=$?
                    if [ $exit_code -ne 0 ]; then
                        print_status $RED "❌ Tests failed with exit code: $exit_code"
                        exit $exit_code
                    fi
                fi
            fi
            ;;
        "py"|"python")
            print_status $YELLOW "🧪 Running Python tests..."
            export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"
            
            if [ -f "$test_dir/requirements.txt" ]; then
                pip install -r "$test_dir/requirements.txt" --quiet
            fi
            
            pytest "$test_dir" -v --tb=short 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Pytest failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "go")
            print_status $YELLOW "🧪 Running Go tests..."
            cd "$test_dir"
            
            if [ -f "go.mod" ]; then
                go mod download
            fi
            
            go test -v -timeout 30m 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Go tests failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "java")
            print_status $YELLOW "🧪 Running Java tests..."
            cd "$PROJECT_ROOT"
            
            if [ -f "pom.xml" ]; then
                mvn test -B 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Maven tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
                ./gradlew test 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Gradle tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            fi
            ;;
        *)
            print_status $RED "❌ Unknown language for CDK/CDKTF: $language"
            exit 1
            ;;
    esac

    echo ""
    print_status $GREEN "✅ CDK/CDKTF tests completed!"
}

# CloudFormation tests
# Languages: yaml, json
# Test directory: test/
run_cfn_tests() {
    local language=$1
    local test_dir=$2
    print_status $MAGENTA "🧪 Running CloudFormation integration tests..."
    echo ""

    cd "$PROJECT_ROOT"

    # CloudFormation tests are typically TypeScript/JavaScript Jest tests
    if [ -f "package.json" ]; then
        print_status $YELLOW "📦 Installing dependencies..."
        npm install --silent
        
        # Check for integration test files
        local int_tests=$(find "$test_dir" -name "*.int.test.ts" -o -name "*.int.test.js" 2>/dev/null | head -1)
        
        if [ -n "$int_tests" ]; then
            print_status $YELLOW "🧪 Running Jest integration tests..."
            npm run test:integration -- --verbose --forceExit 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Integration tests failed with exit code: $exit_code"
                exit $exit_code
            fi
        else
            # Try running npm test if no specific integration tests
            print_status $YELLOW "🧪 Running npm test..."
            npm test 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Tests failed with exit code: $exit_code"
                exit $exit_code
            fi
        fi
    elif [ -f "$test_dir/test.sh" ]; then
        print_status $YELLOW "🧪 Running custom test script..."
        cd "$test_dir"
        bash test.sh 2>&1
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            print_status $RED "❌ Test script failed with exit code: $exit_code"
            exit $exit_code
        fi
    else
        print_status $RED "❌ No test runner found for CloudFormation"
        exit 1
    fi

    echo ""
    print_status $GREEN "✅ CloudFormation tests completed!"
}

# Terraform tests
# Languages: hcl
# Test directory: test/
run_terraform_tests() {
    local language=$1
    local test_dir=$2
    print_status $MAGENTA "🧪 Running Terraform integration tests..."
    echo ""

    local test_runner_found=false

    # Check for Go-based Terratest in test directory
    if [ -f "$test_dir/go.mod" ]; then
        test_runner_found=true
        cd "$test_dir"
        print_status $YELLOW "📦 Installing Go test dependencies..."
        go mod download
        
        print_status $YELLOW "🧪 Running Terratest..."
        go test -v -timeout 30m 2>&1
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            print_status $RED "❌ Terratest failed with exit code: $exit_code"
            exit $exit_code
        fi
    # Check for custom test script in test directory
    elif [ -f "$test_dir/test.sh" ]; then
        test_runner_found=true
        cd "$test_dir"
        print_status $YELLOW "🧪 Running custom test script..."
        bash test.sh 2>&1
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            print_status $RED "❌ Test script failed with exit code: $exit_code"
            exit $exit_code
        fi
    # Check for package.json in project root (TypeScript/JavaScript tests)
    elif [ -f "$PROJECT_ROOT/package.json" ]; then
        test_runner_found=true
        cd "$PROJECT_ROOT"
        print_status $YELLOW "📦 Installing dependencies..."
        npm install --silent
        
        # Check for integration test files
        local int_tests=$(find "$test_dir" -name "*.int.test.ts" -o -name "*.int.test.js" 2>/dev/null | head -1)
        
        if [ -n "$int_tests" ]; then
            print_status $YELLOW "🧪 Running Jest integration tests..."
            npm run test:integration -- --verbose --forceExit 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Integration tests failed with exit code: $exit_code"
                exit $exit_code
            fi
        else
            print_status $YELLOW "🧪 Running npm test..."
            npm test 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Tests failed with exit code: $exit_code"
                exit $exit_code
            fi
        fi
    # Check for package.json in test directory
    elif [ -f "$test_dir/package.json" ]; then
        test_runner_found=true
        cd "$test_dir"
        print_status $YELLOW "📦 Installing dependencies..."
        npm install --silent
        
        print_status $YELLOW "🧪 Running npm test..."
        npm test 2>&1
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            print_status $RED "❌ Tests failed with exit code: $exit_code"
            exit $exit_code
        fi
    fi

    # Fail if no test runner was found
    if [ "$test_runner_found" = false ]; then
        print_status $RED "❌ No test runner found for Terraform"
        print_status $YELLOW "💡 Expected: go.mod (Terratest), test.sh, or package.json"
        exit 1
    fi

    echo ""
    print_status $GREEN "✅ Terraform tests completed!"
}

# Pulumi tests
# Languages: go, java, js, py, ts
# Test directory: tests/ for go/java/py, test/ for ts/js
run_pulumi_tests() {
    local language=$1
    local test_dir=$2
    print_status $MAGENTA "🧪 Running Pulumi integration tests..."
    echo ""

    cd "$PROJECT_ROOT"

    case "$language" in
        "ts"|"js")
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing dependencies..."
                npm install --silent
                
                print_status $YELLOW "🧪 Running npm test..."
                npm test 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            fi
            ;;
        "py"|"python")
            print_status $YELLOW "🧪 Running Python tests..."
            export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"
            
            if [ -f "$test_dir/requirements.txt" ]; then
                pip install -r "$test_dir/requirements.txt" --quiet
            fi
            
            pytest "$test_dir" -v --tb=short 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Pytest failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "go")
            print_status $YELLOW "🧪 Running Go tests..."
            cd "$test_dir"
            
            if [ -f "go.mod" ]; then
                go mod download
            fi
            
            go test -v -timeout 30m 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Go tests failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "java")
            print_status $YELLOW "🧪 Running Java tests..."
            cd "$PROJECT_ROOT"
            
            if [ -f "pom.xml" ]; then
                mvn test -B 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Maven tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
                ./gradlew test 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Gradle tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            fi
            ;;
        *)
            print_status $RED "❌ Unknown language for Pulumi: $language"
            exit 1
            ;;
    esac

    echo ""
    print_status $GREEN "✅ Pulumi tests completed!"
}

# Generic tests (fallback)
run_generic_tests() {
    local language=$1
    local test_dir=$2
    print_status $MAGENTA "🧪 Running generic integration tests..."
    echo ""

    cd "$test_dir"

    case "$language" in
        "ts"|"js")
            if [ -f "package.json" ] || [ -f "$PROJECT_ROOT/package.json" ]; then
                cd "$PROJECT_ROOT"
                print_status $YELLOW "📦 Installing dependencies..."
                npm install --silent
                
                print_status $YELLOW "🧪 Running npm test..."
                npm test 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            fi
            ;;
        "py"|"python")
            print_status $YELLOW "🧪 Running Python tests..."
            export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"
            
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt --quiet
            fi
            
            pytest -v --tb=short 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Pytest failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "go")
            print_status $YELLOW "🧪 Running Go tests..."
            
            if [ -f "go.mod" ]; then
                go mod download
            fi
            
            go test -v ./... 2>&1
            local exit_code=$?
            if [ $exit_code -ne 0 ]; then
                print_status $RED "❌ Go tests failed with exit code: $exit_code"
                exit $exit_code
            fi
            ;;
        "java")
            print_status $YELLOW "🧪 Running Java tests..."
            cd "$PROJECT_ROOT"
            
            if [ -f "pom.xml" ]; then
                mvn test -B 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Maven tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
                ./gradlew test 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Gradle tests failed with exit code: $exit_code"
                    exit $exit_code
                fi
            fi
            ;;
        *)
            # Try to run any test.sh script
            if [ -f "test.sh" ]; then
                print_status $YELLOW "🧪 Running custom test script..."
                bash test.sh 2>&1
                local exit_code=$?
                if [ $exit_code -ne 0 ]; then
                    print_status $RED "❌ Test script failed with exit code: $exit_code"
                    exit $exit_code
                fi
            else
                print_status $RED "❌ No test runner found for language: $language"
                exit 1
            fi
            ;;
    esac

    echo ""
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
