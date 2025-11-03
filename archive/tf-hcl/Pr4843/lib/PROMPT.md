Write only the complete Terraform code (no explanations, no comments, no summaries) to deploy the following setup in AWS us-east-1:

- Create a VPC (10.35.0.0/16) with no internet gateway and only private subnets across 3 AZs.
- Add VPC endpoints for all required AWS services with private DNS enabled.
- Use AWS Network Firewall for traffic inspection and data exfiltration prevention.
- Launch EC2 instances on dedicated hosts with encrypted EBS volumes using CloudHSM via KMS.
- Access EC2 only via Systems Manager Session Manager (no SSH).
- Configure FSx for Lustre for shared storage.
- Create Aurora PostgreSQL with TDE enabled and CloudHSM integration.
- Use S3 buckets with SSE-C encryption.
- Enable VPC Flow Logs to S3 (encrypted).
- Enable GuardDuty with custom threat lists.
- Enable Security Hub with custom standards.
- Configure AWS Config Rules for compliance monitoring.
- Enable CloudTrail with log file validation.
- Use CloudWatch Logs with KMS encryption.
- Enable Macie for data classification.
- Add Lambda for automated security response.
- Set up SNS topics for security alerts.
- Configure IAM with MFA and IP allowlists.
- Use Secrets Manager with automatic rotation.
- Enable KMS key rotation every 30 days.
- Ensure all logs are immutable and fully auditable.

Output only valid Terraform HCL code, structured for production (main.tf, variables.tf, and modules if needed), with all configurations included. Do not include any explanations or text outside the code.
