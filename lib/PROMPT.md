---

We need a comprehensive security and compliance audit on all of our S3 buckets in the `us-east-1` AWS region for SOC2 and GDPR. Please create a Python 3.12 CLI script (`analyse.py`), using **Boto3** and structured like an enterprise audit tool.

**What we need audited:**

1. **Public Access Check:** Flag any bucket with public read or write (via ACL or policies allowing `Principal: '*'`).
2. **Missing Encryption:** Find buckets missing default encryption (SSE-S3, SSE-KMS, or SSE-C).
3. **No Versioning:** For buckets tagged `DataClassification: Critical` or `DataClassification: Confidential`, check if versioning is _OFF_.
4. **Missing Logging:** Buckets with no server access logging enabled.
5. **No Lifecycle Policies:** Buckets >100GB with no lifecycle rules for cost optimization.
6. **Replication for DR:** Critical buckets (as tagged) without Cross-Region Replication.
7. **Insecure Transport:** Bucket policies that do NOT enforce SSL/TLS (`aws:SecureTransport` condition).
8. **Object Lock Disabled:** Buckets tagged `RequireCompliance: true` but with Object Lock disabled.
9. **Missing MFA Delete:** Versioned buckets holding financial records lacking MFA Delete protection.
10. **Inadequate Access Logging:** Buckets with >1M objects/month *logging to themselves* (should log to a separate bucket).
11. **No KMS Encryption (Sensitive/VPC):** Buckets in VPC, with sensitive data, using SSE-S3 instead of customer-managed SSE-KMS.
12. **Glacier Transition Issues:** Buckets with objects >90 days that are not transitioning to colder storage (Glacier, Deep Archive).

**Rules/exclusions for the audit:**

- **Only audit buckets created more than 60 days ago**.
- **Skip any bucket with the tag `ExcludeFromAudit: true` (case-insensitive)**.
- **Ignore any buckets whose names start with `temp-` or `test-`**.

**Output requirements:**

- Print results to the console, grouped by _severity_ (CRITICAL, HIGH, MEDIUM, LOW) and by issue/finding.
- Save a detailed `s3_security_audit.json` file containing one entry per finding, each with:  
  - `bucket_name`
  - `bucket_arn`
  - `issue_type` (short string code)
  - `severity` (CRITICAL/HIGH/MEDIUM/LOW)
  - `compliance_frameworks` (always include `SOC2`, `GDPR`)
  - `current_config` (describe the problem)
  - `required_config` (describe what a compliant config would be)
  - `remediation_steps` (clear action steps)
- The JSON must also have a `compliance_summary` object, reporting:
  - Number of compliant buckets and non-compliant buckets
  - Summary counts per framework (e.g., how many buckets pass/fail for SOC2)
- Also, generate a fully styled `s3_audit_report.html` with visual charts/graphs of the findings and compliance status.

**Testing/CI constraints:**

- Provide `pytest` tests using `moto` to mock 100+ realistic buckets with varied names/tags/security configs for each finding type.
- Don’t check excluded, new, or temp/test buckets per above.

**Environment & Libraries:**

- AWS Region: `us-east-1`
- Python 3.12, Boto3, Moto, pytest
- May also use Jinja2 or Plotly for HTML visualization if needed

**Format:**  
- Provide the main script as `analyse.py` (Python code block)  
- Provide tests as `test_analyse.py` (Python code block)  
- Provide the Jinja2/HTML template inline or in a separate block.

_No requirements, exclusions, or output details should be omitted or changed in the implementation – deliverables must match this prompt exactly._