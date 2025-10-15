# AWS CDK Java Implementation: Secure Cloud Infrastructure

## What You Need to Build

Hey there, write a Java program using AWS CDK to set up a secure AWS cloud environment. The environment needs to include EC2, Lambda, S3, RDS, DynamoDB, and other AWS services within a VPC, all following security best practices.

## Security Requirements

### IAM Security
- Make sure IAM roles only allow specific actions for the Lambda function
- Require MFA for IAM users accessing the application  
- Limit IAM user policies to specific resource ARNs (least privilege principle)

### Network Security
- Launch EC2 instances inside a VPC
- Don't allow SSH access from 0.0.0.0/0 in any security groups
- Set up a bastion host for SSH access to production servers
- Enable VPC flow logs to monitor traffic

### Storage Security
- Restrict S3 bucket access to specific IP addresses only
- Encrypt all data at rest using AWS KMS
- Encrypt EBS volumes when they're created
- Log all S3 bucket actions with CloudTrail

### Database Security
- Disable public access to RDS instances (keep them in the VPC)
- Use customer-managed KMS keys for DynamoDB encryption
- Enable point-in-time recovery for DynamoDB tables

### Web Application Security
- Make CloudFront distributions use HTTPS only
- Use AWS WAF for any public-facing APIs
- Implement AWS Shield for DDoS protection

### Monitoring and Compliance
- Use CloudTrail to monitor all AWS API calls
- Set audit log retention to at least 365 days
- Deploy GuardDuty for threat monitoring
- Use AWS Config to track resource configuration and compliance
- Create CloudWatch Dashboards for monitoring
- Configure CloudWatch alarms for critical services

## What You Need to Deliver

### Security Stack

Create a SecurityStack class that handles:
- KMS key for encryption (with key rotation enabled)
- Security log group with 365 days retention
- GuardDuty detector with 15-minute finding frequency
- CloudTrail for API monitoring
- AWS Config for compliance tracking
- WAF web ACL with IP restrictions

The KMS key should be used throughout the infrastructure for encrypting everything.

### Infrastructure Stack

Create an InfrastructureStack class that sets up:

**VPC Configuration:**
- VPC with CIDR 10.0.0.0/16
- Public subnets (for bastion host)
- Private subnets with NAT gateway (for EC2 instances)
- Isolated database subnets (for RDS)
- VPC flow logs enabled with 365 days retention

**Security Groups:**
- SSH security group that only allows access from specific IPs (no 0.0.0.0/0)
- Separate security group for bastion host
- Database security group that only allows traffic from application layer

**Compute Resources:**
- Bastion host in public subnet for SSH access
- EC2 instance in private subnet with encrypted EBS volume
- RDS database in isolated subnet with encryption and no public access

### Application Stack

Create an ApplicationStack class with:

**S3 Bucket:**
- KMS encryption enabled
- Block all public access
- Versioning enabled
- Bucket policy restricting access to specific IPs only

**Lambda Function:**
- IAM role with least privilege (specific S3 and KMS permissions only)
- Python 3.11 runtime
- Connected to DynamoDB for logging requests
- Environment variables for configuration

**DynamoDB Table:**
- Customer-managed KMS encryption
- Point-in-time recovery enabled
- Partition key: userId (String)
- Sort key: timestamp (Number)
- Used for tracking user activity and request logging

**API Gateway:**
- REST API connected to Lambda
- Rate limiting configured
- Request validation enabled
- WAF attached for protection
- CloudWatch logging enabled

**CloudFront Distribution:**
- HTTPS only (redirect HTTP to HTTPS)
- Connected to S3 origin
- Custom error responses
- Logging enabled

**CloudWatch Dashboard:**
- Lambda metrics (invocations, errors, throttles)
- API Gateway metrics (requests, 4xx/5xx, latency)
- RDS metrics (CPU, connections, storage)
- DynamoDB metrics (read/write capacity, throttles)

### Main Stack

Create a TapStack class that:
- Takes environment suffix from environment variable or context
- Gets allowed IP addresses from environment variable
- Creates all nested stacks in the right order
- Sets up proper dependencies between stacks

Example usage:
```
ENVIRONMENT_SUFFIX=pr4122 ./gradlew run
```


## Security Compliance Tests

Write JUnit tests to verify:
- No security groups allow SSH from 0.0.0.0/0
- All S3 buckets use KMS encryption
- RDS instances are not publicly accessible
- CloudTrail uses KMS encryption and is multi-region
- VPC Flow Logs are enabled
- GuardDuty is enabled
- DynamoDB tables use KMS encryption and have point-in-time recovery

## Build Configuration

build.gradle should include:
- AWS CDK library version 2.90.0
- Java 11 or higher
- JUnit 5 for testing
- CDK assertions library

cdk.json should have:
- app command pointing to "./gradlew run"
- Feature flags for security best practices
- Context for environment-specific configuration

## Environment Configuration

The app should support:
- ENVIRONMENT_SUFFIX environment variable (defaults to "dev")
- ALLOWED_IP_ADDRESSES environment variable (comma-separated)
- CDK_DEFAULT_ACCOUNT from AWS credentials
- CDK_DEFAULT_REGION for deployment region

## Architecture Overview

Security Layer: KMS, GuardDuty, CloudTrail, AWS Config

Data Storage Layer: DynamoDB table for user activity tracking

Application Layer: Lambda → API Gateway → WAF → CloudFront, with S3 for storage

Infrastructure Layer: VPC with public/private/database subnets, EC2 instances, bastion host, RDS database, VPC flow logs

Monitoring Layer: CloudWatch Dashboard with metrics for Lambda, API Gateway, RDS, and DynamoDB

## Deployment Steps

1. Install prerequisites (Node.js, AWS CLI, CDK CLI, Java 11+)
2. Configure AWS credentials
3. Set environment variables (account, region, suffix, allowed IPs)
4. Bootstrap CDK (first time only)
5. Build the project with Gradle
6. Run tests to verify security compliance
7. Deploy all stacks with `cdk deploy --all`

## Validation

After deployment, verify:
- CloudTrail is enabled and logging
- GuardDuty is active
- S3 buckets are encrypted
- RDS instances are encrypted and private
- VPC Flow Logs are working
- Security groups don't allow SSH from anywhere
- DynamoDB tables have encryption and point-in-time recovery
- CloudWatch dashboard shows metrics

## Important Notes

- All resources should use the environment suffix in their names
- KMS key should be shared across all stacks for consistent encryption
- Security stack must be created first (other stacks depend on it)
- Use proper dependency management between stacks
- Follow AWS CDK best practices for Java
- Make sure removal policies are set appropriately (DESTROY for dev environments)
- Use proper IAM least privilege principles everywhere
- Don't hardcode any secrets or sensitive data