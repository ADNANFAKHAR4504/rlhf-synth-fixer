Build a production Aurora MySQL 8.0 cluster in us-east-1 across three availability zones with automatic failover, read replica auto scaling, database activity streams, and CloudWatch monitoring.

Create a CloudFormation template named TapStack.yml that provisions the following infrastructure:

Aurora MySQL cluster with one writer instance in us-east-1a and two reader instances in us-east-1b and us-east-1c. Configure promotion tiers so the writer has tier 0 and readers have tiers 1 and 2 for deterministic failover ordering.

Enable Application Auto Scaling for read replicas targeting 70 percent CPU utilization with minimum 2 and maximum 5 instances.

Enable 72-hour backtrack window for point-in-time recovery without restoring from backup.

Configure enhanced monitoring with 10-second intervals. Create an IAM role that allows RDS to publish metrics to CloudWatch.

Enable Database Activity Streams in synchronous mode. Create a Kinesis Data Stream to receive the activity data. Include the required IAM role with permissions scoped to the specific Kinesis stream ARN.

Create CloudWatch alarms for replica lag exceeding 1000 milliseconds and writer CPU exceeding 80 percent. Configure an SNS topic with email subscription for alarm notifications.

Create a custom cluster parameter group with binlog_format set to ROW to support future cross-region replication.

Security requirements: Create a security group that only allows MySQL port 3306 from the application tier security group passed as a parameter. Do not allow 0.0.0.0/0 ingress.

Template parameters should include EnvironmentSuffix validated with pattern a-z0-9 and hyphens between 3 and 20 characters, VpcId, three private subnet IDs for each AZ, application security group ID, master username, master password with NoEcho, and optional KMS key ARN for encryption.

All resource names must include the EnvironmentSuffix to prevent naming collisions across environments.

Set DeletionPolicy and UpdateReplacePolicy to Snapshot on the cluster and instances to preserve data.

Export the cluster writer endpoint, reader endpoint, and Kinesis stream ARN as stack outputs.

The template must be pure YAML with no anchors or aliases and must pass cfn-lint validation.
