Model response below
```
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  GreetingApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: GreetingAPI
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
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GreetingFunction.Arn}/invocations
  GreetingDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: GreetingMethod
    Properties:
      RestApiId: !Ref GreetingApi
  GreetingStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      DeploymentId: !Ref GreetingDeployment
      RestApiId: !Ref GreetingApi
      StageName: prod

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
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: arn:aws:logs:*:*:*

  GreetingFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          def handler(event, context):
              import os
              message = os.getenv('GREETING_MESSAGE', 'Default greeting')
              return {'statusCode': 200, 'body': f'{{"message": "{message}"}}'}
      Runtime: python3.12
      Environment:
        Variables:
          GREETING_MESSAGE: Hello from a serverless API!

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt GreetingFunction.Arn
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/lambda/${GreetingFunction}
      RetentionInDays: 7

Outputs:
  ApiUrl:
    Description: URL for invoking the Greeting API
    Value: !Sub https://${GreetingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/greet
```