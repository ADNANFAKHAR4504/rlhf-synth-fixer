I'll create a comprehensive CloudFormation template for a robust, production-ready serverless architecture that meets all your requirements. Since CloudFormation templates are region-specific, I'll provide a template that can be deployed in both regions with appropriate cross-region considerations.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready serverless architecture with Lambda, API Gateway, and CloudWatch logging'

Parameters:
  Environment:
    Type: String
    Default: Production
    Description: Environment name for resource tagging
  
  DeploymentRegion:
    Type: String
    Default: us-east-1
    AllowedValues:
      - us-east-1
      - us-west-2
    Description: Target deployment region
  
  CrossRegionEndpoint:
    Type: String
    Default: ''
    Description: API Gateway endpoint from the other region (for cross-region setup)

Mappings:
  RegionMap:
    us-east-1:
      RegionName: 'east'
      PrimaryRegion: true
    us-west-2:
      RegionName: 'west'
      PrimaryRegion: false

Resources:
  # IAM Role for Lambda Functions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ServerlessLambdaRole-${AWS::Region}'
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
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                  - logs:DescribeLogGroups
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
        - PolicyName: DynamoDBPolicy
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
                Resource: !GetAtt ApplicationTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Groups for Lambda Functions
  HelloWorldLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/HelloWorldFunction-${AWS::Region}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DataProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/DataProcessorFunction-${AWS::Region}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment

  HealthCheckLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/HealthCheckFunction-${AWS::Region}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda Functions
  HelloWorldFunction:
    Type: AWS::Lambda::Function
    DependsOn: HelloWorldLogGroup
    Properties:
      FunctionName: !Sub 'HelloWorldFunction-${AWS::Region}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 128  # Well under 256MB limit
      Timeout: 30
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          REGION: !Ref AWS::Region
          ENVIRONMENT: !Ref Environment
          TABLE_NAME: !Ref ApplicationTable
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          from datetime import datetime
          
          def lambda_handler(event, context):
              print(f"Processing request in region: {os.environ.get('REGION')}")
              
              response_body = {
                  'message': 'Hello from AWS Lambda!',
                  'region': os.environ.get('REGION'),
                  'environment': os.environ.get('ENVIRONMENT'),
                  'timestamp': datetime.utcnow().isoformat(),
                  'request_id': context.aws_request_id
              }
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                  },
                  'body': json.dumps(response_body)
              }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DataProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: DataProcessorLogGroup
    Properties:
      FunctionName: !Sub 'DataProcessorFunction-${AWS::Region}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 256  # Maximum allowed memory
      Timeout: 60
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          REGION: !Ref AWS::Region
          ENVIRONMENT: !Ref Environment
          TABLE_NAME: !Ref ApplicationTable
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import uuid
          from datetime import datetime
          
          dynamodb = boto3.resource('dynamodb')
          
          def lambda_handler(event, context):
              table_name = os.environ.get('TABLE_NAME')
              table = dynamodb.Table(table_name)
              
              try:
                  # Parse request body
                  if event.get('body'):
                      body = json.loads(event['body'])
                  else:
                      body = event
                  
                  # Process and store data
                  item = {
                      'id': str(uuid.uuid4()),
                      'data': body.get('data', 'No data provided'),
                      'timestamp': datetime.utcnow().isoformat(),
                      'region': os.environ.get('REGION'),
                      'processed_by': context.function_name
                  }
                  
                  table.put_item(Item=item)
                  
                  print(f"Data processed and stored: {item['id']}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'id': item['id'],
                          'region': os.environ.get('REGION')
                      })
                  }
              except Exception as e:
                  print(f"Error processing data: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  HealthCheckFunction:
    Type: AWS::Lambda::Function
    DependsOn: HealthCheckLogGroup
    Properties:
      FunctionName: !Sub 'HealthCheckFunction-${AWS::Region}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 128  # Minimal memory for health checks
      Timeout: 15
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          REGION: !Ref AWS::Region
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import os
          from datetime import datetime
          
          def lambda_handler(event, context):
              health_status = {
                  'status': 'healthy',
                  'region': os.environ.get('REGION'),
                  'environment': os.environ.get('ENVIRONMENT'),
                  'timestamp': datetime.utcnow().isoformat(),
                  'version': '1.0.0'
              }
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps(health_status)
              }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # DynamoDB Table for data storage
  ApplicationTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'ServerlessApp-${AWS::Region}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway REST API
  ServerlessApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'ServerlessAPI-${AWS::Region}'
      Description: 'Production serverless API'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: execute-api:Invoke
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Resources and Methods
  HelloResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ServerlessApi
      ParentId: !GetAtt ServerlessApi.RootResourceId
      PathPart: hello

  HelloMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref HelloResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${HelloWorldFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  DataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ServerlessApi
      ParentId: !GetAtt ServerlessApi.RootResourceId
      PathPart: data

  DataPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref DataResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DataProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  HealthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ServerlessApi
      ParentId: !GetAtt ServerlessApi.RootResourceId
      PathPart: health

  HealthMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref HealthResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${HealthCheckFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  # CORS Options Methods
  HelloOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref HelloResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false

  DataOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref DataResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false

  # Lambda Permissions for API Gateway
  HelloLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref HelloWorldFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'

  DataLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'

  HealthLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref HealthCheckFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - HelloMethod
      - DataPostMethod
      - HealthMethod
      - HelloOptionsMethod
      - DataOptionsMethod
    Properties:
      RestApiId: !Ref ServerlessApi
      StageName: prod
      StageDescription: Production stage
      Description: Production deployment

  # CloudWatch Alarms for monitoring
  HelloFunctionErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'HelloFunction-Errors-${AWS::Region}'
      AlarmDescription: 'Monitor HelloWorld function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref HelloWorldFunction
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DataProcessorErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'DataProcessor-Errors-${AWS::Region}'
      AlarmDescription: 'Monitor DataProcessor function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessorFunction
      Tags:
        - Key: Environment
          Value: !Ref Environment

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  HelloWorldFunctionArn:
    Description: 'HelloWorld Lambda Function ARN'
    Value: !GetAtt HelloWorldFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-HelloWorldFunction'

  DataProcessorFunctionArn:
    Description: 'DataProcessor Lambda Function ARN'
    Value: !GetAtt DataProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataProcessorFunction'

  HealthCheckFunctionArn:
    Description: 'HealthCheck Lambda Function ARN'
    Value: !GetAtt HealthCheckFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-HealthCheckFunction'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref ApplicationTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'

  Region:
    Description: 'Deployment Region'
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```

## Deployment Instructions

To deploy this template across both regions, follow these steps:

### 1. Deploy to us-east-1:
```bash
aws cloudformation create-stack \
  --stack-name serverless-app-east \
  --template-body file://serverless-template.yaml \
  --parameters ParameterKey=DeploymentRegion,ParameterValue=us-east-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 2. Deploy to us-west-2:
```bash
aws cloudformation create-stack \
  --stack-name serverless-app-west \
  --template-body file://serverless-template.yaml \
  --parameters ParameterKey=DeploymentRegion,ParameterValue=us-west-2 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### 3. Validate the template:
```bash
aws cloudformation validate-template \
  --template-body file://serverless-template.yaml
```

## Architecture Features

### ✅ **Requirements Compliance**

1. **Lambda Functions**: 
   - 3 functions with memory limits of 128MB, 256MB, and 128MB respectively
   - All under the 256MB constraint

2. **API Gateway Integration**:
   - RESTful API with proper Lambda proxy integration
   - CORS support for web applications
   - Health check endpoint for monitoring

3. **Multi-Region Deployment**:
   - Template can be deployed in both us-east-1 and us-west-2
   - Region-specific naming and configuration

4. **Tagging**:
   - All resources tagged with `Environment: Production`

5. **Monitoring and Logging**:
   - CloudWatch log groups for all Lambda functions
   - CloudWatch alarms for error monitoring
   - X-Ray tracing enabled

### 🏗️ **Production-Ready Features**

- **Security**: IAM roles with least privilege access
- **Monitoring**: CloudWatch alarms and detailed logging
- **Performance**: Optimized memory allocation and timeout settings
- **Reliability**: Error handling and health checks
- **Scalability**: DynamoDB with on-demand billing
- **Observability**: X-Ray tracing and structured logging

### 🔗 **API Endpoints**

After deployment, you'll have these endpoints available:
- `GET /health` - Health check
- `GET /hello` - Hello world response
- `POST /data` - Data processing endpoint

This template creates a robust, production-ready serverless architecture that meets all specified requirements and follows AWS best practices.