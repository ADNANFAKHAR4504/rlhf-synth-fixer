# Multi-Environment CloudFormation Setup

I'm working on setting up consistent Dev and Prod environments in AWS and need a CloudFormation template that keeps everything in sync between the two.

## What I need

Looking for a YAML CloudFormation template that sets up:

**Two environments - Dev and Prod**
- Need them to have the same setup but separate resources
- Want to use parameters so I can override resource names
- Should use Dev/Prod prefixes to keep things organized

**Networking architecture with service connectivity**
- Each environment gets its own VPC with 10.0.0.0/16 CIDR block - using the same range for consistency between environments
- Public and private subnets in each VPC
- Internet gateway connected to public subnets for outbound connectivity
- NAT gateway in public subnet that routes traffic from private subnets to internet
- Route tables that connect private subnets through NAT gateway and public subnets through internet gateway

**Compute with network integration**
- One t2.micro EC2 instance per environment
- EC2 instances deployed in private subnets and routed through NAT gateway
- Instances attached to IAM instance profiles for S3 access
- Security groups controlling traffic between EC2 and VPC endpoints

**Storage with VPC endpoint access**
- S3 bucket for each environment with versioning turned on
- EC2 instances connect to S3 through VPC endpoints - this keeps all traffic inside the AWS network
- Buckets aren't publicly accessible, only accessible via IAM roles from EC2
- Different bucket names so they don't conflict across environments

**Security/IAM integration**
- IAM roles attached to EC2 instances via instance profiles
- Roles scoped to only access their own environment's S3 bucket - Dev role can't access Prod bucket and vice versa
- EC2 instances use these roles to authenticate S3 requests through VPC endpoint
- Separate roles for Dev vs Prod with resource-level permissions

**VPC Endpoints for private connectivity**
- S3 VPC endpoints attached to private subnets where EC2 runs
- Endpoint policies allowing access from IAM roles only
- Traffic from EC2 to S3 flows through VPC endpoint without internet gateway

**Outputs and cross-stack references**
- Export the VPC IDs so other stacks can reference them
- Output the S3 bucket names for application configuration
- Export security group IDs for cross-stack EC2 deployments
- Output IAM role ARNs for additional service integrations

## Recent AWS stuff to include

If possible, incorporate some of the newer CloudFormation features:
- Stack Refactoring capabilities from 2025
- AWS Parallel Computing Service support if it makes sense

## Deployment notes

- Needs to work in us-east-1
- Try to keep deployment time reasonable
- Follow CloudFormation best practices
- Use parameters for flexibility

Can you help me build this template with all the resources I need for both environments?