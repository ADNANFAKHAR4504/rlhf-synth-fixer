# Deploy Highly Available Aurora Global Database

Hey team,

We need to build a mission-critical database infrastructure for a financial services company handling transaction processing across multiple regions. They need absolute confidence that even if an entire AWS region goes down, their database stays up with minimal data loss. Downtime costs millions of dollars per minute, so we need to get it right.

The business wants a solution that spans us-east-1 as the primary region with us-west-2 for disaster recovery. They need automated failover capabilities, point-in-time recovery, and the ability to backtrack if something goes wrong. Strict RPO/RTO requirements here, so every detail matters.

I need to create this infrastructure using CloudFormation with YAML. The architecture should demonstrate AWS best practices for high availability and disaster recovery.

## What we need to build

Deploy an Aurora Global Database cluster in us-east-1 that replicates data to a secondary cluster in us-west-2. The primary cluster writes transactions to Aurora storage, which then streams changes to the secondary region through Aurora cross-region replication. CloudWatch monitors replication lag and triggers SNS alerts when thresholds are exceeded.

The primary Aurora cluster connects to KMS in us-east-1 for data encryption at rest. The secondary cluster connects to a separate KMS key in us-west-2. Both clusters reside in private VPC subnets with security groups restricting access to application tier only.

Enhanced monitoring data flows from Aurora instances to CloudWatch metrics every 10 seconds. CloudWatch alarms watch replication lag and trigger SNS notifications when lag exceeds acceptable thresholds.

## Core Requirements

Aurora Global Database Architecture:
- Primary Aurora cluster in us-east-1 connects to writer and reader endpoints
- Secondary Aurora cluster in us-west-2 receives replicated data from primary
- Aurora MySQL 5.7 compatible engine with db.r5.large instance class
- Cross-region replication streams data continuously to secondary region

Data Protection and Recovery:
- Automated backups stored in S3 with 35-day retention period
- Backtrack window of 24 hours allows quick recovery from errors
- Point-in-time recovery enables restoration to any point within retention window
- Deletion protection prevents accidental database deletion

Security and Encryption:
- Primary cluster connects to KMS key in us-east-1 for encryption
- Secondary cluster connects to separate KMS key in us-west-2
- VPC security groups restrict database access to specific CIDR ranges
- Private subnets isolate database from public internet access
- Deploy across 3 Availability Zones in each region

High Availability Configuration:
- Automatic failover promotes secondary instances based on promotion tier
- Multi-AZ deployment distributes instances across availability zones
- Enhanced monitoring sends metrics to CloudWatch every 10 seconds
- CloudWatch alarms monitor replication lag and notify via SNS

## Technical Requirements

- CloudFormation YAML template defines all infrastructure
- Aurora MySQL powers the global database cluster
- RDS service manages cluster and instance lifecycle
- KMS keys encrypt data in both us-east-1 and us-west-2
- CloudWatch collects monitoring data and triggers alerts
- SNS delivers notifications when alarms fire
- All resource names include EnvironmentSuffix parameter for uniqueness
- Naming convention uses resource-type-EnvironmentSuffix format
- All resources support clean teardown for testing

## Success Criteria

- Aurora Global Database deployed with active replication between regions
- Replication lag stays under 1 second during normal operations
- Automatic failover promotes secondary when primary becomes unavailable
- KMS encryption protects data at rest in both regions
- Enhanced monitoring reports metrics every 10 seconds
- All resources include EnvironmentSuffix in names
- 35-day backup retention with 24-hour backtrack window
- Clear connection strings and failover instructions in outputs

## What to deliver

- Complete CloudFormation YAML template
- Primary Aurora cluster in us-east-1 with writer and reader instances
- Secondary Aurora cluster in us-west-2 receiving replicated data
- KMS keys configured in both regions
- CloudWatch alarms connected to SNS for alerting
- Comprehensive outputs with connection strings and failover instructions
