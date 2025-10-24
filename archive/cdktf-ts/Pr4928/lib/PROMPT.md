Hey, I need help building out a HIPAA-compliant disaster recovery solution for our healthcare provider's patient data processing infrastructure using CDKTF with TypeScript.

We're handling sensitive patient health information and need to ensure full HIPAA compliance with proper disaster recovery capabilities. The infrastructure needs to run in us-east-1 as the primary region with disaster recovery replication to us-west-2.

Here's what we need:

For security and compliance:
- All data must be encrypted at rest using AWS KMS with automatic key rotation enabled
- All data in transit needs TLS 1.2 or higher encryption
- Comprehensive audit logging using CloudTrail and CloudWatch Logs
- IAM roles following least privilege principles
- AWS Secrets Manager for managing database credentials and sensitive data
- VPC setup with private subnets for data processing workloads
- Security groups configured with minimal required access

For the disaster recovery setup:
- We need cross-region replication for all critical data stores
- Automated backup strategies with proper retention policies (30 days for backups, 7 years for compliance archives)
- The infrastructure should support both point-in-time recovery and automated failover
- Our target RTO is 4 hours and RPO is 1 hour for production workloads
- Use AWS Backup with Backup Audit Manager to ensure backups are working properly
- Implement AWS Elastic Disaster Recovery for automated failover capabilities

For the data processing infrastructure:
- A secure VPC with public and private subnets across multiple availability zones
- Aurora PostgreSQL database with Multi-AZ deployment and encryption
- S3 buckets for storing patient data with versioning, encryption, and cross-region replication
- Lambda functions or ECS Fargate for data processing workloads
- KMS keys for encryption with proper key policies
- CloudWatch alarms for monitoring critical metrics like backup failures and replication lag

Additional requirements:
- All resources should be tagged appropriately for compliance tracking (Environment, Compliance=HIPAA, CostCenter)
- Resource names should include the environmentSuffix pattern for uniqueness
- Set up CloudWatch Alarms for backup failures, replication delays, and database issues
- Use VPC endpoints where possible to keep traffic private and reduce costs
- Make sure all resources can be destroyed cleanly for testing purposes

Can you create the infrastructure code that sets all this up? Please make sure it follows CDKTF best practices and uses the TerraformStack base class with proper AWS provider configuration.