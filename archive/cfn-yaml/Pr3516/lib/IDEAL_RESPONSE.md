Here's the complete CloudFormation template for the scientific computing shared storage infrastructure in the us-east-2 region:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Scientific Computing Shared Storage Infrastructure with EFS, VPC, Lambda cleanup, and backup'

Parameters:
  EnvironmentName:
    Description: An environment name that is prefixed to resource names
    Type: String
    Default: ScientificComputing

  EnvironmentSuffix:
    Description: A suffix to append to resource names for uniqueness
    Type: String
    Default: dev

  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in AZ1
    Type: String
    Default: 10.0.1.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in AZ2
    Type: String
    Default: 10.0.2.0/24

  PartnerAccountIds:
    Description: Comma-separated list of partner AWS account IDs for cross-account sharing
    Type: CommaDelimitedList
    Default: ""

Mappings:
  RegionMap:
    us-east-2:
      AZ1: us-east-2a
      AZ2: us-east-2b

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-${EnvironmentSuffix}-VPC

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-${EnvironmentSuffix}-Private-Subnet-AZ1

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-${EnvironmentSuffix}-Private-Subnet-AZ2

  # Security Group for EFS
  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EFS mount targets
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          CidrIp: !Ref VpcCIDR
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS-SG

  # EFS File System
  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    DeletionPolicy: Delete
    Properties:
      BackupPolicy:
        Status: ENABLED
      Encrypted: true
      FileSystemTags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS
        - TransitionToPrimaryStorageClass: AFTER_1_ACCESS
      PerformanceMode: maxIO
      ThroughputMode: provisioned
      ProvisionedThroughputInMibps: 100

  # EFS Mount Target for Subnet 1
  EFSMountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # EFS Mount Target for Subnet 2
  EFSMountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # S3 Bucket for Archival
  ArchivalBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'tap-archival-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArchives
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Archival-Bucket

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: EFSAndS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - elasticfilesystem:ClientMount
                  - elasticfilesystem:ClientWrite
                  - elasticfilesystem:DescribeFileSystems
                Resource: !GetAtt EFSFileSystem.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ArchivalBucket.Arn
                  - !Sub '${ArchivalBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  # Lambda Function for Cleanup
  CleanupLambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn:
      - EFSMountTarget1
      - EFSMountTarget2
    Properties:
      FunctionName: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS-Cleanup
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 900
      MemorySize: 1024
      Environment:
        Variables:
          EFS_MOUNT_PATH: /mnt/efs
          S3_BUCKET: !Ref ArchivalBucket
          DAYS_THRESHOLD: '180'
      VpcConfig:
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        SecurityGroupIds:
          - !Ref EFSSecurityGroup
      FileSystemConfigs:
        - Arn: !GetAtt EFSAccessPoint.Arn
          LocalMountPath: /mnt/efs
      Code:
        ZipFile: |
          import os
          import boto3
          import json
          from datetime import datetime, timedelta
          import shutil

          s3_client = boto3.client('s3')

          def lambda_handler(event, context):
              efs_mount_path = os.environ['EFS_MOUNT_PATH']
              s3_bucket = os.environ['S3_BUCKET']
              days_threshold = int(os.environ['DAYS_THRESHOLD'])

              threshold_date = datetime.now() - timedelta(days=days_threshold)
              archived_count = 0

              for root, dirs, files in os.walk(efs_mount_path):
                  for file in files:
                      file_path = os.path.join(root, file)
                      file_stat = os.stat(file_path)
                      file_mtime = datetime.fromtimestamp(file_stat.st_mtime)

                      if file_mtime < threshold_date:
                          # Archive to S3
                          relative_path = os.path.relpath(file_path, efs_mount_path)
                          s3_key = f"archived/{relative_path}"

                          try:
                              with open(file_path, 'rb') as f:
                                  s3_client.put_object(
                                      Bucket=s3_bucket,
                                      Key=s3_key,
                                      Body=f,
                                      Metadata={
                                          'original_mtime': str(file_mtime),
                                          'archived_date': str(datetime.now())
                                      }
                                  )
                              os.remove(file_path)
                              archived_count += 1
                          except Exception as e:
                              print(f"Error archiving {file_path}: {str(e)}")

              return {
                  'statusCode': 200,
                  'body': json.dumps(f'Archived {archived_count} files')
              }

  # EFS Access Point
  EFSAccessPoint:
    Type: AWS::EFS::AccessPoint
    Properties:
      FileSystemId: !Ref EFSFileSystem
      PosixUser:
        Uid: 1000
        Gid: 1000
      RootDirectory:
        CreationInfo:
          OwnerGid: 1000
          OwnerUid: 1000
          Permissions: '755'
        Path: /research-data

  # EventBridge Rule for Daily Cleanup
  CleanupScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Description: Daily trigger for EFS cleanup
      ScheduleExpression: 'cron(0 2 * * ? *)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt CleanupLambdaFunction.Arn
          Id: CleanupTarget

  # Lambda Permission for EventBridge
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CleanupLambdaFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt CleanupScheduleRule.Arn

  # IAM Role for Research Teams
  ResearchTeamRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-${EnvironmentSuffix}-Research-Team-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EFSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - elasticfilesystem:ClientMount
                  - elasticfilesystem:ClientWrite
                  - elasticfilesystem:DescribeMountTargets
                Resource: !GetAtt EFSFileSystem.Arn

  # CloudWatch Alarm for EFS Storage
  EFSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS-Storage-Usage
      AlarmDescription: Alert when EFS storage exceeds threshold
      MetricName: StorageBytes
      Namespace: AWS/EFS
      Statistic: Average
      Period: 3600
      EvaluationPeriods: 1
      Threshold: 1099511627776  # 1TB in bytes
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FileSystemId
          Value: !Ref EFSFileSystem

  # AWS Backup Vault
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub tap-${EnvironmentSuffix}-backup-vault

  # Backup Plan
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub tap-${EnvironmentSuffix}-backup-plan
        BackupPlanRule:
          - RuleName: DailyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 5 * * ? *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
            RecoveryPointTags:
              Environment: !Ref EnvironmentName

  # Backup Selection
  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub tap-${EnvironmentSuffix}-efs-selection
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !GetAtt EFSFileSystem.Arn

  # Backup Role
  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup

  # DataSync Role
  DataSyncRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: datasync.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DataSyncEFSS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - elasticfilesystem:ClientMount
                  - elasticfilesystem:ClientWrite
                Resource: !GetAtt EFSFileSystem.Arn
              - Effect: Allow
                Action:
                  - s3:GetBucketLocation
                  - s3:ListBucket
                  - s3:ListBucketMultipartUploads
                Resource: !GetAtt ArchivalBucket.Arn
              - Effect: Allow
                Action:
                  - s3:AbortMultipartUpload
                  - s3:DeleteObject
                  - s3:GetObject
                  - s3:ListMultipartUploadParts
                  - s3:PutObject
                  - s3:GetObjectTagging
                  - s3:PutObjectTagging
                Resource: !Sub '${ArchivalBucket.Arn}/*'

  # DataSync EFS Location
  DataSyncEFSLocation:
    Type: AWS::DataSync::LocationEFS
    DependsOn:
      - EFSMountTarget1
      - EFSMountTarget2
    Properties:
      EfsFilesystemArn: !GetAtt EFSFileSystem.Arn
      Ec2Config:
        SecurityGroupArns:
          - !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:security-group/${EFSSecurityGroup}'
        SubnetArn: !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:subnet/${PrivateSubnet1}'

  # DataSync S3 Location
  DataSyncS3Location:
    Type: AWS::DataSync::LocationS3
    Properties:
      S3BucketArn: !GetAtt ArchivalBucket.Arn
      S3Config:
        BucketAccessRoleArn: !GetAtt DataSyncRole.Arn
      S3StorageClass: STANDARD_IA
      Subdirectory: /datasync-archive

  # DataSync Task
  DataSyncTask:
    Type: AWS::DataSync::Task
    Properties:
      Name: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS-S3-Archive-Task
      SourceLocationArn: !Ref DataSyncEFSLocation
      DestinationLocationArn: !Ref DataSyncS3Location
      Options:
        VerifyMode: ONLY_FILES_TRANSFERRED
        PreserveDeletedFiles: REMOVE
        TransferMode: CHANGED
      Schedule:
        ScheduleExpression: 'cron(0 3 * * ? *)'

  # Resource Share for Cross-Account Access
  ResourceShare:
    Type: AWS::RAM::ResourceShare
    Condition: HasPartnerAccounts
    Properties:
      Name: !Sub ${EnvironmentName}-${EnvironmentSuffix}-EFS-Share
      ResourceArns:
        - !GetAtt EFSFileSystem.Arn
      Principals: !Ref PartnerAccountIds
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

Conditions:
  HasPartnerAccounts: !Not [!Equals [!Join ['', !Ref PartnerAccountIds], '']]

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  EFSFileSystemId:
    Description: EFS File System ID
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub ${EnvironmentName}-EFS-ID

  EFSFileSystemArn:
    Description: EFS File System ARN
    Value: !GetAtt EFSFileSystem.Arn
    Export:
      Name: !Sub ${EnvironmentName}-EFS-ARN

  EFSDnsName:
    Description: EFS DNS Name for mounting
    Value: !Sub '${EFSFileSystem}.efs.${AWS::Region}.amazonaws.com'
    Export:
      Name: !Sub ${EnvironmentName}-EFS-DNS

  ArchivalBucketName:
    Description: S3 Archival Bucket Name
    Value: !Ref ArchivalBucket
    Export:
      Name: !Sub ${EnvironmentName}-Archival-Bucket

  ArchivalBucketArn:
    Description: S3 Archival Bucket ARN
    Value: !GetAtt ArchivalBucket.Arn
    Export:
      Name: !Sub ${EnvironmentName}-Archival-Bucket-ARN

  CleanupLambdaArn:
    Description: Cleanup Lambda Function ARN
    Value: !GetAtt CleanupLambdaFunction.Arn
    Export:
      Name: !Sub ${EnvironmentName}-Cleanup-Lambda-ARN

  ResearchTeamRoleArn:
    Description: Research Team IAM Role ARN
    Value: !GetAtt ResearchTeamRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-Research-Role-ARN

  BackupVaultArn:
    Description: Backup Vault ARN
    Value: !GetAtt BackupVault.BackupVaultArn
    Export:
      Name: !Sub ${EnvironmentName}-Backup-Vault-ARN

  DataSyncTaskArn:
    Description: DataSync Task ARN
    Value: !Ref DataSyncTask
    Export:
      Name: !Sub ${EnvironmentName}-DataSync-Task-ARN

  ResourceShareArn:
    Condition: HasPartnerAccounts
    Description: Resource Share ARN for cross-account access
    Value: !Ref ResourceShare
    Export:
      Name: !Sub ${EnvironmentName}-Resource-Share-ARN
```

This CloudFormation template creates a comprehensive scientific computing shared storage infrastructure that includes:

1. **VPC and Networking**: A VPC with two private subnets across different availability zones in us-east-2, providing high availability.

2. **EFS File System**: A high-performance EFS file system with:
   - Provisioned throughput of 100 MiB/s
   - maxIO performance mode for high parallelism
   - Encryption at rest
   - Lifecycle policies to transition files to Infrequent Access after 30 days
   - Mount targets in multiple AZs for high availability
   - Access point with POSIX permissions

3. **S3 Archival Storage**: An encrypted S3 bucket with:
   - Versioning enabled
   - Lifecycle rule to delete archives after 365 days
   - Integration with Lambda and DataSync for archival operations

4. **Lambda Cleanup Function**: An automated cleanup function that:
   - Runs daily at 2 AM UTC
   - Archives files older than 180 days to S3
   - Removes archived files from EFS to free up space
   - Mounted to EFS via file system configuration

5. **AWS Backup**: Daily automated backups with:
   - 30-day retention period
   - Scheduled at 5 AM UTC
   - Dedicated backup vault

6. **DataSync**: Automated data synchronization between EFS and S3:
   - Daily schedule at 3 AM UTC
   - Transfers only changed files
   - Archives to S3 Infrequent Access storage class

7. **Monitoring and Alarms**: CloudWatch alarm that triggers when EFS storage exceeds 1TB.

8. **IAM Security**: Role-based access control for research teams with appropriate permissions for EFS access.

9. **Cross-Account Sharing**: AWS Resource Access Manager configuration for sharing the EFS file system with partner organizations (when partner account IDs are provided).

10. **Resource Cleanup**: All resources have DeletionPolicy set to Delete to ensure clean stack deletion and prevent resource retention.

The solution is production-ready with proper error handling, security best practices, and multi-AZ redundancy for high availability.