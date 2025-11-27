# Infrastructure Requirements

## Platform and Language (MANDATORY)

This task MUST be implemented using **Pulumi with TypeScript**.

## Task Description

Create a Pulumi TypeScript program to deploy a PCI-compliant payment processing web application. The configuration must:

1. Create a VPC with 3 public and 3 private subnets across 3 AZs with NAT gateways.
2. Deploy an ECS Fargate service running the payment app container with 2GB RAM and 1 vCPU.
3. Configure an Aurora PostgreSQL cluster with 2 reader instances and automated backups.
4. Set up an Application Load Balancer with AWS WAF rules blocking common SQL injection patterns.
5. Create buckets for static assets and audit logs with server-side encryption.
6. Implement IAM roles following least privilege with no wildcard permissions.
7. Configure CloudWatch Log Groups for ECS tasks and slow query logs.
8. Set up VPC Endpoints for S3, ECR, and CloudWatch Logs services.
9. Create KMS keys with automatic rotation enabled for all encryption needs.
10. Deploy backup plans for RDS with 30-day retention and cross-region copies.

Expected output: A complete Pulumi TypeScript program that provisions all infrastructure components with proper security configurations, outputs the ALB DNS name, cluster endpoint, and bucket names for application configuration.

## Context

A fintech startup needs to deploy their payment processing web application with strict compliance requirements for PCI DSS. The application processes sensitive cardholder data and requires end-to-end encryption, audit logging, and automated backup capabilities.

## Technical Specifications

Production deployment in us-east-1 with disaster recovery in us-west-2. Infrastructure includes:
- ECS Fargate for containerized web application
- Aurora PostgreSQL Multi-AZ cluster
- Application Load Balancer with WAF integration
- S3 for static assets
- VPC spans 3 availability zones with private subnets for compute and database tiers, public subnets for ALB
- Requires Pulumi 3.x with TypeScript
- AWS CLI configured with appropriate credentials
- Network architecture includes VPC Endpoints for S3, ECR, and CloudWatch to avoid internet egress charges

## Compliance Requirements

- All data must be encrypted at rest using AWS KMS customer-managed keys
- RDS instances must use encrypted snapshots with cross-region replication
- Application containers must run with read-only root filesystems
- All S3 buckets must have versioning enabled and lifecycle policies configured
- VPC Endpoints must be used for all AWS service communications
- CloudWatch Logs must retain audit logs for exactly 365 days

## Critical Naming Convention

ALL named resources MUST include `environmentSuffix` to avoid naming conflicts:
- Pattern: `resource-name-${environmentSuffix}`
- This is REQUIRED for parallel deployments in CI/CD

## Destroyability Requirements

ALL resources must be destroyable:
- No `retainOnDelete: true` settings
- RDS: Set `skipFinalSnapshot: true`
- S3: Bucket deletion will be handled after manual review
- KMS: Standard deletion applies

## Category

Security, Compliance, and Governance - Security Configuration as Code
