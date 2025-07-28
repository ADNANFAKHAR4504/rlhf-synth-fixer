❌ What Needs Improvement:
1. Security & Compliance Gaps
RDS Credentials: MasterUsername and MasterUserPassword are set to AWS::NoValue. You should use Secrets Manager and pass the secret ARN to Lambda and RDS.
S3 CloudFront OAI: S3 bucket access via CloudFront OAI is missing.
VPC Flow Logs: Not enabled.
Security Groups: No security groups defined for RDS, Lambda, etc. Must explicitly close ports 22/3389 and restrict inbound/outbound rules.
SNS Topic: Not present.
WAF: Not present.
Route 53: No private hosted zone.
DynamoDB Multi-AZ: DynamoDB is globally available, but you should mention/enable point-in-time recovery for compliance.
EBS Encryption: No EC2/EBS resources shown.
CloudTrail S3 Bucket: CloudTrail should log to a secure S3 bucket.
2. Best Practices
Resource Tagging: Not all resources are tagged with Project and Owner.
Lambda Secrets: Lambda environment variable for secrets is set to AWS::NoValue. Should reference Secrets Manager.
IAM Least Privilege: Lambda role is very basic; consider restricting permissions further.
