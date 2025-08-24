Hey there! I need some help with a CloudFormation template for a client project. We're building a web application that needs to be production-ready and super secure. Can you help me create a comprehensive CloudFormation template?

## What we're building

We need a CloudFormation template called `TapStack.yml` that sets up a complete web application infrastructure in AWS us-east-1. This is for a client who's pretty strict about security and compliance, so we need to make sure everything follows AWS best practices and the Well-Architected Framework.

## Here's what we need:

### 1. Network Setup
- A VPC with public and private subnets spread across multiple AZs (us-east-1a, us-east-1b, us-east-1c)
- At least 2 public and 2 private subnets
- The web servers should only run in private subnets (no public IPs)

### 2. Application Servers
- Auto Scaling Group that can scale from 2 to 6 instances based on load
- Health checks to make sure instances are actually working

### 3. Security (this is important!)
- IAM roles and policies that lock down who can modify the stack
- Security groups with minimal access - only ports 80/443 from trusted sources
- Outbound traffic should be restricted to only what's needed

### 4. Data Protection
- S3 bucket with KMS encryption and no public access
- RDS database in private subnets with KMS encryption
- AWS Secrets Manager for database credentials (with rotation)
- KMS for managing all the encryption keys

### 5. Monitoring & Logging
- CloudWatch for monitoring and logging
- A Lambda function that watches the logs and sends alerts via SNS
- WAF to protect against bad traffic and log suspicious activity

### 6. High Availability
- Everything distributed across multiple AZs
- Multi-layered security following AWS best practices

## What I need from you

Can you create a complete `TapStack.yml` CloudFormation template that:
- Works in us-east-1
- Passes AWS validation
- Meets all the security and availability requirements above
- Is production-ready and follows best practices

The client is going to review this, so it needs to be solid. Any tips or best practices you can include would be great too!
