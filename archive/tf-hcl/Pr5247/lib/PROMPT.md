# Multi-Region AWS VPC Infrastructure Setup

## Project Background

Our financial services startup is expanding into multiple AWS regions to meet data sovereignty regulations. We need to set up identical network infrastructure in each region that can handle both our public web applications and private database services.

## Target Environment

We're planning to deploy across three AWS regions:
- US East 1 (us-east-1)
- EU West 1 (eu-west-1) 
- Asia Pacific Southeast 1 (ap-southeast-1)

Our infrastructure will support:
- Web application servers running on EC2 instances in public subnets
- RDS databases running in private subnets
- Hub-and-spoke network model with centralized internet access
- Cost optimization through a single NAT Gateway while maintaining high availability

## What We Need Built

Please create a Terraform configuration for a production-ready VPC that can be deployed across multiple AWS regions. Here's exactly what we need:

### Core Infrastructure
1. **VPC Setup** - Create a VPC with a /20 CIDR block to allow for future growth
2. **Subnet Architecture** - Deploy 3 public subnets and 3 private subnets spread across different availability zones
3. **Internet Access** - Configure an Internet Gateway for public internet connectivity
4. **Private Outbound** - Set up a NAT Gateway in the first availability zone for private subnet internet access
5. **Traffic Routing** - Create route tables that properly manage traffic between public subnets, private subnets, and external networks

### Security & Monitoring
6. **Flow Logs** - Enable VPC Flow Logs with CloudWatch Logs as the destination
7. **DNS Configuration** - Set up DHCP options with custom DNS servers (8.8.8.8 and 8.8.4.4)
8. **Resource Tagging** - Apply consistent tags including Environment, Project, and Region

### Operational Requirements
9. **Dynamic AZ Selection** - Use data sources to automatically select availability zones for the target region
10. **Module Integration** - Output VPC ID, subnet IDs, and route table IDs for use by other Terraform modules

## Design Constraints

- VPC must span exactly 3 availability zones
- Each availability zone needs both public and private subnets
- Private subnets should use /24 CIDR blocks
- Public subnets should use /26 CIDR blocks
- Only one NAT Gateway is needed (in the first AZ for cost savings)
- Internet Gateway must be tagged with Environment and Project
- Route tables should prevent direct communication between private subnets across AZs
- VPC Flow Logs are mandatory with CloudWatch destination
- All resources need consistent naming with region suffix
- DHCP options must specify the custom domain name servers

## Expected Deliverable

A modular Terraform configuration that creates a standardized VPC architecture suitable for multi-tier applications. The solution should provide proper network isolation between public and private resources while using cost-optimized NAT Gateway placement.