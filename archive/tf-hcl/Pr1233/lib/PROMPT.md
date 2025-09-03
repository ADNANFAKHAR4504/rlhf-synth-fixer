# Infrastructure Request

Hi, I need help creating a Terraform configuration for our production AWS environment. We're setting up secure S3 buckets with proper IAM access controls and want to make sure we follow all the security best practices.

## What I need:

I need a main.tf file that creates S3 buckets and IAM roles for our project. Everything should be secure and production-ready for the us-east-1 region.

## Requirements:

**File organization:**
- Put everything in main.tf (I already have provider.tf set up)
- Use aws_region variable instead of hardcoding the region
- Create all resources from scratch, don't reference existing stuff

**Security for S3:**
- Need AES-256 encryption on all buckets
- Block public access completely
- Proper bucket policies for security

**IAM setup:**
- Follow least privilege principle
- Tight permissions, no wildcards
- Only give access to what's actually needed

**Other stuff:**
- Include outputs for bucket names and role ARNs
- Add proper tags and comments
- Make sure it would pass security reviews

The goal is to have a single main.tf file that we can deploy safely in production for our S3 and IAM infrastructure. Thanks!