# AWS Security Infrastructure Requirements

I need help creating a comprehensive security infrastructure for a new AWS application deployment. The security configuration must follow these requirements:

1. All IAM roles should have proper trust policies defining allowed principals
2. Encrypt EBS volumes and RDS instances using AWS KMS keys
3. S3 buckets need policies that prevent public PUT operations
4. IAM users require MFA enablement with 90-day access key rotation
5. Use AWS WAF to protect Load Balancers from web attacks like SQL injection and XSS
6. EC2 instances should use instance profiles with read-only S3 permissions
7. CloudTrail logs must be encrypted and stored in secure S3 buckets
8. SNS topics should only accept messages from authorized AWS services
9. Security groups must restrict inbound connections, allowing SSH only from specific IP ranges
10. Enable GuardDuty across all regions for continuous monitoring

The infrastructure should use the new AWS Security Hub for centralized security management and include AWS Shield Advanced for enhanced DDoS protection. Please provide the complete infrastructure code with proper resource naming using 'prod-' and 'dev-' prefixes for different environments.

Target region: us-east-1