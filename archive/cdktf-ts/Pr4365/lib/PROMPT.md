# Healthcare Disaster Recovery Infrastructure

I need to build a disaster recovery infrastructure for a healthcare application that needs to be HIPAA compliant. The solution should handle both planned and unplanned outages with minimal data loss and downtime.

## What I'm Looking For

### Regional Setup
I want the primary infrastructure in **eu-west-2** (London) with a disaster recovery site in **eu-west-1** (Ireland). If the London region goes down or has issues, the system should be able to failover to Ireland relatively quickly.

### Database Requirements
For the database, I'm thinking Aurora PostgreSQL with Serverless v2 for cost efficiency. I need:
- Multi-AZ deployment in the primary region for high availability
- A separate cluster in the DR region that can be promoted if needed
- Automated backups that run hourly so we don't lose more than 15 minutes of data
- Everything encrypted at rest with KMS keys
- 7-day backup retention using AWS Backup service

The database should be in private subnets with proper security groups that only allow PostgreSQL traffic from within the VPC.

### Storage Needs
I need S3 buckets for storing healthcare data files. These should:
- Have versioning enabled so we can recover from accidental deletions
- Replicate to the DR region automatically (targeting 15-minute replication time)
- Use KMS encryption with separate keys in each region
- Have lifecycle policies to move older data to Intelligent-Tiering after 30 days
- Clean up old versions after 90 days to control costs

### Monitoring and Alerts
Set up CloudWatch alarms for:
- Database CPU utilization (alert if over 80%)
- Database connection count (alert if too high)
- Replication lag between regions

I want all alerts going to an SNS topic that can notify the ops team. Also need CloudWatch Logs with 30-day retention for troubleshooting.

For compliance, enable CloudTrail with multi-region support so we have a complete audit trail of all API calls.

### Disaster Recovery Automation
Create a Lambda function that can orchestrate failover procedures. It should:
- Be triggered by CloudWatch alarms when there's a problem
- Have permissions to describe and modify RDS clusters
- Publish notifications to SNS when failover events happen
- Have access to SSM Parameter Store for configuration

Also set up Route53 health checks that monitor the replication lag alarm to detect when things aren't healthy.

### Security and Compliance
This is for healthcare data, so security is critical:
- All data encrypted at rest using AWS KMS with automatic key rotation
- All data encrypted in transit (TLS)
- Secrets stored in AWS Secrets Manager, not hardcoded
- IAM roles with least privilege - only grant what's needed
- VPC with proper subnet isolation
- Security groups that restrict access appropriately

### Recovery Objectives
We need to meet these targets:
- **RTO (Recovery Time Objective):** Less than 1 hour from incident to restored service
- **RPO (Recovery Point Objective):** Less than 15 minutes of data loss

To achieve this:
- Hourly automated backups with point-in-time recovery
- Real-time replication for S3 data
- Monitoring that detects issues quickly

### Implementation Details

**Tech Stack:** Use CDKTF with TypeScript for infrastructure as code.

**Resource Naming:** Every resource should include an environment suffix (like 'dev', 'prod', 'pr4365') so we can deploy multiple environments without conflicts. Use patterns like `healthcare-db-${environmentSuffix}`.

**Cost Optimization:**
- Aurora Serverless v2 scales down when not in use
- S3 Intelligent-Tiering moves data to cheaper storage automatically
- Set appropriate log retention periods (30 days is fine)
- Use multi-AZ only where necessary for availability

**Deployment Considerations:**
Since this might be used in CI/CD pipelines, make sure:
- Resources can be fully destroyed (no deletion protection)
- RDS clusters skip final snapshot on deletion in non-prod environments
- Nothing takes longer than 15 minutes to deploy
- State stored in S3 with encryption enabled

**VPC and Networking:**
- Primary VPC with CIDR 10.0.0.0/16
- Secondary VPC with CIDR 10.1.0.0/16
- Subnets in multiple availability zones (10.0.1.0/24, 10.0.2.0/24, etc.)
- Security groups for database access
- DB subnet groups for RDS placement

**Database Configuration Specifics:**
- Aurora PostgreSQL 15.3
- Serverless v2 with 0.5-2 ACU capacity range
- Enable CloudWatch logs export for PostgreSQL
- Backup window during off-peak hours
- Store master credentials in Secrets Manager

**Backup Strategy:**
- AWS Backup with continuous backup enabled
- Schedule: `cron(0 */1 * * ? *)` (every hour)
- Lifecycle: Delete after 7 days
- Backup vault with KMS encryption

**S3 Replication Configuration:**
- Enable delete marker replication
- Include source selection criteria for KMS encrypted objects
- Set replication time to 15 minutes
- Enable replication metrics

That should give a robust, HIPAA-compliant disaster recovery solution that can handle regional failures while keeping data loss and downtime to a minimum.
