```
Deploy secure AWS infrastructure with KMS key encrypting S3 bucket and CloudWatch log group. KMS key configured with policy allowing CloudWatch Logs service to use key for log encryption and S3 service for bucket encryption. S3 bucket configured with server-side encryption using KMS key, with bucket policy rejecting unencrypted uploads. CloudWatch log group encrypted with same KMS key and retention set to 365 days for compliance.

IAM roles grant least-privilege access with EC2 role allowing instances to read from encrypted S3 bucket using KMS key for decryption, write logs to encrypted CloudWatch log group, and read parameters from Systems Manager Parameter Store. Lambda execution role configured to invoke CloudWatch Logs APIs for log publishing and access KMS key for decryption. Security group attached to EC2 instances restricts inbound traffic to specific ports and protocols.

VPC spans multiple availability zones with public and private subnets. Private subnets route outbound traffic through NAT Gateway in public subnet for internet access while blocking inbound connections. Security groups enforce network segmentation with rules allowing traffic flow between tiers.

AWS Config recorder monitors all resources for compliance with configuration rules, delivering findings to S3 bucket. Config delivery channel configured to publish snapshots and configuration history to designated S3 bucket every 24 hours. CloudTrail logs all API calls to S3 bucket with encryption enabled, creating audit trail for security analysis. All resources tagged with project and team identifiers following corp- naming convention for governance and cost allocation.
```
