We need to build a disaster recovery setup for our Aurora PostgreSQL database that can automatically handle failures and switch over to a backup region. This is for a critical trading platform, so downtime needs to be minimal.

The basic requirements are:
- Deploy Aurora PostgreSQL in us-east-1 as the primary cluster
- Set up a read replica in us-west-2 that can take over if the primary fails
- Configure automated backups to S3 with cross-region replication
- Monitor database health every 30 seconds using Route 53
- Automatically failover to the DR region when primary health checks fail
- Verify backups daily by actually restoring them to make sure they work
- Alert the operations team when anything goes wrong

Some important constraints:
- Everything needs to be encrypted with customer-managed KMS keys
- Lambda functions can't run longer than 3 minutes
- Large snapshots should use S3 Transfer Acceleration
- Health checks need to verify both connectivity and that data is fresh (not stale)
- Failover should preserve in-flight transactions using Aurora global database features
- Detection should happen within 2 minutes, full failover within 5 minutes

The solution should use AWS CDK v2 with TypeScript. We'll need to wire up Aurora Global Database, health check Lambdas, failover automation, EventBridge rules for RDS events, SNS for alerts, S3 for backups with replication, CloudWatch alarms, and proper IAM roles with least privilege.

The infrastructure needs VPCs in both regions with private subnets for the databases, and VPC peering between regions so the systems can communicate. Security groups should only allow what's absolutely necessary.

For monitoring, we need alarms for replication lag (alert if it goes over 5 seconds), connection failures, Lambda errors, and anything else that could indicate a problem. The SNS topics should be set up so the ops team gets notified immediately.

The failover Lambda should be idempotent - it shouldn't cause problems if it runs multiple times. We can use S3 or DynamoDB to track state and prevent duplicate operations.

Output should be two files: the main CDK app entry point (main.ts or bin/tap.ts) and the stack implementation (tap-stack.ts). Keep the stack name as TapStack.
