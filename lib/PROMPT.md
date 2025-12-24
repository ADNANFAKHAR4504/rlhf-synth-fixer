I need to create a comprehensive security-focused CloudFormation template in YAML format for AWS us-west-2 region. The infrastructure should show how security services connect and integrate:

1. IAM roles configured with assume role policies that grant specific Lambda functions and EC2 instances permission to access other AWS services. These roles connect to KMS keys for encryption operations and S3 buckets for secure data access.

2. Customer-managed KMS keys that encrypt CloudTrail logs written to S3, encrypt VPC Flow Logs sent to CloudWatch Logs, and protect data stored in S3 buckets. IAM policies attached to these keys control which services and roles can use them for encryption and decryption.

3. VPC with public and private subnets where VPC Flow Logs capture network traffic and send logs to CloudWatch Logs for analysis. The Flow Logs connect through IAM roles that have permission to write to CloudWatch.

4. Security Groups that protect EC2 instances by restricting inbound SSH access to port 22 from specific IP ranges and permitting HTTP/HTTPS on ports 80/443. These security groups reference each other to enable communication between application tiers.

5. AWS Config rules that monitor resource compliance and send configuration snapshots to an S3 bucket. Config connects to SNS topics to notify when resources drift from compliance standards.

6. CloudTrail capturing all API calls across the account and delivering encrypted logs to an S3 bucket. CloudTrail uses the KMS key for encryption and triggers EventBridge rules when security-sensitive actions occur.

7. S3 buckets protected with KMS encryption where CloudTrail writes audit logs and Config stores compliance snapshots. Bucket policies enforce encryption-in-transit and deny unencrypted uploads.

8. GuardDuty enabled with Malware Protection for S3 that monitors CloudTrail events and VPC Flow Logs to detect threats. GuardDuty findings publish to Security Hub for centralized security monitoring.

9. Security Hub aggregating findings from GuardDuty, Config, and IAM Access Analyzer to provide a unified security dashboard. Security Hub connects to SNS to alert on critical findings.

Generate the complete infrastructure code showing these service integrations. The main template should be comprehensive and production-ready with proper naming conventions and tags.