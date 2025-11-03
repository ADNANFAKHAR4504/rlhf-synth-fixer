# Task: Cloud Environment Setup for Financial Services Platform

## Background
A financial services company needs to establish a secure cloud foundation for their new digital banking platform. The infrastructure must comply with PCI-DSS requirements for network segmentation and access control. The platform will host customer-facing applications, internal APIs, and sensitive data processing workloads.

## Environment
AWS multi-AZ deployment in us-east-1 region for a financial services application requiring PCI-DSS compliance. Infrastructure includes VPC with 10.0.0.0/16 CIDR, 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across us-east-1a, us-east-1b, us-east-1c. NAT Gateways in each AZ for high availability. Internet Gateway for public subnet connectivity. Requires AWS CLI configured with appropriate IAM permissions for VPC, EC2, and networking resources.

## Problem Statement
Create a CloudFormation template to establish a production-ready VPC environment for a financial services application. The configuration must:

1. Define a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames and DNS resolution.
2. Create three public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across three availability zones.
3. Create three private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) in the same availability zones.
4. Deploy an Internet Gateway and attach it to the VPC.
5. Create three NAT Gateways, one in each public subnet, with Elastic IPs.
6. Configure route tables for public subnets with routes to the Internet Gateway.
7. Configure separate route tables for each private subnet with routes through their respective NAT Gateway.
8. Create a security group for web servers allowing HTTPS (443) from anywhere and SSH (22) from 10.0.0.0/16.
9. Create a security group for database servers allowing PostgreSQL (5432) only from the web server security group.
10. Output the VPC ID, subnet IDs, and security group IDs for use by other stacks.

## Expected Output
A CloudFormation YAML template that creates a highly available VPC with proper network segmentation for public and private workloads, redundant NAT Gateways for fault tolerance, and security groups implementing defense-in-depth principles suitable for PCI-DSS compliance.

## Constraints
1. VPC CIDR block must be 10.0.0.0/16 with no overlapping subnets
2. NAT Gateways must be deployed in high availability mode across all availability zones
3. All private subnet route tables must have explicit associations and cannot use the main route table
4. Security group rules must use descriptions and follow least-privilege principles
5. All resources must be tagged with Environment, Project, and Owner tags

## Metadata
- Task ID: 101000812
- Platform: CloudFormation
- Language: YAML
- Difficulty: hard
- Subtask: Cloud Environment Setup
- Region: us-east-1
