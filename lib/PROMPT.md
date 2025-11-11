Hey team,

We need to set up a secure AWS infrastructure for our new application deployment. The security team is pretty strict on this one, so we need everything locked down properly. I'm thinking Terraform would be the best approach since we can version control everything and make it repeatable.

Let me walk you through what we need to build out:

## Network Foundation

First off, we need a proper VPC setup. Nothing fancy, but it needs to be solid:
- Create a VPC with both public and private subnets spread across multiple availability zones for redundancy
- Hook up an Internet Gateway for the public subnets so they can reach the outside world
- Set up NAT Gateways for the private subnets so instances there can make outbound calls without being directly exposed

## Application Servers

For the compute side, we're going with Auto Scaling Groups to handle load:
- Spin up EC2 instances using an Auto Scaling Group with a Launch Template
- Put them in the public subnets since they need to accept HTTPS traffic
- Security group should only allow inbound traffic on port 443, nothing else
- Keep the IAM role minimal - no wildcard permissions, just what's actually needed

## Database Setup

We need a MySQL or PostgreSQL RDS instance:
- Must be encrypted at rest using a KMS Customer Managed Key, not the default one
- Place it in the private subnets so it's not accessible from the internet
- Multi-AZ would be good for high availability

## Storage Requirements

Set up an S3 bucket with proper controls:
- Enable versioning so we can recover from accidental deletions
- Block all public access completely
- Turn on server-side encryption with S3-managed keys
- Create a read-only IAM policy called S3ReadAccess that we can attach where needed

## Security and Access

This is where we need to be really careful:
- Build IAM roles for EC2 and CloudTrail with least privilege
- Absolutely no wildcard permissions in any policies - security team will reject it otherwise
- Make sure the S3ReadAccess policy gets attached to the EC2 role

## Audit Trail

Compliance needs full visibility into what's happening:
- Set up CloudTrail to log all API calls
- Integrate it with CloudWatch Logs so we can search and alert on events
- Give CloudTrail the necessary permissions to write to CloudWatch

## Important Constraints

A few things to keep in mind:
- Don't enable deletion protection on RDS or S3 - we need to be able to tear this down cleanly for testing
- Security groups for EC2 should only allow HTTPS inbound, period
- All IAM policies need to follow least privilege principle
- Make sure the RDS encryption uses a CMK, not the AWS managed key
- NAT Gateway is required for private subnet egress

## What I Need

Can you put together the Terraform code for this? Ideally in two files - one for provider configuration and one for the main infrastructure. Use HCL format, add comments explaining the security decisions, and make sure it's ready to deploy to us-east-1. The code should include proper outputs for the key resources we'll need to reference later.

Let me know if you have questions on any of this.
