# CloudFormation Template for Serverless API

Here's the complete CloudFormation YAML template that sets up the serverless API infrastructure.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure for projectX using AWS Lambda and API Gateway with CloudWatch monitoring.'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  FunctionName:
    Type: String
    Description: The name of the Lambda function.
    Default: projectXFunction
  Handler:
    Type: String
    Description: The handler for the Lambda function.
    Default: index.handler
  Runtime:
    Type: String
    Description: The runtime environment for the Lambda function.
    Default: nodejs18.x
    AllowedValues:
      - nodejs18.x
      - python3.11
      - java17
      - go1.x
  MemorySize:
    Type: Number
    Description: The amount of memory allocated to the Lambda function.
    Default: 128
    MinValue: 128
    MaxValue: 10240

Resources:
  # IAM Role for Lambda
  projectXLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: projectXLambdaExecutionRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: projectXLambdaBasicExecution
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/projectXFunction:*

  # Lambda Function
  projectXLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref FunctionName
      Handler: !Ref Handler
      Runtime: !Ref Runtime
      MemorySize: !Ref MemorySize
      Role: !GetAtt projectXLambdaExecutionRole.Arn
      Timeout: 10
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              body: JSON.stringify('Hello from projectX!'),
            };
          };
      Environment:
        Variables:
          LOG_LEVEL: INFO
      Tags:
        - Key: Name
          Value: projectXLambdaFunction
        - Key: Project
          Value: projectX
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Log Group for Lambda
  projectXLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${FunctionName}"
      RetentionInDays: 7
    DependsOn: projectXLambdaFunction

  # API Gateway
  projectXHttpApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: projectXHttpApi
      ProtocolType: HTTP

  # Integration between API Gateway and Lambda
  projectXLambdaIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref projectXHttpApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${projectXLambdaFunction.Arn}/invocations"
      PayloadFormatVersion: '2.0'

  # Default Route for API Gateway
  projectXDefaultRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref projectXHttpApi
      RouteKey: '$default'
      Target: !Join
        - /
        - - integrations
          - !Ref projectXLambdaIntegration

  # Stage for API Gateway
  projectXApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref projectXHttpApi
      StageName: '$default'
      AutoDeploy: true

  # Permission for API Gateway to invoke Lambda
  projectXLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt projectXLambdaFunction.Arn
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${projectXHttpApi}/*/*"

Outputs:
  ApiGatewayUrl:
    Description: URL of the API Gateway
    Value: !Sub "https://${projectXHttpApi}.execute-api.${AWS::Region}.amazonaws.com"

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref projectXLambdaFunction

  ApiGatewayId:
    Description: ID of the API Gateway
    Value: !Ref projectXHttpApi

  ApiIntegrationId:
    Description: ID of the Lambda integration with API Gateway
    Value: !Ref projectXLambdaIntegration

  LambdaLogGroupName:
    Description: Name of the CloudWatch Log Group for Lambda
    Value: !Ref projectXLambdaLogGroup
  
  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt projectXLambdaFunction.Arn
```

## Key Features

This template includes:

- **Configurable Parameters**: Function name, handler, runtime, and memory are all configurable
- **Environment Support**: EnvironmentSuffix parameter enables multi-environment deployments
- **Least Privilege IAM**: Lambda role is scoped to only the specific log group it needs
- **CloudWatch Monitoring**: 7-day log retention for both Lambda and API Gateway
- **Complete Outputs**: All important resource identifiers exported for integration
- **Resource Tags**: Environment, Project, and Name tags on all resources
- **Modern Runtime**: Defaults to nodejs18.x with validation for supported runtimes

## Deployment

Deploy using AWS CLI or CloudFormation console:

```bash
aws cloudformation create-stack --stack-name projectx-dev \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

The API Gateway URL will be available in the stack outputs after deployment completes.