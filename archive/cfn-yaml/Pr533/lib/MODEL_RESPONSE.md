AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available serverless application infrastructure with Lambda, S3, Secrets Manager, and CloudWatch monitoring'

Parameters:
Environment:
Type: String
Default: 'prod'
Description: 'Environment name for resource tagging'
AllowedValues: - dev - staging - prod

LambdaTimeout:
Type: Number
Default: 30
MinValue: 3
MaxValue: 900
Description: 'Lambda function timeout in seconds'

LambdaMemorySize:
Type: Number
Default: 256
MinValue: 128
MaxValue: 10240
Description: 'Lambda function memory size in MB'

Resources:

# S3 Bucket for triggering Lambda

ServerlessAppS3Bucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub 'serverlessapp-trigger-bucket-${AWS::AccountId}-${AWS::Region}'
VersioningConfiguration:
Status: Enabled
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
BucketKeyEnabled: true
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
NotificationConfiguration:
LambdaConfigurations: - Event: s3:ObjectCreated:\*
Function: !GetAtt ServerlessAppLambda.Arn
Filter:
S3Key:
Rules: - Name: prefix
Value: 'uploads/'
Tags: - Key: Name
Value: ServerlessAppS3Bucket - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# S3 Bucket Policy for secure access

ServerlessAppS3BucketPolicy:
Type: AWS::S3::BucketPolicy
Properties:
Bucket: !Ref ServerlessAppS3Bucket
PolicyDocument:
Version: '2012-10-17'
Statement: - Sid: DenyInsecureConnections
Effect: Deny
Principal: '_'
Action: 's3:_'
Resource: - !Sub '${ServerlessAppS3Bucket}/\*' - !Ref ServerlessAppS3Bucket
Condition:
Bool:
'aws:SecureTransport': 'false'

# Secrets Manager Secret

ServerlessAppSecret:
Type: AWS::SecretsManager::Secret
Properties:
Name: !Sub 'ServerlessApp/Config/${Environment}'
Description: 'Sensitive configuration for ServerlessApp Lambda function'
GenerateSecretString:
SecretStringTemplate: '{"database_host": "example.com", "api_key": ""}'
GenerateStringKey: 'api_key'
PasswordLength: 32
ExcludeCharacters: '"@/\'
Tags: - Key: Name
Value: ServerlessAppSecret - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# IAM Role for Lambda

ServerlessAppLambdaRole:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub 'ServerlessAppLambdaRole-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: ServerlessAppLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${ServerlessAppS3Bucket}/uploads/_' - Effect: Allow
Action: - secretsmanager:GetSecretValue
Resource: !Ref ServerlessAppSecret - Effect: Allow
Action: - logs:CreateLogGroup - logs:CreateLogStream - logs:PutLogEvents
Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/ServerlessAppLambda_'
Tags: - Key: Name
Value: ServerlessAppLambdaRole - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# Lambda Function

ServerlessAppLambda:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub 'ServerlessAppLambda-${Environment}'
Runtime: python3.9
Handler: index.lambda_handler
Role: !GetAtt ServerlessAppLambdaRole.Arn
Timeout: !Ref LambdaTimeout
MemorySize: !Ref LambdaMemorySize
ReservedConcurrencyLimit: 100
DeadLetterQueue:
TargetArn: !GetAtt ServerlessAppDLQ.Arn
Environment:
Variables:
SECRET_NAME: !Ref ServerlessAppSecret
ENVIRONMENT: !Ref Environment
REGION: !Ref AWS::Region
Code:
ZipFile: |
import json
import boto3
import logging
import os
from urllib.parse import unquote_plus

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          # Initialize AWS clients
          s3_client = boto3.client('s3')
          secrets_client = boto3.client('secretsmanager')

          def get_secret():
              """Retrieve secret from AWS Secrets Manager"""
              try:
                  secret_name = os.environ['SECRET_NAME']
                  response = secrets_client.get_secret_value(SecretId=secret_name)
                  return json.loads(response['SecretString'])
              except Exception as e:
                  logger.error(f"Error retrieving secret: {str(e)}")
                  raise

          def lambda_handler(event, context):
              """Main Lambda handler for S3 object creation events"""
              try:
                  # Get secrets
                  secrets = get_secret()
                  logger.info("Successfully retrieved secrets")

                  # Process S3 event
                  for record in event['Records']:
                      bucket = record['s3']['bucket']['name']
                      key = unquote_plus(record['s3']['object']['key'])

                      logger.info(f"Processing file: {key} from bucket: {bucket}")

                      # Get object metadata
                      response = s3_client.head_object(Bucket=bucket, Key=key)
                      file_size = response['ContentLength']

                      logger.info(f"File size: {file_size} bytes")

                      # Your business logic here
                      # Example: Process the uploaded file

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Successfully processed S3 event',
                          'processed_files': len(event['Records'])
                      })
                  }

              except Exception as e:
                  logger.error(f"Error processing event: {str(e)}")
                  raise
      Tags:
        - Key: Name
          Value: ServerlessAppLambda
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: ServerlessApp

# Lambda Permission for S3 to invoke

ServerlessAppLambdaPermission:
Type: AWS::Lambda::Permission
Properties:
FunctionName: !Ref ServerlessAppLambda
Action: lambda:InvokeFunction
Principal: s3.amazonaws.com
SourceArn: !Sub '${ServerlessAppS3Bucket}/\*'

# Dead Letter Queue for Lambda

ServerlessAppDLQ:
Type: AWS::SQS::Queue
Properties:
QueueName: !Sub 'ServerlessAppDLQ-${Environment}'
MessageRetentionPeriod: 1209600 # 14 days
VisibilityTimeoutSeconds: 60
Tags: - Key: Name
Value: ServerlessAppDLQ - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# CloudWatch Log Group for Lambda

ServerlessAppLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/lambda/ServerlessAppLambda-${Environment}'
RetentionInDays: 30
Tags: - Key: Name
Value: ServerlessAppLogGroup - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# CloudWatch Alarm for Lambda Errors

ServerlessAppErrorAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub 'ServerlessAppErrorAlarm-${Environment}'
AlarmDescription: 'Alarm for Lambda function errors'
MetricName: Errors
Namespace: AWS/Lambda
Statistic: Sum
Period: 300
EvaluationPeriods: 2
Threshold: 5
ComparisonOperator: GreaterThanOrEqualToThreshold
Dimensions: - Name: FunctionName
Value: !Ref ServerlessAppLambda
AlarmActions: - !Ref ServerlessAppSNSTopic
TreatMissingData: notBreaching
Tags: - Key: Name
Value: ServerlessAppErrorAlarm - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# CloudWatch Alarm for Lambda Duration

ServerlessAppDurationAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub 'ServerlessAppDurationAlarm-${Environment}'
AlarmDescription: 'Alarm for Lambda function duration'
MetricName: Duration
Namespace: AWS/Lambda
Statistic: Average
Period: 300
EvaluationPeriods: 2
Threshold: 25000 # 25 seconds
ComparisonOperator: GreaterThanThreshold
Dimensions: - Name: FunctionName
Value: !Ref ServerlessAppLambda
AlarmActions: - !Ref ServerlessAppSNSTopic
TreatMissingData: notBreaching
Tags: - Key: Name
Value: ServerlessAppDurationAlarm - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# CloudWatch Alarm for Lambda Invocations

ServerlessAppInvocationAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub 'ServerlessAppInvocationAlarm-${Environment}'
AlarmDescription: 'Alarm for high Lambda invocation count'
MetricName: Invocations
Namespace: AWS/Lambda
Statistic: Sum
Period: 300
EvaluationPeriods: 2
Threshold: 1000
ComparisonOperator: GreaterThanThreshold
Dimensions: - Name: FunctionName
Value: !Ref ServerlessAppLambda
AlarmActions: - !Ref ServerlessAppSNSTopic
TreatMissingData: notBreaching
Tags: - Key: Name
Value: ServerlessAppInvocationAlarm - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# SNS Topic for CloudWatch Alarms

ServerlessAppSNSTopic:
Type: AWS::SNS::Topic
Properties:
TopicName: !Sub 'ServerlessAppAlerts-${Environment}'
DisplayName: 'ServerlessApp CloudWatch Alerts'
Tags: - Key: Name
Value: ServerlessAppSNSTopic - Key: Environment
Value: !Ref Environment - Key: Project
Value: ServerlessApp

# CloudWatch Dashboard

ServerlessAppDashboard:
Type: AWS::CloudWatch::Dashboard
Properties:
DashboardName: !Sub 'ServerlessAppDashboard-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${ServerlessAppLambda}" ],
[ ".", "Errors", ".", "." ],
[ ".", "Duration", ".", "." ]
],
"view": "timeSeries",
"stacked": false,
"region": "${AWS::Region}",
                "title": "Lambda Metrics",
                "period": 300
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/S3", "NumberOfObjects", "BucketName", "${ServerlessAppS3Bucket}", "StorageType", "AllStorageTypes" ]
],
"view": "timeSeries",
"stacked": false,
"region": "${AWS::Region}",
"title": "S3 Object Count",
"period": 86400
}
}
]
}

Outputs:
LambdaFunctionName:
Description: 'Name of the Lambda function'
Value: !Ref ServerlessAppLambda
Export:
Name: !Sub '${AWS::StackName}-LambdaFunction'

S3BucketName:
Description: 'Name of the S3 bucket'
Value: !Ref ServerlessAppS3Bucket
Export:
Name: !Sub '${AWS::StackName}-S3Bucket'

SecretArn:
Description: 'ARN of the Secrets Manager secret'
Value: !Ref ServerlessAppSecret
Export:
Name: !Sub '${AWS::StackName}-Secret'

LambdaRoleArn:
Description: 'ARN of the Lambda execution role'
Value: !GetAtt ServerlessAppLambdaRole.Arn
Export:
Name: !Sub '${AWS::StackName}-LambdaRole'

SNSTopicArn:
Description: 'ARN of the SNS topic for alerts'
Value: !Ref ServerlessAppSNSTopic
Export:
Name: !Sub '${AWS::StackName}-SNSTopic'

DashboardURL:
Description: 'URL to the CloudWatch Dashboard'
Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ServerlessAppDashboard}'
    Export:
      Name: !Sub '${AWS::StackName}-Dashboard'
