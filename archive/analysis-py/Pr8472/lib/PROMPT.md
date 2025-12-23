Develop an expert-level Python script using Boto3 to perform a deep, forensic audit of AWS Backup posture in us-east-1 to ensure compliance with backup and recovery standards.

### Analysis Requirements (12 Critical Checks)

The script must analyze recovery points, vaults, and plans against the following mandates:

1. **Unprotected Resources (CRITICAL):** Identify EC2, RDS, EBS, EFS, and DynamoDB resources tagged `RequireBackup: true` that have no backup plan assignment.
2. **Missing Prod Coverage (CRITICAL):** Flag production resources (`Environment: production`) lacking any backup coverage.
3. **Inadequate Retention:** Flag plans with retention less than 7 days for resources tagged `DataClassification: Critical`.
4. **No Immutability:** Identify backup vaults without Vault Lock (WORM) configured for ransomware protection.
5. **No Cross-Region DR:** Flag vaults missing cross-region copy rules for disaster recovery.
6. **Unencrypted Vaults:** Flag vaults that are not encrypted using a KMS key.
7. **Recovery Point Gaps:** Identify resources with more than 48 hours between recovery points, indicating recent backup job failures.
8. **Consecutive Failures:** Flag jobs in FAILED or EXPIRED state for three or more consecutive attempts.
9. **Missing Notifications:** Flag vaults without SNS topics configured for immediate job failure alerts.
10. **Inadequate Testing:** Flag backup plans where no restore testing has been performed in the last 90 days.
11. **Orphaned Points:** Find recovery points for deleted source resources still consuming storage.
12. **Cost Inefficiency:** Flag plans without lifecycle transition to cold storage (Glacier) after 30 days.

### Operational Constraints

- **Filters:** Exclude resources tagged `ExcludeFromAudit: true` or `Temporary: true`.
- **Scope:** Analyze resources in us-east-1 region, supporting multi-account role assumption where applicable.
- **Testing:** Include comprehensive test coverage with diverse resource scenarios including failure states to validate audit logic.

### Required Deliverables

1. **Console Output:** Summary of compliance status and risk severity with the resource details
2. **backup_compliance_audit.json:** Full detailed JSON report including recovery point analysis and compliance summary.
3. **recovery_readiness_report.csv:** CSV detailing recovery point gaps and calculated RPO/RTO readiness.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
