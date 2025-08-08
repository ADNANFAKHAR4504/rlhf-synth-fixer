```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Merged CloudFormation template for the Serverless Healthcare Application backend. Deploys DynamoDB, SQS, SNS, and Lambda functions with least-privilege IAM roles. Resources are named automatically by CloudFormation.'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Project and Environment Configuration'
        Parameters:
          - ProjectName
          - EnvironmentSuffix

Parameters:
  ProjectName:
    Type: String
    Default: 'ServerlessHealthcareApp'
    Description: 'The project name used for resource tagging and logical organization.'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource tagging (e.g., dev, staging, prod).'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'

Resources:
  # ----------------------------------------------------------------
  # IAM Roles (Least Privilege, No Custom Names)
  # ----------------------------------------------------------------

  ProcessPatientDataRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-ProcessPatientDataPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow # Allows the function to create and write to its own log group
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action: 'dynamodb:PutItem'
                Resource: !GetAtt PatientDataTable.Arn
              - Effect: Allow
                Action: 'sqs:SendMessage'
                Resource: !GetAtt AnalyticsTaskQueue.Arn

  AnalyticsProcessingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-AnalyticsProcessingPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow # Allows the function to create and write to its own log group
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt AnalyticsTaskQueue.Arn

  SendNotificationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-SendNotificationPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow # Allows the function to create and write to its own log group
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action: 'sns:Publish'
                Resource: !Ref PatientUpdatesTopic

  # ----------------------------------------------------------------
  # Core Infrastructure (DynamoDB, SQS, SNS)
  # ----------------------------------------------------------------

  PatientDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      AttributeDefinitions:
        - AttributeName: 'PatientID'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'PatientID'
          KeyType: 'HASH'
      BillingMode: 'PAY_PER_REQUEST'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

  AnalyticsTaskQueue:
    Type: AWS::SQS::Queue
    Properties:
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt AnalyticsTaskDeadLetterQueue.Arn
        maxReceiveCount: 5

  AnalyticsTaskDeadLetterQueue:
    Type: AWS::SQS::Queue

  PatientUpdatesTopic:
    Type: AWS::SNS::Topic

  # ----------------------------------------------------------------
  # Lambda Functions (No Custom Names)
  # ----------------------------------------------------------------

  ProcessPatientDataFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: 'index.handler'
      Runtime: 'nodejs20.x'
      Role: !GetAtt ProcessPatientDataRole.Arn
      Environment:
        Variables:
          PATIENT_TABLE_NAME: !Ref PatientDataTable
          ANALYTICS_QUEUE_URL: !Ref AnalyticsTaskQueue
      Code:
        ZipFile: |
          const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
          const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
          const crypto = require("crypto");
          const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
          const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
          exports.handler = async (event) => {
            console.log("Received event:", JSON.stringify(event, null, 2));
            const patientId = event.patientId || crypto.randomUUID();
            const ddbParams = {
              TableName: process.env.PATIENT_TABLE_NAME,
              Item: {
                'PatientID': { S: patientId },
                'Data': { S: JSON.stringify(event.body) },
                'Timestamp': { S: new Date().toISOString() }
              }
            };
            const sqsParams = {
              QueueUrl: process.env.ANALYTICS_QUEUE_URL,
              MessageBody: JSON.stringify({ patientId: patientId, message: "New patient data for analytics." })
            };
            try {
              await ddbClient.send(new PutItemCommand(ddbParams));
              console.log(`Successfully added patient ${patientId} to the table.`);
              await sqsClient.send(new SendMessageCommand(sqsParams));
              console.log(`Successfully sent message for patient ${patientId} to the analytics queue.`);
              return { statusCode: 200, body: JSON.stringify({ message: "Patient data processed successfully.", patientId: patientId }) };
            } catch (err) {
              console.error(err);
              return { statusCode: 500, body: JSON.stringify({ message: "Error processing patient data." }) };
            }
          };

  AnalyticsProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: 'index.handler'
      Runtime: 'nodejs20.x'
      Role: !GetAtt AnalyticsProcessingRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("Received SQS event:", JSON.stringify(event, null, 2));
            for (const record of event.Records) {
              const messageBody = JSON.parse(record.body);
              console.log(`Processing analytics for patient: ${messageBody.patientId}`);
            }
            return { statusCode: 200, body: JSON.stringify({ message: "Analytics batch processed successfully." }) };
          };

  SendNotificationFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: 'index.handler'
      Runtime: 'nodejs20.x'
      Role: !GetAtt SendNotificationRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("Received SNS event:", JSON.stringify(event, null, 2));
            for (const record of event.Records) {
              const snsMessage = record.Sns;
              console.log(`Sending notification for subject: ${snsMessage.Subject}`);
              console.log(`Message: ${snsMessage.Message}`);
            }
            return { statusCode: 200, body: JSON.stringify({ message: "Notification sent successfully." }) };
          };

  # ----------------------------------------------------------------
  # Event Source Mappings & Permissions
  # ----------------------------------------------------------------

  AnalyticsQueueEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt AnalyticsTaskQueue.Arn
      FunctionName: !GetAtt AnalyticsProcessingFunction.Arn
      Enabled: true
      BatchSize: 10

  NotificationTopicSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: 'lambda'
      Endpoint: !GetAtt SendNotificationFunction.Arn
      TopicArn: !Ref PatientUpdatesTopic

  NotificationFunctionInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt SendNotificationFunction.Arn
      Action: 'lambda:InvokeFunction'
      Principal: 'sns.amazonaws.com'
      SourceArn: !Ref PatientUpdatesTopic

# ----------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------

Outputs:
  # General Info
  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
  ProjectName:
    Description: 'Project name used for this deployment'
    Value: !Ref ProjectName
  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix

  # DynamoDB Outputs
  PatientDataTableName:
    Description: 'The auto-generated name of the DynamoDB table for patient data.'
    Value: !Ref PatientDataTable
    Export:
      Name: !Sub '${AWS::StackName}-PatientDataTableName'

  # SQS Outputs
  AnalyticsTaskQueueURL:
    Description: 'The URL of the SQS queue for analytics tasks.'
    Value: !Ref AnalyticsTaskQueue
    Export:
      Name: !Sub '${AWS::StackName}-AnalyticsTaskQueueURL'
  AnalyticsTaskQueueARN:
    Description: 'The ARN of the SQS queue for analytics tasks.'
    Value: !GetAtt AnalyticsTaskQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalyticsTaskQueueARN'
  AnalyticsTaskDeadLetterQueueArn:
    Description: 'The ARN of the SQS dead-letter queue.'
    Value: !GetAtt AnalyticsTaskDeadLetterQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalyticsTaskDeadLetterQueueArn'

  # SNS Outputs
  PatientUpdatesTopicArn:
    Description: 'The ARN of the SNS topic for patient updates.'
    Value: !Ref PatientUpdatesTopic
    Export:
      Name: !Sub '${AWS::StackName}-PatientUpdatesTopicArn'

  # Lambda Outputs
  ProcessPatientDataFunctionName:
    Description: 'Name of the ProcessPatientData Lambda function'
    Value: !Ref ProcessPatientDataFunction
  AnalyticsProcessingFunctionName:
    Description: 'Name of the AnalyticsProcessing Lambda function'
    Value: !Ref AnalyticsProcessingFunction
  SendNotificationFunctionName:
    Description: 'Name of the SendNotification Lambda function'
    Value: !Ref SendNotificationFunction

  # IAM Role Outputs
  ProcessPatientDataRoleName:
    Description: 'Name of the ProcessPatientData IAM Role'
    Value: !Ref ProcessPatientDataRole
  AnalyticsProcessingRoleName:
    Description: 'Name of the AnalyticsProcessing IAM Role'
    Value: !Ref AnalyticsProcessingRole
  SendNotificationRoleName:
    Description: 'Name of the SendNotification IAM Role'
    Value: !Ref SendNotificationRole
```
