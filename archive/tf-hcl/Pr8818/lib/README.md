# Multi-Region Payment Processing Infrastructure

This Terraform configuration deploys a complete multi-region payment processing infrastructure across AWS us-east-1 (primary) and eu-west-1 (secondary) regions.

## Architecture Overview

### Services Deployed
- VPC: 3 public + 3 private subnets per region
- S3: Cross-region replicated buckets with KMS encryption
- RDS PostgreSQL: db.t3.medium instances with encrypted snapshots
- Lambda: Payment processing functions with region-specific configurations
- API Gateway: REST APIs with health checks
- DynamoDB: Region-specific transaction tables
- Route 53: Health checks and failover routing
- CloudWatch: Alarms for RDS replication lag, Lambda errors, API Gateway errors
- KMS: Encryption keys in both regions
- IAM: Centralized roles in us-east-1

## Prerequisites

1. Terraform: Version 1.5 or higher
2. AWS CLI: Configured with appropriate credentials
3. AWS Account: With permissions to create all required resources
4. Environment Suffix: A unique suffix for resource naming (e.g., "dev", "test", "prod")

## Workspace Management

This configuration uses Terraform workspaces to manage both regions:

```bash
# Create workspaces
terraform workspace new primary
terraform workspace new secondary

# List workspaces
terraform workspace list

# Select workspace
terraform workspace select primary
```

- **primary** workspace: Deploys to us-east-1
- **secondary** workspace: Deploys to eu-west-1

## Deployment Instructions

### Step 1: Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=YOUR-TERRAFORM-STATE-BUCKET" \
  -backend-config="key=payment-processor/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=YOUR-TERRAFORM-LOCKS-TABLE"
```

### Step 2: Create Lambda Deployment Package

```bash
cd lib/lambda
zip payment_processor.zip payment_processor.py
cd ../..
```

### Step 3: Deploy to Primary Region (us-east-1)

```bash
# Select primary workspace
terraform workspace select primary

# Review plan
terraform plan \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"

# Apply configuration
terraform apply \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"
```

### Step 4: Deploy to Secondary Region (eu-west-1)

```bash
# Select secondary workspace
terraform workspace select secondary

# Review plan
terraform plan \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"

# Apply configuration
terraform apply \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"
```

## Configuration Variables

### Required Variables
- `environment_suffix`: Unique suffix for resource naming (no default)
- `db_master_password`: Master password for RDS (sensitive, no default)

### Optional Variables
- `aws_region`: Primary AWS region (default: "us-east-1")
- `project_name`: Project name prefix (default: "payment-processor")
- `db_master_username`: RDS master username (default: "dbadmin")
- `domain_name`: API Gateway custom domain (default: "api.example.com")

### Example terraform.tfvars

```hcl
environment_suffix = "dev"
db_master_password = "SecurePassword123!"
db_master_username = "admin"
project_name       = "payment-processor"
```

## Cross-Region Replication

### S3 Replication
- Automatic replication from primary (us-east-1) to secondary (eu-west-1)
- Versioning enabled on both buckets
- KMS encryption with region-specific keys

### RDS Snapshot Copying
- Automated encrypted snapshot copying from primary to secondary
- 7-day retention period
- KMS encryption with region-specific keys

## IAM Configuration

All IAM roles are created in us-east-1 and referenced cross-region using data sources:
- `lambda_execution`: Lambda execution role with VPC and DynamoDB permissions
- `s3_replication`: S3 cross-region replication role
- `apigateway_cloudwatch`: API Gateway CloudWatch logging role

## Monitoring and Alarms

### CloudWatch Alarms
- **RDS Replication Lag**: Triggers when replication lag exceeds 30 seconds
- **RDS CPU**: Triggers when CPU utilization exceeds 80%
- **Lambda Errors**: Triggers when error count exceeds 5 in 5 minutes
- **API Gateway 5XX**: Triggers when 5XX error count exceeds 10

### CloudWatch Dashboard
- Lambda metrics: Invocations, errors, duration
- API Gateway metrics: Request count, 4XX/5XX errors
- RDS metrics: CPU, connections, replication lag

## Testing the Deployment

### Test API Gateway Endpoint

```bash
# Get API Gateway endpoint
WORKSPACE=$(terraform workspace show)
API_ENDPOINT=$(terraform output -raw api_gateway_endpoint)

# Test payment processing
curl -X POST "${API_ENDPOINT}/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-123",
    "amount": 100.00,
    "currency": "USD"
  }'
```

### Verify S3 Replication

```bash
# Upload file to primary bucket
aws s3 cp test-file.txt s3://payment-processor-YOUR-SUFFIX-documents-us-east-1/

# Wait 1-2 minutes, then check secondary bucket
aws s3 ls s3://payment-processor-YOUR-SUFFIX-documents-eu-west-1/
```

### Check RDS Status

```bash
# Primary region
aws rds describe-db-instances \
  --db-instance-identifier payment-processor-YOUR-SUFFIX-postgres-us-east-1 \
  --region us-east-1

# Secondary region
aws rds describe-db-instances \
  --db-instance-identifier payment-processor-YOUR-SUFFIX-postgres-eu-west-1 \
  --region eu-west-1
```

## Failover Testing

### Manual Failover to Secondary Region
1. Update Route 53 DNS records to point to secondary region API Gateway
2. Verify health checks are passing for secondary endpoint
3. Monitor CloudWatch metrics for increased traffic in secondary region

## Cleanup

To destroy resources:

```bash
# Destroy secondary region first
terraform workspace select secondary
terraform destroy \
  -var="environment_suffix=YOUR-SUFFIX" \
  -var="db_master_password=YOUR-PASSWORD"

# Destroy primary region
terraform workspace select primary
terraform destroy \
  -var="environment_suffix=YOUR-SUFFIX" \
  -var="db_master_password=YOUR-PASSWORD"
```

## Security Considerations

1. Encryption: All data encrypted at rest using KMS
2. Network: Resources deployed in private subnets where possible
3. IAM: Least privilege access for all roles
4. Secrets: Store sensitive values in AWS Secrets Manager or SSM Parameter Store
5. VPC: Security groups restrict traffic to necessary ports only

## Troubleshooting

### Lambda Function Not Accessible
- Check VPC configuration and security groups
- Verify IAM role has necessary permissions
- Review CloudWatch logs: `/aws/lambda/FUNCTION-NAME`

### S3 Replication Not Working
- Verify versioning is enabled on both buckets
- Check replication role has necessary permissions
- Review replication metrics in S3 console

### RDS Connection Issues
- Verify security group allows traffic from Lambda
- Check RDS endpoint in Lambda environment variables
- Ensure RDS is in available state

## Cost Optimization Notes

- NAT Gateways are included for Lambda VPC access (can be expensive)
- Consider using VPC endpoints for AWS services to reduce NAT Gateway usage
- RDS Multi-AZ increases costs but provides high availability
- DynamoDB uses pay-per-request pricing for cost efficiency

## Future Enhancements

1. Configure custom domain names with ACM certificates
2. Implement Route 53 failover routing policies
3. Add VPC peering between regions
4. Implement automated testing and validation
5. Add SNS notifications for CloudWatch alarms
