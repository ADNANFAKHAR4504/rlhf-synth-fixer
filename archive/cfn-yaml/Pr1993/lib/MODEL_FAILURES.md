# Model Failures and Remediations

This document captures issues encountered during recent template updates and deployments, their root causes, and the fixes applied. It helps prevent regressions and speeds up future investigations.

## Key Failures Observed

- __[CAPABILITY_NAMED_IAM required]__
  - Error: `InsufficientCapabilitiesException: Requires capabilities : [CAPABILITY_NAMED_IAM]`
  - Root cause: Explicit names were set on IAM resources in `lib/TapStack.yml` (`RoleName` for roles, `InstanceProfileName` for instance profiles).

- __[Invalid S3 Resource in IAM/Bucket Policies]__
  - Error: `Resource <bucket or prefix> must be in ARN format or "*"` (IAM 400 InvalidRequest)
  - Root cause: Used logical refs or raw bucket names like `${S3Bucket}/*` instead of full ARNs.

- __[CloudTrail Log Group ARN misuse]__
  - Symptom: CloudTrail integration with CloudWatch Logs misconfigured.
  - Root cause: `CloudWatchLogsLogGroupArn` incorrectly used `!Sub '${CloudTrailLogGroup.Arn}:*'` instead of the actual log group ARN.

- __[AWS Config delivery channel limit exceeded]__
  - Error: `MaxNumberOfDeliveryChannelsExceededException`
  - Root cause: Account/region already had an AWS Config delivery channel; template tried to create another (`AWS allows only one per region`).

## Files Updated

- `lib/TapStack.yml`
  - Removed `RoleName` from IAM roles and `InstanceProfileName` from instance profiles.
  - Replaced S3 object Resource strings with full ARNs:
    - `arn:aws:s3:::${S3Bucket}/*`, `arn:aws:s3:::${CloudTrailBucket}/*`, `arn:aws:s3:::${S3Bucket}/config/*`, `arn:aws:s3:::${ConfigBucket}/*`.
  - Fixed CloudTrail property: `CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn`.
  - Generalized CloudWatch Logs ARNs in IAM policies to `${AWS::Region}`.
  - Made AWS Config optional via `EnableConfig` parameter and `CreateConfig` condition applied to all Config resources and `ConfigRole`.

- `lib/TapStack.json`
  - Regenerated from YAML after each change for tests/deploys.

## Fixes Applied (Summary)

- __[Named IAM removal]__ Deleted explicit names so deploys succeed with `CAPABILITY_IAM` only.
- __[S3 policy ARNs]__ Converted bucket/prefix references to proper S3 ARNs in all policies.
- __[CloudTrail ARN]__ Used the log group ARN directly (no wildcard) for `CloudWatchLogsLogGroupArn`.
- __[AWS Config conditional]__ Introduced `EnableConfig` with default `false` to avoid the single-delivery-channel limit when an existing setup is present.

## How To Detect Early

- Run `cfn-lint` on `lib/TapStack.yml` before deploy.
- Unit tests in `test/tap-stack.unit.test.ts` validate tagging, IAM wildcard usage, RDS password via Secrets Manager, and basic resource properties.
- During deploy, monitor via:
  ```bash
  aws cloudformation describe-stack-events --stack-name <STACK> --region <REGION> --max-items 25
  ```

## Preventive Guidelines

- __Avoid named IAM__ unless `CAPABILITY_NAMED_IAM` is explicitly allowed by the deployment pipeline.
- __Always use full S3 ARNs__ for object-level permissions: `arn:aws:s3:::bucket/*`.
- __Do not wildcard CloudTrail log group property__; use the exact ARN. Use wildcards only in IAM policy Resources where appropriate.
- __Guard optional/global services__ (AWS Config, Organization-level services) with parameters/conditions to avoid regional/account limits.
- __Parameterize regions in ARNs__ via `${AWS::Region}` instead of hardcoding.

## Remaining Considerations

- If you later need AWS Config from this stack, set `EnableConfig=true` and ensure the region has no existing delivery channel.
- Keep artifact S3 buckets regionalized and consistent with CLI region during deploys.