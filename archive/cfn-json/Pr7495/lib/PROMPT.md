# Task: DMS Database Migration from On-Premises to Aurora PostgreSQL

**Platform**: CloudFormation
**Language**: JSON
**Complexity**: expert

## Background

A financial services company is migrating their legacy monolithic application from on-premises infrastructure to AWS. The application currently runs on physical servers with local PostgreSQL databases and file storage. The migration must maintain data integrity while minimizing downtime during the cutover period.

## Problem Statement

Create a CloudFormation template to orchestrate migration of on-premises PostgreSQL databases to AWS RDS Aurora using Database Migration Service. The configuration must: 1. Create source and target DMS endpoints with SSL encryption enabled. 2. Deploy DMS replication instance in private subnet with t3.medium instance class. 3. Configure DMS migration task for full load plus CDC with validation enabled. 4. Create Aurora PostgreSQL cluster with 2 reader instances across multiple AZs. 5. Implement Route 53 hosted zone with weighted routing policies for gradual traffic shift. 6. Store database passwords in Parameter Store with SecureString type. 7. Configure CloudWatch dashboard showing replication metrics and lag time. 8. Create SNS topic for alerting when replication lag exceeds threshold. 9. Output DMS task ARN, Aurora cluster endpoint, and Route 53 hosted zone ID. Expected output: A complete CloudFormation template in JSON format that automates the database migration infrastructure setup, enabling zero-downtime cutover from on-premises PostgreSQL to Aurora PostgreSQL with continuous replication monitoring.

## Constraints

1. Use AWS Database Migration Service (DMS) for continuous data replication
2. Implement blue-green deployment strategy with Route 53 weighted routing
3. All databases must use encrypted storage with customer-managed KMS keys
4. Configure DMS endpoints with SSL/TLS encryption for data in transit
5. Use Systems Manager Parameter Store for database credentials
6. Enable CloudWatch alarms for DMS replication lag exceeding 300 seconds
7. Set DeletionPolicy to Snapshot for all RDS instances

## Environment

Production migration environment deployed in us-east-1 with multi-AZ RDS Aurora PostgreSQL cluster, DMS replication instances in private subnets, and Application Load Balancer in public subnets. VPC spans 3 availability zones with separate subnet tiers for web, application, and database layers. Requires AWS CLI configured with appropriate IAM permissions for CloudFormation, DMS, RDS, EC2, and Route 53. Target architecture includes Auto Scaling groups for EC2 instances running the migrated application, with S3 buckets replacing local file storage. Network configuration includes VPC peering or Direct Connect to on-premises datacenter for DMS replication.

## AWS Services Required

Based on the problem statement, this solution will use:
- AWS Database Migration Service (DMS)
- Amazon RDS Aurora PostgreSQL
- Amazon Route 53
- AWS Systems Manager Parameter Store
- Amazon CloudWatch
- Amazon SNS
- Amazon VPC
- AWS KMS

## Deliverables

A complete CloudFormation template in JSON format that includes:
1. DMS source and target endpoints with SSL encryption
2. DMS replication instance (t3.medium) in private subnet
3. DMS migration task with full load + CDC and validation
4. Aurora PostgreSQL cluster with 2 reader instances (Multi-AZ)
5. Route 53 hosted zone with weighted routing policies
6. Parameter Store SecureString entries for database passwords
7. CloudWatch dashboard for replication metrics and lag time
8. SNS topic for replication lag alerts
9. All necessary IAM roles and security groups
10. Proper tagging and resource naming with environmentSuffix

## Important Notes

- **ALL resource names MUST include environmentSuffix parameter**
- **Set DeletionPolicy to Snapshot for all RDS instances** (as per constraints)
- **Enable encryption at rest using customer-managed KMS keys** (as per constraints)
- **Configure SSL/TLS encryption for DMS endpoints** (as per constraints)
- **Set CloudWatch alarm threshold to 300 seconds for replication lag** (as per constraints)
- **Use Systems Manager Parameter Store for all database credentials** (as per constraints)
- **Implement blue-green deployment strategy with Route 53 weighted routing** (as per constraints)
- Region: us-east-1 (from environment description)
- This is a synthetic task - infrastructure should be destroyable
- No GuardDuty detector creation (account-level service)
