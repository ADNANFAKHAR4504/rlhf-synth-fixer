# Aurora Global Database for Cross-Region Disaster Recovery

## Background
A financial services company requires a disaster recovery solution for their critical trading database to meet regulatory requirements for 99.99% uptime. The primary region handles real-time transactions while the secondary region must be ready for immediate failover with minimal data loss.

## Task
Create a CloudFormation template to deploy an Aurora Global Database for cross-region disaster recovery.

MANDATORY REQUIREMENTS (Must complete):
1. Create Aurora Global Database cluster with MySQL 8.0 compatibility (CORE: RDS Aurora)
2. Deploy primary cluster in us-east-1 with one writer and one reader instance
3. Deploy secondary cluster in eu-west-1 configured as read replica region
4. Configure Route 53 health checks and failover routing between regions (CORE: Route 53)
5. Enable encryption at rest using AWS KMS in both regions
6. Set up CloudWatch alarms for replication lag monitoring in secondary region
7. Configure automated backups with 7-day retention in both clusters
8. Implement proper IAM roles for Aurora to access KMS keys

OPTIONAL ENHANCEMENTS (If time permits):
 Add Lambda function for automated failover orchestration (OPTIONAL: Lambda) - enables automated DR testing
 Configure EventBridge rules for database event notifications (OPTIONAL: EventBridge) - improves incident response
 Set up AWS Backup for additional cross-region backup copies (OPTIONAL: AWS Backup) - adds extra data protection layer

Expected output: A CloudFormation JSON template that creates a fully functional Aurora Global Database with automated failover capabilities, monitoring, and encryption across two regions.

## Platform and Language Requirements
**MANDATORY**: Use **CloudFormation with JSON** syntax.

## Requirements

### Aurora Global Database Configuration
1. Create Aurora Global Database cluster spanning two regions (us-east-1 primary, eu-west-1 secondary)
2. Configure primary Aurora cluster with Multi-AZ deployment for high availability
3. Set up secondary Aurora cluster for automatic failover
4. Enable automated backups with 7-day retention period
5. Implement encryption at rest using AWS KMS

### Networking
1. Create VPC with public and private subnets in each region
2. Configure DB subnet groups across multiple availability zones
3. Set up security groups restricting database access to application tier only
4. Establish VPC peering connection between primary and secondary regions

### Monitoring and Alerting
1. Configure CloudWatch alarms for database CPU, memory, and connection metrics
2. Set up SNS topic for critical database alerts
3. Enable Enhanced Monitoring with 1-minute granularity
4. Create CloudWatch dashboard for database health metrics

### Disaster Recovery
1. Configure automatic failover with RTO < 5 minutes
2. Set up Route 53 health checks for database endpoint monitoring
3. Implement failover routing policy for DNS-based failover
4. Test and document failover procedures

## Environment
Multi-region AWS environment with primary operations in us-east-1 and disaster recovery in eu-west-1. Infrastructure uses CloudFormation JSON templates. The solution must support real-time transaction processing with minimal latency and meet 99.99% uptime SLA.

## Important Notes
- All resource names MUST include environmentSuffix parameter: `!Sub 'resource-name-${EnvironmentSuffix}'`
- Use only services available in both us-east-1 and eu-west-1
- No GuardDuty detector creation (account-level resource)
- Set skip_final_snapshot or DeletionPolicy: Delete for destroyability
- Aurora Global Database requires primary cluster to be fully available before secondary attachment
