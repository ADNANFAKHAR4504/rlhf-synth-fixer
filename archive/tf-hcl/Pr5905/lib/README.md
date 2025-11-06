# Blue-Green Deployment Architecture

This Terraform configuration implements a production-ready blue-green deployment architecture for containerized web applications on AWS.

## Architecture Overview

The solution provides zero-downtime deployments using:

- Application Load Balancer (ALB) with blue/green target groups for traffic switching
- Auto Scaling Groups maintaining separate blue and green environments
- RDS Aurora MySQL with Multi-AZ configuration and RDS Proxy for connection pooling
- Route 53 weighted routing for gradual traffic shifts
- CloudWatch monitoring and alarms for both environments
- S3 versioned artifact storage
- Security Groups enforcing least-privilege network access
- IAM Roles with minimal permissions for EC2 instances

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Existing VPC with public and private subnets across 3 AZs
- Route 53 hosted zone
- Docker-enabled AMI (Amazon Linux 2 recommended)

## File Structure
