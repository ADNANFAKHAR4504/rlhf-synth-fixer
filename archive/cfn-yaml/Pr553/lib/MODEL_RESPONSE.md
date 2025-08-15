```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Multi-environment serverless application template for AWS StackSets deployment.
  Creates Lambda function, API Gateway, S3 bucket, and associated IAM resources
  with environment-specific configurations and validation rules.

# Parameters section for environment configuration
Parameters:
  EnvironmentName:
    Type: String
    Description: Environment name for resource naming and configuration
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev
    ConstraintDescription: Must be one of dev, staging, or prod

  ArtifactBucketName:
    Type: String
    Description: S3 bucket name containing Lambda deployment packages
    MinLength: 3
    MaxLength: 63
    AllowedPattern: ^[a-z0-9][a-z0-9-]*[a-z0-9]$
    ConstraintDescription: Must be a valid S3 bucket name (lowercase, alphanumeric, hyphens)

# Mappings for environment-specific configurations
Mappings:
  EnvironmentConfig:
    dev:
      LambdaMemorySize: 128
      ResourcePrefix: my-app-dev
      LogRetentionDays: 7
      ApiGatewayStageName: dev
    staging:
      LambdaMemorySize: 256
      ResourcePrefix: my-app-staging
      LogRetentionDays: 14
      ApiGatewayStageName: staging
    prod:
      LambdaMemorySize: 512
      ResourcePrefix: my-app-prod
      LogRetentionDays: 30
      ApiGatewayStageName: prod

# Rules for parameter validation
Rules:
  ValidateEnvironmentName:
    RuleCondition: !Not
      - !Contains
        - [dev, staging, prod]
        - !Ref EnvironmentName
    Assertions:
      - Assert: !Contains
          - [dev, staging, prod]
          - !Ref EnvironmentName
        AssertDescription: EnvironmentName must be one of dev, staging, or prod

# Conditions for conditional resource creation
Conditions:
  IsProductionEnvironment: !Equals [!Ref EnvironmentName, prod]
  CreateAccessLogsBucket: !Condition IsProductionEnvironment

# Resources section
Resources:
  # S3 bucket for Lambda deployment packages
  LambdaArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub
        - ${ResourcePrefix}-artifacts-${AWS::AccountId}-${AWS::Region}
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

  # Conditional S3 bucket for access logs (prod only)
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Condition: CreateAccessLogsBucket
    Properties:
      BucketName: !Sub
        - ${ResourcePrefix}-access-logs-${AWS::AccountId}-${AWS::Region}
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

  # IAM role for Lambda function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub
        - ${ResourcePrefix}-lambda-execution-role
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
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
                Resource:
                  - !Sub "${ArtifactBucketName}/*"
                  - !Sub "${LambdaArtifactsBucket}/*"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

  # CloudWatch Log Group for Lambda function
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub
        - /aws/lambda/${ResourcePrefix}-function
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, LogRetentionDays]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

  # Lambda function
  HelloWorldFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub
        - ${ResourcePrefix}-function
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, LambdaMemorySize]
      Timeout: 30
      Code:
        S3Bucket: !Ref ArtifactBucketName
        S3Key: lambda-function.zip
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentName
          RESOURCE_PREFIX: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
          LOG_LEVEL: !If [IsProductionEnvironment, WARN, DEBUG]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp
    DependsOn: LambdaLogGroup

  # Lambda permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref HelloWorldFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "${HelloWorldApi}/*/*"

  # API Gateway REST API
  HelloWorldApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub
        - ${ResourcePrefix}-api
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
      Description: !Sub "Hello World API for ${EnvironmentName} environment"
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

  # API Gateway resource for /hello path
  HelloResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref HelloWorldApi
      ParentId: !GetAtt HelloWorldApi.RootResourceId
      PathPart: hello

  # API Gateway method for /hello path
  HelloMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref HelloWorldApi
      ResourceId: !Ref HelloResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations
          - LambdaArn: !GetAtt HelloWorldFunction.Arn

  # API Gateway deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref HelloWorldApi
      Description: !Sub "Deployment for ${EnvironmentName} environment"
    DependsOn:
      - HelloMethod

  # API Gateway stage
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref HelloWorldApi
      DeploymentId: !Ref ApiDeployment
      StageName: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ApiGatewayStageName]
      Description: !Sub "Stage for ${EnvironmentName} environment"
      Variables:
        Environment: !Ref EnvironmentName
      AccessLogSetting: !If
        - CreateAccessLogsBucket
        - DestinationArn: !Sub "${AccessLogsBucket}/api-gateway-logs/"
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
        - !Ref AWS::NoValue
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: ServerlessApp

# Outputs section
Outputs:
  ApiGatewayInvokeUrl:
    Description: URL for the deployed API Gateway
    Value: !Sub
      - https://${ApiId}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/hello
      - ApiId: !Ref HelloWorldApi
        StageName: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ApiGatewayStageName]
    Export:
      Name: !Sub
        - ${ResourcePrefix}-api-url
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt HelloWorldFunction.Arn
    Export:
      Name: !Sub
        - ${ResourcePrefix}-lambda-arn
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]

  ArtifactsBucketName:
    Description: Name of the S3 bucket for Lambda artifacts
    Value: !Ref LambdaArtifactsBucket
    Export:
      Name: !Sub
        - ${ResourcePrefix}-artifacts-bucket
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]

  AccessLogsBucketName:
    Condition: CreateAccessLogsBucket
    Description: Name of the S3 bucket for access logs (production only)
    Value: !Ref AccessLogsBucket
    Export:
      Name: !Sub
        - ${ResourcePrefix}-access-logs-bucket
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]

  EnvironmentName:
    Description: Environment name used for this deployment
    Value: !Ref EnvironmentName
    Export:
      Name: !Sub
        - ${ResourcePrefix}-environment
        - ResourcePrefix: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, ResourcePrefix]
```

## Key Features and Best Practices Implemented

### 1. **Multi-Environment Configuration**
- **Parameters**: Accepts `EnvironmentName` (dev/staging/prod) and `ArtifactBucketName`
- **Mappings**: Environment-specific configurations for memory size, resource prefixes, log retention, and stage names
- **Dynamic Resource Naming**: All resources use environment-specific prefixes to prevent conflicts

### 2. **Validation and Integrity**
- **Rules Section**: Validates that `EnvironmentName` is one of the allowed values
- **Conditions**: Creates additional resources (access logs bucket) only in production
- **Parameter Constraints**: Validates S3 bucket naming conventions

### 3. **Resource Interconnections**
- Lambda function references the artifact bucket parameter
- API Gateway integration properly references Lambda function ARN
- Environment variables set from mappings
- Proper use of `!Sub`, `!Ref`, and `!FindInMap` intrinsic functions

### 4. **Security Best Practices**
- S3 buckets have encryption enabled and public access blocked
- IAM roles follow least privilege principle
- Lambda function has specific execution role with minimal permissions

### 5. **Monitoring and Logging**
- CloudWatch Log Groups with environment-specific retention
- API Gateway access logging for production environment
- Proper tagging for resource management

### 6. **StackSets Compatibility**
- Template is designed for multi-region deployment
- Uses account and region-specific naming to prevent conflicts
- Exports for cross-stack references

## Deployment Instructions

1. **Prepare Lambda Code**: Upload your Lambda function code as `lambda-function.zip` to the specified artifact bucket
2. **Deploy via StackSets**: Use this template with AWS StackSets for multi-region deployment
3. **Parameters**: Provide environment name and artifact bucket name during deployment

This template provides a robust foundation for serverless applications across multiple environments while maintaining consistency and following AWS best practices.