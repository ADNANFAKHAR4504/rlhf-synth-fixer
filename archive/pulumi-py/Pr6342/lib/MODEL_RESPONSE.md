# Serverless Transaction Processing System

Complete implementation using **Pulumi with Python** for a PCI-compliant, serverless transaction processing system deployed in us-east-2.

## Architecture Summary

The system processes millions of daily transactions through:
- API Gateway with AWS WAF and API key authentication
- 3 Lambda functions (validation, fraud detection, failed transaction handling)
- VPC with 3 private subnets (us-east-2a/b/c) and VPC endpoints (no NAT gateways)
- 2 DynamoDB tables (merchant configs, processed transactions)
- SQS with DLQ for reliable message processing
- SNS for fraud alerts
- CloudWatch monitoring with alarms and dashboard
- KMS encryption for all data at rest
- X-Ray tracing for distributed tracing

All resources include environment_suffix for uniqueness.

## Implementation Files

The implementation consists of 4 files totaling 1,393 lines of Python code.
