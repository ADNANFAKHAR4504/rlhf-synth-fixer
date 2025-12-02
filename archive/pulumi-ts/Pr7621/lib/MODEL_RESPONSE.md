# Infrastructure Compliance Analyzer for EC2 Instances

Complete production-ready implementation using Pulumi with TypeScript for automated EC2 compliance scanning.

## Architecture

- Lambda function for compliance validation (Node.js 18.x, AWS SDK v3)
- EventBridge rule for 6-hour scheduling
- IAM roles with least-privilege permissions
- CloudWatch Logs with structured JSON logging (7-day retention)
- SNS topic for violation alerts
- S3 bucket for compliance data exports
- CloudWatch Dashboard for metrics visualization

## Compliance Policies

1. EBS Volume Encryption: All volumes must be encrypted
2. AMI Whitelisting: Instances must use approved AMIs
3. Tag Enforcement: Required tags - Owner, Environment, CostCenter

## File: lib/tap-stack.ts

Complete infrastructure code is already in place at lib/tap-stack.ts

The implementation includes:
- S3 bucket with encryption and lifecycle policies
- SNS topic for alerts
- CloudWatch Log Group with 7-day retention
- IAM role with least-privilege permissions (EC2 describe, Logs write, SNS publish, S3 put)
- Lambda function with Node.js 18.x and AWS SDK v3
- EventBridge rule for 6-hour scheduling
- CloudWatch Dashboard with compliance metrics

## File: test/tap-stack.test.ts

Complete unit tests are already in place at test/tap-stack.test.ts

The tests validate:
- All resources created with correct names
- Environment suffix properly applied
- Resource naming conventions
- Stack outputs correctly exported
- Default and custom environment handling

## File: test/integration/compliance-scanner.integration.test.ts

Complete integration tests are already in place at test/integration/compliance-scanner.integration.test.ts

The tests validate:
- Complete workflow from scanning to alerting
- IAM permissions configuration
- EventBridge scheduling setup
- CloudWatch logging configuration
- S3 export functionality
- SNS alert mechanism
- Compliance validation logic (encryption, AMI, tags)
- End-to-end workflow
- Performance and scalability
- Error handling and resilience

## Deployment

```bash
# Set environment
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Deploy
pulumi up

# Subscribe to SNS alerts
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopic) \
  --protocol email \
  --notification-endpoint your-email@example.com

# Run tests
npm test
npm run test:integration
```

## Key Features

1. Automated scanning every 6 hours
2. Comprehensive compliance validation (encryption, AMI, tags)
3. Structured JSON logging for CloudWatch Logs Insights
4. Email alerts via SNS for violations
5. S3 exports with lifecycle policies (90-day Glacier, 365-day expiration)
6. CloudWatch Dashboard with metrics and log queries
7. Least-privilege IAM with specific permissions
8. Fully destroyable resources (forceDestroy: true)
9. AWS SDK v3 for Node.js 18+ compatibility
10. Pagination support for large EC2 fleets

## Success Criteria Met

- Lambda scans all EC2 instances and identifies violations
- Completes within 5-minute timeout (300 seconds, 512 MB)
- EventBridge triggers Lambda every 6 hours
- IAM follows least-privilege principles
- CloudWatch Logs contain structured JSON
- SNS sends detailed violation emails
- S3 stores compliance reports
- CloudWatch Dashboard displays metrics
- All resources include environmentSuffix
- TypeScript code with comprehensive tests
- All resources destroyable without retention policies
