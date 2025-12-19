# Infrastructure Task: Observability Stack for Multi-Account Payment Processing System

## Platform and Language

**MANDATORY CONSTRAINTS (NON-NEGOTIABLE):**
- Platform: **AWS CDK**
- Language: **Python**

## Background

A fintech startup is experiencing intermittent performance issues with their payment processing system. They need comprehensive observability across their AWS infrastructure to identify bottlenecks and ensure compliance with financial regulations requiring detailed audit trails.

## Environment

Production environment deployed in us-east-1 with Lambda functions for payment processing, API Gateway for REST endpoints, DynamoDB for transaction records, and SQS for message queuing. The infrastructure spans three AWS accounts: development (123456789012), staging (234567890123), and production (345678901234). Requires Python 3.9+, AWS CDK 2.100+, and AWS CLI configured with appropriate cross-account permissions. VPC endpoints are configured for private communication with AWS services.

## Problem Statement

Create a CDK Python program to deploy an observability stack for a multi-account payment processing system. The configuration must:

1. Set up CloudWatch Log Groups with 90-day retention and KMS encryption for Lambda, API Gateway, and DynamoDB services.
2. Enable AWS X-Ray tracing on all Lambda functions and API Gateway stages with sampling rate of 0.1.
3. Create a CloudWatch dashboard displaying Lambda invocation metrics, API Gateway latency, DynamoDB read/write capacity, and SQS queue depth.
4. Define custom CloudWatch metrics for payment success rate, average transaction value, and fraud detection triggers.
5. Configure CloudWatch Synthetics canaries to monitor /health and /api/v1/process-payment endpoints every 5 minutes.
6. Set up CloudWatch alarms for Lambda errors > 1%, API Gateway 4XX errors > 5%, DynamoDB throttles > 0, and SQS DLQ messages > 10.
7. Create SNS topics for critical (P1) and warning (P2) alerts with email subscriptions to ops@company.com and SMS to on-call phone.
8. Implement CloudWatch Logs Insights queries for common troubleshooting scenarios saved as query definitions.
9. Configure EventBridge rules to capture AWS service events and forward to the central monitoring account.
10. Set up CloudWatch Contributor Insights rules to identify top API consumers and error-prone Lambda functions.

## Expected Output

A CDK Python application with separate stacks for each monitoring component, using CDK best practices for cross-stack references and parameter passing. The solution should include proper IAM roles for cross-account access, stack outputs for dashboard URLs and alarm ARNs, and comprehensive tagging for cost allocation.

## Mandatory Constraints

1. CloudWatch Logs retention must be 90 days for compliance
2. All logs must be encrypted using KMS customer-managed keys
3. Use AWS X-Ray for distributed tracing across all compute services

## Optional Enhancements

1. Implement custom CloudWatch metrics for business KPIs
2. Use CloudWatch Synthetics for endpoint monitoring
3. Configure SNS topics for critical alerts with email and SMS subscriptions
4. Set up cross-account log aggregation to a central monitoring account

## Infrastructure Requirements

- ALL resource names MUST include environment suffix: `{resource-name}-${environment_suffix}`
- Resources MUST be destroyable (no RETAIN policies)
- Include comprehensive monitoring and alerting
- Follow AWS Well-Architected Framework best practices
- Implement proper security controls (encryption, least-privilege IAM)
- Use appropriate resource tagging for cost allocation

## Success Criteria

1. All infrastructure deploys successfully without errors
2. Unit tests achieve 100% coverage
3. Integration tests validate deployed resources
4. Documentation is complete and accurate
5. Code follows platform-specific best practices
6. Training quality score >= 8/10
