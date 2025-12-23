#!/bin/bash

# LocalStack CI Deploy Script
# Deploys infrastructure to LocalStack in CI/CD environments
# Supports: CDK, CloudFormation, Terraform, CDKTF, Pulumi
#
# Platform/Language Support:
# - CDK/CDKTF: go, java, js, py, python, ts
# - Pulumi: go, java, js, py, ts
# - CloudFormation: yaml, json
# - Terraform: hcl

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

# Function to set LocalStack environment variables
setup_localstack_env() {
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
}

# Function to install dependencies based on language
install_dependencies() {
    local language=$1
    
    case "$language" in
        "ts"|"js")
            if [ -f "$PROJECT_ROOT/package.json" ]; then
                print_status $YELLOW "📦 Installing npm dependencies..."
                cd "$PROJECT_ROOT"
                npm install
            fi
            ;;
        "py"|"python")
            if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
                print_status $YELLOW "📦 Installing Python dependencies..."
                pip install -r "$PROJECT_ROOT/requirements.txt"
            fi
            export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"
            print_status $BLUE "   PYTHONPATH: $PYTHONPATH"
            ;;
        "go")
            if [ -f "$PROJECT_ROOT/go.mod" ]; then
                print_status $YELLOW "📦 Installing Go dependencies..."
                cd "$PROJECT_ROOT"
                go mod download
            fi
            ;;
        "java")
            print_status $YELLOW "📦 Java project - dependencies managed by build tool"
            # Java dependencies are handled by Maven/Gradle during build
            ;;
    esac
}

# Function to save deployment outputs
# Fails if no outputs are saved (output_count = 0)
save_outputs() {
    local output_json=$1

    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    mkdir -p "$PROJECT_ROOT/cdk-outputs"
    echo "$output_json" > "$PROJECT_ROOT/cfn-outputs/flat-outputs.json"
    echo "$output_json" > "$PROJECT_ROOT/cdk-outputs/flat-outputs.json"

    local output_count=$(echo "$output_json" | jq 'keys | length' 2>/dev/null || echo "0")

    if [ "$output_count" -eq 0 ]; then
        print_status $RED "❌ No deployment outputs found!"
        print_status $RED "❌ Deployment must produce at least one output"
        exit 1
    fi

    print_status $GREEN "✅ Saved $output_count outputs to cdk-outputs/flat-outputs.json"
}

# Function to describe CDK/CloudFormation deployment failure
describe_cfn_failure() {
    local stack_name=$1
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $RED "📋 DEPLOYMENT FAILURE DETAILS"
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Get failed events
    print_status $YELLOW "🔍 Failed Resources:"
    awslocal cloudformation describe-stack-events --stack-name "$stack_name" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`DELETE_FAILED`].[Timestamp,LogicalResourceId,ResourceType,ResourceStatus,ResourceStatusReason]' \
        --output table 2>/dev/null || echo "   No failed events found"
    echo ""
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to describe Terraform deployment failure
describe_terraform_failure() {
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $RED "📋 DEPLOYMENT FAILURE DETAILS"
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Show resources that were successfully created
    print_status $YELLOW "🔍 Resources Successfully Created:"
    local state_list
    state_list=$(tflocal state list 2>/dev/null)
    if [ -n "$state_list" ]; then
        echo "$state_list" | sed 's/^/   ✅ /'
    else
        print_status $BLUE "   No resources in state (deployment failed before creating any resources)"
    fi
    echo ""
    
    # Show plan file if it exists (shows what was attempted)
    if [ -f "tfplan" ]; then
        print_status $YELLOW "🔍 Planned Changes (from tfplan):"
        tflocal show tfplan -no-color 2>/dev/null | grep -E "(will be created|will be destroyed|must be replaced|Error)" | head -20 | sed 's/^/   /' || echo "   Unable to read plan file"
        echo ""
    fi
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to describe Pulumi deployment failure
describe_pulumi_failure() {
    local stack_name=$1
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $RED "📋 DEPLOYMENT FAILURE DETAILS"
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Show resources that failed to create (no ID means creation failed)
    print_status $YELLOW "🔍 Resources That Failed to Create:"
    local failed_resources
    failed_resources=$(pulumi stack export 2>/dev/null | jq -r '.deployment.resources[] | select(.custom == true) | select(.type | startswith("pulumi:providers") | not) | select(.id == null or .id == "") | "   Type: \(.type)\n   URN: \(.urn)\n"' 2>/dev/null)
    
    if [ -n "$failed_resources" ]; then
        echo "$failed_resources"
    else
        print_status $BLUE "   No resources found in failed state (check error output above)"
    fi
    echo ""
    
    # Show stack summary
    print_status $YELLOW "🔍 Stack Summary:"
    pulumi stack --show-urns 2>/dev/null | head -20 || echo "   Unable to show stack summary"
    echo ""
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to describe CDKTF deployment failure  
describe_cdktf_failure() {
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $RED "📋 DEPLOYMENT FAILURE DETAILS"
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Check if synthesis succeeded
    if [ ! -d "cdktf.out/stacks" ]; then
        print_status $YELLOW "🔍 Synthesis Status:"
        print_status $RED "   ❌ Synthesis failed - cdktf.out/stacks directory not found"
        echo ""
        print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return
    fi
    
    # Show synthesized stacks
    print_status $YELLOW "🔍 Synthesized Stacks:"
    local stack_count=0
    for stack_dir in cdktf.out/stacks/*/; do
        if [ -d "$stack_dir" ]; then
            stack_count=$((stack_count + 1))
            print_status $BLUE "   Stack $stack_count: $(basename $stack_dir)"
        fi
    done
    if [ $stack_count -eq 0 ]; then
        echo "   No stacks found"
    fi
    echo ""
    
    # Show terraform state and errors for each stack
    print_status $YELLOW "🔍 Stack Deployment Status:"
    for stack_dir in cdktf.out/stacks/*/; do
        if [ -d "$stack_dir" ]; then
            local stack_name=$(basename "$stack_dir")
            print_status $BLUE "   ── Stack: $stack_name ──"
            
            cd "$stack_dir" 2>/dev/null || continue
            
            # Check if terraform was initialized
            if [ -f ".terraform/terraform.tfstate" ] || [ -f "terraform.tfstate" ]; then
                # Show resources in state
                print_status $CYAN "   Resources in state:"
                terraform state list 2>/dev/null | sed 's/^/      /' || echo "      No resources in state"
                
                # Check for failed resources (those with errors)
                print_status $CYAN "   Failed resources:"
                terraform state list 2>/dev/null | while read resource; do
                    terraform state show "$resource" 2>/dev/null | grep -q "Error:" && echo "      ❌ $resource" || true
                done || echo "      (Unable to check for errors)"
            else
                print_status $YELLOW "      ⚠️  Terraform not initialized or no state found"
            fi
            
            cd - > /dev/null 2>&1
            echo ""
        fi
    done
    
    print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to deploy based on platform
deploy_platform() {
    local platform=$1
    local language=$2

    print_status $BLUE "📦 Platform: $platform"
    print_status $BLUE "📝 Language: $language"
    echo ""

    # Setup LocalStack environment
    setup_localstack_env

    # Install dependencies
    install_dependencies "$language"

    case "$platform" in
        "cdk")
            deploy_cdk "$language"
            ;;
        "cdktf")
            deploy_cdktf "$language"
            ;;
        "cfn"|"cloudformation")
            deploy_cloudformation "$language"
            ;;
        "tf"|"terraform")
            deploy_terraform "$language"
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
# Languages: go, java, js, py, python, ts
deploy_cdk() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CDK ($language) to LocalStack..."
    echo ""

    cd "$PROJECT_ROOT"

    # Verify cdk.json exists
    if [ ! -f "cdk.json" ]; then
        print_status $RED "❌ cdk.json not found in project root"
        exit 1
    fi

    # Set CDK environment variables
    export CDK_DEFAULT_ACCOUNT=000000000000
    export CDK_DEFAULT_REGION=us-east-1
    export AWS_S3_USE_PATH_STYLE=1
    export AWS_S3_FORCE_PATH_STYLE=true
    export AWS_S3_ADDRESSING_STYLE=path

    local env_suffix="${ENVIRONMENT_SUFFIX:-dev}"
    print_status $BLUE "📌 Environment suffix: $env_suffix"

    # Bootstrap CDK for LocalStack
    print_status $YELLOW "🔧 Bootstrapping CDK..."
    cdklocal bootstrap -c environmentSuffix="$env_suffix" || true

    # Deploy based on language
    print_status $YELLOW "🚀 Deploying stacks..."
    
    case "$language" in
        "ts"|"js")
            cdklocal deploy --all --require-approval never \
                -c environmentSuffix="$env_suffix" \
                --no-rollback \
                --verbose 2>&1
            local exit_code=$?
            ;;
        "py"|"python")
            cdklocal deploy --all --require-approval never \
                -c environmentSuffix="$env_suffix" \
                --no-rollback \
                --verbose 2>&1
            local exit_code=$?
            ;;
        "go")
            cdklocal deploy --all --require-approval never \
                -c environmentSuffix="$env_suffix" \
                --no-rollback \
                --verbose 2>&1
            local exit_code=$?
            ;;
        "java")
            cdklocal deploy --all --require-approval never \
                -c environmentSuffix="$env_suffix" \
                --no-rollback \
                --verbose 2>&1
            local exit_code=$?
            ;;
        *)
            print_status $RED "❌ Unsupported language for CDK: $language"
            exit 1
            ;;
    esac

    if [ $exit_code -ne 0 ]; then
        print_status $YELLOW "⚠️  Initial deployment failed, retrying..."
        cdklocal deploy --all --require-approval never \
            -c environmentSuffix="$env_suffix" \
            --force \
            --no-rollback \
            --verbose 2>&1
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
            print_status $RED "❌ CDK deployment failed with exit code: $exit_code"
            echo ""
            describe_cfn_failure "TapStack${env_suffix}"
            exit $exit_code
        fi
    fi

    print_status $GREEN "✅ CDK deployment completed!"
    echo ""

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    local stack_name="TapStack-${env_suffix}"
    local output_json="{}"

    # Get all stacks (parent and nested)
    local all_stacks=$(awslocal cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query 'StackSummaries[].StackName' \
        --output json 2>/dev/null | jq -r '.[]' 2>/dev/null | grep -i "TapStack${env_suffix}" || echo "$stack_name")

    # Collect outputs from all matching stacks
    output_json=$(python3 -c "
import sys, json, subprocess

all_outputs = {}
stacks = '''$all_stacks'''.strip().split('\n')

for stack in stacks:
    if not stack:
        continue
    try:
        result = subprocess.run(
            ['awslocal', 'cloudformation', 'describe-stacks', '--stack-name', stack],
            capture_output=True, text=True, check=False
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if data and 'Stacks' in data and len(data['Stacks']) > 0:
                outputs = data['Stacks'][0].get('Outputs', [])
                for output in outputs:
                    all_outputs[output['OutputKey']] = output['OutputValue']
    except Exception as e:
        continue

print(json.dumps(all_outputs, indent=2))
" 2>/dev/null || echo "{}")

    save_outputs "$output_json"
}

# CDKTF deployment
# Languages: go, java, js, py, python, ts
deploy_cdktf() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CDKTF ($language) to LocalStack..."
    echo ""

    cd "$PROJECT_ROOT"

    # Verify cdktf.json exists
    if [ ! -f "cdktf.json" ]; then
        print_status $RED "❌ cdktf.json not found in project root"
        exit 1
    fi

    # Synthesize and deploy based on language
    print_status $YELLOW "🔧 Synthesizing CDKTF..."
    
    case "$language" in
        "ts"|"js")
            cdktf synth 2>&1
            ;;
        "py"|"python")
            cdktf synth 2>&1
            ;;
        "go")
            cdktf synth 2>&1
            ;;
        "java")
            cdktf synth 2>&1
            ;;
        *)
            print_status $RED "❌ Unsupported language for CDKTF: $language"
            exit 1
            ;;
    esac

    print_status $YELLOW "🚀 Deploying to LocalStack..."
    cdktf deploy --auto-approve 2>&1
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        print_status $RED "❌ CDKTF deployment failed with exit code: $exit_code"
        echo ""
        describe_cdktf_failure
        exit $exit_code
    fi

    print_status $GREEN "✅ CDKTF deployment completed!"
    echo ""

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    local output_json="{}"
    
    if npx --yes cdktf output --outputs-file "$PROJECT_ROOT/cfn-outputs/flat-outputs.json" 2>/dev/null; then
        output_json=$(cat "$PROJECT_ROOT/cfn-outputs/flat-outputs.json" 2>/dev/null || echo "{}")
    fi
    
    save_outputs "$output_json"
}

# Function to monitor CloudFormation stack events in real-time
monitor_cfn_stack() {
    local stack_name=$1
    local seen_events=""
    local max_wait=600  # 10 minutes max
    local wait_time=0
    local poll_interval=3
    
    print_status $CYAN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $CYAN "📋 Live Stack Events:"
    print_status $CYAN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    while [ $wait_time -lt $max_wait ]; do
        # Get stack status
        local stack_status=$(awslocal cloudformation describe-stacks --stack-name "$stack_name" \
            --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")
        
        # Get recent events
        local events=$(awslocal cloudformation describe-stack-events --stack-name "$stack_name" \
            --query 'StackEvents[*].[Timestamp,LogicalResourceId,ResourceType,ResourceStatus,ResourceStatusReason]' \
            --output text 2>/dev/null | head -20)
        
        # Print new events
        while IFS=$'\t' read -r timestamp resource_id resource_type status reason; do
            local event_key="${timestamp}_${resource_id}_${status}"
            if [[ ! "$seen_events" == *"$event_key"* ]] && [ -n "$timestamp" ]; then
                seen_events="$seen_events|$event_key"
                
                # Color based on status
                local status_icon="⏳"
                local status_color=$YELLOW
                case "$status" in
                    *COMPLETE)
                        status_icon="✅"
                        status_color=$GREEN
                        ;;
                    *FAILED)
                        status_icon="❌"
                        status_color=$RED
                        ;;
                    *IN_PROGRESS)
                        status_icon="🔄"
                        status_color=$YELLOW
                        ;;
                    *ROLLBACK*)
                        status_icon="⚠️"
                        status_color=$RED
                        ;;
                esac
                
                # Print event
                echo -e "${status_color}   ${status_icon} ${resource_id}${NC}"
                echo -e "${BLUE}      Type: ${resource_type}${NC}"
                echo -e "${status_color}      Status: ${status}${NC}"
                if [ -n "$reason" ] && [ "$reason" != "None" ] && [ "$reason" != "null" ]; then
                    echo -e "${CYAN}      Reason: ${reason}${NC}"
                fi
                echo ""
            fi
        done <<< "$events"
        
        # Check if stack is done
        case "$stack_status" in
            "CREATE_COMPLETE"|"UPDATE_COMPLETE")
                print_status $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                print_status $GREEN "✅ Stack $stack_name: $stack_status"
                return 0
                ;;
            "CREATE_FAILED"|"ROLLBACK_COMPLETE"|"ROLLBACK_FAILED"|"DELETE_COMPLETE"|"UPDATE_ROLLBACK_COMPLETE")
                print_status $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                print_status $RED "❌ Stack $stack_name: $stack_status"
                return 1
                ;;
        esac
        
        sleep $poll_interval
        wait_time=$((wait_time + poll_interval))
    done
    
    print_status $RED "❌ Timeout waiting for stack to complete"
    return 1
}

# CloudFormation deployment
# Languages: yaml, json
deploy_cloudformation() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying CloudFormation ($language) to LocalStack..."
    echo ""

    cd "$PROJECT_ROOT/lib"

    # Find CloudFormation template based on language
    local template=""
    
    if [ "$language" == "yaml" ]; then
        # Look for YAML templates
        for name in "template.yaml" "template.yml" "TapStack.yaml" "TapStack.yml" "main.yaml" "main.yml" "stack.yaml" "stack.yml"; do
            if [ -f "$name" ]; then
                template="$name"
                break
            fi
        done
        if [ -z "$template" ]; then
            template=$(find . -maxdepth 1 \( -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | head -1)
        fi
    elif [ "$language" == "json" ]; then
        # Look for JSON templates
        for name in "template.json" "TapStack.json" "main.json" "stack.json"; do
            if [ -f "$name" ]; then
                template="$name"
                break
            fi
        done
        if [ -z "$template" ]; then
            template=$(find . -maxdepth 1 -name "*.json" 2>/dev/null | head -1)
        fi
    else
        # Try both
        for name in "template.yaml" "template.yml" "template.json" "TapStack.yaml" "TapStack.yml" "TapStack.json" "main.yaml" "main.yml" "main.json" "stack.yaml" "stack.yml" "stack.json"; do
            if [ -f "$name" ]; then
                template="$name"
                break
            fi
        done
    fi

    if [ -z "$template" ]; then
        print_status $RED "❌ No CloudFormation template found"
        exit 1
    fi

    print_status $BLUE "📄 Using template: $template"

    # Deploy using AWS CLI with LocalStack endpoint
    local stack_name="localstack-stack-${ENVIRONMENT_SUFFIX:-dev}"
    local cfn_bucket="cfn-templates-localstack-${ENVIRONMENT_SUFFIX:-dev}"
    local template_size=$(stat -f%z "$template" 2>/dev/null || stat -c%s "$template" 2>/dev/null || echo 0)
    local max_inline_size=51200  # 51KB CloudFormation limit
    local use_s3=false
    local template_url=""
    
    print_status $BLUE "📏 Template size: $template_size bytes (limit: $max_inline_size)"
    
    # Use S3 for large templates
    if [ "$template_size" -gt "$max_inline_size" ]; then
        use_s3=true
        print_status $YELLOW "📦 Template exceeds 51KB limit, using S3..."
        
        # Create S3 bucket (ignore error if exists)
        awslocal s3 mb "s3://${cfn_bucket}" 2>/dev/null || true
        
        # Upload template to S3
        print_status $YELLOW "📤 Uploading template to S3..."
        awslocal s3 cp "$template" "s3://${cfn_bucket}/template.yml"
        
        template_url="${AWS_ENDPOINT_URL}/${cfn_bucket}/template.yml"
        print_status $BLUE "📄 Template URL: $template_url"
    fi
    
    print_status $YELLOW "🚀 Deploying stack: $stack_name..."
    echo ""

    # Check if stack exists and handle existing/failed stacks
    local stack_exists=false
    local current_status=""
    if awslocal cloudformation describe-stacks --stack-name "$stack_name" > /dev/null 2>&1; then
        stack_exists=true
        current_status=$(awslocal cloudformation describe-stacks --stack-name "$stack_name" \
            --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")
        
        # Handle stacks in failed/rollback state - delete first
        case "$current_status" in
            ROLLBACK_COMPLETE|CREATE_FAILED|DELETE_FAILED|UPDATE_ROLLBACK_COMPLETE)
                print_status $YELLOW "⚠️ Stack in $current_status state, deleting before recreating..."
                awslocal cloudformation delete-stack --stack-name "$stack_name" 2>/dev/null || true
                
                # Wait for deletion
                local delete_wait=0
                while [ $delete_wait -lt 120 ]; do
                    if ! awslocal cloudformation describe-stacks --stack-name "$stack_name" > /dev/null 2>&1; then
                        break
                    fi
                    sleep 5
                    delete_wait=$((delete_wait + 5))
                done
                stack_exists=false
                ;;
            *)
                print_status $YELLOW "📝 Stack exists, deleting before recreating..."
                awslocal cloudformation delete-stack --stack-name "$stack_name" 2>/dev/null || true
                sleep 2
                stack_exists=false
                ;;
        esac
    fi

    # Deploy based on template size
    local deploy_exit=0
    if [ "$use_s3" = true ]; then
        # Use create-stack with --template-url for large templates
        print_status $YELLOW "📝 Creating stack with S3 template..."
        awslocal cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-url "$template_url" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
            --on-failure DO_NOTHING 2>&1 || deploy_exit=$?
    else
        # Use create-stack with --template-body for small templates
        print_status $YELLOW "📦 Creating stack resources..."
        awslocal cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
            --on-failure DO_NOTHING 2>&1 || deploy_exit=$?
    fi
    
    if [ $deploy_exit -ne 0 ]; then
        print_status $RED "❌ CloudFormation create-stack command failed with exit code: $deploy_exit"
        echo ""
        describe_cfn_failure "$stack_name"
        
        # Cleanup S3 bucket on failure
        if [ "$use_s3" = true ]; then
            print_status $YELLOW "🧹 Cleaning up S3 bucket..."
            awslocal s3 rm "s3://${cfn_bucket}" --recursive 2>/dev/null || true
            awslocal s3 rb "s3://${cfn_bucket}" 2>/dev/null || true
        fi
        exit $deploy_exit
    fi

    # Monitor stack creation with live events
    if ! monitor_cfn_stack "$stack_name"; then
        print_status $RED "❌ CloudFormation deployment failed"
        echo ""
        describe_cfn_failure "$stack_name"
        
        # Cleanup S3 bucket on failure
        if [ "$use_s3" = true ]; then
            print_status $YELLOW "🧹 Cleaning up S3 bucket..."
            awslocal s3 rm "s3://${cfn_bucket}" --recursive 2>/dev/null || true
            awslocal s3 rb "s3://${cfn_bucket}" 2>/dev/null || true
        fi
        exit 1
    fi

    print_status $GREEN "✅ CloudFormation deployment completed!"
    echo ""

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    local output_json="{}"

    # First check if stack exists
    if awslocal cloudformation describe-stacks --stack-name "$stack_name" > /dev/null 2>&1; then
        print_status $BLUE "   Stack found: $stack_name"

        # Get full stack description and extract outputs with better error handling
        local stack_desc=$(awslocal cloudformation describe-stacks --stack-name "$stack_name" --output json 2>/dev/null)

        if [ -n "$stack_desc" ]; then
            print_status $BLUE "   Stack description retrieved, parsing outputs..."

            output_json=$(echo "$stack_desc" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    outputs = {}
    if data and 'Stacks' in data and len(data['Stacks']) > 0:
        stack = data['Stacks'][0]
        if 'Outputs' in stack and stack['Outputs']:
            for output in stack['Outputs']:
                if 'OutputKey' in output and 'OutputValue' in output:
                    outputs[output['OutputKey']] = output['OutputValue']
        else:
            print('DEBUG: No Outputs field in stack or Outputs is empty', file=sys.stderr)
    else:
        print('DEBUG: No Stacks in response', file=sys.stderr)
    print(json.dumps(outputs, indent=2))
except Exception as e:
    print(f'DEBUG: Exception parsing outputs: {e}', file=sys.stderr)
    print('{}')
" 2>&1)

            print_status $BLUE "   Parsed output_json length: $(echo "$output_json" | wc -c)"
        else
            print_status $YELLOW "   ⚠️ Stack description is empty"
        fi
    else
        print_status $RED "   ❌ Stack not found: $stack_name"
    fi

    save_outputs "$output_json"
}

# Terraform deployment
# Languages: hcl
deploy_terraform() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying Terraform ($language) to LocalStack..."
    echo ""

    cd "$PROJECT_ROOT/lib"

    # Verify terraform files exist
    if ! ls *.tf > /dev/null 2>&1; then
        print_status $RED "❌ No Terraform files (*.tf) found in lib/"
        exit 1
    fi

    # Initialize Terraform
    print_status $YELLOW "🔧 Initializing Terraform..."
    
    # Check if backend is configured - if S3 backend, create bucket first and configure for LocalStack
    if grep -q 'backend "s3"' *.tf 2>/dev/null; then
        local state_bucket="terraform-state-${ENVIRONMENT_SUFFIX:-dev}"
        print_status $YELLOW "   📦 Detected S3 backend, configuring for LocalStack..."
        
        # Create the bucket FIRST before init
        print_status $BLUE "   Creating S3 state bucket: $state_bucket"
        awslocal s3 mb "s3://$state_bucket" 2>/dev/null || {
            # Bucket might already exist, check if it's accessible
            if ! awslocal s3 ls "s3://$state_bucket" > /dev/null 2>&1; then
                print_status $YELLOW "   ⚠️  Bucket may already exist, continuing..."
            fi
        }
        
        # Wait a moment for bucket to be fully available
        sleep 2
        
        # Initialize with LocalStack S3 backend configuration
        tflocal init -input=false -reconfigure \
            -backend-config="bucket=$state_bucket" \
            -backend-config="key=terraform.tfstate" \
            -backend-config="region=${AWS_DEFAULT_REGION}" \
            -backend-config="endpoint=${AWS_ENDPOINT_URL}" \
            -backend-config="skip_credentials_validation=true" \
            -backend-config="skip_metadata_api_check=true" \
            -backend-config="force_path_style=true" 2>&1 || {
            print_status $YELLOW "   ⚠️  Initial init failed, retrying..."
            sleep 2
            tflocal init -input=false -reconfigure \
                -backend-config="bucket=$state_bucket" \
                -backend-config="key=terraform.tfstate" \
                -backend-config="region=${AWS_DEFAULT_REGION}" \
                -backend-config="endpoint=${AWS_ENDPOINT_URL}" \
                -backend-config="skip_credentials_validation=true" \
                -backend-config="skip_metadata_api_check=true" \
                -backend-config="force_path_style=true" 2>&1
        }
    else
        tflocal init -input=false -reconfigure 2>&1
    fi

    # Plan (disable interactive prompts)
    print_status $YELLOW "📋 Planning deployment..."
    tflocal plan -input=false -out=tfplan 2>&1

    # Apply (disable interactive prompts)
    print_status $YELLOW "🚀 Applying changes..."
    tflocal apply -input=false -auto-approve tfplan 2>&1
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        print_status $RED "❌ Terraform deployment failed with exit code: $exit_code"
        echo ""
        describe_terraform_failure
        exit $exit_code
    fi

    print_status $GREEN "✅ Terraform deployment completed!"
    echo ""

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    mkdir -p "$PROJECT_ROOT/cfn-outputs"
    
    local output_json="{}"
    if tflocal output -json > /tmp/tf-outputs.json 2>/dev/null; then
        # Flatten Terraform outputs (they come as {"key": {"value": "actual", "type": "string"}})
        output_json=$(python3 -c "
import sys, json
try:
    with open('/tmp/tf-outputs.json', 'r') as f:
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
    fi
    
    save_outputs "$output_json"
}

# Pulumi deployment
# Languages: go, java, js, py, ts
deploy_pulumi() {
    local language=$1
    print_status $MAGENTA "🚀 Deploying Pulumi ($language) to LocalStack..."
    echo ""

    cd "$PROJECT_ROOT"

    # Verify Pulumi project exists
    if [ ! -f "Pulumi.yaml" ]; then
        print_status $RED "❌ Pulumi.yaml not found in project root"
        exit 1
    fi

    # Set Pulumi passphrase
    export PULUMI_CONFIG_PASSPHRASE=${PULUMI_CONFIG_PASSPHRASE:-localstack}

    # Ensure local backend is used
    unset PULUMI_BACKEND_URL
    rm -rf ~/.pulumi/workspaces 2>/dev/null || true

    # Login to local backend
    print_status $YELLOW "🔐 Setting up Pulumi backend..."
    pulumi login --local

    # Select or create stack
    local stack_name=${PULUMI_STACK_NAME:-localstack}
    print_status $YELLOW "📚 Selecting stack: $stack_name..."
    
    if ! pulumi stack select $stack_name 2>/dev/null; then
        print_status $YELLOW "📝 Creating new stack: $stack_name..."
        pulumi stack init $stack_name
    fi

    # Configure AWS for LocalStack
    print_status $YELLOW "🔧 Configuring Pulumi for LocalStack..."
    pulumi config set aws:region $AWS_DEFAULT_REGION
    pulumi config set aws:accessKey $AWS_ACCESS_KEY_ID
    pulumi config set aws:secretKey $AWS_SECRET_ACCESS_KEY
    pulumi config set aws:skipCredentialsValidation true
    pulumi config set aws:skipMetadataApiCheck true
    pulumi config set aws:s3UsePathStyle true
    pulumi config set aws:endpoints '[{"s3":"'$AWS_ENDPOINT_URL'","dynamodb":"'$AWS_ENDPOINT_URL'","lambda":"'$AWS_ENDPOINT_URL'","apigateway":"'$AWS_ENDPOINT_URL'","iam":"'$AWS_ENDPOINT_URL'","sts":"'$AWS_ENDPOINT_URL'","cloudformation":"'$AWS_ENDPOINT_URL'","sqs":"'$AWS_ENDPOINT_URL'","sns":"'$AWS_ENDPOINT_URL'","cloudwatch":"'$AWS_ENDPOINT_URL'","cloudwatchevents":"'$AWS_ENDPOINT_URL'","cloudwatchlogs":"'$AWS_ENDPOINT_URL'"}]'

    # Deploy based on language
    print_status $YELLOW "🚀 Deploying to LocalStack..."
    
    case "$language" in
        "ts"|"js")
            pulumi up --yes --skip-preview 2>&1
            local exit_code=$?
            ;;
        "py"|"python")
            pulumi up --yes --skip-preview 2>&1
            local exit_code=$?
            ;;
        "go")
            pulumi up --yes --skip-preview 2>&1
            local exit_code=$?
            ;;
        "java")
            pulumi up --yes --skip-preview 2>&1
            local exit_code=$?
            ;;
        *)
            print_status $RED "❌ Unsupported language for Pulumi: $language"
            exit 1
            ;;
    esac

    if [ $exit_code -ne 0 ]; then
        print_status $RED "❌ Pulumi deployment failed with exit code: $exit_code"
        echo ""
        describe_pulumi_failure "$stack_name"
        exit $exit_code
    fi

    print_status $GREEN "✅ Pulumi deployment completed!"
    echo ""

    # Collect outputs
    print_status $YELLOW "📊 Collecting deployment outputs..."
    local output_json="{}"
    
    if pulumi stack output --json > /tmp/pulumi-outputs.json 2>/dev/null; then
        output_json=$(cat /tmp/pulumi-outputs.json)
    fi
    
    save_outputs "$output_json"
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
    if ! deploy_platform "$platform" "$language"; then
        echo ""
        print_status $RED "❌ LocalStack deployment failed!"
        exit 1
    fi

    echo ""
    print_status $GREEN "🎉 LocalStack deployment completed successfully!"
}

# Execute main
main "$@"
