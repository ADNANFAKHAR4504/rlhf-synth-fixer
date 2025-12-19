## Problem Statement

Create a CloudFormation template to deploy a highly available payment processing infrastructure with automated failover capabilities. MANDATORY REQUIREMENTS (Must complete): 1. Deploy Aurora MySQL cluster with one writer and two reader instances across 3 AZs (CORE: Aurora) 2. Configure Auto Scaling Group with minimum 6 instances (2 per AZ) behind Application Load Balancer (CORE: Auto Scaling) 3. Implement Route 53 health checks with automatic DNS failover to secondary region endpoint 4. Set up S3 bucket with versioning enabled and cross-region replication to us-west-2 5. Configure CloudWatch alarms for failover events with email notifications 6. Create backup retention policy of 7 days for Aurora cluster with point-in-time recovery 7. Implement least-privilege IAM roles for instances to access S3 and Aurora 8. Enable deletion protection on production resources with DeletionPolicy: Snapshot OPTIONAL ENHANCEMENTS (If time permits): • Add AWS Backup for centralized backup management (OPTIONAL: AWS Backup) - simplifies compliance reporting • Implement Lambda function for automated recovery testing (OPTIONAL: Lambda) - validates DR procedures • Add distribution for static assets (OPTIONAL: ) - improves global performance Expected output: A single CloudFormation JSON template that creates all resources with proper dependencies, implements multi-AZ high availability, automated failover mechanisms, and disaster recovery capabilities. The infrastructure should automatically recover from AZ failures without manual intervention.

## Background

A financial services company needs to ensure their payment processing API remains available during zone failures. They require automated failover capabilities with minimal data loss and rapid recovery time objectives (RTO < 5 minutes).

## Environment

Multi-AZ highly available infrastructure deployed in us-east-1 region spanning 3 availability zones (us-east-1a, us-east-1b, us-east-1c). Core services include Aurora MySQL cluster with automated failover, Auto Scaling Groups behind Application Load Balancer, and Route 53 for DNS failover. VPC configured with public and private subnets in each AZ, NAT Gateways for outbound traffic from private subnets. S3 buckets configured for cross-region replication to us-west-2 for disaster recovery. CloudWatch monitoring with alerting for all critical events. Requires AWS CLI configured with appropriate permissions.

## Constraints

- Aurora must use MySQL 8.0 with automated backups every 12 hours
- Application Load Balancer health checks must use HTTP GET on /health endpoint
- Auto Scaling Group must maintain exactly 2 instances per AZ during normal operations
- Route 53 health checks must failover within 30 seconds of detection
- All S3 buckets must use cross-region replication to us-west-2
- CloudWatch alarms must trigger notifications for database failover events
- DeletionPolicy must be set to Snapshot for all stateful resources

## Task Metadata

- **Platform**: CloudFormation
- **Language**: json
- **Complexity**: expert
- **Subtask**: Failure Recovery and High Availability
- **Subject Labels**: Failure Recovery Automation
