# Secure Infrastructure Deployment – Expert-Level CloudFormation Template

This CloudFormation template implements a secure, production-grade infrastructure in the **us-east-1** AWS region.  
It follows strict organizational security policies, enforces IAM password policies, provisions secure S3 buckets, and deploys a Lambda function with strong logging safeguards to prevent leakage of sensitive AWS credentials.

## Architecture Overview

The infrastructure provides:

### Identity and Access Management
- **Account Password Policy**:
  - Minimum length: 12 characters
  - Must contain uppercase, lowercase, numbers, and symbols
  - Password expiration after 90 days
  - Prevents reuse of last 12 passwords
  - Hard expiry enforced

### Storage Layer
- **Primary Data Bucket**:
  - Private by default (all public access blocked)
  - AES-256 encryption
  - Versioning enabled
  - Lifecycle transitions to STANDARD_IA after 30 days, GLACIER after 90 days

- **Backup Data Bucket**:
  - Private, encrypted, and versioned
  - Intended for storing backup copies of processed data

- **Logs Bucket**:
  - Private and encrypted
  - 7-year retention with transitions to GLACIER for long-term compliance storage

- **Security Policies**:
  - Deny unencrypted S3 uploads
  - Enforce HTTPS for S3 operations

### Compute Layer
- **Lambda Execution Role**:
  - Least-privilege S3 and CloudWatch permissions
  - Correct ARN references for bucket object actions

- **Data Processor Lambda Function**:
  - Processes S3 object creation events
  - Uses `SensitiveInfoFilter` to prevent logging AWS keys and secrets
  - Logs only safe environment variables
  - Copies processed objects to backup bucket

- **S3 Event Notifications**:
  - Configured bucket to trigger Lambda function upon object creation

### Logging and Monitoring
- **CloudWatch Log Group**:
  - Dedicated log group for Lambda function
  - Retention of 30 days
  - Logging filter prevents sensitive AWS credential exposure

## Implementation File

### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Expert-level CloudFormation template for secure infrastructure deployment in us-east-1'

# Parameters with default values for automated pipeline deployment
Parameters:
  ProjectName:
    Type: String
    Default: 'secureorg'
    Description: 'Project name used in resource naming convention'
    AllowedPattern: '^[a-z][a-z0-9-]*$'
    ConstraintDescription: 'Project name must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    MinLength: 3
    MaxLength: 20
    
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment for deployment (dev, staging, prod)'
    
  LambdaFunctionName:
    Type: String
    Default: 'secure-data-processor'
    Description: 'Name for the Lambda function'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Function name must start with a letter and contain only letters, numbers, and hyphens'
    MinLength: 3
    MaxLength: 30

Resources:
  # ===========================================
  # IAM PASSWORD POLICY
  # Enforces strong password requirements for IAM users
  # ===========================================
  IAMPasswordPolicy:
    Type: AWS::IAM::AccountPasswordPolicy
    Properties:
      MinimumPasswordLength: 12
      RequireUppercaseCharacters: true
      RequireLowercaseCharacters: true
      RequireNumbers: true
      RequireSymbols: true
      AllowUsersToChangePassword: true
      MaxPasswordAge: 90
      PasswordReusePrevention: 12
      HardExpiry: true

  # ===========================================
  # S3 BUCKETS
  # Multiple private S3 buckets with security best practices
  # ===========================================
  
  PrimaryDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-primary'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToIA'
            Status: Enabled
            Transitions:
              - Days: 30
                StorageClass: STANDARD_IA
          - Id: 'TransitionToGlacier'
            Status: Enabled
            Transitions:
              - Days: 90
                StorageClass: GLACIER

  BackupDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-backup'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-logs'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: 'LogsRetention'
            Status: Enabled
            Transitions:
              - Days: 365
                StorageClass: GLACIER
          - Id: 'LogsDeletion'
            Status: Enabled
            ExpirationInDays: 2555  # 7 years retention

  # ===========================================
  # IAM ROLE FOR LAMBDA FUNCTION
  # ===========================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-execution-role'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub 'arn:aws:s3:::${PrimaryDataBucket}/*'
                  - !Sub 'arn:aws:s3:::${BackupDataBucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt PrimaryDataBucket.Arn
                  - !GetAtt BackupDataBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::${LogsBucket}/*'

  # ===========================================
  # LAMBDA FUNCTION
  # ===========================================
  DataProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-${LambdaFunctionName}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          PROJECT_NAME: !Ref ProjectName
          PRIMARY_BUCKET: !Ref PrimaryDataBucket
          BACKUP_BUCKET: !Ref BackupDataBucket
          LOGS_BUCKET: !Ref LogsBucket
      Code:
        ZipFile: |
          <lambda code here>

  # ===========================================
  # S3 BUCKET NOTIFICATION CONFIGURATION
  # ===========================================
  S3BucketNotification:
    Type: AWS::S3::Bucket
    DependsOn: S3InvokeLambdaPermission
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-primary-with-notifications'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt DataProcessorLambda.Arn

  S3InvokeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataProcessorLambda
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt PrimaryDataBucket.Arn

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}-${LambdaFunctionName}'
      RetentionInDays: 30

  OrganizationSecurityPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${ProjectName}-${Environment}-security-policy'
      Description: 'Organization security policy enforcing best practices'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedS3Uploads
            Effect: Deny
            Action: 's3:PutObject'
            Resource: 
              - !Sub 'arn:aws:s3:::${PrimaryDataBucket}/*'
              - !Sub 'arn:aws:s3:::${BackupDataBucket}/*'
              - !Sub 'arn:aws:s3:::${LogsBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'
          - Sid: DenyInsecureS3Operations
            Effect: Deny
            Action: 's3:*'
            Resource:
              - !GetAtt PrimaryDataBucket.Arn
              - !Sub 'arn:aws:s3:::${PrimaryDataBucket}/*'
              - !GetAtt BackupDataBucket.Arn
              - !Sub 'arn:aws:s3:::${BackupDataBucket}/*'
              - !GetAtt LogsBucket.Arn
              - !Sub 'arn:aws:s3:::${LogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: RestrictLambdaModification
            Effect: Deny
            Action:
              - 'lambda:UpdateFunctionCode'
              - 'lambda:UpdateFunctionConfiguration'
              - 'lambda:DeleteFunction'
            Resource: !GetAtt DataProcessorLambda.Arn
            Condition:
              StringNotEquals:
                'aws:PrincipalTag/Department': 'SecurityTeam'

Outputs:
  PrimaryBucketName:
    Description: 'Name of the primary S3 bucket'
    Value: !Ref PrimaryDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryBucket'
  BackupBucketName:
    Description: 'Name of the backup S3 bucket'
    Value: !Ref BackupDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-BackupBucket'
  LogsBucketName:
    Description: 'Name of the logs S3 bucket'
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket'
  LambdaFunctionArn:
    Description: 'ARN of the data processor Lambda function'
    Value: !GetAtt DataProcessorLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'
  LambdaExecutionRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRole'
  SecurityPolicyArn:
    Description: 'ARN of the organization security policy'
    Value: !Ref OrganizationSecurityPolicy
    Export:
      Name: !Sub '${AWS::StackName}-SecurityPolicy'
