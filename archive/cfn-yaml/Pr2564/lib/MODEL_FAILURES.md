- **Missing parameters and conditions**:
  - Parameters absent: `CloudWatchRetentionInDays`, `NumberOfAZs`, `EnableCloudTrail`.
  - Conditions absent: `CreateAz2`, `CreateCloudTrail`.
  - Consequences: no conditional creation for multi‑AZ resources or CloudTrail; log group retention cannot be set to supported values; unit tests expecting these parameters/conditions fail.

- **KMS key rotation property is wrong**:
  - Used `KeyRotationStatus: true` instead of `EnableKeyRotation: true` for KMS keys (`S3EncryptionKey`, `CloudTrailEncryptionKey`).
  - Consequences: schema validation/cfn-lint failure.

- **Partition‑aware S3 ARNs missing in multiple policies**:
  - IAM policies and S3 bucket policies reference bucket objects using `${BucketName}/*` instead of `arn:${AWS::Partition}:s3:::${BucketName}/*`.
  - Affected locations include:
    - `WebTierInstanceRole` → `S3AccessPolicy`
    - `ApplicationTierInstanceRole` → `S3AccessPolicy`
    - `ConfigRole` → `ConfigS3Policy`
    - `SecureS3BucketPolicy` object‑level statements
    - `CloudTrailS3BucketPolicy` write statement
    - `CloudTrailTrail` S3 `DataResources.Values` for data events
  - Consequences: policies are invalid/over‑permissive, and unit tests that assert partition‑aware ARNs fail.

- **CloudWatch Logs/VPC Flow Logs resources incomplete**:
  - `CloudTrailLogsGroup` is missing entirely.
  - `VPCFlowLogsGroup` uses `ComplianceRetentionDays` instead of `CloudWatchRetentionInDays` and lacks required tags.
  - `VPCFlowLogsRole` and `VPCFlowLogs` (EC2 FlowLog) resources are missing.
  - Consequences: logging not provisioned; multiple unit tests fail.

- **Networking (subnets/routing/NAT) missing**:
  - Public, private, and data subnets; route tables; NAT Gateway and EIP; routes and associations are absent.
  - Consequences: network architecture incomplete; unit tests expecting these resources fail.

- **CloudTrail trail not created and not conditional**:
  - `CloudTrailTrail` resource is missing, while buckets/keys/policies exist.
  - CloudTrail resources are not gated by `EnableCloudTrail` (no `CreateCloudTrail` condition).
  - Consequences: inconsistent CloudTrail setup and potential regional trail limits; unit tests fail.

- **Outputs missing**:
  - No `Outputs` section (e.g., VPC ID, subnet IDs, KMS key ARN, dashboard/trail names).
  - Consequences: integration tests relying on outputs cannot validate live resources.

## Important correctness and compliance issues
- **Invalid S3 bucket notification config**:
  - `SecureS3Bucket` defines `NotificationConfiguration` with a CloudWatch Logs target, which S3 does not support.
  - Action: remove invalid notification; use standard S3 event targets if needed (SNS/SQS/Lambda).

- **IAM policy approach**:
  - Uses `ManagedPolicyArns` for CloudWatch agent on EC2 instance roles. The ideal design replaces this with least‑privilege inline policies to avoid managed policy coupling and to satisfy tests expecting explicit permissions.

- **Extraneous/unused parameters and metadata**:
  - Parameters present but unused in the model: `EnableDetailedMonitoring`, `NotificationEmail`.
  - Extra ParameterGroup (“Monitoring Configuration”) that is not represented in the ideal template.
  - Consequences: drift and confusion; unit test expecting exactly 8 parameters fails.

## Remediation summary (addressed in the ideal template)
- Added parameters `CloudWatchRetentionInDays`, `NumberOfAZs`, `EnableCloudTrail` and conditions `CreateAz2`, `CreateCloudTrail`.
- Corrected KMS property to `EnableKeyRotation: true`.
- Standardized all S3 object ARNs to partition‑aware format `arn:${AWS::Partition}:s3:::` across IAM/S3 policies and CloudTrail data events.
- Added `CloudTrailLogsGroup` and updated `VPCFlowLogsGroup` to use `CloudWatchRetentionInDays` with tags; created `VPCFlowLogsRole` and `VPCFlowLogs`.
- Implemented multi‑tier networking: public/private/data subnets, route tables, NAT/EIP, routes, and associations (AZ‑conditional where applicable).
- Made CloudTrail resources conditional and added `CloudTrailTrail` with KMS, CloudWatch Logs integration, and S3 data event selectors.
- Removed invalid S3 bucket notification; retained access logging and lifecycle.
- Replaced CloudWatch agent managed policy attachments with explicit inline least‑privilege policies on EC2 roles.
- Introduced comprehensive `Outputs` for integration testing and discoverability.


