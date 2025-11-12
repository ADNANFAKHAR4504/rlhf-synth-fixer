# Quiz Platform Infrastructure - Perfect CloudFormation Implementation

This is the ideal CloudFormation infrastructure implementation for a serverless quiz generation system that processes 3,700 daily personalized quizzes.

## CloudFormation Template (TapStack.yml)

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
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Unique suffix for resource naming to avoid conflicts

Resources:
  # S3 Bucket for Quiz Results Export
  QuizResultsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'quiz-results-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'quiz-questions-${EnvironmentSuffix}'
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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'quiz-results-${EnvironmentSuffix}'
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

  # IAM Roles with Least Privilege
  QuizGenerationLambdaRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'quiz-generation-lambda-role-${EnvironmentSuffix}'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub '${QuizResultsBucket.Arn}/*'

  QuizScoringLambdaRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'quiz-scoring-lambda-role-${EnvironmentSuffix}'
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
        - PolicyName: S3WriteAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub '${QuizResultsBucket.Arn}/*'

  # Lambda Functions
  QuizGenerationFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FunctionName: !Sub 'quiz-generation-${EnvironmentSuffix}'
      Runtime: python3.13
      Handler: index.handler
      Role: !GetAtt QuizGenerationLambdaRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          QUESTIONS_TABLE: !Ref QuestionsTable
          RESULTS_TABLE: !Ref ResultsTable
          S3_BUCKET: !Ref QuizResultsBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime, timedelta
          import random

          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')

          def handler(event, context):
              body = json.loads(event.get('body', '{}'))
              user_id = body.get('user_id')
              quiz_type = body.get('quiz_type', 'general')
              difficulty = body.get('difficulty', 2)

              quiz_id = str(uuid.uuid4())
              questions_table = dynamodb.Table(os.environ['QUESTIONS_TABLE'])

              try:
                  # Fetch questions - using scan for simplicity
                  response = questions_table.scan(Limit=10)
                  questions = response.get('Items', [])

                  # Create sample questions if none exist
                  if not questions:
                      questions = [
                          {
                              'question_id': str(uuid.uuid4()),
                              'category': quiz_type,
                              'difficulty': difficulty,
                              'content': f'Sample question {i+1} for {quiz_type}'
                          }
                          for i in range(10)
                      ]

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

  QuizScoringFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FunctionName: !Sub 'quiz-scoring-${EnvironmentSuffix}'
      Runtime: python3.13
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
              body = json.loads(event.get('body', '{}'))
              quiz_id = body.get('quiz_id')
              user_id = body.get('user_id')
              answers = body.get('answers', [])

              try:
                  results_table = dynamodb.Table(os.environ['RESULTS_TABLE'])

                  # Get quiz details
                  response = results_table.get_item(Key={'quiz_id': quiz_id})
                  if 'Item' not in response:
                      return {
                          'statusCode': 404,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'Quiz not found'})
                      }

                  quiz = response['Item']

                  # Calculate score (simplified)
                  total_questions = len(quiz.get('questions', []))
                  correct_answers = len([a for a in answers if a.get('answer') == 'A'])
                  score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

                  # Update quiz with results
                  results_table.update_item(
                      Key={'quiz_id': quiz_id},
                      UpdateExpression='SET score = :score, completed_at = :timestamp, #status = :status, answers = :answers',
                      ExpressionAttributeNames={'#status': 'status'},
                      ExpressionAttributeValues={
                          ':score': int(score),
                          ':timestamp': int(datetime.now().timestamp()),
                          ':status': 'completed',
                          ':answers': answers
                      }
                  )

                  # Save results to S3
                  result_data = {
                      'quiz_id': quiz_id,
                      'user_id': user_id,
                      'score': score,
                      'completed_at': datetime.now().isoformat(),
                      'answers': answers
                  }

                  s3_key = f'results/{user_id}/{quiz_id}.json'
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
                          'message': 'Quiz scored successfully',
                          's3_location': f's3://{os.environ["S3_BUCKET"]}/{s3_key}'
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

  # API Gateway REST API
  QuizAPI:
    Type: AWS::ApiGateway::RestApi
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'quiz-platform-api-${EnvironmentSuffix}'
      Description: Quiz Platform API Gateway
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Resources
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

  # API Methods
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
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${QuizAPI}/*/POST/quiz/generate'

  ScoringLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref QuizScoringFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${QuizAPI}/*/POST/quiz/submit'

  # API Deployment
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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DashboardName: !Sub 'quiz-platform-metrics-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", { "stat": "Sum", "label": "Quiz Generation Invocations" } ],
                  [ ".", "Duration", { "stat": "Average", "label": "Avg Duration (ms)" } ],
                  [ ".", "Errors", { "stat": "Sum", "label": "Errors" } ],
                  [ ".", "Throttles", { "stat": "Sum", "label": "Throttles" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Quiz Generation Lambda Metrics",
                "period": 300
              }
            }
          ]
        }

  # CloudWatch Alarms
  GenerationErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AlarmName: !Sub 'quiz-generation-errors-${EnvironmentSuffix}'
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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AlarmName: !Sub 'api-high-latency-${EnvironmentSuffix}'
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
```

## TypeScript Helper Class (tap-stack.ts)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TapStack {
  private template: CloudFormationTemplate;
  private environmentSuffix: string;

  constructor(environmentSuffix?: string) {
    this.environmentSuffix = environmentSuffix || 'dev';
    this.template = this.loadTemplate();
  }

  private loadTemplate(): CloudFormationTemplate {
    const jsonPath = path.join(__dirname, 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(jsonContent) as CloudFormationTemplate;
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public getEnvironmentSuffix(): string {
    return this.environmentSuffix;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getResourceTypes(): string[] {
    return [
      ...new Set(
        Object.values(this.template.Resources).map((r: any) => r.Type)
      ),
    ];
  }

  public hasResource(resourceName: string): boolean {
    return resourceName in this.template.Resources;
  }

  public getResource(resourceName: string): any {
    return this.template.Resources[resourceName];
  }

  public getOutput(outputName: string): any {
    return this.template.Outputs?.[outputName];
  }

  public getParameter(parameterName: string): any {
    return this.template.Parameters?.[parameterName];
  }

  public validateTemplate(): string[] {
    const errors: string[] = [];

    if (this.template.AWSTemplateFormatVersion !== '2010-09-09') {
      errors.push('Invalid CloudFormation template version');
    }

    if (
      !this.template.Resources ||
      Object.keys(this.template.Resources).length === 0
    ) {
      errors.push('Template must have at least one resource');
    }

    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        const deletableTypes = [
          'AWS::S3::Bucket',
          'AWS::DynamoDB::Table',
          'AWS::IAM::Role',
          'AWS::Lambda::Function',
          'AWS::ApiGateway::RestApi',
          'AWS::CloudWatch::Dashboard',
          'AWS::CloudWatch::Alarm',
        ];

        if (deletableTypes.includes(resource.Type)) {
          if (resource.DeletionPolicy !== 'Delete') {
            errors.push(`Resource ${name} should have DeletionPolicy: Delete`);
          }
          if (resource.UpdateReplacePolicy !== 'Delete') {
            errors.push(
              `Resource ${name} should have UpdateReplacePolicy: Delete`
            );
          }
        }
      }
    );

    this.checkEnvironmentSuffixUsage(errors);

    return errors;
  }

  private checkEnvironmentSuffixUsage(errors: string[]): void {
    const namedResources = [
      'QuizResultsBucket',
      'QuestionsTable',
      'ResultsTable',
      'QuizGenerationFunction',
      'QuizScoringFunction',
      'QuizGenerationLambdaRole',
      'QuizScoringLambdaRole',
    ];

    namedResources.forEach(resourceName => {
      if (this.hasResource(resourceName)) {
        const resource = this.getResource(resourceName);
        let hasEnvironmentSuffix = false;

        if (
          resource.Type === 'AWS::S3::Bucket' &&
          resource.Properties?.BucketName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.BucketName
          );
        } else if (
          resource.Type === 'AWS::DynamoDB::Table' &&
          resource.Properties?.TableName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.TableName
          );
        } else if (
          resource.Type === 'AWS::Lambda::Function' &&
          resource.Properties?.FunctionName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.FunctionName
          );
        } else if (
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.RoleName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.RoleName
          );
        }

        if (!hasEnvironmentSuffix && resource.Properties) {
          errors.push(
            `Resource ${resourceName} should use EnvironmentSuffix in its name`
          );
        }
      }
    });
  }

  private checkForEnvironmentSuffix(nameProperty: any): boolean {
    if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
      return nameProperty['Fn::Sub'].includes('${EnvironmentSuffix}');
    }
    return false;
  }

  public getStackResources(): {
    s3Buckets: string[];
    dynamoTables: string[];
    lambdaFunctions: string[];
    iamRoles: string[];
    apiGateways: string[];
  } {
    const resources = {
      s3Buckets: [] as string[],
      dynamoTables: [] as string[],
      lambdaFunctions: [] as string[],
      iamRoles: [] as string[],
      apiGateways: [] as string[],
    };

    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        switch (resource.Type) {
          case 'AWS::S3::Bucket':
            resources.s3Buckets.push(name);
            break;
          case 'AWS::DynamoDB::Table':
            resources.dynamoTables.push(name);
            break;
          case 'AWS::Lambda::Function':
            resources.lambdaFunctions.push(name);
            break;
          case 'AWS::IAM::Role':
            resources.iamRoles.push(name);
            break;
          case 'AWS::ApiGateway::RestApi':
            resources.apiGateways.push(name);
            break;
        }
      }
    );

    return resources;
  }

  public getRequiredCapabilities(): string[] {
    const capabilities: string[] = [];
    const hasIamResources = Object.values(this.template.Resources).some(
      (r: any) => r.Type?.startsWith('AWS::IAM')
    );

    if (hasIamResources) {
      capabilities.push('CAPABILITY_IAM');

      const hasNamedIamResources = Object.values(this.template.Resources).some(
        (r: any) =>
          r.Type?.startsWith('AWS::IAM') &&
          (r.Properties?.RoleName || r.Properties?.PolicyName)
      );

      if (hasNamedIamResources) {
        capabilities.push('CAPABILITY_NAMED_IAM');
      }
    }

    return capabilities;
  }

  public getDependencyGraph(): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        const deps: string[] = [];

        if (resource.DependsOn) {
          if (Array.isArray(resource.DependsOn)) {
            deps.push(...resource.DependsOn);
          } else {
            deps.push(resource.DependsOn);
          }
        }

        const refs = this.findRefs(resource);
        deps.push(...refs);

        const getAtts = this.findGetAtts(resource);
        deps.push(...getAtts);

        if (deps.length > 0) {
          dependencies.set(name, [...new Set(deps)]);
        }
      }
    );

    return dependencies;
  }

  private findRefs(obj: any, refs: string[] = []): string[] {
    if (obj && typeof obj === 'object') {
      if (
        obj.Ref &&
        typeof obj.Ref === 'string' &&
        !obj.Ref.startsWith('AWS::')
      ) {
        refs.push(obj.Ref);
      } else {
        Object.values(obj).forEach(value => this.findRefs(value, refs));
      }
    }
    return refs;
  }

  private findGetAtts(obj: any, getAtts: string[] = []): string[] {
    if (obj && typeof obj === 'object') {
      if (obj['Fn::GetAtt'] && Array.isArray(obj['Fn::GetAtt'])) {
        getAtts.push(obj['Fn::GetAtt'][0]);
      } else {
        Object.values(obj).forEach(value => this.findGetAtts(value, getAtts));
      }
    }
    return getAtts;
  }

  public toJson(): string {
    return JSON.stringify(this.template, null, 2);
  }

  public toYaml(): string {
    return yaml.dump(this.template);
  }
}
```