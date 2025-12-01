# Multi-Environment Infrastructure Deployment

## Project Overview

This project implements a robust Terraform configuration designed to deploy consistent infrastructure across multiple environments for a fintech startup's payment processing platform. The solution ensures strict consistency while allowing for environment-specific scaling and maintaining PCI-DSS compliance standards.

## Business Context

Our fintech startup requires identical infrastructure across development, staging, and production environments to support their payment processing platform. This approach minimizes configuration drift, reduces deployment risks, and ensures consistent testing environments that mirror production.

## Architecture Overview

### Regional Distribution
- **Production**: us-east-1
- **Staging**: us-west-2  
- **Development**: eu-west-1

### Core Infrastructure Components

Each environment includes:
- Isolated VPCs with private subnets across 3 availability zones
- RDS PostgreSQL 15.4 instances (Multi-AZ for production only)
- Application Load Balancers with target groups for ECS services
- S3 buckets for application assets
- Dedicated IAM roles and KMS keys for encryption at rest

## Requirements

### 1. Modular Design
- Define reusable modules for RDS, ALB, and S3 resources
- Accept environment-specific parameters for flexible configuration
- Maintain consistent resource naming with environment prefixes

### 2. Environment Management
- Use Terraform workspaces to manage three environments: dev, staging, and prod
- Implement variable validation to reject invalid workspace names
- Support dynamic resource scaling based on environment

### 3. Database Configuration
- Configure RDS PostgreSQL instances with encryption using environment-specific KMS keys
- Set backup retention policies:
  - **Development**: 7 days
  - **Staging**: 14 days
  - **Production**: 30 days
- Enable automated backups for all environments

### 4. Load Balancer Setup
- Deploy ALBs with environment-appropriate instance counts:
  - **Development**: 1 instance
  - **Staging**: 2 instances
  - **Production**: 3 instances

### 5. Storage Configuration
- Create S3 buckets with versioning enabled
- Implement lifecycle rules for object archival:
  - **Development**: Archive after 30 days
  - **Staging**: Archive after 60 days
  - **Production**: Archive after 90 days

### 6. Security Requirements
- Configure security groups following least-privilege principles
- Allow database access only from application subnets within the same environment
- Use environment-specific CIDR blocks
- Ensure PCI-DSS compliance standards

### 7. Integration and Data Sources
- Use data sources to dynamically reference existing VPC resources
- Implement proper resource dependencies and references

## Expected Deliverables

A complete modular Terraform configuration including:
- Separate files for modules, variables, and outputs
- Environment-specific configurations that can be applied using workspace selection
- Output values for:
  - RDS endpoint
  - ALB DNS name
  - S3 bucket name

## Key Benefits

- **Consistency**: Identical infrastructure across all environments
- **Scalability**: Environment-specific resource sizing
- **Security**: Comprehensive security controls and encryption
- **Compliance**: PCI-DSS standard adherence
- **Maintainability**: Modular, reusable infrastructure code
