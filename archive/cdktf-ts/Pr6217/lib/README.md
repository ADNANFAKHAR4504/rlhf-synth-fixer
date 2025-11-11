# Payment Processing Infrastructure

Multi-environment payment processing infrastructure using CDKTF with TypeScript.

## Prerequisites

- Node.js 18+
- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Create Secrets Manager secrets for database passwords:
   ```bash
   # Replace <environment-suffix> with your actual suffix
   aws secretsmanager create-secret \
     --name payment-db-password-dev-<environment-suffix> \
     --secret-string "your-dev-password" \
     --region us-east-1

   aws secretsmanager create-secret \
     --name payment-db-password-staging-<environment-suffix> \
     --secret-string "your-staging-password" \
     --region us-east-1

   aws secretsmanager create-secret \
     --name payment-db-password-prod-<environment-suffix> \
     --secret-string "your-prod-password" \
     --region us-east-1
   ```

4. Create S3 bucket and DynamoDB table for remote state:
   ```bash
   # Replace <environment-suffix> with your actual suffix
   aws s3 mb s3://terraform-state-payment-processing-<environment-suffix> --region us-east-1

   aws dynamodb create-table \
     --table-name terraform-state-lock-<environment-suffix> \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

5. Package Lambda function:
   ```bash
   cd lib/lambda
   npm install
   zip -r ../lambda-deployment.zip index.js node_modules/
   cd ../..
   ```

## Deployment

Deploy to development environment:
```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf synth
cdktf deploy
```

Deploy to staging environment:
```bash
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf synth
cdktf deploy
```

Deploy to production environment:
```bash
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf synth
cdktf deploy
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run integration tests (requires deployed infrastructure):
```bash
export ENVIRONMENT=dev
npm run test:integration
```

## Infrastructure Components

- **VPC**: Isolated network per environment with public and private subnets across 2 AZs
  - Dev: 10.1.0.0/16
  - Staging: 10.2.0.0/16
  - Prod: 10.3.0.0/16
- **RDS PostgreSQL**: Managed database with automated backups
  - Dev: t3.micro
  - Staging: t3.small
  - Prod: t3.medium
- **Lambda**: Serverless payment processing functions
  - Dev: 128MB memory
  - Staging: 256MB memory
  - Prod: 512MB memory
- **S3**: Transaction log storage with versioning and lifecycle policies
- **API Gateway**: RESTful API endpoints
- **CloudWatch**: Centralized logging with environment-specific retention
  - Dev: 7 days
  - Staging: 14 days
  - Prod: 30 days
- **Secrets Manager**: Secure credential storage for database passwords

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environment-suffix}`

Example: `payment-db-dev-1699123456`

## API Usage

Once deployed, you can test the payment processing API:

```bash
# Get the API Gateway URL from outputs
API_URL=$(cat cfn-outputs/flat-outputs.json | jq -r '.api_gateway_url')

# Process a payment
curl -X POST $API_URL/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "customerId": "cust-123",
    "paymentMethod": "card"
  }'
```

## Cleanup

Destroy infrastructure:
```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=<your-suffix>
cdktf destroy
```

## Troubleshooting

### Secret Not Found
If you get "secret not found" errors, ensure you created the secrets with the correct naming pattern:
`payment-db-password-{environment}-{environmentSuffix}`

### Lambda Permission Error
If API Gateway returns 500 errors, check CloudWatch logs:
```bash
aws logs tail /aws/lambda/payment-processor-{environment}-{suffix} --follow
```

### State Lock
If deployment fails with state lock error:
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        VPC                              │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  Public Subnet 1    │  │  Public Subnet 2    │      │
│  │  (AZ1)              │  │  (AZ2)              │      │
│  └─────────────────────┘  └─────────────────────┘      │
│           │                         │                   │
│           │   Internet Gateway      │                   │
│           └────────┬────────────────┘                   │
│                    │                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  Private Subnet 1   │  │  Private Subnet 2   │      │
│  │  ┌──────────────┐   │  │  ┌──────────────┐   │      │
│  │  │   Lambda     │   │  │  │              │   │      │
│  │  └──────────────┘   │  │  └──────────────┘   │      │
│  │  ┌──────────────┐   │  │  ┌──────────────┐   │      │
│  │  │ RDS Postgres │───┼──┼──│ RDS Replica  │   │      │
│  │  └──────────────┘   │  │  └──────────────┘   │      │
│  └─────────────────────┘  └─────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                    │
                    ├──── API Gateway
                    │
                    ├──── S3 (Transaction Logs)
                    │
                    └──── CloudWatch Logs
```

## Security

- All resources are tagged with Environment, Project, and ManagedBy tags
- Database credentials stored in AWS Secrets Manager
- RDS instances in private subnets with security group restrictions
- Lambda functions with least-privilege IAM roles
- S3 bucket versioning enabled for audit trail
- VPC security groups restrict traffic to necessary ports only

## Cost Estimates

**Development Environment (monthly)**:
- RDS t3.micro: ~$15
- Lambda (minimal usage): ~$1
- S3 (1GB): ~$0.023
- API Gateway (1M requests): ~$3.50
- NAT Gateway: $0 (using VPC endpoints)
- Total: ~$20/month

**Production Environment (monthly)**:
- RDS t3.medium: ~$60
- Lambda (moderate usage): ~$5
- S3 (10GB): ~$0.23
- API Gateway (10M requests): ~$35
- Total: ~$100/month

## Compliance

This infrastructure follows:
- AWS Well-Architected Framework principles
- PCI DSS requirements for payment processing
- SOC 2 compliance guidelines
- GDPR data protection standards

## Support

For issues or questions, contact the infrastructure team or check the project documentation.
