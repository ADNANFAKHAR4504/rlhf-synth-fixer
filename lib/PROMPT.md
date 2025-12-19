# AWS Security Configuration Infrastructure

I need to create a robust security configuration for AWS using CDK TypeScript that includes monitoring for unauthorized access and enforces multi-factor authentication across multiple regions.

## Requirements

1. **AWS Config Setup**
   - Deploy AWS Config to monitor unauthorized access attempts to Amazon S3 buckets
   - Use the s3-bucket-public-read-prohibited and s3-bucket-public-write-prohibited managed rules
   - Include configuration recorder and delivery channel
   - Set up Config service-linked role

2. **IAM MFA Enforcement**
   - Create IAM policies that enforce multi-factor authentication for resource access
   - Include FIDO2 passkey support for enhanced security
   - Implement conditional policies that deny access without MFA
   - Create user groups with MFA requirements

3. **Multi-Region Deployment**
   - Deploy the security configuration in both us-east-1 (primary) and us-west-2 (secondary) regions
   - Ensure Config rules are active in both regions
   - Cross-region replication for security logs

4. **Additional Security Features**
   - Implement S3 Block Public Access by default
   - Set up CloudTrail for API logging
   - Create security monitoring dashboards

Please provide the infrastructure code as CDK TypeScript with one code block per file. The solution should be production-ready and follow AWS security best practices. Make sure to include proper IAM roles, permissions, and error handling.