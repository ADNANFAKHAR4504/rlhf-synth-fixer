We need a comprehensive throughput optimization and data loss prevention audit of our AWS Kinesis architecture in the `us-east-1` region, covering 45 Data Streams and 67 Firehose delivery streams that ingest 890 GB of data daily.  
Create a Python 3.12 script called **analyze_kinesis.py** using **Boto3** and **Pandas** to analyze Kinesis Data Streams, Kinesis Firehose delivery streams, CloudWatch metrics, stream configurations, and consumer performance.

**Your script must perform all of the following analyses:**

1. **Iterator Age High:** Data Streams with `GetRecords.IteratorAgeMilliseconds > 60000ms`—indicates consumer lag.
2. **Throttled Records:** Streams experiencing `WriteProvisionedThroughputExceeded` errors >1% of requests—indicates insufficient shard capacity.
3. **Under-Provisioned Shards:** Streams with incoming rate >80% of provisioned throughput consistently over 7 days.
4. **Over-Provisioned Shards:** Streams with incoming rate <20% of provisioned throughput—flag for potential cost optimization.
5. **No Enhanced Monitoring:** Critical data streams without enhanced (shard-level) monitoring.
6. **Excessive Retention:** Streams retaining data for 7 days when 24 hours would suffice—cost savings opportunity.
7. **No Encryption:** Streams with PII or sensitive data not using KMS for server-side encryption.
8. **Firehose Delivery Failures:** Firehose streams with failed delivery rate >1% (to S3, Redshift, Elasticsearch).
9. **Small Batch Sizes:** Firehose buffer size <5MB and buffer interval <300s—results in excessive S3 PUT requests.
10. **No Data Transformation:** Firehose streams delivering raw data, missing Lambda transformation for conversion/enrichment.
11. **Missing S3 Backup:** Firehose streams delivering to Redshift/Elasticsearch without S3 backup for failures.
12. **No CloudWatch Alarms:** Streams without alarms for iterator age, throttling, or failed deliveries.
13. **Consumer Lag:** Data Streams with enhanced fan-out consumers having `MillisBehindLatest > 5000ms`.
14. **Shard Splitting Needed:** Hot shards (far above average throughput) lacking automatic resharding.
15. **VPC Endpoint Not Used:** Firehose streams access S3 via internet, not VPC endpoint—unnecessary data transfer costs.
16. **No Cross-Region Replication:** Critical streams without redundant Kinesis replication to DR/secondary region.
17. **On-Demand Misconduct:** Streams using on-demand mode despite having steady, predictable traffic.

**Filters and exclusions:**

- Exclude any stream tagged `ExcludeFromAnalysis: true` (case-insensitive).
- Only analyze streams with >100 records per minute.
- Ignore streams (Data Streams or Firehose) with names prefixed `test-` or `dev-`.
- Must analyze past 7 days of CloudWatch metrics: iterator age, throughput, failed deliveries, buffer, error rates.

**Outputs must include:**

- **Console:** Print stream health scores, throughput utilization, and consumer lag analysis for each stream.
- **kinesis_analysis.json:** Include:
    - `data_streams`: list of stream stats, configuration, metrics, health score, optimization findings.
    - `firehose_streams`: delivery stream config, failed delivery rates, buffer settings, encryption, backup, Lambda integration, optimization findings.
    - `summary`: total streams analyzed, aggregate throughput and consumer lag, savings opportunity, high-priority issues.
- **throughput_utilization_dashboard.html:** Shard-level heatmap/visualization of utilization and bottlenecks.
- **consumer_lag_report.csv:** Detailed analysis of lag per consumer, flagged for attention where needed.
- **shard_optimization_plan.json:** Resharding recommendations, action steps, and projected improvement.

**Additional details:**

- Make sure all outputs adhere exactly to the prescribed format.
- Consumer lag and throughput analysis must use CloudWatch metrics and stream configuration/API data.
- Calculate cost and utilization optimizations as per actual AWS pricing.
- CloudWatch alarm recommendations must be prioritized where coverage is missing.
- Shard optimization (split/merge) and DR/replication flags must be actionable for ops teams.
- All findings must include concise remediation advice.

**Environment:**

- AWS us-east-1, Kinesis Data Streams, Firehose, CloudWatch, Lambda, S3, KMS
- Python 3.12, Boto3, Pandas, visualization/charting libraries for HTML dashboard

_Do not omit, reinterpret, or alter any requirement, exclusion, or output format described above; generate the specified script and output files exactly._