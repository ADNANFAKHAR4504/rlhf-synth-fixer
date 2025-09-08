Write an AWS CloudFormation template in YAML format to provision a secure infrastructure environment. The template must strictly follow these security and compliance requirements:

1. S3 Buckets – All S3 buckets must use AES-256 server-side encryption.

2. EC2 Instances – EC2 instances must not have public IP addresses, and inbound access must be restricted only to designated IP ranges.

3. IAM Policies – Limit IAM user management capabilities strictly to the Admin group.

4. CloudTrail – Enable CloudTrail logging across all AWS regions for auditing. Logs should be stored securely.

5. MFA – Apply Multi-Factor Authentication (MFA) enforcement for all IAM users.

6. RDS – All RDS instances must run inside a VPC, with encryption enabled, and not be publicly accessible.

7. EBS Volumes – All EBS volumes must be encrypted for data-at-rest protection.

8. CloudWatch Monitoring – Set up CloudWatch alarms to monitor any security group modifications.

9. EC2 IAM Roles – Use IAM roles for EC2 instances instead of IAM users, following AWS best practices.

10. Tagging – Ensure consistent tagging with "Environment": "Production" for all resources.

The output must be a complete, valid YAML CloudFormation template that can be deployed without errors and meets all of these requirements.
