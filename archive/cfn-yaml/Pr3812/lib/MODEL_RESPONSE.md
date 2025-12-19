# Appointment Booking Notification System - CloudFormation Solution

I'll provide a complete CloudFormation solution for your appointment booking notification system.

## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Appointment Booking Notification System with EventBridge, Step Functions, Lambda, DynamoDB, SNS, and SES'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  SenderEmail:
    Type: String
    Description: 'Verified SES email address for sending notifications'
    Default: 'notifications@example.com'

Resources:
  # DynamoDB Table for Appointments
  AppointmentsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'Appointments-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: appointmentId
          AttributeType: S
        - AttributeName: appointmentTime
          AttributeType: N
      KeySchema:
        - AttributeName: appointmentId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: AppointmentTimeIndex
          KeySchema:
            - AttributeName: appointmentTime
              KeyType: HASH
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      DeletionProtectionEnabled: false

  # SNS Topic for SMS
  NotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'AppointmentNotifications-${EnvironmentSuffix}'
      DisplayName: 'Appointment SMS Notifications'

  # CloudWatch Log Groups
  ProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/AppointmentProcessor-${EnvironmentSuffix}'
      RetentionInDays: 7

  EmailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/EmailSender-${EnvironmentSuffix}'
      RetentionInDays: 7

  SmsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/SmsSender-${EnvironmentSuffix}'
      RetentionInDays: 7

  StepFunctionsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/NotificationWorkflow-${EnvironmentSuffix}'
      RetentionInDays: 7

  # IAM Role for Lambda Functions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'AppointmentLambdaRole-${EnvironmentSuffix}'
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt AppointmentsTable.Arn
                  - !Sub '${AppointmentsTable.Arn}/index/*'
        - PolicyName: SNSPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref NotificationTopic
        - PolicyName: SESAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ses:SendEmail
                  - ses:SendRawEmail
                Resource: '*'

  # Lambda Function: Appointment Processor
  AppointmentProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'AppointmentProcessor-${EnvironmentSuffix}'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          APPOINTMENTS_TABLE: !Ref AppointmentsTable
          APPOINTMENT_TIME_INDEX: AppointmentTimeIndex
      Code:
        ZipFile: |
          const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
          const { unmarshall } = require('@aws-sdk/util-dynamodb');

          const dynamodb = new DynamoDBClient({});

          exports.handler = async (event) => {
            console.log('Processing appointments for notification');

            try {
              const now = Math.floor(Date.now() / 1000);
              const futureTime = now + (24 * 60 * 60);

              const params = {
                TableName: process.env.APPOINTMENTS_TABLE,
                FilterExpression: 'appointmentTime BETWEEN :now AND :future AND attribute_not_exists(notificationSent)',
                ExpressionAttributeValues: {
                  ':now': { N: now.toString() },
                  ':future': { N: futureTime.toString() }
                }
              };

              const command = new QueryCommand(params);
              const result = await dynamodb.send(command);

              const appointments = result.Items.map(item => unmarshall(item));

              return {
                statusCode: 200,
                appointments: appointments
              };
            } catch (error) {
              console.error('Error processing appointments:', error);
              throw error;
            }
          };

  # Lambda Function: Email Sender
  EmailSenderFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'EmailSender-${EnvironmentSuffix}'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          SENDER_EMAIL: !Ref SenderEmail
      Code:
        ZipFile: |
          const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

          const ses = new SESClient({});

          exports.handler = async (event) => {
            console.log('Sending email notification:', JSON.stringify(event));

            const { customerEmail, appointmentTime, appointmentId } = event;

            if (!customerEmail) {
              throw new Error('Customer email is required');
            }

            const appointmentDate = new Date(appointmentTime * 1000).toLocaleString();

            const params = {
              Source: process.env.SENDER_EMAIL,
              Destination: {
                ToAddresses: [customerEmail]
              },
              Message: {
                Subject: {
                  Data: 'Appointment Reminder',
                  Charset: 'UTF-8'
                },
                Body: {
                  Text: {
                    Data: `This is a reminder for your appointment on ${appointmentDate}. Appointment ID: ${appointmentId}`,
                    Charset: 'UTF-8'
                  },
                  Html: {
                    Data: `<html><body><h2>Appointment Reminder</h2><p>This is a reminder for your appointment on <strong>${appointmentDate}</strong>.</p><p>Appointment ID: ${appointmentId}</p></body></html>`,
                    Charset: 'UTF-8'
                  }
                }
              }
            };

            try {
              const command = new SendEmailCommand(params);
              const result = await ses.send(command);
              console.log('Email sent successfully:', result.MessageId);

              return {
                statusCode: 200,
                messageId: result.MessageId,
                channel: 'email'
              };
            } catch (error) {
              console.error('Error sending email:', error);
              throw error;
            }
          };

  # Lambda Function: SMS Sender
  SmsSenderFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'SmsSender-${EnvironmentSuffix}'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref NotificationTopic
      Code:
        ZipFile: |
          const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

          const sns = new SNSClient({});

          exports.handler = async (event) => {
            console.log('Sending SMS notification:', JSON.stringify(event));

            const { customerPhone, appointmentTime, appointmentId } = event;

            if (!customerPhone) {
              throw new Error('Customer phone number is required');
            }

            const appointmentDate = new Date(appointmentTime * 1000).toLocaleString();

            const message = `Appointment Reminder: Your appointment is scheduled for ${appointmentDate}. ID: ${appointmentId}`;

            const params = {
              Message: message,
              PhoneNumber: customerPhone,
              MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                  DataType: 'String',
                  StringValue: 'Transactional'
                }
              }
            };

            try {
              const command = new PublishCommand(params);
              const result = await sns.send(command);
              console.log('SMS sent successfully:', result.MessageId);

              return {
                statusCode: 200,
                messageId: result.MessageId,
                channel: 'sms'
              };
            } catch (error) {
              console.error('Error sending SMS:', error);
              throw error;
            }
          };

  # Lambda Function: Status Updater
  StatusUpdaterFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'StatusUpdater-${EnvironmentSuffix}'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          APPOINTMENTS_TABLE: !Ref AppointmentsTable
      Code:
        ZipFile: |
          const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

          const dynamodb = new DynamoDBClient({});

          exports.handler = async (event) => {
            console.log('Updating appointment status:', JSON.stringify(event));

            const { appointmentId } = event;

            if (!appointmentId) {
              throw new Error('Appointment ID is required');
            }

            const params = {
              TableName: process.env.APPOINTMENTS_TABLE,
              Key: {
                appointmentId: { S: appointmentId }
              },
              UpdateExpression: 'SET notificationSent = :true, #status = :sent',
              ExpressionAttributeNames: {
                '#status': 'status'
              },
              ExpressionAttributeValues: {
                ':true': { BOOL: true },
                ':sent': { S: 'notification_sent' }
              }
            };

            try {
              const command = new UpdateItemCommand(params);
              await dynamodb.send(command);
              console.log('Status updated successfully');

              return {
                statusCode: 200,
                message: 'Status updated successfully'
              };
            } catch (error) {
              console.error('Error updating status:', error);
              throw error;
            }
          };

  # IAM Role for Step Functions
  StepFunctionsExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NotificationWorkflowRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaInvoke
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource:
                  - !GetAtt AppointmentProcessorFunction.Arn
                  - !GetAtt EmailSenderFunction.Arn
                  - !GetAtt SmsSenderFunction.Arn
                  - !GetAtt StatusUpdaterFunction.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogDelivery
                  - logs:GetLogDelivery
                  - logs:UpdateLogDelivery
                  - logs:DeleteLogDelivery
                  - logs:ListLogDeliveries
                  - logs:PutResourcePolicy
                  - logs:DescribeResourcePolicies
                  - logs:DescribeLogGroups
                Resource: '*'

  # Step Functions State Machine
  NotificationWorkflow:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub 'NotificationWorkflow-${EnvironmentSuffix}'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      LoggingConfiguration:
        Level: ALL
        IncludeExecutionData: true
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt StepFunctionsLogGroup.Arn
      DefinitionString: !Sub |
        {
          "Comment": "Appointment notification workflow with parallel SMS and email delivery",
          "StartAt": "ProcessAppointments",
          "States": {
            "ProcessAppointments": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "Parameters": {
                "FunctionName": "${AppointmentProcessorFunction.Arn}",
                "Payload.$": "$"
              },
              "ResultPath": "$.processorResult",
              "ResultSelector": {
                "appointments.$": "$.Payload.appointments"
              },
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "ResultPath": "$.error",
                  "Next": "ProcessingFailed"
                }
              ],
              "Next": "CheckAppointments"
            },
            "CheckAppointments": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.processorResult.appointments[0]",
                  "IsPresent": true,
                  "Next": "MapAppointments"
                }
              ],
              "Default": "NoAppointments"
            },
            "MapAppointments": {
              "Type": "Map",
              "ItemsPath": "$.processorResult.appointments",
              "MaxConcurrency": 10,
              "Iterator": {
                "StartAt": "SendNotifications",
                "States": {
                  "SendNotifications": {
                    "Type": "Parallel",
                    "Branches": [
                      {
                        "StartAt": "SendEmail",
                        "States": {
                          "SendEmail": {
                            "Type": "Task",
                            "Resource": "arn:aws:states:::lambda:invoke",
                            "Parameters": {
                              "FunctionName": "${EmailSenderFunction.Arn}",
                              "Payload.$": "$"
                            },
                            "ResultPath": "$.emailResult",
                            "Retry": [
                              {
                                "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                                "IntervalSeconds": 2,
                                "MaxAttempts": 3,
                                "BackoffRate": 2.0
                              }
                            ],
                            "Catch": [
                              {
                                "ErrorEquals": ["States.ALL"],
                                "ResultPath": "$.emailError",
                                "Next": "EmailFailed"
                              }
                            ],
                            "End": true
                          },
                          "EmailFailed": {
                            "Type": "Pass",
                            "Result": {
                              "status": "failed",
                              "channel": "email"
                            },
                            "End": true
                          }
                        }
                      },
                      {
                        "StartAt": "SendSMS",
                        "States": {
                          "SendSMS": {
                            "Type": "Task",
                            "Resource": "arn:aws:states:::lambda:invoke",
                            "Parameters": {
                              "FunctionName": "${SmsSenderFunction.Arn}",
                              "Payload.$": "$"
                            },
                            "ResultPath": "$.smsResult",
                            "Retry": [
                              {
                                "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                                "IntervalSeconds": 2,
                                "MaxAttempts": 3,
                                "BackoffRate": 2.0
                              }
                            ],
                            "Catch": [
                              {
                                "ErrorEquals": ["States.ALL"],
                                "ResultPath": "$.smsError",
                                "Next": "SMSFailed"
                              }
                            ],
                            "End": true
                          },
                          "SMSFailed": {
                            "Type": "Pass",
                            "Result": {
                              "status": "failed",
                              "channel": "sms"
                            },
                            "End": true
                          }
                        }
                      }
                    ],
                    "ResultPath": "$.notificationResults",
                    "Next": "UpdateStatus"
                  },
                  "UpdateStatus": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                      "FunctionName": "${StatusUpdaterFunction.Arn}",
                      "Payload.$": "$"
                    },
                    "ResultPath": "$.updateResult",
                    "Retry": [
                      {
                        "ErrorEquals": ["States.TaskFailed", "States.Timeout"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                      }
                    ],
                    "End": true
                  }
                }
              },
              "ResultPath": "$.mapResults",
              "Next": "WorkflowComplete"
            },
            "NoAppointments": {
              "Type": "Pass",
              "Result": {
                "message": "No appointments requiring notifications"
              },
              "End": true
            },
            "ProcessingFailed": {
              "Type": "Fail",
              "Error": "ProcessingError",
              "Cause": "Failed to process appointments"
            },
            "WorkflowComplete": {
              "Type": "Succeed"
            }
          }
        }

  # IAM Role for EventBridge
  EventBridgeExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EventBridgeStepFunctionsRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: StartStepFunctions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - states:StartExecution
                Resource: !GetAtt NotificationWorkflow.Arn

  # EventBridge Rule for Scheduled Notifications
  ScheduledNotificationRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'AppointmentNotificationSchedule-${EnvironmentSuffix}'
      Description: 'Triggers notification workflow every hour to check for upcoming appointments'
      ScheduleExpression: 'rate(1 hour)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt NotificationWorkflow.Arn
          RoleArn: !GetAtt EventBridgeExecutionRole.Arn
          Id: NotificationWorkflowTarget

  # EventBridge Pipe Role
  PipeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EventBridgePipeRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: pipes.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DynamoDBStreamAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeStream
                  - dynamodb:GetRecords
                  - dynamodb:GetShardIterator
                  - dynamodb:ListStreams
                Resource: !GetAtt AppointmentsTable.StreamArn
        - PolicyName: StepFunctionsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - states:StartExecution
                Resource: !GetAtt NotificationWorkflow.Arn

  # EventBridge Pipe for DynamoDB Streams
  AppointmentStreamPipe:
    Type: AWS::Pipes::Pipe
    Properties:
      Name: !Sub 'AppointmentStreamPipe-${EnvironmentSuffix}'
      Description: 'Connects DynamoDB Streams to Step Functions for real-time notifications'
      RoleArn: !GetAtt PipeRole.Arn
      Source: !GetAtt AppointmentsTable.StreamArn
      SourceParameters:
        DynamoDBStreamParameters:
          StartingPosition: LATEST
          BatchSize: 10
          MaximumBatchingWindowInSeconds: 5
        FilterCriteria:
          Filters:
            - Pattern: '{"eventName": ["INSERT", "MODIFY"]}'
      Target: !GetAtt NotificationWorkflow.Arn
      TargetParameters:
        StepFunctionStateMachineParameters:
          InvocationType: FIRE_AND_FORGET

Outputs:
  AppointmentsTableName:
    Description: 'Name of the DynamoDB appointments table'
    Value: !Ref AppointmentsTable
    Export:
      Name: !Sub '${AWS::StackName}-AppointmentsTableName'

  AppointmentsTableArn:
    Description: 'ARN of the DynamoDB appointments table'
    Value: !GetAtt AppointmentsTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AppointmentsTableArn'

  NotificationTopicArn:
    Description: 'ARN of the SNS notification topic'
    Value: !Ref NotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopicArn'

  NotificationWorkflowArn:
    Description: 'ARN of the Step Functions notification workflow'
    Value: !GetAtt NotificationWorkflow.Arn
    Export:
      Name: !Sub '${AWS::StackName}-NotificationWorkflowArn'

  AppointmentProcessorFunctionArn:
    Description: 'ARN of the appointment processor Lambda function'
    Value: !GetAtt AppointmentProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AppointmentProcessorFunctionArn'

  EmailSenderFunctionArn:
    Description: 'ARN of the email sender Lambda function'
    Value: !GetAtt EmailSenderFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EmailSenderFunctionArn'

  SmsSenderFunctionArn:
    Description: 'ARN of the SMS sender Lambda function'
    Value: !GetAtt SmsSenderFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SmsSenderFunctionArn'

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

This CloudFormation template creates a complete appointment booking notification system with the following components:

1. DynamoDB table for storing appointments with a global secondary index on appointment time
2. Four Lambda functions (Node.js 18):
   - AppointmentProcessor: Queries upcoming appointments
   - EmailSender: Sends email notifications via SES
   - SmsSender: Sends SMS notifications via SNS
   - StatusUpdater: Updates appointment status after notification
3. SNS topic for SMS delivery
4. Step Functions state machine with parallel execution for SMS and email
5. EventBridge scheduled rule (hourly) to trigger the workflow
6. EventBridge Pipes for real-time DynamoDB Streams integration
7. IAM roles with appropriate permissions
8. CloudWatch log groups for monitoring

The workflow implements retry logic with 3 attempts and exponential backoff (2x multiplier) for all Lambda invocations. The parallel state ensures SMS and email are sent simultaneously, and the system tracks delivery status in DynamoDB.
