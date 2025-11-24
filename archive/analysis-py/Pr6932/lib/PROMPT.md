Create a robust Python script using Boto3 to conduct a deep configuration audit of Route53 hosted zones in the us-east-1 region. The script should analyze all public zones and VPC-associated private zones, moving beyond simple checks to identify hidden risks and cost inefficiencies.

### Analysis Requirements

1.  **Missing Resilience:** Flag records with Weighted/Latency/Geolocation policies that lack an associated Health Check, or are routing traffic to resources monitored by a Health Check that is currently in FAILURE state.
2.  **Cost/Performance TTL Issues:** Flag records with inefficient TTLs (Too long: greater than 300 seconds for dynamic endpoints; Too short: less than 60 seconds).
3.  **Cost/Alias Waste:** Identify records pointing to AWS resources (ELB, CloudFront, S3) using CNAME instead of ALIAS records.
4.  **Deployment Risk:** Flag records pointing to deprecated resources (terminated EC2 instances, deleted ALB).
5.  **Security/DNSSEC:** Flag public hosted zones for production domains without DNSSEC enabled.
6.  **Configuration Risk:** Identify records with heavily skewed weights (80% or more to one endpoint) or single-value records without a failover policy.
7.  **Audit Gaps:** Flag zones without query logging enabled, and health checks with inadequate thresholds (less than 3) or intervals (greater than 30 seconds).
8.  **Cleanup:** Flag unused private hosted zones (unassociated with any VPC) and unused public hosted zones without query logging enabled.

### Operational Filters

- **Exclusions:** Ignore test domains (containing .test, .example, or .local) and zones tagged with ExcludeFromAudit: true.
- **Scope:** Only audit public zones and VPC-associated private zones.

### Required Deliverables

1.  **Console Output:** Display critical security findings with remediation priority during execution with detailed resources informations.
2.  **route53_audit.json:** Generate a detailed JSON report listing all findings (with severity, impact, and remediation steps), plus a summary of orphaned records.
3.  **failover_recommendations.csv:** Generate a CSV file listing high availability improvements (single points of failure).

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
