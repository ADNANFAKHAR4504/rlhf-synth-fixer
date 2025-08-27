# Multi-Environment AWS Infrastructure Setup

We need to build a robust AWS infrastructure setup that can handle both development and production environments. This is for a Java-based application that needs to be deployed across different AWS accounts for proper environment isolation.

## What We're Building

The infrastructure should include:

- A VPC setup with public and private subnets spread across two availability zones for high availability
- EC2 instances running in the private subnets for security
- An Application Load Balancer in the public subnets to distribute traffic to the EC2 instances
- Proper security configurations including IAM roles and security groups
- Support for both dev and prod environments in separate AWS accounts

## Technical Requirements

**Region**: Everything should be deployed in us-east-1

**Environment Separation**: We need strict isolation between development and production. Each environment should be in its own AWS account to prevent any cross-contamination.

**Network Setup**: 
- Two public subnets and two private subnets
- Spread across two availability zones for redundancy
- Private subnets should have NAT Gateway access for outbound internet connectivity

**Compute Resources**:
- EC2 instances should be placed in the private subnets
- They need to be accessible from the load balancer but not directly from the internet

**Load Balancing**:
- Application Load Balancer should be in the public subnets
- It should distribute HTTP traffic to the EC2 instances
- Should be internet-facing so users can access it

**Security**:
- Follow AWS security best practices
- Use least privilege principle for IAM roles
- Configure security groups to only allow necessary traffic
- Set up proper network ACLs

## Implementation Details

We're using AWS CDK with Java for this project. The code should be:

- Modular and reusable for both environments
- Well-documented with clear comments explaining the design decisions
- Self-contained so it can be deployed with simple CDK commands
- Properly structured with environment-specific configurations

The goal is to have a single codebase that can deploy to either development or production environment based on configuration parameters, while maintaining complete separation between the two environments.

## Expected Deliverables

1. A working AWS CDK Java application that creates all the required infrastructure
2. Clear documentation explaining how to deploy to different environments
3. Proper resource naming and tagging for environment identification
4. CloudFormation outputs for important resource information like load balancer DNS names

This infrastructure will serve as the foundation for our Java application deployment and should be production-ready with proper security and scalability considerations.