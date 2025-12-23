# model_failure

## Summary of Failures Encountered

* KMS key creation failed due to invalid tag values on the CMK.
* CloudWatch Alarms failed with tag character restrictions.
* CloudWatch Logs group failed to bind to the CMK due to an over-restrictive KMS policy and dependency timing.
* Step Functions failed to write execution logs due to insufficient CloudWatch Logs delivery permissions.

## Root Causes

* Using a JSON string as a tag value on KMS and CloudWatch Alarms, which enforce stricter character sets.
* KMS key policy omitted `kms:CreateGrant` with `kms:GrantIsForAWSResource=true` and lacked a permissive encryption-context pattern for the log group ARN.
* Explicit dependency on a conditional resource caused linter and creation-order issues.
* Step Functions role did not include the CloudWatch Logs delivery API permissions.

## Remediation Actions

* Removed JSON-like tag values from KMS and CloudWatch Alarms. Limited tags on those services to safe keys such as Name, EnvironmentSuffix, and Mode, or omitted entirely where necessary.
* Strengthened the CMK policy for CloudWatch Logs:

  * Granted the regional Logs service principal encryption, data key generation, describe, re-encrypt, and create-grant actions.
  * Added `kms:GrantIsForAWSResource=true` and `kms:ViaService=logs.<region>.amazonaws.com`.
  * Added an encryption-context ARN pattern for the TapStack log group prefix.
* Removed direct dependency on the conditional CMK and used a conditional KMS key reference within the log group to avoid E3005 errors and ordering races.
* Expanded the Step Functions role with CloudWatch Logs delivery permissions, including create, update, delete, list log deliveries, put and describe resource policies, and describe log groups.

## Verification

* Template passes linter checks for the addressed issues.
* Stack creates the CMK when enabled, binds it to the log group without access errors, and creates metric filters and alarms.
* State machine starts with dry-run execution and successfully logs to CloudWatch.
* Subsequent updates can safely enable non-dry-run operations once account and role parameters are aligned.

## Lessons Learned

* Treat service-specific tag restrictions as design constraints and avoid complex tag values on KMS and CloudWatch Alarms.
* Prefer permissive-but-scoped KMS policies for AWS service integrations, using grants and encryption-context scoping.
* Avoid `DependsOn` pointing to conditional resources when an `Fn::If` already guards a property.
* Always include CloudWatch Logs delivery APIs in Step Functions execution roles when using execution logging.

## Next Steps

* Monitor alarms to validate error and throttle detection under load.
* Gradually tighten IAM permissions after observing runtime access patterns.
* Extend pre-checks to verify data services (S3 versioning, DynamoDB PITR) in the target account before apply.
* Consider adding StackSets support if organizational distribution is later required.
