# Highly Available Transaction Processing System

This Terraform configuration deploys a production-ready, highly available transaction processing system across three availability zones in AWS.

## Architecture Overview

- **Network**: Multi-AZ VPC with public and private subnets across 3 AZs
- **Compute**: ECS Fargate service with auto-scaling (minimum 6 tasks)
- **Database**: Aurora PostgreSQL Multi-AZ cluster with 24-hour backtrack
- **Cache**: ElastiCache Redis cluster mode with automatic failover
- **Load Balancer**: Application Load Balancer with cross-zone load balancing
- **DNS**: Route 53 health checks with failover routing
- **Monitoring**: CloudWatch alarms with SNS notifications

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create all resources
- Valid email address for alarm notifications

## Deployment Instructions

### 1. Initialize Terraform
