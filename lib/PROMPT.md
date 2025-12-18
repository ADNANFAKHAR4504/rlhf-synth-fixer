Create a secure AWS CDK TypeScript infrastructure for a production environment with the following requirements:

1. All AWS resources must be tagged with 'Environment' set to 'production'
2. Set up AWS Key Management Service (KMS) to encrypt all data at rest including EBS volumes and S3 buckets
3. Create IAM roles that require Multi-Factor Authentication (MFA) for assumption
4. Use CDK best practices to handle sensitive information without hardcoding access keys

The infrastructure should include:
- S3 buckets with KMS encryption
- EC2 instances with encrypted EBS volumes
- IAM roles configured with MFA requirement
- Use AWS Security Hub for centralized security monitoring 
- Implement Amazon GuardDuty Extended Threat Detection for enhanced security

Deploy everything in us-east-1 region. Generate infrastructure code that follows security best practices and uses CDK intrinsic functions properly.