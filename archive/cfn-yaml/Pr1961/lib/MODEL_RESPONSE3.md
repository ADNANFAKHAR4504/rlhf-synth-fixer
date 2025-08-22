I'll fix the DynamoDB billing mode error. The issue is that `ON_DEMAND` should be `PAY_PER_REQUEST`. Here's the corrected CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Application Infrastructure with CI/CD Pipeline'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging and naming'

  ApplicationName:
    Type: String
    Default: 'serverless-app'
    Description: 'Application name for resource naming'

  GitHubOwner:
    Type: String
    Default: 'your-github-username'
    Description: 'GitHub repository owner'

  GitHubRepo:
    Type: String
    Default: 'your-repo-name'
    Description: 'GitHub repository name'

  GitHubBranch:
    Type: String
    Default: 'main'
    Description: 'GitHub branch to track'

  GitHubToken:
    Type: String
    Default: 'your-github-token'
    NoEcho: true
    Description: 'GitHub personal access token'

Resources:
  # ==========================================
  # S3 Bucket for Static Content
  # ==========================================
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-static-${Environment}-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # S3 Bucket Policy for CloudFront
  StaticContentBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticContentBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:GetObject'
            Resource: !Sub '${StaticContentBucket}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # ==========================================
  # CloudFront Distribution
  # ==========================================
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub '${ApplicationName}-${Environment} Static Content Distribution'
        DefaultRootObject: 'index.html'
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticContentBucket.RegionalDomainName
            OriginAccessControlId: !Ref CloudFrontOAC
            S3OriginConfig:
              OriginAccessIdentity: ''
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingDisabled
          Compress: true
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # CloudFront Origin Access Control (OAC) - Replaces OAI
  CloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${ApplicationName}-${Environment}-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # ==========================================
  # DynamoDB Table - FIXED BILLING MODE
  # ==========================================
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ApplicationName}-${Environment}-data-${AWS::AccountId}'
      BillingMode: PAY_PER_REQUEST # Fixed: Changed from ON_DEMAND to PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: 'pk'
          AttributeType: 'S'
        - AttributeName: 'sk'
          AttributeType: 'S'
        - AttributeName: 'gsi1pk'
          AttributeType: 'S'
        - AttributeName: 'gsi1sk'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'pk'
          KeyType: 'HASH'
        - AttributeName: 'sk'
          KeyType: 'RANGE'
      GlobalSecondaryIndexes:
        - IndexName: 'GSI1'
          KeySchema:
            - AttributeName: 'gsi1pk'
              KeyType: 'HASH'
            - AttributeName: 'gsi1sk'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # ==========================================
  # Lambda Execution Role
  # ==========================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-lambda-execution-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt DynamoDBTable.Arn
                  - !Sub '${DynamoDBTable.Arn}/index/*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${StaticContentBucket}/*'
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  # ==========================================
  # Lambda Functions
  # ==========================================
  ApiHandlerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ApplicationName}-${Environment}-api-handler-${AWS::AccountId}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          DYNAMODB_TABLE: !Ref DynamoDBTable
          S3_BUCKET: !Ref StaticContentBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

          def lambda_handler(event, context):
              try:
                  http_method = event['httpMethod']
                  path = event['path']
                  
                  if http_method == 'GET' and path == '/health':
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'status': 'healthy',
                              'timestamp': datetime.utcnow().isoformat()
                          })
                      }
                  
                  # Add more API endpoints here
                  
                  return {
                      'statusCode': 404,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Not Found'})
                  }
              
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Internal Server Error'})
                  }
      TracingConfig:
        Mode: Active
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # Lambda Function Log Group
  ApiHandlerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ApiHandlerFunction}'
      RetentionInDays: 14

  # ==========================================
  # API Gateway
  # ==========================================
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ApplicationName}-${Environment}-api'
      Description: !Sub 'API Gateway for ${ApplicationName} ${Environment}'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resource (Proxy)
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: '{proxy+}'

  # API Gateway Method
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiHandlerFunction.Arn}/invocations'

  # API Gateway Root Method
  ApiGatewayRootMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !GetAtt ApiGateway.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiHandlerFunction.Arn}/invocations'

  # API Gateway Deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGatewayMethod
      - ApiGatewayRootMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref Environment

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiHandlerFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*'

  # ==========================================
  # CloudWatch Monitoring
  # ==========================================
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ApplicationName}-${Environment}'
      RetentionInDays: 30

  DynamoDBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/dynamodb/${ApplicationName}-${Environment}'
      RetentionInDays: 30

  # CloudWatch Dashboard
  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ApplicationName}-${Environment}-dashboard'
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
                  ["AWS/Lambda", "Duration", "FunctionName", "${ApiHandlerFunction}"],
                  [".", "Errors", ".", "."],
                  [".", "Invocations", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Metrics"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${DynamoDBTable}"],
                  [".", "ConsumedWriteCapacityUnits", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "DynamoDB Metrics"
              }
            }
          ]
        }

  # ==========================================
  # CI/CD Pipeline
  # ==========================================
  # S3 Bucket for CodePipeline Artifacts
  CodePipelineArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-${Environment}-pipeline-artifacts-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30

  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-codebuild-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub '${CodePipelineArtifactsBucket}/*'
                  - !Sub '${StaticContentBucket}/*'
              - Effect: Allow
                Action:
                  - lambda:UpdateFunctionCode
                  - lambda:UpdateFunctionConfiguration
                Resource: !GetAtt ApiHandlerFunction.Arn
              - Effect: Allow
                Action:
                  - cloudformation:*
                Resource: '*'

  # CodeBuild Project
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ApplicationName}-${Environment}-build'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: ENVIRONMENT
            Value: !Ref Environment
          - Name: S3_BUCKET
            Value: !Ref StaticContentBucket
          - Name: LAMBDA_FUNCTION
            Value: !Ref ApiHandlerFunction
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                python: 3.9
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - pip install -r requirements.txt || echo "No requirements.txt found"
            build:
              commands:
                - echo Build started on `date`
                - echo Running tests...
                - python -m pytest tests/ || echo "No tests found"
                - echo Building the application...
                - zip -r function.zip . -x "*.git*" "tests/*" "*.md"
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Updating Lambda function...
                - aws lambda update-function-code --function-name $LAMBDA_FUNCTION --zip-file fileb://function.zip
          artifacts:
            files:
              - '**/*'

  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-codepipeline-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${CodePipelineArtifactsBucket}'
                  - !Sub '${CodePipelineArtifactsBucket}/*'
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn

  # CodePipeline
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ApplicationName}-${Environment}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref CodePipelineArtifactsBucket
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: '1'
              Configuration:
                Owner: !Ref GitHubOwner
                Repo: !Ref GitHubRepo
                Branch: !Ref GitHubBranch
                OAuthToken: !Ref GitHubToken
              OutputArtifacts:
                - Name: SourceOutput
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-${Environment}-lambda-errors'
      AlarmDescription: 'Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiHandlerFunction

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-${Environment}-dynamodb-throttles'
      AlarmDescription: 'DynamoDB throttling events'
      MetricName: ThrottledRequests
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref DynamoDBTable

# ==========================================
# Outputs
# ==========================================
Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  CloudFrontDistributionUrl:
    Description: 'CloudFront Distribution URL'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontUrl'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTable'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt ApiHandlerFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  CodePipelineName:
    Description: 'CodePipeline Name'
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-CodePipeline'
```

## ✅ **Fixed Issue: DynamoDB Billing Mode**

**Changed:**

```yaml
BillingMode: ON_DEMAND # ❌ Invalid value
```

**To:**

```yaml
BillingMode: PAY_PER_REQUEST # ✅ Correct value
```

## **Valid DynamoDB Billing Modes:**

- `PROVISIONED` - You specify read/write capacity units
- `PAY_PER_REQUEST` - On-demand pricing (what you wanted)

## **Deploy the Fixed Template:**

```bash
aws cloudformation create-stack \
  --stack-name serverless-app-dev \
  --template-body file://serverless-app.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

The DynamoDB table will now be created with on-demand (pay-per-request) billing mode, which automatically scales based on your application's traffic patterns without you having to manage capacity settings.
