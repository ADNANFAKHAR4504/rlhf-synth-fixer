### Failure Summary
The generated CloudFormation diverged from the requested TAP Stack spec and introduces breaking changes and security regressions:
- Removed `EnvironmentSuffix` and associated naming/tagging.
- Replaced AL2023 SSM parameter with static AMI mapping (region-limited, brittle).
- Omitted required DynamoDB table creation (`TurnAroundPromptTable`); only produced a read-only policy.
- Replaced Secrets Manager-based RDS credentials (param/auto-secret) with plaintext parameters.
- Collapsed CloudTrail into a single resource and added unconditional `DependsOn: DataBucketPolicy`, which fails when reusing an existing S3 bucket.
- Used a non-standard CloudTrail S3 prefix (`/cloudtrail/*`) vs. `AWSLogs/${AWS::AccountId}/*`.
- Key policy is missing `dynamodb.amazonaws.com` principal from the Ideal.
- Missing `RdsSecretUsed` output; added many exports not requested.

### Exact Deltas To Fix
1. **Parameters & Metadata**
   - Restore `EnvironmentSuffix`, `ProjectPrefix`, `Environment` and their use in Names/Tags.
   - Restore `LatestAmiId` as `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`; remove `AmiMap`.
   - Bring back `RdsSecretArn` and keep `RdsUsername` *only* for auto-secret creation.

2. **Conditions**
   - Reintroduce: `CreateKmsKey`, `CreateDataBucket`, `UseExistingDataBucket`, `EmailSubscriptionEnabled`, `HasKeyPair`, `UseProvidedRdsSecret`, `CreateRdsSecret`.
   - Remove unused conditions (e.g., `IsProdOrStg`) unless applied.

3. **DynamoDB**
   - Create `TurnAroundPromptTable` (PAY_PER_REQUEST, PITR, SSE) with tags as in Ideal.
   - Keep the dedicated read-only ManagedPolicy **scoped to that table ARN**.

4. **KMS**
   - Keep create-or-use logic.
   - Add principals: `rds.amazonaws.com`, `logs.amazonaws.com`, `dynamodb.amazonaws.com`, `s3.amazonaws.com`, `cloudtrail.amazonaws.com`, `ec2.amazonaws.com` via `RegionMap`.

5. **S3 + Bucket Policy**
   - Create-or-use data bucket with KMS.
   - Enforce `DenyInsecureTransport`.
   - For CloudTrail, **require**:
     - `s3:GetBucketAcl` and `s3:GetBucketLocation` on bucket ARN.
     - `s3:PutObject` to `${Bucket.Arn}/AWSLogs/${AWS::AccountId}/*` with `s3:x-amz-acl = bucket-owner-full-control`.

6. **CloudTrail**
   - Provide **two** trail resources:
     - `CloudTrailNewBucket` (Condition: `CreateDataBucket`, `DependsOn: DataBucketPolicy`).
     - `CloudTrailExistingBucket` (Condition: `UseExistingDataBucket`, **no** dependency on DataBucketPolicy).
   - Keep multi-region, log validation, KMS wiring.

7. **EC2**
   - Use `LatestAmiId` SSM param for both instances.
   - Keep EBS gp3 + KMS and user data identical to Ideal.

8. **RDS**
   - Use Secrets Manager:
     - If `RdsSecretArn` provided, resolve username/password from it.
     - Else create `RdsGeneratedSecret` (Retain) with `${RdsUsername}` template and random password.
   - Keep 15.10 default, enhanced monitoring role, subnet group in private subnets, SGs, PI enabled.

9. **Outputs**
   - Include `RdsSecretUsed` (ARN of secret actually used).
   - Avoid adding extra stack exports not requested.

### Acceptance Criteria
- Template structure and semantics **match the Ideal** JSON, including parameters, conditions, mappings, and resource shapes.
- CloudTrail writes to `AWSLogs/${AWS::AccountId}/*` and succeeds with either created or existing bucket.
- RDS uses Secrets Manager (provided or generated) and exposes `RdsSecretUsed`.
- DynamoDB table exists with read-only policy correctly scoped.
- AMI pulled from SSM param (AL2023) for portability.
- VPC/subnets leverage `Fn::GetAZs` without explicit AZ parameters.
- All resources tagged and named with `ProjectPrefix`, `Environment`, and `EnvironmentSuffix`.

### Quick Regression Checks
- `cfn-lint`: no E3xxx structural errors; no unresolved `Ref`/`GetAtt`.
- `cfn_nag`: CloudTrail bucket policy must deny insecure transport; S3 logging path correct; no wildcard admin policies beyond KMS root statement.
- Deploy with both branches:
  1) `S3DataBucketName=""` and `KmsKeyArn=""` (create both).
  2) `S3DataBucketName=<precreated>` and `KmsKeyArn=<existing>` (reuse both).
- Integration tests expecting `RdsSecretUsed`, VPC features, SG relations, CloudTrail health, and DynamoDB table should pass.
