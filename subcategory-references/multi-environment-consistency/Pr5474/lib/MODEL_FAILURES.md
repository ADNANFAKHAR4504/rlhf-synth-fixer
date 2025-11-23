# Model Response Failures - Analysis Report

## Critical Issues

### 1. **Step Functions Definition: Wrong Implementation Method**
**Location:** Lines 353-356 and 1766-1808  
**Prompt Requirement:** "Step Functions state machine (JSON from `templatefile` in locals)"  
**Actual Implementation:** Uses `jsonencode()` instead of `templatefile()`  
**Issue:**
- Lines 353-356 define an unused local `sfn_definition` that references a non-existent template file `sfn_definition.json.tpl`
- Lines 1766-1808 define `sfn_definition_json` using `jsonencode()` directly
- The state machine (line 1815) uses the `jsonencode` version, not `templatefile` as explicitly required

**Impact:** Direct violation of explicit prompt requirement. The code references a template file that doesn't exist and doesn't use `templatefile` function.

---

### 2. **Missing Required Provider Declaration**
**Location:** Lines 50-62 (required_providers block) vs Lines 1307-1310, 1403-1406 (usage)  
**Prompt Requirement:** "Compiles without external modules; uses only native `aws_*` and `archive_file` resources/data sources"  
**Issue:**
- Uses `random_password` resources (lines 1307, 1403) for Redis auth token and Aurora master password
- `random` provider is NOT declared in the `required_providers` block
- This will cause `terraform init` to fail

**Impact:** Code will not compile/initialize successfully - fails basic acceptance criteria.

---

### 3. **Per-Environment Capacity Maps Defined But Not Used**
**Location:** Lines 337-347 (definition) vs actual resource usage  
**Prompt Requirement:** "Provide **per-env capacity maps** (e.g., shard counts, memory, instance sizes) and then set resource arguments like `lookup(local.kinesis_shards_by_env, var.env)`"  
**Issue:**
- Defines `kinesis_shards_by_env` (lines 337-341) but never uses it
- Defines `lambda_memory_by_env` (lines 343-347) but never uses it
- Resources use variables directly (e.g., `var.kinesis_shard_count` at line 703, `var.lambda_memory_mb` at line 943)
- Prompt explicitly shows example: `lookup(local.kinesis_shards_by_env, var.env)`

**Impact:** Direct violation of explicit instruction about using capacity maps with lookup function.

---

### 4. **Lambda Provisioned Concurrency Configuration Error**
**Location:** Line 979  
**Issue:**
```hcl
qualifier = aws_lambda_function.validator.version
```
- This references the `$LATEST` version by default
- AWS Lambda provisioned concurrency **cannot** be set on `$LATEST`
- Requires either a published version number or an alias

**Impact:** Will fail on `terraform apply` when `lambda_provisioned_concurrency > 0`. Configuration is technically incorrect.

---

### 5. **Missing Neptune IAM Policy for Reconciliation Lambda**
**Location:** Lines 1136-1137 (Neptune usage) vs IAM policies (lines 752-895)  
**Prompt Requirement:** "IAM: least-privilege policies for each Lambda... Neptune access in VPC"  
**Issue:**
- Reconciliation Lambda references Neptune endpoint (line 1158) and writes to Neptune (lines 1136-1137)
- No IAM policy grants Neptune access to the Lambda execution role
- Missing permissions for `neptune-db:*` actions

**Impact:** Reconciliation Lambda will fail when attempting to write to Neptune due to insufficient permissions.

---

### 6. **Incomplete VPC Endpoints Implementation**
**Location:** Lines 508-517 (only DynamoDB VPC endpoint)  
**Prompt Requirement:** "VPC endpoints for DynamoDB/Kinesis/SNS/SQS if needed"  
**Issue:**
- Only DynamoDB VPC endpoint is created
- VPC Lambdas access Kinesis (line 924), SNS (line 1068), and SQS (line 1129)
- Without VPC endpoints, traffic routes through NAT Gateway (costly and slower)
- Best practice for production: create VPC endpoints for all accessed AWS services

**Impact:** Increased costs, reduced performance, and not following AWS best practices for VPC Lambda deployments.

---

### 7. **Non-Deterministic Random Resources Without Keepers**
**Location:** Lines 1307-1310, 1403-1406  
**Prompt Requirement:** "Use `for_each`/`count` deterministically; avoid non-stable `random_*` (or set `keepers` with env/project)"  
**Issue:**
```hcl
resource "random_password" "redis_auth" {
  length  = 32
  special = true
}
```
- No `keepers` attribute set with env/project identifiers
- Passwords will regenerate unpredictably, breaking existing connections

**Impact:** Non-deterministic behavior; passwords may change on re-apply, causing service disruption.

---

## Significant Issues

### 8. **Incorrect CloudWatch Alarm Metric**
**Location:** Lines 1845-1862  
**Issue:**
- Alarm named `ddb-stream-age` with description "DynamoDB stream processing errors"
- Uses metric `UserErrors` (line 1849) instead of stream-specific metrics
- Should use DynamoDB Streams metrics like `IteratorAge` or Lambda ESM metrics

**Impact:** Alarm won't monitor what it claims to monitor (stream lag vs user errors).

---

### 9. **Missing Required CloudWatch Alarms**
**Location:** Lines 1840-1992 (CloudWatch Alarms section)  
**Prompt Requirement:** "essential CloudWatch alarms (e.g., IteratorAge, Lambda Errors/Throttles, Redis CPU/FreeableMemory, RDS/Neptune connectivity, SFN FailedExecutions)"  
**Missing Alarms:**
- Redis `FreeableMemory` (only CPU alarm exists at lines 1913-1931)
- Cache update latency (no Redis latency metrics)
- Neptune connectivity alarm
- Lambda throttles (Lambda errors exist, but not throttles specifically)

**Impact:** Incomplete observability; won't detect memory pressure in Redis or Neptune connectivity issues.

---

### 10. **Unused Local Variable**
**Location:** Lines 353-356  
**Issue:**
```hcl
sfn_definition = templatefile("${path.module}/sfn_definition.json.tpl", {
  lambda_arn = aws_lambda_function.consistency_checker.arn
})
```
- Defined but never used (the state machine uses `local.sfn_definition_json` instead)
- References non-existent template file
- Dead code that creates confusion

**Impact:** Code quality issue; references missing file; creates technical debt.

---

### 11. **Missing Security Group IDs in Outputs**
**Location:** Lines 2047-2139 (Outputs section)  
**Prompt Requirement:** "Expose ARNs/IDs/endpoints for: ... VPC/Subnets/Security Groups"  
**Issue:**
- Only `lambda_security_group_id` is output (line 2136-2139)
- Missing outputs for: Redis SG, Aurora SG, Neptune SG
- VPC and subnets are output, but not all security groups

**Impact:** Users can't reference security groups for additional resources without looking up in state.

---

### 12. **Missing IAM Role ARN Outputs**
**Location:** Lines 2047-2139 (Outputs section)  
**Prompt Requirement:** "Expose... key IAM role ARNs"  
**Issue:**
- Only `lambda_role_arn` is output (lines 2126-2129)
- Missing: SFN execution role, EventBridge role, RDS monitoring role

**Impact:** Incomplete outputs; doesn't match "key IAM role ARNs" (plural) requirement.

---

### 13. **Step Functions Definition Should Use SNS Policy**
**Location:** Lines 1721-1763 (SFN IAM policy)  
**Issue:**
- SFN definition publishes directly to SNS (lines 1794-1801)
- IAM policy grants Lambda invoke permission (lines 1728-1736)
- Missing SNS publish permission in SFN execution role
- Uses SNS service integration `arn:aws:states:::sns:publish` but no IAM policy for it

**Impact:** Step Functions will fail when attempting to publish to SNS topic due to missing permissions.

---

## Summary Statistics

**Critical Issues:** 7  
**Significant Issues:** 6  
**Total Issues:** 13

**Categories:**
- Explicit Prompt Violations: 3 (#1, #3, #9)
- Terraform Compilation/Runtime Errors: 4 (#2, #4, #13, partially #5)
- Best Practices Violations: 3 (#6, #7, #8)
- Incomplete/Missing Features: 3 (#9, #11, #12)

**Overall Assessment:** The model response is comprehensive but contains several critical issues that would prevent successful deployment and violates explicit prompt requirements. Most notably:
1. Wrong implementation method for Step Functions (templatefile vs jsonencode)
2. Missing provider declaration causing init failure
3. Unused capacity maps despite explicit instruction to use them
4. Multiple IAM permission gaps