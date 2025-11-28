# Failure Recovery Automation

> **️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to implement an active-passive disaster recovery architecture for a transaction processing system. The configuration must:

1. Deploy Aurora Global Database with a primary cluster in us-east-1 and secondary in us-west-2.
2. Configure Route 53 health checks monitoring the primary ALB endpoint every 30 seconds.
3. Set up failover routing policy switching to secondary region within 5 minutes of primary failure.
4. Create S3 buckets in both regions with cross-region replication and versioning enabled.
5. Deploy Lambda@Edge functions for intelligent request routing based on region health.
6. Implement EventBridge rules to replicate critical events between regions.
7. Configure CloudWatch alarms for database lag monitoring with SNS notifications.
8. Set up automated Aurora backtrack for point-in-time recovery capabilities.
9. Create IAM roles with cross-region assume permissions for failover automation.
10. Enable Aurora Performance Insights with 7-day retention in both regions.

**Expected output**: A Pulumi TypeScript program that deploys a complete multi-region disaster recovery solution with automated failover capabilities, health monitoring, and data replication ensuring business continuity with minimal data loss.

## Background

A financial services company requires a disaster recovery solution for their critical transaction processing system. After a recent regional outage affected their primary site, they need to implement automated failover capabilities with RTO under 5 minutes and RPO under 1 minute.

## Environment Details

Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary). Deployment includes Aurora Global Database with PostgreSQL 15.4 engine, Application Load Balancers in both regions, Lambda@Edge for intelligent routing, S3 buckets with cross-region replication, and EventBridge for event synchronization. VPCs in both regions with 3 private subnets each, VPC peering connection between regions. Requires Pulumi CLI 3.x, TypeScript 5.x, Node.js 18+, and AWS credentials with multi-region permissions. Infrastructure monitors transaction processing workloads with sub-second latency requirements.

## Constraints and Requirements

- Use Route 53 health checks with failover routing policy and alarm threshold of 2 failed checks
- Configure Aurora Global Database with automated backtrack enabled for 72 hours
- Implement Lambda@Edge functions for request routing with 128MB memory allocation
- Set up cross-region replication for all S3 buckets with RTC (Replication Time Control) enabled
- Use EventBridge cross-region event replication with DLQ retry policy of 3 attempts

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Regions
Primary region: **us-east-1**
Secondary region: **us-west-2**

## Success Criteria
- Infrastructure deploys successfully in both regions
- Aurora Global Database replication is functional
- Route 53 health checks and failover routing configured correctly
- S3 cross-region replication with RTC enabled
- Lambda@Edge functions deployed and functional
- EventBridge cross-region replication working
- CloudWatch alarms configured for database lag
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- RTO target < 5 minutes achievable
- RPO target < 1 minute achievable
