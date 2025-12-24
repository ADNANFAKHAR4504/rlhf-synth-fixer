Functional scope

Generate a single CloudFormation template named TapStack.yml that creates all infrastructure from scratch for a production-grade Aurora MySQL 8.0 deployment in us-east-1. The design must span three Availability Zones and place the database in private subnets.

Every logical name, resource name, identifier, and export name must include -${EnvironmentSuffix} to avoid collisions.

The template must be pure YAML with no JSON, no YAML anchors or aliases, and must use standard CloudFormation intrinsics like !Ref, !Sub, and !GetAtt.

Include complete sections for Parameters, Conditions, Metadata, Resources, and Outputs. Use Mappings only when truly needed.

Connection-focused summary

Create a VPC with three private subnets and a DB subnet group. Place an Aurora MySQL cluster into that subnet group and attach a DB security group that only allows inbound MySQL traffic from the application tier security group.

Enable Enhanced Monitoring so RDS publishes monitoring metrics to CloudWatch using an IAM role created in the template.

Enable read replica autoscaling using Application Auto Scaling so the cluster can increase or decrease reader count based on reader CPU utilization.

Create CloudWatch alarms for replica lag and writer CPU and send alarm notifications to an SNS topic. If an email is provided, subscribe it to the topic.

If Database Activity Streams is enabled, use a dedicated CMK for Activity Streams and enable the feature on the cluster using a custom resource. The Activity Stream produces events to a Kinesis stream.

Core services

- Amazon VPC with private subnets
- Amazon Aurora MySQL
- AWS IAM roles for monitoring and optional custom resources
- Amazon CloudWatch for metrics and alarms
- Application Auto Scaling for read replica scaling
- Amazon SNS for alarm notifications
- AWS Secrets Manager for the database master password
- Optional Database Activity Streams with KMS encryption and Kinesis destination

Mandatory requirements

1. Aurora HA topology
Create an Aurora MySQL 8.0 cluster with one writer and two reader instances. Place instances across three Availability Zones in us-east-1.

2. Automatic failover and promotion priorities
Set PromotionTier so the writer is 0 and the readers use increasing values for deterministic failover.

3. Read replica autoscaling
Configure Application Auto Scaling for rds:cluster:ReadReplicaCount. Use a target tracking policy on RDSReaderAverageCPUUtilization with a target value of 70. Set MinCapacity to 2 and MaxCapacity to 5. Ensure the scaling target references the DB cluster and not a DB instance.

4. Backtrack
Enable a backtrack window of 72 hours on the DB cluster.

5. Enhanced Monitoring
Enable enhanced monitoring at a 10 second interval. Create the correct IAM role for monitoring.rds.amazonaws.com and attach the AWS managed policy for Enhanced Monitoring.

6. Database Activity Streams
Provide a switch to enable or disable Activity Streams. When enabled, create a dedicated KMS CMK and alias for Activity Streams and use it to enable Activity Streams on the cluster. Use Mode set to sync, async, or auto. Auto should try sync first and fall back to async when sync is not supported. This is enabled through a custom resource Lambda because CloudFormation does not provide a direct property for starting Activity Streams on the cluster.

7. CloudWatch alarms and notifications
Create two alarms and connect them to an SNS topic.
- Replica lag alarm using AuroraReplicaLagMaximum with a threshold of 1 second and a reasonable evaluation window.
- Writer CPU alarm using CPUUtilization with a threshold of 80 percent.
If an email address is provided, create an SNS email subscription.

Optional enhancement
Implement exactly one of these options.

Option A
Automated backups with 35 day retention, a preferred backup window of 03:00-04:00 UTC, and Performance Insights enabled with 7 day retention.

Option B
SNS notifications with an email subscription that receives alarm and failover notifications.

Context and constraints

- Use private subnets only for the database and create a DB subnet group from those subnets.
- Restrict database ingress to the application tier only. The DB security group must allow port 3306 inbound only from the application tier security group.
- Avoid 0.0.0.0/0 for inbound rules.
- Prepare for future cross-region replication by enabling binary logging using a cluster parameter group. Set binlog_format to ROW and attach the parameter group to the cluster.
- Use deterministic instance placement and promotion tiers to support high availability and predictable failover behavior.

Security considerations

- Store the master password in Secrets Manager and inject it into the DB cluster using a dynamic reference. Do not pass the password as a plain parameter value.
- Use least-privilege IAM policies. The monitoring role should only allow the Enhanced Monitoring service role permissions. The Activity Streams custom resource role should only allow the required RDS, KMS, and CloudWatch Logs actions.
- Use encryption at rest for Aurora storage. If a customer KMS key is provided, use it. Otherwise use the AWS managed key.

Template authoring rules

- All resource names must include -${EnvironmentSuffix}.
- EnvironmentSuffix must be validated with AllowedPattern ^[a-z0-9-]{3,20}$ and a clear ConstraintDescription.
- Keep ordering correct. Create networking and security groups before DB subnet and parameter groups, then create the cluster, then instances, then autoscaling and alarms.
- Use DeletionPolicy and UpdateReplacePolicy of Snapshot for stateful DB resources.
- Avoid circular dependencies and keep the template valid for cfn-lint.

Inputs to include

- EnvironmentSuffix
- VPC and subnet configuration must be created in the template. Do not ask for VpcId or SubnetIds as inputs.
- MasterUsername
- DBInstanceClass
- DBEngineVersion as optional input for Aurora. If empty, allow the service default.
- KmsKeyId as optional input for storage encryption.
- PerformanceInsightsEnabled and PerformanceInsightsRetention
- MonitoringIntervalSeconds
- BackupRetentionDays and PreferredBackupWindowUTC
- SNSNotificationEmail as optional input
- ActivityStreamEnabled and ActivityStreamMode

Outputs

- ClusterEndpoint for the writer endpoint
- ReaderEndpoint for the reader endpoint
- AppTierSecurityGroupId for the application tier security group
- KinesisStreamArn only when Activity Streams is enabled

Acceptance criteria

- The template deploys cleanly and produces a writer and two readers across three Availability Zones in us-east-1.
- Backtrack is enabled for 72 hours.
- Enhanced Monitoring at 10 seconds is configured.
- Read replica autoscaling is configured with min 2, max 5, and target CPU 70.
- CloudWatch alarms exist for replica lag and writer CPU and send notifications to SNS.
- All stateful resources use Snapshot policies for delete and replace.
- All names include -${EnvironmentSuffix} and the template passes cfn-lint validation.

Deliverable

A single file TapStack.yml in YAML containing parameters, resources, policies, scaling, monitoring, alarms, and outputs as described above. It must be ready to deploy with no external dependencies.
