AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-environment web application infrastructure with S3, DynamoDB, IAM, CloudWatch, and SSM Parameter Store'

Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - testing
      - production
    Description: Environment name for resource deployment
    
  ApplicationName:
    Type: String
    Default: webapp
    Description: Name of the web application
    
  EnvironmentSuffix:
    Type: String
    Default: ""
    Description: Unique suffix for resource names to avoid conflicts between deployments

Mappings:
  EnvironmentConfig:
    development:
      LogRetention: 7
      DynamoDBBillingMode: PAY_PER_REQUEST
      S3StorageClass: STANDARD
    testing:
      LogRetention: 14
      DynamoDBBillingMode: PAY_PER_REQUEST
      S3StorageClass: STANDARD
    production:
      LogRetention: 90
      DynamoDBBillingMode: PROVISIONED
      S3StorageClass: STANDARD_IA

Conditions:
  IsProductionEnvironment: !Equals [!Ref Environment, 'production']
  IsStandardStorageClass: !Equals [!FindInMap [EnvironmentConfig, !Ref Environment, S3StorageClass], 'STANDARD']

Resources:
  # =====================================================
  # S3 BUCKETS
  # =====================================================
  EnvironmentS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      # Lifecycle only added if storage class is not STANDARD
      LifecycleConfiguration: !If
        - IsStandardStorageClass
        - !Ref AWS::NoValue
        - Rules:
            - Id: TransitionToIA
              Status: Enabled
              Transitions:
                - StorageClass: !FindInMap [EnvironmentConfig, !Ref Environment, S3StorageClass]
                  TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  SharedConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-shared-config${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: SharedConfiguration
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref Environment


  # =====================================================
  # DYNAMODB TABLES
  # =====================================================
  EnvironmentDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-data'
      BillingMode: !FindInMap [EnvironmentConfig, !Ref Environment, DynamoDBBillingMode]
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      ProvisionedThroughput: !If
        - IsProductionEnvironment
        - { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
        - !Ref AWS::NoValue
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: !If [IsProductionEnvironment, true, false]
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # =====================================================
  # IAM ROLES AND POLICIES
  # =====================================================
  ApplicationExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - lambda.amazonaws.com
                - ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  EnvironmentS3Policy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-s3-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
            Resource:
              - !Sub 'arn:aws:s3:::${EnvironmentS3Bucket}'
              - !Sub 'arn:aws:s3:::${EnvironmentS3Bucket}/*'
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !Sub 'arn:aws:s3:::${SharedConfigBucket}'
              - !Sub 'arn:aws:s3:::${SharedConfigBucket}/*'
      Roles:
        - !Ref ApplicationExecutionRole

  EnvironmentDynamoDBPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-dynamodb-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
              - dynamodb:UpdateItem
              - dynamodb:DeleteItem
              - dynamodb:Query
              - dynamodb:Scan
            Resource: !GetAtt EnvironmentDynamoDBTable.Arn
      Roles:
        - !Ref ApplicationExecutionRole

  CloudWatchLogsPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-cloudwatch-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogStream
              - logs:PutLogEvents
              - logs:DescribeLogGroups
              - logs:DescribeLogStreams
            Resource: !Sub '${ApplicationLogGroup.Arn}:*'
      Roles:
        - !Ref ApplicationExecutionRole

  SSMParameterPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-ssm-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - ssm:GetParameter
              - ssm:GetParameters
              - ssm:GetParametersByPath
            Resource: 
              - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ApplicationName}/${Environment}${EnvironmentSuffix}/*'
          - Effect: Allow
            Action:
              - kms:Decrypt
            Resource: !GetAtt SSMKMSKey.Arn
      Roles:
        - !Ref ApplicationExecutionRole

  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-instance-profile'
      Roles:
        - !Ref ApplicationExecutionRole

  # =====================================================
  # CLOUDWATCH LOG GROUPS
  # =====================================================
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}${EnvironmentSuffix}/application'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  PerformanceLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}${EnvironmentSuffix}/performance'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  ResourceUtilizationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}${EnvironmentSuffix}/resources'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # =====================================================
  # KMS KEY FOR SSM ENCRYPTION
  # =====================================================
  SSMKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for SSM Parameter Store encryption in ${Environment} environment'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key by SSM
            Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow application role to use the key
            Effect: Allow
            Principal:
              AWS: !GetAtt ApplicationExecutionRole.Arn
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  SSMKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-${Environment}${EnvironmentSuffix}-ssm-key'
      TargetKeyId: !Ref SSMKMSKey

  # =====================================================
  # SSM PARAMETER STORE
  # ======================================================
  DatabaseConnectionParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/database/connection-string'
      Type: String
      Value: !Sub 'dynamodb://table=${ApplicationName}-${Environment}${EnvironmentSuffix}-data;region=${AWS::Region}'
      Description: !Sub 'Database connection string for ${Environment} environment'
      Tags:
        Environment: !Ref Environment
        Application: !Ref ApplicationName

  APIConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/api/config'
      Type: String
      Value: !Sub
        - |
          {
            "timeout": 30,
            "retries": 3,
            "environment": "${Environment}",
            "log_level": "${LogLevel}"
          }
        - LogLevel: !If [IsProductionEnvironment, "INFO", "DEBUG"]
      Description: !Sub 'API configuration for ${Environment} environment'
      Tags:
        Environment: !Ref Environment
        Application: !Ref ApplicationName

  S3ConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/s3/bucket-name'
      Type: String
      Value: !Ref EnvironmentS3Bucket
      Description: !Sub 'S3 bucket name for ${Environment} environment'
      Tags:
        Environment: !Ref Environment
        Application: !Ref ApplicationName

  SharedConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/s3/shared-config-bucket'
      Type: String
      Value: !Ref SharedConfigBucket
      Description: 'Shared configuration S3 bucket name'
      Tags:
        Environment: !Ref Environment
        Application: !Ref ApplicationName

  ApplicationSecretsParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/secrets/app-key'
      Type: String
      Value: !Sub 'secret-key-for-${Environment}${EnvironmentSuffix}-${AWS::AccountId}'
      Description: !Sub 'Application secrets for ${Environment} environment'
      Tags:
        Environment: !Ref Environment
        Application: !Ref ApplicationName

Outputs:
  EnvironmentS3Bucket:
    Description: Environment-specific S3 bucket name
    Value: !Ref EnvironmentS3Bucket

  SharedConfigBucket:
    Description: Shared configuration S3 bucket name
    Value: !Ref SharedConfigBucket

  DynamoDBTableName:
    Description: Environment-specific DynamoDB table name
    Value: !Ref EnvironmentDynamoDBTable

  ApplicationExecutionRoleArn:
    Description: ARN of the application execution role
    Value: !GetAtt ApplicationExecutionRole.Arn

  ApplicationLogGroupName:
    Description: CloudWatch log group name for application logs
    Value: !Ref ApplicationLogGroup

  SSMParameterPrefix:
    Description: SSM Parameter Store prefix for this environment
    Value: !Sub '/${ApplicationName}/${Environment}${EnvironmentSuffix}/'
    
  SSMKMSKeyId:
    Description: KMS Key ID for SSM Parameter Store encryption
    Value: !Ref SSMKMSKey
    
  SSMKMSKeyAlias:
    Description: KMS Key Alias for SSM Parameter Store encryption
    Value: !Ref SSMKMSKeyAlias

  InstanceProfileArn:
    Description: Instance profile ARN for EC2 instances
    Value: !GetAtt ApplicationInstanceProfile.Arn
