> Need a secure AWS infrastructure setup using CDK Python. Building a test automation platform that needs to be locked down tight.
>
> **What we need:**
>
> 1. **VPC with security** - Set up a VPC with 2 public and 2 private subnets across 2 AZs. The private subnets will host RDS instances, and the public ones are for any web-facing resources.
>
> 2. **S3 buckets connected to EC2** - Create 3 S3 buckets for app data, backups, and CloudTrail logs that EC2 instances in the VPC can access. All buckets need KMS encryption and must have "secure-data" in the name. Block all public access.
>
> 3. **RDS database in private subnet** - Postgres database that's only accessible from specific security groups like the web tier SG. Has to be encrypted with KMS and not publicly accessible.
>
> 4. **Security groups with tight rules** - Web tier SG that only allows HTTPS/HTTP from specific IP ranges 203.0.113.0/24 and 198.51.100.0/24. Database SG that only accepts connections from the web tier SG on port 5432.
>
> 5. **IAM roles with least privilege** - EC2 instances need a role that can read/write to the app and backup S3 buckets. No wildcards - specific bucket ARNs only. Also needs SSM access for session management.
>
> 6. **CloudTrail logs everything** - CloudTrail that captures all management events and sends them to the CloudTrail S3 bucket. Also send logs to CloudWatch Logs for monitoring.
>
> 7. **KMS key for encryption** - Single KMS key that encrypts S3 buckets, RDS storage, and CloudWatch logs. CloudTrail service needs permission to use this key.
>
> 8. **Resource tagging** - Tag everything with Environment, Project, Owner, and CostCenter for tracking.
>
> **Stack should be:**
> * Python CDK project with proper structure
> * Comments explaining security decisions
> * Deployable to us-west-2
> * Includes cdk.json, requirements.txt, and stack files