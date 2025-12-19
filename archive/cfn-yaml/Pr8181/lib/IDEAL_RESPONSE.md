```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Production-ready serverless API stack with HA, security, and observability

# ---------------------------------------------------------------------------------------
# NOTE:
# The custom domain resource (ApiGatewayDomain) is commented out below because
# AWS API Gateway custom domains require a valid ACM certificate in ISSUED state.
# Your current ACM certificates are in FAILED state.
# Once you have a valid ACM certificate, you can uncomment the ApiGatewayDomain
# resource and its related output.
# ---------------------------------------------------------------------------------------

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix (e.g., dev, prod, staging)
  Name:
    Type: String
    Default: tapstack
    Description: Application name
  Team:
    Type: String
    Default: team
    Description: Team name
  Region:
    Type: String
    Default: us-east-1
    Description: AWS region for deployment

Resources:
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                Resource: !GetAtt DynamoDBTable.Arn

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentSuffix}-${Name}-lambda-${Team}
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 512
      Timeout: 15
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
      TracingConfig:
        Mode: Active
      Code:
        ZipFile: |
          import json

          def handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from Lambda!')
              }

  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentSuffix}-${Name}-table-${Team}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub ${EnvironmentSuffix}-${Name}-api-${Team}
      Description: Serverless API
      EndpointConfiguration:
        Types:
          - REGIONAL

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
        Uri: !Sub arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${MyLambdaFunction.Arn}/invocations

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayRootMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref EnvironmentSuffix

  LambdaApiInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt MyLambdaFunction.Arn
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${Region}:${AWS::AccountId}:${ApiGateway}/*/*

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/apigateway/${EnvironmentSuffix}-${Name}-api-${Team}
      RetentionInDays: 14

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentSuffix}-${Name}-lambda-errors-${Team}
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: []
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyLambdaFunction

  # -----------------------------------------------------------------------------------
  # ApiGatewayDomain:
  #   Type: AWS::ApiGateway::DomainName
  #   Properties:
  #     DomainName: !Sub api-${EnvironmentSuffix}.example.com
  #     RegionalCertificateArn: arn:aws:acm:us-east-1:YOUR-ACTUAL-CERTIFICATE-ARN
  #     EndpointConfiguration:
  #       Types:
  #         - REGIONAL
  # -----------------------------------------------------------------------------------

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint
    Value: !Sub https://${ApiGateway}.execute-api.${Region}.amazonaws.com/${EnvironmentSuffix}
  LambdaArn:
    Description: Lambda function ARN
    Value: !GetAtt MyLambdaFunction.Arn
  DynamoDBTable:
    Description: DynamoDB table name
    Value: !Ref DynamoDBTable
  LogGroupName:
    Description: CloudWatch log group
    Value: !Ref LogGroup
  AlarmName:
    Description: CloudWatch alarm name
    Value: !Sub ${EnvironmentSuffix}-${Name}-lambda-errors-${Team}

  # -----------------------------------------------------------------------------------
  # CustomDomain:
  #   Description: Custom domain name
  #   Value: !Sub api-${EnvironmentSuffix}.example.com
  # -----------------------------------------------------------------------------------
```
