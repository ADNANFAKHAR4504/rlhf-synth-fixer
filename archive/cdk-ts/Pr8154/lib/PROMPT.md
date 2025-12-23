I need help creating a secure AWS infrastructure for our company SecureCorp using CDK with TypeScript. We need to implement a comprehensive security configuration that follows enterprise security best practices.

Here's what I need:

1. A VPC setup that spans multiple availability zones with proper CIDR configuration for multi-account support
2. IAM roles and policies that implement least privilege access for different user roles in our organization
3. All data encryption at rest using KMS for S3 buckets, RDS databases, and EBS volumes
4. Complete audit logging with CloudTrail to capture all API calls across our infrastructure
5. VPC endpoints for secure internal communication without internet routing

I want to use some of AWS's newer security features too. I read about CloudTrail network activity events for VPC endpoints that became available recently - can we incorporate that for better visibility? Also interested in any recent VPC security enhancements.

The infrastructure should be designed for production use with proper resource naming conventions. We'll be deploying this in us-east-1 region.

Please provide the infrastructure code with one code block per file. Make sure everything is properly configured for security and compliance requirements.