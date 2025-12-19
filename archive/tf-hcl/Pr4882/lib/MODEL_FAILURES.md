# Infrastructure Code Corrections and Improvements

---

## Critical Issues Fixed

### 1) ALB Not Public / Wrong Subnet Placement
**Issue**: ALB was `internal = true` and placed in **private** subnets.  
**Fix**: Set `internal = false` and attach ALB to **NAT/public** subnets (`aws_subnet.nat[*].id`).  
**Impact**: External testing and internet access to the API endpoint were impossible.

---

### 2) ALB Security Group Too Restrictive for HTTP
**Issue**: ALB SG allowed HTTP/HTTPS only from VPC CIDR.  
**Fix**: Open HTTP `0.0.0.0/0` (and IPv6) for E2E testing while keeping HTTPS limited to VPC CIDR as needed.  
**Impact**: External clients could not reach the ALB.

---

### 3) Wrong Target Group Type
**Issue**: Target group defaulted to instance/EC2 semantics.  
**Fix**: Use `target_type = "lambda"` and attach the **ingest Lambda** via `aws_lb_target_group_attachment` plus `aws_lambda_permission` for ELB invocation.  
**Impact**: ALB could not invoke the Lambda; requests failed at routing.

---

### 4) DynamoDB Billing Mode vs Autoscaling Conflict
**Issue**: Table used `PAY_PER_REQUEST` while configuring Application Auto Scaling targets/policies (only valid for `PROVISIONED`).  
**Fix**: Switch to `PROVISIONED` with `read_capacity`/`write_capacity` and keep autoscaling targets/policies.  
**Impact**: Plan/apply errors or no-op autoscaling; capacity controls ineffective.

---

### 5) Kinesis SSE Without Usable KMS Policy
**Issue**: Stream set `encryption_type = "KMS"` but the KMS key had no explicit policy for services/roles using it.  
**Fix**: Add a full KMS key policy:
- Root account admin  
- **Kinesis service** with `kms:ViaService` condition  
- Optional **Lambda via Kinesis** condition  
- **Producer Lambda role** permission to `GenerateDataKey`/`DescribeKey`  
Also grant consumer Lambda `kms:{Encrypt,Decrypt,GenerateDataKey,DescribeKey}` in its IAM policy.  
**Impact**: `MalformedPolicyDocument` or `AccessDenied` during PutRecord/reads and Lambda decrypt.

---

### 6) Missing Caller Identity / Interpolation in KMS Policy
**Issue**: KMS policy interpolations needed the account id; it wasn’t available.  
**Fix**: Add `data "aws_caller_identity" "current"` and reference `${data.aws_caller_identity.current.account_id}`.  
**Impact**: Broken KMS principals; policy rejects on apply.

---

### 7) ALB Logs Bucket Naming / SSE
**Issue**: Bucket name used a suffix that could collide and lacked fixed naming in one version.  
**Fix**: Use deterministic bucket name (`${local.resource_prefix}-alb-logs`), block public access, and enable SSE `AES256`.  
**Impact**: Potential name conflicts; compliance gaps for log storage.

---

### 8) Flow Logs API Usage Mismatch
**Issue**: Used `log_destination_arn` vs `log_destination` inconsistently with provider expectations.  
**Fix**: Standardize to `log_destination = aws_cloudwatch_log_group.flow_logs[0].arn` with `iam_role_arn` (and consistent log group naming).  
**Impact**: Flow logs could fail to configure or attach.

---

### 9) Lambda Packaging / Source of Truth
**Issue**: Processor lambda referenced a zip file path (`lambda_function.zip`) that might not exist.  
**Fix**: Package with `data "archive_file"` for both **processor** and **stream_ingest** lambdas; use `source_code_hash` to force updates.  
**Impact**: Drift between code and deployed function; updates not applied.

---

### 10) End-to-End Ingest Path Missing
**Issue**: No public path to send events (only Kinesis → processor).  
**Fix**: Add **stream_ingest** Lambda (producer) behind the public ALB, attach permissions, and wire environment to stream name.  
**Impact**: No simple external injection point for E2E tests and demos.

---

### 11) No Producer Created for Kinesis (ingest Lambda missing)
**Issue**: The stack did not create any mechanism to put data into the Kinesis stream (no “ingest” Lambda or producer path).  
**Fix**: Add a public-facing **ingest Lambda** behind the ALB (ALB → TG `target_type = "lambda"` → `stream_ingest` Lambda) with IAM to `kinesis:PutRecord(s)` and KMS permissions when SSE-KMS is enabled.  
**Impact**: Without a producer, the stream stays idle; end-to-end tests and demos can’t inject events.  
**How to validate**:
- ALB DNS returns 200 for a test route (e.g., `/health`)  
- Hitting the ALB endpoint triggers the ingest Lambda and **Kinesis metrics** (`IncomingRecords`, `IncomingBytes`) increase  
- Processor Lambda consumes records and writes to DynamoDB (check CloudWatch Logs and table items)

---

## Infrastructure Improvements

### Security Enhancements
- **Least-privileged KMS policy** for Kinesis SSE with explicit principals and conditional `ViaService`.
- **Public ALB limited to HTTP** for testing; HTTPS path remains restricted.
- **S3 logs bucket** hardened: block public access + SSE.
- **Flow Logs**: consistent role and log destination wiring.

### Reliability Improvements
- **Correct TG type (Lambda)** ensures ALB → Lambda invocations are stable.
- **Deterministic Lambda packaging** with `archive_file` + `source_code_hash`.
- **DynamoDB autoscaling** now effective with `PROVISIONED` mode.
- **Added ingest Lambda** creates the missing path for event injection.

### Compliance Alignment
- **Encrypted at rest** across Kinesis (KMS), S3 logs (SSE), DynamoDB (SSE) maintained.
- **Auditability** via VPC Flow Logs and ALB access logs.

---

## Testing Validation

### Unit/Static Checks
- `terraform validate` and `plan` no longer flag KMS policy principals or DynamoDB autoscaling conflicts.
- Packaging hashes confirm Lambda updates propagate.

### Integration Tests
- **ALB public health check** returns 200 from Lambda target.
- **Kinesis SSE**: producer can `PutRecords`; processor reads/decrypts successfully.
- **DynamoDB**: writes/queries succeed; autoscaling policies attach.
- **Ingestion flow validated** from ALB → Ingest Lambda → Kinesis → Processor Lambda → DynamoDB.

---

## Lessons Learned

1. **ALB exposure requires right subnets**: Public ALBs must live in public/NAT subnets, not private ones.  
2. **Match TG type to backend**: Lambda targets need `target_type = "lambda"` plus explicit invoke permission.  
3. **DynamoDB modes matter**: Don’t mix `PAY_PER_REQUEST` with autoscaling; use `PROVISIONED` if you need scaling policies.  
4. **KMS policies must list actual principals** and often need `kms:ViaService` for managed services.  
5. **Package Lambdas reproducibly** with `archive_file` and `source_code_hash` to avoid drift.  
6. **Always include a producer path for Kinesis** — otherwise no data flows to test or monitor the pipeline.
