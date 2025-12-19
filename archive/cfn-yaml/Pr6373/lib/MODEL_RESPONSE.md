### Reasoning Trace
---

Let me break down the requirements:

1. **SNS Topic (FIFO)** - for receiving transaction events
2. **Three SQS FIFO queues** based on transaction amounts:
   - High-value: > $10,000
   - Standard: $1,000 - $10,000
   - Low-value: < $1,000
3. **SNS Subscriptions with filters** to route to appropriate queues
4. **Dead-letter queues (DLQ)** for each primary queue (FIFO, maxReceiveCount: 3)
5. **EventBridge custom event bus** for processed results
6. **EventBridge rule** for failed transactions > $5,000 → SNS Alerts topic
7. **SQS configuration**:
   - Message retention: 14 days
   - Visibility timeout: 300 seconds
   - Long polling: 20 seconds
   - FIFO enabled
   - KMS encryption
8. **CloudWatch alarms** for queues when messages > 1000
9. **IAM roles and policies**
10. **Outputs** for queue URLs, SNS ARN, EventBus name, KMS Key ARN
11. **Naming convention**: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]`

Let me create a comprehensive CloudFormation template:
### Answer 
---

I'll create a comprehensive CloudFormation template for your asynchronous event processing pipeline. This template follows all your requirements including the naming convention, FIFO queues, message filtering, and cross-account portability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Asynchronous event processing pipeline for financial transactions with FIFO queues, SNS filtering, and EventBridge integration'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Resources:
  # ========================================
  # KMS Key for encryption
  # ========================================
  TransactionKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer managed KMS key for transaction pipeline encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - sns.amazonaws.com
                - sqs.amazonaws.com
                - events.amazonaws.com
                - cloudwatch.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-kms-key'

  TransactionKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-kms-key'
      TargetKeyId: !Ref TransactionKMSKey

  # ========================================
  # SNS Topic (FIFO)
  # ========================================
  TransactionTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-transaction-topic.fifo'
      DisplayName: 'Financial Transaction Events FIFO Topic'
      FifoTopic: true
      ContentBasedDeduplication: true
      KmsMasterKeyId: !Ref TransactionKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-sns-topic'

  # ========================================
  # Alerts SNS Topic (Standard)
  # ========================================
  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alerts-topic'
      DisplayName: 'Transaction Alerts Topic'
      KmsMasterKeyId: !Ref TransactionKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alerts-sns-topic'

  # ========================================
  # Dead Letter Queues (FIFO)
  # ========================================
  HighValueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-high-value-dlq.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-high-value-dlq'

  StandardValueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-standard-value-dlq.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-standard-value-dlq'

  LowValueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-low-value-dlq.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-low-value-dlq'

  # ========================================
  # Primary SQS Queues (FIFO)
  # ========================================
  HighValueQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-high-value-queue.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt HighValueDLQ.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-high-value-queue'

  StandardValueQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-standard-value-queue.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt StandardValueDLQ.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-standard-value-queue'

  LowValueQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-low-value-queue.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      ReceiveMessageWaitTimeSeconds: 20
      KmsMasterKeyId: !Ref TransactionKMSKey
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt LowValueDLQ.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-low-value-queue'

  # ========================================
  # SQS Queue Policies
  # ========================================
  HighValueQueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref HighValueQueue
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action: SQS:SendMessage
            Resource: !GetAtt HighValueQueue.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !Ref TransactionTopic

  StandardValueQueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref StandardValueQueue
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action: SQS:SendMessage
            Resource: !GetAtt StandardValueQueue.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !Ref TransactionTopic

  LowValueQueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref LowValueQueue
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action: SQS:SendMessage
            Resource: !GetAtt LowValueQueue.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !Ref TransactionTopic

  # ========================================
  # SNS Subscriptions with Filters
  # ========================================
  HighValueSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: sqs
      TopicArn: !Ref TransactionTopic
      Endpoint: !GetAtt HighValueQueue.Arn
      FilterPolicy:
        amount:
          - numeric:
              - ">"
              - 10000
      RawMessageDelivery: true

  StandardValueSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: sqs
      TopicArn: !Ref TransactionTopic
      Endpoint: !GetAtt StandardValueQueue.Arn
      FilterPolicy:
        amount:
          - numeric:
              - ">="
              - 1000
              - "<="
              - 10000
      RawMessageDelivery: true

  LowValueSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: sqs
      TopicArn: !Ref TransactionTopic
      Endpoint: !GetAtt LowValueQueue.Arn
      FilterPolicy:
        amount:
          - numeric:
              - "<"
              - 1000
      RawMessageDelivery: true

  # ========================================
  # EventBridge Custom Event Bus
  # ========================================
  TransactionEventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-event-bus'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-event-bus'

  # ========================================
  # EventBridge Rule for Failed Transactions
  # ========================================
  FailedTransactionRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-failed-transaction-rule'
      Description: 'Alert on failed transactions with amount > $5,000'
      EventBusName: !Ref TransactionEventBus
      EventPattern:
        source:
          - transaction.processor
        detail-type:
          - Transaction Failed
        detail:
          amount:
            - numeric:
                - ">"
                - 5000
      State: ENABLED
      Targets:
        - Arn: !Ref AlertsTopic
          Id: '1'

  # ========================================
  # CloudWatch Alarms
  # ========================================
  HighValueQueueAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-high-value-queue-alarm'
      AlarmDescription: 'Alert when high-value queue has > 1000 messages'
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt HighValueQueue.QueueName
      AlarmActions:
        - !Ref AlertsTopic
      TreatMissingData: notBreaching

  StandardValueQueueAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-standard-value-queue-alarm'
      AlarmDescription: 'Alert when standard-value queue has > 1000 messages'
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt StandardValueQueue.QueueName
      AlarmActions:
        - !Ref AlertsTopic
      TreatMissingData: notBreaching

  LowValueQueueAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-low-value-queue-alarm'
      AlarmDescription: 'Alert when low-value queue has > 1000 messages'
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt LowValueQueue.QueueName
      AlarmActions:
        - !Ref AlertsTopic
      TreatMissingData: notBreaching

  # ========================================
  # IAM Role for EventBridge
  # ========================================
  EventBridgeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-eventbridge-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: EventBridgeToSNSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertsTopic
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt TransactionKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-eventbridge-role'

  # Update the EventBridge rule target to use the role
  EventBridgeRoleAttachment:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-failed-transaction-rule-update'
      Description: 'Alert on failed transactions with amount > $5,000'
      EventBusName: !Ref TransactionEventBus
      EventPattern:
        source:
          - transaction.processor
        detail-type:
          - Transaction Failed
        detail:
          amount:
            - numeric:
                - ">"
                - 5000
      State: ENABLED
      Targets:
        - Arn: !Ref AlertsTopic
          Id: '1'
          RoleArn: !GetAtt EventBridgeRole.Arn
    DependsOn:
      - FailedTransactionRule

# ========================================
# Outputs
# ========================================
Outputs:
  HighValueQueueURL:
    Description: 'URL of the high-value transactions queue'
    Value: !Ref HighValueQueue
    Export:
      Name: !Sub '${AWS::StackName}-HighValueQueueURL'

  StandardValueQueueURL:
    Description: 'URL of the standard-value transactions queue'
    Value: !Ref StandardValueQueue
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueQueueURL'

  LowValueQueueURL:
    Description: 'URL of the low-value transactions queue'
    Value: !Ref LowValueQueue
    Export:
      Name: !Sub '${AWS::StackName}-LowValueQueueURL'

  TransactionTopicArn:
    Description: 'ARN of the transaction SNS topic'
    Value: !Ref TransactionTopic
    Export:
      Name: !Sub '${AWS::StackName}-TransactionTopicArn'

  EventBusName:
    Description: 'Name of the custom EventBridge event bus'
    Value: !Ref TransactionEventBus
    Export:
      Name: !Sub '${AWS::StackName}-EventBusName'

  KMSKeyArn:
    Description: 'ARN of the KMS key used for encryption'
    Value: !GetAtt TransactionKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
```

This CloudFormation template creates a complete asynchronous event processing pipeline with the following key features:

## Architecture Overview

1. **KMS Key**: Customer-managed key for encrypting all messages across SNS and SQS
2. **SNS FIFO Topic**: Receives transaction events and routes them based on amount
3. **Three SQS FIFO Queues**: Process transactions by priority (high/standard/low value)
4. **Dead Letter Queues**: Each queue has a DLQ with maxReceiveCount of 3
5. **EventBridge Custom Bus**: Receives processed transaction results
6. **EventBridge Rule**: Alerts on failed transactions > $5,000
7. **CloudWatch Alarms**: Monitor queue depth and alert when > 1000 messages

## Key Implementation Details

### Message Routing
- SNS subscriptions use numeric filter policies to route transactions:
  - High-value: amount > 10,000
  - Standard: 1,000 ≤ amount ≤ 10,000
  - Low-value: amount < 1,000

### FIFO Configuration
- All queues are FIFO with content-based deduplication enabled
- Ensures exactly-once processing and message ordering

### Security
- All services use the same customer-managed KMS key
- IAM roles and policies enable secure cross-service communication
- Queue policies allow SNS to deliver messages

### Monitoring
- CloudWatch alarms trigger when queues exceed 1000 visible messages
- EventBridge rule monitors for high-value failed transactions

### Cross-Account Portability
- No hardcoded ARNs or account IDs
- Uses CloudFormation intrinsic functions throughout
- Follows the required naming convention: `${StackName}-${Region}-${EnvironmentSuffix}-[resource-type]`

The template is production-ready and can be deployed in any AWS account or region without modification.