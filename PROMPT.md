# Task: Failure Recovery Automation

## Subject Labels
Failure Recovery and High Availability

## Description
Create a CDKTF Python program to implement automated regional failover for a high-availability trading platform. The configuration must: 1. Define RDS Aurora clusters in both us-east-1 and us-east-2 with automated backups and point-in-time recovery enabled. 2. Configure Route 53 hosted zone with failover routing policy using health checks on ALB endpoints. 3. Create Auto Scaling groups in both regions with launch templates specifying t3.large instances and custom AMI. 4. Implement DynamoDB global tables for session state with on-demand billing and encryption at rest. 5. Set up S3 buckets with cross-region replication rules and lifecycle policies for 90-day retention. 6. Deploy Lambda functions to orchestrate database failover and validate data integrity post-switch. 7. Configure CloudWatch alarms for RDS replication lag, ALB unhealthy targets, and Lambda errors. 8. Create SNS topics with email subscriptions for critical alerts and failover notifications. 9. Establish VPC peering connections with appropriate route tables and security group rules. 10. Define IAM roles and policies for EC2 instances, Lambda functions, and failover automation. Expected output: A modular Terraform configuration with separate files for networking, compute, database, and monitoring resources. Include variables.tf for region-specific settings and outputs.tf for endpoint URLs and health check status.

## Context
A financial services company needs to implement automatic failover for their trading platform to meet regulatory requirements for 99.99% uptime. The system must detect failures within 30 seconds and complete failover within 2 minutes to minimize trading disruptions.

## Architecture
Multi-region deployment across us-east-1 (primary) and us-east-2 (secondary) for disaster recovery. Infrastructure includes RDS Aurora MySQL with cross-region read replicas, Auto Scaling groups with ALB, DynamoDB global tables for session management, S3 with cross-region replication for static assets. Route 53 with health check-based routing policies. Lambda functions for failover orchestration. CloudWatch for monitoring and SNS for alerting. VPC peering between regions with private subnets. Requires Terraform 1.5+ with AWS provider 5.x.

## Constraints
- S3 bucket replication must use same-region replication for compliance
- Auto Scaling groups must maintain minimum 3 instances per region
- Health checks must run every 10 seconds with 3 consecutive failures triggering failover
- RDS read replicas must be promoted automatically during primary database failures
- IAM roles must follow principle of least privilege for failover operations
- CloudWatch alarms must trigger SNS notifications to operations team
- Lambda functions must validate data consistency before completing failover
- Route 53 health checks must monitor both application and database endpoints
- DynamoDB global tables must maintain eventual consistency across regions
