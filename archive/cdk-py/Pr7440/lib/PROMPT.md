You’re helping me build out the first phase of a production-grade, multi-tenant SaaS environment running in AWS region, and I need you to generate CDK Python IaC code that provisions the full foundational infrastructure in a way that’s scalable, secure, and optimized for long-term growth.

Right now, the platform was originally sized for around 10k tenants, but actual load is closer to 2.5k, with API traffic sitting at roughly 2M requests per day instead of the expected 20M. Because of that, the goal for phase 1 is strictly deployment — not downsizing — and then in phase 2 we’ll layer in cost and utilization optimization based on real metrics.

For the deployment phase, the environment needs to include an Aurora Global Database using a db.r6g.4xlarge writer in region, two reader instances, 30-day retention, Performance Insights, and enhanced monitoring every 30 seconds. The compute layer will run on an EC2 Auto Scaling Group using m5.4xlarge instances with a desired capacity of 15 (min 12, max 25), fronted by an Application Load Balancer that uses path-based routing across multiple target groups, handles SSL termination, and supports connection draining with a 300-second timeout.

Data-persistence will also include three DynamoDB tables (tenants, users, audit_logs) using on-demand billing with four GSIs per table, streams enabled, PITR, and encryption with KMS CMK. For caching, deploy an ElastiCache Redis cluster using cache.r6g.4xlarge nodes with 4 shards, 2 replicas each, cluster mode enabled, automatic failover, and both in-transit and at-rest encryption.

All resources should run inside a new VPC spanning three AZs with public and private subnets, VPC Flow Logs streamed to CloudWatch Logs with a 90-day retention policy, security groups with tightly scoped ingress/egress, and IAM roles with proper assume-role boundaries. This will all live in a production AWS account, with additional presence in region 2 and region 3, though no regional failover is required yet.

Once phase 1 is deployed, I need a second deliverable — an optimize.py script using boto3 to perform a 60-day metric analysis and execute a three-phase optimization plan with 48-hour observation windows between steps and automatic rollback if error rates rise above 0.5% or p99 latency increases more than 20%.

The script should:

Phase 1 (non-critical): analyze DynamoDB CloudWatch metrics, remove GSIs with fewer than 50 queries per week, disable streams if no Lambda consumers exist, and consolidate the three tables into two if single-table access patterns support it.

Phase 2 (compute): evaluate EC2 p95 CPU and network utilization to scale down to m5.2xlarge, lower ASG capacity to desired 8 (min 6, max 15), and reduce Redis to cache.r6g.xlarge with 2 shards and 1 replica if CPU < 30%, memory < 50%, and commands/sec < 10k.

Phase 3 (database): scale Aurora by removing secondary-region presence, reducing the writer to db.r6g.xlarge, dropping readers from 2 to 1 when replica lag stays under 100ms and read IOPS stay below 20% of write IOPS, and lower backups to 14 days.

The optimization script must exclude tenant-specific resources (tagged TenantId:\*), use the Cost Explorer API for accurate multi-month trending and Reserved Instance recommendations, and generate an HTML dashboard using Plotly that includes cost breakdowns, heat maps by resource type, a savings projection timeline, risk matrix, optimization progress table, and tenant-impact analysis.

Your output should provide complete CDK Python code (single file: lib/tap_stack.py) for phase 1, plus a separate fully working lib/optimize.py script for phase 2, following AWS best practices, clean dependency ordering, and production-ready defaults.
