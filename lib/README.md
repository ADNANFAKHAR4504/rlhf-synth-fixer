# Trading Dashboard Infrastructure - Terraform

This Terraform configuration deploys a production-ready multi-tier web application with blue-green deployment capabilities for a Django-based trading dashboard.

## Architecture Overview

- **Compute**: ECS Fargate with blue-green deployment
- **Database**: Aurora PostgreSQL Serverless with Multi-AZ
- **Load Balancing**: Application Load Balancer with weighted routing
- **Security**: WAF for SQL injection and XSS protection
- **Secrets**: AWS Secrets Manager with automatic rotation
- **Monitoring**: CloudWatch alarms and logging
- **Auto Scaling**: CPU and memory-based scaling policies

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state
- DynamoDB table for state locking

## Quick Start

1. **Configure backend**:

