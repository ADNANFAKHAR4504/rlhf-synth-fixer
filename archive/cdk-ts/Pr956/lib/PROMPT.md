# Cloud Environment Setup - CDK TypeScript

## Task Description

Develop a CDK TypeScript configuration to set up a scalable, secure network infrastructure on AWS. The network must support a production environment and be highly available.

## Requirements

- Use AWS as the cloud provider with CDK TypeScript
- Configure a VPC with the CIDR block '10.0.0.0/16'
- Create at least two public and two private subnets. Ensure these are distributed equally across two Availability Zones
- Deploy an Internet Gateway and configure routing for public subnets
- Set up NAT Gateways to allow private subnet instances to access the internet
- Restrict SSH access to resources to a particular IP range for security purposes (e.g., '203.0.113.0/24')
- Implement a Bastion host in a public subnet for secure access to the private network
- Ensure all S3 buckets created have their 'Block Public Access' settings enabled by default
- Use appropriate AWS security groups to limit access to resources

## Expected Output

The solution must be in CDK TypeScript files that pass all AWS best practices checks and constraints. The code should be deployable with `cdk deploy`, and all resources should be correctly provisioned while adhering to specified constraints.

## Environment Details

Configure a production-level AWS environment using CDK TypeScript that includes a VPC with public and private subnets spread across availability zones in the us-east-1 region. Implement security measures for all resources to comply with best practices in a production environment.

## Background

Setting up a secure and scalable cloud environment is crucial for operational success in a production setting. Properly configuring network resources such as VPCs, subnets, and gateways ensure that the infrastructure is robust and meets security and availability requirements.

## Constraints (12 total)

1. All resources must be tagged with 'Environment: Production'
2. Use AWS as the cloud provider
3. Define configurations using CDK TypeScript
4. The VPC CIDR block must be '10.0.0.0/16'
5. Include at least two public subnets and two private subnets
6. Subnets should be distributed across two Availability Zones
7. Deploy an Internet Gateway for public subnet access
8. Enable NAT Gateways for outbound internet access from private subnets
9. Allow SSH access only from a specific IP address (e.g., '203.0.113.0/24')
10. Use security groups to restrict access to resources
11. Implement a Bastion host for secure access to the private subnets
12. Ensure all S3 buckets have 'Block Public Access' options enabled

## Platform & Language

- **Platform**: CDK
- **Language**: TypeScript
- **Region**: us-east-1
- **Difficulty**: Medium