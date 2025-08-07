# AWS CloudFormation Template for Secure Infrastructure Deployment

Below is a comprehensive CloudFormation YAML template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure infrastructure deployment with S3 buckets, IAM policies, and Lambda function'

# Template Parameters for flexibility and reusability
Parameters:
  ProjectName:
    Type: String
    Default: 'myproject'
    Description: 'Project name used in resource naming convention'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
  
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name (dev, staging, or prod)'
  
  LambdaFunctionName:
    Type: String
    Default: 'secure-data-processor'
    Description: 'Name for the Lambda function'

# Global template metadata
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - Environment
          - LambdaFunctionName

Resources:
  # ========================================
  # IAM PASSWORD POLICY CONFIGURATION
  # ========================================
  # Custom resource to manage account password policy since CloudFormation doesn't natively support it
  PasswordPolicyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-password-policy-role'
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
        - PolicyName: PasswordPolicyManagement
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:UpdateAccountPasswordPolicy
                  - iam:GetAccountPasswordPolicy
                Resource: '*'

  # Lambda function to set IAM password policy
  PasswordPolicyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-password-policy-manager'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt PasswordPolicyRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import json
          
          def lambda_handler(event, context):
              """
              Custom resource handler to manage IAM account password policy
              Ensures passwords meet organizational security requirements
              """
              try:
                  iam = boto3.client('iam')
                  
                  if event['RequestType'] in ['Create', 'Update']:
                      # Set password policy with required complexity
                      iam.update_account_password_policy(
                          MinimumPasswordLength=12,
                          RequireSymbols=True,
                          RequireNumbers=True,
                          RequireUppercaseCharacters=True,
                          RequireLowercaseCharacters=True,
                          AllowUsersToChangePassword=True,
                          MaxPasswordAge=90,
                          PasswordReusePrevention=12
                      )
                      print("Password policy updated successfully")
                  
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  # Custom resource to trigger password policy setup
  PasswordPolicyCustomResource:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt PasswordPolicyFunction.Arn

  # ========================================
  # S3 BUCKETS CONFIGURATION
  # ========================================
  # Primary data bucket - completely private with encryption
  PrimaryDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-primary'
      # Block all public access by default
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Server-side encryption configuration
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      # Lifecycle configuration to manage costs
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1

  # Secondary backup bucket with similar security configuration
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
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER

  # Logging bucket for audit trails
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-s3bucket-logs'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      # Longer retention for compliance
      LifecycleConfiguration:
        Rules:
          - Id: LogRetention
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE

  # ========================================
  # IAM ROLES AND POLICIES FOR LAMBDA
  # ========================================
  # Execution role for the data processing Lambda function
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
              # Read access to primary bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${PrimaryDataBucket}/*'
              # Write access to backup bucket
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${BackupDataBucket}/*'
              # List bucket permissions
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: 
                  - !GetAtt PrimaryDataBucket.Arn
                  - !GetAtt BackupDataBucket.Arn
              # CloudWatch Logs permissions for secure logging
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  # ========================================
  # LAMBDA FUNCTION FOR SECURE DATA PROCESSING
  # ========================================
  SecureDataProcessor:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-${LambdaFunctionName}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 512
      # Environment variables (non-sensitive configuration only)
      Environment:
        Variables:
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT: !Ref Environment
          PRIMARY_BUCKET: !Ref PrimaryDataBucket
          BACKUP_BUCKET: !Ref BackupDataBucket
          LOG_LEVEL: 'INFO'
      Code:
        ZipFile: |
          import boto3
          import json
          import os
          import logging
          from datetime import datetime
          
          # Configure logging to avoid sensitive data exposure
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          # Sensitive environment variables that should never be logged
          SENSITIVE_VARS = {
              'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
              'AWS_SECURITY_TOKEN', 'DATABASE_PASSWORD', 'API_KEY'
          }
          
          def lambda_handler(event, context):
              """
              Secure data processor that handles data transformation
              while ensuring sensitive environment variables are not logged
              """
              try:
                  # Log function start (excluding sensitive information)
                  logger.info(f"Starting data processing for project: {os.environ.get('PROJECT_NAME')}")
                  
                  # Initialize AWS clients
                  s3_client = boto3.client('s3')
                  
                  # Get configuration from environment (non-sensitive only)
                  primary_bucket = os.environ.get('PRIMARY_BUCKET')
                  backup_bucket = os.environ.get('BACKUP_BUCKET')
                  
                  # Validate required environment variables exist (without logging their values)
                  required_vars = ['PRIMARY_BUCKET', 'BACKUP_BUCKET', 'PROJECT_NAME']
                  missing_vars = [var for var in required_vars if not os.environ.get(var)]
                  
                  if missing_vars:
                      logger.error(f"Missing required environment variables: {missing_vars}")
                      return {
                          'statusCode': 400,
                          'body': json.dumps({'error': 'Missing required configuration'})
                      }
                  
                  # Process the event data
                  processed_data = process_secure_data(event, s3_client, primary_bucket, backup_bucket)
                  
                  logger.info("Data processing completed successfully")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'timestamp': datetime.utcnow().isoformat(),
                          'processed_items': len(processed_data) if processed_data else 0
                      })
                  }
                  
              except Exception as e:
                  # Log error without exposing sensitive information
                  error_msg = str(e)
                  # Filter out any potential sensitive data from error messages
                  filtered_error = filter_sensitive_data(error_msg)
                  logger.error(f"Error processing data: {filtered_error}")
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Internal processing error'})
                  }
          
          def process_secure_data(event, s3_client, primary_bucket, backup_bucket):
              """
              Process data securely without exposing sensitive information in logs
              """
              processed_items = []
              
              # Example processing logic
              if 'Records' in event:
                  for record in event['Records']:
                      # Process S3 events securely
                      if 's3' in record:
                          bucket_name = record['s3']['bucket']['name']
                          object_key = record['s3']['object']['key']
                          
                          # Log processing activity (without sensitive data)
                          logger.info(f"Processing object from bucket (key length: {len(object_key)})")
                          
                          # Perform secure data processing here
                          processed_items.append({
                              'bucket': bucket_name,
                              'processed_at': datetime.utcnow().isoformat()
                          })
              
              return processed_items
          
          def filter_sensitive_data(text):
              """
              Filter out potential sensitive data from log messages
              """
              # Remove any potential AWS credentials or sensitive patterns
              import re
              
              # Pattern to match potential AWS access keys
              text = re.sub(r'AKIA[0-9A-Z]{16}', '[FILTERED_ACCESS_KEY]', text)
              # Pattern to match potential secret keys
              text = re.sub(r'[A-Za-z0-9/+=]{40}', '[FILTERED_SECRET]', text)
              
              # Filter environment variable values for known sensitive vars
              for var in SENSITIVE_VARS:
                  if var in os.environ:
                      text = text.replace(os.environ[var], f'[FILTERED_{var}]')
              
              return text

  # ========================================
  # CLOUDWATCH LOG GROUP FOR LAMBDA
  # ========================================
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}-${LambdaFunctionName}'
      RetentionInDays: 14

# ========================================
# OUTPUTS SECTION
# ========================================
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
  
  LoggingBucketName:
    Description: 'Name of the logging S3 bucket'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'
  
  LambdaFunctionArn:
    Description: 'ARN of the secure data processing Lambda function'
    Value: !GetAtt SecureDataProcessor.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'
  
  LambdaExecutionRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRoleArn'
```

## Key Features and Security Implementations

### 🔐 **Security Compliance**

1. **S3 Bucket Security:**
   - All buckets are private by default with `PublicAccessBlockConfiguration`
   - Server-side encryption enabled (AES256)
   - Versioning enabled for data protection
   - Lifecycle policies for cost optimization

2. **IAM Password Policy:**
   - Minimum 12 characters
   - Requires uppercase, lowercase, numbers, and symbols
   - Implemented via custom Lambda resource since CloudFormation doesn't natively support password policies

3. **Lambda Security:**
   - Sensitive environment variables (AWS credentials) are never logged
   - Custom filtering function removes sensitive data from error messages
   - Principle of least privilege for IAM roles

### 📝 **Naming Convention**

All resources follow the `<projectName>-<environment>-s3bucket` pattern:
- Primary bucket: `myproject-dev-s3bucket-primary`
- Backup bucket: `myproject-dev-s3bucket-backup`
- Logging bucket: `myproject-dev-s3bucket-logs`

### 🚀 **Deployment Instructions**

1. Save the template as `secure-infrastructure.yml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://secure-infrastructure.yml \
  --parameters ParameterKey=ProjectName,ParameterValue=myproject \
               ParameterKey=Environment,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 🔍 **Monitoring and Logging**

- CloudWatch log groups with 14-day retention
- Structured logging without sensitive data exposure
- Error handling with filtered messages

This template provides a production-ready, secure infrastructure foundation that meets all specified requirements while following AWS best practices.