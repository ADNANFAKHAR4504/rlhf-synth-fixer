# Task: Environment Migration - RDS Aurora PostgreSQL Cluster Deployment

## Background
A fintech company needs to migrate their payment processing database from an on-premises PostgreSQL instance to AWS RDS Aurora. The migration must minimize downtime and maintain data integrity while transitioning from their existing staging environment to a new production-ready infrastructure in AWS.

## Problem Statement
Create a CDK Go program to deploy an RDS Aurora PostgreSQL cluster for migrating a payment processing database from on-premises staging to AWS production. The configuration must:

1. Create a new VPC with 3 availability zones, each containing public and private subnets.
2. Deploy an Aurora PostgreSQL 15.4 cluster with one writer instance and two reader instances.
3. Place all database instances in private subnets with no direct internet access.
4. Generate and store database master credentials in AWS Secrets Manager with automatic rotation every 30 days.
5. Enable encryption at rest using a customer-managed KMS key.
6. Configure automated backups with 7-day retention and daily snapshots at 3 AM UTC.
7. Set up parameter groups that enforce SSL connections and optimize for payment transaction workloads.
8. Create CloudWatch alarms for CPU utilization (threshold: 80%) and storage space (threshold: 85%).
9. Enable Performance Insights with 7-day retention for query analysis.
10. Output the cluster endpoint, reader endpoint, and Secrets Manager ARN for application configuration.

## Expected Output
A fully functional CDK Go application that creates a production-ready Aurora PostgreSQL cluster optimized for payment processing workloads, with all security and monitoring features enabled for seamless migration from the existing staging environment.

## Environment Requirements
Production-ready infrastructure in us-east-1 region for migrating payment processing systems. Requires:
- AWS CDK 2.x with Go 1.19+
- AWS CLI configured with appropriate credentials
- VPC with 3 availability zones, each with public and private subnets
- NAT Gateways in public subnets for outbound connectivity
- RDS Aurora PostgreSQL cluster deployed across private subnets with Multi-AZ configuration
- AWS Secrets Manager for credential storage
- KMS for encryption
- CloudWatch for monitoring
- Migration involves transitioning from on-premises staging to AWS production environment

## Constraints
1. Use AWS CDK v2 with Go bindings
2. Database must use Aurora PostgreSQL 15.4 engine
3. Enable point-in-time recovery with 7-day retention
4. Configure automated backups to run at 3 AM UTC
5. Database must be deployed in private subnets only
6. Use AWS Secrets Manager for database credentials
7. Enable encryption at rest using AWS KMS
8. Configure read replicas in at least 2 availability zones
9. Set up CloudWatch alarms for CPU utilization above 80%
10. Use parameter groups to enforce SSL connections
