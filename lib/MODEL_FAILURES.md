1. **Missing Resource Sharing**

   - Resource Access Manager (RAM) was not implemented, failing the requirement to share resources across AWS accounts.

2. **IAM Policy Weakness**

   - Policies allowed overly broad access instead of deny-by-default with explicit permissions.

3. **Incomplete S3 Lifecycle Management**

   - Lifecycle policies for log storage were missing or incomplete, risking non-compliance with log retention policies.

4. **Tagging Inconsistencies**

   - Some resources lacked mandatory company-standard tags, causing issues with cost tracking and compliance.

5. **Monitoring Gaps**

   - CloudWatch alarms were defined minimally without thresholds for performance degradation, reducing visibility into infrastructure health.

6. **Compliance Risks**
   - While encryption was applied to RDS, not all in-transit encryption settings (like enforcing TLS for database connections) were configured.
