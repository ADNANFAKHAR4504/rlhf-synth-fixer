# Multi-Environment Trading Platform Infrastructure

This Pulumi TypeScript project implements a comprehensive multi-environment infrastructure solution for a trading platform across development, staging, and production environments.

## Architecture Overview

The infrastructure includes:
- VPC with 3 availability zones per environment
- Public and private subnets
- Application Load Balancer for traffic distribution
- ECS Fargate cluster for containerized applications
- RDS Aurora PostgreSQL cluster with environment-specific sizing
- S3 bucket for data storage
- CloudWatch dashboards and alarms
- SNS topics for alerting
- AWS Systems Manager Parameter Store for configuration

## Environment Configuration

### Development
- Region: us-east-2
- Instance Type: t3.medium
- Database Instances: 1
- Backup Retention: 7 days
- Container Tag: latest

### Staging
- Region: us-east-1
- Instance Type: m5.large
- Database Instances: 2
- Backup Retention: 14 days
- Container Tag: staging-*

### Production
- Region: us-east-1
- Instance Type: m5.xlarge
- Database Instances: 3
- Backup Retention: 30 days
- Container Tag: v*.*.*

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, ECS, RDS, ALB, CloudWatch, SNS, S3, and SSM

## Deployment

### Initialize Stacks
