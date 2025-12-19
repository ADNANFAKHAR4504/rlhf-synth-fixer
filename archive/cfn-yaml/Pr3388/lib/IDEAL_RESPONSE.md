# Serverless Survey Data Collection System

A complete CloudFormation template for a serverless survey data collection and analysis system that handles 3k daily responses with real-time aggregation.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Survey Data Collection and Analysis System'

Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Deployment environment
    
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for unique resource naming
    
  ApiRateLimit:
    Type: Number
    Default: 1000
    Description: API Gateway throttling limit per second
    
  AdminEmail:
    Type: String
    Default: govardhan.y@turing.com
    Description: Admin email address for notifications

Resources:
  # DynamoDB Table with GSI for efficient querying
  SurveyResponseTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "SurveyResponses-${EnvironmentSuffix}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: responseId
          AttributeType: S
        - AttributeName: surveyId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
        - AttributeName: respondentId
          AttributeType: S
      KeySchema:
        - AttributeName: responseId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: SurveyIdIndex
          KeySchema:
            - AttributeName: surveyId
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: RespondentIndex
          KeySchema:
            - AttributeName: respondentId
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

  # S3 Bucket for backup exports
  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "survey-backups-${AWS::AccountId}-${EnvironmentSuffix}"
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToInfrequentAccess
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA

  # Lambda Execution Role
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
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SurveyDataAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: 
                  - !GetAtt SurveyResponseTable.Arn
                  - !Sub "${SurveyResponseTable.Arn}/index/*"
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub "${BackupBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref AdminNotificationTopic

  # Survey Submission Lambda
  SubmissionFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "survey-submission-${EnvironmentSuffix}"
      Runtime: python3.10
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref SurveyResponseTable
          REGION: us-east-1
      Code:
        ZipFile: |
          import json
          import boto3
          import uuid
          import os
          import datetime
          
          # Initialize DynamoDB client
          dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
          table = dynamodb.Table(os.environ['TABLE_NAME'])
          
          def handler(event, context):
              try:
                  # Parse request body
                  body = json.loads(event['body'])
                  
                  # Validate required fields
                  if 'surveyId' not in body or 'responses' not in body:
                      return {
                          'statusCode': 400,
                          'body': json.dumps({'error': 'Missing required fields'})
                      }
                  
                  # Generate unique ID and timestamp
                  response_id = str(uuid.uuid4())
                  timestamp = datetime.datetime.now().isoformat()
                  
                  # Create item for DynamoDB
                  item = {
                      'responseId': response_id,
                      'surveyId': body['surveyId'],
                      'timestamp': timestamp,
                      'responses': body['responses']
                  }
                  
                  # Add optional fields if present
                  if 'respondentId' in body:
                      item['respondentId'] = body['respondentId']
                  
                  # Save to DynamoDB
                  table.put_item(Item=item)
                  
                  return {
                      'statusCode': 201,
                      'body': json.dumps({'responseId': response_id})
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Internal server error'})
                  }

  # Aggregation Lambda Function
  AggregationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "survey-aggregation-${EnvironmentSuffix}"
      Runtime: python3.10
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 120
      Environment:
        Variables:
          TABLE_NAME: !Ref SurveyResponseTable
          BUCKET_NAME: !Ref BackupBucket
          TOPIC_ARN: !Ref AdminNotificationTopic
          REGION: us-east-1
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import datetime
          from boto3.dynamodb.conditions import Key
          
          # Initialize clients
          dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
          s3 = boto3.client('s3', region_name=os.environ['REGION'])
          sns = boto3.client('sns', region_name=os.environ['REGION'])
          table = dynamodb.Table(os.environ['TABLE_NAME'])
          
          def handler(event, context):
              try:
                  # Get yesterday's date for aggregation
                  yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
                  
                  # Get all survey responses from yesterday
                  surveys = {}
                  
                  # Simplified example - would need pagination for production
                  scan_response = table.scan(
                      FilterExpression=Key('timestamp').begins_with(yesterday)
                  )
                  
                  # Group by survey ID
                  for item in scan_response.get('Items', []):
                      survey_id = item['surveyId']
                      if survey_id not in surveys:
                          surveys[survey_id] = []
                      surveys[survey_id].append(item)
                  
                  # Process aggregations for each survey
                  aggregation_results = {}
                  for survey_id, responses in surveys.items():
                      # Simple count aggregation - real implementation would be more complex
                      question_counts = {}
                      
                      for response in responses:
                          for question, answer in response.get('responses', {}).items():
                              if question not in question_counts:
                                  question_counts[question] = {}
                              
                              if answer not in question_counts[question]:
                                  question_counts[question][answer] = 0
                                  
                              question_counts[question][answer] += 1
                      
                      aggregation_results[survey_id] = {
                          'responseCount': len(responses),
                          'questionCounts': question_counts
                      }
                  
                  # Save aggregation to S3
                  s3_key = f"aggregations/{yesterday}.json"
                  s3.put_object(
                      Bucket=os.environ['BUCKET_NAME'],
                      Key=s3_key,
                      Body=json.dumps(aggregation_results),
                      ContentType='application/json'
                  )
                  
                  # Send notification
                  sns.publish(
                      TopicArn=os.environ['TOPIC_ARN'],
                      Subject=f"Survey Aggregation Complete - {yesterday}",
                      Message=f"Daily survey aggregation for {yesterday} is complete. " +
                              f"Processed {len(surveys)} surveys with a total of {sum([len(r) for r in surveys.values()])} responses. " +
                              f"Results stored at s3://{os.environ['BUCKET_NAME']}/{s3_key}"
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({'message': 'Aggregation complete'})
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  
                  # Send error notification
                  sns.publish(
                      TopicArn=os.environ['TOPIC_ARN'],
                      Subject="Error: Survey Aggregation Failed",
                      Message=f"An error occurred during survey aggregation: {str(e)}"
                  )
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Aggregation failed'})
                  }

  # Backup Lambda Function
  BackupFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "survey-backup-${EnvironmentSuffix}"
      Runtime: python3.10
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      Environment:
        Variables:
          TABLE_NAME: !Ref SurveyResponseTable
          BUCKET_NAME: !Ref BackupBucket
          TOPIC_ARN: !Ref AdminNotificationTopic
          REGION: us-east-1
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import datetime
          
          # Initialize clients
          dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
          s3 = boto3.client('s3', region_name=os.environ['REGION'])
          sns = boto3.client('sns', region_name=os.environ['REGION'])
          table = dynamodb.Table(os.environ['TABLE_NAME'])
          
          def handler(event, context):
              try:
                  # Get today's date for backup filename
                  today = datetime.datetime.now().strftime('%Y-%m-%d')
                  
                  # Fetch all items from DynamoDB (would use pagination in production)
                  response = table.scan()
                  items = response.get('Items', [])
                  
                  # Save to S3
                  s3_key = f"backups/full-backup-{today}.json"
                  s3.put_object(
                      Bucket=os.environ['BUCKET_NAME'],
                      Key=s3_key,
                      Body=json.dumps(items),
                      ContentType='application/json'
                  )
                  
                  # Send notification
                  sns.publish(
                      TopicArn=os.environ['TOPIC_ARN'],
                      Subject=f"Survey Data Backup Complete - {today}",
                      Message=f"Full survey data backup is complete. " +
                              f"Backed up {len(items)} records. " +
                              f"Backup stored at s3://{os.environ['BUCKET_NAME']}/{s3_key}"
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({'message': 'Backup complete'})
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  
                  # Send error notification
                  sns.publish(
                      TopicArn=os.environ['TOPIC_ARN'],
                      Subject="Error: Survey Backup Failed",
                      Message=f"An error occurred during survey backup: {str(e)}"
                  )
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Backup failed'})
                  }

  # API Gateway
  SurveyApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "SurveyAPI-${EnvironmentSuffix}"
      Description: "API for survey data collection"

  SurveyResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SurveyApi
      ParentId: !GetAtt SurveyApi.RootResourceId
      PathPart: "survey"

  SubmitResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SurveyApi
      ParentId: !Ref SurveyResource
      PathPart: "submit"

  SubmitMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SurveyApi
      ResourceId: !Ref SubmitResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${SubmissionFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: "200"
        - StatusCode: "201"
        - StatusCode: "400"
        - StatusCode: "500"

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: SubmitMethod
    Properties:
      RestApiId: !Ref SurveyApi
      Description: "Survey API Deployment"

  # API Gateway Stage
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref SurveyApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref Environment
      Description: !Sub "Survey API ${Environment} stage"
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  # API Gateway Usage Plan with throttling limits
  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: ApiStage
    Properties:
      ApiStages:
        - ApiId: !Ref SurveyApi
          Stage: !Ref Environment
      Description: "Usage plan for survey API with throttling"
      Throttle:
        BurstLimit: !Ref ApiRateLimit
        RateLimit: !Ref ApiRateLimit

  # Lambda permissions for API Gateway
  SubmissionFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref SubmissionFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:us-east-1:${AWS::AccountId}:${SurveyApi}/*/*/*"

  # EventBridge Rules
  DailyAggregationRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "daily-aggregation-${EnvironmentSuffix}"
      ScheduleExpression: "cron(0 1 * * ? *)"  # Daily at 1:00 AM UTC
      State: ENABLED
      Targets:
        - Id: DailyAggregationTarget
          Arn: !GetAtt AggregationFunction.Arn

  WeeklyBackupRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "weekly-backup-${EnvironmentSuffix}"
      ScheduleExpression: "cron(0 2 ? * SUN *)"  # Every Sunday at 2:00 AM UTC
      State: ENABLED
      Targets:
        - Id: WeeklyBackupTarget
          Arn: !GetAtt BackupFunction.Arn

  # Lambda permissions for EventBridge rules
  AggregationFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref AggregationFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DailyAggregationRule.Arn

  BackupFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref BackupFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt WeeklyBackupRule.Arn

  # SNS Topic for admin notifications
  AdminNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "survey-admin-notifications-${EnvironmentSuffix}"
      DisplayName: "Survey Admin Notifications"

  # Admin email subscription
  AdminEmailSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AdminNotificationTopic
      Protocol: email
      Endpoint: !Ref AdminEmail

  # CloudWatch Dashboard
  SurveyDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "survey-dashboard-${EnvironmentSuffix}"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Count", "ApiName", "${SurveyApi}", "Stage", "${Environment}", "Resource", "/survey/submit", "Method", "POST", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "API Submissions"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "4XXError", "ApiName", "${SurveyApi}", "Stage", "${Environment}", { "stat": "Sum" } ],
                  [ "AWS/ApiGateway", "5XXError", "ApiName", "${SurveyApi}", "Stage", "${Environment}", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "API Errors"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 24,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${SubmissionFunction}", { "stat": "Sum" } ],
                  [ "AWS/Lambda", "Errors", "FunctionName", "${SubmissionFunction}", { "stat": "Sum" } ],
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${AggregationFunction}", { "stat": "Sum" } ],
                  [ "AWS/Lambda", "Errors", "FunctionName", "${AggregationFunction}", { "stat": "Sum" } ],
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${BackupFunction}", { "stat": "Sum" } ],
                  [ "AWS/Lambda", "Errors", "FunctionName", "${BackupFunction}", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "Lambda Functions"
              }
            }
          ]
        }

  # CloudWatch Alarms
  ApiErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "API-Error-Alarm-${EnvironmentSuffix}"
      AlarmDescription: "Alarm when the API Gateway has errors"
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Dimensions:
        - Name: ApiName
          Value: !Ref SurveyApi
        - Name: Stage
          Value: !Ref Environment
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AdminNotificationTopic

Outputs:
  ApiEndpoint:
    Description: "API Endpoint URL for survey submission"
    Value: !Sub "https://${SurveyApi}.execute-api.us-east-1.amazonaws.com/${Environment}/survey/submit"
    Export:
      Name: !Sub "${AWS::StackName}-ApiEndpoint"
  
  ApiGatewayId:
    Description: "API Gateway ID"
    Value: !Ref SurveyApi
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayId"
      
  ApiStageName:
    Description: "API Gateway Stage Name"
    Value: !Ref ApiStage
    Export:
      Name: !Sub "${AWS::StackName}-ApiStageName"
  
  DynamoDBTableName:
    Description: "DynamoDB Table Name"
    Value: !Ref SurveyResponseTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTableName"
  
  BackupBucketName:
    Description: "S3 Backup Bucket Name"
    Value: !Ref BackupBucket
    Export:
      Name: !Sub "${AWS::StackName}-BackupBucketName"
  
  DashboardURL:
    Description: "CloudWatch Dashboard URL"
    Value: !Sub "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${SurveyDashboard}"
    Export:
      Name: !Sub "${AWS::StackName}-DashboardURL"
```

## Lambda Handler Files

### lib/lambda/submission_handler.py

```python
import json
import boto3
import uuid
import os
import datetime
import logging

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Lambda function handler for survey submission
    Validates input, generates unique ID and timestamp, stores in DynamoDB
    """
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        if 'surveyId' not in body or 'responses' not in body:
            logger.warning("Missing required fields in request")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields: surveyId and responses are required'})
            }
        
        # Validate data types
        if not isinstance(body['responses'], dict):
            logger.warning("Invalid responses format - must be an object")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Responses must be an object/dictionary'})
            }
        
        # Generate unique ID and timestamp
        response_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()
        
        # Create item for DynamoDB
        item = {
            'responseId': response_id,
            'surveyId': body['surveyId'],
            'timestamp': timestamp,
            'responses': body['responses']
        }
        
        # Add optional fields if present
        if 'respondentId' in body:
            item['respondentId'] = body['respondentId']
        
        # Add metadata
        item['createdAt'] = timestamp
        item['source'] = 'api'
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored response with ID: {response_id}")
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'responseId': response_id,
                'message': 'Survey response submitted successfully',
                'timestamp': timestamp
            })
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON format in request body'})
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### lib/lambda/aggregation_handler.py

```python
import json
import boto3
import os
import datetime
import logging
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])
sns = boto3.client('sns', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function handler for daily survey data aggregation
    Aggregates yesterday's responses by survey and stores results in S3
    """
    try:
        logger.info("Starting daily aggregation process")
        
        # Get yesterday's date for aggregation
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        
        logger.info(f"Aggregating data for date: {yesterday}")
        
        # Get all survey responses from yesterday using scan with filter
        surveys = {}
        total_items_processed = 0
        
        # Scan with pagination to handle large datasets
        scan_kwargs = {
            'FilterExpression': Key('timestamp').begins_with(yesterday)
        }
        
        while True:
            response = table.scan(**scan_kwargs)
            
            # Group by survey ID
            for item in response.get('Items', []):
                survey_id = item['surveyId']
                if survey_id not in surveys:
                    surveys[survey_id] = []
                surveys[survey_id].append(item)
                total_items_processed += 1
            
            # Check if we need to continue scanning
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        logger.info(f"Processed {total_items_processed} items across {len(surveys)} surveys")
        
        # Process aggregations for each survey
        aggregation_results = {
            'date': yesterday,
            'generated_at': datetime.datetime.now().isoformat(),
            'total_surveys': len(surveys),
            'total_responses': total_items_processed,
            'survey_data': {}
        }
        
        for survey_id, responses in surveys.items():
            # Enhanced aggregation with question analysis
            question_counts = {}
            response_times = []
            respondent_ids = set()
            
            for response in responses:
                # Track unique respondents
                if 'respondentId' in response:
                    respondent_ids.add(response['respondentId'])
                
                # Store response timestamp for analysis
                response_times.append(response['timestamp'])
                
                # Analyze each question-answer pair
                for question, answer in response.get('responses', {}).items():
                    if question not in question_counts:
                        question_counts[question] = {
                            'total_responses': 0,
                            'answer_distribution': {}
                        }
                    
                    question_counts[question]['total_responses'] += 1
                    
                    # Convert answer to string for consistent aggregation
                    answer_str = str(answer)
                    if answer_str not in question_counts[question]['answer_distribution']:
                        question_counts[question]['answer_distribution'][answer_str] = 0
                    
                    question_counts[question]['answer_distribution'][answer_str] += 1
            
            # Calculate response rate and timing statistics
            aggregation_results['survey_data'][survey_id] = {
                'total_responses': len(responses),
                'unique_respondents': len(respondent_ids),
                'first_response': min(response_times) if response_times else None,
                'last_response': max(response_times) if response_times else None,
                'questions': question_counts
            }
        
        # Save aggregation to S3
        s3_key = f"aggregations/daily/{yesterday}-aggregation.json"
        
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(aggregation_results, cls=DecimalEncoder, indent=2),
            ContentType='application/json',
            Metadata={
                'aggregation-date': yesterday,
                'generated-by': 'survey-aggregation-lambda',
                'total-responses': str(total_items_processed)
            }
        )
        
        logger.info(f"Aggregation saved to S3: {s3_key}")
        
        # Send success notification
        message = f"""Daily survey aggregation for {yesterday} completed successfully.

Summary:
- Date: {yesterday}
- Total Surveys: {len(surveys)}
- Total Responses: {total_items_processed}
- Aggregation File: s3://{os.environ['BUCKET_NAME']}/{s3_key}

Survey Breakdown:
{chr(10).join([f"- {survey_id}: {data['total_responses']} responses" for survey_id, data in aggregation_results['survey_data'].items()])}

Generated at: {aggregation_results['generated_at']}"""
        
        sns.publish(
            TopicArn=os.environ['TOPIC_ARN'],
            Subject=f"Survey Aggregation Complete - {yesterday}",
            Message=message
        )
        
        logger.info("Success notification sent")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Aggregation completed successfully',
                'date': yesterday,
                'total_surveys': len(surveys),
                'total_responses': total_items_processed,
                's3_location': f"s3://{os.environ['BUCKET_NAME']}/{s3_key}"
            })
        }
        
    except Exception as e:
        error_msg = f"Error during aggregation: {str(e)}"
        logger.error(error_msg)
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=os.environ['TOPIC_ARN'],
                Subject="Error: Survey Aggregation Failed",
                Message=f"""An error occurred during the daily survey aggregation process.

Error Details:
{error_msg}

Date Attempted: {yesterday}
Timestamp: {datetime.datetime.now().isoformat()}

Please check CloudWatch logs for more details."""
            )
        except Exception as sns_error:
            logger.error(f"Failed to send error notification: {str(sns_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Aggregation failed', 'details': str(e)})
        }
```

### lib/lambda/backup_handler.py

```python
import json
import boto3
import os
import datetime
import logging
from decimal import Decimal

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])
sns = boto3.client('sns', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function handler for weekly survey data backup
    Creates a complete backup of DynamoDB table data to S3
    """
    try:
        logger.info("Starting weekly backup process")
        
        # Get current date for backup filename
        today = datetime.datetime.now()
        backup_date = today.strftime('%Y-%m-%d')
        week_start = (today - datetime.timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        logger.info(f"Creating backup for week starting: {week_start}")
        
        # Fetch all items from DynamoDB with pagination
        items = []
        scan_kwargs = {}
        items_processed = 0
        
        # Scan with pagination to handle large datasets
        while True:
            response = table.scan(**scan_kwargs)
            
            batch_items = response.get('Items', [])
            items.extend(batch_items)
            items_processed += len(batch_items)
            
            logger.info(f"Processed {items_processed} items so far...")
            
            # Check if we need to continue scanning
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        logger.info(f"Total items retrieved: {len(items)}")
        
        # Create backup metadata
        backup_metadata = {
            'backup_date': backup_date,
            'backup_timestamp': today.isoformat(),
            'week_start': week_start,
            'total_records': len(items),
            'table_name': os.environ['TABLE_NAME'],
            'backup_type': 'weekly_full',
            'generated_by': 'survey-backup-lambda'
        }
        
        # Organize data by date for better structure
        backup_data = {
            'metadata': backup_metadata,
            'data': items
        }
        
        # Create comprehensive backup file
        s3_key = f"backups/weekly/week-{week_start}-backup.json"
        
        # Upload to S3 with metadata
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(backup_data, cls=DecimalEncoder, indent=2),
            ContentType='application/json',
            Metadata={
                'backup-date': backup_date,
                'week-start': week_start,
                'record-count': str(len(items)),
                'backup-type': 'weekly-full'
            }
        )
        
        # Also create a compressed manifest file for quick reference
        manifest = {
            'backup_info': backup_metadata,
            'statistics': {
                'total_records': len(items),
                'date_range': {
                    'earliest_record': min([item.get('timestamp', '') for item in items]) if items else None,
                    'latest_record': max([item.get('timestamp', '') for item in items]) if items else None
                },
                'survey_counts': {}
            }
        }
        
        # Calculate survey statistics
        survey_counts = {}
        for item in items:
            survey_id = item.get('surveyId', 'unknown')
            survey_counts[survey_id] = survey_counts.get(survey_id, 0) + 1
        
        manifest['statistics']['survey_counts'] = survey_counts
        
        # Save manifest file
        manifest_key = f"backups/weekly/week-{week_start}-manifest.json"
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=manifest_key,
            Body=json.dumps(manifest, cls=DecimalEncoder, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Backup saved to S3: {s3_key}")
        logger.info(f"Manifest saved to S3: {manifest_key}")
        
        # Calculate backup size estimate (rough)
        backup_size_mb = len(json.dumps(backup_data, cls=DecimalEncoder)) / (1024 * 1024)
        
        # Send success notification with detailed statistics
        message = f"""Weekly survey data backup completed successfully.

Backup Details:
- Week Starting: {week_start}
- Backup Date: {backup_date}
- Total Records: {len(items):,}
- Estimated Size: {backup_size_mb:.2f} MB

Files Created:
- Backup File: s3://{os.environ['BUCKET_NAME']}/{s3_key}
- Manifest File: s3://{os.environ['BUCKET_NAME']}/{manifest_key}

Survey Distribution:
{chr(10).join([f"- {survey_id}: {count:,} responses" for survey_id, count in sorted(survey_counts.items())])}

Date Range:
- Earliest Record: {manifest['statistics']['date_range']['earliest_record']}
- Latest Record: {manifest['statistics']['date_range']['latest_record']}

Generated at: {backup_metadata['backup_timestamp']}"""
        
        sns.publish(
            TopicArn=os.environ['TOPIC_ARN'],
            Subject=f"Survey Data Backup Complete - Week of {week_start}",
            Message=message
        )
        
        logger.info("Success notification sent")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup completed successfully',
                'backup_date': backup_date,
                'week_start': week_start,
                'total_records': len(items),
                'backup_location': f"s3://{os.environ['BUCKET_NAME']}/{s3_key}",
                'manifest_location': f"s3://{os.environ['BUCKET_NAME']}/{manifest_key}",
                'estimated_size_mb': round(backup_size_mb, 2)
            })
        }
        
    except Exception as e:
        error_msg = f"Error during backup: {str(e)}"
        logger.error(error_msg)
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=os.environ['TOPIC_ARN'],
                Subject="Error: Survey Data Backup Failed",
                Message=f"""An error occurred during the weekly survey data backup process.

Error Details:
{error_msg}

Backup Date: {backup_date}
Week Starting: {week_start}
Timestamp: {datetime.datetime.now().isoformat()}

Please check CloudWatch logs for more details and manually verify data integrity."""
            )
        except Exception as sns_error:
            logger.error(f"Failed to send error notification: {str(sns_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Backup failed',
                'details': str(e),
                'backup_date': backup_date
            })
        }
```

## Key Features

- **Serverless Architecture**: Uses API Gateway, Lambda, DynamoDB for automatic scaling
- **Real-time Processing**: Survey responses processed immediately upon submission
- **Efficient Querying**: GSI indexes on surveyId and respondentId for fast queries
- **Automated Workflows**: EventBridge schedules daily aggregation and weekly backups
- **Monitoring**: CloudWatch dashboard and alarms for system visibility
- **API Throttling**: Rate limiting to handle 3k daily responses safely
- **Notifications**: SNS alerts for admin notification of job completions and failures
- **Production-Ready Lambda Functions**: Comprehensive error handling, logging, and validation
- **Enhanced Data Processing**: Pagination support for large datasets and detailed aggregation statistics