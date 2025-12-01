# E-Commerce Product Catalog Data Pipeline

AWS CDK infrastructure for processing real-time inventory updates for an e-commerce platform.

## Architecture Overview

This solution implements a scalable data pipeline that:
- Ingests real-time inventory updates via Amazon Kinesis Data Streams
- Processes updates using AWS Lambda
- Stores product catalog in Amazon RDS PostgreSQL
- Caches frequently accessed data in Amazon ElastiCache Redis
- Archives all updates to Amazon S3 for 3-year compliance retention

## AWS Services Used

- **Amazon Kinesis Data Streams**: Stream processing for inventory updates
- **AWS Lambda**: Event-driven data processing
- **Amazon RDS PostgreSQL**: Relational database for product catalog
- **Amazon ElastiCache Redis**: In-memory cache for performance
- **Amazon S3**: Long-term archival storage with lifecycle policies
- **AWS Secrets Manager**: Secure credential management
- **Amazon VPC**: Network isolation and security
- **AWS IAM**: Access control and permissions
- **Amazon CloudWatch**: Logging and monitoring

## Project Structure

```
lib/
├── PROMPT.md              # Requirements document (human-style)
├── MODEL_RESPONSE.md      # Generated infrastructure code (with issues)
├── IDEAL_RESPONSE.md      # Correct implementation
├── MODEL_FAILURES.md      # Documentation of intentional issues
├── tap_stack.py           # Main CDK stack
├── lambda/
│   └── inventory_processor.py  # Stream processing function
└── README.md              # This file
```

## Training Material

This implementation includes intentional issues for training purposes:

### Critical Issues
1. Missing environmentSuffix in all resource names
2. RemovalPolicy.RETAIN on S3 bucket (should be DESTROY)
3. RDS deletion_protection=True (should be False)
4. RDS RemovalPolicy.SNAPSHOT (should be DESTROY)
5. Hardcoded credentials in Lambda code

### High-Priority Issues
6. RDS backup retention enabled
7. ElastiCache snapshot retention enabled
8. Inline Lambda code (should be from file)
9. Missing IAM permissions for Kinesis and Secrets Manager
10. Lambda not deployed in VPC
11. No security group ingress rules
12. No error handling in Lambda
13. Base64 encoding not handled

### Medium-Priority Issues
14. CloudWatch Log Group with RETAIN policy
15. No event source error configuration
16. Missing S3 lifecycle expiration
17. Missing encryption configuration
18. No database schema initialization

See `MODEL_FAILURES.md` for detailed analysis of all 20 issues.

## Deployment Requirements

This infrastructure must satisfy:
- All resources include environmentSuffix for unique naming
- All resources are fully destroyable (no retention policies)
- Process 1000+ inventory updates per minute
- 3-year data retention for compliance
- Deploy exclusively in us-east-1 region
- Secure credential management
- Proper error handling and logging

## Prerequisites

- AWS CLI configured
- AWS CDK CLI installed: `npm install -g aws-cdk`
- Python 3.8 or higher
- CDK environment bootstrapped in us-east-1

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Synthesize CloudFormation template:
```bash
cdk synth
```

3. Deploy the stack:
```bash
cdk deploy --parameters environmentSuffix=dev
```

## Testing

Send test inventory update to Kinesis:

```bash
aws kinesis put-record \
    --stream-name inventory-updates-dev \
    --partition-key product123 \
    --data '{"product_id": "product123", "inventory": 100, "price": 29.99}'
```

## Compliance

All inventory updates are archived to S3 with:
- 3-year retention (1095 days)
- Automatic lifecycle transitions to Glacier after 90 days
- Encryption at rest
- Organized by date for easy retrieval

## Cleanup

```bash
cdk destroy
```

Note: The MODEL_RESPONSE implementation has issues that prevent clean destruction. See IDEAL_RESPONSE for the correct implementation with proper RemovalPolicy.DESTROY settings.

## Next Steps

This code is ready for the QA phase (iac-infra-qa-trainer) where:
1. Issues will be identified and documented
2. Fixes will be proposed and validated
3. Tests will be generated
4. Final validation will ensure deployment readiness
