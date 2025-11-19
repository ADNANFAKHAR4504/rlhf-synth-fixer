# Serverless Transaction Processing System

A comprehensive serverless architecture for processing financial transactions with fraud detection capabilities, WAF protection, and full observability.

## Architecture Overview

This system implements a fully serverless transaction processing pipeline with the following components:

### Core Services
- **API Gateway**: REST API with `/transaction` POST endpoint
  - Protected by API key authentication
  - Integrated with AWS WAF for security
  - X-Ray tracing enabled
  - Access logging to CloudWatch
- **Lambda Functions** (all deployed in VPC with X-Ray tracing):
  - **Transaction Validator**: Validates transactions against merchant configurations (512MB, 60s timeout, 100 reserved concurrency)
  - **Fraud Detector**: Performs fraud detection using pattern analysis (512MB, 60s timeout)
  - **Failed Transaction Handler**: Processes failed transactions from DLQ (512MB, 60s timeout)
- **DynamoDB Tables**:
  - **Merchant Configurations**: Stores merchant settings and limits
  - **Transactions**: Stores processed transactions with fraud analysis (includes GSI for merchant queries)
- **SQS Queues**:
  - Valid Transactions Queue (300s visibility timeout, 14-day retention)
  - Dead Letter Queue (14-day retention)
- **SNS Topic**: Fraud detection alerts with email subscription
- **CloudWatch**: Comprehensive monitoring, logging, and alerting
- **AWS WAF**: WebACL with managed rule sets protecting API Gateway
- **VPC Infrastructure**: Private subnets across 3 AZs with VPC endpoints (no NAT gateway)
- **KMS**: Customer-managed keys for all data at rest encryption

## Prerequisites

- Pulumi CLI 3.x or later
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

1. Install dependencies: