# Task: Environment Migration - Payment Processing System

## Overview

A fintech startup is migrating their payment processing infrastructure from a legacy on-premises datacenter to AWS. The existing system handles 50,000 transactions daily with strict compliance requirements for PCI-DSS. The migration must be performed with zero downtime using a blue-green deployment strategy.

**Platform: Pulumi with TypeScript**

## Requirements

Create a Pulumi TypeScript program to migrate a payment processing system from on-premises infrastructure to AWS using a blue-green deployment approach. The configuration must:

1. Set up separate VPCs for blue (current) and green (new) environments connected via Transit Gateway
2. Deploy Aurora PostgreSQL clusters in both environments with automated failover capabilities
3. Configure ECS Fargate services with task definitions for payment API, transaction processor, and reporting service
4. Implement Application Load Balancers with path-based routing and health checks for each service
5. Create S3 buckets with versioning and lifecycle policies for transaction logs and compliance documents
6. Set up DynamoDB tables with global secondary indexes for session management and API rate limiting
7. Configure AWS WAF rules to protect against SQL injection and cross-site scripting attacks
8. Implement CloudWatch dashboards showing transaction metrics, error rates, and system performance
9. Create Lambda functions for data migration tasks that sync from blue to green environment
10. Set up SNS topics and CloudWatch alarms for monitoring migration progress and system health
11. Configure Route 53 weighted routing policies for gradual traffic shifting between environments
12. Implement IAM roles with least privilege access for all services and cross-account assumptions

## Technical Specifications

Blue-green deployment infrastructure in us-east-1 region for migrating payment processing system from on-premises to AWS. Uses Aurora PostgreSQL 14.6 for transaction data, ECS Fargate for containerized microservices, Application Load Balancer with WAF protection, S3 for encrypted document storage, and DynamoDB for session management. Requires Pulumi 3.x with TypeScript, Node.js 18+, AWS CLI v2 configured with appropriate IAM permissions. Multi-AZ VPC with private subnets across 3 availability zones, Transit Gateway for network isolation, VPC endpoints for AWS services. Staging environment mirrors production with reduced capacity for validation testing before cutover.

## Constraints and Security Requirements

- Use AWS Systems Manager Parameter Store for non-sensitive configuration
- Implement AWS Secrets Manager rotation for database credentials every 30 days
- Configure S3 bucket policies to enforce SSL/TLS for all requests
- Configure VPC endpoints for S3 and DynamoDB to avoid internet routing
- Use AWS Transit Gateway for network isolation between environments
- Implement AWS Config rules to monitor compliance with security policies
- Implement CloudWatch Logs retention of 90 days for audit compliance
- Use AWS WAF with rate limiting rules on the ALB
- Deploy Aurora PostgreSQL with encryption at rest using customer-managed KMS keys
- Deploy in at least 3 availability zones for high availability

## Expected Output

A complete Pulumi program that creates both blue and green environments with all specified services, monitoring, and security configurations. The program should include stack outputs for ALB endpoints, database connection strings, and a migration status dashboard URL. The solution must support incremental data sync and allow rollback to the blue environment if issues arise during migration.

## Deliverables

- Working Pulumi TypeScript code in `lib/index.ts`
- All necessary configuration files
- Stack outputs for endpoints and connection strings
- Migration status dashboard URL
- Support for incremental sync and rollback capability