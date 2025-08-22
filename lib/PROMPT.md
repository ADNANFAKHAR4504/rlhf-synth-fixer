# CloudFormation Template for Secure Multi-Region Infrastructure

I need a CloudFormation YAML template that creates a secure, multi-region AWS infrastructure with the following requirements:

## Core Security Requirements
1. IAM roles and policies with least privilege access principles
2. Encryption at rest for all storage resources using AWS KMS with customer-managed keys
3. CloudTrail logging for all API calls with log file encryption
4. AWS Config for configuration auditing and compliance monitoring
5. S3 buckets must not be publicly accessible with proper bucket policies
6. Security groups restricting inbound access to specific IP ranges only
7. Network ACL rules with necessary inbound and outbound restrictions
8. VPC endpoints for secure S3 access
9. MFA enforcement for IAM users where applicable
10. Comprehensive resource tagging for governance

## Latest AWS Security Features to Include
- Amazon GuardDuty with Malware Protection for S3 monitoring
- VPC Lattice for secure service-to-service communication

## Infrastructure Components
- VPC with public and private subnets across multiple AZs
- KMS keys for encryption with appropriate key policies
- CloudTrail trail with S3 bucket for log storage
- AWS Config configuration recorder and delivery channel
- S3 buckets with encryption and access logging
- Security groups with restrictive rules
- VPC endpoints for S3 access
- IAM roles for service access with least privilege

## Template Requirements
- Must work across any AWS region (region-independent)
- Use CloudFormation YAML format only
- Name the main template file "SecureInfraSetup.yaml"
- Include parameters for environment customization
- Add comprehensive outputs for resource references
- Include detailed resource descriptions and comments
- Ensure all resources follow AWS security best practices
- Tag all resources with Environment, Project, and Owner tags

Please provide one code block per file. The infrastructure should be production-ready and align with AWS Trusted Advisor security recommendations.