# AWS CDK TypeScript VPC Network Environment

I need to create an AWS CDK application in TypeScript that sets up a secure networking environment in us-east-1 with the following requirements:

## Core Infrastructure Requirements

1. Create a Virtual Private Cloud (VPC) using CIDR block 10.0.0.0/16 in the us-east-1 region
2. Within the VPC, create two public and two private subnets across two availability zones
3. Deploy a NAT Gateway to enable outbound Internet traffic from the private subnets
4. Use an Internet Gateway for public subnets
5. Deploy EC2 instances of type t3.micro in the infrastructure
6. Configure SSH access restricted to the specific IP range: 203.0.113.0/24
7. Apply the tag 'Environment=Development' to all resources for identification and management
8. Use CDK bootstrapping for proper asset management

## Latest AWS Features to Consider

Include these recent AWS networking enhancements where applicable:
- VPC Block Public Access features for enhanced security
- Private NAT Gateway capabilities for improved network isolation

## Technical Implementation

Please provide the complete infrastructure code with proper CDK constructs. The solution should be production-ready and follow AWS best practices for security and resource management.

Generate the infrastructure code as separate code blocks for each file that needs to be created or updated.