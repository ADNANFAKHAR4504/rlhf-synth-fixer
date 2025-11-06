# Environment Migration - RDS Database Migration with DMS

## Background
A financial services company is migrating their payment processing database from an on-premises PostgreSQL server to AWS RDS. They need to ensure zero downtime during the migration and maintain data consistency between the old and new environments during the transition period.

## Environment
Production environment in us-east-1 region with existing VPC (vpc-0123456789abcdef) containing private subnets (subnet-private-1a, subnet-private-1b) across two availability zones. Requires Python 3.9+, Pulumi 3.x CLI, and AWS CLI configured with appropriate IAM permissions for RDS, DMS, Secrets Manager, CloudWatch, and KMS services. The target RDS PostgreSQL 15.3 instance will replace an on-premises PostgreSQL 12.x database currently handling 5000 transactions per minute.

## Problem Statement
Create a Pulumi Python program to migrate an on-premises PostgreSQL database to AWS RDS with continuous replication. The configuration must:

1. Create an RDS PostgreSQL 15.3 instance with Multi-AZ deployment in existing private subnets.
2. Configure a DB subnet group using the provided private subnet IDs.
3. Set up a security group allowing inbound PostgreSQL traffic (port 5432) only from the application security group (sg-app-servers).
4. Enable encryption at rest with a new KMS key specifically for RDS.
5. Store the master database credentials in AWS Secrets Manager with automatic rotation disabled initially.
6. Create a DMS replication instance in the same VPC for data migration.
7. Configure DMS source endpoint pointing to on-premises database (10.0.1.50:5432).
8. Set up DMS target endpoint for the new RDS instance using credentials from Secrets Manager.
9. Create a DMS migration task with full load and CDC enabled.
10. Implement CloudWatch alarms for RDS CPU utilization (>80%), free storage space (<10GB), and read/write latency (>200ms).
11. Output the RDS endpoint, DMS replication instance ARN, and Secrets Manager secret ARN.

**Expected output:** A fully functional Pulumi stack that creates the RDS infrastructure with DMS replication setup, ready for cutover. The program should handle the migration infrastructure setup while ensuring the source database remains operational during the transition phase.

## Constraints
1. Use AWS Database Migration Service (DMS) for continuous data replication
2. RDS instance must use db.r5.xlarge instance class with 100GB GP3 storage
3. Enable automated backups with 7-day retention period
4. Configure Multi-AZ deployment for high availability
5. Use AWS Secrets Manager for database credentials storage
6. Implement CloudWatch alarms for CPU, memory, and storage metrics
7. RDS instance must be in private subnets with no public accessibility
8. Enable encryption at rest using AWS KMS customer-managed keys

