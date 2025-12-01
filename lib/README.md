# VPC Infrastructure for Digital Banking Platform

This CloudFormation template creates a production-ready VPC infrastructure for a financial services digital banking platform with multi-AZ support, NAT instances, and comprehensive security controls.

## Architecture Overview

The infrastructure creates:
- VPC with CIDR block 10.0.0.0/16
- 3 public subnets across 3 availability zones
- 3 private subnets across 3 availability zones
- Internet Gateway for public internet access
- 3 NAT instances (t3.micro) for private subnet internet access
- Security groups with strict access controls
- VPC Flow Logs to S3 for security monitoring
- CloudWatch alarms for NAT instance health monitoring
- Systems Manager Session Manager support for secure access

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions for VPC, EC2, S3, IAM, CloudWatch, and CloudFormation services
- Target region: us-east-1 (or update AMI mappings for other regions)

## Deployment

### Deploy the Stack