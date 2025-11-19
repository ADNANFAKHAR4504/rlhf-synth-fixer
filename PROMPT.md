# Task: Secure Transaction Processing Pipeline

## Problem Statement

Create a CloudFormation template to deploy a secure transaction processing pipeline for financial data analytics.

MANDATORY REQUIREMENTS (Must complete):
1. Create a KMS key with automatic rotation enabled for encrypting all resources (CORE: KMS)
2. Deploy Lambda function with 1GB memory in private subnets to process transactions
3. Configure DynamoDB table with encryption using the KMS key and point-in-time recovery (CORE: DynamoDB)
4. Set up Kinesis Data Streams with server-side encryption using KMS (CORE: Kinesis)
5. Create VPC endpoints for DynamoDB, Lambda, and KMS services
6. Configure CloudWatch Logs group with KMS encryption and 90-day retention
7. Implement IAM roles with explicit permissions - no wildcards allowed
8. Define security groups allowing only required traffic between components
9. Enable AWS Config rules to monitor encryption compliance
10. Add CloudFormation stack termination protection parameter (default: false)

OPTIONAL ENHANCEMENTS (If time permits):
• Add AWS Secrets Manager for API keys rotation (OPTIONAL: Secrets Manager) - automates credential management
• Implement AWS GuardDuty for threat detection (OPTIONAL: GuardDuty) - adds security monitoring
• Configure AWS Security Hub for compliance dashboard (OPTIONAL: Security Hub) - centralizes security findings

Expected output: A CloudFormation YAML template that creates a fully encrypted, network-isolated transaction processing pipeline meeting all security requirements with comprehensive audit logging.

## Background

A financial services company requires a secure data processing environment for customer transaction analytics. The infrastructure must meet strict compliance requirements including encryption at rest, in transit, and comprehensive audit logging. All resources must be deployed with least-privilege access controls and network isolation.

## Environment

Secure multi-AZ deployment in us-east-1 for financial transaction processing. Uses Lambda for compute, DynamoDB for storage, and Kinesis Data Streams for real-time analytics. Requires CloudFormation YAML with AWS CLI 2.x configured. VPC spans 3 availability zones with private subnets only. No internet gateway - all AWS service access via VPC endpoints. KMS encryption mandatory for all data. CloudWatch Logs for audit trail with 90-day retention. Separate development account for testing before production deployment.

## Constraints

All data must be encrypted using AWS KMS with customer-managed keys (CMK) | Lambda functions must use VPC endpoints for AWS service access without internet routing | DynamoDB tables must have point-in-time recovery enabled | All IAM roles must follow least-privilege principle with no wildcard permissions | Security groups must explicitly define all ingress/egress rules with no 0.0.0.0/0 ranges | CloudWatch Logs must have encryption enabled using KMS | All resources must have deletion protection disabled for testing environments
