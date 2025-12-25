Need to build out our AWS infrastructure using CDK for multiple environments. We're running dev, staging, and prod in separate accounts under one org, all in us-west-2.

Here's what we need set up:

**VPC Setup**
- Need a VPC with 10.0.0.0/16 CIDR
- Make sure it follows standard security practices for network isolation

**IAM Permissions**
- All roles need to follow least privilege - only give what's actually needed
- No wildcard actions or resources in IAM policies - specify exact S3 bucket ARNs and specific actions like s3:GetObject, s3:PutObject
- Don't want any overly broad permissions floating around

**Tagging Strategy**
- Everything needs Environment, Owner, and Project tags so we can track costs and know who owns what

**S3 Security**
- All buckets must be encrypted at rest using KMS
- The Lambda functions will need to read/write to these buckets so make sure the IAM roles allow that

**Audit Logging**
- Turn on CloudTrail to capture all API calls across the account
- CloudTrail logs should go to a dedicated S3 bucket that only audit team can access

**Code Organization**
- Keep the CDK code modular so we can reuse components
- Don't want duplicate code all over the place

**Dynamic Configuration**
- Use variables for things like environment names and bucket lists so we can easily add more later
- Should be easy to spin up a new environment without copying/pasting code

**Security Requirements**
- Follow AWS security best practices for IAM, networking, encryption, logging, and secrets
- Never hardcode credentials or sensitive data

**Service Connectivity**
- Lambda functions need to access S3 buckets through VPC endpoints for security
- CloudTrail writes logs to S3 and publishes notifications to SNS when new logs arrive
- All services should communicate through private networking where possible

Put everything in a single CDK file with a class called TapStack. Make sure it's production-ready and would pass our security team's review.
