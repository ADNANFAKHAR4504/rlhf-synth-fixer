You're a senior Cloud Security Architect at a financial services company. I need you to create a secure, compliant AWS environment using a single CloudFormation template in YAML format. Deploy everything in us-east-1 and follow these security requirements:

Data Encryption:
- RDS: Create a KMS key for server-side encryption. The RDS instance must use this customer-managed key. Set up the KMS key policy with least privilege - only give RDS the permissions it needs.
- S3: Create two S3 buckets with AES256 server-side encryption enabled by default.

Data Integrity and Availability:
- S3 Buckets: Turn on versioning for both buckets to protect against accidental deletions.
- RDS: Set backup retention to 30 days.
- EC2: Launch an instance with automatic recovery. Set up a CloudWatch alarm that triggers recovery when status checks fail. Use the latest Amazon Linux 2023 AMI with dynamic lookup.

Access Control:
- IAM: Create a role and instance profile for the EC2 instance. The policy should only grant minimal required permissions, such as read-only access to a specific S3 bucket. Don't require CAPABILITY_NAMED_IAM for deployment.

Security:
- Security Group: Only allow inbound HTTPS traffic on port 443 from anywhere. Block everything else by default.

Monitoring:
- CloudTrail: Set up a trail to log all API calls across the account. Store the logs in one of your S3 buckets and configure the bucket policy so CloudTrail can write to it.

Template Requirements:
- Use consistent naming like 'FinancialApp-Prod-ResourceType' where FinancialApp and Prod are parameters
- Add comments explaining what each resource does
- Output the KMS key ARN, S3 bucket names, and Security Group ID

Deliver a single YAML CloudFormation template called secure-financial-services-env.yaml that passes validation and deploys without errors.