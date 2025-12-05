# CDKTF Python Payment Processing Migration Infrastructure

This implementation provides a complete payment processing infrastructure migration using CDKTF with Python, supporting zero-downtime deployment with blue-green strategy and PCI compliance.

## Architecture Overview

The solution creates a complete payment processing system with:

### Network Infrastructure (3 AZs)
- VPC with CIDR 10.0.0.0/16
- 3 Public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- 3 Database subnets (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24)
- Internet Gateway for public internet access
- 3 NAT Gateways (one per AZ) for private subnet internet access
- Route tables for public, private, and database subnet isolation

### Database Layer
- **RDS Aurora PostgreSQL Serverless v2**
  - Engine version 15.4
  - 1 writer instance + 2 read replicas
  - Encrypted with customer-managed KMS key
  - Automated backups (7-day retention)
  - Min capacity: 0.5 ACU, Max capacity: 1.0 ACU
  - CloudWatch logs enabled

- **DynamoDB Table**
  - Table name: transactions-{environmentSuffix}
  - Hash key: transaction_id (String)
  - Range key: timestamp (Number)
  - Global Secondary Indexes:
    - user-index: Query by user_id + timestamp
    - status-index: Query by status + timestamp
  - Point-in-time recovery enabled
  - Encrypted with customer-managed KMS key
  - Pay-per-request billing

### Compute Layer
Three Lambda functions with VPC connectivity:

1. **payment-validation-{environmentSuffix}**
   - Runtime: Python 3.9
   - Memory: 512 MB
   - Timeout: 30 seconds
   - Reserved concurrency: 10
   - Validates payment transactions
   - Stores results in DynamoDB

2. **fraud-detection-{environmentSuffix}**
   - Runtime: Python 3.9
   - Memory: 512 MB
   - Timeout: 30 seconds
   - Reserved concurrency: 10
   - Analyzes transactions for fraud patterns
   - Updates transaction status

3. **transaction-processing-{environmentSuffix}**
   - Runtime: Python 3.9
   - Memory: 1024 MB
   - Timeout: 60 seconds
   - Reserved concurrency: 20
   - Processes validated transactions
   - Writes audit logs to S3

### API and Load Balancing
- **API Gateway HTTP API**
  - Protocol: HTTP
  - VPC Link connection to private ALB
  - Production stage with auto-deploy

- **Application Load Balancer**
  - Type: Internal ALB
  - Blue-green deployment with weighted routing
  - Blue target group: 90% traffic weight
  - Green target group: 10% traffic weight
  - Targets: Lambda functions

### Storage and Compliance
- **S3 Audit Logs Bucket**
  - Bucket name: payment-audit-logs-{environmentSuffix}
  - Versioning enabled
  - Lifecycle policy: Transition to Glacier after 90 days
  - Force destroy enabled for testing

### Monitoring and Alerting
- **CloudWatch Dashboard**
  - API Response Time (p99 metrics)
  - API Error Rates (4XX and 5XX)
  - Database Performance (CPU, connections)

- **CloudWatch Alarms**
  - API latency alarm (p99 > 1000ms)
  - RDS CPU alarm (> 80%)
  - DynamoDB throttle alarm (> 10 errors)

- **SNS Topics**
  - failed-transactions-{environmentSuffix}: Failed transaction alerts
  - system-errors-{environmentSuffix}: System error notifications

### Security and Secrets
- **KMS Keys**
  - rds-{environmentSuffix}: RDS Aurora encryption
  - dynamodb-{environmentSuffix}: DynamoDB encryption
  - Key rotation enabled (annual)

- **Secrets Manager**
  - Secret: payment-db-credentials-{environmentSuffix}
  - Contains: username, password, host, port, dbname
  - Automatic rotation every 30 days
  - Rotation Lambda function: db-secret-rotation-{environmentSuffix}

- **Systems Manager Parameter Store**
  - /payment/{environmentSuffix}/api-endpoint
  - /payment/{environmentSuffix}/db-endpoint
  - /payment/{environmentSuffix}/table-name

## File Structure

```
.
├── cdktf.json                          # CDKTF configuration
├── tap.py                              # Main entry point
├── lambda_functions.zip                # Lambda deployment package
├── lib/
│   ├── __init__.py                    # Package initializer
│   ├── tap_stack.py                   # Main infrastructure stack
│   ├── PROMPT.md                      # Task requirements
│   ├── MODEL_RESPONSE.md              # This file
│   └── lambda/
│       ├── payment_validation.py      # Payment validation handler
│       ├── fraud_detection.py         # Fraud detection handler
│       ├── transaction_processing.py  # Transaction processing handler
│       └── rotation_handler.py        # Secrets rotation handler
```

## Implementation Details

### 1. Network Security
- Security groups enforce least-privilege access
- ALB accepts HTTP/HTTPS from anywhere (0.0.0.0/0)
- Lambda functions can access internet via NAT Gateways
- RDS accepts connections only from Lambda security group
- Database subnets have no internet access

### 2. Blue-Green Deployment
The ALB listener uses weighted routing to enable zero-downtime migration:
- Initial state: Blue (90%), Green (10%)
- Gradual migration: Adjust weights incrementally
- Full cutover: Blue (0%), Green (100%)
- Rollback capability: Revert weights if issues arise

### 3. PCI Compliance Measures
- All data at rest encrypted with customer-managed KMS keys
- S3 versioning enabled for audit trail
- DynamoDB point-in-time recovery for data protection
- Audit logs retained for 90 days, then archived
- Automatic credential rotation (30 days)
- Configuration stored in Parameter Store (not hardcoded)

### 4. High Availability
- Multi-AZ deployment across 3 availability zones
- RDS read replicas for scalability
- NAT Gateways in each AZ for redundancy
- Lambda reserved concurrency prevents cold starts
- DynamoDB auto-scaling (pay-per-request)

### 5. Monitoring Strategy
- CloudWatch Dashboard provides real-time visibility
- Alarms trigger SNS notifications for critical issues
- 99th percentile latency tracking for SLA compliance
- Database performance metrics for optimization
- All Lambda functions log to CloudWatch

## Resource Naming Convention

All resources include environmentSuffix for uniqueness:
- VPC: vpc-{environmentSuffix}
- Subnets: {type}-subnet-{az-index}-{environmentSuffix}
- Lambda: {function-name}-{environmentSuffix}
- RDS: aurora-cluster-{environmentSuffix}
- DynamoDB: transactions-{environmentSuffix}
- S3: payment-audit-logs-{environmentSuffix}
- ALB: payment-alb-{environmentSuffix}
- API: payment-api-{environmentSuffix}

## Deployment Instructions

### Prerequisites
- Python 3.9 or higher
- pipenv installed
- AWS CLI configured
- CDKTF CLI installed

### Steps

1. Install dependencies:
```bash
pipenv install
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
```

3. Synthesize Terraform configuration:
```bash
pipenv run cdktf synth
```

4. Deploy infrastructure:
```bash
pipenv run cdktf deploy
```

5. Verify deployment:
```bash
# Check outputs
pipenv run cdktf output

# Test API endpoint
curl $(pipenv run cdktf output api_endpoint)
```

### Destroy Infrastructure

```bash
pipenv run cdktf destroy
```

All resources are created with force_destroy/skip_final_snapshot enabled for easy cleanup during testing.

## Outputs

The stack provides these outputs for operations:

- **vpc_id**: VPC identifier for networking configurations
- **aurora_endpoint**: Database connection endpoint
- **api_endpoint**: API Gateway invoke URL
- **alb_dns_name**: Load balancer DNS name
- **transactions_table**: DynamoDB table name
- **audit_bucket**: S3 bucket name for audit logs

## Cost Optimization

The implementation uses serverless and pay-per-request services:
- Aurora Serverless v2: Min 0.5 ACU (cost-effective for variable workloads)
- Lambda: Pay per invocation (no idle costs)
- DynamoDB: Pay per request (no provisioned capacity)
- NAT Gateways: Most expensive component (consider alternatives for cost reduction)

## Testing Considerations

For the QA agent:
1. Verify all 10 AWS services are created
2. Test blue-green weighted routing behavior
3. Validate encryption with KMS keys
4. Confirm S3 lifecycle policy transitions to Glacier
5. Trigger CloudWatch alarms and verify SNS notifications
6. Test Secrets Manager rotation
7. Verify Lambda functions can access DynamoDB and S3
8. Confirm VPC Link connectivity between API Gateway and ALB
9. Test multi-AZ failover scenarios
10. Validate Parameter Store values are correct

## PCI Compliance Checklist

- [x] Encryption at rest (KMS customer-managed keys)
- [x] Encryption in transit (VPC Link, HTTPS)
- [x] Audit logging (S3 with 90-day retention)
- [x] Secure credential storage (Secrets Manager)
- [x] Automatic credential rotation (30 days)
- [x] Data backup and recovery (RDS backups, DynamoDB PITR)
- [x] Network segmentation (isolated database subnets)
- [x] Access control (security groups, IAM least privilege)
- [x] Monitoring and alerting (CloudWatch alarms, SNS)
- [x] Change tracking (S3 versioning)

## Summary

This implementation provides a production-ready payment processing infrastructure with:
- 10 AWS services fully implemented
- Zero-downtime migration capability (blue-green deployment)
- PCI compliance measures
- Multi-AZ high availability
- Comprehensive monitoring and alerting
- Automatic secrets rotation
- Cost-optimized serverless architecture
- All resources include environmentSuffix for testing
- Complete documentation and deployment instructions

The infrastructure is ready for QA validation and testing.
