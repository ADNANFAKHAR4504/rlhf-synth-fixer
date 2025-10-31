Hey team,

We need to build an automated backup verification and recovery system for our RDS PostgreSQL databases. A financial services company is asking for this because they need to meet compliance requirements for their critical database infrastructure. They want to make sure their backups actually work and can be restored when needed, plus they need to maintain proper recovery points across multiple regions for disaster recovery scenarios.

The business is concerned about backup integrity and wants automated testing that validates backups are recoverable without manual intervention. They've had situations in the past where backups were technically successful but restoration failed, so they want weekly automated recovery drills. The compliance team also requires 7-day point-in-time recovery and 30-day snapshot retention for audit purposes.

This needs to be implemented using **Pulumi with TypeScript** to manage all the infrastructure as code. The primary deployment region is ap-southeast-1, with disaster recovery replication to ap-northeast-1.

## What we need to build

Create a backup verification and recovery testing system using **Pulumi with TypeScript** for RDS PostgreSQL instances that automatically validates backup integrity and maintains compliance-ready recovery points.

### Core Requirements

1. **Primary RDS PostgreSQL Database**
   - Deploy RDS PostgreSQL 15.x instance with automated backups
   - Configure automated backups to run every 6 hours
   - Enable point-in-time recovery with 7-day retention window
   - Use db.t3.medium or smaller for cost efficiency
   - Deploy in private subnets within VPC

2. **Backup Storage and Lifecycle Management**
   - Create S3 bucket for storing manual snapshots
   - Implement lifecycle policies to retain snapshots for 30 days
   - Enable versioning and encryption at rest for backup data
   - Tag all backup resources appropriately

3. **Automated Backup Testing**
   - Implement Lambda function that performs weekly backup integrity tests
   - Lambda should create temporary restored instances from recent backups
   - Verify restored instance is accessible and data is intact
   - Clean up temporary instances after validation
   - Must complete within 15-minute Lambda timeout

4. **Cross-Region Disaster Recovery**
   - Configure automatic snapshot copying from ap-southeast-1 to ap-northeast-1
   - Maintain disaster recovery copies of all critical backups
   - Ensure DR snapshots are encrypted in destination region

5. **Monitoring and Alerting**
   - Set up CloudWatch alarms for backup failures
   - Create alerts for recovery time violations exceeding 4 hours RTO
   - Implement SNS topic for backup event notifications
   - Send recovery test results to operations team
   - Alert within 15 minutes of any backup or recovery issues

6. **Dashboard and Visibility**
   - Create CloudWatch dashboard showing backup status
   - Display recovery test results and success rates
   - Include storage costs and capacity metrics
   - Show cross-region replication status

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use RDS for PostgreSQL 15.x database instances
- Use S3 for manual snapshot storage with lifecycle policies
- Use Lambda for automated backup testing logic
- Use CloudWatch for monitoring and dashboards
- Use SNS for notifications and alerting
- Use IAM for security roles and policies
- Use KMS for customer-managed encryption keys
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix format
- Deploy primary resources to ap-southeast-1 region
- Configure DR replication to ap-northeast-1 region

### Constraints

- RDS instances must be db.t3.medium or smaller to control costs
- Lambda functions must complete backup tests within 15-minute timeout
- All data must be encrypted at rest using AWS KMS customer-managed keys
- All data must be encrypted in transit using TLS
- Network traffic between Lambda and RDS must stay within VPC
- Use VPC endpoints for AWS service communication to avoid NAT costs
- Backup retention must comply with 7-day PITR and 30-day snapshot requirements
- Recovery tests must not impact production database performance
- Use separate security groups for Lambda and RDS with minimal permissions
- All resources must be fully destroyable for CI/CD workflows
- No Retain deletion policies allowed
- No deletion protection flags enabled

### Security Requirements

- Implement IAM roles with least privilege principle
- Lambda execution role should only access required AWS services
- RDS should only be accessible from Lambda security group
- Use KMS customer-managed keys for all encryption
- Rotate encryption keys according to security policy
- Enable CloudWatch Logs encryption for Lambda logs
- Store sensitive configuration in AWS Secrets Manager
- Fetch existing secrets, do not create new ones in stack
- Tag all resources with Environment, Owner, and CostCenter tags

## Success Criteria

- Functionality: Weekly automated recovery drills that validate backup integrity
- Performance: Lambda completes backup tests within 15-minute timeout
- Reliability: Automated backups run every 6 hours without failures
- Security: All data encrypted at rest and in transit with customer-managed keys
- Compliance: 7-day point-in-time recovery and 30-day snapshot retention maintained
- Disaster Recovery: Cross-region snapshot copying to ap-northeast-1 operational
- Monitoring: Alerts fire within 15 minutes of backup or recovery issues
- Resource Naming: All resources include environmentSuffix for multi-PR support
- Code Quality: TypeScript code with proper types, well-tested, documented
- Destroyability: All resources can be destroyed completely for CI/CD

## What to deliver

- Complete Pulumi TypeScript implementation with proper stack structure
- RDS PostgreSQL instance with automated backup configuration
- S3 bucket with lifecycle policies for snapshot management
- Lambda function code for automated backup testing
- IAM roles and policies following least privilege
- KMS customer-managed keys for encryption
- CloudWatch alarms for backup and recovery monitoring
- SNS topic and subscriptions for notifications
- CloudWatch dashboard for visibility
- Cross-region snapshot replication configuration
- VPC configuration with private subnets and endpoints
- Security groups with minimal required access
- Unit tests for all components
- Integration tests that validate backup and recovery workflows
- Documentation covering deployment and operational procedures
