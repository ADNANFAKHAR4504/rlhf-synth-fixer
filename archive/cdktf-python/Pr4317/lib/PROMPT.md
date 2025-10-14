# HIPAA-compliant Healthcare Data Processing API Infrastructure

Create infrastructure using CDKTF with Python for a HIPAA-compliant healthcare data processing API with comprehensive failure recovery and high availability mechanisms.

## Problem Statement
Design and implement a HIPAA-compliant healthcare data processing infrastructure that enables secure patient data ingestion, processing, and storage with high availability and failure recovery mechanisms.

## Required AWS Services

### Core Components
1. **API Layer**
   - Amazon API Gateway (REST API) for HIPAA-compliant data ingestion endpoints
   - Lambda authorizer for API authentication

2. **Compute & Processing**
   - AWS Lambda functions for serverless data processing
   - Lambda with reserved concurrency for critical operations

3. **Storage**
   - Amazon S3 buckets with:
     - Server-side encryption (SSE-S3)
     - Versioning enabled
     - Lifecycle policies for cost optimization
   - Amazon DynamoDB with:
     - Point-in-time recovery enabled
     - Encryption at rest
     - On-demand billing mode

4. **High Availability & Recovery**
   - Application Load Balancer (Multi-AZ)
   - Auto Scaling configuration
   - AWS Backup with automated backup plans
   - CloudWatch alarms with SNS notifications
   - Lambda functions for automated remediation

5. **Security & Compliance**
   - AWS KMS keys for encryption
   - VPC with:
     - Public and private subnets across 2 AZs
     - Internet Gateway
     - NAT Gateway (single for cost optimization)
     - VPC Endpoints for S3 and DynamoDB
   - Security Groups with least privilege access
   - IAM roles and policies
   - AWS CloudTrail for audit logging
   - VPC Flow Logs for network monitoring

6. **Monitoring & Observability**
   - CloudWatch Log Groups with 7-day retention
   - CloudWatch Alarms for critical metrics
   - CloudWatch Dashboard for visibility
   - SNS topics for alert notifications
   - EventBridge rules for automated responses

## Architecture Requirements

### High Availability
- Deploy across 2 availability zones (us-east-1a, us-east-1b)
- Application Load Balancer distributing traffic
- DynamoDB with automatic Multi-AZ replication
- S3 with cross-region replication capability

### Failure Recovery Mechanisms
- Automated health checks at ALB and Lambda levels
- CloudWatch alarms monitoring:
  - Lambda errors and throttles
  - API Gateway 4xx/5xx errors
  - DynamoDB read/write capacity
- EventBridge rules triggering Lambda remediation functions
- AWS Backup with daily snapshots, 7-day retention

### HIPAA Compliance Controls
- All data encrypted at rest using KMS or SSE-S3
- All data encrypted in transit (HTTPS/TLS)
- VPC isolation with private subnets for compute
- CloudTrail logging all API calls
- IAM policies following least privilege
- No public access to sensitive data stores
- VPC Flow Logs enabled

### Cost Optimization
- Single NAT Gateway instead of per-AZ
- VPC Endpoints for S3 and DynamoDB to avoid NAT costs
- DynamoDB on-demand pricing
- Lambda with appropriate memory/timeout settings
- CloudWatch Logs with 7-day retention
- S3 lifecycle policies for infrequent access

## Implementation Details

### Lambda Functions Required
1. Data processing function triggered by API Gateway
2. Automated remediation function triggered by CloudWatch alarms
3. Health check function for monitoring

### EventBridge/SNS Integration
- EventBridge rules for automated failure detection
- SNS topics for critical alerts
- Lambda subscriptions for automated remediation

### Resource Naming
All resources must use environment_suffix variable for unique naming:
- Pattern: `resource-name-{environment_suffix}`
- Example: `healthcare-api-{environment_suffix}`

### Destroyability
All resources must be destroyable:
- S3 buckets: force_destroy enabled
- DynamoDB: deletion protection disabled
- No retention policies that block deletion

## Region
Deploy to us-east-1

## Expected Outputs
The infrastructure must export:
- API Gateway endpoint URL
- S3 bucket names
- DynamoDB table name
- ALB DNS name
- CloudWatch dashboard URL
- KMS key ARN
