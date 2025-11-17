# Multi-Region Disaster Recovery Infrastructure

This Terraform configuration deploys a complete disaster recovery solution for a payment processing system across AWS regions us-east-1 (primary) and us-east-2 (DR).

## Architecture Overview

The infrastructure includes:

- **Multi-region VPCs**: Isolated networks in both regions with public/private subnets across 3 AZs
- **Aurora Global Database**: PostgreSQL database with automatic cross-region replication
- **S3 Cross-Region Replication**: Transaction logs replicated from primary to DR
- **Lambda Functions**: Payment processing logic deployed in both regions
- **API Gateway**: REST APIs with health check endpoints in both regions
- **Route 53 Health Checks**: Monitoring primary region availability
- **CloudWatch Alarms**: Monitoring replication lag and service health
- **NAT Gateways**: Enabling Lambda functions to access external services

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0 installed
3. Lambda deployment package at `lib/lambda/payment_processor.zip`

## Deployment Instructions

1. **Initialize Terraform**:
   ```bash
   cd lib
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your environment_suffix
   ```

3. **Review the plan**:
   ```bash
   terraform plan
   ```

4. **Deploy the infrastructure**:
   ```bash
   terraform apply
   ```

5. **View outputs**:
   ```bash
   terraform output
   ```

## Lambda Function Preparation

Before deployment, create the Lambda deployment package:
