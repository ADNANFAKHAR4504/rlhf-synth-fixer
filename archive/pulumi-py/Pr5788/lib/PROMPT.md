Hey mate, we’d like you to build a Pulumi Python solution to optimize a serverless transaction processing infrastructure that’s been facing performance and cost issues.
Our goal is to enhance efficiency, reduce costs, and maintain backward compatibility across all APIs. Please implement:

- Refactor critical Lambda functions that handle payment processing to be optimized, minimizing cold starts for high-traffic endpoints.
- Implement **DynamoDB Global Secondary Indexes (GSIs)** to improve query performance for transaction lookups by merchant ID and date ranges.  
  Ensure these GSIs are added without downtime, using on-demand billing during migration.
- Adjust Lambda configurations based on profiling data:
  1. Transaction validator functions should use **1536MB memory**.
  2. Notification handler functions should use **512MB memory**.
- Replace **synchronous Lambda invocations** for non-critical operations (like analytics and reporting) with **SQS queues** to improve throughput and decouple workloads.
- Configure **S3 lifecycle policies** to automatically archive CloudWatch log exports older than 7 days into **Glacier**, reducing storage costs.
- Enable **DynamoDB auto-scaling** with a target utilization of **70%** for both read and write capacity, ensuring efficient scaling while minimizing expenses.
- Set up **API Gateway caching** for frequently accessed endpoints, using a **300-second TTL** to lower repeated query loads and improve latency.
- Implement **Lambda layers** for shared dependencies to reduce deployment package sizes and speed up updates.
- Add **CloudWatch alarms** that trigger when Lambda concurrent executions exceed **80%** of the regional limit (limit = 1,000).
- Enable **DynamoDB point-in-time recovery (PITR)** and optimize backup retention policies to balance cost and recovery reliability.

Keep the deployment backward-compatible with existing API endpoints and response formats.  
Total AWS costs after optimization should stay under **$1,000 per month**.  
Focus on measurable impact: aim for at least **40% reduction in Lambda cold starts**, **30% lower DynamoDB costs**, and **50% reduction in CloudWatch storage costs**, while maintaining full reliability and uptime.
