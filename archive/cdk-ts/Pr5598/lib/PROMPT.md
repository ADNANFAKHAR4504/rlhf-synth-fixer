I need help optimizing our serverless transaction processing system. We're spending way too much on AWS and our latency is getting worse during peak hours. The system is already running but we need to refactor it to cut costs and improve performance without breaking anything that's currently working.

Here's what we have right now:
- API Gateway REST APIs handling transaction requests
- Lambda functions processing around 10 million transactions per day
- DynamoDB tables with over 500GB of data
- S3 buckets storing transaction logs
- Everything running in production across us-east-1 and us-west-2

The problems we're seeing:
1. Lambda functions are over-provisioned. Our CloudWatch metrics show we're only using about 60% of the allocated memory. We're also still on x86_64 and should migrate to ARM-based Graviton2 processors.
2. DynamoDB is on on-demand billing and it's expensive. We need to switch to provisioned capacity with auto-scaling. Based on our usage patterns, we should scale between 5 and 500 read/write capacity units.
3. We're doing a lot of DynamoDB scans which is killing our read costs. About 80% of our read costs come from scans. We need to add Global Secondary Indexes to query efficiently instead.
4. S3 storage costs are growing. Transaction logs older than 30 days should move to Glacier, and we need to delete stuff after 7 years for compliance reasons.
5. Non-real-time transactions are triggering individual Lambda invocations. If we batch these through SQS instead, we could cut invocation costs by around 70%.
6. During traffic spikes, we're getting throttled and costs spike. We need reserved concurrency limits.
7. We don't have good visibility into what's happening. Need CloudWatch alarms for Lambda duration, DynamoDB throttles, and cost thresholds.
8. Lambda timeouts are happening because we're not setting timeouts based on actual execution times from our logs.
9. Failed transactions just fail - we need dead letter queues with retry logic.
10. Cost tracking is a mess. We need proper tags on everything so we can see where money is going.

Constraints we have to work with:
- Can't break the 99.9% uptime SLA while deploying
- Can't change API Gateway endpoints or break backward compatibility
- DynamoDB migration has to be zero-downtime using point-in-time recovery
- Can't change business logic in Lambda functions
- Cost savings can't slow down real-time transaction processing
- Everything needs to be reversible if something goes wrong
- Need before/after metrics to prove the optimizations work
- Resource naming must follow our standard: {environment}-{service}-{component}
- Use CDK best practices with L2/L3 constructs

What I need:
A complete CDK TypeScript application (CDK v2) that includes:

1. Lambda optimizations:
   - Switch to ARM64 architecture
   - Set memory sizes to reduce that 40% underutilization
   - Configure reserved concurrency and timeouts based on P99 logs
   - Add dead letter queues with exponential backoff
   - CloudWatch alarms for errors and duration
   - VPC endpoints for DynamoDB and S3 to reduce data transfer costs

2. DynamoDB improvements:
   - Convert to Provisioned billing with autoscaling (5-500 RCU/WCU)
   - Add GSIs to eliminate those expensive scans
   - Enable Point-in-Time Recovery
   - Zero-downtime migration strategy

3. SQS batch processing:
   - Queue for non-real-time transactions
   - Batch size and visibility timeout aligned with Lambda runtime
   - Route from API Gateway to SQS for async workloads
   - Keep real-time path unchanged

4. S3 lifecycle policies:
   - Transition logs older than 30 days to Glacier
   - Delete after 7 years
   - Enable versioning and encryption

5. Monitoring and cost controls:
   - CloudWatch alarms for Lambda duration/errors, DynamoDB throttles, monthly cost thresholds
   - Dashboards showing P50/P90/P99 latency, error rates, throttle counts, cost KPIs
   - Metric filters for before/after comparison

6. Tagging:
   - Cost allocation tags: Environment, Service, Component, Owner, CostCenter, SourceCommit, DeployedAt
   - Enforce naming convention

7. Rollback capability:
   - Version retention for rollback
   - Deploy-safe changes with gradual traffic shifting
   - Multi-region parity (us-east-1 primary, us-west-2 DR)

Use least-privilege IAM with explicit grants. Keep code organized with clear comments. Output two files: bin/tap.ts (CDK app entry point) and lib/tap-stack.ts (the full stack).

Goal: Cut monthly costs by at least 60% and improve P99 latency from 5 seconds to under 1 second, while keeping all existing APIs working and maintaining our uptime SLA.
