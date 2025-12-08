Create a Python script using Boto3 to perform comprehensive security and cost optimization analysis of AWS EFS file systems in the us-east-1 region.

## Analysis Requirements

The script must perform the following checks:

**Cost & Performance Optimization:**

1.  **Throughput Waste:** Find file systems in Provisioned Throughput mode where actual usage has been consistently less than 30% of the provisioned capacity over the last 30 days.
2.  **Burst Credit Risk:** Identify file systems using Bursting mode that are consistently depleting their burst credits indicating need for provisioned or elastic throughput.
3.  **Storage Tier Waste:** Find file systems where over 50% of the data has not been accessed in the last 30 days but lacks a lifecycle policy to transition to the Infrequent Access (IA) storage class.
4.  **Performance Misconfiguration:** Flag file systems in the high-latency "Max I/O" performance mode that have low file counts and are better suited for the "General Purpose" mode.
5.  **Cleanup:** Identify file systems with zero client connections in the last 60 days that are still incurring costs.

**Security and Resilience Gaps:**

6.  **Missing Encryption:** Flag any file system storing application data that is not using KMS for encryption at rest.
7.  **No TLS in Transit:** Find mount targets that are not configured to enforce TLS encryption for data in transit.
8.  **Wide-Open Access:** Flag mount targets with security groups allowing NFS (port 2049) from 0.0.0.0/0 or overly broad CIDR ranges.
9.  **No IAM Authorization:** Identify file systems that are not configured to use IAM authorization for fine-grained access control, relying only on POSIX permissions.
10. **Root Risk:** Flag file systems with root squashing disabled allowing root users on clients to have root access on file system.
11. **Disaster Recovery:** Find critical file systems (e.g., tagged `DataCritical: true`) that are not configured for cross-region replication for disaster recovery.
12. **No Backup Plan:** Flag file systems that are missing integration with an AWS Backup plan.
13. **Single AZ Risk:** Identify file systems using the cost-saving One Zone storage class that are tagged for production use, lacking cross-AZ redundancy.

**Operational Health and Observability:**

14. **Missing Alarms:** Flag file systems that lack CloudWatch alarms for critical metrics like burst credit balance, percent IO limit, or client connections.
15. **Metadata Bottlenecks:** Identify file systems with consistently high metadata operation rates (> 1000 ops/sec) causing potential performance degradation.

## Filters

The script must ignore file systems tagged `ExcludeFromAnalysis: true` or `Temporary: true`, and must only audit file systems older than 30 days.

## Deliverables

The script must generate four outputs:

1.  **Console Output:** A summary table showing file system performance and cost optimization recommendations the report include all AWS assoicated resource details.
2.  **`efs_analysis.json`:** A detailed JSON report listing all findings, access point details, and a summary of total potential savings.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
