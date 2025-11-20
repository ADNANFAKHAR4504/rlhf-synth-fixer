# Loan Processing Migration Infrastructure

This CloudFormation template creates a complete AWS infrastructure for migrating an on-premises loan processing system to AWS.

## Architecture Overview

The infrastructure includes:

- **VPC Network**: Multi-AZ VPC with public and private subnets across 2 availability zones
- **RDS Aurora MySQL**: Encrypted database cluster with automatic backups and Secrets Manager integration
- **Lambda Function**: Loan validation processing with 1GB memory and reserved concurrency
- **S3 Storage**: Versioned bucket for loan documents with KMS encryption
- **Secrets Manager**: Automatic 30-day credential rotation for database passwords
- **CloudWatch Logs**: 90-day retention for compliance requirements
- **KMS Encryption**: Customer-managed keys for data encryption

## Parameters

| Parameter | Description | Default | Allowed Values |
|-----------|-------------|---------|----------------|
| EnvironmentSuffix | Unique suffix for resource names | Required | alphanumeric + hyphens |
| EnvironmentType | Environment type (dev/prod) | dev | dev, prod |
| DBInstanceClass | RDS Aurora instance size | db.t3.medium | db.t3.medium, db.t3.large, db.r5.large, db.r5.xlarge, db.r5.2xlarge |
| CostCenter | Cost center tag | FinancialServices | any string |
| MigrationPhase | Migration phase tag | Phase1-Infrastructure | Phase1 through Phase5 |

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, RDS, Lambda, S3, KMS, Secrets Manager, and IAM resources

### Deploy Development Environment

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-dev \
  --template-body file://lib/loan-processing-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.medium \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Production Environment

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=DBInstanceClass,ParameterValue=db.r5.large \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

## Environment Differences

### Development Environment (EnvironmentType=dev)

- Single NAT Gateway for cost savings
- Single Aurora instance (writer only)
- Suitable for testing and development

### Production Environment (EnvironmentType=prod)

- Dual NAT Gateways for high availability
- Two Aurora instances (writer + reader for multi-AZ)
- Full redundancy across availability zones

## Security Features

1. **Encryption**
   - Customer-managed KMS keys for all data at rest
   - S3 bucket encryption with KMS
   - RDS Aurora storage encryption
   - Encrypted Secrets Manager secrets

2. **Network Isolation**
   - Private subnets for RDS and Lambda
   - Security groups restricting access
   - No public database endpoints
   - NAT Gateways for outbound connectivity

3. **Credential Management**
   - Secrets Manager for database credentials
   - Automatic 30-day password rotation
   - IAM roles with least privilege access

4. **Audit & Compliance**
   - CloudWatch Logs with 90-day retention
   - Aurora audit logs enabled
   - Resource tagging for cost allocation

## Outputs

| Output | Description |
|--------|-------------|
| VPCId | VPC identifier for reference |
| DBClusterEndpoint | Aurora cluster endpoint for connections |
| DBSecretArn | Secrets Manager ARN for database credentials |
| LoanDocumentsBucketName | S3 bucket name for documents |
| LoanValidationFunctionArn | Lambda function ARN |
| KMSKeyId | KMS key ID for encryption |

## Cost Optimization

- Development environment uses single NAT Gateway
- Aurora instances sized appropriately by parameter
- Reserved concurrency prevents Lambda throttling
- S3 lifecycle policies clean up old versions after 90 days

## Cleanup

To delete the stack and all resources:

```bash
# Empty the S3 bucket first
aws s3 rm s3://loan-documents-<suffix>-<account-id> --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name loan-processing-dev \
  --region us-east-1
```

**Note**: All resources are configured without deletion protection or retain policies, making cleanup straightforward.

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name loan-processing-dev \
     --region us-east-1
   ```

2. Verify IAM permissions include CAPABILITY_NAMED_IAM
3. Ensure EnvironmentSuffix is unique across your account

### Lambda Function Cannot Connect to RDS

1. Verify Lambda is in private subnets
2. Check security group rules allow traffic between Lambda and RDS
3. Confirm NAT Gateway is operational for outbound connectivity

### Secret Rotation Fails

1. Check Secret rotation Lambda logs in CloudWatch
2. Verify Lambda can reach RDS endpoint
3. Ensure rotation Lambda has VPC access execution role

## Support

For issues related to the infrastructure, check:
- CloudFormation stack events
- CloudWatch Logs for Lambda functions
- RDS event logs
- VPC Flow Logs (if enabled)
