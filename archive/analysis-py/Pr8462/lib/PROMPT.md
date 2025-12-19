I need a powerful Python script (using Boto3 and tabulate for output formatting) to run a deep, analytical audit of DynamoDB tables based on CloudWatch metric data from the last 30 days (or whatever historical data is available in the environment).

Analysis Requirements
The script needs to identify the following 14 complex issues:

Provisioned Waste: Flag tables using Provisioned Capacity where the actual consumption has been less than 30% of RCU/WCU over the last 30 days.

Missing Auto-Scaling: Find Provisioned Capacity tables without auto-scaling policies enabled, risking both cost overrun and throttling.

On-Demand Misuse: Identify On-Demand tables with consistent, predictable traffic that would be cheaper if moved to Provisioned Capacity.

Hot Partitions: Flag tables showing persistent throttling events, indicating a poor partition key choice or non-uniform access pattern.

Large Item Cost: Find tables with an average item size exceeding 100KB, recommending migration of large attributes to S3.

GSI Over-Projection: Identify Global Secondary Indexes (GSIs) projecting ALL attributes when the GSI is clearly underutilized (less than 10% usage).

Excessive GSIs: Flag any table with more than 10 GSIs, which drastically increases write costs and maintenance overhead.

Poor Data Modeling: Flag tables where the daily count of Scan operations is significantly higher than Query operations.

Missing Resilience: Find all tables tagged DataCritical: true (like game state or transactions) that do not have Point-in-Time Recovery (PITR) enabled.

Missing Encryption: Flag any table storing sensitive player data that is not encrypted with a Customer-Managed KMS key.

Missing TTL: Find tables storing temporary data (e.g., session tokens, temporary leaderboards) where Time-to-Live (TTL) is not configured, causing unbounded growth.

Stale Streams: Flag tables with DynamoDB Streams enabled but no Lambda or service consuming the stream, wasting throughput and storage.

Missing Monitoring: Find tables without any CloudWatch alarms set up to monitor throttling, system errors, or latency spikes.

Missing Global Tables: Identify tables critical for global gameplay that are not configured as multi-region Global Tables.

Critical Filters and Output
The script must only analyze tables that have seen more than 1000 requests per day over the last 30 days. It must ignore any table prefixed with test- or temp-, and any table tagged ExcludeFromAnalysis: true.

For the final report, I need:

A detailed console output showing all the analyse findings

A structured dynamodb_optimization.json file listing all findings with specific severity (CRITICAL, HIGH, etc.) and calculated monthly cost savings.

An access_pattern_report.csv analyzing the query vs. scan ratios for poorly modeled tables.

Implementation Guidelines
The script should gracefully handle environments with limited historical metrics by analyzing whatever data is available. When CloudWatch metrics are sparse or unavailable, the script should still analyze table configurations (PITR, encryption, TTL, streams, GSIs, etc.) and provide actionable recommendations.

The script must handle API limitations gracefully:

- Wrap all AWS API calls in try-except blocks to handle unsupported operations
- If an API call fails or returns incomplete data, log a warning and continue with other checks
- For CloudWatch metrics, if no historical data exists, analyze only configuration-based issues
- For auto-scaling checks, handle cases where auto-scaling APIs may not be available
- Continue analysis even if some checks cannot be completed, reporting what was successfully analyzed

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`
