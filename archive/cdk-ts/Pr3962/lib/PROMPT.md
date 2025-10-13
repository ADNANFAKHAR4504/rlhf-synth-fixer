# AWS Security Baseline Implementation Task

We need to build a comprehensive security baseline for our AWS infrastructure using CDK TypeScript. This isn't just about ticking boxes - we need something that actually works in production and follows real security best practices.

## What We're Building

You'll be creating a CDK stack that includes:

1. **IAM & Identity Management**
   - At least one IAM role (for Lambda execution)
   - One IAM policy 
   - One IAM user (can be a placeholder)

2. **Networking**
   - A complete VPC with subnets
   - VPC flow logs
   - Network ACLs with proper restrictions

3. **Storage & Content Delivery**
   - S3 bucket with proper security
   - CloudFront distribution

4. **Application Layer**
   - API Gateway REST API
   - Lambda function (Node.js 18.x) integrated with the API

5. **Audit & Compliance**
   - CloudTrail for logging
   - KMS key for encryption

6. **Database**
   - RDS instance (PostgreSQL or MySQL)

## Security Requirements

Here's what needs to be implemented - these aren't suggestions, they're requirements:

### IAM Security
- **MFA Enforcement**: All IAM users must have MFA required via a custom policy
- **Trust Relationships**: Every IAM role needs proper trust relationships defined
- **Access Control**: Use grant methods or IAM policies to restrict resource access

### S3 & Data Protection
- **Encryption**: Enable server-side encryption (SSE-S3 or KMS) on all S3 buckets
- **Public Access**: Block all public access using `blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL`

### CloudFront & WAF
- **WAF Integration**: Attach a WAF Web ACL to the CloudFront distribution
- **Web ACL**: Create a basic WAF Web ACL with some standard rules

### API Gateway
- **HTTPS Only**: Ensure HTTPS is enforced (should be default, but verify)
- **Request Signing**: Implement SigV4 request signing for API integrations

### Audit & Governance
- **CloudTrail Encryption**: Use the KMS key to encrypt CloudTrail logs
- **AWS Config**: Enable configuration tracking using `aws-config.CfnConfigurationRecorder`
- **Security Hub**: Enable Security Hub in the current region

### Network Security
- **VPC Flow Logs**: Create flow logs and send them to CloudWatch Logs using `vpc.addFlowLog`
- **Network ACLs**: Block inbound traffic from IPs not on an allowlist using `NetworkAclEntry` with `traffic: DENY`
- **Security Groups**: Ensure Lambda security group denies port 22 from internet (0.0.0.0/0)
- **VPC Endpoints**: Use VPC endpoints for S3, CloudWatch Logs, etc.

### Compute & Database
- **Lambda Runtime**: Use the latest stable Node.js runtime (`NODEJS_18_X`)
- **RDS Logging**: Enable audit and error logging via parameter groups

### Resource Tagging
- **Global Tags**: Apply `Environment: Production` tag to all resources using `Tags.of(this).add()`

## Deliverables

Provide a complete TypeScript CDK implementation with:
- Main stack file (`secure-baseline-stack.ts`)
- Entry point file (`main.ts`)
- All necessary imports and dependencies
- Comments highlighting where each security constraint is implemented

Make sure the code is production-ready and follows CDK best practices. Focus on making the resources work together properly - for example, ensure the Lambda can actually connect to the RDS instance through proper security group configurations.