# Model failure modes and their root-cause analysis

This document catalogs the common failures that were encountered while iterating on this stack and concrete, human-actionable fixes for each. Follow these to troubleshoot or avoid the same issues.

## 1. CloudFront WAF invalid identifier

* **Symptom**: CloudFront creation errors complaining about the WebACL identifier or invalid WebACL.
* **Root cause**: CloudFront requires the **WAFv2 WebACL ARN**; using `!Ref` on a WAF resource returns a token in the wrong format (or a string with pipe characters), which CloudFront rejects.
* **Fix**: Use `!GetAtt WAFWebACL.Arn` for `WebACLId`. Ensure WAF is created in `us-east-1` with `Scope: CLOUDFRONT` and that CloudFront creation depends on the WAF resource.

## 2. CloudFront origin / S3 validation errors

* **Symptom**: CloudFront failure: origin domain name is not a valid S3 bucket or `ForwardedValues` missing.
* **Root cause**:

  * CloudFront origin DomainName used an incorrect token or bucket name which wasn’t yet resolvable, or S3 bucket policy/OAI was missing.
  * `DefaultCacheBehavior` required `ForwardedValues` for certain CloudFront API versions.
* **Fix**:

  * Use `!GetAtt S3Bucket.DomainName` for the CloudFront origin DomainName.
  * Create CloudFront OAI and S3 bucket policy allowing that canonical user to `s3:GetObject`.
  * Ensure `DefaultCacheBehavior` includes `ForwardedValues` (at minimum `QueryString` and `Cookies` block).

## 3. S3 notification destination validation failures

* **Symptom**: S3 creation fails with "Unable to validate destination configuration" when adding SNS or Lambda as a destination.
* **Root cause**: S3 attempted to validate notification destination before the SNS topic/policy or Lambda permissions existed or were fully created.
* **Fix**:

  * Create the SNS topic and its topic policy first.
  * Add the S3 `NotificationConfiguration` only after the topic/policy exists (use `DependsOn` on the Bucket resource referencing the TopicPolicy).
  * Add Lambda permission resources before connecting the SNS subscription and set correct `SourceArn` and `SourceAccount`.

## 4. SNS → Lambda: Raw message delivery error

* **Symptom**: Create failed with "Delivery protocol [lambda] does not support raw message delivery."
* **Root cause**: `RawMessageDelivery: true` was used on a subscription for protocol `lambda`, which is unsupported.
* **Fix**: Remove `RawMessageDelivery` for `lambda` subscriptions. Keep `Lambda::Permission` to authorize SNS to invoke the Lambda.

## 5. AWS Config: Delivery channel / recorder ordering issues

* **Symptom**: `NoAvailableDeliveryChannelException` or `MaxNumberOfConfigurationRecordersExceededException`.
* **Root cause**:

  * CloudFormation attempted to start the ConfigurationRecorder before a DeliveryChannel was present, or the account already had a recorder (count limit reached).
* **Fix**:

  * Create the DeliveryChannel resource before the ConfigurationRecorder (use `DependsOn`).
  * Make AWS Config creation optional: add a `CreateAWSConfig` parameter defaulted to false so the stack won’t attempt to create a duplicate recorder in accounts that already have one.

## 6. IAM managed policy attachment / policy not attachable

* **Symptom**: Role creation or managed policy attach returns "policy does not exist or is not attachable" for service-role policies.
* **Root cause**: Trying to use an AWS-managed *service role* policy ARN that is not attachable or misspecifying the ARN.
* **Fix**: Use the correct `arn:aws:iam::aws:policy/` ARN for attachable managed policies, and avoid assuming service-role-only policies are attachable. For custom inline permissions, create inline policy in the Role or create a correct custom managed policy.

## 7. cfn-lint errors (examples) and fixes

* `E3002 Additional properties are not allowed ('Tags' was unexpected)` — caused by placing `Tags` on a resource type that doesn’t accept them (some IAM objects / ManagedPolicy depending on schema). Fix: remove `Tags` from that resource.
* `W3005 'X' dependency already enforced by a 'Ref'` — redundant `DependsOn`. Fix: remove redundant `DependsOn`.
* `E6001 logical id does not match regex` — Output logical ID names must be alphanumeric with no underscores sometimes, or `cfn-lint` rule expects a pattern. Fix: change Output logical IDs to match the linter pattern (e.g., `RDSEndpoint`).
* `W2001 Parameter Foo not used` — parameter declared but never referenced. Fix: either use the parameter or remove it.
* `W1028 Fn::If unreachable` — ensure conditions are used consistently, and avoid dead branches; restructure condition usage or default to a sensible value.
* Always re-run `cfn-lint` after each change and address every **error** before attempting deployment.

## 8. KeyPair and AMI issues

* **Symptom**: Stack rollbacks due to `KeyPairName` not existing or invalid AMI.
* **Root cause**: The default KeyPair referenced did not exist in the account or KeyName was required but not provided.
* **Fix**: Make `KeyPairName` optional and only add `KeyName` property on EC2 when a KeyPair is provided (use `Conditions`).
