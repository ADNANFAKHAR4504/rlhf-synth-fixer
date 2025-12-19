Our microservices platform has a sprawl problem with 450 secrets and nearly 900 parameters. We need a definitive security audit. I need a powerful Python script (using Boto3) to conduct a forensic sweep of our credential vault and find all critical vulnerabilities.

The script must only target resources in production and staging accounts, ignore test- and demo- prefixes, and skip anything tagged ExcludeFromAudit: true.

## Rotation and Lifecycle Audit

**Unrotated Credentials (CRITICAL):** Find all Secrets Manager secrets that have not been rotated in over 90 days, or where the last rotation attempt failed.

**Unused Credentials (CLEANUP):** Flag secrets that have not been accessed (GetSecretValue via CloudTrail) in the last 90 days, indicating potential orphaned access keys.

**Rollback Risk:** Identify Secrets Manager secrets that only retain a single version, limiting our rollback capability after a key update.

**Cleanup Failure:** Find secrets that are past their scheduled deletion date but are still accessible.

**Lambda Rotation Issues:** Flag custom Lambda rotation functions with errors or timeouts > 30 seconds.

## Encryption and Access Control Audit

**Missing CMK Encryption (HIGH):** Identify all Secrets Manager secrets and SecureString parameters that are not encrypted using a customer-managed KMS key.

**Plaintext Sensitive Data (CRITICAL):** Scan Parameter Store and flag any String type parameters storing passwords, API keys, or tokens.

**Overly Permissive Access:** Audit Secrets Manager resource policies to find any that allow principal: \* or grant cross-account access without enforcing an ExternalId condition.

**Tier Waste:** Flag Parameter Store Standard tier parameters with values under 4KB that could use the free tier.

**DR Gaps:** Flag secrets tagged Critical: true that are not replicated to a secondary region for disaster recovery.

## Forensic Hunt for Hardcoded Secrets

This is the biggest risk. The script must scan Lambda environment variables and ECS task definitions (by looking up the JSON definitions) for hardcoded credentials that should be using Secrets Manager references instead. Report any matches in a separate finding list.

## Output Requirements

The final output must provide quantitative data for the CISO:

**secrets_audit.json:** A comprehensive JSON report listing all findings with specific severity (CRITICAL, HIGH, etc.) and including the last accessed date for each secret/parameter. The report must contain a dedicated section listing all hardcoded secrets found, including the resource ID and pattern matched.

**console_output:** I need the output to be print in the console with detialed resource in it preffered in a tabulate form , all the details for above analysis should be found in this table.

Please provide the final Python code in separate, labeled code blocks for analyse.py.
