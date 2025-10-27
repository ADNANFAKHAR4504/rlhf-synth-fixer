# Deployment Guide

This guide provides step-by-step instructions for deploying the Secure API with Cognito authentication infrastructure.

## Prerequisites

Before deploying, ensure you have the following installed and configured:

- **AWS CLI** (v2.x or later) - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Terraform** (v1.4.0 or later) - [Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- **Node.js** (v20.x or later) - Required for testing
- **npm** (v10.x or later) - Package manager

## AWS Credentials Configuration

Configure your AWS credentials using one of the following methods:

### Option 1: AWS CLI Configuration

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region, and output format.

### Option 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### Option 3: AWS Profile

```bash
export AWS_PROFILE="your-profile-name"
```

## Deployment Steps

### Step 1: Set Environment Suffix

Set a unique environment suffix to avoid resource naming conflicts:

```bash
export ENVIRONMENT_SUFFIX="pr123"  # Use your PR number or unique identifier
```

### Step 2: Initialize Terraform

Initialize Terraform to download required providers:

```bash
cd lib
terraform init -reconfigure \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=secure-api/${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

Replace `your-terraform-state-bucket` with your actual S3 bucket name for Terraform state.

### Step 3: Create Terraform Variables File (Optional)

Create a `terraform.tfvars` file for custom configuration:

```hcl
environment_suffix = "pr123"
primary_region = "us-east-1"
secondary_region = "us-west-2"
alarm_email = "your-email@example.com"
enable_route53 = false
```

### Step 4: Validate Configuration

Validate your Terraform configuration:

```bash
terraform validate
```

### Step 5: Plan Deployment

Review the deployment plan to see what resources will be created:

```bash
terraform plan \
  -var="environment_suffix=${ENVIRONMENT_SUFFIX}" \
  -out=tfplan
```

Review the output carefully to ensure all resources are correct.

### Step 6: Apply Deployment

Deploy the infrastructure:

```bash
terraform apply tfplan
```

The deployment typically takes 5-10 minutes to complete.

### Step 7: Capture Outputs

After deployment, save the outputs for testing:

```bash
terraform output -json > ../cfn-outputs/terraform-outputs.json
```

Convert to flat format for integration tests:

```bash
cd ..
mkdir -p cfn-outputs
node -e "
const outputs = require('./cfn-outputs/terraform-outputs.json');
const flat = {};
for (const [key, value] of Object.entries(outputs)) {
  flat[key] = value.value;
}
require('fs').writeFileSync('cfn-outputs/flat-outputs.json', JSON.stringify(flat, null, 2));
"
```

## Verify Deployment

### Check Resource Creation

Verify that all key resources were created:

```bash
# Check API Gateway
aws apigateway get-rest-apis --query 'items[?name==`'${ENVIRONMENT_SUFFIX}'-api`]'

# Check Cognito User Pool
aws cognito-idp list-user-pools --max-results 20 \
  --query 'UserPools[?Name==`'${ENVIRONMENT_SUFFIX}'-user-pool`]'

# Check DynamoDB Table
aws dynamodb describe-table --table-name ${ENVIRONMENT_SUFFIX}-user-profiles

# Check Lambda Function
aws lambda get-function --function-name ${ENVIRONMENT_SUFFIX}-api-handler
```

### View Outputs

Display all infrastructure outputs:

```bash
cd lib
terraform output
```

Key outputs include:

- `api_gateway_invoke_url` - API endpoint for testing
- `cloudfront_domain_name` - CloudFront distribution domain
- `cognito_user_pool_id` - User pool ID
- `cognito_user_pool_client_id` - App client ID
- `dynamodb_table_name` - DynamoDB table name

## Post-Deployment Verification

### Test API Endpoint

Test the API health (without authentication):

```bash
API_URL=$(cd lib && terraform output -raw api_gateway_invoke_url)
curl -X OPTIONS ${API_URL}/profiles
```

This should return a 200 OK response with CORS headers.

### Test CloudFront Distribution

```bash
CF_DOMAIN=$(cd lib && terraform output -raw cloudfront_domain_name)
curl -I https://${CF_DOMAIN}
```

## Troubleshooting

### Issue: Backend Initialization Fails

If backend initialization fails, ensure:

- The S3 bucket exists and you have access
- The bucket is in the same region specified in backend config
- Your AWS credentials have necessary permissions

### Issue: Resource Already Exists

If resources already exist with the same name:

- Use a different `environment_suffix`
- Clean up old resources from previous deployments

### Issue: Lambda Deployment Package Missing

If Lambda deployment fails:

- Ensure `lib/lambda/` directory contains `lambda_function.py` and `requirements.txt`
- Check S3 bucket permissions

### Issue: DynamoDB Global Table Replication Fails

- Ensure both regions (primary and secondary) are available
- Check that DynamoDB service is available in both regions
- Wait a few minutes for replication to stabilize

## Cleanup

To destroy all resources:

```bash
cd lib
terraform destroy -var="environment_suffix=${ENVIRONMENT_SUFFIX}"
```

Confirm by typing `yes` when prompted.

## CI/CD Deployment

This infrastructure is designed to be deployed via CI/CD pipelines. The CI/CD pipeline will:

1. Run linting and validation
2. Execute unit tests
3. Deploy to AWS
4. Run integration tests
5. Generate deployment outputs

Manual deployment is only recommended for local testing and development.

## Security Considerations

- Never commit AWS credentials to version control
- Use IAM roles with least privilege permissions
- Rotate access keys regularly
- Enable MFA for production deployments
- Review CloudWatch alarms and configure SNS notifications
- Monitor X-Ray traces for security issues

## Support

For issues or questions:

- Check CloudWatch Logs for error messages
- Review X-Ray traces for request failures
- Consult AWS documentation for service-specific issues
- Contact the infrastructure team for assistance
