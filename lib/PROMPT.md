# Infrastructure as Code Task

## Platform and Language
**CRITICAL REQUIREMENT**: This task MUST be implemented using **CDK** with **TypeScript**.

## Task Description

Create a CDK TypeScript program to deploy a multi-region disaster recovery architecture for a PostgreSQL database. The configuration must: 1. Deploy RDS PostgreSQL instances with cross-region read replicas between us-east-1 and us-east-2. 2. Configure automated backups with point-in-time recovery enabled in both regions. 3. Implement Route53 health checks and failover routing policies for database endpoints. 4. Deploy Lambda functions to monitor replication lag and trigger alerts when thresholds exceed 5 minutes. 6. Configure EventBridge rules to orchestrate automated failover procedures. 7. Implement IAM roles with least-privilege access for all disaster recovery operations. 8.

## Background

A financial services company requires a disaster recovery solution for their critical PostgreSQL database that processes payment transactions. The system must maintain RPO of under 1 hour and RTO of under 4 hours, with automated failover capabilities between us-east-1 (primary) and us-east-2 (DR).

## Environment Setup

Multi-region AWS deployment spanning us-east-1 (primary) and us-east-2 (disaster recovery). Infrastructure includes RDS PostgreSQL 14 with Multi-AZ deployments, cross-region read replicas, Route53 failover routing, S3 buckets with versioning and replication, Lambda functions for monitoring, and EventBridge for orchestration. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with credentials for both regions. VPCs in each region with private subnets for database instances, VPC peering for cross-region communication, and NAT gateways for Lambda outbound traffic. KMS keys in each region for encryption at rest.

## Requirements and Constraints

1. RDS instances must use db.r6g.xlarge instance class with encrypted storage using customer-managed KMS keys
2. Read replica lag monitoring must trigger SNS notifications when lag exceeds 300 seconds
3. Route53 health checks must verify both database connectivity and replication status before marking endpoints as healthy
4. S3 replication must complete within 15 minutes for objects under 5GB with replication metrics enabled
5. Lambda functions must be deployed in private subnets with VPC endpoints for AWS service access
6. All inter-region traffic must use AWS PrivateLink or VPC peering with encryption in transit
7. CloudWatch alarms must have composite alarms that consider multiple failure scenarios before triggering failover
8. CDK stacks must use cross-stack references to share resources between regions without hardcoding values


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
