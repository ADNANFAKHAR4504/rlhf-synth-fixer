I'll create a comprehensive CloudFormation template that meets all your security and logging requirements. Here's the complete YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure serverless infrastructure for Lambda with comprehensive logging and least-privilege IAM'

Parameters:
  VpcId:
    Type: String
    Default: vpc-123abcde
    Description: Pre-existing VPC ID
  
  S3BucketName:
    Type: String
    Default: lambda-logs-bucket
    Description: Existing S3 bucket for log persistence
  
  LambdaFunctionName:
    Type: String
    Default: SecureLambdaFunction
    Description: Name of the Lambda function

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Infrastructure Configuration"
        Parameters:
          - VpcId
          - S3BucketName
          - LambdaFunctionName

Resources:
  # CloudWatch Log Group with 15-day retention
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunctionName}'
      RetentionInDays: 15 # Exactly 15 days as required
    DeletionPolicy: Delete

  # IAM Role for Lambda execution with minimal required permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${LambdaFunctionName}-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic VPC execution permissions (required for VPC deployment)
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        # Custom policy for CloudWatch Logs with least privilege
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt LambdaLogGroup.Arn
              - Effect: Allow
                Action:
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunctionName}*'

  # IAM Role for CloudWatch Logs to access S3 (for log forwarding)
  CloudWatchLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${LambdaFunctionName}-cloudwatch-logs-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action: sts:AssumeRole
      Policies:
        # Minimal S3 permissions for log delivery
        - PolicyName: S3LogDeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource:
                  - !Sub 'arn:aws:s3:::${S3BucketName}'
                  - !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/*'

  # CloudWatch Logs Destination for S3 export
  LogDestination:
    Type: AWS::Logs::Destination
    Properties:
      DestinationName: !Sub '${LambdaFunctionName}-s3-destination'
      RoleArn: !GetAtt CloudWatchLogsRole.Arn
      TargetArn: !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs'
      DestinationPolicy: !Sub |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::${AWS::AccountId}:root"
              },
              "Action": "logs:PutSubscriptionFilter",
              "Resource": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:destination:${LambdaFunctionName}-s3-destination"
            }
          ]
        }

  # Subscription Filter to forward logs to S3
  LogSubscriptionFilter:
    Type: AWS::Logs::SubscriptionFilter
    Properties:
      LogGroupName: !Ref LambdaLogGroup
      FilterPattern: '' # Forward all logs
      DestinationArn: !GetAtt LogDestination.Arn

  # Security Group for Lambda (restrictive by default)
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda function with minimal access
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        # Allow HTTPS outbound for AWS API calls
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS for AWS API calls
        # Allow DNS resolution
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: DNS resolution
      Tags:
        - Key: Name
          Value: !Sub '${LambdaFunctionName}-security-group'

  # Get VPC subnets for Lambda deployment
  VpcInfo:
    Type: AWS::EC2::VPC
    Properties:
      VpcId: !Ref VpcId

  # Lambda Function with secure configuration
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      # VPC Configuration for secure deployment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: # You'll need to specify actual subnet IDs
          - subnet-12345678  # Replace with actual private subnet IDs
          - subnet-87654321  # Replace with actual private subnet IDs
      # Environment variables (if needed)
      Environment:
        Variables:
          LOG_LEVEL: INFO
          S3_BUCKET: !Ref S3BucketName
      # Dead Letter Queue for error handling
      DeadLetterConfig:
        TargetArn: !GetAtt DeadLetterQueue.Arn
      # Sample Lambda code for demonstration
      Code:
        ZipFile: |
          import json
          import logging
          import boto3
          import os
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          def lambda_handler(event, context):
              logger.info(f"Lambda invocation started - Request ID: {context.aws_request_id}")
              logger.info(f"Event received: {json.dumps(event)}")
              
              try:
                  # Your business logic here
                  result = {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Function executed successfully',
                          'requestId': context.aws_request_id
                      })
                  }
                  logger.info(f"Function completed successfully - Request ID: {context.aws_request_id}")
                  return result
                  
              except Exception as e:
                  logger.error(f"Error in lambda execution: {str(e)} - Request ID: {context.aws_request_id}")
                  raise
      Tags:
        - Key: Environment
          Value: Production
        - Key: Security
          Value: High

  # Dead Letter Queue for failed invocations
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${LambdaFunctionName}-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      VisibilityTimeoutSeconds: 60
      Tags:
        - Key: Purpose
          Value: Lambda-DLQ

  # CloudWatch Alarm for monitoring Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${LambdaFunctionName}-errors'
      AlarmDescription: Monitors Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

Outputs:
  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-arn'

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-lambda-name'

  LogGroupName:
    Description: CloudWatch Log Group name
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-log-group'

  SecurityGroupId:
    Description: Security Group ID for Lambda
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-security-group'

  DeadLetterQueueUrl:
    Description: Dead Letter Queue URL
    Value: !Ref DeadLetterQueue
    Export:
      Name: !Sub '${AWS::StackName}-dlq-url'
```

## Deployment Verification Steps

### 1. **Verify CloudWatch Logging**

```bash
# Test Lambda function invocation
aws lambda invoke \
  --function-name SecureLambdaFunction \
  --payload '{"test": "data"}' \
  response.json

# Check CloudWatch logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/SecureLambdaFunction"

# Verify log retention period
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/SecureLambdaFunction" \
  --query 'logGroups[0].retentionInDays'
```

### 2. **Verify S3 Log Persistence**

```bash
# Check if logs are being forwarded to S3
aws s3 ls s3://lambda-logs-bucket/lambda-logs/ --recursive

# Monitor log delivery (may take a few minutes)
aws logs describe-export-tasks \
  --status-code RUNNING
```

### 3. **Verify IAM Permissions (Least Privilege)**

```bash
# Check Lambda execution role permissions
aws iam get-role --role-name SecureLambdaFunction-execution-role

# List attached policies
aws iam list-attached-role-policies \
  --role-name SecureLambdaFunction-execution-role

# Review inline policies
aws iam list-role-policies \
  --role-name SecureLambdaFunction-execution-role

# Test permission boundaries (should fail for unauthorized actions)
aws lambda update-function-configuration \
  --function-name SecureLambdaFunction \
  --timeout 900  # This should work
```

### 4. **Security Verification**

```bash
# Verify VPC configuration
aws lambda get-function-configuration \
  --function-name SecureLambdaFunction \
  --query 'VpcConfig'

# Check security group rules
aws ec2 describe-security-groups \
  --group-names SecureLambdaFunction-security-group

# Verify no excessive permissions
aws iam simulate-principal-policy \
  --policy-source-arn $(aws iam get-role --role-name SecureLambdaFunction-execution-role --query 'Role.Arn' --output text) \
  --action-names s3:DeleteBucket \
  --resource-arns arn:aws:s3:::lambda-logs-bucket
```

### 5. **Monitoring and Alerting Verification**

```bash
# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names SecureLambdaFunction-errors

# Verify Dead Letter Queue
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name SecureLambdaFunction-dlq --query 'QueueUrl' --output text) \
  --attribute-names All
```

## Key Security Features Implemented

1. **Least Privilege IAM**: Roles have only the minimum required permissions
2. **VPC Isolation**: Lambda runs in a dedicated VPC with restrictive security groups
3. **Comprehensive Logging**: All invocations logged to CloudWatch and persisted to S3
4. **Error Handling**: Dead Letter Queue for failed invocations
5. **Monitoring**: CloudWatch alarms for error detection
6. **Resource Constraints**: 15-day log retention as specified
7. **Network Security**: Restrictive egress rules allowing only necessary traffic

This template ensures a secure, well-monitored Lambda deployment that meets all your specified requirements while following AWS security best practices.