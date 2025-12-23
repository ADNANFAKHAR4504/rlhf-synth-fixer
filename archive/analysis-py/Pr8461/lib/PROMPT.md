We need a comprehensive cost and monitoring coverage audit for all Amazon CloudWatch Log Groups in `us-east-1`. Please create a Python 3.12 script called `analyze_cloudwatch_logs.py` using **Boto3** and **Pandas** to analyze log configurations, identify optimization opportunities, and detect monitoring gaps.

**The script must analyze these issues:**

1. **Indefinite Retention:** Log groups where retention is set to "Never Expire", causing open-ended storage cost growth.
2. **Excessive Retention of Debug Logs:** Log groups classified as "debug" retaining logs longer than 30 days; audit logs over-retained past 7 days.
3. **Missing Metric Filters:** Application log groups without associated metric filters for error tracking and alerting.
4. **Unused Log Groups:** Log groups with no new events in the last 60 days but still incurring storage costs.
5. **No Encryption:** Log groups tagged `DataClassification: Confidential` that do not use KMS-managed encryption.
6. **Subscription Filter Overload:** Log groups with more than 2 subscription filters, risking ingestion or delivery throttling.
7. **Missing Log Streams:** Expected log streams (from EC2 or Lambda sources) are absent, indicating potential agent/configuration issues.
8. **High Ingestion Rate:** Any log group with average ingestion > 5 MB/s, suggesting opportunity for source-side sampling or filtering.
9. **No Cross-Region Backup:** Critical log groups missing a subscription filter that sends logs to S3 in another region for DR.
10. **Duplicate Logging:** Multiple Lambda functions or containers duplicating log events in different log groups.
11. **No Saved Log Insights Queries:** Lack of common troubleshooting queries saved in Log Insights for each application log group.
12. **VPC Flow Logs Cost:** VPC Flow Logs configured with "ALL" traffic capture when "REJECT" only would suffice.
13. **Inefficient Log Format:** Applications writing verbose JSON when a more efficient, structured log format could reduce volume and cost.

**Exclusions/filters:**
- Only analyze log groups created more than 30 days ago.
- Exclude any log group tagged `ExcludeFromAnalysis: true` (case-insensitive).
- Ignore any log group prefixed with `/aws/lambda/dev-` or `test-`.

**Output requirements:**

- **Console:** Show storage costs for each log group (per CloudWatch Logs pricing), with clear optimization recommendations.
- **JSON:** Save results as `cloudwatch_logs_optimization.json` with structure:
    - `log_groups`: List of objects with `log_group_name`, `retention_days`, `stored_bytes`, `daily_ingestion_mb`, `monthly_cost`, `issues` (list of `{type, description, recommendation}`), and `optimization` (recommended retention, metric filters, estimated savings).
    - `monitoring_gaps`: List of objects: `{resource_type, resource_id, expected_log_group, status}`.
    - `summary`: `{total_log_groups, total_monthly_cost, total_stored_gb, optimized_monthly_cost, total_savings}`.
- **Chart:** Output a `log_retention_analysis.png` chart showing retention period vs monthly cost for all log groups and the effect of optimization.
- **CSV:** Output `monitoring_coverage_report.csv` listing all monitored resources (Lambda, EC2, etc.) and their CloudWatch log group status.

**Further specifications:**

- Storage costs and estimated savings must use actual CloudWatch Logs pricing (calculate at least storage and ingestion components).
- Clearly report log groups that are non-compliant, over-retained, pose a monitoring gap, or that need changes for compliance/cost.
- Provide concise remediation recommendations for every flagged issue.
- All outputs must be formatted exactly as described.

**Environment:**
- AWS us-east-1, CloudWatch Logs, KMS, S3, Lambda
- Python 3.12, Boto3, Pandas, Matplotlib (for charting)

_Do not omit, change, or reinterpret any requirement or output format described above—produce everything as specified._