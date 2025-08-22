# CloudFormation Template for Serverless Application (Updated with Critical Fixes)

Based on the requirements provided, here is the corrected and complete CloudFormation template in YAML format that provisions a serverless application with Lambda, API Gateway, DynamoDB, and monitoring components. This version includes critical compliance fixes for us-east-1 region constraints.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless application with Lambda, API Gateway, DynamoDB, and monitoring'

Parameters:
  Environment:
    Type: String
    AllowedValues:
      - dev
      - stage
      - prod
    Default: dev
    Description: 'Environment name'

  LogLevel:
    Type: String
    AllowedValues:
      - INFO
      - WARN
      - ERROR
    Default: INFO
    Description: 'Log level for Lambda function'

Resources:
  # IAM Role for Lambda function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-serverless-lambda-role'
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
                  - dynamodb:PutItem
                Resource: !GetAtt DataTable.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:us-east-1:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-data-processor:*'

  # CloudWatch Log Group
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-data-processor'
      RetentionInDays: 14

  # Lambda function
  DataProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-data-processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime
          import uuid

          # Configure logging
          log_level = os.environ.get('LOG_LEVEL', 'INFO')
          logger = logging.getLogger()
          logger.setLevel(getattr(logging, log_level))

          # Initialize DynamoDB client
          dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION'))
          table_name = os.environ.get('TABLE_NAME')
          table = dynamodb.Table(table_name)

          def lambda_handler(event, context):
              try:
                  logger.info(f"Processing event: {json.dumps(event)}")
                  
                  # Extract data from event
                  if 'body' in event:
                      body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
                  else:
                      body = event
                  
                  # Create item for DynamoDB
                  item = {
                      'id': str(uuid.uuid4()),
                      'timestamp': datetime.utcnow().isoformat(),
                      'data': body,
                      'environment': os.environ.get('STAGE', 'dev')
                  }
                  
                  # Put item in DynamoDB
                  response = table.put_item(Item=item)
                  
                  logger.info(f"Successfully stored item with id: {item['id']}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json'
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'id': item['id']
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing data: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error'
                      })
                  }
      Environment:
        Variables:
          STAGE: !Ref Environment
          REGION: us-east-1
          LOG_LEVEL: !Ref LogLevel
          TABLE_NAME: !Ref DataTable
      Timeout: 30
      MemorySize: 128

  # DynamoDB Table
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-data-table'
      BillingMode: PROVISIONED
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5

  # DynamoDB Auto Scaling Target for Read Capacity
  ReadCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 20
      MinCapacity: 5
      ResourceId: !Sub 'table/${DataTable}'
      RoleARN: !GetAtt ApplicationAutoScalingDynamoDBRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  # DynamoDB Auto Scaling Target for Write Capacity
  WriteCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 20
      MinCapacity: 5
      ResourceId: !Sub 'table/${DataTable}'
      RoleARN: !GetAtt ApplicationAutoScalingDynamoDBRole.Arn
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  # Read Capacity Scaling Policy
  ReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ReadCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization

  # Write Capacity Scaling Policy
  WriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref WriteCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization

  # Application Auto Scaling Role for DynamoDB
  ApplicationAutoScalingDynamoDBRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/DynamoDBAutoscaleRole

  # API Gateway REST API
  DataAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${Environment}-data-api'
      Description: 'REST API for data processing'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resource
  DataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref DataAPI
      ParentId: !GetAtt DataAPI.RootResourceId
      PathPart: data

  # API Gateway Method
  DataPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref DataAPI
      ResourceId: !Ref DataResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${DataProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: '200'
          ResponseModels:
            application/json: Empty
        - StatusCode: '500'
          ResponseModels:
            application/json: Empty

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:us-east-1:${AWS::AccountId}:${DataAPI}/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - DataPostMethod
    Properties:
      RestApiId: !Ref DataAPI
      StageName: !Ref Environment

  # CloudWatch Alarm for Lambda Error Rate
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-lambda-error-rate-alarm'
      AlarmDescription: 'Alarm when Lambda error rate exceeds 5% for 5 minutes'
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 1
      Threshold: 5.0
      TreatMissingData: notBreaching
      Metrics:
        - Id: e1
          Expression: '(m1/m2)*100'
          Label: 'Error Rate (%)'
        - Id: m1
          MetricStat:
            Metric:
              MetricName: Errors
              Namespace: AWS/Lambda
              Dimensions:
                - Name: FunctionName
                  Value: !Ref DataProcessorFunction
            Period: 300
            Stat: Sum
          ReturnData: false
        - Id: m2
          MetricStat:
            Metric:
              MetricName: Invocations
              Namespace: AWS/Lambda
              Dimensions:
                - Name: FunctionName
                  Value: !Ref DataProcessorFunction
            Period: 300
            Stat: Sum
          ReturnData: false

Outputs:
  ApiEndpoint:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${DataAPI}.execute-api.us-east-1.amazonaws.com/${Environment}/data'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt DataProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  DynamoDBTableName:
    Description: 'DynamoDB table name'
    Value: !Ref DataTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'

  DynamoDBTableArn:
    Description: 'DynamoDB table ARN'
    Value: !GetAtt DataTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TableArn'
```

This CloudFormation template provides:

1. **Lambda Function**: Python 3.9 runtime with environment variables for STAGE, AWS_REGION, and LOG_LEVEL
2. **API Gateway**: REST API with POST /data endpoint that triggers the Lambda function
3. **DynamoDB Table**: With auto-scaling configuration targeting 70% utilization (5-20 capacity units)
4. **CloudWatch Monitoring**: Log group and error rate alarm (>5% for 5 minutes)
5. **IAM Roles**: Least privilege roles for Lambda execution and DynamoDB auto-scaling
6. **Parameters**: Environment (dev/stage/prod) and LogLevel (INFO/WARN/ERROR) with defaults
7. **Regional Deployment**: All resources explicitly configured for us-east-1 region

The template includes comprehensive error handling, monitoring, and follows AWS best practices for serverless applications.
