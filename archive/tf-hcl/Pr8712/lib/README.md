# Multi-Environment Payment Processing Infrastructure

This Terraform configuration provides a complete multi-environment infrastructure for a payment processing system with identical code across dev, staging, and production environments.

## Architecture

- **VPC**: Dedicated VPC per environment with public and private subnets across 2 AZs
- **Lambda**: Payment processing functions with environment-specific memory allocation
- **RDS PostgreSQL**: Transaction database with environment-specific instance sizing
- **Security Groups**: Environment-aware security rules
- **CloudWatch**: Logging with environment-specific retention periods
- **State Backend**: S3 + DynamoDB for remote state management

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 buckets and DynamoDB tables for state backend (created separately)

## Environment-Specific Configurations

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| Lambda Memory | 256 MB | 512 MB | 1024 MB |
| RDS Instance | t3.micro | t3.small | t3.medium |
| Log Retention | 7 days | 30 days | 90 days |
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Multi-AZ RDS | No | No | Yes |

## Deployment Instructions

### 1. Create State Backend Resources (One-time setup)
