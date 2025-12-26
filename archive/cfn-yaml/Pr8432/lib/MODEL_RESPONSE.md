AWSTemplateFormatVersion: '2010-09-09'
Description: 'Email Notification System with SNS, SES, Lambda, DynamoDB, and CloudWatch'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - prod
    Description: Environment name for resource naming

  VerifiedDomain:
    Type: String
    Description: Verified SES domain (e.g., example.com)
    Default: example.com

  SesFromAddress:
    Type: String
    Description: From email address for sending emails
    Default: no-reply@example.com

  EnableProductionSES:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable production SES sending (false routes to test address)

  TestEmailAddress:
    Type: String
    Default: test@example.com
    Description: Test email address for sandbox mode

  AlarmEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    Default: ops@example.com

Resources:
  # ========== SNS Topics ==========
  SNSTopicOrderConfirmations:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-order-confirmations'
      DisplayName: Order Confirmation Events
      KmsMasterKeyId: alias/aws/sns

  SNSTopicSesDelivery:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-ses-delivery-notifications'
      DisplayName: SES Delivery Notifications

  SNSTopicSesBounce:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-ses-bounce-notifications'
      DisplayName: SES Bounce Notifications

  SNSTopicSesComplaint:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-ses-complaint-notifications'
      DisplayName: SES Complaint Notifications

  # ========== DynamoDB Table ==========
  DynamoDBTableEmailDeliveries:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-email-deliveries'
      BillingMode: PAY_PER_REQUEST  # On-demand for cost optimization at 2k/day
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: alias/aws/dynamodb
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: messageId
          AttributeType: S
        - AttributeName: to
          AttributeType: S
        - AttributeName: status
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
        - AttributeName: messageId
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: EmailIndex
          KeySchema:
            - AttributeName: to
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: StatusIndex
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ========== Lambda Execution Roles ==========
  LambdaSendOrderEmailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-lambda-send-order-email-role'
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
        - PolicyName: SendOrderEmailPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ses:SendEmail
                  - ses:SendRawEmail
                Resource:
                  - !Sub 'arn:aws:ses:${AWS::Region}:${AWS::AccountId}:identity/${VerifiedDomain}'
                  - !Sub 'arn:aws:ses:${AWS::Region}:${AWS::AccountId}:configuration-set/${Environment}-ses-config-set'
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt DynamoDBTableEmailDeliveries.Arn
                  - !Sub '${DynamoDBTableEmailDeliveries.Arn}/index/*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
                Condition:
                  StringEquals:
                    cloudwatch:namespace: !Sub '${Environment}/EmailNotifications'

  LambdaSesFeedbackProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-lambda-ses-feedback-role'
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
        - PolicyName: SesFeedbackProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt DynamoDBTableEmailDeliveries.Arn
                  - !Sub '${DynamoDBTableEmailDeliveries.Arn}/index/*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
                Condition:
                  StringEquals:
                    cloudwatch:namespace: !Sub '${Environment}/EmailNotifications'

  # ========== Lambda Functions ==========
  LambdaSendOrderEmail:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-send-order-email'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaSendOrderEmailRole.Arn
      Timeout: 30
      MemorySize: 256
      ReservedConcurrentExecutions: 10  # Rate limiting for cost control
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          TABLE_NAME: !Ref DynamoDBTableEmailDeliveries
          FROM_ADDRESS: !Ref SesFromAddress
          VERIFIED_DOMAIN: !Ref VerifiedDomain
          ENABLE_PRODUCTION_SES: !Ref EnableProductionSES
          TEST_EMAIL_ADDRESS: !Ref TestEmailAddress
          CONFIGURATION_SET: !Ref SESConfigurationSet
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const ses = new AWS.SES();
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const cloudwatch = new AWS.CloudWatch();
          
          exports.handler = async (event) => {
            console.log('Received event:', JSON.stringify(event));
            
            for (const record of event.Records) {
              try {
                const message = JSON.parse(record.Sns.Message);
                await processOrderConfirmation(message);
              } catch (error) {
                console.error('Error processing record:', error);
                await publishMetric('SendFailures', 1);
                throw error; // Let Lambda retry mechanism handle
              }
            }
          };
          
          async function processOrderConfirmation(message) {
            const { orderId, customerEmail, customerName, items, total, timestamp } = message;
            
            // Validation
            if (!orderId || !customerEmail) {
              throw new Error('Missing required fields: orderId or customerEmail');
            }
            
            // Check for duplicate sends (idempotency)
            const messageId = `${orderId}-${timestamp || Date.now()}`;
            const existingRecord = await checkExistingEmail(orderId, messageId);
            
            if (existingRecord) {
              console.log(`Email already sent for orderId: ${orderId}, messageId: ${messageId}`);
              return;
            }
            
            // Determine target email based on production flag
            const toAddress = process.env.ENABLE_PRODUCTION_SES === 'true' 
              ? customerEmail 
              : process.env.TEST_EMAIL_ADDRESS;
            
            // Prepare email
            const emailParams = {
              Source: process.env.FROM_ADDRESS,
              Destination: { ToAddresses: [toAddress] },
              Message: {
                Subject: { Data: `Order Confirmation #${orderId}` },
                Body: {
                  Html: {
                    Data: generateEmailHtml(orderId, customerName, items, total)
                  }
                }
              },
              ConfigurationSetName: process.env.CONFIGURATION_SET
            };
            
            // Send email via SES
            let sesMessageId;
            try {
              const result = await ses.sendEmail(emailParams).promise();
              sesMessageId = result.MessageId;
              console.log(`Email sent successfully. SES MessageId: ${sesMessageId}`);
            } catch (error) {
              console.error('SES send error:', error);
              await recordEmailStatus(orderId, messageId, toAddress, 'FAILED', null, error.message);
              throw error;
            }
            
            // Record successful send
            await recordEmailStatus(orderId, messageId, toAddress, 'SENT', sesMessageId);
            await publishMetric('EmailsSent', 1);
          }
          
          async function checkExistingEmail(orderId, messageId) {
            const params = {
              TableName: process.env.TABLE_NAME,
              Key: { orderId, messageId }
            };
            
            try {
              const result = await dynamodb.get(params).promise();
              return result.Item;
            } catch (error) {
              console.error('Error checking existing email:', error);
              return null;
            }
          }
          
          async function recordEmailStatus(orderId, messageId, to, status, sesMessageId, reason = null) {
            const params = {
              TableName: process.env.TABLE_NAME,
              Item: {
                orderId,
                messageId,
                to,
                status,
                sesMessageId,
                timestamp: Date.now(),
                lastUpdated: new Date().toISOString(),
                attempts: 1,
                reason
              },
              ConditionExpression: 'attribute_not_exists(orderId) AND attribute_not_exists(messageId)'
            };
            
            try {
              await dynamodb.put(params).promise();
            } catch (error) {
              if (error.code === 'ConditionalCheckFailedException') {
                console.log('Record already exists, skipping insert');
              } else {
                throw error;
              }
            }
          }
          
          async function publishMetric(metricName, value) {
            const params = {
              Namespace: `${process.env.ENVIRONMENT}/EmailNotifications`,
              MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: 'Count',
                Timestamp: new Date()
              }]
            };
            
            await cloudwatch.putMetricData(params).promise();
          }
          
          function generateEmailHtml(orderId, customerName, items, total) {
            const itemsList = items ? items.map(item => 
              `<li>${item.name} - Quantity: ${item.quantity} - $${item.price}</li>`
            ).join('') : '';
            
            return `
              <html>
                <body>
                  <h2>Order Confirmation</h2>
                  <p>Dear ${customerName || 'Customer'},</p>
                  <p>Thank you for your order #${orderId}!</p>
                  <h3>Order Details:</h3>
                  <ul>${itemsList}</ul>
                  <p><strong>Total: $${total}</strong></p>
                  <p>We'll send you a shipping confirmation once your order is on its way.</p>
                  <p>Best regards,<br>Your E-commerce Team</p>
                </body>
              </html>
            `;
          }

  LambdaSesFeedbackProcessor:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-ses-feedback-processor'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaSesFeedbackProcessorRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          TABLE_NAME: !Ref DynamoDBTableEmailDeliveries
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const cloudwatch = new AWS.CloudWatch();
          
          exports.handler = async (event) => {
            console.log('Received SES feedback:', JSON.stringify(event));
            
            for (const record of event.Records) {
              try {
                const message = JSON.parse(record.Sns.Message);
                await processSESFeedback(message, record.Sns.Subject);
              } catch (error) {
                console.error('Error processing feedback:', error);
                throw error;
              }
            }
          };
          
          async function processSESFeedback(message, subject) {
            let feedbackType = 'UNKNOWN';
            let sesMessageId;
            let recipients = [];
            let reason = '';
            
            // Parse different feedback types
            if (message.notificationType === 'Bounce') {
              feedbackType = 'BOUNCE';
              sesMessageId = message.mail.messageId;
              recipients = message.bounce.bouncedRecipients.map(r => r.emailAddress);
              reason = `${message.bounce.bounceType}: ${message.bounce.bounceSubType}`;
              await publishMetric('Bounces', recipients.length);
            } else if (message.notificationType === 'Complaint') {
              feedbackType = 'COMPLAINT';
              sesMessageId = message.mail.messageId;
              recipients = message.complaint.complainedRecipients.map(r => r.emailAddress);
              reason = message.complaint.complaintFeedbackType || 'Unknown complaint';
              await publishMetric('Complaints', recipients.length);
            } else if (message.notificationType === 'Delivery') {
              feedbackType = 'DELIVERED';
              sesMessageId = message.mail.messageId;
              recipients = message.delivery.recipients;
              await publishMetric('Deliveries', recipients.length);
            }
            
            // Update DynamoDB for each recipient
            for (const recipient of recipients) {
              await updateEmailStatus(sesMessageId, recipient, feedbackType, reason);
            }
          }
          
          async function updateEmailStatus(sesMessageId, recipient, status, reason) {
            // First, find the record by sesMessageId
            const queryParams = {
              TableName: process.env.TABLE_NAME,
              IndexName: 'EmailIndex',
              KeyConditionExpression: '#to = :email',
              FilterExpression: 'sesMessageId = :msgId',
              ExpressionAttributeNames: { '#to': 'to' },
              ExpressionAttributeValues: {
                ':email': recipient,
                ':msgId': sesMessageId
              }
            };
            
            try {
              const queryResult = await dynamodb.query(queryParams).promise();
              
              if (queryResult.Items && queryResult.Items.length > 0) {
                const record = queryResult.Items[0];
                
                // Update the status
                const updateParams = {
                  TableName: process.env.TABLE_NAME,
                  Key: {
                    orderId: record.orderId,
                    messageId: record.messageId
                  },
                  UpdateExpression: 'SET #status = :status, lastUpdated = :updated, reason = :reason',
                  ExpressionAttributeNames: { '#status': 'status' },
                  ExpressionAttributeValues: {
                    ':status': status,
                    ':updated': new Date().toISOString(),
                    ':reason': reason
                  }
                };
                
                await dynamodb.update(updateParams).promise();
                console.log(`Updated status to ${status} for sesMessageId: ${sesMessageId}`);
              } else {
                console.warn(`No record found for sesMessageId: ${sesMessageId}, recipient: ${recipient}`);
              }
            } catch (error) {
              console.error('Error updating email status:', error);
              throw error;
            }
          }
          
          async function publishMetric(metricName, value) {
            const params = {
              Namespace: `${process.env.ENVIRONMENT}/EmailNotifications`,
              MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: 'Count',
                Timestamp: new Date()
              }]
            };
            
            await cloudwatch.putMetricData(params).promise();
          }

  # ========== Lambda Permissions ==========
  LambdaPermissionSendOrderEmail:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaSendOrderEmail.Arn
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref SNSTopicOrderConfirmations

  LambdaPermissionSesFeedbackDelivery:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaSesFeedbackProcessor.Arn
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref SNSTopicSesDelivery

  LambdaPermissionSesFeedbackBounce:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaSesFeedbackProcessor.Arn
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref SNSTopicSesBounce

  LambdaPermissionSesFeedbackComplaint:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaSesFeedbackProcessor.Arn
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref SNSTopicSesComplaint

  # ========== SNS Subscriptions ==========
  SNSSubscriptionOrderConfirmations:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSTopicOrderConfirmations
      Protocol: lambda
      Endpoint: !GetAtt LambdaSendOrderEmail.Arn

  SNSSubscriptionSesDelivery:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSTopicSesDelivery
      Protocol: lambda
      Endpoint: !GetAtt LambdaSesFeedbackProcessor.Arn

  SNSSubscriptionSesBounce:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSTopicSesBounce
      Protocol: lambda
      Endpoint: !GetAtt LambdaSesFeedbackProcessor.Arn

  SNSSubscriptionSesComplaint:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSTopicSesComplaint
      Protocol: lambda
      Endpoint: !GetAtt LambdaSesFeedbackProcessor.Arn

  # ========== SES Configuration Set ==========
  SESConfigurationSet:
    Type: AWS::SES::ConfigurationSet
    Properties:
      Name: !Sub '${Environment}-ses-config-set'

  SESEventDestinationBounce:
    Type: AWS::SES::ConfigurationSetEventDestination
    Properties:
      ConfigurationSetName: !Ref SESConfigurationSet
      EventDestination:
        Name: bounce-notifications
        Enabled: true
        SnsDestination:
          TopicARN: !Ref SNSTopicSesBounce
        MatchingEventTypes:
          - bounce

  SESEventDestinationComplaint:
    Type: AWS::SES::ConfigurationSetEventDestination
    Properties:
      ConfigurationSetName: !Ref SESConfigurationSet
      EventDestination:
        Name: complaint-notifications
        Enabled: true
        SnsDestination:
          TopicARN: !Ref SNSTopicSesComplaint
        MatchingEventTypes:
          - complaint

  SESEventDestinationDelivery:
    Type: AWS::SES::ConfigurationSetEventDestination
    Properties:
      ConfigurationSetName: !Ref SESConfigurationSet
      EventDestination:
        Name: delivery-notifications
        Enabled: true
        SnsDestination:
          TopicARN: !Ref SNSTopicSesDelivery
        MatchingEventTypes:
          - delivery

  # ========== CloudWatch Alarms ==========
  AlarmSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-email-system-alarms'
      Subscription:
        - Endpoint: !Ref AlarmEmail
          Protocol: email

  AlarmHighBounceRate:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-bounce-rate'
      AlarmDescription: Alert when bounce rate exceeds 2%
      MetricName: Bounces
      Namespace: !Sub '${Environment}/EmailNotifications'
      Statistic: Sum
      Period: 3600  # 1 hour
      EvaluationPeriods: 1
      Threshold: 40  # 2% of 2000 daily emails
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmSNSTopic

  AlarmLambdaErrors:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-lambda-send-errors'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaSendOrderEmail
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmSNSTopic

  # ========== CloudWatch Dashboard ==========
  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${Environment}-email-notifications'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "${Environment}/EmailNotifications", "EmailsSent", { "stat": "Sum" } ],
                  [ ".", "SendFailures", { "stat": "Sum" } ],
                  [ ".", "Bounces", { "stat": "Sum" } ],
                  [ ".", "Complaints", { "stat": "Sum" } ],
                  [ ".", "Deliveries", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Email Metrics",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", { "stat": "Sum", "dimensions": { "FunctionName": "${LambdaSendOrderEmail}" } } ],
                  [ ".", "Errors", { "stat": "Sum", "dimensions": { "FunctionName": "${LambdaSendOrderEmail}" } } ],
                  [ ".", "Duration", { "stat": "Average", "dimensions": { "FunctionName": "${LambdaSendOrderEmail}" } } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Lambda Performance"
              }
            }
          ]
        }

Outputs:
  SNSTopicArn:
    Description: SNS Topic ARN for order confirmations
    Value: !Ref SNSTopicOrderConfirmations
    Export:
      Name: !Sub '${Environment}-order-confirmations-topic'

  DynamoDBTableName:
    Description: DynamoDB table name for email deliveries
    Value: !Ref DynamoDBTableEmailDeliveries
    Export:
      Name: !Sub '${Environment}-email-deliveries-table'

  LambdaSendOrderArn:
    Description: Lambda function ARN for sending order emails
    Value: !GetAtt LambdaSendOrderEmail.Arn
    Export:
      Name: !Sub '${Environment}-send-order-email-function'

  SesConfigurationSetName:
    Description: SES Configuration Set name
    Value: !Ref SESConfigurationSet
    Export:
      Name: !Sub '${Environment}-ses-config-set'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${Environment}-email-notifications'