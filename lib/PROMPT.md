# HIPAA-Compliant Disaster Recovery Infrastructure

You are an expert AWS Infrastructure Engineer. Create infrastructure using **CDKTF with TypeScript** for a HIPAA-compliant disaster recovery solution.

## Requirements

### Multi-Region Architecture
- Primary region: ap-southeast-1
- Secondary region: ap-southeast-2 for disaster recovery
- Automated failover between regions using Route53 health checks
- Cross-region data replication for all critical data stores

### Data Storage and Protection
- RDS PostgreSQL database with Multi-AZ deployment in primary region
- Cross-region read replica in secondary region for disaster recovery
- Automated backups with 7-day retention using AWS Backup
- S3 buckets with cross-region replication and versioning enabled
- Server-side encryption using AWS KMS with separate keys per region
- Point-in-time recovery enabled for all data stores

### High Availability
- Multi-AZ deployment for all critical components
- Application Load Balancer in each region
- Auto Scaling groups for compute resources (if needed)
- Route53 health checks monitoring primary region resources
- Automatic DNS failover to secondary region on health check failure

### Compliance and Security
- All data encrypted at rest using KMS
- All data encrypted in transit using TLS
- CloudTrail logging enabled for audit trail
- VPC Flow Logs for network monitoring
- S3 bucket policies enforcing secure access
- IAM roles following least privilege principle
- Secrets stored in AWS Secrets Manager

### Monitoring and Alarms
- CloudWatch alarms for RDS health, S3 replication, and backup completion
- CloudWatch alarms for Route53 health check failures
- SNS topic for critical alerts
- CloudWatch Logs for application and system logs with 30-day retention

### Recovery Orchestration
- Lambda function to automate failover procedures
- Lambda function to promote read replica to primary on failover
- SNS notifications for disaster recovery events
- Systems Manager Parameter Store for configuration values

### Recovery Objectives
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes
- RDS automated backups every 15 minutes using continuous backup
- S3 replication with real-time replication

## Implementation Guidelines

### Resource Naming
- ALL resource names MUST include the environmentSuffix parameter
- Use pattern: {resource-type}-${environmentSuffix}
- Example: `rds-database-${environmentSuffix}`

### RDS Configuration
- Use db.t3.small instance for cost optimization
- Enable automated backups with 7-day retention
- Set backup window to off-peak hours
- Enable deletion protection: false (for CI/CD destroyability)
- Skip final snapshot on deletion for testing environments

### S3 Configuration
- Enable versioning on all buckets
- Configure lifecycle policies for cost optimization
- Set up cross-region replication rules
- Enable server-side encryption with KMS

### Lambda Functions
- Use Node.js 18.x or Python 3.11 runtime
- Keep functions lightweight and focused
- Use environment variables for configuration
- Grant minimal IAM permissions

### Cost Optimization
- Use Aurora Serverless v2 instead of standard RDS for auto-scaling and cost efficiency
- Configure S3 Intelligent-Tiering for automatic cost optimization
- Use VPC endpoints for S3 and other services to avoid NAT Gateway costs
- Set appropriate CloudWatch log retention periods

### Deployment Considerations
- All infrastructure must be fully destroyable
- No resources with deletion protection enabled
- Use skip_final_snapshot for RDS instances
- Avoid resources that take too long to deploy (>15 minutes)

## Deliverables

Generate infrastructure code with the following files:
1. lib/tap-stack.ts - Main orchestration (do not create resources directly here)
2. lib/disaster-recovery-stack.ts - Disaster recovery infrastructure construct
3. lib/database-stack.ts - RDS and backup configuration construct
4. lib/storage-stack.ts - S3 buckets with replication construct
5. lib/monitoring-stack.ts - CloudWatch alarms and SNS topics construct
6. lib/lambda/failover-handler.ts - Lambda function for failover automation

Provide each file as a separate code block with the full file path as the header.
