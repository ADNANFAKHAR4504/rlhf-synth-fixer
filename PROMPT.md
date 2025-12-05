# Task: Provisioning of Infrastructure Environments

## Problem Statement
Create a CDKTF Python program to migrate a payment processing system from on-premises to AWS while maintaining continuous operation. The configuration must:

1. Define a VPC with 3 availability zones, each containing public, private, and database subnets.
2. Create an RDS Aurora PostgreSQL cluster with automated backups and read replicas for the customer database.
3. Set up DynamoDB tables for transaction records with global secondary indexes for query optimization.
4. Deploy Lambda functions for payment validation, fraud detection, and transaction processing with VPC connectivity.
5. Configure API Gateway with request validation and VPC Link to private ALB.
6. Implement blue-green deployment using two target groups on the ALB with weighted routing.
7. Create S3 buckets for audit logs with 90-day retention and compliance archival.
8. Set up CloudWatch dashboards displaying API response times, error rates, and database performance metrics.
9. Configure SNS topics for alerting on failed transactions and system errors.
10. Implement AWS Secrets Manager rotation for database credentials with Lambda rotation function.

Expected output: A complete CDKTF Python application with stack definitions for networking, compute, storage, and monitoring resources. The code should include proper tagging for cost allocation, IAM roles with least privilege access, and CloudFormation outputs for key resource identifiers needed by the operations team.

## Background
A fintech company needs to migrate their payment processing infrastructure from a legacy on-premises setup to AWS. The existing system handles credit card transactions with strict PCI compliance requirements and must maintain zero downtime during the migration phase.

## Environment
Production-grade payment processing infrastructure deployed in us-east-1 with multi-AZ failover capabilities. Core services include API Gateway with VPC Link, ALB with target groups for blue-green deployments, Lambda functions for payment processing logic, DynamoDB for transaction records, S3 for audit logs, and RDS Aurora PostgreSQL for customer data. Requires AWS CDK 2.x with Python 3.9+, boto3, and AWS CLI configured with appropriate IAM permissions. VPC spans 3 availability zones with private subnets for compute resources and database subnets for RDS. NAT Gateways provide outbound internet access for Lambda functions in private subnets.

## Constraints
- All databases must use encrypted storage with AWS KMS customer-managed keys
- All S3 buckets must use versioning and lifecycle policies
- CloudWatch alarms must monitor API latency with 99th percentile metrics
- DynamoDB tables must have point-in-time recovery enabled
- Use AWS Systems Manager Parameter Store for all configuration values
- Implement blue-green deployment strategy for zero-downtime migration
- API Gateway must use VPC Link to connect to private ALB endpoints
- Lambda functions must use reserved concurrency to prevent cold starts
- Use AWS CDK v2 with Python 3.9 or higher

## Task Metadata
- Task ID: 62089976
- Platform: CDKTF
- Language: Python
- Difficulty: expert
- Subtask: Provisioning of Infrastructure Environments
- Subject Labels: Environment Migration
