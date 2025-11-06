# Payment Processing Migration Infrastructure

This Terraform configuration provides complete infrastructure for migrating a payment processing system from on-premises to AWS with zero downtime.

## Architecture Overview

- **Multi-AZ VPC**: 3 availability zones with public and private subnets
- **RDS Aurora MySQL**: Multi-AZ cluster with read replicas
- **ECS Fargate**: Containerized payment application
- **Application Load Balancer**: Blue-green deployment with weighted routing
- **AWS DMS**: Database migration with CDC
- **Route 53**: Private hosted zone with weighted routing
- **CloudWatch**: Centralized logging with forwarding to on-premises
- **Direct Connect**: Hybrid connectivity during migration

## Prerequisites

1. Terraform >= 1.5
2. AWS CLI configured with appropriate credentials
3. On-premises database accessible via Direct Connect or VPN
4. Docker image for payment application
5. S3 bucket for Terraform state
6. DynamoDB table for state locking

## Workspace Setup

This configuration uses Terraform workspaces for environment management:
