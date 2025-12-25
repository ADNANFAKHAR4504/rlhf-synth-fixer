# Multi-Environment AWS Infrastructure Setup

I need to set up consistent infrastructure for multiple environments in AWS using AWS CDK with TypeScript. I want to create production, staging, and development environments, each isolated in its own VPC.

## Requirements

1. Create three separate environments: production, staging, and development
2. Each environment must be in its own VPC with proper isolation
3. Use CDK constructs and classes to avoid code duplication
4. Implement proper tagging strategy with Environment, Owner, and Purpose tags
5. Configure Network ACLs to prevent cross-environment traffic
6. Use different instance types per environment:
   - Development: t2.micro
   - Staging: t3.medium  
   - Production: m5.large
7. Use props and configurations to control environment setup like CIDR blocks
8. Create consistent IAM roles and policies across all environments
9. Each environment should have both public and private subnets
10. Implement Security Group VPC Associations for better security group management
11. Use Shared Security Groups feature for centralized security management

## Environment Details

- AWS Region: us-west-2
- Naming convention: {env}-{resource-type} (e.g., prod-webserver, dev-database)
- Each VPC should use different CIDR blocks to prevent overlap
- Include basic EC2 instances in each environment for testing

## Network Security

- Configure Network ACLs with restrictive rules
- Use distinct security groups per environment with VPC associations
- Implement VPC Flow Logs for monitoring
- Ensure proper subnet routing tables

Please provide the complete AWS CDK TypeScript infrastructure code. Include one code block per file so each file can be created by copy-pasting the content.