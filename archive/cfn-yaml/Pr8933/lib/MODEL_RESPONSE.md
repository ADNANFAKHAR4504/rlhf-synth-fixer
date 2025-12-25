AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-environment web application infrastructure with S3, DynamoDB, IAM, CloudWatch, and SSM Parameter Store'

Parameters:
Environment:
Type: String
Default: development
AllowedValues: - development - testing - production
Description: Environment name for resource deployment

ApplicationName:
Type: String
Default: webapp
Description: Name of the web application

KMSKeyId:
Type: String
Default: alias/aws/ssm
Description: KMS Key ID for SSM Parameter encryption

LogRetentionDays:
Type: Number
Default: 30
AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
Description: CloudWatch log retention period in days

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

Resources:

# =====================================================

# S3 BUCKETS

# =====================================================

# Environment-specific S3 bucket

EnvironmentS3Bucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub '${ApplicationName}-${Environment}-${AWS::AccountId}-${AWS::Region}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
VersioningConfiguration:
Status: Enabled
LifecycleConfiguration:
Rules: - Id: TransitionToIA
Status: Enabled
Transition:
StorageClass: !FindInMap [EnvironmentConfig, !Ref Environment, S3StorageClass]
TransitionInDays: 30
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# Centralized shared configuration bucket (only created once)

SharedConfigBucket:
Type: AWS::S3::Bucket
Condition: IsProductionEnvironment
Properties:
BucketName: !Sub '${ApplicationName}-shared-config-${AWS::AccountId}-${AWS::Region}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
VersioningConfiguration:
Status: Enabled
Tags: - Key: Purpose
Value: SharedConfiguration - Key: Application
Value: !Ref ApplicationName

# =====================================================

# DYNAMODB TABLES

# =====================================================

# Environment-specific DynamoDB table

EnvironmentDynamoDBTable:
Type: AWS::DynamoDB::Table
Properties:
TableName: !Sub '${ApplicationName}-${Environment}-data'
BillingMode: !FindInMap [EnvironmentConfig, !Ref Environment, DynamoDBBillingMode]
AttributeDefinitions: - AttributeName: id
AttributeType: S - AttributeName: timestamp
AttributeType: N
KeySchema: - AttributeName: id
KeyType: HASH - AttributeName: timestamp
KeyType: RANGE
ProvisionedThroughput:
!If - IsProductionEnvironment - ReadCapacityUnits: 10
WriteCapacityUnits: 10 - !Ref AWS::NoValue
PointInTimeRecoverySpecification:
PointInTimeRecoveryEnabled: !If [IsProductionEnvironment, true, false]
SSESpecification:
SSEEnabled: true
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# =====================================================

# IAM ROLES AND POLICIES

# =====================================================

# Application execution role

ApplicationExecutionRole:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub '${ApplicationName}-${Environment}-execution-role'
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: - ec2.amazonaws.com - lambda.amazonaws.com - ecs-tasks.amazonaws.com
Action: sts:AssumeRole
ManagedPolicyArns: - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# Environment-specific S3 access policy

EnvironmentS3Policy:
Type: AWS::IAM::Policy
Properties:
PolicyName: !Sub '${ApplicationName}-${Environment}-s3-policy'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - s3:GetObject - s3:PutObject - s3:DeleteObject - s3:ListBucket
Resource: - !Sub '${EnvironmentS3Bucket}/*'
              - !GetAtt EnvironmentS3Bucket.Arn
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !If
                - IsProductionEnvironment
                - !Sub '${SharedConfigBucket}/_' - !Sub 'arn:aws:s3:::${ApplicationName}-shared-config-${AWS::AccountId}-${AWS::Region}/_' - !If - IsProductionEnvironment - !GetAtt SharedConfigBucket.Arn - !Sub 'arn:aws:s3:::${ApplicationName}-shared-config-${AWS::AccountId}-${AWS::Region}'
Roles: - !Ref ApplicationExecutionRole

# Environment-specific DynamoDB access policy

EnvironmentDynamoDBPolicy:
Type: AWS::IAM::Policy
Properties:
PolicyName: !Sub '${ApplicationName}-${Environment}-dynamodb-policy'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - dynamodb:GetItem - dynamodb:PutItem - dynamodb:UpdateItem - dynamodb:DeleteItem - dynamodb:Query - dynamodb:Scan
Resource: !GetAtt EnvironmentDynamoDBTable.Arn - Effect: Deny
Action: - dynamodb:_
Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ApplicationName}-_'
Condition:
StringNotEquals:
'dynamodb:TableName': !Sub '${ApplicationName}-${Environment}-data'
Roles: - !Ref ApplicationExecutionRole

# CloudWatch logs policy

CloudWatchLogsPolicy:
Type: AWS::IAM::Policy
Properties:
PolicyName: !Sub '${ApplicationName}-${Environment}-cloudwatch-policy'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - logs:CreateLogStream - logs:PutLogEvents - logs:DescribeLogGroups - logs:DescribeLogStreams
Resource: !Sub '${ApplicationLogGroup.Arn}:\*'
Roles: - !Ref ApplicationExecutionRole

# SSM Parameter Store policy

SSMParameterPolicy:
Type: AWS::IAM::Policy
Properties:
PolicyName: !Sub '${ApplicationName}-${Environment}-ssm-policy'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - ssm:GetParameter - ssm:GetParameters - ssm:GetParametersByPath
Resource: - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ApplicationName}/${Environment}/_' - Effect: Allow
Action: - kms:Decrypt
Resource: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/_'
Condition:
StringEquals:
'kms:ViaService': !Sub 'ssm.${AWS::Region}.amazonaws.com'
Roles: - !Ref ApplicationExecutionRole

# Instance profile for EC2 instances

ApplicationInstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
InstanceProfileName: !Sub '${ApplicationName}-${Environment}-instance-profile'
Roles: - !Ref ApplicationExecutionRole

# =====================================================

# CLOUDWATCH LOG GROUPS

# =====================================================

# Application log group

ApplicationLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}/application'
RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# Performance monitoring log group

PerformanceLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}/performance'
RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# Resource utilization log group

ResourceUtilizationLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/${ApplicationName}/${Environment}/resources'
RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
Tags: - Key: Environment
Value: !Ref Environment - Key: Application
Value: !Ref ApplicationName

# =====================================================

# SSM PARAMETER STORE

# =====================================================

# Database connection string (encrypted)

DatabaseConnectionParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/${ApplicationName}/${Environment}/database/connection-string'
Type: SecureString
Value: !Sub 'dynamodb://table=${ApplicationName}-${Environment}-data;region=${AWS::Region}'
KeyId: !Ref KMSKeyId
Description: !Sub 'Database connection string for ${Environment} environment'
Tags:
Environment: !Ref Environment
Application: !Ref ApplicationName

# API configuration (encrypted)

APIConfigParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/${ApplicationName}/${Environment}/api/config'
Type: SecureString
Value: !Sub |
{
"timeout": 30,
"retries": 3,
"environment": "${Environment}",
          "log_level": "${Environment == 'production' && 'INFO' || 'DEBUG'}"
}
KeyId: !Ref KMSKeyId
Description: !Sub 'API configuration for ${Environment} environment'
Tags:
Environment: !Ref Environment
Application: !Ref ApplicationName

# S3 bucket configuration

S3ConfigParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/${ApplicationName}/${Environment}/s3/bucket-name'
Type: String
Value: !Ref EnvironmentS3Bucket
Description: !Sub 'S3 bucket name for ${Environment} environment'
Tags:
Environment: !Ref Environment
Application: !Ref ApplicationName

# Shared configuration bucket parameter

SharedConfigParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/${ApplicationName}/${Environment}/s3/shared-config-bucket'
Type: String
Value: !If - IsProductionEnvironment - !Ref SharedConfigBucket - !Sub '${ApplicationName}-shared-config-${AWS::AccountId}-${AWS::Region}'
Description: 'Shared configuration S3 bucket name'
Tags:
Environment: !Ref Environment
Application: !Ref ApplicationName

# Application secrets (encrypted)

ApplicationSecretsParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/${ApplicationName}/${Environment}/secrets/app-key'
Type: SecureString
Value: !Sub 'secret-key-for-${Environment}-${AWS::AccountId}'
KeyId: !Ref KMSKeyId
Description: !Sub 'Application secrets for ${Environment} environment'
Tags:
Environment: !Ref Environment
Application: !Ref ApplicationName

# =====================================================

# CONDITIONS

# =====================================================

Conditions:
IsProductionEnvironment: !Equals [!Ref Environment, 'production']
IsDevelopmentEnvironment: !Equals [!Ref Environment, 'development']
IsTestingEnvironment: !Equals [!Ref Environment, 'testing']

# =====================================================

# OUTPUTS

# =====================================================

Outputs:
EnvironmentS3Bucket:
Description: Environment-specific S3 bucket name
Value: !Ref EnvironmentS3Bucket
Export:
Name: !Sub '${AWS::StackName}-S3Bucket'

SharedConfigBucket:
Description: Shared configuration S3 bucket name
Value: !If - IsProductionEnvironment - !Ref SharedConfigBucket - !Sub '${ApplicationName}-shared-config-${AWS::AccountId}-${AWS::Region}'
    Export:
      Name: !Sub '${AWS::StackName}-SharedConfigBucket'

DynamoDBTableName:
Description: Environment-specific DynamoDB table name
Value: !Ref EnvironmentDynamoDBTable
Export:
Name: !Sub '${AWS::StackName}-DynamoDBTable'

ApplicationExecutionRoleArn:
Description: ARN of the application execution role
Value: !GetAtt ApplicationExecutionRole.Arn
Export:
Name: !Sub '${AWS::StackName}-ExecutionRoleArn'

ApplicationLogGroupName:
Description: CloudWatch log group name for application logs
Value: !Ref ApplicationLogGroup
Export:
Name: !Sub '${AWS::StackName}-LogGroup'

SSMParameterPrefix:
Description: SSM Parameter Store prefix for this environment
Value: !Sub '/${ApplicationName}/${Environment}/'
Export:
Name: !Sub '${AWS::StackName}-SSMPrefix'

InstanceProfileArn:
Description: Instance profile ARN for EC2 instances
Value: !GetAtt ApplicationInstanceProfile.Arn
Export:
Name: !Sub '${AWS::StackName}-InstanceProfile'Insert here the Model Response that failed
