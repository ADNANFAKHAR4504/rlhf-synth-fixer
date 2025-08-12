AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure for Data Storage with Modular Nested Stacks'

Parameters:
  ProjectName:
    Type: String
    Default: 'SecureDataStorage'
    Description: 'Project name for resource naming'
  
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment designation'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - Environment

Resources:
  # ============================================================================
  # KMS NESTED STACK - Encryption Key Management
  # ============================================================================
  KMSStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateBody: |
        AWSTemplateFormatVersion: '2010-09-09'
        Description: 'KMS Keys for S3 Encryption'
        
        Parameters:
          ProjectName:
            Type: String
          Environment:
            Type: String
          ParentStackId:
            Type: String
        
        Resources:
          # Primary S3 Encryption Key
          S3EncryptionKey:
            Type: AWS::KMS::Key
            Properties:
              Description: !Sub '${ProjectName}-${Environment} S3 Encryption Key'
              KeyPolicy:
                Version: '2012-10-17'
                Statement:
                  - Sid: Enable IAM User Permissions
                    Effect: Allow
                    Principal:
                      AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
                    Action: 'kms:*'
                    Resource: '*'
                  - Sid: Allow S3 Service
                    Effect: Allow
                    Principal:
                      Service: s3.amazonaws.com
                    Action:
                      - kms:Decrypt
                      - kms:GenerateDataKey
                      - kms:ReEncrypt*
                      - kms:CreateGrant
                      - kms:DescribeKey
                    Resource: '*'
                    Condition:
                      StringEquals:
                        'kms:ViaService': !Sub 's3.us-west-2.amazonaws.com'
              KeySpec: SYMMETRIC_DEFAULT
              KeyUsage: ENCRYPT_DECRYPT
              MultiRegion: false
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-s3-key'
                - Key: Environment
                  Value: !Ref Environment
                - Key: Purpose
                  Value: 'S3-Encryption'
        
          # KMS Key Alias
          S3EncryptionKeyAlias:
            Type: AWS::KMS::Alias
            Properties:
              AliasName: !Sub 'alias/${ProjectName}-${Environment}-s3-encryption'
              TargetKeyId: !Ref S3EncryptionKey
        
        Outputs:
          KMSKeyId:
            Description: 'KMS Key ID for S3 Encryption'
            Value: !Ref S3EncryptionKey
            Export:
              Name: !Sub '${ParentStackId}-KMSKeyId'
          
          KMSKeyArn:
            Description: 'KMS Key ARN for S3 Encryption'
            Value: !GetAtt S3EncryptionKey.Arn
            Export:
              Name: !Sub '${ParentStackId}-KMSKeyArn'
          
          KMSKeyAlias:
            Description: 'KMS Key Alias'
            Value: !Ref S3EncryptionKeyAlias
            Export:
              Name: !Sub '${ParentStackId}-KMSKeyAlias'
      
      Parameters:
        ProjectName: !Ref ProjectName
        Environment: !Ref Environment
        ParentStackId: !Ref 'AWS::StackName'

  # ============================================================================
  # IAM NESTED STACK - Role and Policy Management
  # ============================================================================
  IAMStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: KMSStack
    Properties:
      TemplateBody: |
        AWSTemplateFormatVersion: '2010-09-09'
        Description: 'IAM Roles and Policies for S3 Access'
        
        Parameters:
          ProjectName:
            Type: String
          Environment:
            Type: String
          ParentStackId:
            Type: String
          KMSKeyArn:
            Type: String
        
        Resources:
          # S3 Access Role
          S3AccessRole:
            Type: AWS::IAM::Role
            Properties:
              RoleName: !Sub '${ProjectName}-${Environment}-S3AccessRole'
              AssumeRolePolicyDocument:
                Version: '2012-10-17'
                Statement:
                  - Effect: Allow
                    Principal:
                      Service: ec2.amazonaws.com
                    Action: sts:AssumeRole
                  - Effect: Allow
                    Principal:
                      AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
                    Action: sts:AssumeRole
                    Condition:
                      StringEquals:
                        'aws:RequestedRegion': 'us-west-2'
              Path: '/'
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-S3AccessRole'
                - Key: Environment
                  Value: !Ref Environment
        
          # Strict S3 Access Policy
          S3AccessPolicy:
            Type: AWS::IAM::Policy
            Properties:
              PolicyName: !Sub '${ProjectName}-${Environment}-S3AccessPolicy'
              PolicyDocument:
                Version: '2012-10-17'
                Statement:
                  # Explicit Allow - S3 Bucket Operations
                  - Sid: AllowS3BucketAccess
                    Effect: Allow
                    Action:
                      - s3:GetBucketLocation
                      - s3:GetBucketVersioning
                      - s3:ListBucket
                      - s3:ListBucketVersions
                      - s3:GetBucketNotification
                      - s3:GetBucketLogging
                      - s3:GetBucketTagging
                    Resource: 
                      - !Sub 'arn:aws:s3:::${ProjectName}-${Environment}-secure-data-*'
                    Condition:
                      StringEquals:
                        'aws:RequestedRegion': 'us-west-2'
                  
                  # Explicit Allow - S3 Object Operations
                  - Sid: AllowS3ObjectAccess
                    Effect: Allow
                    Action:
                      - s3:GetObject
                      - s3:GetObjectVersion
                      - s3:PutObject
                      - s3:PutObjectAcl
                      - s3:DeleteObject
                      - s3:DeleteObjectVersion
                      - s3:GetObjectTagging
                      - s3:PutObjectTagging
                    Resource: 
                      - !Sub 'arn:aws:s3:::${ProjectName}-${Environment}-secure-data-*/*'
                    Condition:
                      StringEquals:
                        'aws:RequestedRegion': 'us-west-2'
                  
                  # Explicit Allow - KMS Operations for S3
                  - Sid: AllowKMSForS3
                    Effect: Allow
                    Action:
                      - kms:Decrypt
                      - kms:GenerateDataKey
                      - kms:ReEncrypt*
                      - kms:DescribeKey
                    Resource: !Ref KMSKeyArn
                    Condition:
                      StringEquals:
                        'kms:ViaService': 's3.us-west-2.amazonaws.com'
                  
                  # Explicit Deny - All other AWS services
                  - Sid: DenyAllOtherServices
                    Effect: Deny
                    NotAction:
                      - s3:*
                      - kms:Decrypt
                      - kms:GenerateDataKey
                      - kms:ReEncrypt*
                      - kms:DescribeKey
                    Resource: '*'
                  
                  # Explicit Deny - Operations outside us-west-2
                  - Sid: DenyOperationsOutsideRegion
                    Effect: Deny
                    Action: '*'
                    Resource: '*'
                    Condition:
                      StringNotEquals:
                        'aws:RequestedRegion': 'us-west-2'
              
              Roles:
                - !Ref S3AccessRole
        
          # Instance Profile for EC2 (if needed)
          S3AccessInstanceProfile:
            Type: AWS::IAM::InstanceProfile
            Properties:
              InstanceProfileName: !Sub '${ProjectName}-${Environment}-S3AccessProfile'
              Path: '/'
              Roles:
                - !Ref S3AccessRole
        
        Outputs:
          S3AccessRoleArn:
            Description: 'S3 Access Role ARN'
            Value: !GetAtt S3AccessRole.Arn
            Export:
              Name: !Sub '${ParentStackId}-S3AccessRoleArn'
          
          S3AccessRoleName:
            Description: 'S3 Access Role Name'
            Value: !Ref S3AccessRole
            Export:
              Name: !Sub '${ParentStackId}-S3AccessRoleName'
          
          InstanceProfileArn:
            Description: 'Instance Profile ARN'
            Value: !GetAtt S3AccessInstanceProfile.Arn
            Export:
              Name: !Sub '${ParentStackId}-InstanceProfileArn'
      
      Parameters:
        ProjectName: !Ref ProjectName
        Environment: !Ref Environment
        ParentStackId: !Ref 'AWS::StackName'
        KMSKeyArn: !GetAtt KMSStack.Outputs.KMSKeyArn

  # ============================================================================
  # S3 NESTED STACK - Secure Bucket Configuration
  # ============================================================================
  S3Stack:
    Type: AWS::CloudFormation::Stack
    DependsOn: 
      - KMSStack
      - IAMStack
    Properties:
      TemplateBody: |
        AWSTemplateFormatVersion: '2010-09-09'
        Description: 'Secure S3 Buckets with KMS Encryption'
        
        Parameters:
          ProjectName:
            Type: String
          Environment:
            Type: String
          ParentStackId:
            Type: String
          KMSKeyId:
            Type: String
        
        Resources:
          # Primary Data Bucket
          PrimaryDataBucket:
            Type: AWS::S3::Bucket
            Properties:
              BucketName: !Sub '${ProjectName}-${Environment}-secure-data-primary-${AWS::AccountId}'
              BucketEncryption:
                ServerSideEncryptionConfiguration:
                  - ServerSideEncryptionByDefault:
                      SSEAlgorithm: aws:kms
                      KMSMasterKeyID: !Ref KMSKeyId
                    BucketKeyEnabled: true
              PublicAccessBlockConfiguration:
                BlockPublicAcls: true
                BlockPublicPolicy: true
                IgnorePublicAcls: true
                RestrictPublicBuckets: true
              VersioningConfiguration:
                Status: Enabled
              LoggingConfiguration:
                DestinationBucketName: !Ref LoggingBucket
                LogFilePrefix: 'primary-access-logs/'
              NotificationConfiguration:
                CloudWatchConfigurations:
                  - Event: 's3:ObjectCreated:*'
                    CloudWatchConfiguration:
                      LogGroupName: !Ref S3LogGroup
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-primary-data'
                - Key: Environment
                  Value: !Ref Environment
                - Key: DataClassification
                  Value: 'Sensitive'
                - Key: Encryption
                  Value: 'KMS'
        
          # Secondary Data Bucket (for backup/redundancy)
          SecondaryDataBucket:
            Type: AWS::S3::Bucket
            Properties:
              BucketName: !Sub '${ProjectName}-${Environment}-secure-data-secondary-${AWS::AccountId}'
              BucketEncryption:
                ServerSideEncryptionConfiguration:
                  - ServerSideEncryptionByDefault:
                      SSEAlgorithm: aws:kms
                      KMSMasterKeyID: !Ref KMSKeyId
                    BucketKeyEnabled: true
              PublicAccessBlockConfiguration:
                BlockPublicAcls: true
                BlockPublicPolicy: true
                IgnorePublicAcls: true
                RestrictPublicBuckets: true
              VersioningConfiguration:
                Status: Enabled
              LoggingConfiguration:
                DestinationBucketName: !Ref LoggingBucket
                LogFilePrefix: 'secondary-access-logs/'
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-secondary-data'
                - Key: Environment
                  Value: !Ref Environment
                - Key: DataClassification
                  Value: 'Sensitive'
                - Key: Encryption
                  Value: 'KMS'
        
          # Logging Bucket (for access logs)
          LoggingBucket:
            Type: AWS::S3::Bucket
            Properties:
              BucketName: !Sub '${ProjectName}-${Environment}-secure-data-logs-${AWS::AccountId}'
              BucketEncryption:
                ServerSideEncryptionConfiguration:
                  - ServerSideEncryptionByDefault:
                      SSEAlgorithm: aws:kms
                      KMSMasterKeyID: !Ref KMSKeyId
                    BucketKeyEnabled: true
              PublicAccessBlockConfiguration:
                BlockPublicAcls: true
                BlockPublicPolicy: true
                IgnorePublicAcls: true
                RestrictPublicBuckets: true
              LifecycleConfiguration:
                Rules:
                  - Id: LogRetentionRule
                    Status: Enabled
                    ExpirationInDays: 90
                    NoncurrentVersionExpirationInDays: 30
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-logs'
                - Key: Environment
                  Value: !Ref Environment
                - Key: Purpose
                  Value: 'AccessLogs'
        
          # CloudWatch Log Group for S3 events
          S3LogGroup:
            Type: AWS::Logs::LogGroup
            Properties:
              LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}'
              RetentionInDays: 30
              Tags:
                - Key: Name
                  Value: !Sub '${ProjectName}-${Environment}-s3-logs'
                - Key: Environment
                  Value: !Ref Environment
        
          # Bucket Policies for additional security
          PrimaryBucketPolicy:
            Type: AWS::S3::BucketPolicy
            Properties:
              Bucket: !Ref PrimaryDataBucket
              PolicyDocument:
                Version: '2012-10-17'
                Statement:
                  - Sid: DenyInsecureConnections
                    Effect: Deny
                    Principal: '*'
                    Action: 's3:*'
                    Resource:
                      - !Sub '${PrimaryDataBucket}/*'
                      - !Sub '${PrimaryDataBucket}'
                    Condition:
                      Bool:
                        'aws:SecureTransport': 'false'
                  - Sid: DenyUnencryptedUploads
                    Effect: Deny
                    Principal: '*'
                    Action: 's3:PutObject'
                    Resource: !Sub '${PrimaryDataBucket}/*'
                    Condition:
                      StringNotEquals:
                        's3:x-amz-server-side-encryption': 'aws:kms'
        
          SecondaryBucketPolicy:
            Type: AWS::S3::BucketPolicy
            Properties:
              Bucket: !Ref SecondaryDataBucket
              PolicyDocument:
                Version: '2012-10-17'
                Statement:
                  - Sid: DenyInsecureConnections
                    Effect: Deny
                    Principal: '*'
                    Action: 's3:*'
                    Resource:
                      - !Sub '${SecondaryDataBucket}/*'
                      - !Sub '${SecondaryDataBucket}'
                    Condition:
                      Bool:
                        'aws:SecureTransport': 'false'
                  - Sid: DenyUnencryptedUploads
                    Effect: Deny
                    Principal: '*'
                    Action: 's3:PutObject'
                    Resource: !Sub '${SecondaryDataBucket}/*'
                    Condition:
                      StringNotEquals:
                        's3:x-amz-server-side-encryption': 'aws:kms'
        
        Outputs:
          PrimaryBucketName:
            Description: 'Primary S3 Bucket Name'
            Value: !Ref PrimaryDataBucket
            Export:
              Name: !Sub '${ParentStackId}-PrimaryBucketName'
          
          SecondaryBucketName:
            Description: 'Secondary S3 Bucket Name'
            Value: !Ref SecondaryDataBucket
            Export:
              Name: !Sub '${ParentStackId}-SecondaryBucketName'
          
          LoggingBucketName:
            Description: 'Logging S3 Bucket Name'
            Value: !Ref LoggingBucket
            Export:
              Name: !Sub '${ParentStackId}-LoggingBucketName'
          
          PrimaryBucketArn:
            Description: 'Primary S3 Bucket ARN'
            Value: !GetAtt PrimaryDataBucket.Arn
            Export:
              Name: !Sub '${ParentStackId}-PrimaryBucketArn'
          
          SecondaryBucketArn:
            Description: 'Secondary S3 Bucket ARN'
            Value: !GetAtt SecondaryDataBucket.Arn
            Export:
              Name: !Sub '${ParentStackId}-SecondaryBucketArn'
      
      Parameters:
        ProjectName: !Ref ProjectName
        Environment: !Ref Environment
        ParentStackId: !Ref 'AWS::StackName'
        KMSKeyId: !GetAtt KMSStack.Outputs.KMSKeyId

# ============================================================================
# MAIN STACK OUTPUTS
# ============================================================================
Outputs:
  StackRegion:
    Description: 'Deployment Region'
    Value: !Ref 'AWS::Region'
  
  KMSKeyId:
    Description: 'KMS Key ID for S3 Encryption'
    Value: !GetAtt KMSStack.Outputs.KMSKeyId
  
  KMSKeyArn:
    Description: 'KMS Key ARN for S3 Encryption'
    Value: !GetAtt KMSStack.Outputs.KMSKeyArn
  
  IAMRoleArn:
    Description: 'S3 Access IAM Role ARN'
    Value: !GetAtt IAMStack.Outputs.S3AccessRoleArn
  
  IAMRoleName:
    Description: 'S3 Access IAM Role Name'
    Value: !GetAtt IAMStack.Outputs.S3AccessRoleName
  
  PrimaryBucketName:
    Description: 'Primary Secure Data Bucket'
    Value: !GetAtt S3Stack.Outputs.PrimaryBucketName
  
  SecondaryBucketName:
    Description: 'Secondary Secure Data Bucket'
    Value: !GetAtt S3Stack.Outputs.SecondaryBucketName
  
  LoggingBucketName:
    Description: 'Access Logging Bucket'
    Value: !GetAtt S3Stack.Outputs.LoggingBucketName
  
  DeploymentSummary:
    Description: 'Deployment Summary'
    Value: !Sub |
      Secure AWS Infrastructure deployed successfully in ${AWS::Region}
      - Project: ${ProjectName}
      - Environment: ${Environment}
      - KMS Encryption: Enabled
      - Public Access: Blocked
      - IAM: Least Privilege Applied
      - Modular Structure: Implemented