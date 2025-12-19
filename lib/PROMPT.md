We're running a cost and performance audit on all 45 RDS databases (Aurora, PostgreSQL, MySQL) supporting our SaaS apps in `us-east-1`. Please create a CLI Python script `analyse.py` using **Boto3** and **Pandas** to act as a diagnostic and optimization tool.

**Analysis required:**

1. **Underutilized Databases:** Find databases with average CPU < 20% *and* max connections < 10% of `max_connections` over the past 30 days (from CloudWatch).
2. **High Storage Growth:** Flag any with storage growth > 20% per month—surface for scale/archival.
3. **Burstable Credit Depletion:** Catch `db.t3`/`db.t2` with consistently depleted burst credits—recommend instance upgrade.
4. **Missing Multi-AZ:** Any *production* instance (`Environment: production` tag) with Multi-AZ *disabled*.
5. **No Automated Backups:** Backup retention set to 0.
6. **Outdated Engine Versions:** Spot instances more than 2 minor versions behind the latest for their engine.
7. **No Enhanced Monitoring:** Allocated storage > 1TB with Enhanced Monitoring *disabled*.
8. **Read Replica Lag:** Aurora clusters with average lag > 1000ms (CloudWatch).
9. **No Performance Insights:** Production DBs **without** Performance Insights enabled.
10. **Inefficient Storage:** Any database on Magnetic instead of `gp3`/`io2`.
11. **Parameter Group Defaults:** Not using a customized parameter group.
12. **No Encryption:** *Sensitive* DBs (`DataClassification: Sensitive` tag) not encrypted at rest.
13. **No IAM Database Auth:** PostgreSQL/MySQL DBs without IAM database authentication.
14. **Idle Connections:** Instances with `max_connections` > 1000 but peak < 100.

**Exclusions/rules:**
- Only analyze DBs **older than 30 days** (from creation date).
- **Skip any DB with `ExcludeFromAnalysis: true` tag**.
- **Ignore** instances with identifiers starting with `test-`.

**Output:**
- Print performance score (0-100) per instance, plus clear prioritized recommendations, *grouped by severity/topic*.
- Write `rds_performance_report.json` with detailed findings per instance:
  - Fields: `db_identifier`, `engine`, `instance_class`, `performance_score`, `issues` (list: type, severity, metric_value, threshold, recommendation)
  - For each, provide: `cost_optimization` (current vs. optimized cost, potential savings)
  - Provide a top-level `summary`: `total_instances`, `avg_performance_score`, `total_potential_savings`
- Create `rds_rightsizing.csv` (columns: DBIdentifier, Engine, CurrentClass, RecommendedClass, CPU_P95, Connections_P95, IOPS_P95, MonthlySavings).
- Save `performance_distribution.png` (distribution of scores) using matplotlib.
- Performance scoring must blend efficiency, availability, monitoring, and compliance metrics.
- Show cost calculations and connection efficiency in recommendations.

**Testing/CI:**
- Provide `pytest` tests using *moto* to mock at least 30 diverse RDS instances, including CloudWatch metrics for all audit categories.

**Python environment:**  
- Python 3.12, Boto3, Pandas, Matplotlib, Moto for testing

**Delivery:**
- Main script as `analyse.py` (Python code block).
- Tests as `test_analyse.py` (Python code block).
- Any templates (HTML, Jinja2) inline or in a separate block.

_Do not omit or reinterpret any requirement or output format—everything above must be implemented as specified._