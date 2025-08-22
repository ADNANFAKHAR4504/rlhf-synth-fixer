# CloudFormation Multi-Region Infrastructure Solution

## Overview

This solution provides a comprehensive CloudFormation template for deploying a distributed web application infrastructure across AWS regions. The implementation creates a robust, scalable, and highly available environment supporting multi-region deployment.

## Architecture

The solution implements a multi-region architecture with the following components:

- VPC with 10.0.0.0/16 CIDR block
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)  
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- Application Load Balancer for traffic distribution
- Auto Scaling Group with t3.medium instances
- CloudWatch monitoring with CPU-based scaling
- Security groups for layered network security
- NAT Gateways for outbound internet access from private subnets

## Implementation

The CloudFormation template creates the following infrastructure:

### Networking
- VPC with DNS hostnames and DNS support enabled
- Internet Gateway attached to VPC
- 3 public subnets distributed across availability zones
- 3 private subnets for EC2 instances
- Route tables configured for public and private traffic
- 3 NAT Gateways with Elastic IPs for high availability

### Compute Resources
- Launch Template with t3.medium instance type
- Auto Scaling Group with min 2, max 6 instances
- EC2 instances deployed in private subnets
- IAM instance profile with CloudWatch agent permissions

### Load Balancing
- Application Load Balancer deployed in public subnets
- Target Group with health checks
- ALB Listener for HTTP traffic distribution

### Monitoring and Scaling
- CloudWatch CPU utilization alarms
- Scale-up policy triggered at 70% CPU utilization
- Scale-down policy at 25% CPU utilization
- 300-second cooldown periods

### Security
- ALB Security Group allowing HTTP/HTTPS from anywhere
- EC2 Security Group restricting access to ALB traffic only
- SSH access restricted to VPC CIDR block

## Files Generated

- main-template.yaml: Primary CloudFormation template
- us-east-1-stack.yaml: Region-specific stack for US East
- us-west-2-stack.yaml: Region-specific stack for US West

## Deployment

The template can be deployed in either us-east-1 or us-west-2 regions and will automatically adapt to the target region using dynamic availability zone selection.

Parameters:
- EnvironmentSuffix: Environment identifier (default: dev)
- KeyPairName: Optional EC2 key pair for SSH access
- ImageId: Amazon Linux 2 AMI ID (auto-selected)

## Outputs

The template provides comprehensive outputs including:
- Load balancer DNS name
- VPC and subnet identifiers
- Security group IDs
- Auto Scaling Group name
- Deployment region information