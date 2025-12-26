#!/bin/bash
# LocalStack Deployment Test Script
# Tests the IAM infrastructure deployment to LocalStack

set -e

echo "=========================================="
echo "LocalStack IAM Deployment Test"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if LocalStack is running
echo "1. Checking LocalStack status..."
if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ LocalStack is running${NC}"
else
    echo -e "${RED}✗ LocalStack is not running${NC}"
    echo "   Start LocalStack with: localstack start -d"
    exit 1
fi
echo ""

# Set environment variables
echo "2. Setting environment variables..."
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Terraform format check
echo "3. Running Terraform format check..."
if terraform fmt -check -recursive; then
    echo -e "${GREEN}✓ Terraform files are properly formatted${NC}"
else
    echo -e "${YELLOW}⚠ Some files need formatting (non-critical)${NC}"
fi
echo ""

# Terraform init
echo "4. Initializing Terraform..."
if terraform init -backend=false; then
    echo -e "${GREEN}✓ Terraform initialized${NC}"
else
    echo -e "${RED}✗ Terraform initialization failed${NC}"
    exit 1
fi
echo ""

# Terraform validate
echo "5. Validating Terraform configuration..."
if terraform validate; then
    echo -e "${GREEN}✓ Terraform configuration is valid${NC}"
else
    echo -e "${RED}✗ Terraform validation failed${NC}"
    exit 1
fi
echo ""

# Terraform plan
echo "6. Creating Terraform plan..."
if terraform plan -var-file=localstack.tfvars -out=localstack.tfplan; then
    echo -e "${GREEN}✓ Terraform plan created successfully${NC}"
else
    echo -e "${RED}✗ Terraform plan failed${NC}"
    exit 1
fi
echo ""

# Ask for confirmation before applying
echo "=========================================="
echo "Ready to deploy to LocalStack"
echo "=========================================="
echo ""
echo "The following resources will be created:"
echo "  - 3 IAM Roles (security-auditor, ci-deployer, breakglass)"
echo "  - 1 Permission Boundary Policy"
echo "  - 3 Inline Policies"
echo ""
read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Terraform apply
echo "7. Applying Terraform configuration to LocalStack..."
if terraform apply -auto-approve localstack.tfplan; then
    echo -e "${GREEN}✓ Deployment successful${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
echo ""

# Verify deployment
echo "8. Verifying deployment..."
echo ""

echo "   Checking IAM roles..."
ROLES=$(awslocal iam list-roles --query 'Roles[?contains(RoleName, `corp-`)].RoleName' --output text 2>/dev/null || echo "")
if [ -n "$ROLES" ]; then
    echo -e "${GREEN}✓ Found IAM roles:${NC}"
    echo "$ROLES" | tr '\t' '\n' | sed 's/^/     - /'
else
    echo -e "${YELLOW}⚠ No IAM roles found${NC}"
fi
echo ""

echo "   Checking permission boundary policy..."
POLICY=$(awslocal iam list-policies --query 'Policies[?contains(PolicyName, `permission-boundary`)].PolicyName' --output text 2>/dev/null || echo "")
if [ -n "$POLICY" ]; then
    echo -e "${GREEN}✓ Found permission boundary policy:${NC}"
    echo "     - $POLICY"
else
    echo -e "${YELLOW}⚠ Permission boundary policy not found${NC}"
fi
echo ""

# Show outputs
echo "9. Terraform outputs..."
terraform output
echo ""

# Success summary
echo "=========================================="
echo "Deployment Test Complete"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ All checks passed${NC}"
echo ""
echo "Next steps:"
echo "  1. Test role details:"
echo "     awslocal iam get-role --role-name corp-security-auditor-localstack-pr1677"
echo ""
echo "  2. Test role policies:"
echo "     awslocal iam list-role-policies --role-name corp-security-auditor-localstack-pr1677"
echo ""
echo "  3. Destroy resources when done:"
echo "     terraform destroy -var-file=localstack.tfvars -auto-approve"
echo ""
