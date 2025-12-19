# Infrastructure as Code Task

## Background

A fintech startup needs to establish a secure cloud foundation for their payment processing platform. The infrastructure must comply with PCI DSS requirements for network segmentation and provide isolated environments for different application tiers.

## Problem Statement

Create a Terraform configuration to deploy a multi-tier VPC architecture for a payment processing application. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 in us-east-1
2. Deploy public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across three AZs for ALB placement
3. Deploy private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for application servers
4. Deploy database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24) with no internet routing
5. Create an Internet Gateway and attach it to the VPC
6. Deploy NAT Gateways in the first two public subnets with Elastic IPs
7. Configure route tables with appropriate routes for each subnet tier
8. Create security groups for web tier (ports 80, 443), app tier (port 8080), and database tier (port 5432)
9. Implement Network ACLs that allow web-to-app traffic on port 8080 and app-to-database traffic on port 5432
10. Enable VPC Flow Logs with CloudWatch Logs as destination
11. Output the VPC ID, subnet IDs grouped by tier, and NAT Gateway IPs

## Environment

Production-grade VPC infrastructure deployed in us-east-1 across 3 availability zones. Includes public subnets for load balancers, private subnets for application servers, and database subnets for RDS instances. NAT Gateways provide outbound internet access for private resources. VPC Flow Logs capture network traffic for security analysis. Requires Terraform 1.5+ with AWS provider 5.x configured. Target AWS account must have appropriate IAM permissions for VPC, EC2, CloudWatch, and S3 services.

## Constraints

1. VPC CIDR must be /16 to accommodate future growth
2. Each availability zone must have exactly one public and one private subnet
3. NAT Gateways must be deployed in at least two AZs for redundancy
4. All resources must be tagged with Environment, Project, and ManagedBy tags
5. Security groups must follow least privilege with explicit ingress/egress rules
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs
7. Network ACLs must restrict inter-subnet communication to specific ports only

## Expected Output

A fully functional multi-tier VPC with proper network isolation between tiers, redundant NAT Gateways for high availability, and comprehensive logging enabled. All resources should be properly tagged and outputs should be structured for easy reference by other Terraform modules.

## Platform Requirements

- **Platform**: Terraform
- **Language**: HCL
- **Region**: us-east-1
- **Complexity**: hard
