# Multi-Region Disaster Recovery Infrastructure for Payment Processing System

## Overview

A financial services company requires a multi-region disaster recovery solution for their critical payment processing application. The system must maintain sub-second RPO and ensure automatic failover capabilities while minimizing data loss.

## Platform and Language

**MANDATORY: This infrastructure MUST be implemented using Pulumi with Python.**

## Task Requirements

Create a Pulumi Python program to deploy a multi-region disaster recovery infrastructure for a payment processing system. The configuration must:

1. Set up Aurora Global Database cluster in us-east-1 as primary with us-east-2 as secondary region.
2. Configure DynamoDB global tables for transaction data with point-in-time recovery enabled.
3. Deploy identical Lambda functions in both regions for payment validation logic.
4. Create S3 buckets with cross-region replication for audit logs and transaction receipts.
5. Implement Route 53 failover routing with health checks monitoring RDS endpoints.
6. Configure CloudWatch dashboards in both regions showing replication lag metrics.
7. Set up SNS topics for automated failover notifications to operations team.
8. Create IAM roles allowing cross-region resource access for disaster recovery operations.
9. Implement CloudWatch alarms monitoring Aurora replication lag exceeding 1 second.
10. Deploy API Gateway endpoints in both regions with custom domain names.

## Expected Output

A Pulumi stack that provisions all resources in both regions with automated failover capabilities, monitoring dashboards showing replication health, and documented procedures for triggering manual failover if needed.

## Prerequisites

Multi-region AWS deployment spanning us-east-1 (primary) and us-east-2 (disaster recovery). Infrastructure includes Aurora Global Database for PostgreSQL 13.7, DynamoDB global tables, Lambda functions for payment processing, S3 buckets with cross-region replication, and Route 53 failover routing policies. Requires Pulumi 3.x with Python 3.9+, AWS CLI v2 configured with appropriate credentials. VPCs in both regions with private subnets across 3 availability zones, VPC peering for secure cross-region communication, and NAT gateways for outbound internet access.

## Specific Requirements

- S3 buckets must use cross-region replication with versioning enabled
- Lambda functions must be replicated across regions with identical configurations
- Route 53 health checks must monitor both regions continuously
- Primary region must be us-east-1 with failover to us-east-2
- IAM roles must follow least-privilege principle with cross-region assume permissions
- RDS instances must use Aurora Global Database with automated backups
- DynamoDB global tables must be configured for bi-directional replication
- All resources must be tagged with Environment, Region, and DR-Role tags
- CloudWatch alarms must trigger SNS notifications for failover events

## Critical Constraints

- **All resource names MUST include environment_suffix parameter** to avoid conflicts in parallel deployments
- Use standard naming pattern: `resource-name-{environment_suffix}`
- Default region: us-east-1 (primary), us-east-2 (disaster recovery)
- Implement proper error handling and validation
- Follow AWS best practices for security, cost optimization, and operational excellence
- Ensure all resources are properly tagged for cost tracking and management
