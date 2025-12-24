```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - TeamName
          - Owner

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  TeamName:
    Type: String
    Default: 'security'
    Description: 'Team name for resource naming convention'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  Owner:
    Type: String
    Default: 'infrastructure-team'
    Description: 'Resource owner for mandatory tagging'

Resources:
  # ===== KMS KEY FOR ENCRYPTION =====
  SecurityKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${TeamName}-${EnvironmentSuffix} KMS key for encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail Encryption
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:CreateGrant
            Resource: '*'
          - Sid: Allow Lambda Environment Variable Encryption
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub 'KMS-${TeamName}-${EnvironmentSuffix}-SecurityKey'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecurityKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${TeamName}-${EnvironmentSuffix}-security-key'
      TargetKeyId: !Ref SecurityKMSKey

  # ===== S3 BUCKETS WITH AES-256 ENCRYPTION =====
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-SecureBucket-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-ALBLogs-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-CloudTrail-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ===== S3 BUCKET POLICIES =====
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailGetBucketLocation
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketLocation
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailListBucket
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt SecurityKMSKey.Arn
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-${EnvironmentSuffix}'

  # ===== DYNAMODB TABLE =====
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'DynamoDB-${TeamName}-TurnAroundPrompt-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub 'DynamoDB-${TeamName}-TurnAroundPrompt-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ===== IAM ROLES =====
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt SecurityKMSKey.Arn
        - PolicyName: DynamoDBAccess
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
                Resource: !GetAtt TurnAroundPromptTable.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Role-${TeamName}-Lambda-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ===== LAMBDA FUNCTION =====
  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'Lambda-${TeamName}-SecureFunction-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from secure Lambda!')
              }
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          TEAM_NAME: !Ref TeamName
      KmsKeyArn: !GetAtt SecurityKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Lambda-${TeamName}-SecureFunction-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ===== GUARDDUTY =====
  GuardDuty:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Name
          Value: !Sub 'GuardDuty-${TeamName}-${EnvironmentSuffix}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  SecurityKMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref SecurityKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  SecurityKMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt SecurityKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  SecureS3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  ALBLogsBucketName:
    Description: 'ALB Logs S3 Bucket Name'
    Value: !Ref ALBLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ALBLogsBucketName'

  CloudTrailLogsBucketName:
    Description: 'CloudTrail Logs S3 Bucket Name'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailLogsBucketName'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value: !Ref GuardDuty
    Export:
      Name: !Sub '${AWS::StackName}-GuardDutyDetectorId'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'


```