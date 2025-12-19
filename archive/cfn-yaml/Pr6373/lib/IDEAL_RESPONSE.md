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
          RoleArn: !GetAtt EventBridgeRole.Arn

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

  # ========================================
  # Additional Outputs for Testing
  # ========================================
  
  # KMS Key and Alias Outputs
  KMSKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref TransactionKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyAlias:
    Description: 'Alias of the KMS key used for encryption'
    Value: !Ref TransactionKMSKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'

  # SNS Topics Outputs
  AlertsTopicArn:
    Description: 'ARN of the alerts SNS topic'
    Value: !Ref AlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertsTopicArn'

  AlertsTopicName:
    Description: 'Name of the alerts SNS topic'
    Value: !GetAtt AlertsTopic.TopicName
    Export:
      Name: !Sub '${AWS::StackName}-AlertsTopicName'

  TransactionTopicName:
    Description: 'Name of the transaction SNS topic'
    Value: !GetAtt TransactionTopic.TopicName
    Export:
      Name: !Sub '${AWS::StackName}-TransactionTopicName'

  # Dead Letter Queues Outputs
  HighValueDLQUrl:
    Description: 'URL of the high-value dead letter queue'
    Value: !Ref HighValueDLQ
    Export:
      Name: !Sub '${AWS::StackName}-HighValueDLQUrl'

  HighValueDLQArn:
    Description: 'ARN of the high-value dead letter queue'
    Value: !GetAtt HighValueDLQ.Arn
    Export:
      Name: !Sub '${AWS::StackName}-HighValueDLQArn'

  StandardValueDLQUrl:
    Description: 'URL of the standard-value dead letter queue'
    Value: !Ref StandardValueDLQ
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueDLQUrl'

  StandardValueDLQArn:
    Description: 'ARN of the standard-value dead letter queue'
    Value: !GetAtt StandardValueDLQ.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueDLQArn'

  LowValueDLQUrl:
    Description: 'URL of the low-value dead letter queue'
    Value: !Ref LowValueDLQ
    Export:
      Name: !Sub '${AWS::StackName}-LowValueDLQUrl'

  LowValueDLQArn:
    Description: 'ARN of the low-value dead letter queue'
    Value: !GetAtt LowValueDLQ.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LowValueDLQArn'

  # Main Queues Additional Outputs
  HighValueQueueArn:
    Description: 'ARN of the high-value transactions queue'
    Value: !GetAtt HighValueQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-HighValueQueueArn'

  HighValueQueueName:
    Description: 'Name of the high-value transactions queue'
    Value: !GetAtt HighValueQueue.QueueName
    Export:
      Name: !Sub '${AWS::StackName}-HighValueQueueName'

  StandardValueQueueArn:
    Description: 'ARN of the standard-value transactions queue'
    Value: !GetAtt StandardValueQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueQueueArn'

  StandardValueQueueName:
    Description: 'Name of the standard-value transactions queue'
    Value: !GetAtt StandardValueQueue.QueueName
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueQueueName'

  LowValueQueueArn:
    Description: 'ARN of the low-value transactions queue'
    Value: !GetAtt LowValueQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LowValueQueueArn'

  LowValueQueueName:
    Description: 'Name of the low-value transactions queue'
    Value: !GetAtt LowValueQueue.QueueName
    Export:
      Name: !Sub '${AWS::StackName}-LowValueQueueName'

  # SNS Subscriptions Outputs
  HighValueSubscriptionArn:
    Description: 'ARN of the high-value SNS subscription'
    Value: !Ref HighValueSubscription
    Export:
      Name: !Sub '${AWS::StackName}-HighValueSubscriptionArn'

  StandardValueSubscriptionArn:
    Description: 'ARN of the standard-value SNS subscription'
    Value: !Ref StandardValueSubscription
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueSubscriptionArn'

  LowValueSubscriptionArn:
    Description: 'ARN of the low-value SNS subscription'
    Value: !Ref LowValueSubscription
    Export:
      Name: !Sub '${AWS::StackName}-LowValueSubscriptionArn'

  # EventBridge Outputs
  TransactionEventBusArn:
    Description: 'ARN of the custom EventBridge event bus'
    Value: !GetAtt TransactionEventBus.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TransactionEventBusArn'

  FailedTransactionRuleName:
    Description: 'Name of the failed transaction EventBridge rule'
    Value: !Ref FailedTransactionRule
    Export:
      Name: !Sub '${AWS::StackName}-FailedTransactionRuleName'

  FailedTransactionRuleArn:
    Description: 'ARN of the failed transaction EventBridge rule'
    Value: !GetAtt FailedTransactionRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-FailedTransactionRuleArn'

  # CloudWatch Alarms Outputs
  HighValueQueueAlarmName:
    Description: 'Name of the high-value queue CloudWatch alarm'
    Value: !Ref HighValueQueueAlarm
    Export:
      Name: !Sub '${AWS::StackName}-HighValueQueueAlarmName'

  StandardValueQueueAlarmName:
    Description: 'Name of the standard-value queue CloudWatch alarm'
    Value: !Ref StandardValueQueueAlarm
    Export:
      Name: !Sub '${AWS::StackName}-StandardValueQueueAlarmName'

  LowValueQueueAlarmName:
    Description: 'Name of the low-value queue CloudWatch alarm'
    Value: !Ref LowValueQueueAlarm
    Export:
      Name: !Sub '${AWS::StackName}-LowValueQueueAlarmName'

  # IAM Role Outputs
  EventBridgeRoleArn:
    Description: 'ARN of the EventBridge IAM role'
    Value: !GetAtt EventBridgeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EventBridgeRoleArn'

  EventBridgeRoleName:
    Description: 'Name of the EventBridge IAM role'
    Value: !Ref EventBridgeRole
    Export:
      Name: !Sub '${AWS::StackName}-EventBridgeRoleName'

  # Stack Information Outputs
  StackName:
    Description: 'Name of the CloudFormation stack'
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  Region:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'

  EnvironmentSuffix:
    Description: 'Environment suffix used in resource names'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'