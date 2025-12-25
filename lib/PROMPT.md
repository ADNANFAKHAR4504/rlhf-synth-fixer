# Multi-Environment AWS Infrastructure Setup

I need to set up consistent infrastructure for multiple environments in AWS using Terraform. I want to create production, staging, and development environments, each isolated in its own VPC.

## Requirements

1. Create three separate environments: production, staging, and development
2. Each environment must be in its own VPC with proper isolation
3. Use Terraform modules to avoid code duplication
4. Implement proper tagging strategy with Environment, Owner, and Purpose tags
5. Configure Network ACLs to prevent cross-environment traffic
6. Use different instance types per environment:
 - Development: t2.micro
 - Staging: t3.medium
 - Production: m5.large
7. Use variables and configurations to control environment setup like CIDR blocks
8. Create consistent IAM roles and policies across all environments
9. Each environment should have both public and private subnets across two availability zones
10. Implement Security Group rules with proper ingress and egress controls
11. Configure VPC Flow Logs to CloudWatch for network traffic monitoring

## Environment Details

- AWS Region: us-west-2
- Naming convention: environment name as prefix, then resource type. Example patterns are prod-webserver or dev-database
- Each VPC should use different CIDR blocks to prevent overlap
- Include VPC endpoints for AWS services
- Enable VPC Flow Logs with CloudWatch integration

## Network Security and Service Integration

The infrastructure needs integrated security and logging:

- Configure Network ACLs with restrictive rules to control subnet-level traffic
- Use distinct security groups per environment with proper VPC associations
- VPC Flow Logs should send network traffic logs directly to CloudWatch Logs for monitoring and analysis
- CloudWatch Logs integration must capture VPC flow data for each environment separately
- Ensure proper subnet routing tables with Internet Gateway attached for public subnets
- Configure NAT Gateway in public subnets to enable private subnet instances to access internet
- IAM roles should grant VPC Flow Logs permissions to write logs to CloudWatch Logs

## Service Connectivity Requirements

The following service connections are essential:

1. VPC Flow Logs connect to CloudWatch Logs to stream network traffic data
2. IAM roles provide VPC Flow Logs with permissions to publish logs to CloudWatch
3. Network ACLs and Security Groups work together to control traffic at subnet and instance levels
4. NAT Gateway in public subnets provides internet connectivity to resources in private subnets
5. Internet Gateway attaches to VPC to enable public subnet internet access
6. CloudWatch Logs receives and stores flow log data from all three VPC environments

Please provide the complete Terraform infrastructure code. Include one code block per file so each file can be created by copy-pasting the content.
