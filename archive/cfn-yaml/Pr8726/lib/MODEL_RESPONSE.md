# Serverless Application CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Serverless application with Lambda functions and API Gateway for user management'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource naming and configuration'

  LogRetentionDays:
    Type: Number
    Default: 14
    Description: 'CloudWatch log retention period in days'

Globals:
  Function:
    Runtime: python3.9
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        DYNAMODB_TABLE: !Ref UserTable
        LOG_LEVEL: !If [IsProd, 'INFO', 'DEBUG']
    Tags:
      Project: 'ServerlessApp'
      Environment: !Ref Environment

  Api:
    Cors:
      AllowMethods: "'GET,POST,OPTIONS'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowOrigin: "'*'"
    Tags:
      Project: 'ServerlessApp'
      Environment: !Ref Environment

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']

Resources:
  # API Gateway
  ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${Environment}-serverless-api'
      StageName: !Ref Environment
      TracingConfig:
        TracingEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: >
          {
            "requestId": "$context.requestId",
            "ip": "$context.identity.sourceIp",
            "caller": "$context.identity.caller",
            "user": "$context.identity.user",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "resourcePath": "$context.resourcePath",
            "status": "$context.status",
            "protocol": "$context.protocol",
            "responseLength": "$context.responseLength"
          }
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  # Lambda Functions
  CreateUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${Environment}-create-user-function'
      CodeUri: src/create_user/
      Handler: app.lambda_handler
      Description: 'Function to create new users'
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          FUNCTION_NAME: 'CreateUser'
      Events:
        CreateUserApi:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /user
            Method: POST
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt CreateUserDLQ.Arn

  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${Environment}-get-user-function'
      CodeUri: src/get_user/
      Handler: app.lambda_handler
      Description: 'Function to retrieve user information'
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          FUNCTION_NAME: 'GetUser'
      Events:
        GetUserApi:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /user/{id}
            Method: GET
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt GetUserDLQ.Arn

  # DynamoDB Table
  UserTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-users-table'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Lambda Functions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-lambda-execution-role'
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
                Resource: !GetAtt UserTable.Arn
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource:
                  - !GetAtt CreateUserDLQ.Arn
                  - !GetAtt GetUserDLQ.Arn
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  # Dead Letter Queues
  CreateUserDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${Environment}-create-user-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  GetUserDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${Environment}-get-user-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Groups
  CreateUserLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-create-user-function'
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  GetUserLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-get-user-function'
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${Environment}-serverless-api'
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarms for Monitoring
  CreateUserErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-CreateUserFunction-Errors'
      AlarmDescription: 'Monitor errors in CreateUserFunction'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref CreateUserFunction
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  GetUserErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-GetUserFunction-Errors'
      AlarmDescription: 'Monitor errors in GetUserFunction'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref GetUserFunction
      Tags:
        - Key: Project
          Value: 'ServerlessApp'
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function Versions and Aliases
  CreateUserFunctionVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref CreateUserFunction
      Description: !Sub 'Version for ${Environment} environment'

  CreateUserFunctionAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref CreateUserFunction
      FunctionVersion: !GetAtt CreateUserFunctionVersion.Version
      Name: !Ref Environment
      Description: !Sub 'Alias for ${Environment} environment'

  GetUserFunctionVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref GetUserFunction
      Description: !Sub 'Version for ${Environment} environment'

  GetUserFunctionAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref GetUserFunction
      FunctionVersion: !GetAtt GetUserFunctionVersion.Version
      Name: !Ref Environment
      Description: !Sub 'Alias for ${Environment} environment'

Outputs:
  ApiEndpoint:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${Environment}-api-endpoint'

  CreateUserFunctionArn:
    Description: 'CreateUserFunction ARN'
    Value: !GetAtt CreateUserFunction.Arn
    Export:
      Name: !Sub '${Environment}-create-user-function-arn'

  GetUserFunctionArn:
    Description: 'GetUserFunction ARN'
    Value: !GetAtt GetUserFunction.Arn
    Export:
      Name: !Sub '${Environment}-get-user-function-arn'

  UserTableName:
    Description: 'DynamoDB User Table Name'
    Value: !Ref UserTable
    Export:
      Name: !Sub '${Environment}-user-table-name'

  UserTableArn:
    Description: 'DynamoDB User Table ARN'
    Value: !GetAtt UserTable.Arn
    Export:
      Name: !Sub '${Environment}-user-table-arn'
```

## Key Features Explained

### **SAM Transform & Structure**

- Uses `AWS::Serverless-2016-10-31` transform for SAM functionality
- Leverages SAM's simplified syntax for Lambda and API Gateway resources

### **Environment Configuration**

- **Parameters**: Environment parameter with validation for dev/staging/prod
- **Environment Variables**: Each Lambda gets environment-specific configuration
- **Conditional Logic**: Different log levels based on environment

### **Lambda Functions**

- **Proper IAM Role**: Custom execution role with DynamoDB permissions
- **Environment Variables**: ENVIRONMENT, DYNAMODB_TABLE, LOG_LEVEL, FUNCTION_NAME
- **Dead Letter Queues**: Error handling with SQS DLQs
- **Versioning**: Lambda versions and aliases for rollback capability

### **API Gateway Routes**

- **POST /user** → CreateUserFunction
- **GET /user/{id}** → GetUserFunction
- **CORS Configuration**: Properly configured for web requests
- **Access Logging**: Detailed request/response logging
- **Tracing**: X-Ray tracing enabled

### **Monitoring & Logging**

- **CloudWatch Log Groups**: Organized log retention
- **CloudWatch Alarms**: Error monitoring for both functions
- **Metrics**: API Gateway metrics enabled
- **X-Ray Tracing**: Distributed tracing for performance monitoring

### **Tagging & Naming**

- **Consistent Tagging**: All resources tagged with 'Project:ServerlessApp'
- **Environment-based Naming**: Resources prefixed with environment name
- **Export Values**: Key outputs exported for cross-stack references

### **CI/CD Ready**

- **Versioning Support**: Lambda versions and aliases for blue-green deployments
- **Parameter-driven**: Easy environment promotion
- **Export Outputs**: Stack outputs available for pipeline integration

This template provides a production-ready serverless application with proper security, monitoring, and deployment practices. It's designed to work seamlessly with AWS CodePipeline for automated deployments across environments.
