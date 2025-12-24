# Model Failures

## Shared IAM role instead of separate roles

The prompt said each function should have its own IAM role, but the model created a single LambdaExecutionRole shared by both functions.

Wrong:
```yaml
# Single role for both functions
LambdaExecutionRole:
  Type: AWS::IAM::Role
```

Should be:
```yaml
# Separate roles
DataProcessorExecutionRole:
  Type: AWS::IAM::Role

ResponseHandlerExecutionRole:
  Type: AWS::IAM::Role
```

This matters because the prompt specifically asked for "each function should have its own IAM role" for isolation. Sharing roles violates the least-privilege principle.

## Missing KMS encryption for CloudWatch Logs

The prompt required "Encrypt all CloudWatch log groups using a KMS customer-managed key" but the model didn't include any KMS resources or encryption configuration.

Missing:
```yaml
LogsKmsKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for encrypting projectX CloudWatch Logs
    KeyPolicy:
      # Proper key policy for CloudWatch Logs
```

And log groups should reference the KMS key:
```yaml
DataProcessorLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    KmsKeyId: !GetAtt LogsKmsKey.Arn  # This was missing
```

## No dead-letter queues for Lambda error handling

The prompt explicitly required "Add dead-letter queues (SQS) for both Lambda functions to capture failed invocations" but the model didn't include any SQS queues or DeadLetterConfig.

Missing resources:
```yaml
DataProcessorDLQ:
  Type: AWS::SQS::Queue

ResponseHandlerDLQ:
  Type: AWS::SQS::Queue
```

And Lambda functions should have DLQ configured:
```yaml
ProjectXDataProcessorFunction:
  Type: AWS::Lambda::Function
  Properties:
    DeadLetterConfig:
      TargetArn: !GetAtt DataProcessorDLQ.Arn  # This was missing
```

## No CloudWatch alarms for error monitoring

The prompt asked for "Set up CloudWatch alarms to monitor Lambda errors" and "Add CloudWatch alarms for the dead-letter queues" but the model didn't create any CloudWatch::Alarm resources.

Missing alarms:
```yaml
DataProcessorErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    MetricName: Errors
    Namespace: AWS/Lambda
    # Monitor Lambda errors

DataProcessorDLQAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    MetricName: ApproximateNumberOfMessagesVisible
    Namespace: AWS/SQS
    # Monitor DLQ messages
```

Without these alarms, there's no way to get notified when functions fail or when messages land in the DLQ.

## Missing SQS permissions in IAM roles

Even if DLQs were added, the IAM roles don't have permissions to send messages to SQS. Each role needs:

```yaml
- Effect: "Allow"
  Action:
    - "sqs:SendMessage"
  Resource:
    - !GetAtt DataProcessorDLQ.Arn  # Missing permission
```

## Missing Lambda invoke permission for dataProcessor

The dataProcessor function needs permission to invoke responseHandler, but this wasn't included:

```yaml
- Effect: "Allow"
  Action:
    - "lambda:InvokeFunction"
  Resource:
    - !GetAtt ProjectXResponseHandlerFunction.Arn  # Missing permission
```