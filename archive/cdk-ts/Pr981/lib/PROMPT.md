# Secure Web Application Infrastructure Setup

I need to set up a secure infrastructure for a new web application using AWS CDK TypeScript. The infrastructure must follow production security best practices and include comprehensive logging and encryption.

## Requirements

**Region**: All resources must be deployed to ap-northeast-1 region.

**Security Requirements**:

- All S3 buckets must have server-side encryption enabled and access logging configured
- Database instances must be private with no public access allowed
- All sensitive data must be encrypted using AWS KMS customer managed keys
- All resources must be tagged with 'environment=production'
- IAM policies should follow principle of least privilege

**Infrastructure Components**:

- S3 buckets for web application assets with proper security configurations
- Private database (RDS) with KMS encryption
- Application Load Balancer for web traffic
- VPC with private and public subnets for secure network isolation
- CloudTrail for API logging and auditing
- S3 Transfer Acceleration for improved performance
- GuardDuty S3 Protection for malware detection

**Modern AWS Features**:

- Use S3 Transfer Acceleration to improve upload/download performance
- Enable GuardDuty S3 Protection for advanced threat detection on S3 buckets
- Configure CloudTrail with SSE-KMS encryption for enhanced log security

The solution should create a complete CDK TypeScript application with proper file structure including cdk.json, bin/tap.ts, and lib/tap-stack.ts files. Each infrastructure component should have appropriate security configurations and follow AWS Well-Architected Framework security pillar guidelines.

Generate infrastructure code that demonstrates proper resource tagging, KMS key management, secure networking, and comprehensive logging setup.
