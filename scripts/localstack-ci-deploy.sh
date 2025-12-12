#!/bin/bash

# LocalStack CI Deploy Script
# Deploys infrastructure to LocalStack in CI/CD environments
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
    echo -e "${CYAN}║                         🚀 LocalStack CI/CD Deploy                                           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to check if LocalStack is running
check_localstack() {
    print_status $YELLOW "🔍 Checking LocalStack status..."
    if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        print_status $RED "❌ LocalStack is not running!"
        print_status $YELLOW "💡 Please ensure LocalStack is started before deployment"
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

# Function to deploy based on platform
deploy_platform() {
    local platform=$1
    local language=$2

    print_status $BLUE "📦 Platform: $platform"
    print_status $BLUE "📝 Language: $language"
    echo ""

    # Set LocalStack environment variables
    # Use s3.localhost.localstack.cloud for S3 endpoint to ensure proper bucket name parsing
    export AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
    export AWS_ENDPOINT_URL_S3=${AWS_ENDPOINT_URL_S3:-http://s3.localhost.localstack.cloud:4566}
    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
    export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
    export AWS_REGION=${AWS_REGION:-us-east-1}

    print_status $GREEN "✅ LocalStack environment configured"
    print_status $BLUE "   AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL"
    print_status $BLUE "   AWS_ENDPOINT_URL_S3: $AWS_ENDPOINT_URL_S3"
    print_status $BLUE "   AWS_REGION: $AWS_DEFAULT_REGION"
    echo ""

    # Check if lib directory exists
    if [ ! -d "$PROJECT_ROOT/lib" ]; then
        print_status $RED "❌ lib directory not found"
        exit 1
    fi

    # Change directory based on platform
    # CDK/CDKTF need to run from project root (where cdk.json/cdktf.json is)
    # Other platforms need to run from lib directory
    case "$platform" in
        "cdk"|"cdktf")
            cd "$PROJECT_ROOT"
            ;;
        *)
            cd "$PROJECT_ROOT/lib"
            ;;
    esac

    case "$platform" in
        "cdk")
            deploy_cdk "$language"
            ;;
        "cfn"|"cloudformation")
            deploy_cloudformation "$language"
            ;;
        "tf"|"terraform")
            deploy_terraform
            ;;
        "cdktf")
            deploy_cdktf "$language"
            ;;
        "pulumi")
            deploy_pulumi "$language"
            ;;
        *)
            print_status $RED "❌ Unsupported platform: $platform"
            exit 1
            ;;
    esac
}

# CDK deployment
deploy_cdk() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CDK ($language) to LocalStack..."

    # Verify cdk.json exists
    if [ ! -f "cdk.json" ]; then
        print_status $RED "❌ cdk.json not found in current directory: $(pwd)"
        exit 1
    fi

    # Install dependencies for TypeScript/JavaScript CDK projects
    if [ -f "package.json" ]; then
        print_status $YELLOW "📦 Installing npm dependencies..."
        npm install
    fi

    # For Java CDK projects, dependencies should already be installed via build step
    # Just verify the compiled classes exist
    if [[ "$language" == "java" ]]; then
        print_status $YELLOW "📦 Java CDK project detected"
        # The build step should have already compiled the Java code
        # CDK will use the compiled classes from target/ or build/ directory
    fi

    # Set additional environment variables for LocalStack CDK compatibility
    export CDK_DEFAULT_ACCOUNT=000000000000
    export CDK_DEFAULT_REGION=us-east-1

    # Use path-style S3 URLs for LocalStack compatibility
    export AWS_S3_USE_PATH_STYLE=1
    export AWS_S3_FORCE_PATH_STYLE=true

    # Additional S3 configuration for LocalStack
    export AWS_S3_ADDRESSING_STYLE=path

    # Get environment suffix from environment variable or default to 'dev'
    local env_suffix="${ENVIRONMENT_SUFFIX:-dev}"
    print_status $BLUE "📌 Using environment suffix: $env_suffix"

    # Context flag to disable the CDK's VPC default security group restriction Custom Resource,
    # which frequently fails deployment/deletion in LocalStack.
    local cdk_localstack_context="-c vpc-restrict-default-security-group=false"
    print_status $YELLOW "🔧 Applying LocalStack VPC context flag: $cdk_localstack_context"

    # Bootstrap CDK for LocalStack
    print_status $YELLOW "🔧 Bootstrapping CDK..."
    cdklocal bootstrap -c environmentSuffix="$env_suffix" || true

    # Deploy with LocalStack-specific flags
    print_status $YELLOW "🚀 Deploying stacks..."
    # Deploy to LocalStack with CloudFormation
    # Note: Asset uploads may have issues with LocalStack S3, but we proceed anyway
    cdklocal deploy --all --require-approval never \
        -c environmentSuffix="$env_suffix" \
        --no-rollback \
        --verbose || {
            print_status $YELLOW "⚠️  Initial deployment failed, retrying with force and no-rollback..."
            cdklocal deploy --all --require-approval never \
                -c environmentSuffix="$env_suffix" \
                --force \
                --no-rollback \
                --verbose
        }

    print_status $GREEN "✅ CDK deployment completed!"

    # Collect outputs 
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    # Generate cdk-stacks.json
    cdklocal list --json > "$PROJECT_ROOT/cdk-stacks.json" 2>/dev/null || echo "[]" > "$PROJECT_ROOT/cdk-stacks.json"
    
    # Get stack outputs using awslocal
    local stack_name="TapStack${env_suffix}"
    local output_json="{}"
    
    if awslocal cloudformation describe-stacks --stack-name "$stack_name" > /dev/null 2>&1; then
        output_json=$(awslocal cloudformation describe-stacks --stack-name "$stack_name" \
            --query 'Stacks[0].Outputs' \
            --output json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    outputs = {}
    for output in data:
        outputs[output['OutputKey']] = output['OutputValue']
    print(json.dumps(outputs, indent=2))
except:
    print('{}')
" || echo "{}")
    fi
    
    echo "$output_json" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    print_status $GREEN "✅ Outputs saved to cfn-outputs/flat-outputs.json"
}

# CloudFormation deployment
deploy_cloudformation() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CloudFormation ($language) to LocalStack..."

    # Find CloudFormation template
    local template=""
    if [ -f "template.yaml" ]; then
        template="template.yaml"
    elif [ -f "template.yml" ]; then
        template="template.yml"
    elif [ -f "template.json" ]; then
        template="template.json"
    else
        print_status $RED "❌ No CloudFormation template found (template.yaml/yml/json)"
        exit 1
    fi

    print_status $YELLOW "📄 Using template: $template"

    # Deploy using AWS CLI with LocalStack endpoint
    local stack_name="localstack-stack-${ENVIRONMENT_SUFFIX:-dev}"
    print_status $YELLOW "🚀 Deploying stack: $stack_name..."

    aws cloudformation deploy \
        --template-file "$template" \
        --stack-name "$stack_name" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --endpoint-url "$AWS_ENDPOINT_URL" \
        --region "$AWS_DEFAULT_REGION"

    print_status $GREEN "✅ CloudFormation deployment completed!"

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    local stack_name="localstack-stack-${ENVIRONMENT_SUFFIX:-dev}"
    local output_json="{}"
    
    if awslocal cloudformation describe-stacks --stack-name "$stack_name" > /dev/null 2>&1; then
        output_json=$(awslocal cloudformation describe-stacks --stack-name "$stack_name" \
            --query 'Stacks[0].Outputs' \
            --output json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    outputs = {}
    for output in data:
        outputs[output['OutputKey']] = output['OutputValue']
    print(json.dumps(outputs, indent=2))
except:
    print('{}')
" || echo "{}")
    fi
    
    echo "$output_json" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    print_status $GREEN "✅ Outputs saved to cfn-outputs/flat-outputs.json"
}

# Terraform deployment
deploy_terraform() {
    print_status $MAGENTA "🚀 Deploying Terraform to LocalStack..."

    # Initialize Terraform
    print_status $YELLOW "🔧 Initializing Terraform..."
    tflocal init

    # Plan
    print_status $YELLOW "📋 Planning deployment..."
    tflocal plan -out=tfplan

    # Apply
    print_status $YELLOW "🚀 Applying changes..."
    tflocal apply -auto-approve tfplan

    print_status $GREEN "✅ Terraform deployment completed!"

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    local output_json="{}"
    if tflocal output -json > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json" 2>/dev/null; then
        # Flatten Terraform outputs (they come as {"key": {"value": "actual", "type": "string"}})
        output_json=$(python3 -c "
import sys, json
try:
    with open('$PROJECT_ROOT/cfn-outputs/flat-outputs.json', 'r') as f:
        data = json.load(f)
    flattened = {}
    for key, value in data.items():
        if isinstance(value, dict) and 'value' in value:
            flattened[key] = value['value']
        else:
            flattened[key] = value
    print(json.dumps(flattened, indent=2))
except:
    print('{}')
")
        echo "$output_json" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
        print_status $GREEN "✅ Outputs saved to cfn-outputs/flat-outputs.json"
    else
        echo "{}" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
        print_status $YELLOW "⚠️  No Terraform outputs found"
    fi
}

# CDKTF deployment
deploy_cdktf() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CDKTF ($language) to LocalStack..."

    # Install dependencies
    if [ -f "package.json" ]; then
        print_status $YELLOW "📦 Installing npm dependencies..."
        npm install
    fi

    # Synthesize
    print_status $YELLOW "🔧 Synthesizing CDKTF..."
    cdktf synth

    # Deploy
    print_status $YELLOW "🚀 Deploying to LocalStack..."
    cdktf deploy --auto-approve

    print_status $GREEN "✅ CDKTF deployment completed!"

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    if npx --yes cdktf output --outputs-file "$PROJECT_ROOT/cfn-outputs/flat-outputs.json" 2>/dev/null; then
        print_status $GREEN "✅ Outputs saved to cfn-outputs/flat-outputs.json"
    else
        echo "{}" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
        print_status $YELLOW "⚠️  No CDKTF outputs found"
    fi
}

# Pulumi deployment
deploy_pulumi() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying Pulumi ($language) to LocalStack..."

    # Install dependencies based on language
    case "$language" in
        "ts"|"js")
            if [ -f "package.json" ]; then
                print_status $YELLOW "📦 Installing npm dependencies..."
                npm install
            fi
            ;;
        "py"|"python")
            if [ -f "requirements.txt" ]; then
                print_status $YELLOW "📦 Installing Python dependencies..."
                pip install -r requirements.txt
            fi
            ;;
        "go")
            if [ -f "go.mod" ]; then
                print_status $YELLOW "📦 Installing Go dependencies..."
                go mod download
            fi
            ;;
    esac

    # Set Pulumi passphrase
    export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-localstack}

    # Login to local backend
    print_status $YELLOW "🔐 Setting up Pulumi backend..."
    pulumi login --local

    # Select or create stack
    local stack_name=${PULUMI_STACK_NAME:-localstack}
    print_status $YELLOW "📚 Selecting stack: $stack_name..."
    pulumi stack select $stack_name 2>/dev/null || pulumi stack init $stack_name

    # Configure AWS for LocalStack
    print_status $YELLOW "🔧 Configuring Pulumi for LocalStack..."
    pulumi config set aws:region $AWS_DEFAULT_REGION
    pulumi config set aws:accessKey $AWS_ACCESS_KEY_ID
    pulumi config set aws:secretKey $AWS_SECRET_ACCESS_KEY
    pulumi config set aws:skipCredentialsValidation true
    pulumi config set aws:skipMetadataApiCheck true
    pulumi config set aws:s3UsePathStyle true
    pulumi config set aws:endpoints '[{"s3":"'$AWS_ENDPOINT_URL'","dynamodb":"'$AWS_ENDPOINT_URL'","lambda":"'$AWS_ENDPOINT_URL'","apigateway":"'$AWS_ENDPOINT_URL'","iam":"'$AWS_ENDPOINT_URL'","sts":"'$AWS_ENDPOINT_URL'","cloudformation":"'$AWS_ENDPOINT_URL'"}]'

    # Deploy
    print_status $YELLOW "🚀 Deploying to LocalStack..."
    pulumi up --yes --skip-preview

    print_status $GREEN "✅ Pulumi deployment completed!"

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    local output_json="{}"
    if pulumi stack output --json > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json" 2>/dev/null; then
        print_status $GREEN "✅ Outputs saved to cfn-outputs/flat-outputs.json"
    else
        echo "{}" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
        print_status $YELLOW "⚠️  No Pulumi outputs found"
    fi
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

    # Deploy
    deploy_platform "$platform" "$language"

    echo ""
    print_status $GREEN "🎉 LocalStack deployment completed successfully!"
}

# Execute main
main "$@"
