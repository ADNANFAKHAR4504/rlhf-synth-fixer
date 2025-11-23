# Infrastructure Task: Multi-Region Disaster Recovery Architecture

## Platform and Language
**CRITICAL REQUIREMENT**: This infrastructure MUST be implemented using **CDKTF (Cloud Development Kit for Terraform) with Python**.

## Task Description

Create a Terraform configuration to implement a multi-region disaster recovery architecture for a transaction processing system. The configuration must:

1. Set up Aurora PostgreSQL global database with one primary cluster in us-east-1 and one secondary in us-east-2.
2. Deploy identical Lambda functions in both regions that process transactions from SQS queues.
3. Configure S3 buckets in both regions with cross-region replication for transaction logs and documents.
4. Implement DynamoDB global tables for session state with on-demand billing mode.
5. Create Route 53 hosted zone with weighted routing policy and health checks for automatic regional failover.
6. Set up CloudWatch alarms in both regions monitoring Aurora lag, Lambda errors, and S3 replication metrics.
7. Configure SNS topics in each region for alarm notifications with cross-region subscriptions.
8. Implement KMS customer managed keys in each region for encrypting all resources.
9. Create VPCs in both regions with proper CIDR allocation avoiding conflicts.
10. Set up VPC peering between regions with appropriate route table updates.
11. Deploy Application Load Balancers in both regions with target groups pointing to Lambda functions.
12. Configure AWS Backup plans in each region with 7-day retention for Aurora snapshots.

## Business Context

A financial services company requires a disaster recovery solution for their critical transaction processing system. They need to maintain business continuity with minimal data loss in case of regional AWS outages. The company has strict RTO requirements of 15 minutes and RPO requirements of 5 minutes.

## Architecture Overview

Multi-region AWS infrastructure spanning us-east-1 (primary) and us-east-2 (disaster recovery). Deployment includes Aurora PostgreSQL 15.x global database, Lambda functions for transaction processing, S3 for document storage, DynamoDB for session management, and Route 53 for DNS failover. VPCs in each region with 3 availability zones, private subnets for database and compute resources, public subnets for ALB. Requires Terraform 1.5+ with AWS provider 5.x. Cross-region VPC peering for internal communication. KMS encryption for all data at rest.

## Mandatory Constraints

- S3 buckets must use cross-region replication with delete marker replication enabled
- Lambda functions must be deployed in both regions with identical configurations
- KMS keys must be created in each region with identical key policies
- All IAM roles must follow least privilege principle with region-specific resource ARNs
- DynamoDB global tables must be configured for session state management
- Primary region must be us-east-1 and disaster recovery region must be us-east-2
- Route 53 health checks must monitor both regions with automatic failover
- RDS Aurora Global Database must be used for cross-region replication
- CloudWatch alarms must trigger SNS notifications for failover events

## Critical Requirements for Deployment

1. **Resource Naming**: ALL named resources MUST include `environmentSuffix` or `environment_suffix` variable to avoid conflicts in parallel deployments
   - Example: `bucket_name = f"transaction-logs-{environment_suffix}"`
   - This is MANDATORY for: S3 buckets, DynamoDB tables, Lambda functions, IAM roles, KMS aliases, SNS topics, CloudWatch log groups

2. **Destroyability**: Infrastructure must be fully destroyable
   - No `RemovalPolicy.RETAIN` settings
   - No `deletion_protection = true` for RDS/DynamoDB
   - Set `skip_final_snapshot = true` for RDS Aurora clusters
   - Enable force destroy for S3 buckets with objects

3. **Multi-Region Considerations**:
   - Ensure VPC CIDR blocks do not overlap between regions
   - VPC peering connections require non-overlapping CIDR ranges
   - KMS keys are region-specific and cannot be shared across regions
   - Cross-region replication requires separate S3 bucket in each region

4. **AWS Service Best Practices**:
   - Aurora Global Database: Use dedicated primary and secondary clusters
   - Lambda: Package code inline for simple functions or use deployment packages
   - DynamoDB Global Tables: Configure replica regions explicitly
   - Route 53: Health checks must point to valid endpoints in both regions
   - ALB: Target Lambda functions using Lambda integration (not direct IP)

5. **Cost Optimization**:
   - Use Aurora Serverless v2 for cost-effective scaling
   - DynamoDB on-demand billing mode to avoid over-provisioning
   - Consider single NAT Gateway per region for test deployments
   - Set appropriate CloudWatch log retention (7-14 days for synthetic tasks)

## Expected Deliverables

A modular Terraform configuration with separate modules for:
- Networking (VPCs, subnets, VPC peering, route tables)
- Database (Aurora Global Database, subnet groups, parameter groups)
- Compute (Lambda functions, IAM roles, SQS queues)
- Storage (S3 buckets with cross-region replication)
- Monitoring (CloudWatch alarms, SNS topics)
- DNS (Route 53 hosted zone, health checks, routing policies)
- Security (KMS keys, IAM policies)
- Backup (AWS Backup plans and rules)

The configuration should support single-command deployment to both regions simultaneously with proper dependency management. Include outputs showing:
- Primary and secondary endpoint URLs
- Database endpoints (primary and secondary cluster endpoints)
- S3 bucket names for transaction logs and documents
- DynamoDB global table name
- Route 53 hosted zone ID and nameservers
- ALB DNS names in both regions

## Testing Requirements

- Unit tests must achieve 100% coverage of all infrastructure components
- Integration tests must verify:
  - Cross-region replication is functioning (S3, DynamoDB, Aurora)
  - Route 53 health checks are properly configured
  - ALB target groups can reach Lambda functions
  - CloudWatch alarms are properly configured with SNS subscriptions
  - KMS encryption is enabled on all applicable resources
  - VPC peering connection is active and routes are configured

## Validation Checklist

Before deployment, verify:
- [ ] All resource names include `environment_suffix` variable
- [ ] No `RemovalPolicy.RETAIN` or `deletion_protection = true` settings
- [ ] VPC CIDR blocks are non-overlapping between regions
- [ ] Aurora Global Database is configured (not separate Aurora clusters)
- [ ] Lambda deployment packages are properly created
- [ ] S3 cross-region replication is bidirectional or properly configured
- [ ] DynamoDB global table includes both region replicas
- [ ] Route 53 health check endpoints are valid and accessible
- [ ] KMS keys created in both regions with proper key policies
- [ ] CloudWatch alarms configured in both regions
- [ ] SNS topics have cross-region subscriptions where needed
- [ ] All IAM roles follow least privilege with specific resource ARNs

## Platform-Specific Notes (CDKTF Python)

- Use `cdktf` Python library for infrastructure definition
- Follow CDKTF patterns for multi-stack deployments (one stack per region)
- Properly configure Terraform backend for state management
- Use CDKTF constructs and providers from `cdktf_cdktf_provider_aws`
- Ensure Python dependencies are properly specified in `Pipfile`
- Follow Python naming conventions (snake_case for variables)
- Use type hints where applicable for better code clarity
