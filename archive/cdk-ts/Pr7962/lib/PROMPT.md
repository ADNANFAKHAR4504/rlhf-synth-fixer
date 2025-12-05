# Cloud Security Infrastructure Project

I need help building a secure AWS environment for our EC2 fleet. We're running into some challenges with our current setup and could use some expert guidance.

## What We're Trying to Build

We have a bunch of EC2 instances that need to be properly secured. Right now, our security groups are all over the place - some instances have different rules than others, which is causing compliance headaches. We also need to make sure our IAM roles follow the principle of least privilege.

## Specific Requirements

**Security Groups**: We need one security group that we can apply to all our EC2 instances. It should have consistent inbound and outbound rules that we can easily modify without touching the core code.

**IAM Roles**: Our EC2 instances need IAM roles that only give them the permissions they actually need. They should be able to access a specific S3 bucket for data storage and use KMS keys for encryption, but nothing more.

**Multi-Account Setup**: We're planning to deploy this across multiple AWS accounts in our organization. The IAM roles and resource policies need to support this.

**Resource Connections**: I want to see exactly how the IAM roles and security groups get attached to the EC2 instances. No magic - everything should be explicit.

**Configuration**: We need to be able to change security rules, IAM policies, and S3 bucket names without digging into the main code.

## What I Need

A complete TypeScript file for AWS CDK that I can actually run. The code should be well-commented so I understand why each security decision was made. This needs to be production-ready and deployable across our multi-account environment.

No placeholders or template text - just working code that I can use right away.