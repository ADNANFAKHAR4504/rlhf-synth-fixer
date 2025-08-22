#!/bin/bash
# Resource cleanup and state management script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Terraform Resource Management Script${NC}"

# Function to check if resource exists in state
check_resource_in_state() {
    local resource=$1
    terraform state show "$resource" >/dev/null 2>&1
}

# Function to import existing resources
import_existing_resources() {
    echo -e "${YELLOW}📥 Checking for existing resources to import...${NC}"
    
    # Check for existing IAM role
    if aws iam get-role --role-name "secure-web-app-dev-ec2-role" >/dev/null 2>&1; then
        echo -e "${YELLOW}Found existing IAM role, attempting import...${NC}"
        terraform import aws_iam_role.ec2_role "secure-web-app-dev-ec2-role" || true
    fi
    
    # Check for existing CloudWatch log groups
    if aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/secure-web-app-dev" >/dev/null 2>&1; then
        echo -e "${YELLOW}Found existing CloudWatch log group, attempting import...${NC}"
        terraform import aws_cloudwatch_log_group.app_logs "/aws/ec2/secure-web-app-dev" || true
    fi
    
    if aws logs describe-log-groups --log-group-name-prefix "/aws/vpc/secure-web-app-dev" >/dev/null 2>&1; then
        echo -e "${YELLOW}Found existing VPC flow logs, attempting import...${NC}"
        terraform import aws_cloudwatch_log_group.vpc_flow_logs "/aws/vpc/secure-web-app-dev/flowlogs" || true
    fi
}

# Function to clean up orphaned resources
cleanup_orphaned_resources() {
    echo -e "${YELLOW}🧹 Cleaning up orphaned resources...${NC}"
    
    # List and optionally delete orphaned EIPs
    echo "Checking for orphaned Elastic IPs..."
    aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --query 'Addresses[?AssociationId==null].[AllocationId,PublicIp]' --output table
    
    # List orphaned security groups
    echo "Checking for orphaned security groups..."
    aws ec2 describe-security-groups --query 'SecurityGroups[?starts_with(GroupName, `secure-web-app-dev`)].[GroupId,GroupName]' --output table
}

# Function to set up EIP workaround
setup_eip_workaround() {
    echo -e "${YELLOW}⚡ Setting up EIP optimization...${NC}"
    
    # Count current EIPs
    local eip_count=$(aws ec2 describe-addresses --query 'Addresses[?Domain==`vpc`]' --output json | jq length)
    local eip_limit=$(aws service-quotas get-service-quota --service-code ec2 --quota-code L-0263D0A3 --query 'Quota.Value' --output text 2>/dev/null || echo "5")
    
    echo "Current EIP count: $eip_count"
    echo "EIP limit: $eip_limit"
    
    if [ "$eip_count" -ge "$((eip_limit - 2))" ]; then
        echo -e "${RED}⚠️  Near EIP limit. Enabling single NAT mode...${NC}"
        # Update terraform.tfvars to use single NAT
        sed -i.bak 's/use_single_nat = false/use_single_nat = true/' terraform.tfvars
        echo -e "${GREEN}✅ Enabled single NAT mode to reduce EIP usage${NC}"
    fi
}

# Function to validate deployment
validate_deployment() {
    echo -e "${GREEN}✅ Validating deployment...${NC}"
    
    # Check terraform plan
    if terraform plan -detailed-exitcode; then
        echo -e "${GREEN}✅ Terraform plan validation passed${NC}"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 2 ]; then
            echo -e "${YELLOW}⚠️  Terraform plan shows changes needed${NC}"
            return 2
        else
            echo -e "${RED}❌ Terraform plan validation failed${NC}"
            return 1
        fi
    fi
}

# Main execution
main() {
    case "${1:-help}" in
        "import")
            import_existing_resources
            ;;
        "cleanup")
            cleanup_orphaned_resources
            ;;
        "eip-optimize")
            setup_eip_workaround
            ;;
        "validate")
            validate_deployment
            ;;
        "full-prep")
            setup_eip_workaround
            import_existing_resources
            validate_deployment
            ;;
        "help"|*)
            echo "Usage: $0 {import|cleanup|eip-optimize|validate|full-prep}"
            echo ""
            echo "Commands:"
            echo "  import       - Import existing AWS resources into Terraform state"
            echo "  cleanup      - List orphaned resources for manual cleanup"
            echo "  eip-optimize - Check EIP usage and optimize if needed"
            echo "  validate     - Validate Terraform configuration"
            echo "  full-prep    - Run all preparation steps"
            echo ""
            ;;
    esac
}

main "$@"
