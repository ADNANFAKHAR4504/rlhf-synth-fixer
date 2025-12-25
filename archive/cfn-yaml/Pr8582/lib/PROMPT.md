## Secure AWS Infrastructure Setup

Okay, we need to make a CloudFormation YAML template for a secure and scalable AWS infrastructure. It's for an environment that spans different AWS regions and has separate accounts for development, staging, and production. Resource names should follow the pattern `<environment>-<service>-<function>`, and everything needs to be tagged with 'Environment', 'Owner', and 'Project' for tracking costs and managing things.

Here's what the template needs to do:

- **S3 Encryption**: All S3 buckets need to have server-side encryption turned on, using AES-256.
- **EC2 Access**: Set up security groups so only authorized people or services can get to our EC2 instances.
- **S3 Logging**: Enable logging for all S3 bucket activities. This helps us monitor and audit who's accessing data.
- **IAM Permissions**: Implement IAM roles and policies that follow the "least privilege" rule. That means giving out only the minimum permissions needed.
- **MFA for Users**: Multi-factor authentication (MFA) must be enabled for all IAM users for better security.
- **RDS Access**: Make sure RDS databases are not accessible from the public internet.
- **Network Setup**: Use VPCs to separate resources based on what they do and their security needs.
- **Web Traffic Rules**: Configure security group ingress rules to only allow web traffic on port 443 (HTTPS), and only from a specific IP range.
- **Global Auditing**: CloudTrail needs to be set up to record all AWS API calls across all regions.
- **Encryption Key Management**: Use AWS KMS to manage the encryption keys for any data that's sitting still.

We need a CloudFormation YAML template that meets all these security requirements. We'll verify it with automated checks, like AWS Config rules and AWS Trusted Advisor reports.
