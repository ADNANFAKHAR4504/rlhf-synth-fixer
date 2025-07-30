Ideal response is as below
```
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  A secure, serverless greeting API using API Gateway and Lambda. This template
  is corrected to resolve cfn-lint errors.

Resources:
  # --- API Gateway Resources ---

  GreetingApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: GreetingAPI
      Description: "API for a simple greeting service"
      EndpointConfiguration:
        Types:
          - REGIONAL

  GreetingResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt GreetingApi.RootResourceId
      RestApiId: !Ref GreetingApi
      PathPart: greet

  GreetingMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      HttpMethod: GET
      ResourceId: !Ref GreetingResource
      RestApiId: !Ref GreetingApi
      AuthorizationType: NONE
      Integration:
        IntegrationHttpMethod: POST
        Type: AWS_PROXY
        Uri: !Sub arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GreetingFunction.Arn}/invocations

  GreetingDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: GreetingMethod
    Properties:
      RestApiId: !Ref GreetingApi

  GreetingStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      DeploymentId: !Ref GreetingDeployment
      RestApiId: !Ref GreetingApi

  # --- IAM Role and Policy ---

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
      Policies:
        - PolicyName: LambdaLoggingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt LogGroup.Arn

  # --- Lambda Function and Permissions ---

  GreetingFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: python3.12
      Environment:
        Variables:
          GREETING_MESSAGE: "Hello from a secure, serverless API!"
      Code:
        ZipFile: |
          import os
          import json

          def handler(event, context):
              message = os.getenv('GREETING_MESSAGE', 'Default greeting')
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json'
                  },
                  'body': json.dumps({'message': message})
              }

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt GreetingFunction.Arn
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${GreetingApi}/*/GET/greet

  # --- Logging ---

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/GreetingApiFunction
      RetentionInDays: 7

Outputs:
  ApiUrl:
    Description: "URL for invoking the Greeting API"
    Value: !Sub "https://${GreetingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/greet"

```