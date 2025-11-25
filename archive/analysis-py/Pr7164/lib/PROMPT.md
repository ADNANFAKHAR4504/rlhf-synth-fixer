We need a comprehensive performance, security, and cost audit for our AWS ElastiCache clusters (Redis and Memcached) in the `us-east-1` region. Please create a Python 3.12 script named `analyze_elasticache.py` using **Boto3** and **Pandas** to fully analyze cluster configurations, CloudWatch metrics over the last 30 days, and cost opportunities.

**Your script must analyze and report on:**

1. **Underutilized Clusters:** Any cluster where cache hit ratio <85% and evictions >1000/hour—indicates poor memory sizing or key distribution.
2. **Over-Provisioned Nodes:** Clusters with CPU utilization <20% and network throughput <10% of node capacity over 30 days.
3. **No Automatic Failover:** Redis replication groups in prod lacking automatic failover.
4. **Single AZ Deployments:** Production clusters in one AZ, missing Multi-AZ.
5. **Missing Encryption:** Clusters tagged `DataClassification: Sensitive` without encryption at rest/in transit.
6. **Old Engine Versions:** Redis <6.2, Memcached <1.6—missing patches/performance fixes.
7. **No Auth Token:** Redis clusters lacking AUTH token (unrestricted access risk).
8. **Inadequate Backup:** Redis clusters with backups disabled or retention <7 days.
9. **Connection Exhaustion Risk:** Clusters nearing max connections for node type and lacking connection pooling.
10. **Inefficient Node Types:** Previous-gen nodes (cache.m3, cache.t2) in use—should migrate to current-gen (cache.m6g, cache.t4g).
11. **Memory Pressure:** Memory usage >90% with high evictions—need more nodes/resources.
12. **No CloudWatch Alarms:** Clusters lacking alarms for CPU, memory, evictions, replication lag.
13. **Unused Parameter Groups:** Custom groups not attached to any cluster for >90 days.
14. **Excessive Snapshot Retention:** Redis with >35 day snapshot retention (non-critical), incurring extra costs.
15. **No VPC Deployment:** Clusters in EC2-Classic, not VPC (missing SG protection).
16. **Reserved Node Opportunities:** Clusters >1 year on-demand—suggest reserved node purchases for savings.

**Audit rules and exclusions:**
- **Exclude** clusters tagged `ExcludeFromAnalysis: true` (case-insensitive).
- **Only include** clusters running >14 days.
- **Ignore** clusters with IDs starting with `dev-` or `test-`.
- You must analyze 30 days of CloudWatch metrics: CacheHitRate, Evictions, CPUUtilization, NetworkBytesIn/Out, CurrConnections.

**Output requirements:**

- **Console:** Print per-cluster performance score (0-100) and cost optimization recommendations.
- **File output:**  
    - **elasticache_analysis.json** with:
      - `clusters`: [{cluster_id, engine, engine_version, node_type, num_nodes,
          issues: [{type, severity, metric_data, description, remediation}],
          performance_metrics: {cache_hit_rate, evictions_per_hour, cpu_avg, memory_usage_percent, connections_peak},
          cost_analysis: {current_monthly_cost, reserved_pricing_savings, rightsizing_savings, optimized_monthly_cost}
        }]
      - `summary`: {total_clusters, redis_count, memcached_count, total_monthly_cost, total_potential_savings, avg_cache_hit_rate, clusters_at_risk}
- **HTML dashboard:**  
    - **cache_performance_dashboard.html** visualizing hit rates, evictions, memory/CPU, connection utilization trends, and optimization impact.
- **CSV:**  
    - **cluster_rightsizing_plan.csv**: migration/upsize/downsize recommendations and estimated cost impact.

**Additional specifications:**

- Calculate and report reserved node pricing savings for eligible clusters.
- Recommend migration from older to current generation nodes where applicable.
- Flag high memory pressure (usage + evictions) and recommend node scaling.
- Include concise remediation steps for each finding.
- Performance scoring algorithm must blend efficiency, availability, security, and backup metrics.
- All outputs (JSON, HTML, CSV) must follow exactly the structure above.

**Environment:**

- AWS us-east-1, ElastiCache, CloudWatch, VPC
- Python 3.12, Boto3, Pandas, Matplotlib/Plotly (for dashboard and charts)

_Do not omit, reinterpret, or modify any requirement, exclusion, or output format described above. Deliverables must follow this specification exactly._