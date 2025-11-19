# Payment Platform VPC Infrastructure

Production-grade VPC infrastructure for a fintech payment processing platform built with Pulumi and TypeScript.

## Architecture Overview

This infrastructure creates a complete 3-tier VPC architecture with:

- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 3 subnets across 3 AZs for load balancers
- **Private Subnets**: 3 subnets across 3 AZs for application servers
- **Database Subnets**: 3 isolated subnets with no internet access
- **NAT Instances**: Cost-optimized t3.micro instances for outbound traffic
- **Security Groups**: Zero-trust model with explicit allow rules
- **VPC Flow Logs**: Encrypted logs to S3 and CloudWatch
- **S3 VPC Endpoint**: Private S3 access without internet routing

## Prerequisites

- Node.js 16+ and npm
- Pulumi CLI 3.x (`curl -fsSL https://get.pulumi.com | sh`)
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, EC2, S3, CloudWatch, IAM

## Configuration

The stack requires an `environmentSuffix` configuration parameter to ensure unique resource naming: