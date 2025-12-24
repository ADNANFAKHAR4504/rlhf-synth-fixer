# model_failure

## Common failure modes and precise fixes

### 1 KMS key policy — “invalid principals”

**Symptom:** `Policy contains a statement with one or more invalid principals`
**Cause:** Passing a `List<String>` Ref (comma-joined string) to `Principal.AWS`.
**Fix:** Accept **CSV string** (`KmsKeyAdminsCsv`), use a condition to include the admins statement only when non-empty, and `!Split` the CSV into an array for `Principal.AWS`.

### 2 X-Ray sampling rule — version validation

**Symptom:** `Value '0' at 'samplingRule.version' ... must be >= 1`
**Cause:** `Version` omitted.
**Fix:** Set `Version: 1`; prefer `Priority: 100`, with modest `ReservoirSize` and `FixedRate` for scale.

### 3 Contributor Insights — schema and required keys

**Symptom:** `InvalidSchema at Schema` or `MissingKey at LogFormat` or `MissingKey at Filters`
**Cause:** Using the wrong schema name, omitting `LogFormat`, or missing `Filters`.
**Fix:** Use `"Schema":{"Name":"CloudWatchLogRule","Version":1}`, set `"LogFormat":"JSON"`, and include `"Filters":[]` (empty when not filtering).

### 4 Canary role cannot be assumed

**Symptom:** `The role defined for the function cannot be assumed by Lambda`
**Cause:** Trust policy allows only `synthetics.amazonaws.com`.
**Fix:** Add **both** `synthetics.amazonaws.com` and `lambda.amazonaws.com` to the role’s `AssumeRolePolicyDocument`.

### 5 `List<String>` defaults and YAML parsing

**Symptom:** `is not of type 'string'` for list defaults or `mapping values are not allowed` in descriptions.
**Cause:** Using native list syntax for defaults or unquoted colons.
**Fix:** Provide **comma-delimited strings** for list defaults; quote or fold any description with colons.

### 6 Embedded `${Param}` outside intrinsics

**Symptom:** `E1029 Found an embedded parameter ... outside Fn::Sub`
**Cause:** `${EnvironmentSuffix}` in plain strings (e.g., Description).
**Fix:** Remove the interpolation from descriptions or wrap in proper intrinsics where supported; avoid interpolation in fields that do not accept it.

### 7 Dashboard or alarm references drift

**Symptom:** Widgets or composite alarms not resolving.
**Cause:** Name mismatch or missing suffix.
**Fix:** Ensure every resource and metric name includes `-${EnvironmentSuffix}`; keep namespace `Payments/${EnvironmentSuffix}` consistent.

## Guardrails to keep the stack stable

* Keep **names deterministic** with the suffix everywhere.
* Prefer **Conditions** to toggle optional cross-account/OAM and remediation features.
* Scope IAM to **specific ARNs** where possible; avoid wildcard KMS usage beyond service data-key operations.
* Validate canary endpoints are **HTTPS** and reachable from the account’s networking context.
* Keep **retention** sensible (e.g., 30 days) and enable **key rotation** on the CMK.

## Post-failure recovery checklist

* Fix the specific policy or schema, then **Update Stack** (no need to delete entire stack).
* If a resource is in a terminal failed state and blocks updates, use **Continue rollback** or **Replace** that resource by changing a name property (while preserving suffix convention).
* Re-run `cfn-lint` locally to catch regressions before redeploying.
