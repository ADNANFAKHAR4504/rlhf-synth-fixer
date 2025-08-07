```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Healthcare Application - Production-ready backend infrastructure with DynamoDB, Lambda, SQS, SNS, and IAM roles following least privilege principle'

Parameters:
  ProjectName:
    Type: String
    Default: 'ServerlessHealthcareApp'
    Description: 'Project name used as prefix for all resources'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters and hyphens'

Resources:
  # =====================================================
  # DynamoDB Table for Patient Data
  # =====================================================
  PatientDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-PatientDataTable'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PatientID
          AttributeType: S
      KeySchema:
        - AttributeName: PatientID
          KeyType: HASH
      # Enable Point-in-Time Recovery for data protection
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      # Enable Server-Side Encryption with AWS managed KMS key
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: alias/aws/dynamodb
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # =====================================================
  # SQS Queue for Analytics Tasks
  # =====================================================
  AnalyticsTaskQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue'
      # Set visibility timeout to match Lambda timeout + buffer
      VisibilityTimeoutSeconds: 300
      # Enable message retention for 14 days
      MessageRetentionPeriod: 1209600
      # Enable dead letter queue for failed messages
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt AnalyticsTaskDeadLetterQueue.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Dead Letter Queue for failed analytics tasks
  AnalyticsTaskDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue-DLQ'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # =====================================================
  # SNS Topic for Patient Updates
  # =====================================================
  PatientUpdatesTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-PatientUpdatesTopic'
      DisplayName: 'Patient Updates Notifications'
      # Enable server-side encryption
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # =====================================================
  # IAM Roles (Following Least Privilege Principle)
  # =====================================================

  # IAM Role for ProcessPatientDataFunction
  ProcessPatientDataRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ProcessPatientDataRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic Lambda execution permissions for CloudWatch Logs
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: ProcessPatientDataPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # DynamoDB PutItem permission on specific table only
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                Resource: !GetAtt PatientDataTable.Arn
              # SQS SendMessage permission on specific queue only
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt AnalyticsTaskQueue.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for AnalyticsProcessingFunction
  AnalyticsProcessingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-AnalyticsProcessingRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic Lambda execution permissions for CloudWatch Logs
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: AnalyticsProcessingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # SQS permissions for reading from the analytics queue only
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt AnalyticsTaskQueue.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for SendNotificationFunction
  SendNotificationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-SendNotificationRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic Lambda execution permissions for CloudWatch Logs
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SendNotificationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # SNS Publish permission on specific topic only
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref PatientUpdatesTopic
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # =====================================================
  # Lambda Functions
  # =====================================================

  # Lambda Function: Process Patient Data
  ProcessPatientDataFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-ProcessPatientDataFunction'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt ProcessPatientDataRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          PATIENT_TABLE_NAME: !Ref PatientDataTable
          ANALYTICS_QUEUE_URL: !Ref AnalyticsTaskQueue
          AWS_REGION: !Ref 'AWS::Region'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime

          def lambda_handler(event, context):
              print(f"Processing patient data event: {json.dumps(event)}")

              # Initialize AWS clients
              dynamodb = boto3.resource('dynamodb')
              sqs = boto3.client('sqs')

              table_name = os.environ['PATIENT_TABLE_NAME']
              queue_url = os.environ['ANALYTICS_QUEUE_URL']

              try:
                  # Extract patient data from event
                  patient_data = event.get('patientData', {})
                  patient_id = patient_data.get('patientId', str(uuid.uuid4()))

                  # Write to DynamoDB
                  table = dynamodb.Table(table_name)
                  table.put_item(
                      Item={
                          'PatientID': patient_id,
                          'Data': json.dumps(patient_data),
                          'Timestamp': datetime.utcnow().isoformat(),
                          'Status': 'PROCESSED'
                      }
                  )

                  # Send message to SQS for analytics
                  sqs.send_message(
                      QueueUrl=queue_url,
                      MessageBody=json.dumps({
                          'patientId': patient_id,
                          'action': 'ANALYZE_PATIENT_DATA',
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  )

                  print(f"Successfully processed patient data for ID: {patient_id}")

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Patient data processed successfully',
                          'patientId': patient_id
                      })
                  }

              except Exception as e:
                  print(f"Error processing patient data: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Failed to process patient data',
                          'details': str(e)
                      })
                  }
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # Lambda Function: Analytics Processing
  AnalyticsProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-AnalyticsProcessingFunction'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt AnalyticsProcessingRole.Arn
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          AWS_REGION: !Ref 'AWS::Region'
      Code:
        ZipFile: |
          import json
          import boto3
          from datetime import datetime

          def lambda_handler(event, context):
              print(f"Processing analytics event: {json.dumps(event)}")

              try:
                  # Process each SQS record
                  for record in event.get('Records', []):
                      message_body = json.loads(record['body'])
                      patient_id = message_body.get('patientId')
                      action = message_body.get('action')

                      print(f"Processing analytics for patient {patient_id}, action: {action}")

                      # Simulate analytics processing
                      analytics_result = {
                          'patientId': patient_id,
                          'analysisType': action,
                          'processedAt': datetime.utcnow().isoformat(),
                          'status': 'COMPLETED',
                          'insights': 'Sample analytics insights generated'
                      }

                      print(f"Analytics completed for patient {patient_id}: {analytics_result}")

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Analytics processing completed successfully',
                          'processedRecords': len(event.get('Records', []))
                      })
                  }

              except Exception as e:
                  print(f"Error in analytics processing: {str(e)}")
                  raise e
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # Lambda Function: Send Notifications
  SendNotificationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-SendNotificationFunction'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SendNotificationRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          PATIENT_UPDATES_TOPIC_ARN: !Ref PatientUpdatesTopic
          AWS_REGION: !Ref 'AWS::Region'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          def lambda_handler(event, context):
              print(f"Processing notification event: {json.dumps(event)}")

              # Initialize SNS client
              sns = boto3.client('sns')
              topic_arn = os.environ['PATIENT_UPDATES_TOPIC_ARN']

              try:
                  # Process each SNS record
                  for record in event.get('Records', []):
                      sns_message = json.loads(record['Sns']['Message'])
                      patient_id = sns_message.get('patientId', 'Unknown')
                      update_type = sns_message.get('updateType', 'GENERAL_UPDATE')

                      # Create notification message
                      notification_message = {
                          'patientId': patient_id,
                          'updateType': update_type,
                          'message': f'Critical update for patient {patient_id}',
                          'timestamp': datetime.utcnow().isoformat(),
                          'severity': sns_message.get('severity', 'MEDIUM')
                      }

                      # Publish notification
                      response = sns.publish(
                          TopicArn=topic_arn,
                          Message=json.dumps(notification_message),
                          Subject=f'Healthcare Alert: Patient {patient_id}',
                          MessageAttributes={
                              'PatientID': {
                                  'DataType': 'String',
                                  'StringValue': patient_id
                              },
                              'UpdateType': {
                                  'DataType': 'String',
                                  'StringValue': update_type
                              }
                          }
                      )

                      print(f"Notification sent for patient {patient_id}, MessageId: {response['MessageId']}")

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Notifications sent successfully',
                          'processedRecords': len(event.get('Records', []))
                      })
                  }

              except Exception as e:
                  print(f"Error sending notifications: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Failed to send notifications',
                          'details': str(e)
                      })
                  }
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # =====================================================
  # Event Source Mappings
  # =====================================================

  # SQS Event Source Mapping for Analytics Function
  AnalyticsProcessingEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt AnalyticsTaskQueue.Arn
      FunctionName: !GetAtt AnalyticsProcessingFunction.Arn
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5

  # SNS Subscription for Notification Function
  NotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref PatientUpdatesTopic
      Protocol: lambda
      Endpoint: !GetAtt SendNotificationFunction.Arn

  # Lambda Permission for SNS to invoke Notification Function
  NotificationFunctionInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SendNotificationFunction
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref PatientUpdatesTopic

# =====================================================
# Outputs Section
# =====================================================
Outputs:
  ProjectName:
    Description: 'Project name used for resource naming'
    Value: !Ref ProjectName
    Export:
      Name: !Sub '${ProjectName}-ProjectName'

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

  PatientUpdatesTopicArn:
    Description: 'ARN of the SNS topic for patient updates'
    Value: !Ref PatientUpdatesTopic
    Export:
      Name: !Sub '${ProjectName}-PatientUpdatesTopicArn'

  ProcessPatientDataFunctionArn:
    Description: 'ARN of the ProcessPatientData Lambda function'
    Value: !GetAtt ProcessPatientDataFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-ProcessPatientDataFunctionArn'

  AnalyticsProcessingFunctionArn:
    Description: 'ARN of the AnalyticsProcessing Lambda function'
    Value: !GetAtt AnalyticsProcessingFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-AnalyticsProcessingFunctionArn'

  SendNotificationFunctionArn:
    Description: 'ARN of the SendNotification Lambda function'
    Value: !GetAtt SendNotificationFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-SendNotificationFunctionArn'

  DeploymentRegion:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${ProjectName}-DeploymentRegion'
```
