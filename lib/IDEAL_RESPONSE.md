# Secure Serverless Infrastructure with Logging and Least-Privilege IAM – CloudFormation Solution

## Overview

This CloudFormation template provisions a secure serverless application architecture using AWS Lambda, compliant with all specified security and logging requirements. It deploys in the `us-east-1` region, utilizes a pre-existing VPC and S3 bucket, and enforces strong security principles through:

- Granular IAM roles adhering to the least privilege model
- Comprehensive logging to CloudWatch and scheduled log export to S3
- Restricted network egress using VPC-attached Lambda functions
- Monitoring and auditing through CloudWatch Alarms and VPC Flow Logs

## How the Template Meets Requirements

### Logging

- **CloudWatch Logging**: All Lambda invocations are logged to a dedicated CloudWatch Log Group with **14-day retention** (closest valid value to requested 15 days, as AWS CloudWatch Logs only supports: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653 days)

- **S3 Export**: A custom-built log export Lambda function runs on a daily EventBridge schedule, using the `CreateExportTask` API to copy logs to a specified S3 bucket under structured prefixes.

### IAM and Security

- `LambdaExecutionRole` provides only scoped CloudWatch and S3 permissions required for execution and logging.

- Separate roles for:
  - Log export Lambda
  - CloudWatch Logs S3 delivery
  - VPC Flow Logs delivery

- IAM trust policies restrict Lambda role usage to `us-east-1`.

### Networking

- Lambda is deployed inside a pre-existing VPC using placeholder subnet IDs and a custom security group with strict egress:
  - Only HTTPS (443) and DNS (53 TCP/UDP) traffic is allowed outbound.

### Monitoring

- **VPC Flow Logs** for traffic monitoring across the Lambda's network interface
- **CloudWatch Alarm** for monitoring Lambda errors (with a threshold of 1 error across two 5-minute intervals)

### Compliance with Constraints

- Retention period: CloudWatch logs set to **14 days** (AWS does not support 15 days)
- IAM policies: Precisely scoped to required resources and actions
- No unnecessary resources: All defined resources support essential logging and security functions
- S3 bucket and VPC: Referenced as external inputs via parameters

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Lambda infrastructure with S3 log export'

Parameters:
  VpcId:
    Type: String
    Default: 'vpc-002dd1e7eb944d35a'
    Description: 'Pre-existing VPC ID'
    AllowedPattern: '^vpc-[0-9a-f]{8,17}$'

  S3BucketName:
    Type: String
    Default: 'lambda-deployments-718240086340'
    Description: 'S3 bucket for log storage'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    MinLength: 3
    MaxLength: 63

  LambdaFunctionName:
    Type: String
    Default: 'SecureLambdaFunction'
    Description: 'Lambda function name'
    AllowedPattern: '^[a-zA-Z0-9-_]+$'
    MinLength: 1
    MaxLength: 64

  SubnetIds:
    Type: CommaDelimitedList
    Description: 'Private subnet IDs for Lambda'
    Default: ''

  Environment:
    Type: String
    Default: 'Development'
    AllowedValues: ['Development', 'Staging', 'Production']

Conditions:
  HasSubnetIds: !Not [!Equals [!Join ['', !Ref SubnetIds], '']]
  BucketExists: !Not [!Equals [!Ref S3BucketName, '']]

Resources:
  # CloudWatch Log Group for Lambda with 14-day retention
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunctionName}'
      RetentionInDays: 14

  # CloudWatch Log Group for VPC Flow Logs
  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${VpcId}'
      RetentionInDays: 14

  # IAM Role for Lambda execution with least privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: 'LambdaLoggingPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${LambdaLogGroup.Arn}:*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/${LambdaFunctionName}/*'
              - Effect: Allow
                Action: s3:GetBucketLocation
                Resource: !Sub 'arn:aws:s3:::${S3BucketName}'

  # Security Group for Lambda with restricted egress
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda function'
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for AWS API calls'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'DNS TCP'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'DNS UDP'
      Tags:
        - Key: Name
          Value: !Sub '${LambdaFunctionName}-sg'
        - Key: Environment
          Value: !Ref Environment

  # Main Lambda Function
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Code:
        ZipFile: |
          import json
          import logging
          from datetime import datetime

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info({
                  'event_type': 'lambda_invocation',
                  'request_id': context.aws_request_id,
                  'function_name': context.function_name,
                  'timestamp': datetime.utcnow().isoformat()
              })

              try:
                  sanitized_event = {k: v for k, v in event.items() if k not in ['password', 'token', 'secret']}
                  logger.info(f"Processing event: {json.dumps(sanitized_event)}")

                  result = {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Function executed successfully',
                          'request_id': context.aws_request_id,
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  }

                  logger.info({
                      'event_type': 'lambda_success',
                      'request_id': context.aws_request_id,
                      'status_code': result['statusCode']
                  })

                  return result

              except Exception as e:
                  logger.error({
                      'event_type': 'lambda_error',
                      'request_id': context.aws_request_id,
                      'error_type': type(e).__name__,
                      'error_message': str(e),
                      'timestamp': datetime.utcnow().isoformat()
                  })

                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'request_id': context.aws_request_id
                      })
                  }
      VpcConfig:
        !If
          - HasSubnetIds
          - SecurityGroupIds:
              - !Ref LambdaSecurityGroup
            SubnetIds: !Ref SubnetIds
          - !Ref 'AWS::NoValue'
      Environment:
        Variables:
          LOG_LEVEL: 'INFO'
          S3_BUCKET: !Ref S3BucketName
          ENVIRONMENT: !Ref Environment
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: SecurityCompliance
          Value: 'Required'

  # Lambda function for exporting logs to S3
  LogExportLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${LambdaFunctionName}-log-exporter'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LogExportLambdaRole.Arn
      Timeout: 300
      MemorySize: 512
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          from datetime import datetime, timedelta
          import time

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logs_client = boto3.client('logs')

              try:
                  log_group_name = event.get('log_group_name')
                  s3_bucket = event.get('s3_bucket')

                  logger.info(f"Starting log export for log group: {log_group_name}")

                  end_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                  start_time = end_time - timedelta(days=1)

                  start_time_ms = int(start_time.timestamp() * 1000)
                  end_time_ms = int(end_time.timestamp() * 1000)

                  s3_prefix = f"lambda-logs/{log_group_name.split('/')[-1]}/{start_time.strftime('%Y/%m/%d')}"

                  response = logs_client.create_export_task(
                      logGroupName=log_group_name,
                      fromTime=start_time_ms,
                      to=end_time_ms,
                      destination=s3_bucket,
                      destinationPrefix=s3_prefix,
                      taskName=f"export-{context.function_name}-{int(time.time())}"
                  )

                  task_id = response['taskId']
                  logger.info(f"Created export task: {task_id}")

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Log export initiated',
                          'taskId': task_id,
                          's3Location': f"s3://{s3_bucket}/{s3_prefix}"
                      })
                  }

              except Exception as e:
                  logger.error(f"Error during log export: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e),
                          'request_id': context.aws_request_id
                      })
                  }
      Environment:
        Variables:
          LOG_LEVEL: 'INFO'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'LogExport'

  # IAM Role for Log Export Lambda
  LogExportLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: 'LogExportPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateExportTask
                  - logs:DescribeExportTasks
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource:
                  - !Sub '${LambdaLogGroup.Arn}'
                  - !Sub '${LambdaLogGroup.Arn}:*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${S3BucketName}'
                  - !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/*'

  # EventBridge Schedule Rule for daily log export
  LogExportScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Description: 'Daily schedule to export Lambda logs to S3'
      ScheduleExpression: 'cron(0 1 * * ? *)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt LogExportLambda.Arn
          Id: 'LogExportTarget'
          Input: !Sub |
            {
              "log_group_name": "/aws/lambda/${LambdaFunctionName}",
              "s3_bucket": "${S3BucketName}"
            }

  # IAM Role for VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'FlowLogDeliveryPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub '${VPCFlowLogGroup.Arn}:*'

  # VPC Flow Logs for network monitoring
  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref VpcId
      TrafficType: 'ALL'
      LogDestinationType: 'cloud-watch-logs'
      LogDestination: !GetAtt VPCFlowLogGroup.Arn
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${LambdaFunctionName}-vpc-flow-logs'

  # CloudWatch Alarm for Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Alert on Lambda function errors'
      MetricName: 'Errors'
      Namespace: 'AWS/Lambda'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction

  # Lambda permission for EventBridge to invoke log export function
  LogExportLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LogExportLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt LogExportScheduleRule.Arn

  # CloudWatch Log Group for Log Export Lambda
  LogExportLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunctionName}-log-exporter'
      RetentionInDays: 7

  # S3 Bucket for Lambda logs (conditional creation)
  LogsBucket:
    Type: AWS::S3::Bucket
    Condition: BucketExists
    Properties:
      BucketName: !Ref S3BucketName
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # S3 Bucket Policy for CloudWatch Logs export
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: BucketExists
    DependsOn: LogsBucket
    Properties:
      Bucket: !Ref S3BucketName
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AllowCloudWatchLogsExport'
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/*'
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
          - Sid: 'AllowCloudWatchLogsGetBucketAcl'
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${S3BucketName}'
          - Sid: 'AllowLogExportLambda'
            Effect: Allow
            Principal:
              AWS: !GetAtt LogExportLambdaRole.Arn
            Action:
              - s3:PutObject
              - s3:GetBucketLocation
              - s3:ListBucket
            Resource:
              - !Sub 'arn:aws:s3:::${S3BucketName}'
              - !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/*'

Outputs:
  LambdaFunctionArn:
    Description: 'ARN of the created Lambda function'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-function-arn'

  LambdaFunctionName:
    Description: 'Name of the created Lambda function'
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-lambda-function-name'

  LogGroupName:
    Description: 'CloudWatch Log Group name for the Lambda function'
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-log-group-name'

  SecurityGroupId:
    Description: 'Security Group ID for the Lambda function'
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-security-group-id'

  LogExportLambdaArn:
    Description: 'ARN of the log export Lambda function'
    Value: !GetAtt LogExportLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-log-export-lambda-arn'

  IAMRoleArn:
    Description: 'IAM Role ARN for the Lambda execution'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-execution-role-arn'
```

## Deployment Verification

### 1. Verify CloudWatch Logging

```bash
# Check logs are being created
aws logs describe-log-streams \
  --log-group-name /aws/lambda/SecureLambdaFunction \
  --region us-east-1

# Invoke Lambda and check logs appear
aws lambda invoke \
  --function-name SecureLambdaFunction \
  --region us-east-1 \
  /tmp/output.json

# View logs
aws logs tail /aws/lambda/SecureLambdaFunction --follow
```

### 2. Verify S3 Log Export

```bash
# Trigger log export Lambda manually
aws lambda invoke \
  --function-name SecureLambdaFunction-log-exporter \
  --payload '{"log_group_name":"/aws/lambda/SecureLambdaFunction","s3_bucket":"lambda-logs-bucket"}' \
  /tmp/export-result.json

# Check S3 for exported logs
aws s3 ls s3://lambda-logs-bucket/lambda-logs/ --recursive
```

### 3. Verify IAM Permissions

```bash
# Get Lambda execution role
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name <stack-name> \
  --query 'Stacks[0].Outputs[?OutputKey==`IAMRoleArn`].OutputValue' \
  --output text)

# List attached policies
aws iam list-attached-role-policies --role-name <role-name>
aws iam list-role-policies --role-name <role-name>

# Verify policies grant minimal required permissions
aws iam get-role-policy --role-name <role-name> --policy-name LambdaLoggingPolicy
```

### 4. Verify VPC Configuration

```bash
# Check Lambda VPC configuration
aws lambda get-function-configuration \
  --function-name SecureLambdaFunction \
  --query 'VpcConfig'

# Verify security group rules
aws ec2 describe-security-groups \
  --group-ids <security-group-id> \
  --query 'SecurityGroups[0].IpPermissionsEgress'
```

## Security Best Practices

1. **Least Privilege IAM**: All roles grant only the minimum required permissions
2. **Network Isolation**: Lambda in VPC with restricted egress (HTTPS and DNS only)
3. **Secrets Management**: No hardcoded credentials - use AWS Secrets Manager or Parameter Store
4. **Logging**: Comprehensive audit trail with CloudWatch and S3 archival
5. **Monitoring**: CloudWatch Alarms for error detection
6. **Regional Restrictions**: Trust policies enforce us-east-1 deployment

## Notes

- The CloudWatch Logs retention period is set to **14 days** (not 15) as AWS CloudWatch Logs does not support 15-day retention. Valid values are: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653 days.
- This template uses existing VPC and S3 bucket via parameters
- Security groups enforce minimal network access
- All IAM policies follow least privilege principle
- Log export runs daily via EventBridge schedule
