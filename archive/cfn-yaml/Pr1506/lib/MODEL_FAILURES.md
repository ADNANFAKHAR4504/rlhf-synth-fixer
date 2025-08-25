# Model Failures Documentation

## Common Model Failures for TapStack CloudFormation

This document captures recurring failure modes and edge cases observed when AI models attempt to produce the TapStack CloudFormation template.

---

### 1. SSM & Secret Handling Failures

**Failure Pattern**: Incorrect use of SSM Parameter types and secret flow.

**Examples**:

* Creating `AWS::SSM::Parameter` with `Type: SecureString` and `KeyId` (unsupported in CFN resource schema).
* Using tag **maps** instead of a **list of `{Key,Value}`** for SSM Parameter tags.
* Hard-coding secret values inside the template or echoing them via Outputs.

**Expected Behavior**: Accept secrets via **NoEcho** template parameters; write to SSM as **`Type: String`** (no `KeyId`), and decrypt at read-time in workloads. Use a conditional name (`!If` + `SsmParamName`) to avoid collisions.

---

### 2. Template Schema & Validation Failures

**Failure Pattern**: Nonexistent properties or wrong resource types causing lint/validation errors.

**Examples**:

* Using `NotificationConfiguration.CloudWatchConfigurations` under `AWS::S3::Bucket` (not a valid property).
* Using `AWS::SecurityHub::StandardsSubscription` instead of the supported `AWS::SecurityHub::Standard`.
* Omitting required properties for resources (e.g., CloudTrail → CW Logs linkage).

**Expected Behavior**: Templates must pass **cfn-lint** and CloudFormation validation; only valid properties/types; region/partition-aware ARNs where applicable.

---

### 3. IAM & Naming Failures

**Failure Pattern**: Violating “no named IAM” and over-broad permissions.

**Examples**:

* Setting `RoleName` (named IAM) on roles or `GroupName` on Security Groups.
* Using `Resource: "*"`, e.g., for CloudWatch Logs delivery, rather than scoping to the log group ARN.

**Expected Behavior**: **No named IAM** (no `RoleName`/`UserName`). Policies scoped to the minimum necessary ARNs (e.g., specific log group).

---

### 4. Security Group & Traffic Control Failures

**Failure Pattern**: Allowing unnecessary inbound/outbound traffic.

**Examples**:

* Opening **TCP/80** and **TCP/443** to the world when only HTTPS is required.
* Unrestricted egress beyond what’s necessary.

**Expected Behavior**: Only **TCP/443** inbound from `AllowedIngressCidr`. Egress limited to necessary destinations/ports (e.g., 443). Validate via AWS Config rules for default SG closed.

---

### 5. CloudTrail Integration Failures

**Failure Pattern**: Incomplete or incorrect CloudTrail + CloudWatch Logs configuration and S3 protections.

**Examples**:

* Missing `CloudWatchLogsLogGroupArn` and `CloudWatchLogsRoleArn` on `AWS::CloudTrail::Trail`.
* Using custom S3 prefixes without aligning bucket policies (deny delete path mismatches).
* Not enabling **Log File Validation** or **Multi-Region**.

**Expected Behavior**: Provide a dedicated **CloudTrail log group** and **role**; set both ARNs on the Trail. Enable **validation** and **multi-region**. Use a canonical CloudTrail bucket policy: ACL check, `bucket-owner-full-control`, **deny delete** on `AWSLogs/${AccountId}/*`, and enforce TLS.

---

### 6. AWS Config Failures

**Failure Pattern**: Wrong managed policy ARN and non-conditional creation.

**Examples**:

* Using `arn:aws:iam::aws:policy/service-role/ConfigRole` (incorrect ARN).
* Naming the AWS Config role; omitting core managed rules.

**Expected Behavior**: Use `arn:aws:iam::aws:policy/service-role/AWSConfigRole`, **no RoleName**, and create conditionally (`EnableAWSConfig`). Include relevant managed rules (CloudTrail enabled, S3 SSE enabled, IAM no admin, default SG closed).

---

### 7. Security Hub Enablement Failures

**Failure Pattern**: Unsupported resource or missing conditional toggle.

**Examples**:

* Using `StandardsSubscription` instead of `AWS::SecurityHub::Standard`.
* Enabling unconditionally (might fail if already enabled).

**Expected Behavior**: Use `AWS::SecurityHub::Hub` + `AWS::SecurityHub::Standard` with a partition/region-aware `StandardsArn`. Gate with `EnableSecurityHub`/`CreateSecurityHub`.

---

### 8. S3 Bucket Policy & Encryption Failures

**Failure Pattern**: Incomplete enforcement and invalid properties.

**Examples**:

* Missing **TLS enforcement** (`aws:SecureTransport` deny).
* Incorrect bucket policy `Resource` (using bucket names instead of ARNs).
* Omitting **versioning** or **SSE-KMS** for app buckets.
* Adding invalid S3 properties (e.g., CloudWatch configs under `NotificationConfiguration`).

**Expected Behavior**: All buckets block public access, enable **versioning** and **encryption**; app bucket uses **KMS**. Policies enforce TLS and correct ARNs.

---

### 9. Outputs & Tooling Contract Failures

**Failure Pattern**: Not exposing the outputs required by integration tooling.

**Examples**:

* Only outputting `VpcId` while the pipeline expects many.
* Mismatched output keys vs. `flat-outputs.json` contract.

**Expected Behavior**: Provide all required Outputs:
`VpcId`, `PublicSubnets` (CSV), `PrivateSubnets` (CSV), `AppBucketName`, `CloudTrailBucketName`, `KmsKeyArn`, `CloudTrailArn`, `SecurityHubStatus`, `SsmParamDbPassword`.

---

### 10. Region/Naming & Parameters Failures

**Failure Pattern**: Inconsistent environment field and missing toggles.

**Examples**:

* Using `Environment` in names where the stack and tests expect `EnvironmentSuffix`.
* Missing `EnableSecurityHub`, `EnableAWSConfig`, `SsmParamName`, and `DbPassword (NoEcho)` parameters.
* Defaulting to multiple NAT Gateways without a cost toggle.

**Expected Behavior**: Consistent `<type>-<project>-<environment>` naming using **`EnvironmentSuffix`**. Include toggles and helper conditions (`HasCustomSsmName`). Prefer a single NAT by default, or make count configurable.

---

## Testing Criteria

1. **Schema & Lint**: `cfn-lint` passes; CloudFormation **validate-template** passes.
2. **Least Privilege**: No `RoleName`/`UserName`; policies scoped to specific ARNs; no wildcard excess.
3. **CloudTrail Streaming**: Trail returns `IsLogging=true`; log group exists; metric filter for `UnauthorizedOperation`/`AccessDenied*` present; alarm thresholds correct.
4. **S3 Compliance**: App + CloudTrail buckets have **versioning**, **encryption**, and **TLS deny**; CloudTrail bucket has canonical **delete-deny** protections.
5. **SSM Flow**: Secret provided via **NoEcho** param; created as **String** parameter; Lambda reads with `WithDecryption` as needed.
6. **AWS Config & Security Hub**: Created only when toggled; correct resource types/managed policies; managed rules enabled; FSBP standard enabled when requested.
7. **Outputs Contract**: All expected Outputs are present and non-empty in `cfn-outputs/flat-outputs.json`.
8. **Naming**: Resource names/tags follow `<resource-type>-<project-name>-<environment>`; consistent use of `EnvironmentSuffix`.

---

## Success Metrics

A successful model response should:

* Produce a **valid** CloudFormation YAML that passes **cfn-lint** and deploys.
* Implement **all** security requirements with **least privilege** and no named IAM.
* Stream CloudTrail to CloudWatch Logs, with metric filters and alarms in place.
* Use **SSM Parameter (String)** for secrets, sourced from **NoEcho** parameters.
* Provide the **full Outputs** set required by integration tests.
* Keep naming and parameters consistent with the environment contract.
* Be production-ready, maintainable, and cost-aware (e.g., NAT choices).
