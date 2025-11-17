**model_failure**

# TapStack – Known Failure Modes & Remedies

## 1 IAM global name collisions

* **Symptom:** “already exists” errors for roles/policies when deploying second region.
* **Cause:** IAM is global; identical `RoleName`/`ManagedPolicyName` or inline `PolicyName`.
* **Fix:** Append `-${AWS::Region}` or remove explicit names and let CFN autoname.

## 2 FIFO EventSourceMapping validation

* **Symptom:** “Batching window is not supported for FIFO queues.”
* **Cause:** `MaximumBatchingWindowInSeconds` used with an SQS **FIFO** source.
* **Fix:** Remove batching window; keep small `BatchSize` for ordering.

## 3 SSM PutParameter with empty value

* **Symptom:** “Error occurred during operation 'PutParameter'.”
* **Cause:** Attempting to write empty `TrustedRoleArn`.
* **Fix:** Gate the parameter with a condition and only create it when the value is non-empty.

## 4 SNS Topic attributes & Dashboard schema

* **Symptom:** cfn-lint errors like invalid `Arn` on `SNS::Topic` or `DashboardName` not allowed.
* **Cause:** Using `!GetAtt Topic.Arn` instead of `TopicArn`, or strict region schema for Dashboard.
* **Fix:** Use `TopicArn` and remove `DashboardName` (let CFN name it).

## 5 Queue policy principals / cross-account access

* **Symptom:** Access denied for producers/consumers in trusted account.
* **Cause:** Missing or incorrect principal in `QueuePolicy`.
* **Fix:** Ensure the correct **role ARN** is granted least-privilege actions (Send/Receive/GetAttributes/Delete/ChangeVisibility) and that the principal is assumed by the caller.

## 6 Linting & ordering pitfalls

* **Symptom:** cfn-lint parser complaints (unexpected key/colon) or deployment race issues.
* **Cause:** Mixed indentation, unguarded optional resources, or invalid patterns.
* **Fix:** Keep 2-space indentation, use Conditions for optional pieces, regex-validate `EnvironmentSuffix`, and deploy **DR first** then **Primary**.

## 7 Non-prod purge in production by mistake

* **Symptom:** Queues suddenly purged.
* **Cause:** Purge scheduler enabled in prod.
* **Fix:** Ensure `IsProduction=true` in prod, or disable `EnableAutoPurgeNonProd`.
