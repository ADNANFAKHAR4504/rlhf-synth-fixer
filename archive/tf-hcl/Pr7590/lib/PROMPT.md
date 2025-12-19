# Payment Processing Infrastructure Deployment

## Overview

This project aims to build a robust, scalable payment processing infrastructure that maintains consistency across three environments: development, staging, and production. The goal is to prevent configuration drift while allowing environment-specific optimizations for performance, capacity, and cost.

## Background

Our fintech organization previously experienced a production incident due to configuration drift between environments. This highlighted the critical need for:
- Strict consistency in infrastructure topology
- Environment-specific capacity tuning
- Automated validation to prevent configuration drift
- Clear documentation of approved variations between environments

## Architecture Requirements

### Core Infrastructure Components

**Base Infrastructure Stack**
- Design a reusable Terraform module that accepts environment-specific parameters
- Ensure identical topology across all environments
- Support configurable capacity, endpoints, and retention policies

**Database Layer**
- DynamoDB tables for transactions and audit logs
- Consistent schema across all environments
- Environment-specific read/write capacity:
  - Development: 5 read / 5 write units
  - Staging: 25 read / 25 write units  
  - Production: 100 read / 100 write units

**Compute Layer**
- Lambda functions for payment validation, processing, and notifications
- Environment-specific memory allocations:
  - Development: 512MB
  - Staging: 1024MB
  - Production: 2048MB

**API Gateway**
- Consistent routes across environments: `/process`, `/validate`, `/status`
- Environment-specific throttling limits:
  - Development: 100 requests/second
  - Staging: 500 requests/second
  - Production: 2000 requests/second

**Storage Layer**
- S3 buckets with consistent folder structures
- Environment-specific lifecycle policies:
  - Development: 30-day retention
  - Staging: 90-day retention
  - Production: 365-day retention

**Monitoring and Security**
- CloudWatch dashboards with environment-appropriate thresholds
- KMS keys with environment-specific role ARNs
- CloudWatch alarms for Lambda errors, DynamoDB throttling, and API Gateway errors
- CloudWatch Logs retention matching S3 lifecycle policies

**Governance and Compliance**
- Automated tagging: Environment, Team, and CostCenter tags on all resources
- Configuration validation module to prevent drift
- Configuration manifest documentation
- Drift detection for deployed resources

## Deployment Architecture

**Regional Distribution**
- Production: us-east-1
- Staging: us-west-2  
- Development: eu-west-1

**Network Architecture**
- Isolated VPCs per environment
- Private subnets for compute resources
- Consistent security group configurations

## Expected Deliverables

1. **Terraform Module** - Base infrastructure stack with parameterized configurations
2. **Environment Files** - Configuration files for dev, staging, and prod environments
3. **Validation System** - Automated checks to ensure configuration consistency
4. **Documentation** - Configuration manifest detailing environment-specific variations
5. **Monitoring** - Drift detection mechanism for ongoing compliance

The final solution should enable confident deployments across environments while maintaining the flexibility needed for appropriate environment-specific optimizations.