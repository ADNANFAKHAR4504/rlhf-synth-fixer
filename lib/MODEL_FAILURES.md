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
Problem: `DBSecret` failed — secret `mystack-db-secret` already exists.
Solution: Made secret names globally unique using `${AWS::StackName}-db-secret-${AWS::AccountId}-${AWS::Region}` format. (Fixed)
Affected area: Secrets Manager, Resource Naming

— Failure 8
Problem: `CloudTrailBucket` failed — bucket name already exists globally.
Solution: Added `ResourceSuffix` parameter; updated all bucket names to `${AWS::StackName}-cloudtrail-${AWS::AccountId}-${AWS::Region}${ResourceSuffix}`; deploy script accepts `RESOURCE_SUFFIX` env var for uniqueness. (Fixed)
Affected area: S3 Buckets, Resource Naming, CloudFormation Parameters

— Failure 9
Problem: `DBSubnetGroup` failed — “Resource ... already exists.”
Solution: Appended `ResourceSuffix` to `DBSubnetGroupName` and `DBInstanceIdentifier` for uniqueness. (Fixed)
Affected area: RDS, Resource Naming, Database Configuration

— Failure 10
Problem: ASG EC2 launch failed — “Client.InvalidKMSKey.InvalidState.”
Solution: Expanded `KMSKey` policy to include EC2 and S3 permissions; allowed `ApplicationRole` usage; used `!GetAtt KMSKey.Arn`; added `DependsOn: KMSKey`. Enabled key rotation. (Fixed)
Affected area: KMS, EC2 Launch Template, Auto Scaling Group

Summary
- Total issues: 10
- Severity breakdown (qualitative):
  - Critical: 4 (Failures 1, 3, 8, 10)
  - High: 2 (Failures 2, 4)
  - Medium: 3 (Failures 5, 7, 9)
  - Low: 1 (Failures 6)
- All fixed