# PostgreSQL to Aurora Migration with DMS - CloudFormation Template

## Original Model-Generated Infrastructure Code

This document captures the initial CloudFormation template generated for the PostgreSQL to Aurora migration task.

## Template Structure

The template creates a comprehensive DMS migration infrastructure with the following components:

### Parameters
- **VpcId**: VPC where resources will be deployed
- **PrivateSubnet1-3**: Three private subnets across availability zones
- **SourceDbHost**: Source PostgreSQL database host (on-premises)
- **SourceDbPort**: Source PostgreSQL database port (default: 5432)
- **SourceDbName**: Source PostgreSQL database name
- **TargetDbPassword**: Aurora PostgreSQL master user password
- **DBInstanceClass**: Aurora instance class (default: db.r5.xlarge)
- **EngineVersion**: PostgreSQL engine version (default: 14.6)
- **ReplicationInstanceClass**: DMS instance class (default: dms.t3.medium)
- **DmsTaskTableMappings**: DMS table mappings in JSON format
- **ReplicationLagThreshold**: Alarm threshold in seconds (default: 300)

### Resources Created

#### Security Infrastructure
1. **DMSSecurityGroup**: Security group for DMS replication instance with PostgreSQL port access
2. **AuroraDBSecurityGroup**: Security group for Aurora cluster allowing DMS access

#### Database Infrastructure
3. **DBSubnetGroup**: Subnet group for Aurora cluster across 3 AZs
4. **AuroraCluster**: Aurora PostgreSQL cluster with:
   - Customer-specified engine version
   - Storage encryption enabled
   - IAM database authentication enabled
   - CloudWatch logs export enabled
   - 35-day backup retention
   - DeletionPolicy: Snapshot
5. **AuroraInstance1**: First Aurora reader instance
6. **AuroraInstance2**: Second Aurora reader instance

#### Secrets Management
7. **SourceDbPasswordSecret**: Secrets Manager secret for source database credentials
8. **TargetDbPasswordParameter**: SSM Parameter Store for Aurora master password

#### DMS Migration Infrastructure
9. **DMSReplicationSubnetGroup**: Subnet group for DMS replication instance
10. **DMSReplicationInstance**: Multi-AZ DMS replication instance with:
    - 200GB allocated storage
    - DMS engine version 3.4.6
    - DeletionPolicy: Snapshot
11. **DMSSourceEndpoint**: Source PostgreSQL endpoint with SSL enabled
12. **DMSTargetEndpoint**: Target Aurora endpoint with SSL enabled
13. **DMSTaskSettings**: Replication task configured for CDC with:
    - Full load settings
    - Validation enabled
    - Batch apply enabled
    - Stream buffering optimizations

#### Monitoring and Alerting
14. **ReplicationLagAlarmTopic**: SNS topic for replication lag alerts
15. **ReplicationLagAlarm**: CloudWatch alarm monitoring CDCLatencySource metric
16. **CloudWatchDashboard**: Dashboard displaying DMS and Aurora metrics

#### Route 53 Traffic Shifting
17. **Route53HostedZone**: Private hosted zone for migration.local
18. **Route53WeightedRecord1**: Weighted record pointing to source (weight: 100)
19. **Route53WeightedRecord2**: Weighted record pointing to Aurora (weight: 0)

### Stack Outputs
- **DMSTaskArn**: ARN of the DMS replication task
- **AuroraClusterEndpoint**: Aurora cluster writer endpoint
- **AuroraClusterPort**: Aurora cluster port
- **Route53HostedZoneId**: Hosted zone ID for traffic shifting
- **DMSReplicationInstanceIdentifier**: DMS instance identifier
- **CloudWatchDashboardUrl**: URL to CloudWatch dashboard
- **SNSAlertTopicArn**: SNS topic ARN for alerts

All outputs include cross-stack exports for reference by other stacks.

## Template File
The template is located at: `lib/template.json` (18KB)

## Platform and Language
- Platform: CloudFormation (cfn)
- Language: JSON
- Region: us-east-1
