# Task: Blue-Green Migration Strategy for Payment Processing System

## Platform & Language
**MANDATORY:** This task MUST be implemented using **Pulumi with Python**.

## Background
A financial services company needs to migrate their legacy on-premises payment processing system to AWS. The current system handles credit card transactions and requires strict compliance with PCI DSS standards. The migration must be performed with zero downtime using a blue-green deployment strategy.

## Problem Statement
Create a CloudFormation template to implement a blue-green migration strategy for a payment processing system.

## Requirements

The configuration must implement the following:

1. Define two identical environments (blue and green) with RDS Aurora clusters in private subnets
2. Create an Application Load Balancer with weighted target groups for traffic shifting
3. Configure DynamoDB tables with point-in-time recovery for session data
4. Implement CloudFormation custom resources for pre-migration data validation
5. Set up CloudWatch alarms for database connection counts and response times
6. Create Lambda functions to handle environment switching logic
7. Configure AWS Backup plans with 7-day retention for both environments
8. Implement stack outputs that display current active environment and migration status

## Environment Details
Blue-green migration infrastructure deployed in us-east-1 across 3 availability zones. Uses RDS Aurora MySQL 8.0 for transaction data and DynamoDB for session management. Requires VPC with private subnets, NAT gateways for outbound traffic, and VPC endpoints for S3 and DynamoDB. AWS account must have KMS key creation permissions and Secrets Manager access. CloudFormation stack will manage approximately 25 resources including load balancers, auto-scaling groups, and security configurations.

## Constraints

1. All data must be encrypted at rest using AWS KMS customer-managed keys
2. Database credentials must be stored in AWS Secrets Manager with automatic rotation enabled
3. The template must support rollback to the previous environment within 5 minutes
4. Network traffic between components must use VPC endpoints to avoid internet exposure
5. All resources must be tagged with Environment, CostCenter, and MigrationPhase tags
6. The template must use CloudFormation drift detection compatible resources only
7. Parameter validation must enforce naming conventions matching ^(dev|staging|prod)-payment-[a-z0-9]{8}$

## Expected Output
A CloudFormation YAML template that enables controlled migration between blue and green environments with automated rollback capabilities and comprehensive monitoring.

## Region
us-east-1 (default)

## Subject Labels
- aws
- infrastructure
- environment-migration
