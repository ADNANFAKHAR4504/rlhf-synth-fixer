# Multi-Region Disaster Recovery for Financial Transaction System

## Problem Statement

Create a Pulumi TypeScript program to implement multi-region disaster recovery for a financial transaction system. 

### MANDATORY REQUIREMENTS (Must complete):

1. Deploy RDS Aurora PostgreSQL Global Database cluster spanning us-east-1 (primary) and us-west-2 (secondary) with encryption at rest (CORE: RDS Aurora)

2. Configure Route53 health checks and failover routing policies for database endpoints with 30-second intervals (CORE: Route53)

3. Create Lambda functions in both regions to monitor replication lag and trigger alerts when lag exceeds 5 seconds (CORE: Lambda)

4. Implement cross-region VPC peering between application VPCs in both regions

5. Configure automated backups with point-in-time recovery enabled and 7-day retention

6. Set up CloudWatch alarms for database CPU above 80% and storage above 85%

7. Create IAM roles with cross-account assume role permissions for disaster recovery operations

8. Tag all resources with Environment=production and DR-Role=primary/secondary

### OPTIONAL ENHANCEMENTS (If time permits):

- Add AWS Backup for centralized backup management (OPTIONAL: AWS Backup) - provides unified backup policies
- Implement EventBridge rules for automated failover orchestration (OPTIONAL: EventBridge) - enables event-driven DR
- Add automation documents for failover procedures (OPTIONAL) - standardizes failover process

## Background Context

A fintech company requires zero-downtime database failover capabilities across regions to meet regulatory compliance for transaction processing availability. Their payment processing system must maintain 99.99% uptime with automatic failover between us-east-1 (primary) and us-west-2 (secondary) regions.

## Infrastructure Specifications

Multi-region AWS deployment spanning us-east-1 (primary) and us-west-2 (secondary) using RDS Aurora PostgreSQL Global Database, Route53 for DNS failover, Lambda for monitoring. 

**Requirements:**
- Pulumi 3.x with TypeScript
- AWS CLI configured with appropriate permissions
- VPCs in both regions with private subnets across 3 AZs each
- VPC peering for cross-region connectivity
- Aurora cluster uses db.r5.large instances with encryption enabled
- Route53 private hosted zone for internal DNS resolution

## Technical Constraints

1. Aurora Global Database must use PostgreSQL 15.x with encryption using AWS-managed KMS keys

2. Route53 health checks must evaluate both database endpoint availability and Lambda-reported replication lag

3. VPC peering connection must use non-overlapping CIDR ranges: 10.0.0.0/16 (us-east-1) and 10.1.0.0/16 (us-west-2)

4. Lambda functions must be deployed with reserved concurrent executions of 5 to prevent throttling during monitoring

5. All resources must have explicit DeletionPolicy set to prevent accidental deletion during stack updates

## Expected Output

Complete Pulumi TypeScript program that provisions a multi-region Aurora Global Database with automated health monitoring, DNS failover routing, and cross-region networking. The solution should enable sub-minute RTO for database failover scenarios.
