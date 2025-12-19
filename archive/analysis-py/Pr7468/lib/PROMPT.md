We need a comprehensive performance and cost audit for our Amazon Redshift data warehouse platform in AWS `us-east-1`, spanning 23 clusters (dc2.large up to ra3.16xlarge) holding 2.4 PB across production, staging, and analytics.  
Please create a Python 3.12 script called **analyze_redshift.py** using **Boto3**, **pandas**, and **psycopg2** (for SQL/table analysis) to analyze cluster configurations, metrics, and table design for tuning and savings.

**Your script must fully analyze and report on:**

1. **Low CPU Utilization:** Average CPU <30% over 30 days—indicates over-provisioning.
2. **Disk Space Pressure:** Disk usage >85%—query failures/performance risk.
3. **High Query Queue Time:** Avg queue time >30s—suggests WLM config issues.
4. **Unoptimized Tables:** Tables missing sort or distribution keys—causes excessive scanning and redistribution.
5. **No Automatic Snapshots:** Production clusters missing automated snapshot schedule or retention <7 days.
6. **Missing Encryption:** Clusters holding financial or healthcare data without KMS encryption.
7. **Single-AZ Deployment:** Production clusters not multi-AZ.
8. **Old Maintenance Track:** More than 2 versions behind current release—missing features and patches.
9. **No Enhanced VPC Routing:** Cluster accesses S3 over internet, not Enhanced VPC Routing.
10. **Inefficient Node Types:** Dense Compute (dc2) used where ds2 or RA3 would be more cost-effective.
11. **No Query Monitoring Rules (QMR):** No QMR for automated handling/problem queries.
12. **Vacuum/Analyze Gaps:** Significant ghost rows/stale stats on tables—VACUUM/ANALYZE required.
13. **No Concurrency Scaling:** Clusters with query waits during peak, without concurrency scaling.
14. **Spectrum Overuse:** Spectrum queries scan full S3 datasets, no partition pruning—excess cost.
15. **Missing Reserved Nodes:** >1 year on-demand clusters with no reserved node pricing.
16. **No Parameter Group Customization:** Default parameter groups in use rather than workload-optimized configs.
17. **Unmonitored Disk-Based Queries:** >10% queries spill to disk, but no alerts set (indicates memory tuning needed).

**Exclusions and rules:**
- Exclude clusters tagged `ExcludeFromAnalysis: true` (case-insensitive).
- Only analyze clusters >14 days old.
- Ignore clusters/tables/identifiers beginning with `dev-` or `test-`.
- For table-level analysis, connect via psycopg2 using supplied credentials to query views like SVV_TABLE_INFO, STL_QUERY. 

**Output requirements:**

- **Console:** Print per-cluster performance score (0-100), major bottlenecks, and prioritized optimization recommendations.
- **File output:**  
    - **redshift_analysis.json:** With:
        - `clusters`: [{cluster_id, node_type, cpu_avg, disk_usage_percent, query_queue_avg, maintenance_track, parameter_group, issues: [{type, severity, details, remediation}], cost_analysis: {current_cost, reserved_pricing_savings, optimized_cost}}],
        - `spectrum_analysis`: [{cluster_id, spectrum_query_details, s3_scan_bytes, partition_pruning, overuse_score}],
        - `summary`: {total_clusters, prod_clusters, avg_cpu, avg_disk, total_pb, total_potential_savings}
- **HTML dashboard:**  
    - **cluster_utilization_trends.html** showing CPU, disk, query queue, and performance over time.
- **Rightsizing recommendations:**  
    - **rightsizing_recommendations.csv** listing node type migration and estimated cost impact.
- **SQL optimization script:**  
    - **table_optimization_script.sql** containing recommended VACUUM, ANALYZE, and table redesign DDL statements per findings.

**Additional specifications:**

- Performance scoring must blend efficiency, availability, disk, query queue, table design, and optimization signals.
- Savings for reserved node pricing must be calculated using current AWS pricing.
- Table analysis should call correct system views for ghost row/stale stats and optimization detection.
- Cluster and spectrum usage should include concise remediation steps.
- Each output must be formatted exactly as described.

**Environment:**

- AWS us-east-1, Redshift, Redshift Spectrum, CloudWatch, S3, KMS
- Python 3.12, Boto3, pandas, psycopg2 (for table queries), appropriate charting lib for HTML dashboard

_Do not omit, reinterpret, or modify any requirement, exclusion, or output format outlined above. Deliverables must follow this specification exactly._