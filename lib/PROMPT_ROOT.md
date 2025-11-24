# Task: Multi-Region Disaster Recovery Solution

## Problem Statement

Create a Pulumi TypeScript program to implement a multi-region disaster recovery solution for a critical database workload.

## Context

A financial services company needs disaster recovery capabilities for their trading platform database. They require automatic failover between regions with minimal data loss and downtime. The solution must handle database replication, DNS failover, and backup synchronization across regions.

## Setup Requirements

Multi-region AWS deployment spanning us-east-1 (primary) and eu-west-1 (secondary) for disaster recovery. Uses RDS Aurora Global Database for data replication, Route 53 for DNS failover, and S3 for backup synchronization. Requires Pulumi CLI 3.x with TypeScript, AWS CLI configured with credentials for both regions. VPCs in each region with private subnets for RDS, public subnets for ALBs. VPC peering connection enables secure cross-region traffic. CloudWatch monitors replication lag and triggers automated responses.

## MANDATORY REQUIREMENTS (Must Complete)

1. Deploy RDS Aurora Global Database with primary cluster in us-east-1 and secondary in eu-west-1 (CORE: RDS Aurora)
2. Configure Route 53 health checks and failover routing between regions (CORE: Route 53)
3. Implement S3 cross-region replication for database backups between us-east-1 and eu-west-1 buckets (CORE: S3)
4. Set up CloudWatch alarms for replication lag exceeding 5 seconds
5. Create Lambda functions in both regions to test database connectivity
6. Configure automatic backups with 7-day retention and point-in-time recovery
7. Implement IAM roles with cross-region assume role permissions for failover automation
8. Tag all resources with Environment=production and DisasterRecovery=enabled
9. Enable deletion protection on production resources but allow programmatic override
10. Configure VPC peering between regions for secure replication traffic

## OPTIONAL ENHANCEMENTS (If Time Permits)

- Add AWS Backup for centralized backup management (OPTIONAL: AWS Backup) - provides unified backup policies
- Implement EventBridge rules for automated failover triggers (OPTIONAL: EventBridge) - enables event-driven recovery
- Add for cross-region configuration sync (OPTIONAL: ) - centralizes configuration management

## Constraints

- RDS Aurora clusters must use r6g.large instances with encrypted storage using AWS managed keys
- Route 53 health checks must evaluate both database connectivity and replication lag before triggering failover
- S3 buckets must use versioning and lifecycle policies to retain backups for exactly 30 days
- All inter-region traffic must traverse VPC peering connections, not public internet
- Pulumi stack exports must include primary and secondary database endpoints, S3 bucket names, and Route 53 hosted zone ID

## Expected Output

A Pulumi TypeScript program that creates a fully functional multi-region disaster recovery infrastructure with automated health monitoring and failover capabilities. The solution should demonstrate RPO under 1 minute and RTO under 5 minutes.
