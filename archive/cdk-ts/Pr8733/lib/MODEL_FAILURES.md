The initial implementation failed to meet several security, compliance, and operability requirements. Below are the concrete issues found and the exact fixes applied to achieve the ideal response.

1. RDS Parameter Group family invalid for Postgres

- Problem: Parameter group family was implicitly resolved to an invalid family (e.g., postgres14.11), causing deploy errors.
- Fix: Switched to L1 `rds.CfnDBParameterGroup` with explicit `family: 'postgres14'` and imported as an L2 `ParameterGroup` for the DB instance. Also enforced `rds.force_ssl=1`.

2. MFA enforcement not applied to all users by default

- Problem: Group and policy existed but user assignment required parameters and was optional.
- Fix: Kept CSV param optional to avoid blocking deploys, but added conditional `CfnUserToGroupAddition` to apply enforcement when provided and documented that org-wide enforcement requires an SCP.

3. WAF not guaranteed to protect a resource

- Problem: WebACL created without a guaranteed association.
- Fix: Added `WafAssociationResourceArn` parameter with a `CfnCondition` and conditioned `CfnWebACLAssociation`. Avoided forcing a value at synth to keep dev flexible, and added stack outputs for CI.

4. CloudTrail resource naming collisions on re-deploy

- Problem: Fixed names for CloudTrail bucket/log group led to AlreadyExists errors across redeployments.
- Fix: Removed explicit names for CloudTrail bucket and log group so CDK generates unique names while retaining security settings.

5. S3 data bucket missing strict policy for encryption-in-flight and at-rest

- Problem: Only TLS enforcement existed initially.
- Fix: Added bucket policy statement `DenyUnEncryptedObjectUploads` checking `s3:x-amz-server-side-encryption == aws:kms`.

6. VPC Flow Logs naming not following convention

- Problem: Auto-generated names did not follow `company-env-component` convention.
- Fix: Assigned explicit names to flow logs `LogGroup` and `IAM Role` using the common naming function.

7. Integration tests not comprehensive or CI-friendly

- Problem: Tests were placeholders and failed locally; no live validations.
- Fix: Implemented synth-level checks and live AWS SDK checks for S3, CloudTrail, CloudWatch Logs, EC2 (EBS default + Flow Logs), RDS (SSL and encryption), GuardDuty, and WAF association. Tests consume CloudFormation outputs or query CFN directly when outputs file is absent. GuardDuty import uses dynamic import to avoid local missing module failures.

8. Construct ID collision between parameter and output

- Problem: Output ID reused an existing parameter ID (`WafAssociationResourceArn`), breaking synth.
- Fix: Renamed the output to `WafAssociationArnOutput`.

9. Region enforcement missing tests and branch coverage too low

- Problem: Branch coverage thresholds failed.
- Fix: Added unit tests to cover region guard, environment suffix resolution paths, and broader assertions on IAM/VPC resources.

10. EBS encryption by default not verifiable via tests

- Problem: No validation beyond the custom resource call.
- Fix: Added a live integration test asserting `GetEbsEncryptionByDefault` returns true.

Operational/Testing Improvements

- Added stack outputs: DataBucketName, WebAclArn, WafAssociationArnOutput, VpcId, VpcFlowLogsLogGroupName, RdsEndpointAddress, CloudTrailBucketName, CloudTrailLogGroupName.
- Live tests auto-fetch outputs via CloudFormation when local output file is missing, so they run identically in CI and locally.
  Insert here the model's failures
