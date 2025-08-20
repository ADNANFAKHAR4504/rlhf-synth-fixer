# CloudFormation YAML Implementation for Secure Serverless Infrastructure

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security Configuration as Code - Secure Serverless Infrastructure with S3, Lambda, CloudWatch, and VPC monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix for resource naming
    Default: dev
  VpcId:
    Type: String
    Description: VPC ID for Flow Logs monitoring (optional - will create one if not provided)
    Default: ""

Conditions:
  CreateVPC: !Equals
    - !Ref VpcId
    - ""

Resources:
  # VPC for Flow Logs (created only if VPC ID not provided)
  VPCForFlowLogs:
    Type: AWS::EC2::VPC
    Condition: CreateVPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flowlogs-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # S3 Bucket with SSE-S3 encryption
  ProdAppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-app-data-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production
        - Key: Security
          Value: Encrypted

  # IAM Role for Lambda function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'prod-lambda-s3-role-${EnvironmentSuffix}'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ProdAppDataBucket.Arn
                  - !Sub "${ProdAppDataBucket.Arn}/*"
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Group for Lambda with tiered pricing
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/prod-app-processor-${EnvironmentSuffix}"
      RetentionInDays: 30
      LogGroupClass: STANDARD
      Tags:
        - Key: Environment
          Value: Production
        - Key: CostOptimization
          Value: TieredPricing

  # Lambda function
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'prod-app-processor-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          s3_client = boto3.client('s3')
          
          def lambda_handler(event, context):
              bucket_name = os.environ.get('BUCKET_NAME')
              print(f"Processing S3 bucket: {bucket_name}")
              
              # Sample processing logic
              try:
                  response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
                  object_count = response.get('KeyCount', 0)
                  print(f"Found {object_count} objects in bucket")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Success',
                          'bucket': bucket_name,
                          'objectCount': object_count
                      })
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }
      Timeout: 30
      MemorySize: 256
      ReservedConcurrentExecutions: 100
      Environment:
        Variables:
          BUCKET_NAME: !Ref ProdAppDataBucket
          ENVIRONMENT: Production
      Tags:
        - Key: Environment
          Value: Production
        - Key: Function
          Value: AppProcessor
    DependsOn: LambdaLogGroup

  # SNS Topic for alerts
  ProdAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'prod-alerts-topic-${EnvironmentSuffix}'
      DisplayName: Production Alerts
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - Key: Environment
          Value: Production
        - Key: AlertType
          Value: Critical

  # CloudWatch Alarm for Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'prod-lambda-errors-${EnvironmentSuffix}'
      AlarmDescription: Monitor Lambda function errors in production
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
      AlarmActions:
        - !Ref ProdAlertsTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarm for Lambda duration
  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'prod-lambda-duration-${EnvironmentSuffix}'
      AlarmDescription: Monitor Lambda function duration
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 25000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      AlarmActions:
        - !Ref ProdAlertsTopic
      Tags:
        - Key: Environment
          Value: Production

  # IAM Role for VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'vpc-flow-logs-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Group for VPC Flow Logs
  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${EnvironmentSuffix}'
      RetentionInDays: 14
      LogGroupClass: STANDARD
      Tags:
        - Key: Environment
          Value: Production
        - Key: Monitoring
          Value: VPCFlowLogs

  # VPC Flow Logs for enhanced security monitoring
  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !If
        - CreateVPC
        - !Ref VPCForFlowLogs
        - !Ref VpcId
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogDestination: !GetAtt VPCFlowLogsGroup.Arn
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}'
      MaxAggregationInterval: 60
      Tags:
        - Key: Environment
          Value: Production
        - Key: Security
          Value: Enhanced

  # Lambda permission for S3 bucket notifications (optional)
  S3InvokeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !GetAtt ProdAppDataBucket.Arn

Outputs:
  BucketName:
    Description: Name of the S3 bucket
    Value: !Ref ProdAppDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-BucketName"

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub "${AWS::StackName}-LambdaArn"

  SNSTopicArn:
    Description: ARN of the SNS topic for alerts
    Value: !Ref ProdAlertsTopic
    Export:
      Name: !Sub "${AWS::StackName}-SNSTopicArn"

  VPCFlowLogsId:
    Description: ID of the VPC Flow Logs
    Value: !Ref VPCFlowLogs
    Export:
      Name: !Sub "${AWS::StackName}-VPCFlowLogsId"
```