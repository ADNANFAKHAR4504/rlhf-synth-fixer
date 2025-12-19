# Model Response: Disaster Recovery Infrastructure

## Overview
This is the initial implementation of a disaster recovery infrastructure using Pulumi with Python. The infrastructure includes Aurora Serverless v2, DynamoDB, Lambda, API Gateway, EventBridge, and comprehensive monitoring.

## Implementation

### Architecture
The DR infrastructure includes:
- VPC with public and private subnets across 2 AZs
- Aurora PostgreSQL Serverless v2 cluster
- DynamoDB table with point-in-time recovery
- S3 bucket with versioning
- Lambda function for business logic
- API Gateway for REST API
- EventBridge for scheduled operations
- SNS and CloudWatch for monitoring

### Code Structure
```
lib/
  __init__.py
  tap_stack.py          # Main stack implementation
__main__.py             # Entry point
```

### Key Components

#### 1. Networking (VPC)
- VPC with CIDR 10.0.0.0/16
- 2 private subnets for databases and Lambda
- 2 public subnets for internet-facing resources
- Internet Gateway for public access
- Route tables and associations

#### 2. Aurora Serverless v2
- Engine: aurora-postgresql 15.4
- Serverless v2 scaling: 0.5 to 2.0 ACU
- Multi-AZ deployment
- Automated backups (7-day retention)
- Encryption at rest
- Skip final snapshot for testing

#### 3. DynamoDB
- On-demand billing mode
- Point-in-time recovery enabled
- DynamoDB Streams enabled
- Server-side encryption

#### 4. S3
- Versioning enabled
- Server-side encryption (AES256)
- Lifecycle policy (transition to IA after 30 days)
- Public access blocked

#### 5. Lambda
- Runtime: Python 3.12
- VPC-enabled for Aurora access
- IAM role with DynamoDB, S3, and VPC permissions
- Environment variables for configuration

#### 6. API Gateway
- HTTP API (API Gateway v2)
- CORS enabled
- Lambda proxy integration
- Auto-deploy stage

#### 7. EventBridge
- Scheduled rule (every 5 minutes)
- Lambda target
- Event-driven architecture

#### 8. Monitoring
- SNS topic for alerts
- CloudWatch alarms for:
  - Aurora CPU utilization
  - Lambda errors
  - DynamoDB throttles

### Outputs
The stack exports:
- VPC ID
- Aurora endpoints (writer and reader)
- DynamoDB table name and ARN
- S3 bucket name and ARN
- Lambda function name and ARN
- API Gateway endpoint
- SNS topic ARN
- Event rule name

## Known Issues
This initial implementation may have:
- Hardcoded database password (should use Secrets Manager)
- No NAT Gateway for Lambda internet access from private subnets
- Basic error handling in Lambda
- Simplified monitoring (could add more metrics)
