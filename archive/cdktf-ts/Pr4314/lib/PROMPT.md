# CI/CD Pipeline Infrastructure for Educational Content Delivery

Create infrastructure using **CDKTF with TypeScript** for a secure, compliant CI/CD pipeline for a Brazilian educational institution's content delivery platform.

## Background

A large Brazilian educational institution needs to modernize its content delivery infrastructure. They require an automated CI/CD pipeline that can securely build, test, and deploy educational content while maintaining compliance with educational data protection regulations.

## Requirements

### 1. Source Control and Build Pipeline

- Set up an AWS CodeCommit repository for storing educational content and application code
- Configure AWS CodePipeline to automatically trigger on code commits
- Implement AWS CodeBuild for building and testing the application
- Include build specifications for Node.js-based educational content applications
- Enable artifact versioning and storage in S3

### 2. Deployment Infrastructure

- Use AWS CodeDeploy for automated deployments
- Deploy to an EC2 instance or Auto Scaling group
- Implement blue/green deployment strategy for zero-downtime updates
- Configure deployment rollback on failure

### 3. Content Delivery

- Set up Amazon S3 bucket for storing static educational content (videos, PDFs, images)
- Configure Amazon CloudFront distribution for global content delivery with low latency
- Enable CloudFront logging for compliance and analytics
- Implement Origin Access Identity (OAI) or Origin Access Control (OAC) for secure S3 access

### 4. Security and Compliance

- Implement least-privilege IAM roles for all services
- Enable encryption at rest for S3 buckets (SSE-S3)
- Enable encryption in transit using HTTPS/TLS
- Configure S3 bucket policies to prevent public access
- Use AWS KMS for sensitive configuration data
- Implement CloudWatch Logs with retention policies (14 days)

### 5. Monitoring and Notifications

- Set up CloudWatch alarms for pipeline failures
- Configure SNS topic for pipeline status notifications
- Enable CloudWatch Logs for CodeBuild and CodeDeploy
- Monitor CloudFront access patterns and errors

### 6. Infrastructure Configuration

- Use `environmentSuffix` for all resource naming to support multiple environments
- Default region: us-east-1
- Ensure all resources are destroyable (no retention policies that prevent cleanup)
- Tag all resources appropriately with Environment, Repository, and CommitAuthor tags

### 7. Best Practices

- Implement S3 lifecycle policies for cost optimization (transition old artifacts to Glacier)
- Use S3 bucket versioning for artifact history
- Enable VPC endpoints for S3 and other AWS services where applicable
- Configure proper CORS policies for CloudFront and S3 for web-based content access

## Technical Constraints

- Must use CDKTF with TypeScript
- Follow modular design with separate constructs for each major component (pipeline, content delivery, security)
- All resource names must include `environmentSuffix` to avoid conflicts
- Include comprehensive Terraform outputs for integration testing

## Deliverables

Provide complete, working CDKTF TypeScript code with:

1. `tap-stack.ts` - Main stack file that orchestrates all modules
2. `pipeline-module.ts` - CodePipeline, CodeBuild, CodeDeploy, CodeCommit resources
3. `content-delivery-module.ts` - S3, CloudFront, OAC resources
4. `monitoring-module.ts` - CloudWatch, SNS resources
5. All necessary IAM roles, policies, and security configurations
6. Proper error handling and resource dependencies
7. Terraform outputs for all key resource identifiers

The solution should be production-ready, secure, and compliant with educational data protection requirements.