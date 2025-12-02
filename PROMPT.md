# Task: Multi-AZ VPC Infrastructure with CloudFormation

## Background

A financial services startup needs to establish a secure network foundation in AWS for their new trading platform. They require strict network isolation between different application tiers and compliance with PCI-DSS standards for handling payment card data.

## Problem Statement

Create a CloudFormation template to deploy a multi-AZ VPC infrastructure for a production environment. The configuration must:

1. Create a VPC with DNS hostnames and DNS resolution enabled
2. Deploy three public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across three availability zones
3. Deploy three private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across the same availability zones
4. Attach an Internet Gateway to the VPC for public subnet internet access
5. Create three NAT Gateways, one in each public subnet, with Elastic IPs
6. Configure route tables where public subnets route 0.0.0.0/0 to the Internet Gateway
7. Configure route tables where each private subnet routes 0.0.0.0/0 to its AZ's NAT Gateway
8. Create a security group allowing HTTPS (443) inbound from anywhere and all outbound traffic
9. Tag all resources with Environment=Production and Project=TradingPlatform
10. Output the VPC ID, subnet IDs, and security group ID for use by other stacks

## Environment

Production-ready VPC infrastructure in us-east-1 region spanning three availability zones (us-east-1a, us-east-1b, us-east-1c). The environment requires a custom VPC with public and private subnets, internet gateway, NAT gateways for outbound traffic from private subnets, and foundational security groups. AWS CLI and CloudFormation CLI tools must be configured with appropriate IAM permissions for VPC, EC2, and networking resources. The infrastructure will support future deployment of RDS instances in private subnets and ALB in public subnets.

## Constraints

1. The VPC must use a CIDR block of 10.0.0.0/16
2. Each availability zone must have exactly one public and one private subnet
3. NAT Gateways must be deployed in high-availability mode across all AZs
4. All route tables must include explicit routes for local traffic
5. Security group rules must be defined inline rather than as separate resources

## Expected Output

A CloudFormation YAML template that creates a fully functional multi-AZ VPC with proper network segmentation, high-availability NAT configuration, and outputs that can be referenced by other CloudFormation stacks for deploying application resources.

## Technical Requirements

- Platform: CloudFormation
- Language: YAML
- Region: us-east-1
- Complexity: medium
- Subtask: Cloud Environment Setup

## Task ID

101000928
