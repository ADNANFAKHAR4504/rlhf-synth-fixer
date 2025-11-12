# Multi-Region Disaster Recovery Infrastructure

## Platform and Language

**CRITICAL**: This task MUST use **Pulumi with TypeScript** (per metadata.json).

Note: Task description mentions Go, but CSV specifies TypeScript. Platform/language from CSV takes precedence per platform_enforcement.md.

## Task Description

Create a Pulumi TypeScript program to implement a multi-region disaster recovery infrastructure with automated failover capabilities.

## Requirements

The configuration must:

1. Set up VPCs in both us-east-1 and us-east-2 with 3 AZs each and establish VPC peering
2. Deploy an RDS Aurora Global Database cluster with a primary cluster in us-east-1 and secondary in us-east-2
3. Create DynamoDB global tables for session data replication across regions
4. Configure Auto Scaling groups in both regions with identical launch configurations
5. Deploy Application Load Balancers in each region with target groups pointing to the Auto Scaling groups
6. Implement Route53 hosted zone with health check-based routing policies for automatic failover
7. Set up CloudWatch metric streams to replicate metrics from primary to DR region
8. Configure AWS Backup plans for automated RDS snapshots with cross-region copying
9. Create CloudWatch alarms for monitoring database lag, replication status, and health check failures
10. Implement Lambda functions for automated failover orchestration and notification
11. Configure SNS topics in both regions for alerting on failover events
12. Output the primary and DR endpoint URLs, health check status, and replication lag metrics

## Expected Output

The program should create a fully automated disaster recovery setup where traffic automatically fails over to us-east-2 when us-east-1 experiences issues, with database replication lag under 1 second and DNS failover completing within 5 minutes.

## Background

A financial services company requires a highly available disaster recovery solution for their critical payment processing system. The system must automatically failover to a secondary region within minutes of detecting a regional outage, with minimal data loss and automated health checks.

## Environment

Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-east-2 (DR). Utilizes RDS Aurora Global Database for PostgreSQL 14.x, DynamoDB global tables for session management, Auto Scaling groups with EC2 t3.medium instances, Application Load Balancers in each region, and Route53 for DNS failover. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate IAM permissions for multi-region deployments. VPCs in both regions with 3 availability zones each, private subnets for databases, public subnets for ALBs, and VPC peering for cross-region communication.

## Constraints

- RPO (Recovery Point Objective) must be under 1 minute
- Implement cross-region RDS Aurora Global Database
- All resources must be tagged with Environment and DR-Role tags
- Use Route53 health checks for automatic DNS failover
- RTO (Recovery Time Objective) must be under 5 minutes
- Deploy identical Auto Scaling groups in both regions
- Use AWS Backup for automated snapshot management
- Implement CloudWatch cross-region metric streams
- Primary region must be us-east-1 and DR region must be us-east-2
- Use DynamoDB global tables for session data

## AWS Services

- VPC (Virtual Private Cloud)
- RDS Aurora Global Database
- DynamoDB Global Tables
- Auto Scaling Groups
- Application Load Balancer
- Route 53
- CloudWatch
- AWS Backup
- Lambda
- SNS
- Secrets Manager (for RDS credentials)
- KMS (for encryption)
- EventBridge (for Lambda triggers)
- Kinesis Firehose (for metric streaming)

## Regions

- Primary: us-east-1
- DR: us-east-2

## Implementation Notes

### Resource Versioning (v2)

This implementation uses a **v2 naming suffix** for all database resources to support:

- **Blue-Green Deployments**: Enable side-by-side deployment of new versions
- **Zero-Downtime Migrations**: Allow data migration without service interruption
- **State Management**: Avoid infrastructure-as-code state conflicts
- **Production Testing**: Validate new resources before cutover

All database-related resources follow the pattern: `{resource-name}-v2-{environment}`

Examples:
- Secrets Manager: `db-password-v2-dev`
- RDS Clusters: `primary-db-cluster-v2-dev`, `dr-db-cluster-v2-dev`
- DynamoDB: `session-table-v2-dev`

For migration procedures and best practices, refer to `MIGRATION.md` in the implementation.
