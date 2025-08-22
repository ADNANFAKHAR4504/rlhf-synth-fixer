We're designing an expert-level AWS security infrastructure using CloudFormation. The organization uses S3, IAM, EC2, CloudTrail, VPC, RDS, Lambda, DynamoDB, ALB, and GuardDuty, and needs a template that is secure, scalable, and resilient.

Here’s what you must deliver:
- All S3 buckets must have server-side encryption enabled with AES-256.
- IAM policies must follow least privilege—users and services only get access to what they need.
- EC2 instances must use IAM roles and SSH access should be restricted (ideally disabled).
- CloudTrail logging must be enabled and logs encrypted with KMS.
- VPCs should have public and private subnets in different AZs for high availability.
- RDS must have automated backups with at least 7 days retention.
- Lambda environment variables must be encrypted at rest using KMS.
- DynamoDB tables must have point-in-time recovery and continuous backups.
- ALBs must have access logs enabled and stored in a dedicated, restricted S3 bucket.
- Security groups should only allow necessary ports and protocols.
- All resources must be tagged for owner and environment.
- GuardDuty must be enabled and findings aggregated across all accounts in a central security account.

Use the `<Service>-<Team>-<Name>` naming convention. The template should work in `us-west-2` and pass compliance checks with zero errors. Export all important resource IDs for integration.

Your output should be a single, production-ready CloudFormation YAML template that strictly follows