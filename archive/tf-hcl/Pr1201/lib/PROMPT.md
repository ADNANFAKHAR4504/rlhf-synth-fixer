# Secure Multi-Account AWS Infrastructure with Terraform

I need to design Terraform infrastructure for a secure AWS cloud environment with robust security settings across a multi-account AWS Organization.

Please create the infrastructure code that includes:

1. IAM roles and policies following the principle of least privilege
2. KMS key for encrypting sensitive data at rest across services  
3. CloudWatch and SNS configured to send security alerts on IAM actions
4. AWS Config setup for monitoring compliance with security rules
5. Consistent tagging using 'Environment' and 'Project' tags across all resources
6. S3 buckets with mandatory encryption for data at rest and in transit
7. Lambda function and Step Function workflow for automated security responses to unauthorized login attempts
8. Cross-account access policies secured using IAM roles
9. Logging enabled for all sensitive resource accesses
10. Use AWS Security Hub and Amazon GuardDuty for enhanced threat detection

The infrastructure should be deployed in us-west-2 region and follow strict naming conventions including account ID as a prefix. Security is paramount with focus on data encryption, access logging, and monitoring compliance.

Please provide the complete Terraform configuration with one code block per file.