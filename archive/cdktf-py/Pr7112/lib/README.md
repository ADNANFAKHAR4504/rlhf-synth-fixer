# Healthcare Platform Multi-Region Disaster Recovery

## Overview

This CDKTF Python application deploys a complete multi-region disaster recovery infrastructure for a healthcare SaaS platform across AWS us-east-1 (primary) and us-west-2 (secondary) regions.

## Critical Deployment Fixes Applied

All 5 deployment fixes have been applied to resolve previous deployment errors:

1. **IAM Role Policy Attachments** (FIX #1): Using `role=lambda_role.name` instead of `role=lambda_role.arn`
2. **Lambda Environment Variables** (FIX #2): NOT setting AWS_REGION (automatically available)
3. **Route53 Domain** (FIX #3): Using `healthcare-dr-{environmentSuffix}.com` instead of example.com
4. **VPC Route Tables** (FIX #4): All routes specify `destination_cidr_block="0.0.0.0/0"`
5. **S3 Replication** (FIX #5): Versioning enabled on destination bucket BEFORE replication config

## Architecture

### Components

1. **DynamoDB Global Tables**
   - patient_records table with automatic replication
   - audit_logs table for compliance tracking
   - Point-in-time recovery enabled on all tables

2. **Lambda Functions**
   - API endpoints in both regions
   - 3GB memory, 30-second timeout
   - Cross-region IAM permissions
   - VPC integration for security

3. **S3 Cross-Region Replication**
   - Medical documents bucket in each region
   - Automatic replication from primary to secondary
   - KMS encryption at rest with force_destroy=True

4. **Route 53 DNS Failover**
   - Weighted routing: 70% primary, 30% secondary
   - Health checks with 3-failure threshold
   - Automatic failover on region failure

5. **KMS Encryption**
   - Customer-managed keys in both regions
   - Automatic key rotation enabled
   - Cross-region access policies

6. **Monitoring**
   - CloudWatch dashboards in both regions
   - Alarms for critical thresholds
   - SNS notifications for failover events

7. **Networking**
   - VPCs in both regions with 3 availability zones
   - VPC peering for cross-region communication
   - Security groups for Lambda functions

## Prerequisites

- Python 3.9+
- CDKTF 0.20+
- AWS CLI configured with appropriate credentials
- Node.js 18+ (for CDKTF)

## Installation

```bash
# Install CDKTF CLI
npm install -g cdktf-cli

# Install Python dependencies
pip install -r requirements.txt

# Install provider bindings
cdktf get
```

## Deployment

```bash
# Set environment suffix for unique resource naming
export CDKTF_CONTEXT_environmentSuffix="prod-dr-001"

# Initialize CDKTF
cdktf init

# Preview changes
cdktf plan

# Deploy all stacks
cdktf deploy --auto-approve

# Deploy specific stack
cdktf deploy healthcare-dr-primary --auto-approve
```

## Configuration

### Environment Variables

- `CDKTF_CONTEXT_environmentSuffix`: Unique suffix for resource naming (required)

### Context in cdktf.json

```json
{
  "context": {
    "environmentSuffix": "prod-dr-001"
  }
}
```

## Testing

```bash
# Validate DynamoDB global tables
aws dynamodb describe-table --table-name healthcare-patient-records-prod-dr-001 --region us-east-1

# Check S3 replication status
aws s3api get-bucket-replication --bucket healthcare-medical-docs-primary-prod-dr-001

# Verify Route 53 health checks
aws route53 list-health-checks

# Test Lambda functions
aws lambda invoke --function-name healthcare-dr-api-primary-prod-dr-001 response.json --region us-east-1
```

## Monitoring

### CloudWatch Dashboards

- Primary: `healthcare-dr-primary-{environmentSuffix}`
- Secondary: `healthcare-dr-secondary-{environmentSuffix}`

### Key Metrics

- Lambda invocations and errors
- S3 replication lag
- DynamoDB replication lag
- Route 53 health check status

### Alarms

- Lambda error rate exceeds threshold
- Health check failures trigger SNS notifications

## Disaster Recovery

### RTO: Under 5 minutes
- Route 53 health checks evaluate every 30 seconds
- 3 consecutive failures trigger automatic failover
- DNS TTL set to 60 seconds for fast propagation

### RPO: Under 1 minute
- DynamoDB global tables replicate in near real-time
- S3 replication typically completes within 15 minutes for most objects

### Failover Process

1. Primary region becomes unhealthy
2. Route 53 health check detects 3 consecutive failures
3. Traffic automatically routes to secondary region
4. SNS notifications alert operations team
5. CloudWatch dashboards show failover metrics

## Cleanup

```bash
# Destroy all resources
cdktf destroy --auto-approve

# Destroy specific stack
cdktf destroy healthcare-dr-primary --auto-approve
```

## Security

- All data encrypted at rest with KMS customer-managed keys
- Key rotation enabled for compliance
- IAM roles follow principle of least privilege
- VPC isolation for Lambda functions
- Security groups restrict network access

## Compliance

- HIPAA-compliant encryption
- Point-in-time recovery for data protection
- Audit logs for compliance tracking
- All resources tagged for governance

## Troubleshooting

### Common Issues

1. **Lambda deployment fails**: Ensure lambda_function.zip exists
2. **S3 replication not working**: Verify versioning enabled on both buckets
3. **Route53 health check fails**: Check Lambda health endpoint implementation
4. **VPC peering issues**: Verify CIDR blocks don't overlap
5. **IAM policy attachment fails**: Ensure using role.name not role.arn

### Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/healthcare-dr-api-primary-prod-dr-001 --follow

# CloudWatch insights
aws logs start-query --log-group-name /aws/lambda/healthcare-dr-api-primary-prod-dr-001
```

## File Structure

```
├── main.py                      # Application entry point
├── cdktf.json                   # CDKTF configuration
├── requirements.txt             # Python dependencies
├── lambda_function.zip          # Lambda deployment package
├── lib/
│   ├── __init__.py
│   ├── PROMPT.md               # Requirements specification
│   ├── MODEL_RESPONSE.md       # Generated code documentation
│   ├── README.md               # This file
│   ├── stacks/
│   │   ├── __init__.py
│   │   ├── primary_stack.py    # us-east-1 resources
│   │   ├── secondary_stack.py  # us-west-2 resources
│   │   └── global_stack.py     # Global resources (DynamoDB, Route53)
│   └── lambda/
│       └── api_handler.py      # Lambda function code
```

## Support

For issues or questions, consult:
- AWS CDKTF Documentation: https://developer.hashicorp.com/terraform/cdktf
- AWS Multi-Region Architecture: https://aws.amazon.com/solutions/implementations/
- Deployment Fixes Reference: See MODEL_RESPONSE.md for details on all 5 fixes
