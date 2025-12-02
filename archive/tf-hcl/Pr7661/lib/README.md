# Multi-Environment Terraform Infrastructure

This Terraform configuration provides a complete multi-environment infrastructure solution for a fintech application using workspace-based environment management.

## Architecture

The infrastructure includes:
- **VPC Module**: Network infrastructure with public/private subnets, NAT Gateway, and security groups
- **Compute Module**: EC2 Auto Scaling Groups with Application Load Balancer
- **Database Module**: RDS PostgreSQL with automated backups and encryption
- **Storage Module**: S3 buckets with versioning, lifecycle policies, and encryption

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state backend
- DynamoDB table for state locking
- SSL certificates in ACM (for staging and production)

## Workspace Management

This configuration uses Terraform workspaces to manage multiple environments:
