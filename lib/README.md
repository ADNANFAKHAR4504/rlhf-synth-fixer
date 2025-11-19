# Payment Processing Infrastructure - CDK Python

This AWS CDK application implements a production-grade payment processing infrastructure for migrating a fintech company's credit card transaction system from on-premises to AWS with zero downtime capabilities.

## Architecture

### Network Layer
- **VPC**: 3 availability zones with public, private, and database subnets
- **NAT Gateway**: Single NAT Gateway for cost optimization
- **Security Groups**: Layered security for Lambda, RDS, and ALB

### Database Layer
- **Aurora Serverless v2 PostgreSQL**: Customer database with automated backups and read replicas
- **DynamoDB**: Transaction records with global secondary indexes for customer and status queries
- **Point-in-Time Recovery**: Enabled on all DynamoDB tables

### Compute Layer
- **Lambda Functions**:
  - Payment Validation: Validates payment requests
  - Fraud Detection: Analyzes transactions for fraud indicators
  - Transaction Processing: Processes validated payments and writes audit logs

### API Layer
- **API Gateway**: REST API with request validation
- **VPC Link**: Connects API Gateway to private ALB
- **Application Load Balancer**: Two target groups for blue-green deployment

### Storage Layer
- **S3**: Audit logs with 90-day lifecycle policy to Glacier
- **Encryption**: All storage encrypted with customer-managed KMS keys

### Monitoring Layer
- **CloudWatch Dashboard**: API latency, error rates, Lambda metrics, DynamoDB metrics
- **CloudWatch Alarms**: API latency (p99), API errors, Lambda errors, Aurora CPU
- **SNS**: Alert notifications for operations team

### Security Layer
- **Secrets Manager**: Database credentials with automated rotation
- **KMS**: Customer-managed encryption keys
- **Systems Manager Parameter Store**: Configuration management
- **IAM**: Least privilege roles for all services

## Prerequisites

- Python 3.9 or higher
- Node.js 14.x or higher (for AWS CDK)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

## Deployment

### Deploy with default environment suffix (dev):
```bash
cdk deploy
```

### Deploy with custom environment suffix:
```bash
cdk deploy -c environmentSuffix=staging
```

### Deploy with custom alert email:
```bash
cdk deploy --parameters AlertEmail=ops@yourcompany.com
```

### Deploy with both parameters:
```bash
cdk deploy -c environmentSuffix=prod --parameters AlertEmail=ops@yourcompany.com
```

## Blue-Green Deployment

The infrastructure includes two target groups for blue-green deployment:
- Blue target group: Initially receives 100% of traffic
- Green target group: Initially receives 0% of traffic

To shift traffic from blue to green:
1. Update the listener rule weights in the AWS Console or via CLI
2. Gradually increase green target group weight (e.g., 10%, 25%, 50%, 100%)
3. Monitor CloudWatch metrics during transition
4. Roll back by adjusting weights if issues detected

## API Endpoints

After deployment, the API Gateway URL will be available in CloudFormation outputs:

- `POST /validate` - Payment validation
- `POST /fraud-check` - Fraud detection
- `POST /process` - Transaction processing (via VPC Link to ALB)

Example request:
```bash
curl -X POST https://API-ID.execute-api.us-east-1.amazonaws.com/prod/validate \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust-12345",
    "amount": 99.99,
    "currency": "USD",
    "card_number": "4111111111111111"
  }'
```

## CloudFormation Outputs

The stack exports the following outputs for use by operations:
- `VpcId`: VPC identifier
- `AuroraClusterEndpoint`: Aurora PostgreSQL endpoint
- `TransactionTableName`: DynamoDB table name
- `ApiGatewayUrl`: API Gateway URL
- `AlbDnsName`: Application Load Balancer DNS
- `AuditLogBucket`: S3 audit log bucket name
- `AlertTopicArn`: SNS topic ARN for alerts
- `KmsKeyId`: KMS encryption key ID
- `DashboardUrl`: CloudWatch Dashboard URL

## Parameter Store Configuration

The following configuration is stored in AWS Systems Manager Parameter Store:
- `/payment/vpc-id-{env}`: VPC ID
- `/payment/aurora-endpoint-{env}`: Aurora cluster endpoint
- `/payment/transaction-table-{env}`: DynamoDB table name
- `/payment/api-url-{env}`: API Gateway URL
- `/payment/audit-bucket-{env}`: S3 audit bucket name
- `/payment/kms-key-id-{env}`: KMS key ID

## Monitoring

Access the CloudWatch Dashboard via the console or use the `DashboardUrl` output.

Dashboard includes:
- API Gateway latency (p99 and median)
- API Gateway errors (4xx and 5xx)
- Lambda invocation counts
- Lambda error rates
- DynamoDB read/write capacity
- DynamoDB throttled requests

## Alarms

The following CloudWatch alarms are configured:
- **API Latency**: Triggers when p99 latency exceeds 200ms
- **API Errors**: Triggers when server errors exceed 10 in 5 minutes
- **Lambda Errors**: Triggers when Lambda errors exceed 5 in 5 minutes
- **Aurora CPU**: Triggers when CPU utilization exceeds 80%

All alarms send notifications to the SNS topic (subscribe via email).

## Security Considerations

- All data encrypted at rest using customer-managed KMS keys
- All data in transit encrypted with TLS 1.2+
- Database credentials stored in Secrets Manager with 30-day rotation
- Lambda functions deployed in private subnets with VPC access
- ALB deployed in private subnets (not internet-facing)
- API Gateway connected to ALB via VPC Link (no public endpoints)
- IAM roles follow least privilege principle
- S3 buckets block all public access

## Cost Optimization

- Aurora Serverless v2: Pay only for capacity used
- Single NAT Gateway: Reduced cost vs per-AZ NAT
- Lambda: No reserved concurrency (use default scaling)
- DynamoDB: On-demand billing mode
- S3 Lifecycle: Automatic transition to Glacier after 90 days

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup.

## Troubleshooting

### Lambda cold starts
- Lambda functions are in VPC which can cause cold starts
- Consider using provisioned concurrency for production if needed

### API Gateway timeout
- Default integration timeout is 29 seconds
- Lambda timeout is 30 seconds (adjust if needed)

### Aurora connection issues
- Verify security group allows Lambda to connect on port 5432
- Check Aurora cluster is in available state
- Verify Secrets Manager has correct credentials

### DynamoDB throttling
- Check CloudWatch metrics for throttled requests
- On-demand mode should auto-scale, but check for hot partitions

## Testing

Run CDK tests:
```bash
python -m pytest tests/
```

## License

This infrastructure code is provided as-is for the payment processing migration project.
