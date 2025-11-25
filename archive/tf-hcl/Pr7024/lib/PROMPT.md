Hey team,

We need to build out a secure AWS infrastructure using Terraform. I'm thinking we should keep everything organized in the lib folder - split it into provider.tf, variables.tf, and tap_stack.tf for the main resources. Makes it easier to maintain than one giant file.

So here's what we're looking at from a security standpoint:

**The Big Picture**

We're building a production-ready setup that hits all the security compliance checkboxes. VPC with proper isolation, everything encrypted, full audit trail, threat detection - the works. Target region is us-east-1, and we're following the standard naming convention: ProjectName-ResourceType-Environment.

One thing to note upfront - don't enable deletion protection anywhere. We need to be able to tear this down cleanly for testing and rebuilds.

**Networking Layer**

Start with a solid VPC foundation. We'll need public and private subnets across multiple AZs for HA. Public subnets get an Internet Gateway, private subnets route through NAT Gateways. Make sure the route tables are locked down - no accidentally exposing private resources.

For security controls, set up both Security Groups and NACLs. Defense in depth approach. Keep everything least-privilege - only open what's absolutely necessary.

**Security and Access Control**

KMS is non-negotiable for encryption. Create a CMK that we'll use across the board - S3, RDS, CloudWatch Logs, SSM parameters, CloudTrail, everything.

IAM roles need to be tight. We'll need:
- Lambda execution role (even though we might not deploy Lambda right away, let's stub it out)
- VPC Flow Logs role
- AWS Config role
- RDS monitoring role

All policies should follow least privilege. No wildcards unless there's a really good reason.

**Logging and Monitoring**

This is where a lot of folks cut corners, but we can't afford to. Need full visibility:

- CloudTrail for API auditing, multi-region enabled, dumping to S3
- CloudWatch log groups for VPC Flow Logs, Lambda, and RDS
- AWS Config to track configuration changes
- Basic CloudWatch alarms for the RDS instance (CPU, storage, connections)

S3 bucket for CloudTrail logs needs to be locked down hard - versioning on, encryption with KMS, public access blocked completely. Same for the Config bucket.

**Threat Detection**

GuardDuty gets enabled for threat detection. We should also set up a WAF Web ACL with some baseline rules - rate limiting, SQL injection protection, that kind of thing. AWS Managed Rule Sets are fine for starters.

Shield Advanced is enterprise-level DDoS protection but needs manual setup through the console. Just add a note about that in the outputs.

**Data Storage**

For S3, we need at minimum:
- CloudTrail logs bucket (already mentioned)
- Application data bucket  
- Config bucket

All three get the same treatment - KMS encryption, versioning, public access blocks, bucket policies that deny unencrypted uploads.

RDS setup should be PostgreSQL in the private subnets. Encryption at rest with our KMS key, automated backups with 7-day retention, Performance Insights enabled. Multi-AZ is nice to have but not required for this. Make sure public access is disabled and deletion protection is off.

**Configuration Management**

Use SSM Parameter Store for any secrets or config values. Store them as SecureStrings encrypted with KMS. We'll need at least a couple params as examples - database password, API keys, that sort of thing.

**Tagging Strategy**

Every single resource gets these tags:
```
Project     = "ProjectName"
Environment = "prod"
Owner       = "SecurityTeam"
```

This is important for cost tracking and resource management. Don't skip it.

**What I Need**

Three files in the lib folder:
1. provider.tf - Terraform config, AWS provider setup, backend config
2. variables.tf - Input variables with sensible defaults
3. tap_stack.tf - All the infrastructure resources

Keep the code clean and add comments explaining the security decisions. Follow Terraform best practices - use data sources where it makes sense, set up proper dependencies, all that good stuff.

And again, make absolutely sure deletion protection is disabled on RDS and there's no object lock on S3. We need to be able to destroy this stack cleanly for testing.

Let me know if you have questions on any of this. Thanks!
