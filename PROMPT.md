# Task 101912381: AWS CloudFormation - Fault-Tolerant Web Application for Loan Processing

## Problem Statement

Create a CloudFormation template to deploy a fault-tolerant web application for loan processing. The configuration must:

1. Deploy an ECS Fargate cluster with auto-scaling based on CloudWatch metrics (CORE: ECS).
2. Create an Aurora MySQL cluster with one writer and two reader instances across multiple AZs (CORE: RDS Aurora).
3. Configure an Application Load Balancer with path-based routing and health checks.
4. Set up S3 buckets with encryption, versioning, and lifecycle policies for document storage.
5. Implement CloudFront distribution for static assets with OAI for S3 access.
6. Create necessary IAM roles with least-privilege permissions for all services.
7. Configure CloudWatch alarms for CPU, memory, and database connection thresholds.
8. Set up VPC with public/private subnets across 3 AZs with NAT Gateways.
9. Implement security groups with minimal required ports open.
10. Enable deletion protection on production resources with proper tags.

Expected output: A complete CloudFormation YAML template that creates all infrastructure components with proper dependencies and outputs for application deployment endpoints.

## Background

A financial services company needs to deploy a customer-facing web application that processes loan applications. The application requires high availability, secure data storage, and must comply with PCI-DSS standards for handling sensitive financial information.

## Environment

Production deployment in us-east-1 with disaster recovery in us-west-2. Architecture spans 3 availability zones with Application Load Balancer distributing traffic to ECS Fargate containers running the loan processing application. RDS Aurora MySQL cluster for primary data storage with read replicas. S3 buckets for document storage and static assets. VPC with public subnets for ALB, private subnets for ECS tasks and RDS. NAT Gateways in each AZ for outbound connectivity. CloudFront distribution for static content delivery. Requires AWS CLI configured with appropriate IAM permissions for CloudFormation stack creation.

## Constraints

- All database connections must use SSL/TLS encryption with certificate validation enabled
- Application logs must be encrypted at rest and retained for exactly 90 days for compliance
- Auto-scaling must trigger based on both CPU utilization (70%) and active database connections (80%)
- All S3 buckets must have versioning enabled and lifecycle policies to transition objects to Glacier after 180 days
- RDS instances must use encrypted storage with customer-managed KMS keys and automated backups to a separate region

## Metadata

- **Task ID**: 101912381
- **Platform**: CloudFormation
- **Language**: YAML
- **Difficulty**: expert
- **Subject Labels**: aws; infrastructure; web-application-deployment
