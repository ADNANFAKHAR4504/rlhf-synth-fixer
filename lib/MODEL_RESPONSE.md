AWSTemplateFormatVersion: '2010-09-09'
Description: 'ServerlessApp - S3-triggered Lambda with Secrets Manager, HA design, IAM least privilege, and CloudWatch monitoring'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - Environment
          - ProjectName
      - Label:
          default: "Lambda Configuration"
        Parameters:
          - LambdaRuntime
          - LambdaTimeout
    ParameterLabels:
      Environment:
        default: "Deployment Environment"
      ProjectName:
        default: "Project Name"
      LambdaRuntime:
        default: "Lambda Runtime Version"
      LambdaTimeout:
        default: "Lambda Timeout (seconds)"

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - dev
      - staging
      - prod
    Description: 'Environment for the deployment'

  ProjectName:
    Type: String
    Default: 'ServerlessApp'
    Description: 'Name of the project'

  LambdaRuntime:
    Type: String
    Default: 'python3.11'
    AllowedValues:
      - python3.9
      - python3.10
      - python3.11
      - nodejs18.x
      - nodejs20.x
    Description: 'Runtime for the Lambda function'

  LambdaTimeout:
    Type: Number
    Default: 30
    MinValue: 3
    MaxValue: 900
    Description: 'Timeout for Lambda function in seconds'

Resources:
  # S3 Bucket for triggering Lambda
  ServerlessAppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-bucket-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ServerlessAppLambda.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # S3 Bucket Policy
  ServerlessAppBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ServerlessAppBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ServerlessAppBucket}/*'
              - !Ref ServerlessAppBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowLambdaReadAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt ServerlessAppLambdaExecutionRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
            Resource: !Sub '${ServerlessAppBucket}/*'

  # Secrets Manager Secret
  ServerlessAppSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-secret-${Environment}'
      Description: 'Sensitive configuration data for ServerlessApp'
      SecretString: !Sub |
        {
          "api_key": "your-api-key-here",
          "database_url": "your-database-url-here",
          "external_service_token": "your-token-here"
        }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secret'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # IAM Role for Lambda Execution
  ServerlessAppLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-execution-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: !Sub '${ProjectName}-lambda-policy-${Environment}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ReadAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${ServerlessAppBucket}/*'
              - Sid: SecretsManagerReadAccess
                Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref ServerlessAppSecret
              - Sid: CloudWatchLogsAccess
                Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-lambda-${Environment}*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-execution-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # CloudWatch Log Group for Lambda
  ServerlessAppLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-lambda-${Environment}'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Lambda Function
  ServerlessAppLambda:
    Type: AWS::Lambda::Function
    DependsOn: ServerlessAppLambdaLogGroup
    Properties:
      FunctionName: !Sub '${ProjectName}-lambda-${Environment}'
      Runtime: !Ref LambdaRuntime
      Handler: 'index.lambda_handler'
      Role: !GetAtt ServerlessAppLambdaExecutionRole.Arn
      Timeout: !Ref LambdaTimeout
      MemorySize: 256
      ReservedConcurrencyLimit: 10
      Environment:
        Variables:
          SECRET_NAME: !Ref ServerlessAppSecret
          ENVIRONMENT: !Ref Environment
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from urllib.parse import unquote_plus

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

          # Initialize AWS clients
          s3_client = boto3.client('s3')
          secrets_client = boto3.client('secretsmanager')

          def lambda_handler(event, context):
              """
              Lambda function triggered by S3 object creation events.
              Retrieves secrets from Secrets Manager and processes the uploaded file.
              """
              try:
                  logger.info(f"Received event: {json.dumps(event)}")

                  # Get secret from Secrets Manager
                  secret_name = os.environ['SECRET_NAME']
                  secret_response = secrets_client.get_secret_value(SecretId=secret_name)
                  secrets = json.loads(secret_response['SecretString'])
                  logger.info("Successfully retrieved secrets from Secrets Manager")

                  # Process S3 event
                  for record in event['Records']:
                      bucket_name = record['s3']['bucket']['name']
                      object_key = unquote_plus(record['s3']['object']['key'])

                      logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")

                      # Get object from S3
                      response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
                      content = response['Body'].read()

                      logger.info(f"Successfully processed file {object_key}, size: {len(content)} bytes")

                      # Here you would implement your business logic
                      # For example, process the file content, call external APIs using secrets, etc.

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Successfully processed S3 event',
                          'processed_files': len(event['Records'])
                      })
                  }

              except Exception as e:
                  logger.error(f"Error processing S3 event: {str(e)}")
                  raise e

      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Lambda Permission for S3 to invoke the function
  ServerlessAppLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ServerlessAppLambda
      Action: 'lambda:InvokeFunction'
      Principal: 's3.amazonaws.com'
      SourceArn: !Sub '${ServerlessAppBucket}/*'

  # CloudWatch Alarm for Lambda Invocation Count
  ServerlessAppLambdaInvocationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-invocation-count-${Environment}'
      AlarmDescription: 'Monitor Lambda invocation count'
      MetricName: Invocations
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-invocation-alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # CloudWatch Alarm for Lambda Error Count
  ServerlessAppLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-error-count-${Environment}'
      AlarmDescription: 'Monitor Lambda error count'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-error-alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # CloudWatch Alarm for Lambda Duration
  ServerlessAppLambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-duration-${Environment}'
      AlarmDescription: 'Monitor Lambda execution duration'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000  # 25 seconds (adjust based on your timeout)
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-duration-alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

Outputs:
  ServerlessAppBucketName:
    Description: 'Name of the S3 bucket'
    Value: !Ref ServerlessAppBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  ServerlessAppLambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref ServerlessAppLambda
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  ServerlessAppLambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt ServerlessAppLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  ServerlessAppSecretArn:
    Description: 'ARN of the Secrets Manager secret'
    Value: !Ref ServerlessAppSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretArn'

  ServerlessAppLambdaExecutionRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt ServerlessAppLambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleArn'