# Multi-Environment CloudFormation Setup

I'm working on setting up consistent Dev and Prod environments in AWS and need a CloudFormation template that keeps everything in sync between the two.

## What I need

Looking for a YAML CloudFormation template that sets up:

**Two environments - Dev and Prod**
- Need them to have the same setup but separate resources
- Want to use parameters so I can override resource names
- Should use Dev/Prod prefixes to keep things organized

**Networking stuff**
- Each environment gets its own VPC with 10.0.0.0/16 (same CIDR for consistency)
- Public and private subnets in each VPC
- Internet gateway and NAT gateway for connectivity

**Compute**
- One t2.micro EC2 instance per environment
- Put them in private subnets for security
- Same config for both environments

**Storage**
- S3 bucket for each environment with versioning turned on
- Make sure buckets aren't publicly accessible
- Different bucket names so they don't conflict

**Security/IAM**
- IAM roles that only have access to their own environment's S3 bucket
- Separate roles for Dev vs Prod
- Instance profiles for the EC2 instances

**VPC Endpoints**
- S3 VPC endpoints so traffic stays inside AWS network
- Need them for both environments

**Outputs**
- Export the VPC IDs so I can reference them from other stacks
- Output the main resource IDs I'll need

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