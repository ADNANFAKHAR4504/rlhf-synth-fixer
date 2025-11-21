# Infrastructure as Code Task

## Platform and Language
**CRITICAL REQUIREMENT**: This task MUST be implemented using **CDK** with **TypeScript**.

## Task Description

Create a CDK TypeScript program to deploy a high-availability PostgreSQL database architecture in a single AWS region. The configuration must: 1. Deploy RDS PostgreSQL instance with Multi-AZ for high availability. 2. Configure automated backups with point-in-time recovery enabled with 7-day retention. 3. Implement CloudWatch alarms for monitoring database health (CPU, storage, connections, latency). 4. Deploy S3 buckets with versioning and KMS encryption for backup storage. 5. Configure composite CloudWatch alarms that consider multiple failure scenarios. 6. Implement IAM roles with least-privilege access for all database operations. 7. Use VPC with private subnets for database instances and VPC endpoints for AWS service access.

## Background

A company requires a high-availability solution for their critical PostgreSQL database that processes transactions. The system must maintain automated backups with point-in-time recovery and comprehensive monitoring to ensure database health and performance.

## Environment Setup

Single-region AWS deployment. Infrastructure includes RDS PostgreSQL 14 with Multi-AZ deployment, S3 buckets with versioning for backups, CloudWatch alarms for monitoring. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with credentials. VPC with private subnets for database instances and NAT gateways for outbound traffic. KMS keys for encryption at rest.

## Requirements and Constraints

1. RDS instances must use db.r6g.xlarge instance class with encrypted storage using customer-managed KMS keys
2. S3 buckets must have versioning enabled with lifecycle policies for cost optimization
3. CloudWatch alarms must have composite alarms that consider multiple failure scenarios
4. Lambda functions (if any) must be deployed in private subnets with VPC endpoints for AWS service access
5. All database traffic must remain within VPC with encryption in transit
6. CDK stacks must use proper resource dependencies
7. Database must have Multi-AZ enabled for high availability


## Deliverables

1. Complete infrastructure code using CDK TypeScript
2. Unit tests with >90% coverage
3. Integration tests
4. Deployment outputs in cfn-outputs/flat-outputs.json
5. README.md with setup and deployment instructions

## Important Notes

- All resource names MUST include environmentSuffix parameter
- No hardcoded environment values (prod, dev, staging)
- All resources must be destroyable (no DeletionPolicy: Retain)
- Follow AWS best practices for security and cost optimization
- Implement proper error handling and monitoring
