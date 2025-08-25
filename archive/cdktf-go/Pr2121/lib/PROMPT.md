## What I'm Trying to Build

Hey, I'm working on setting up our AWS infrastructure using CDKTF with Go. We've got three environments (dev, staging, prod) and I need to figure out the best way to structure this so we're not duplicating code everywhere.

We picked CDKTF + Go because our team likes the type safety and we're more comfortable with Go than dealing with YAML or HCL files.

## Our Setup

We have three AWS accounts, each in different regions:
- Dev: us-east-1
- Staging: us-east-2  
- Production: us-west-1

## What I Need to Build

I need to create:
- VPCs with proper networking (public/private subnets, NAT gateways, etc.)
- IAM roles and policies that work across all environments
- S3 buckets for logging with cross-account replication
- A way to manage environment-specific configs without duplicating code

## The Problem I'm Running Into

I keep ending up with a lot of duplicated code between environments, and I'm not sure how to structure the Go project properly. I want to be able to deploy the same infrastructure to all three environments but with environment-specific values (like different CIDR ranges, account IDs, etc.).

## What I'm Looking For

I need help with:
1. How to organize the Go project structure for multiple environments
2. Creating reusable components so I'm not copying/pasting code
3. Managing configuration for different environments
4. Setting up the main application and stacks properly
5. How to handle deployments across different AWS accounts

## What Would Be Really Helpful

If you could show me:
- A complete Go project structure that makes sense
- Working CDKTF code for the core infrastructure (VPC, IAM, S3)
- A clean way to handle environment-specific configurations
- How to structure the main application
- Maybe an example of how to set up CI/CD for this

I want something I can actually use - like a project I can clone, add my AWS account details to, and deploy successfully. The code should be production-ready with proper error handling and clear separation between environments.

Any help would be awesome! I've been stuck on this for a while and could really use some guidance on the best practices for CDKTF with Go.