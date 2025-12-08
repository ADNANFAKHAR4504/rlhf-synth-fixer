# Financial Transaction Platform - Infrastructure Documentation

## Overview

This infrastructure deploys a highly available web application for processing financial transactions using CDKTF with Python. The platform is designed to meet PCI-DSS compliance requirements and handle variable traffic loads during market hours.

## Architecture

The infrastructure consists of the following components:

### Network Layer (vpc.py)
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- Internet Gateway for public subnet connectivity
- 3 NAT Gateways (one per AZ for high availability)
- Route tables configured for public and private subnets

### Compute Layer (compute.py)
- Auto Scaling Group with t3.large instances
- Amazon Linux 2023 AMI
- Launch template with IMDSv2 enforcement
- User data script for application setup
- Auto-scaling policies based on CPU utilization
- Scheduled scaling for business hours (8AM-6PM EST)

### Load Balancing (alb.py)
- Application Load Balancer in public subnets
- Target group with health checks on /health endpoint
- HTTP listener (can be upgraded to HTTPS with certificates)

### Database Layer (database.py)
- Aurora MySQL 8.0 cluster
- 2 Aurora instances (db.r6g.large) across multiple AZs
- Encryption at rest with KMS
- Automated backups with 7-day retention
- Performance Insights enabled
- SSL/TLS required for connections

### Content Delivery (cdn.py)
- CloudFront distribution with custom origin (ALB)
- S3 origin for static content
- Origin Access Identity for secure S3 access
- WAF Web ACL with rate limiting (2000 requests per IP)
- Caching policies for static and dynamic content

### Storage (storage.py)
- S3 bucket for static assets (accessed via CloudFront)
- S3 bucket for application logs
- Server-side encryption enabled
- Lifecycle policy for 90-day log retention
- Versioning enabled on both buckets

### Security (security.py)
- IAM roles for EC2 instances and Lambda functions
- Security groups for ALB, EC2, RDS, and Lambda
- KMS key for encryption
- Least privilege IAM policies
- IMDSv2 enforcement

### Secrets Management (secrets.py)
- Secrets Manager secret for database credentials
- Lambda function for automatic password rotation
- 30-day rotation schedule
- Integration with RDS for credential updates

### Monitoring (monitoring.py)
- CloudWatch log groups for application, ALB, and RDS
- Metric filters for error tracking
- CloudWatch alarms for critical metrics
- SNS topic for alert notifications
- 90-day log retention

## Prerequisites

- Python 3.9 or higher
- pipenv
- Node.js 14+ (for CDKTF)
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials

## Deployment Instructions

### 1. Install Dependencies

