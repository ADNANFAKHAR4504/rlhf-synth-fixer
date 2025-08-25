# Multi-Environment AWS Infrastructure Setup

I need help setting up AWS infrastructure that can handle multiple environments (dev, test, prod) for my web application. I want everything to be consistent across environments but with appropriate security boundaries and environment-specific configurations.

## What I need:

**S3 Storage Setup:**
- Separate S3 buckets for each environment to store shared configuration files
- Buckets should have proper naming with environment prefixes
- Use the new S3 default data integrity protections that were announced recently
- Include versioning and appropriate lifecycle policies

**DynamoDB Configuration:**
- DynamoDB tables that adapt to different environments with appropriate scaling
- Environment-specific table names and configurations  
- Take advantage of the new DynamoDB resource-based policies for better security
- Different read/write capacity settings per environment (dev should be smaller, prod larger)

**IAM Security:**
- Environment-specific IAM roles that prevent cross-environment access
- Users and services should only access resources in their environment
- Policies should be restrictive and follow least-privilege principles
- Separate roles for different application components

**CloudWatch Logging:**
- Different log groups for each environment
- Environment-specific retention periods (dev: 7 days, test: 30 days, prod: 90 days)
- Appropriate log levels per environment
- Use the new CloudWatch OpenSearch integration if it helps with log analysis

**Systems Manager Parameter Store:**
- Store sensitive configurations securely
- Environment-specific parameter paths
- Different encryption settings per environment
- Parameters for database connections, API keys, etc.

## Requirements:
- Deploy in us-east-1 region
- Support for dev, test, and prod environments
- Clean separation between environments
- Cost-effective for development environments
- Production-ready security and monitoring
- Easy to deploy and manage

## Constraints:
- Need infrastructure as code (preferably CDK)
- Must be parameterized for different environments
- Should include proper tagging for cost tracking
- Keep deployment times reasonable (avoid slow-deploying resources when possible)

Can you create a complete CDK solution that handles all of this? I want one codebase that can deploy to any environment with the right parameters.