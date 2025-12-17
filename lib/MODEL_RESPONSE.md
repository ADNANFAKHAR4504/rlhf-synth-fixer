# Quiz Platform Infrastructure Implementation

Here is the complete CloudFormation infrastructure code for the serverless quiz generation system.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Quiz Platform Infrastructure with Personalization'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name for resource tagging

Resources:
  # S3 Bucket for Quiz Results Export
  QuizResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'quiz-results-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Service
          Value: QuizPlatform

  # DynamoDB Table for Questions
  QuestionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'quiz-questions-${Environment}'
      AttributeDefinitions:
        - AttributeName: question_id
          AttributeType: S
        - AttributeName: category
          AttributeType: S
        - AttributeName: difficulty
          AttributeType: N
      KeySchema:
        - AttributeName: question_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: CategoryIndex
          KeySchema:
            - AttributeName: category
              KeyType: HASH
            - AttributeName: difficulty
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 10
        WriteCapacityUnits: 10
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # DynamoDB Table for Quiz Results with TTL
  ResultsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'quiz-results-${Environment}'
      AttributeDefinitions:
        - AttributeName: quiz_id
          AttributeType: S
        - AttributeName: user_id
          AttributeType: S
        - AttributeName: created_at
          AttributeType: N
      KeySchema:
        - AttributeName: quiz_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserIndex
          KeySchema:
            - AttributeName: user_id
              KeyType: HASH
            - AttributeName: created_at
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 10
        WriteCapacityUnits: 10
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Quiz Generation Lambda
  QuizGenerationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'quiz-generation-lambda-role-${Environment}'
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
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                Resource:
                  - !GetAtt QuestionsTable.Arn
                  - !GetAtt ResultsTable.Arn
                  - !Sub '${QuestionsTable.Arn}/index/*'
                  - !Sub '${ResultsTable.Arn}/index/*'
        - PolicyName: PersonalizeAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - personalize:GetRecommendations
                  - personalize:GetPersonalizedRanking
                Resource: !Sub 'arn:aws:personalize:${AWS::Region}:${AWS::AccountId}:recommender/*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub '${QuizResultsBucket.Arn}/*'

  # Quiz Generation Lambda Function
  QuizGenerationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'quiz-generation-${Environment}'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt QuizGenerationLambdaRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          QUESTIONS_TABLE: !Ref QuestionsTable
          RESULTS_TABLE: !Ref ResultsTable
          S3_BUCKET: !Ref QuizResultsBucket
          PERSONALIZE_CAMPAIGN_ARN: !Sub 'arn:aws:personalize:${AWS::Region}:${AWS::AccountId}:campaign/quiz-recommendations'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime, timedelta
          import random

          dynamodb = boto3.resource('dynamodb')
          personalize = boto3.client('personalize-runtime')
          s3 = boto3.client('s3')

          def handler(event, context):
              # Parse request
              body = json.loads(event.get('body', '{}'))
              user_id = body.get('user_id')
              quiz_type = body.get('quiz_type', 'general')
              difficulty = body.get('difficulty', 2)

              # Generate quiz ID
              quiz_id = str(uuid.uuid4())

              # Get questions table
              questions_table = dynamodb.Table(os.environ['QUESTIONS_TABLE'])

              try:
                  # Get personalized question recommendations if user_id provided
                  recommended_questions = []
                  if user_id and os.environ.get('PERSONALIZE_CAMPAIGN_ARN'):
                      try:
                          response = personalize.get_recommendations(
                              campaignArn=os.environ['PERSONALIZE_CAMPAIGN_ARN'],
                              userId=user_id,
                              numResults=20
                          )
                          recommended_questions = [item['itemId'] for item in response['itemList']]
                      except Exception as e:
                          print(f"Personalize error: {str(e)}")

                  # Fetch questions from DynamoDB
                  if recommended_questions:
                      questions = []
                      for q_id in recommended_questions[:10]:
                          response = questions_table.get_item(Key={'question_id': q_id})
                          if 'Item' in response:
                              questions.append(response['Item'])
                  else:
                      # Fallback to random selection
                      response = questions_table.query(
                          IndexName='CategoryIndex',
                          KeyConditionExpression='category = :cat AND difficulty = :diff',
                          ExpressionAttributeValues={
                              ':cat': quiz_type,
                              ':diff': difficulty
                          },
                          Limit=10
                      )
                      questions = response['Items']

                  # Create quiz object
                  quiz = {
                      'quiz_id': quiz_id,
                      'user_id': user_id,
                      'questions': questions,
                      'created_at': int(datetime.now().timestamp()),
                      'ttl': int((datetime.now() + timedelta(days=365)).timestamp()),
                      'status': 'active'
                  }

                  # Save to results table
                  results_table = dynamodb.Table(os.environ['RESULTS_TABLE'])
                  results_table.put_item(Item=quiz)

                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'quiz_id': quiz_id,
                          'questions': questions,
                          'message': 'Quiz generated successfully'
                      })
                  }

              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Failed to generate quiz',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Scoring Lambda
  QuizScoringLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'quiz-scoring-lambda-role-${Environment}'
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
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt ResultsTable.Arn
                  - !Sub '${ResultsTable.Arn}/index/*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub '${QuizResultsBucket.Arn}/*'

  # Quiz Scoring Lambda Function
  QuizScoringFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'quiz-scoring-${Environment}'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt QuizScoringLambdaRole.Arn
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          RESULTS_TABLE: !Ref ResultsTable
          S3_BUCKET: !Ref QuizResultsBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')

          def handler(event, context):
              # Parse request
              body = json.loads(event.get('body', '{}'))
              quiz_id = body.get('quiz_id')
              answers = body.get('answers', [])

              if not quiz_id or not answers:
                  return {
                      'statusCode': 400,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Missing quiz_id or answers'})
                  }

              try:
                  # Get quiz from DynamoDB
                  results_table = dynamodb.Table(os.environ['RESULTS_TABLE'])
                  response = results_table.get_item(Key={'quiz_id': quiz_id})

                  if 'Item' not in response:
                      return {
                          'statusCode': 404,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'Quiz not found'})
                      }

                  quiz = response['Item']
                  questions = quiz.get('questions', [])

                  # Calculate score
                  score = 0
                  total = len(questions)
                  results = []

                  for i, question in enumerate(questions):
                      if i < len(answers):
                          is_correct = answers[i] == question.get('correct_answer')
                          if is_correct:
                              score += 1
                          results.append({
                              'question_id': question['question_id'],
                              'user_answer': answers[i],
                              'correct_answer': question.get('correct_answer'),
                              'is_correct': is_correct
                          })

                  # Calculate percentage
                  percentage = (score / total * 100) if total > 0 else 0

                  # Update quiz with results
                  results_table.update_item(
                      Key={'quiz_id': quiz_id},
                      UpdateExpression='SET #s = :score, #p = :percentage, #r = :results, #st = :status',
                      ExpressionAttributeNames={
                          '#s': 'score',
                          '#p': 'percentage',
                          '#r': 'results',
                          '#st': 'status'
                      },
                      ExpressionAttributeValues={
                          ':score': score,
                          ':percentage': percentage,
                          ':results': results,
                          ':status': 'completed'
                      }
                  )

                  # Export to S3
                  result_data = {
                      'quiz_id': quiz_id,
                      'user_id': quiz.get('user_id'),
                      'score': score,
                      'total': total,
                      'percentage': percentage,
                      'results': results,
                      'completed_at': datetime.now().isoformat()
                  }

                  s3_key = f"quiz-results/{quiz_id}.json"
                  s3.put_object(
                      Bucket=os.environ['S3_BUCKET'],
                      Key=s3_key,
                      Body=json.dumps(result_data),
                      ContentType='application/json'
                  )

                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'quiz_id': quiz_id,
                          'score': score,
                          'total': total,
                          'percentage': percentage,
                          'message': 'Quiz scored successfully',
                          's3_location': f"s3://{os.environ['S3_BUCKET']}/{s3_key}"
                      })
                  }

              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Failed to score quiz', 'message': str(e)})
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Rest API
  QuizAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'quiz-platform-api-${Environment}'
      Description: Quiz Platform API Gateway
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resources
  QuizResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref QuizAPI
      ParentId: !GetAtt QuizAPI.RootResourceId
      PathPart: quiz

  GenerateResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref QuizAPI
      ParentId: !Ref QuizResource
      PathPart: generate

  SubmitResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref QuizAPI
      ParentId: !Ref QuizResource
      PathPart: submit

  QuizIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref QuizAPI
      ParentId: !Ref QuizResource
      PathPart: '{id}'

  ResultsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref QuizAPI
      ParentId: !Ref QuizIdResource
      PathPart: results

  # API Gateway Methods
  GenerateMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref QuizAPI
      ResourceId: !Ref GenerateResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${QuizGenerationFunction.Arn}/invocations'

  SubmitMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref QuizAPI
      ResourceId: !Ref SubmitResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${QuizScoringFunction.Arn}/invocations'

  # Lambda Permissions for API Gateway
  GenerateLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref QuizGenerationFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${QuizAPI}/*/*'

  ScoringLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref QuizScoringFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${QuizAPI}/*/*'

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - GenerateMethod
      - SubmitMethod
    Properties:
      RestApiId: !Ref QuizAPI
      StageName: !Ref Environment

  # CloudWatch Dashboard
  QuizMetricsDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'quiz-platform-metrics-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", { "stat": "Sum", "label": "Quiz Generation Invocations" } ],
                  [ ".", "Errors", { "stat": "Sum", "label": "Generation Errors" } ],
                  [ ".", "Duration", { "stat": "Average", "label": "Generation Duration (ms)" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Quiz Generation Metrics",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${QuizGenerationFunction}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", { "stat": "Sum", "label": "Scoring Invocations" } ],
                  [ ".", "Errors", { "stat": "Sum", "label": "Scoring Errors" } ],
                  [ ".", "Duration", { "stat": "Average", "label": "Scoring Duration (ms)" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Quiz Scoring Metrics",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${QuizScoringFunction}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/DynamoDB", "UserErrors", { "stat": "Sum" } ],
                  [ ".", "SystemErrors", { "stat": "Sum" } ],
                  [ ".", "ConsumedReadCapacityUnits", { "stat": "Sum" } ],
                  [ ".", "ConsumedWriteCapacityUnits", { "stat": "Sum" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DynamoDB Performance",
                "period": 300,
                "dimensions": {
                  "TableName": "${QuestionsTable}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Count", { "stat": "Sum", "label": "API Requests" } ],
                  [ ".", "4XXError", { "stat": "Sum", "label": "4XX Errors" } ],
                  [ ".", "5XXError", { "stat": "Sum", "label": "5XX Errors" } ],
                  [ ".", "Latency", { "stat": "Average", "label": "Latency (ms)" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "API Gateway Metrics",
                "period": 300,
                "dimensions": {
                  "ApiName": "${QuizAPI}"
                }
              }
            }
          ]
        }

  # CloudWatch Alarms
  GenerationErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'quiz-generation-errors-${Environment}'
      AlarmDescription: Alert when quiz generation Lambda has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref QuizGenerationFunction

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'api-high-latency-${Environment}'
      AlarmDescription: Alert when API latency is high
      MetricName: Latency
      Namespace: AWS/ApiGateway
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref QuizAPI

  # IAM Role for Personalize
  PersonalizeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'quiz-personalize-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: personalize.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: PersonalizeS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt QuizResultsBucket.Arn
                  - !Sub '${QuizResultsBucket.Arn}/*'

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${QuizAPI}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  QuizResultsBucketName:
    Description: S3 bucket for quiz results
    Value: !Ref QuizResultsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ResultsBucket'

  QuestionsTableName:
    Description: DynamoDB table for questions
    Value: !Ref QuestionsTable
    Export:
      Name: !Sub '${AWS::StackName}-QuestionsTable'

  ResultsTableName:
    Description: DynamoDB table for results
    Value: !Ref ResultsTable
    Export:
      Name: !Sub '${AWS::StackName}-ResultsTable'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${QuizMetricsDashboard}'

  PersonalizeRoleArn:
    Description: IAM Role ARN for Personalize
    Value: !GetAtt PersonalizeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PersonalizeRole'
```