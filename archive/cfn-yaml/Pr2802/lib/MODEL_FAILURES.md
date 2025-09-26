What went wrong (typical failure modes) and how to fix them
1) Missing required parameter at deploy

Symptom: ChangeSet error like “Parameters: [AllowedSshCidr] must have values”.

Cause: Parameter had no default and wasn’t provided.

Fix: Provide a secure default (x.x.x.x/32) and keep regex/constraint accurate. Document that users should override with their real IP.

2) Invalid S3 bucket names / DNS regex warnings

Symptom: Lint warnings about names not matching ^[a-z0-9][a-z0-9.-]*[a-z0-9]$.

Cause: Composed names using variables that may include uppercase or disallowed chars.

Fix: Avoid explicit BucketName unless you downcase/sanitize. Let CFN auto-name buckets to guarantee DNS compliance.

3) Unsupported S3 properties or blocks

Symptom: Schema errors such as “Additional properties are not allowed” on S3 notifications or lifecycle keys.

Cause: Using non-existent props (e.g., “CloudWatchConfigurations”) or wrong lifecycle fields (TransitionInDays outside Transitions).

Fix: Remove invalid notification blocks; use lifecycle Transitions list with { TransitionInDays, StorageClass }.

4) CloudTrail missing required property

Symptom: Error “IsLogging is a required property”.

Cause: Omitted IsLogging.

Fix: Set IsLogging: true and ensure S3 logs bucket policy allows CloudTrail GetBucketAcl and PutObject with bucket-owner-full-control.

5) Unused Conditions

Symptom: Lint warning for unused condition (e.g., RequireAutoDeleteTag).

Cause: Condition declared but never referenced.

Fix: Remove the condition or wire it into the Lambda logic via environment variables and !If—or simplify by passing a parameter directly to the function (preferred).

6) Over-permissive or broken VPC endpoint policies

Symptom: Security review flags wide-open S3 endpoint policy.

Cause: Resource: * or broad actions without scoping to specific buckets.

Fix: Scope to both buckets’ ARNs explicitly (list bucket + object path ARNs).

7) KMS key policy too tight or too loose

Symptom: S3/CloudTrail fails to write/reads fail, or security findings on overly broad permissions.

Cause: Missing service principals in key policy or overly permissive actions.

Fix: Include cloudtrail.amazonaws.com and s3.amazonaws.com with minimal kms:Decrypt and kms:GenerateDataKey*. Keep root account admin statement for recovery.

8) Region-specific resource/type mismatches

Symptom: “Resource type does not exist in region” errors.

Cause: Using region-unsupported resource types.

Fix: Verify all resource types are available in us-east-1. Avoid deprecated types or region-limited features.

9) NAT EIP configuration mistakes

Symptom: EIP/NAT validation or association errors.

Cause: Missing Domain: vpc on EIP or not referencing AllocationId properly.

Fix: Specify Domain: vpc on EIPs and use !GetAtt EIP.AllocationId in NAT gateways.

10) MFA enforcement policy disruptions

Symptom: Console/API actions blocked more broadly than intended.

Cause: Deny statements too wide or attached to automation principals.

Fix: Apply the policy to a dedicated group for humans only, not service roles; use BoolIfExists condition on aws:MultiFactorAuthPresent.

11) EBS cleanup Lambda pitfalls

Symptom: Volumes not deleted or unexpected deletions.

Cause: Missing pagination, time zone handling, or lack of tag guard rail.

Fix: Use paginator, compare in UTC, and optionally require AutoDelete=true tag; log every deletion attempt.

Quick remediation checklist

Add safe defaults to required parameters.

Remove unsupported S3 properties; correct lifecycle schema.

Add IsLogging: true to the trail.

Auto-name S3 buckets to avoid DNS issues.

Tighten endpoint and bucket policies.

Keep KMS key policy minimal but functional.

Verify all resource types exist in us-east-1.

Ensure EIP Domain: vpc and NAT references are correct.

Scope MFA policy to human users only.