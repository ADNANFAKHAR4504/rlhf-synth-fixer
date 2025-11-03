# Multi-Environment Infrastructure Deployment with Terraform

## Problem Statement

Create a Terraform configuration to deploy consistent infrastructure across three environments (dev, staging, prod) using workspaces and variable overrides.

## Requirements

The configuration must include the following components:

### 1. Environment Management
- Use Terraform workspaces to manage dev, staging, and prod environments

### 2. Network Infrastructure
- Create a VPC per environment with consistent CIDR blocks:
  - Dev: `10.0.0.0/16`
  - Staging: `10.1.0.0/16` 
  - Prod: `10.2.0.0/16`

### 3. Database Layer
- Deploy an RDS PostgreSQL instance with environment-specific instance classes:
  - Dev: `db.t3.micro`
  - Staging: `db.t3.small`
  - Prod: `db.t3.micro`

### 4. Container Platform
- Set up an ECS cluster with Fargate tasks running a containerized API service

### 5. Load Balancing
- Configure an Application Load Balancer with proper health checks and target groups

### 6. Auto Scaling
- Implement environment-specific scaling policies:
  - Dev: 1-2 tasks
  - Staging: 2-4 tasks
  - Prod: 3-10 tasks

### 7. DNS Management
- Create Route53 hosted zones with environment-prefixed subdomains:
  - `dev.example.com`
  - `staging.example.com`
  - `prod.example.com`

### 8. Storage & Logging
- Deploy S3 buckets for application logs with lifecycle policies:
  - Dev: 7 days retention
  - Staging: 30 days retention
  - Prod: 90 days retention

### 9. Security & Access Management
- Configure IAM roles and policies that are consistent across environments but with environment-specific resource ARNs

### 10. Configuration Management
- Use Terraform locals and maps to define environment-specific configurations

## Expected Output

A modular Terraform configuration including:
- `main.tf`
- `variables.tf` 
- `terraform.tfvars` files for each environment

The configuration should ensure infrastructure consistency while allowing environment-appropriate sizing and retention policies.

## Background

A fintech startup needs to maintain identical infrastructure across development, staging, and production environments. Each environment must have the same architecture but with different sizing and configurations appropriate to its purpose.

## Environment Details

- **Platform**: Multi-environment AWS deployment
- **Region**: us-east-1
- **Management**: Terraform workspaces
- **Architecture**: 
  - Each environment (dev, staging, prod) gets its own VPC
  - Public and private subnets across 2 Availability Zones
  - RDS PostgreSQL in Multi-AZ configuration for staging/prod
  - ECS Fargate for containerized applications behind ALB
  - Network isolation between environments with consistent architecture patterns

## Constraints

- All resources must be tagged with `Environment`, `Project`, and `ManagedBy` tags
- Use Terraform workspaces exclusively for environment separation (no separate state files)
- RDS instances must have automated backups with environment-specific retention periods
- All sensitive values must be stored in AWS Systems Manager Parameter Store
- ECS task definitions must reference the same container image across all environments
- ALB access logs must be enabled and stored in environment-specific S3 buckets
- Use Terraform data sources to reference existing Route53 parent hosted zones