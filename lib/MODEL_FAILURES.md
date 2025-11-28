# Model Failures

## Issue 1 — Invalid PostgreSQL Version

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 not available in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.

## Issue 2 — Excessive Logging Load

**Error:** `log_statement='all'` created excessive logging load.
**Root Cause:** Full-statement logging incompatible with CloudWatch export;
impacts performance.
**Fix:** Changed `log_statement` to `"ddl"` to log only schema changes.

## Issue 3 — Invalid IOPS Configuration

**Error:** Explicit IOPS and throughput specified for <400GB gp3 volume.
**Root Cause:** RDS gp3 defaults (3000 IOPS, 125 MB/s) apply automatically;
explicit settings invalid for small volumes.
**Fix:** Removed explicit `iops` and `storage_throughput` parameters.

## Issue 4 — Invalid effective_cache_size Value

**Error:** Exceeded PostgreSQL integer range.
**Root Cause:** Formula `{DBInstanceClassMemory*3/4}` produced an overflow.
**Fix:** Set static value `393216` (3GB in 8KB pages), suitable for
t3.micro/small instances.

## Issue 5 — Missing KMS Key Policy Permissions

**Error:**

```text
AccessDeniedException: ... User: arn:aws:sts::... is not authorized to
perform: kms:GenerateDataKey ...
```

(or similar errors from CloudWatch Logs, SNS, SQS)

**Root Cause:** The default KMS key policy only trusted the account root.
Service principals (CloudWatch Logs, SNS, SQS) require explicit permissions in
the key policy to encrypt/decrypt data using the CMK.
**Fix:** Added a comprehensive `aws_iam_policy_document` for the KMS key,
explicitly granting access to:

* `logs.${var.aws_region}.amazonaws.com` (with encryption context condition)
* `sns.amazonaws.com`
* `sqs.amazonaws.com`

## Issue 6 — S3 Lifecycle Configuration Warning

**Error:**

```text
Warning: Invalid Attribute Combination ... No attribute specified when one
(and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** The `aws_s3_bucket_lifecycle_configuration` resource requires a
`filter` block (even if empty) or a `prefix` to define the scope of the rule.
Missing this attribute triggers a validation warning in newer AWS provider
versions.
**Fix:** Added an empty `filter {}` block to the lifecycle rule to explicitly
apply it to all objects in the bucket.

## Issue 7 — Step Functions Logging Permissions

**Error:**

```text
AccessDeniedException: The state machine IAM Role is not authorized to
access the Log Destination
```

**Root Cause:** The IAM role assigned to the Step Function lacked the specific
CloudWatch Logs permissions required to configure and write execution logs. Step
Functions requires `logs:CreateLogDelivery`, `logs:PutResourcePolicy`, and
related actions to set up logging to a Log Group.
**Fix:** Updated the `aws_iam_role_policy.step_functions` to include the
necessary `logs:*` permissions with `Resource: "*"`.

## Issue 8 — S3 Lifecycle Transition Constraint

**Error:**

```text
InvalidArgument: 'Days' in Transition action must be greater than or equal
to 30 for storageClass 'STANDARD_IA'
```

**Root Cause:** The `dev` environment configuration set `lifecycle_days` to 7.
The `STANDARD_IA` storage class enforces a minimum object age of 30 days before
transition, causing the API call to fail.
**Fix:** Changed the target `storage_class` from `STANDARD_IA` to
`INTELLIGENT_TIERING`, which supports transition for objects of any age (though
typically best for >30 days, it does not throw this validation error).

## Issue 9 — Invalid RDS Master Password

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid
password. Only printable ASCII characters besides '/', '@', '"', ' ' may be
used.
```

**Root Cause:** The `random_password` resource with default `special = true` can
generate characters like `/`, `@`, `"`, or space, which are explicitly forbidden
by Amazon RDS for the master password.
**Fix:** Added `override_special` to the `random_password` resource to
explicitly define a safe set of special characters: `!#$%&*()-_=+[]{}<>:?`.
