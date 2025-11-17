Hey team,

We need to build out a secure AWS environment for our web application. The security team is breathing down our necks about compliance requirements, so we need to make sure everything follows proper security practices.

Everything needs to be automated with Terraform, and for this project, we want everything in a single file (tap_stack.tf) - no external modules or variables files to keep things simple.

Here's what we need to set up:

## Region Setup
Stick to us-east-1 for everything. Management wants to keep it simple for now.

## Network Architecture
Set up a VPC with both public and private subnets spread across at least two availability zones. We'll need an Internet Gateway and proper route tables to keep our internal stuff separate from public-facing resources.

## Security Requirements
The compliance folks are pretty strict about this:
- Use IAM roles and policies to lock down resource access
- Enable MFA for all IAM users (they're serious about this one)
- Don't enable deletion protection on anything - we need to be able to tear this down for testing

## Encryption Everything
Use AWS KMS for encryption wherever possible. All S3 buckets need server-side encryption with KMS keys. No exceptions.

## Monitoring and Compliance
We need complete logging:
- Enable CloudTrail for all management events
- Set up AWS Config to enforce security compliance rules  
- All logs should go to a central S3 bucket with versioning and encryption

## Application Protection
Since we're dealing with web traffic, we need:
- AWS WAF attached to an Application Load Balancer to block common attacks
- GuardDuty for threat detection
- AWS Shield Standard for DDoS protection (it's free anyway)

## Database Setup
Create an RDS instance (MySQL or PostgreSQL) in the private subnets. Make sure enhanced monitoring and encryption are enabled. Again, no deletion protection.

## Secrets Management
Use AWS Secrets Manager for database credentials. No hardcoded passwords anywhere.

## Logging Strategy
Everything should feed into that central S3 logging bucket - application logs, VPC flow logs, CloudTrail, Config logs, the works.

## Setup Requirements
The Terraform file should deploy cleanly without manual intervention. Keep IAM privileges minimal but functional. Don't hardcode sensitive stuff - use proper references.

## Additional Constraints
- Everything in us-east-1
- No deletion protection anywhere
- Single file setup (tap_stack.tf)
- Include encryption, MFA enforcement, centralized logging, and all the security services
- Follow Terraform good practices even within a single file
- Use descriptive naming and proper tagging

## What We Need
Build a single Terraform file (tap_stack.tf) that:
- Sets up all the AWS resources in the right order
- Meets all the security requirements above
- Doesn't have deletion protection enabled
- Uses AWS-managed services like Config, GuardDuty, Shield, WAF, CloudTrail, KMS, Secrets Manager
- Has good comments explaining the security controls
- Includes Auto Scaling Groups for EC2 instances with proper ALB target group setup
- Sets up SNS topics for monitoring and alerts
- Creates CloudWatch log groups for all components

## Output Requirements
Just give us the complete Terraform configuration file. Make sure it's properly formatted HCL code with good comments throughout. Don't summarize or break it into sections - we need the full working file.

Include all the outputs we'll need for integration testing: VPC, subnets, RDS, S3, KMS, secrets, SNS, ASG, and CloudWatch resources.