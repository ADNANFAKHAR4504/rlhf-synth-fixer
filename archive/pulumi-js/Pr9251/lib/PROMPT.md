Create a secure multi-tier AWS infrastructure where a VPC spans multiple availability zones with public subnets connected to an Internet Gateway for external access and private subnets connected through NAT Gateways for outbound traffic. Security groups attached to resources restrict inbound traffic to HTTP port 80 and HTTPS port 443 from specific IP ranges.

Deploy S3 buckets encrypted with KMS customer-managed keys where public access is blocked via bucket policies. VPC Flow Logs stream network traffic data to these S3 buckets for security analysis. CloudTrail captures all API calls and stores audit logs in a separate S3 bucket also encrypted with KMS.

RDS MySQL database runs in private subnets with encryption at rest using KMS keys. Security groups attached to RDS permit connections only from application resources within specific security groups. IAM roles grant EC2 instances access to S3 buckets and RDS databases following least privilege, where EC2 assumes roles to retrieve credentials from Secrets Manager.

GuardDuty detector monitors the account for threats with S3 protection enabled to scan S3 buckets for malware. Findings from GuardDuty trigger SNS notifications. AWS Config recorder tracks configuration changes for VPC, S3, RDS, and IAM resources with rules validating S3 encryption, RDS encryption, and security group compliance. Config delivers configuration snapshots and change notifications to an S3 bucket.

KMS keys protect data at rest for S3, RDS, and EBS volumes with key policies restricting usage to specific IAM roles. CloudWatch alarms monitor KMS key usage and trigger alerts for suspicious activity.
