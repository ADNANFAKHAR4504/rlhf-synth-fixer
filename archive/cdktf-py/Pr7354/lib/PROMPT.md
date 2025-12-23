# Expert Multi-Region Payment Infrastructure - CDKTF Python

## Overview
Create a highly available, multi-region payment processing infrastructure using CDKTF with Python. The system must support global payments with automatic failover and disaster recovery capabilities.

## Platform Requirements
- **Platform**: CDKTF (Terraform CDK)
- **Language**: Python
- **Complexity**: Expert
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2

## Architecture Requirements

### 1. API Gateway (Regional)
- Regional REST API in us-east-1
- Custom domain with Route 53 health check
- API key authentication
- Request/response validation
- CloudWatch logging enabled
- CORS configuration for web clients

### 2. Lambda Functions
- Payment processor function
- Runtime: Python 3.11
- Environment variables for configuration
- KMS encryption for sensitive data
- CloudWatch Logs integration
- Error handling and retry logic
- Integration with DynamoDB Global Table

### 3. DynamoDB Global Table
- Global table with replicas in us-east-1 and us-west-2
- Table name: payments
- Partition key: payment_id (String)
- Sort key: timestamp (Number)
- GSI for status queries
- Point-in-time recovery enabled
- Encryption at rest with KMS
- On-demand billing mode
- Streams enabled for cross-region replication

### 4. Route 53
- Health check for API Gateway endpoint
- Failover routing policy
- Latency-based routing for optimal performance
- TTL: 60 seconds
- DNS records for custom domain

### 5. S3 Bucket
- Bucket for payment logs and audit trail
- Versioning enabled
- Server-side encryption with KMS
- Lifecycle policy for cost optimization
- Cross-region replication to us-west-2
- Bucket policy for Lambda access

### 6. CloudWatch
- Custom metrics for payment success/failure
- Alarms for error rates
- Alarms for Lambda duration
- Alarms for DynamoDB throttling
- SNS topic for alarm notifications
- Log groups for all services
- Metric filters for business KPIs

### 7. IAM
- Lambda execution role with least privilege
- Policies for DynamoDB access
- Policies for S3 access
- Policies for KMS access
- Policies for CloudWatch Logs
- Service-linked roles where needed

### 8. KMS
- Customer-managed keys for encryption
- Key for DynamoDB encryption
- Key for S3 encryption
- Key for Lambda environment variables
- Key policies for service access
- Automatic key rotation enabled

### 9. SSM Parameter Store
- Store configuration parameters
- Store API keys securely
- Parameter for database table name
- Parameter for S3 bucket name
- Encrypted parameters with KMS

## Implementation Requirements

### Multi-Region Configuration
```python
# Configure multiple AWS providers
primary_provider = AwsProvider(self, "primary",
    region="us-east-1",
    alias="primary"
)

secondary_provider = AwsProvider(self, "secondary",
    region="us-west-2",
    alias="secondary"
)
```

### DynamoDB Global Table
- Use CDKTF DynamodbTable with replica configuration
- Configure proper replication settings
- Enable point-in-time recovery
- Set up encryption with KMS
- Configure streams for replication

### Lambda Function
- Package Lambda code in zip file
- Include boto3 for AWS SDK
- Implement payment validation logic
- Implement error handling
- Log all transactions
- Write to DynamoDB Global Table
- Write audit logs to S3

### Naming Convention
- All resources must include `environmentSuffix` variable
- Format: `payment-{environmentSuffix}-{resource-type}`
- Example: `payment-synthl0s3m1-api`, `payment-synthl0s3m1-lambda`

### Tags
Apply consistent tags to all resources:
- Environment: dev
- Project: payment-infrastructure
- ManagedBy: cdktf

### Security Requirements
- No public access to resources
- All data encrypted in transit and at rest
- IAM roles follow least privilege principle
- API Gateway uses API key authentication
- KMS keys for all encryption
- VPC endpoints where applicable

### Outputs
Export the following outputs for integration testing:
- API Gateway endpoint URL
- API Gateway API key
- DynamoDB table name
- DynamoDB table ARN
- S3 bucket name
- Lambda function ARN
- Lambda function name
- KMS key ID
- CloudWatch log group names

## Testing Requirements

### Unit Tests (100% Coverage Required)
- Test CDKTF stack synthesis
- Verify all 9 services are created
- Verify multi-region provider configuration
- Verify resource naming includes environmentSuffix
- Verify tags are applied correctly
- Verify encryption is enabled
- Verify IAM policies are correct
- Test error conditions

### Integration Tests (Using Deployed Resources)
- Load outputs from cfn-outputs/flat-outputs.json
- Test API Gateway endpoint accessibility
- Test Lambda function invocation via API
- Test DynamoDB read/write operations
- Test S3 bucket write operations
- Test KMS key encryption
- Test CloudWatch metrics and logs
- Verify cross-region replication

## Deployment Considerations

### Cost Optimization
- Use on-demand billing for DynamoDB
- Lifecycle policies for S3
- Lambda reserved concurrency: None (default)
- CloudWatch log retention: 7 days

### Reliability
- Multi-region deployment for disaster recovery
- Health checks and failover
- Automatic retry logic in Lambda
- DynamoDB Global Table for data replication

### Performance
- API Gateway caching disabled (for simplicity)
- Lambda memory: 512 MB
- DynamoDB on-demand capacity
- S3 standard storage class

## Deliverables
1. CDKTF Python code in `lib/tap.py`
2. Lambda function code in `lib/lambda/payment_processor/handler.py`
3. Unit tests in `tests/unit/test_tap_stack.py`
4. Integration tests in `tests/integration/test_tap_stack.py`
5. All tests passing with 100% coverage
6. Successful deployment to AWS
7. Outputs captured in `cfn-outputs/flat-outputs.json`
8. Documentation in `lib/IDEAL_RESPONSE.md`
9. Model failures analysis in `lib/MODEL_FAILURES.md`

## Success Criteria
- All 9 AWS services deployed successfully
- Multi-region DynamoDB Global Table operational
- API Gateway accessible and functional
- Lambda function processing payments
- All tests passing with 100% coverage
- Documentation complete
- No deployment errors
- Resources properly tagged and named
