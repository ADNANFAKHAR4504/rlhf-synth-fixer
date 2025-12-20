# Infrastructure as Code (IaC) Requirements

## Overview

You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code (IaC) using AWS CDK (TypeScript). Your task is to design and define a secure AWS environment adhering to production-level standards, with a focus on network segmentation and secure access.

## Global Requirements

- **Region**: Deploy all infrastructure in the `us-east-1` AWS region
- **Tagging**: All resources must be tagged with `Environment:Production`
- **Platform**: Use AWS CDK with TypeScript

## Detailed Requirements

### 1. VPC Network Configuration

- **VPC**: Provision an Amazon VPC with a suitable CIDR block (e.g., `10.0.0.0/16`)
- **Public Subnets**: Create two public subnets within the VPC
- **Private Subnets**: Create two private subnets within the VPC
- **High Availability**: Ensure subnets are spread across two different Availability Zones within the us-east-1 region
- **Internet Gateway**: Implement an Internet Gateway for the VPC
- **NAT Gateways**: Deploy NAT Gateways in the public subnets to enable secure outbound internet access for private resources

### 2. Secure Bastion Host

- **Instance**: Implement a secure bastion host using an EC2 instance
- **Placement**: Deploy the instance in one of the public subnets
- **Configuration**: 
  - Use a minimal footprint (e.g., `t3.micro` or `t2.micro` instance type)
  - Use an appropriate Amazon Linux AMI

### 3. Comprehensive IAM Roles and Policies

- **Principle of Least Privilege**: Define IAM roles and policies for all resources that strictly adhere to the principle of least privilege
- **EC2 Instance Profiles**: Create appropriate instance profiles for the bastion host
- **Minimal Permissions**: Ensure no service or resource has more permissions than absolutely necessary

### 4. Security Group Configuration

Configure security groups to enforce strict access control:

#### Bastion Host Security Group
- **SSH Access**: Limit inbound SSH access (port 22) to specific, predefined IP addresses or CIDR blocks only
- ** Security Requirement**: Do **NOT** allow `0.0.0.0/0` for SSH access

#### Internal Application Tiers Security Groups
Create security groups that support internal application architecture:
- **Web Tier**: Allow communication from internet (HTTP/HTTPS) and SSH from bastion
- **Application Tier**: Allow communication only from web tier and SSH from bastion
- **Database Tier**: Allow communication only from application tier
- **Lateral Movement Prevention**: Prevent unauthorized lateral movement between tiers

### 5. Resource Tagging

- **Production Tag**: Apply the tag `Environment:Production` to all AWS resources created by this CDK stack
- **Purpose**: Ensure clear identification and management of resources

