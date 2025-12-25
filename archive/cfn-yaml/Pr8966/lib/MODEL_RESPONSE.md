```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Serverless infrastructure for projectX using AWS Lambda and API Gateway with CloudWatch monitoring.

Parameters:
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
    Default: nodejs14.x
  MemorySize:
    Type: Number
    Description: The amount of memory allocated to the Lambda function.
    Default: 128

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
                Resource: arn:aws:logs:*:*:*

  # Lambda Function
  projectXLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref FunctionName
      Handler: !Ref Handler
      Runtime: !Ref Runtime
      MemorySize: !Ref MemorySize
      Role: !GetAtt projectXLambdaExecutionRole.Arn
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
      Target: !GetAtt projectXLambdaIntegration.IntegrationUri

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
  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt projectXLambdaFunction.Arn
```

This CloudFormation template creates a serverless infrastructure with AWS Lambda and API Gateway, adhering to best practices and requirements. It includes parameters for customization, proper IAM roles, logging, and outputs for the API URL and Lambda ARN. The template is designed to be clean and readable, ready for deployment in the `us-east-1` region.