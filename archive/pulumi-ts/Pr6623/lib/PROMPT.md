# Task: Environment Migration Infrastructure

## Problem Statement
Create a Pulumi TypeScript program to implement a migration infrastructure for moving an on-premises payment processing system to AWS. The configuration must:

1. Create a VPC with 3 public and 3 private subnets across different availability zones.
2. Deploy an RDS Aurora PostgreSQL cluster with one writer and two reader instances, encryption at rest, and point-in-time recovery enabled.
3. Set up an ECS cluster with a Fargate service running at least 3 tasks of the payment processing application.
4. Configure an Application Load Balancer with target group health checks pointing to the ECS service.
5. Implement AWS Database Migration Service with a replication instance and migration task for PostgreSQL to Aurora migration with CDC enabled.
6. Create a Lambda function that queries both source and target databases to validate record counts and data integrity.
7. Set up CloudWatch alarms for DMS replication lag, ECS task health, and RDS CPU utilization.
8. Configure security groups that allow traffic only between necessary components (ALB → ECS → RDS, DMS → RDS).
9. Implement proper IAM roles for ECS task execution, Lambda function, and DMS replication.
10. Apply consistent tagging across all resources with Environment='prod-migration', CostCenter='finance', and MigrationPhase='active'.

Expected output: A complete Pulumi TypeScript program that provisions the entire migration infrastructure, outputs the ALB DNS name, RDS cluster endpoint, and DMS replication task ARN. The program should use Pulumi's component resources to organize related infrastructure and include exported stack outputs for integration with monitoring dashboards.

## Context
A financial services company is migrating their payment processing infrastructure from their legacy on-premises setup to AWS. The current system processes credit card transactions through a Java-based application that connects to a PostgreSQL database. They need to replicate their production environment in AWS first, then create a migration strategy that allows for zero-downtime cutover.

## Configuration Details
Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Uses ECS Fargate for containerized Java application hosting, RDS Aurora PostgreSQL 13.7 for database, AWS DMS for database migration with ongoing replication. Requires Pulumi CLI 3.x, TypeScript 4.x, Node.js 16+, and AWS CLI configured with appropriate IAM permissions. VPC spans 10.0.0.0/16 with public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for ALB and private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for ECS tasks and RDS. NAT Gateways provide outbound internet access from private subnets.

## Constraints
- All infrastructure must be tagged with Environment, CostCenter, and MigrationPhase tags
- Database migration must use AWS DMS with CDC enabled for real-time replication
- RDS Aurora PostgreSQL must be configured with encrypted storage and automated backups
- CloudWatch alarms must monitor DMS replication lag and alert if it exceeds 60 seconds
- The solution must include a Lambda function to validate data consistency post-migration
- The migration must support blue-green deployment pattern for zero-downtime cutover
- Network traffic between ECS tasks and RDS must remain within private subnets
- The application must run in ECS Fargate with at least 3 tasks across multiple AZs

## Requirements
1. Platform: Pulumi
2. Language: TypeScript
3. Default Region: us-east-1
4. Complexity: expert

## AWS Services Required
Based on the problem statement, the following AWS services must be provisioned:
- VPC (Virtual Private Cloud) with subnets and NAT Gateways
- RDS Aurora PostgreSQL cluster
- ECS (Elastic Container Service) with Fargate
- Application Load Balancer (ALB)
- AWS Database Migration Service (DMS)
- AWS Lambda
- CloudWatch (Alarms)
- IAM (Roles and Policies)
- Security Groups
