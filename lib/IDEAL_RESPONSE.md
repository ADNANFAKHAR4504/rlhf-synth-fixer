```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Merged CloudFormation template for the Serverless Healthcare Application backend. Deploys DynamoDB, SQS, SNS, and Lambda functions with least-privilege IAM roles for different environments.'

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
    Description: 'The project name used to prefix all resource names.'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'

Resources:
  # ----------------------------------------------------------------
  # CloudWatch Log Groups (to break circular dependencies)
  # ----------------------------------------------------------------

  ProcessPatientDataLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-ProcessPatientDataFunction-${EnvironmentSuffix}'
      RetentionInDays: 14

  AnalyticsProcessingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-AnalyticsProcessingFunction-${EnvironmentSuffix}'
      RetentionInDays: 14

  SendNotificationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-SendNotificationFunction-${EnvironmentSuffix}'
      RetentionInDays: 14

  # ----------------------------------------------------------------
  # IAM Roles (Least Privilege)
  # ----------------------------------------------------------------

  ProcessPatientDataRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ProcessPatientDataRole-${EnvironmentSuffix}'
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
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt ProcessPatientDataLogGroup.Arn
              - Effect: Allow
                Action: 'dynamodb:PutItem'
                Resource: !GetAtt PatientDataTable.Arn
              - Effect: Allow
                Action: 'sqs:SendMessage'
                Resource: !GetAtt AnalyticsTaskQueue.Arn

  AnalyticsProcessingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-AnalyticsProcessingRole-${EnvironmentSuffix}'
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
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt AnalyticsProcessingLogGroup.Arn
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt AnalyticsTaskQueue.Arn

  SendNotificationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-SendNotificationRole-${EnvironmentSuffix}'
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
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt SendNotificationLogGroup.Arn
              - Effect: Allow
                Action: 'sns:Publish'
                Resource: !Ref PatientUpdatesTopic

  # ----------------------------------------------------------------
  # DynamoDB Table
  # ----------------------------------------------------------------

  PatientDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-PatientDataTable-${EnvironmentSuffix}'
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

  # ----------------------------------------------------------------
  # SQS Queue
  # ----------------------------------------------------------------

  AnalyticsTaskQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue-${EnvironmentSuffix}'
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt AnalyticsTaskDeadLetterQueue.Arn
        maxReceiveCount: 5

  AnalyticsTaskDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-AnalyticsTaskQueue-DLQ-${EnvironmentSuffix}'

  # ----------------------------------------------------------------
  # SNS Topic
  # ----------------------------------------------------------------

  PatientUpdatesTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-PatientUpdatesTopic-${EnvironmentSuffix}'

  # ----------------------------------------------------------------
  # Lambda Functions
  # ----------------------------------------------------------------

  ProcessPatientDataFunction:
    Type: AWS::Lambda::Function
    DependsOn: ProcessPatientDataLogGroup
    Properties:
      FunctionName: !Sub '${ProjectName}-ProcessPatientDataFunction-${EnvironmentSuffix}'
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

              return {
                statusCode: 200,
                body: JSON.stringify({ message: "Patient data processed successfully.", patientId: patientId }),
              };
            } catch (err) {
              console.error(err);
              return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error processing patient data." }),
              };
            }
          };

  AnalyticsProcessingFunction:
    Type: AWS::Lambda::Function
    DependsOn: AnalyticsProcessingLogGroup
    Properties:
      FunctionName: !Sub '${ProjectName}-AnalyticsProcessingFunction-${EnvironmentSuffix}'
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
            return {
              statusCode: 200,
              body: JSON.stringify({ message: "Analytics batch processed successfully." }),
            };
          };

  SendNotificationFunction:
    Type: AWS::Lambda::Function
    DependsOn: SendNotificationLogGroup
    Properties:
      FunctionName: !Sub '${ProjectName}-SendNotificationFunction-${EnvironmentSuffix}'
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
            return {
              statusCode: 200,
              body: JSON.stringify({ message: "Notification sent successfully." }),
            };
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

  PatientDataTableName:
    Description: 'The name of the DynamoDB table for patient data.'
    Value: !Ref PatientDataTable
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-PatientDataTableName'

  AnalyticsTaskQueueURL:
    Description: 'The URL of the SQS queue for analytics tasks.'
    Value: !Ref AnalyticsTaskQueue
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-AnalyticsTaskQueueURL'

  AnalyticsTaskQueueARN:
    Description: 'The ARN of the SQS queue for analytics tasks.'
    Value: !GetAtt AnalyticsTaskQueue.Arn
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-AnalyticsTaskQueueARN'

  PatientUpdatesTopicArn:
    Description: 'The ARN of the SNS topic for patient updates.'
    Value: !Ref PatientUpdatesTopic
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-PatientUpdatesTopicArn'
```
