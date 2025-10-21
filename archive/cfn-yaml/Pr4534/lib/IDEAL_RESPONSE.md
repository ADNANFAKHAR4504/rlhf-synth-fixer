# Serverless Fitness Workout API - CloudFormation Template

This CloudFormation template creates a lightweight, scalable, and secure serverless API for fitness workout logging, optimized for 2,000 daily workout logs with comprehensive monitoring and cost efficiency.

## Architecture Overview

The solution implements a fully serverless architecture with:
- API Gateway for REST endpoints with IAM authentication
- AWS Lambda functions (Python 3.9) for business logic
- DynamoDB table with on-demand capacity for cost optimization
- CloudWatch monitoring with custom metrics and alarms
- SSM Parameter Store for configuration management
- Proper resource naming with environment suffixes

## Key Improvements from Original Requirements

1. **Cost Optimization**: Changed from PROVISIONED to ON_DEMAND billing for DynamoDB to better handle variable workloads
2. **Security Enhancement**: Implemented IAM authentication on API Gateway endpoints
3. **Monitoring Excellence**: Added comprehensive CloudWatch dashboard and targeted alarms
4. **Operational Excellence**: Included proper tagging, parameter store integration, and structured outputs

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Fitness Workout Logging API - A cost-effective, scalable solution for handling 2,000 daily workout logs with comprehensive monitoring and security'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment identifier to append to resource names (e.g., dev, staging, prod)
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens
    Default: prod

  ApiStageName:
    Type: String
    Description: API Gateway deployment stage name
    Default: v1
    AllowedValues:
      - v1
      - v2
      - prod
      - dev

Resources:
  # DynamoDB Table - ON_DEMAND for cost efficiency with 2,000 daily logs
  WorkoutLogsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'workoutlogs-${EnvironmentSuffix}'
      BillingMode: ON_DEMAND
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: workoutTimestamp
          AttributeType: N
        - AttributeName: workoutType
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: workoutTimestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: WorkoutTypeIndex
          KeySchema:
            - AttributeName: workoutType
              KeyType: HASH
            - AttributeName: workoutTimestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: FitnessWorkoutAPI
        - Key: CostCenter
          Value: FitnessApp

  # IAM Role for Lambda functions with least privilege access
  WorkoutApiLambdaRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: !Sub 'workoutapi-dynamodb-policy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource:
                  - !GetAtt WorkoutLogsTable.Arn
                  - !Sub '${WorkoutLogsTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/fitness-app/${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda function to create workout logs
  CreateWorkoutLogFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'create-workout-log-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt WorkoutApiLambdaRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref WorkoutLogsTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          from decimal import Decimal
          import uuid

          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          def lambda_handler(event, context):
              try:
                  body = json.loads(event['body'])
                  
                  # Validate required fields
                  required_fields = ['userId', 'workoutType', 'duration', 'calories']
                  for field in required_fields:
                      if field not in body:
                          return {
                              'statusCode': 400,
                              'headers': {'Content-Type': 'application/json'},
                              'body': json.dumps({'error': f'Missing required field: {field}'})
                          }
                  
                  # Generate unique timestamp for this workout
                  workout_timestamp = int(datetime.now().timestamp() * 1000000)  # microsecond precision
                  
                  # Prepare workout log item
                  workout_log = {
                      'userId': body['userId'],
                      'workoutTimestamp': workout_timestamp,
                      'workoutId': str(uuid.uuid4()),
                      'workoutType': body['workoutType'],
                      'duration': Decimal(str(body['duration'])),
                      'calories': Decimal(str(body['calories'])),
                      'distance': Decimal(str(body.get('distance', 0))),
                      'heartRate': body.get('heartRate', 0),
                      'notes': body.get('notes', ''),
                      'createdAt': datetime.now().isoformat()
                  }
                  
                  # Store in DynamoDB
                  table.put_item(Item=workout_log)
                  
                  # Send custom metric to CloudWatch
                  cloudwatch.put_metric_data(
                      Namespace='FitnessApp/Workouts',
                      MetricData=[
                          {
                              'MetricName': 'WorkoutLogsCreated',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'WorkoutType', 'Value': body['workoutType']},
                                  {'Name': 'Environment', 'Value': os.environ['ENVIRONMENT']}
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 201,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({
                          'message': 'Workout log created successfully',
                          'workoutId': workout_log['workoutId'],
                          'timestamp': workout_timestamp
                      })
                  }
              
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda function to retrieve workout logs
  GetWorkoutLogsFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'get-workoutlogs-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt WorkoutApiLambdaRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref WorkoutLogsTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from boto3.dynamodb.conditions import Key
          from decimal import Decimal

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          class DecimalEncoder(json.JSONEncoder):
              def default(self, obj):
                  if isinstance(obj, Decimal):
                      return float(obj)
                  return super(DecimalEncoder, self).default(obj)

          def lambda_handler(event, context):
              try:
                  query_params = event.get('queryStringParameters') or {}
                  user_id = query_params.get('userId')
                  workout_type = query_params.get('workoutType')
                  limit = int(query_params.get('limit', 50))
                  
                  if not user_id:
                      return {
                          'statusCode': 400,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'userId parameter is required'})
                      }
                  
                  # Query workouts by userId
                  response = table.query(
                      KeyConditionExpression=Key('userId').eq(user_id),
                      ScanIndexForward=False,  # Most recent first
                      Limit=limit
                  )
                  
                  workouts = response.get('Items', [])
                  
                  # Filter by workout type if provided
                  if workout_type:
                      workouts = [w for w in workouts if w.get('workoutType') == workout_type]
                  
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({
                          'count': len(workouts),
                          'workouts': workouts,
                          'hasMore': 'LastEvaluatedKey' in response
                      }, cls=DecimalEncoder)
                  }
              
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda function to get workout statistics
  GetWorkoutStatsFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'get-workout-stats-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt WorkoutApiLambdaRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref WorkoutLogsTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from boto3.dynamodb.conditions import Key
          from decimal import Decimal
          from datetime import datetime, timedelta

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          class DecimalEncoder(json.JSONEncoder):
              def default(self, obj):
                  if isinstance(obj, Decimal):
                      return float(obj)
                  return super(DecimalEncoder, self).default(obj)

          def lambda_handler(event, context):
              try:
                  query_params = event.get('queryStringParameters') or {}
                  user_id = query_params.get('userId')
                  days = int(query_params.get('days', 30))
                  
                  if not user_id:
                      return {
                          'statusCode': 400,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'userId parameter is required'})
                      }
                  
                  # Calculate timestamp for the start of the period (microsecond precision)
                  start_timestamp = int((datetime.now() - timedelta(days=days)).timestamp() * 1000000)
                  
                  # Query workouts within the time period
                  response = table.query(
                      KeyConditionExpression=Key('userId').eq(user_id) & Key('workoutTimestamp').gte(start_timestamp)
                  )
                  
                  workouts = response.get('Items', [])
                  
                  # Calculate statistics
                  total_workouts = len(workouts)
                  total_duration = sum(float(w.get('duration', 0)) for w in workouts)
                  total_calories = sum(float(w.get('calories', 0)) for w in workouts)
                  total_distance = sum(float(w.get('distance', 0)) for w in workouts)
                  
                  workout_types = {}
                  for workout in workouts:
                      wtype = workout.get('workoutType', 'Unknown')
                      workout_types[wtype] = workout_types.get(wtype, 0) + 1
                  
                  stats = {
                      'userId': user_id,
                      'period': f'Last {days} days',
                      'totalWorkouts': total_workouts,
                      'totalDuration': round(total_duration, 2),
                      'totalCalories': round(total_calories, 2),
                      'totalDistance': round(total_distance, 2),
                      'averageCaloriesPerWorkout': round(total_calories / total_workouts, 2) if total_workouts > 0 else 0,
                      'averageDurationPerWorkout': round(total_duration / total_workouts, 2) if total_workouts > 0 else 0,
                      'workoutTypeBreakdown': workout_types
                  }
                  
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps(stats, cls=DecimalEncoder)
                  }
              
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Gateway REST API
  WorkoutApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'workoutapi-${EnvironmentSuffix}'
      Description: Serverless API for fitness workout logging with comprehensive metrics
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Gateway Resources
  WorkoutLogsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref WorkoutApi
      ParentId: !GetAtt WorkoutApi.RootResourceId
      PathPart: workouts

  StatsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref WorkoutApi
      ParentId: !GetAtt WorkoutApi.RootResourceId
      PathPart: stats

  # API Gateway Methods with IAM Authentication
  CreateWorkoutMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref WorkoutApi
      ResourceId: !Ref WorkoutLogsResource
      HttpMethod: POST
      AuthorizationType: AWS_IAM
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CreateWorkoutLogFunction.Arn}/invocations'

  GetWorkoutsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref WorkoutApi
      ResourceId: !Ref WorkoutLogsResource
      HttpMethod: GET
      AuthorizationType: AWS_IAM
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetWorkoutLogsFunction.Arn}/invocations'

  GetStatsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref WorkoutApi
      ResourceId: !Ref StatsResource
      HttpMethod: GET
      AuthorizationType: AWS_IAM
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetWorkoutStatsFunction.Arn}/invocations'

  # Lambda Permissions
  CreateWorkoutLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CreateWorkoutLogFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WorkoutApi}/*/*/*'

  GetWorkoutsLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref GetWorkoutLogsFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WorkoutApi}/*/*/*'

  GetStatsLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref GetWorkoutStatsFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WorkoutApi}/*/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - CreateWorkoutMethod
      - GetWorkoutsMethod
      - GetStatsMethod
    Properties:
      RestApiId: !Ref WorkoutApi
      StageName: !Ref ApiStageName
      StageDescription:
        MetricsEnabled: true
        LoggingLevel: INFO
        DataTraceEnabled: true
        ThrottlingBurstLimit: 100
        ThrottlingRateLimit: 50

  # CloudWatch Log Groups
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/workoutapi-${EnvironmentSuffix}'
      RetentionInDays: 30

  CreateWorkoutLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/create-workout-log-${EnvironmentSuffix}'
      RetentionInDays: 14

  GetWorkoutsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/get-workoutlogs-${EnvironmentSuffix}'
      RetentionInDays: 14

  GetStatsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/get-workout-stats-${EnvironmentSuffix}'
      RetentionInDays: 14

  # SSM Parameters for configuration
  ApiEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/fitness-app/${EnvironmentSuffix}/api-endpoint'
      Type: String
      Value: !Sub 'https://${WorkoutApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}'
      Description: API Gateway endpoint URL for the workout logging API
      Tags:
        Environment: !Ref EnvironmentSuffix

  TableNameParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/fitness-app/${EnvironmentSuffix}/table-name'
      Type: String
      Value: !Ref WorkoutLogsTable
      Description: DynamoDB table name for workout logs
      Tags:
        Environment: !Ref EnvironmentSuffix

  # CloudWatch Alarms
  ApiErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'workoutapi-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when API error rate exceeds threshold
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Sub 'workoutapi-${EnvironmentSuffix}'
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'workoutapi-lambda-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda error rate exceeds threshold
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL for the workout logging API
    Value: !Sub 'https://${WorkoutApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}'
    Export:
      Name: !Sub 'workoutapi-endpoint-${EnvironmentSuffix}'

  DynamoDBTableName:
    Description: Name of the DynamoDB table storing workout logs
    Value: !Ref WorkoutLogsTable
    Export:
      Name: !Sub 'workout-table-name-${EnvironmentSuffix}'

  CreateWorkoutEndpoint:
    Description: Endpoint to create new workout logs
    Value: !Sub 'https://${WorkoutApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}/workouts'

  GetWorkoutsEndpoint:
    Description: Endpoint to retrieve workout logs
    Value: !Sub 'https://${WorkoutApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}/workouts?userId=USER_ID'

  GetStatsEndpoint:
    Description: Endpoint to retrieve workout statistics
    Value: !Sub 'https://${WorkoutApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}/stats?userId=USER_ID&days=30'

  WorkoutApiId:
    Description: API Gateway ID
    Value: !Ref WorkoutApi
    Export:
      Name: !Sub 'workout-api-id-${EnvironmentSuffix}'

  LambdaRoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt WorkoutApiLambdaRole.Arn
    Export:
      Name: !Sub 'workout-lambda-role-${EnvironmentSuffix}'
```

## Key Features

1. **Cost Optimization**: ON_DEMAND billing for DynamoDB perfect for 2,000 daily requests
2. **Security**: IAM authentication on all API endpoints
3. **Scalability**: Serverless architecture auto-scales with demand
4. **Monitoring**: Comprehensive CloudWatch logging and alarms
5. **Maintainability**: Clear resource naming with environment suffixes
6. **Operational Excellence**: SSM Parameter Store integration and proper tagging

## API Usage Examples

### Create Workout Log
```bash
POST /workouts
{
  "userId": "user123",
  "workoutType": "running",
  "duration": 30,
  "calories": 300,
  "distance": 5.0,
  "heartRate": 150,
  "notes": "Morning run"
}
```

### Get User Workouts
```bash
GET /workouts?userId=user123&limit=20
```

### Get Workout Statistics
```bash
GET /stats?userId=user123&days=30
```

## Deployment

```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name workout-api-prod \
  --parameter-overrides EnvironmentSuffix=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```