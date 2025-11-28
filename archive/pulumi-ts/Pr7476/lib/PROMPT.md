# Task: Failure Recovery Automation

## Category
Failure Recovery and High Availability

## Problem Statement

Create a Pulumi TypeScript program to implement a multi-region disaster recovery infrastructure for a payment processing application. The configuration must:

1. Deploy an Aurora Global Database cluster with a primary cluster in us-east-1 and secondary read replica cluster in us-west-2.
2. Create S3 buckets in both regions with cross-region replication enabled for application artifacts and backups.
3. Implement Route 53 health checks and failover routing policy for automatic DNS failover.
4. Deploy Lambda functions in both regions to perform health checks on database endpoints.
5. Configure CloudWatch alarms for monitoring replication lag and triggering notifications.
6. Create SNS topics in both regions for disaster recovery event notifications.
7. Implement IAM roles with cross-region assume policies for failover automation.
8. Set up CloudWatch dashboards in both regions displaying key DR metrics.
9. Configure all resources with appropriate tags as specified in constraints.
10. Ensure all data in transit and at rest uses AWS-managed encryption.

Expected output: A complete Pulumi TypeScript program that deploys a fully functional multi-region disaster recovery infrastructure with automated failover capabilities, monitoring, and alerting systems ready for production use.

## Context

A financial services company requires a disaster recovery solution for their critical payment processing application. The system must maintain near real-time data synchronization between regions and enable rapid failover with minimal data loss to meet regulatory compliance requirements.

## Technical Details

Multi-region AWS deployment spanning us-east-1 (primary) and us-west-2 (secondary) for disaster recovery. Infrastructure includes Aurora Global Database with PostgreSQL 15.4, cross-region replicated S3 buckets, Route 53 failover routing, and Lambda functions for health monitoring. Requires Pulumi 3.x with TypeScript, AWS CLI v2 configured with appropriate credentials, Node.js 18+. VPCs in both regions with private subnets across 3 AZs each, VPC peering for cross-region communication, and NAT gateways for outbound connectivity.

## Constraints

- Primary region must be us-east-1 with failover to us-west-2
- RTO (Recovery Time Objective) must be under 5 minutes
- RPO (Recovery Point Objective) must be under 1 minute
- All resources must be tagged with Environment, Application, and DR-Role tags
- Route 53 health checks must monitor both regions with 30-second intervals
- Cross-region replication must use AWS-managed encryption keys
