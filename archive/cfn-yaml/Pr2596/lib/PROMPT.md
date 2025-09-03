Features Implemented
1. Data Encryption at Rest

Creates a KMS key with key rotation enabled.

Encrypts:

S3 buckets

ALB access logs

Secrets in Secrets Manager

2. IAM Role Configuration

All IAM roles use managed policies.

No inline policies are defined.

Roles created for:

Lambda execution

AWS Config

3. Elastic Load Balancer (ALB)

Deploys an internal Application Load Balancer (ALB).

Enables access logging to an encrypted S3 bucket.

4. CloudWatch Alarms

Sets up a CloudWatch alarm to monitor EC2 CPU utilization.

Alarm threshold is configurable.

5. VPC Setup

Creates a VPC with:

2 private subnets across different Availability Zones

Designed to support private Lambda functions and internal resources.

6. AWS Config

Enables AWS Config to track configuration changes. This can be ignored as sheild is already enabled on the account level. Not testing needed for the same
.
Configuration snapshots stored in encrypted S3.

7. S3 Versioning

S3 buckets for logs and secrets have versioning enabled to prevent data loss.

8. AWS Shield

AWS Shield Advanced protection enabled for the ALB. This can be ignored as sheild is already enabled on the account level.  This can be ignored as sheild is already enabled on the account level. Not testing needed for the same

9. Lambda in Private VPC

Deploys a Lambda function in private subnets to restrict internet access.

Uses appropriate VPC security configuration.

10. AWS WAF on API Gateway

Creates an API Gateway endpoint.

WAF Web ACL protects the API from common web exploits.

Uses AWS-managed rule groups.

11. Secrets Manager

Stores secrets securely in AWS Secrets Manager.