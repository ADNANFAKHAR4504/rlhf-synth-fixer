We need a comprehensive performance, cost optimization, and security audit of our AWS EFS file systems in the `us-east-1` region. Our platform uses 78 EFS file systems for persistent storage across 450 ECS tasks and EKS pods and stores 1.2 TB of data.  
Create a Python 3.12 script called **analyze_efs.py** using **Boto3** to analyze EFS configurations, CloudWatch 30-day metrics, throughput modes, security groups, access points, mount targets, and storage class usage.

**Your script must audit and report on:**

1. **Provisioned Throughput Overprovisioning:** EFS provisioned throughput mode where actual throughput <30% of provisioned, suggesting downsizing.
2. **Bursting Mode Credit Depletion:** EFS bursting throughput mode with recurring burst credit depletion—recommend provisioned or elastic mode.
3. **No Encryption at Rest:** File systems storing application data but lacking KMS encryption.
4. **No Encryption in Transit:** Mount targets not enforcing TLS encryption.
5. **No Lifecycle Management:** No lifecycle policy to transition infrequently accessed files to IA storage.
6. **Single AZ File System:** Use of One Zone storage for prod workloads without cross-AZ redundancy.
7. **No Backup Policy:** Lack of AWS Backup integration or manual backup strategy.
8. **Unrestricted Mount Target Security Groups:** Mount targets accepting NFS (port 2049) from 0.0.0.0/0 or broad CIDR ranges.
9. **No IAM Authorization:** Relying only on POSIX permissions, lacking fine-grained IAM for EFS.
10. **Root Squashing Disabled:** File systems with root squashing off, risking privilege escalation.
11. **High Metadata Operations:** File systems with >1000 metadata ops/sec—flag for performance bottleneck.
12. **Unused File Systems:** No client connections in last 60 days but still incurring costs.
13. **No CloudWatch Alarms:** Missing alarms for burst credits, IO limit, or client count.
14. **Replication Not Enabled:** Critical file systems missing cross-region replication for DR.
15. **Inefficient Access Patterns:** Max I/O mode used with low file count; recommend General Purpose for latency.
16. **IA Storage Not Utilized:** >50% of data not accessed in 30 days—should be transitioned to Infrequent Access.

**Exclusions and filters:**
- **Exclude** file systems tagged `ExcludeFromAnalysis: true` (case-insensitive).
- **Only include** file systems older than 30 days.
- **Ignore** file systems tagged `Temporary: true` (case-insensitive).
- Must analyze 30 days of CloudWatch metrics: throughput, burst credits, IO, client count, metadata ops.
- Must calculate IA storage cost savings and throughput right-sizing recommendations.

**Output requirements:**

- **Console:** Print performance and cost optimization recommendations for every file system, highlighting critical security gaps.
- **efs_analysis.json:** Contains:
    - `file_systems`: List with id, size, throughput mode/config, perf metrics, lifecycle/config, security details, issues [{type, severity, metric_data, description, remediation}], cost optimization.
    - `access_points`: List with mount target, security group, IAM config, encryption, root squash state.
    - `summary`: {total_file_systems, percent_IA_storage, total_monthly_cost, IA_savings_opportunity, security_risks}
- **storage_class_utilization.html:** Chart showing Standard vs IA storage distribution, cost impact, and optimization potential.
- **lifecycle_policy_recommendations.json:** Suggested lifecycle transitions/rules for each file system with savings estimate.
- **security_hardening_checklist.md:** Markdown checklist (file) for mount target group/rules and IAM/hardening recommendations.

**Additional specs:**

- All outputs above must be formatted exactly as described.
- Security findings must include practical recommendations for remediation.
- Cost savings from IA and throughput changes must be based on actual AWS pricing.
- All actionable points (encryption, backup, IAM, root squash, etc.) must be clearly presented.

**Environment:**

- AWS us-east-1, EFS, EC2, CloudWatch, KMS, AWS Backup
- Python 3.12, Boto3, visualization/charting libraries (for HTML dashboard)

_Do not omit, reinterpret, or alter any requirement, exclusion, or output format described above. Deliverables must follow this specification exactly._