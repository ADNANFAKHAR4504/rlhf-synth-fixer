# Help with AWS Infrastructure Setup

## The Situation

We're launching a customer-facing web application next quarter and I've been tasked with setting up the AWS infrastructure. The CTO is pretty adamant about doing this right since our last project had some... let's call them "learning experiences" with downtime and security issues.

## What I'm Trying to Build

Basically need a solid CloudFormation setup that won't fall over when we get real traffic. The app serves regular web pages plus we've got a bunch of static assets (images, CSS, JS files) that need to load fast.

## Requirements (from the higher-ups)

**Infrastructure basics:**

- Has to be in us-east-1 (compliance thing, don't ask)
- Need a VPC with public and private subnets - 2 of each across different availability zones
- Internet gateway for public stuff, NAT gateway so private subnets can reach out

**Compute stuff:**

- EC2 instances running nginx in the public subnets
- Auto-scaling because apparently our marketing team is "confident" about user growth
- Security group that only allows access from our office IP (192.168.1.100/32)

**Storage and CDN:**

- S3 bucket for static files with public read access
- CloudFront distribution in front of it
- Route 53 to point our domain to CloudFront
- Everything needs to be HTTPS only

**Security bits:**

- IAM role so EC2 instances can write to CloudWatch logs
- Proper security groups (not just "allow all" like last time)

## What I Need

A CloudFormation template in YAML that I can actually deploy without breaking everything. I've tried cobbling together examples from the AWS docs but keep running into issues with dependencies and permissions.

The infrastructure team will review it before we deploy, but I'd rather not look completely clueless when I submit it.

Any help would be appreciated - this stuff always seems straightforward until you actually try to implement it!
