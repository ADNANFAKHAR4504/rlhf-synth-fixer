```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready serverless healthcare application backend with DynamoDB, Lambda, SQS, and SNS'

# ============================================================================
# PARAMETERS
# ============================================================================
Parameters:
  ProjectName:
    Type: String
    Default: 'ServerlessHealthcareApp'
    Description: 'Project name used as prefix for all resources'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Must start with a letter and contain only alphanumeric characters and hyphens'

# ============================================================================
# RESOURCES
# ============================================================================
Resources:
  # --------------------------------------------------------------------------
  # DynamoDB Table
  # --------------------------------------------------------------------------
  PatientDataTable:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: !Sub '${ProjectName}-PatientDataTable'
      BillingMode: 'PAY_PER_REQUEST'
      AttributeDefinitions:
        - AttributeName: 'PatientID'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'PatientID'
          KeyType: 'HASH'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        # Uses AWS managed key by default
      DeletionProtectionEnabled: true
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # --------------------------------------------------------------------------
  # SQS Queue
  # --------------------------------------------------------------------------
  AnalyticsTaskQueue:
    Type: 'AWS::SQS::Queue'
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue'
      VisibilityTimeoutSeconds: 300
      MessageRetentionPeriod: 1209600  # 14 days
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt AnalyticsTaskQueueDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: 'alias/aws/sqs'  # Server-side encryption
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # Dead Letter Queue for failed analytics processing
  AnalyticsTaskQueueDLQ:
    Type: 'AWS::SQS::Queue'
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue-DLQ'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: 'alias/aws/sqs'
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # --------------------------------------------------------------------------
  # SNS Topic
  # --------------------------------------------------------------------------
  PatientUpdatesTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      TopicName: !Sub '${ProjectName}-PatientUpdatesTopic'
      DisplayName: 'Patient Updates Notifications'
      KmsMasterKeyId: 'alias/aws/sns'  # Server-side encryption
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # --------------------------------------------------------------------------
  # IAM Roles for Lambda Functions
  # --------------------------------------------------------------------------

  # Role for ProcessPatientDataFunction
  ProcessPatientDataRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-ProcessPatientDataRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'DynamoDBPutItemPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'dynamodb:PutItem'
                Resource: !GetAtt PatientDataTable.Arn
        - PolicyName: 'SQSSendMessagePolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt AnalyticsTaskQueue.Arn
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName

  # Role for AnalyticsProcessingFunction
  AnalyticsProcessingRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-AnalyticsProcessingRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'SQSReceiveMessagePolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'sqs:ReceiveMessage'
                  - 'sqs:DeleteMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt AnalyticsTaskQueue.Arn
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName

  # Role for SendNotificationFunction
  SendNotificationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-SendNotificationRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'SNSPublishPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'sns:Publish'
                Resource: !Ref PatientUpdatesTopic
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName

  # --------------------------------------------------------------------------
  # Lambda Functions
  # --------------------------------------------------------------------------

  # Function 1: Process Patient Data
  ProcessPatientDataFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${ProjectName}-ProcessPatientDataFunction'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt ProcessPatientDataRole.Arn
      Timeout: 30
      MemorySize: 256
      ReservedConcurrencyLimit: 100
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref PatientDataTable
          SQS_QUEUE_URL: !Ref AnalyticsTaskQueue
          AWS_REGION: !Ref 'AWS::Region'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime

          dynamodb = boto3.resource('dynamodb')
          sqs = boto3.client('sqs')

          def lambda_handler(event, context):
              try:
                  # Get environment variables
                  table_name = os.environ['DYNAMODB_TABLE_NAME']
                  queue_url = os.environ['SQS_QUEUE_URL']

                  # Parse the incoming event
                  body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

                  # Generate PatientID if not provided
                  patient_id = body.get('PatientID', str(uuid.uuid4()))

                  # Prepare patient data
                  patient_data = {
                      'PatientID': patient_id,
                      'Name': body.get('Name', 'Unknown'),
                      'Age': body.get('Age', 0),
                      'Condition': body.get('Condition', 'Not specified'),
                      'Timestamp': datetime.utcnow().isoformat(),
                      'Status': 'Active'
                  }

                  # Write to DynamoDB
                  table = dynamodb.Table(table_name)
                  table.put_item(Item=patient_data)

                  # Send message to SQS for analytics processing
                  sqs.send_message(
                      QueueUrl=queue_url,
                      MessageBody=json.dumps({
                          'PatientID': patient_id,
                          'Action': 'ProcessAnalytics',
                          'Timestamp': patient_data['Timestamp']
                      })
                  )

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Patient data processed successfully',
                          'PatientID': patient_id
                      })
                  }

              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Failed to process patient data'
                      })
                  }
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # Function 2: Analytics Processing
  AnalyticsProcessingFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${ProjectName}-AnalyticsProcessingFunction'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt AnalyticsProcessingRole.Arn
      Timeout: 300
      MemorySize: 512
      ReservedConcurrencyLimit: 50
      Code:
        ZipFile: |
          import json
          import boto3
          from datetime import datetime

          def lambda_handler(event, context):
              try:
                  processed_records = []

                  # Process each SQS record
                  for record in event['Records']:
                      message_body = json.loads(record['body'])
                      patient_id = message_body.get('PatientID')
                      action = message_body.get('Action')

                      print(f"Processing analytics for Patient ID: {patient_id}")
                      print(f"Action: {action}")

                      # Simulate analytics processing
                      analytics_result = {
                          'PatientID': patient_id,
                          'AnalyticsType': 'HealthMetrics',
                          'ProcessedAt': datetime.utcnow().isoformat(),
                          'Status': 'Completed',
                          'Insights': {
                              'RiskScore': 'Low',
                              'RecommendedActions': ['Regular checkup', 'Maintain current treatment']
                          }
                      }

                      processed_records.append(analytics_result)
                      print(f"Analytics completed for Patient ID: {patient_id}")

                  return {
                      'statusCode': 200,
                      'processedRecords': len(processed_records),
                      'results': processed_records
                  }

              except Exception as e:
                  print(f"Error processing analytics: {str(e)}")
                  raise e

  # Function 3: Send Notification
  SendNotificationFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${ProjectName}-SendNotificationFunction'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt SendNotificationRole.Arn
      Timeout: 30
      MemorySize: 256
      ReservedConcurrencyLimit: 100
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref PatientUpdatesTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          sns = boto3.client('sns')

          def lambda_handler(event, context):
              try:
                  topic_arn = os.environ['SNS_TOPIC_ARN']

                  # Process each SNS record
                  for record in event['Records']:
                      sns_message = json.loads(record['Sns']['Message'])

                      # Prepare notification message
                      notification = {
                          'NotificationType': 'PatientUpdate',
                          'PatientID': sns_message.get('PatientID', 'Unknown'),
                          'Message': sns_message.get('Message', 'Patient data updated'),
                          'Timestamp': datetime.utcnow().isoformat(),
                          'Priority': sns_message.get('Priority', 'Normal')
                      }

                      # Send notification
                      response = sns.publish(
                          TopicArn=topic_arn,
                          Message=json.dumps(notification),
                          Subject=f"Healthcare App: {notification['NotificationType']}"
                      )

                      print(f"Notification sent. MessageId: {response['MessageId']}")

                  return {
                      'statusCode': 200,
                      'message': 'Notifications sent successfully'
                  }

              except Exception as e:
                  print(f"Error sending notification: {str(e)}")
                  return {
                      'statusCode': 500,
                      'error': str(e)
                  }
      Tags:
        - Key: 'Project'
          Value: !Ref ProjectName
        - Key: 'Environment'
          Value: 'Production'

  # --------------------------------------------------------------------------
  # Event Source Mappings
  # --------------------------------------------------------------------------

  # SQS trigger for Analytics Processing Function
  AnalyticsProcessingEventSourceMapping:
    Type: 'AWS::Lambda::EventSourceMapping'
    Properties:
      EventSourceArn: !GetAtt AnalyticsTaskQueue.Arn
      FunctionName: !GetAtt AnalyticsProcessingFunction.Arn
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5
      Enabled: true

  # SNS subscription for Send Notification Function
  SendNotificationSubscription:
    Type: 'AWS::SNS::Subscription'
    Properties:
      TopicArn: !Ref PatientUpdatesTopic
      Protocol: 'lambda'
      Endpoint: !GetAtt SendNotificationFunction.Arn

  # Lambda permission for SNS to invoke SendNotificationFunction
  SendNotificationLambdaPermission:
    Type: 'AWS::Lambda::Permission'
    Properties:
      FunctionName: !Ref SendNotificationFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'sns.amazonaws.com'
      SourceArn: !Ref PatientUpdatesTopic

# ============================================================================
# OUTPUTS
# ============================================================================
Outputs:
  # DynamoDB Table
  PatientDataTableName:
    Description: 'Name of the DynamoDB table for patient data'
    Value: !Ref PatientDataTable
    Export:
      Name: !Sub '${ProjectName}-PatientDataTableName'

  PatientDataTableArn:
    Description: 'ARN of the DynamoDB table for patient data'
    Value: !GetAtt PatientDataTable.Arn
    Export:
      Name: !Sub '${ProjectName}-PatientDataTableArn'

  # SQS Queue
  AnalyticsTaskQueueUrl:
    Description: 'URL of the SQS queue for analytics tasks'
    Value: !Ref AnalyticsTaskQueue
    Export:
      Name: !Sub '${ProjectName}-AnalyticsTaskQueueUrl'

  AnalyticsTaskQueueArn:
    Description: 'ARN of the SQS queue for analytics tasks'
    Value: !GetAtt AnalyticsTaskQueue.Arn
    Export:
      Name: !Sub '${ProjectName}-AnalyticsTaskQueueArn'

  # SNS Topic
  PatientUpdatesTopicArn:
    Description: 'ARN of the SNS topic for patient updates'
    Value: !Ref PatientUpdatesTopic
    Export:
      Name: !Sub '${ProjectName}-PatientUpdatesTopicArn'

  # Lambda Functions
  ProcessPatientDataFunctionArn:
    Description: 'ARN of the ProcessPatientDataFunction'
    Value: !GetAtt ProcessPatientDataFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-ProcessPatientDataFunctionArn'

  AnalyticsProcessingFunctionArn:
    Description: 'ARN of the AnalyticsProcessingFunction'
    Value: !GetAtt AnalyticsProcessingFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-AnalyticsProcessingFunctionArn'

  SendNotificationFunctionArn:
    Description: 'ARN of the SendNotificationFunction'
    Value: !GetAtt SendNotificationFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-SendNotificationFunctionArn'

  # Region Information
  DeployedRegion:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${ProjectName}-DeployedRegion'
```
