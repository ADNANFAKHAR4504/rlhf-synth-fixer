# Secure Serverless API with AWS WAF and Lambda

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Secure Serverless API with AWS WAF and Lambda'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - StageName
      - Label:
          default: 'Security Configuration'
        Parameters:
          - SecretsManagerSecretArn
      - Label:
          default: 'Logging Configuration'
        Parameters:
          - LogRetentionInDays

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  StageName:
    Type: String
    Default: 'prod'
    Description: 'API Gateway stage name'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  SecretsManagerSecretArn:
    Type: String
    Description: 'ARN of the Secrets Manager secret containing environment variables'
    AllowedPattern: '^arn:aws:secretsmanager:.*$'
    ConstraintDescription: 'Must be a valid Secrets Manager ARN'

  LogRetentionInDays:
    Type: Number
    Default: 14
    Description: 'CloudWatch Logs retention period in days'
    AllowedValues:
      [
        1,
        3,
        5,
        7,
        14,
        30,
        60,
        90,
        120,
        150,
        180,
        365,
        400,
        545,
        731,
        1827,
        3653,
      ]

Resources:
  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TapStack-LambdaRole-${EnvironmentSuffix}'
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
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref SecretsManagerSecretArn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/TapStack-Function-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionInDays
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # Lambda Function
  TapStackFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'TapStack-Function-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          secrets_client = boto3.client('secretsmanager')

          def lambda_handler(event, context):
              try:
                  # Get secret ARN from environment variable
                  secret_arn = os.environ.get('SECRET_ARN')
                  
                  if secret_arn:
                      # Retrieve secret
                      response = secrets_client.get_secret_value(SecretId=secret_arn)
                      secret_data = json.loads(response['SecretString'])
                      print(f"Successfully loaded {len(secret_data)} environment variables from Secrets Manager")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Hello from TapStack!',
                          'environment': os.environ.get('ENVIRONMENT', 'unknown')
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
                          'error': 'Internal server error'
                      })
                  }
      Environment:
        Variables:
          SECRET_ARN: !Ref SecretsManagerSecretArn
          ENVIRONMENT: !Ref EnvironmentSuffix
      Timeout: 30
      MemorySize: 128
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # Lambda Permission for API Gateway
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TapStackFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${TapStackApi}/*/*'

  # API Gateway Rest API
  TapStackApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'TapStack-API-${EnvironmentSuffix}'
      Description: 'TapStack Serverless API'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref TapStackApi
      ParentId: !GetAtt TapStackApi.RootResourceId
      PathPart: 'api'

  # API Gateway Method
  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TapStackApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${TapStackFunction.Arn}/invocations'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiMethod
    Properties:
      RestApiId: !Ref TapStackApi
      Description: 'TapStack API Deployment'

  # API Gateway Stage
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref TapStackApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref StageName
      Description: !Sub 'TapStack API ${StageName} Stage'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt ApiLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # CloudWatch Log Group for API Gateway
  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/TapStack-API-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionInDays
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # API Gateway Account Configuration for CloudWatch Logs
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # IAM Role for API Gateway CloudWatch Logs
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # WAF Web ACL
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'TapStack-WebACL-${EnvironmentSuffix}'
      Description: 'WAF for TapStack API'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: CommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'TapStack-WebACL-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # WAF Association with API Gateway Stage
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${TapStackApi}/stages/${StageName}'
      WebACLArn: !GetAtt WebACL.Arn

Outputs:
  ApiInvokeUrl:
    Description: 'API Gateway invoke URL'
    Value: !Sub 'https://${TapStackApi}.execute-api.${AWS::Region}.amazonaws.com/${StageName}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiInvokeUrl'

  WebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACLArn'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt TapStackFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  ApiGatewayRestApiId:
    Description: 'API Gateway REST API ID'
    Value: !Ref TapStackApi
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayRestApiId'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Architecture Overview

This CloudFormation template creates a secure serverless API with the following components:

### Security Layer

- **AWS WAF v2** with rate limiting (2000 requests per 5 minutes per IP)
- **AWS Managed Rules** for common attack patterns
- **IAM roles** with least-privilege permissions
- **Secrets Manager integration** for secure environment variable handling

### API Layer

- **API Gateway** with regional endpoints
- **CloudWatch logging** with configurable retention
- **CORS support** for web applications
- **Default execute-api hostname** (no custom domain required)

### Compute Layer

- **Lambda function** with Python 3.9 runtime
- **Secrets Manager** integration for environment variables
- **CloudWatch logs** with configurable retention
- **Error handling** and JSON response formatting

### Infrastructure Features

- **Environment-specific naming** using EnvironmentSuffix parameter
- **Consistent tagging** across all resources
- **No retention policies** - all resources clean up completely
- **Region-agnostic** - works in any AWS region using `${AWS::Region}`

## Key Design Decisions

1. **Security First**: WAF protection, least-privilege IAM, Secrets Manager integration
2. **Production Ready**: Comprehensive logging, monitoring, and error handling
3. **Environment Isolation**: Parameterized resource naming for multi-environment support
4. **Clean Deployment**: No retention policies, complete resource cleanup
5. **Regional Flexibility**: Uses AWS intrinsic functions, no hardcoded regions
