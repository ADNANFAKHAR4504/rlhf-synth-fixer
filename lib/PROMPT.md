Create infrastructure code for a backup management system that handles 14,600 daily client backups.

Requirements:
- Deploy to AWS region us-east-2 (AWS resources) with S3 state bucket in us-east-1
- Use S3 bucket with Object Lock enabled for 7-year retention
- Configure AWS Backup service with daily backup schedules
- Create AWS Backup Vault with KMS encryption
- Setup DynamoDB table to catalog backup metadata
- Configure SNS topic for backup job notifications
- Create CloudWatch dashboard to monitor backup jobs
- Implement IAM roles and policies for client isolation
- Enable S3 Inventory reports for compliance auditing

Technical specifications:
- S3 bucket must have Object Lock in COMPLIANCE mode with 7-year retention
- AWS Backup vault should use customer managed KMS key
- DynamoDB table should track: backup ID, client ID, timestamp, status, size, checksum
- SNS notifications for: backup success, backup failure, verification complete
- CloudWatch metrics for: daily backup count, success rate, average backup size
- Each client should have isolated IAM role with access only to their backup prefixes
- S3 Inventory should generate daily CSV reports to a separate bucket
- Include AWS Backup logically air-gapped vault for critical backups with 30-day retention
- Implement backup lifecycle policies with transition to Glacier after 90 days

Additional requirements using recent AWS features:
- Configure AWS Backup Audit Manager with compliance framework for backup audits
- Create backup audit reports configuration to track compliance with backup policies
- Set up automated audit control findings for backup governance
- Enable cross-region backup copies to us-east-1 for disaster recovery
- Configure backup copy rules with independent retention periods for copied backups
- Implement cross-region restore testing capability with automated validation

Region Configuration:
- AWS Provider region: us-east-2 (where AWS resources are created)
- S3 Backend region: us-east-1 (where Terraform state bucket exists)
- Cross-region backup target: us-east-1

Generate the complete infrastructure code using CDKTF with TypeScript. Provide one code block per file.
