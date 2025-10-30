— Failure 1
Problem: Circular dependency among [CloudTrail, BackupBucket, S3ReplicationRole].
Solution: Broke the loop by limiting `CloudTrail` scope — removed `BackupBucket` from `EventSelectors`; retained monitoring for `ApplicationDataBucket`. `BackupBucket` can be audited independently. (Fixed)
Affected area: Monitoring, S3 Configuration, IAM

— Failure 2
Problem: Circular dependency between [BackupBucket, S3ReplicationRole].
Solution: Discovered `AWS::S3::BucketReplicationConfiguration` invalid; restructured creation order — destination bucket → replication role → source bucket with replication. Enforced order via `DependsOn`. (Fixed)
Affected area: S3 Configuration, IAM

— Failure 3
Problem: Invalid resource type `AWS::S3::BucketReplicationConfiguration`.
Solution: Moved replication settings into S3 bucket properties under `ReplicationConfiguration` with correct `DependsOn` to avoid dependency loops. (Fixed)
Affected area: S3 Configuration

— Failure 4
Problem: `VPCFlowLogGroup` failed with “The specified KMS key does not exist or is not allowed.”
Solution: Updated `KMSKey` policy to permit CloudWatch Logs usage; added `DependsOn: KMSKey` for ordered creation. (Fixed)
Affected area: KMS, CloudWatch Logs, IAM

— Failure 5
Problem: `ConfigRole` failed with “Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist.”
Solution: Replaced with valid policy `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` or inline equivalent granting required permissions. (Fixed)
Affected area: IAM, AWS Config

— Failure 6
Problem: `ConfigRecorder` failed — unsupported property `RoleArn`.
Solution: Corrected case-sensitive property name to `RoleARN` as per AWS spec. (Fixed)
Affected area: AWS Config, CloudFormation Syntax

— Failure 7
Problem: ASG EC2 launch failed — “Client.InvalidKMSKey.InvalidState.”
Solution: Expanded `KMSKey` policy to include EC2 and S3 permissions; allowed `ApplicationRole` usage; used `!GetAtt KMSKey.Arn`; added `DependsOn: KMSKey`. Enabled key rotation. (Fixed)
Affected area: KMS, EC2 Launch Template, Auto Scaling Group

Summary
- Total issues: 7
- Severity breakdown (qualitative):
  - Critical: 3 (Failures 1, 3, 7)
  - High: 2 (Failures 2, 4)
  - Medium: 1 (Failure 5)
  - Low: 1 (Failure 6)
- All fixed