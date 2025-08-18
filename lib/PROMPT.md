# Multi-Region AWS Infrastructure Challenge

Hey, so I need help building out some AWS infrastructure that's been giving me headaches. We're trying to set up a multi-region deployment but there's a bunch of conflicting requirements that don't seem to play nice together.

## What I'm trying to build

Basically, I need identical infrastructure in US East (Virginia) and EU Central (Frankfurt). The tricky part is that everything needs to be consistent between regions, but also completely isolated - no cross-region traffic allowed except for some edge cases.

## The pain points I'm dealing with:

- Need to use CDKTF with TypeScript (not Python like I originally thought)
- VPCs in each region with different CIDR blocks but same design
- RDS instances with 7-day backups and encryption
- S3 buckets that are encrypted and logged properly
- No SSH access anywhere - everything through SSM
- KMS encryption for everything sensitive
- Security groups that are locked down tight
- CloudWatch monitoring and alerting
- CloudTrail for audit logs

## Security requirements that are non-negotiable:

- No hardcoded secrets anywhere
- Minimal IAM permissions (least privilege)
- Everything encrypted in transit and at rest
- VPC-only traffic (no internet gateways unless absolutely necessary)
- Cross-region isolation (resources can't talk to each other across regions)

## What's making this complicated:

The infrastructure needs to be deployable to any AWS region later, but right now we're only doing these two. Also, some of the security policies seem to conflict with each other, and I'm not sure how to handle that.

I've been trying to get this working with CDKTF but keep running into issues with the synthesis and deployment. The code needs to pass linting, build properly, and actually deploy without errors.

Can you help me build this out? I need the CDKTF code that will create this infrastructure reliably in both regions.