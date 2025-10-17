# Infrastructure Code Corrections and Improvements

## Summary
The initial multi-region stack (Aurora Global + ALB + EC2 + Route53 + Lambda + EventBridge) had several inconsistencies that affected idempotency, security, and failover reliability.  
The corrected version improves Lambda packaging, IAM policies, Route53 event filtering, EC2 bootstrap, password generation, naming conventions, tagging, and dependency consistency.

---

## Critical Issues Fixed

### 1. Lambda Packaging (Non-idempotent)
**Issue (generated)**: Used `null_resource` + `local-exec` to create the ZIP inline.  
**Fixed (correct)**: Replaced with `data "archive_file"` and `source_code_hash`.  
**Impact**: Ensures deterministic builds and reproducible deployments (`plan/apply` idempotent).

 **Fix:** Always package Lambda with `archive_file` and include `source_code_hash`.

---

### 2. EventBridge Route53 Filter Mismatch
**Issue (generated)**: Used incorrect event details (e.g., `"ALARM"` state).  
**Fixed (correct)**: Uses `detail-type = ["Route 53 Health Check State Change"]` and `newState = ["UNHEALTHY"]`.  
**Impact**: Prevented failover Lambda from triggering properly.

 **Fix:** Match the actual Route53 health check states (`HEALTHY`, `UNHEALTHY`, `INSUFFICIENT_DATA`).

---

### 3. Invalid Random Password Characters
**Issue (generated)**: Random password used unsupported characters for Aurora/MySQL.  
**Fixed (correct)**: Added `override_special = "!#$&*()-_=+"`.  
**Impact**: Prevented failures on database password validation.

 **Fix:** Define `override_special` explicitly in `random_password`.

---

### 4. EC2 Lacked App Bootstrap and Observability
**Issue (generated)**: Used static `user_data` with Apache “Hello World”.  
**Fixed (correct)**: Uses `templatefile` with:
- Secrets Manager integration  
- Aurora writer/reader endpoint injection  
- CloudWatch Logs configuration  

**Impact**: Enables real application deployment and full visibility across regions.

 **Fix:** Use templated `user_data` with injected environment variables and log configuration.

---

### 5. IAM Policy Scoping for EC2 and Lambda
**Issue (generated)**: EC2 had only SSM Core policy; Lambda overly permissive.  
**Fixed (correct)**:
- EC2: Added read-only permissions for SecretsManager/KMS + CloudWatch Agent.  
- Lambda: Minimal permissions for RDS failover, Route53 DNS changes, KMS decrypt, and logging.  

**Impact**: Enforces least privilege and compliance alignment.

 **Fix:** Give each component only the permissions required for its function.

---

### 6. Naming and Tagging Standardization
**Issue (generated)**: Used generic resource prefix (`prod-trading`).  
**Fixed (correct)**: Defined `resource_prefix = "${var.environment}-iac56232"` with standard tags  
(`iac-rlhf-amazon = true`, `team = 2`).  
**Impact**: Enables governance, tracking, and consistent multi-environment operations.

 **Fix:** Define `locals` with standard prefix and organizational tags.

---

### 7. RDS/Aurora Configuration Alignment
**Issue (generated)**: Conditional deletion protection and inconsistent snapshot identifiers.  
**Fixed (correct)**: Explicitly disabled deletion protection for test environments, with predictable snapshot names (`-v4`, `-final3`).  
**Impact**: Predictable apply/destroy cycle and safer CI/CD automation.

 **Fix:** Use consistent naming and disable protection outside production.

---

### 8. Simplified DNS Failover
**Issue (generated)**: Complex weighted routing and redundant health checks.  
**Fixed (correct)**: Clean `PRIMARY`/`SECONDARY` failover routing with one health check on the primary.  
**Impact**: Clear failover behavior and reduced Route53 complexity.

 **Fix:** Use alias failover routing with health check only on the primary ALB.

---

### 9. Cross-Region Secret Replication
**Issue (generated)**: Secondary EC2 instances used the primary secret ARN.  
**Fixed (correct)**: Dynamically constructs ARN for the secondary-region replica in user data.  
**Impact**: Faster access and regionally consistent secret decryption.

 **Fix:** Read secrets from the same region as the workload.

---

### 10. EC2 Logging and Monitoring
**Issue (generated)**: No CloudWatch Logs integration.  
**Fixed (correct)**: Added `aws_cloudwatch_log_group` for both regions + attached `CloudWatchAgentServerPolicy`.  
**Impact**: Centralized observability and simplified troubleshooting.

 **Fix:** Always configure CloudWatch Logs for EC2 instances.

---

## Infrastructure Improvements

### Security Enhancements
- Scoped IAM permissions per resource.  
- Controlled password character sets.  
- Standardized tagging for auditing.  

### Reliability
- Deterministic Lambda builds (`archive_file`).  
- Correct Route53 failover health checks.  
- EC2 properly bootstrapped with secrets and monitoring.

### Idempotency and Stability
- No more drift due to `local-exec`.  
- Predictable resource identifiers.  
- Regionally replicated secrets.

---

## Testing Validation

**Recommended Tests:**
1. **Plan Drift** — Re-running `terraform plan` must yield no changes.  
2. **Failover Simulation** — Force `UNHEALTHY` on Route53 and verify:
   - Lambda executes successfully  
   - Aurora writer switches to secondary region  
   - `app.` resolves to secondary ALB  
3. **Secrets & KMS** — Validate `GetSecretValue` and decryption in both regions.  
4. **Observability** — Verify EC2 log streams and CloudWatch log groups exist.  

---

## Lessons Learned
1. Avoid `null_resource` builds — use `archive_file`.  
2. Route53 events use `"UNHEALTHY"` not `"ALARM"`.  
3. Enforce consistent naming and tagging.  
4. Use templated `user_data` for app deployment.  
5. Scope IAM policies tightly to limit attack surface.


## Recommendations for Future Development
1. Apply deletion protection and final snapshots only for production.  
2. Implement HTTPS (ACM) and redirect 80 → 443.  
3. Add AWS WAFv2 in front of ALBs.  
4. Pin Aurora versions per region via variable validation.  
5. Document runbooks for failover and rollback.  
6. Define clear RTO/RPO SLOs and link them to CloudWatch alarms.  
