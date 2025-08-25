```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure serverless deployment with API Gateway, Lambda, WAF, and Secrets Manager integration'

Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Environment name for resource tagging
    AllowedValues:
      - dev
      - staging
      - prod
  
  StageName:
    Type: String
    Default: v1
    Description: API Gateway stage name
  
  SecretsManagerArn:
    Type: String
    Description: ARN of the Secrets Manager secret containing environment variables
  
  LogRetentionDays:
    Type: Number
    Default: 14
    Description: CloudWatch log retention period in days
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
  
  ProjectName:
    Type: String
    Default: serverless-api
    Description: Project name for resource naming and tagging

Resources:
  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-role'
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
                Resource: !Ref SecretsManagerArn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Lambda Function
  ApiLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-api-handler'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          SECRETS_ARN: !Ref SecretsManagerArn
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def handler(event, context):
              # Get secrets from Secrets Manager
              secrets_client = boto3.client('secretsmanager')
              try:
                  response = secrets_client.get_secret_value(
                      SecretId=os.environ['SECRETS_ARN']
                  )
                  secrets = json.loads(response['SecretString'])
              except Exception as e:
                  print(f"Error retrieving secrets: {str(e)}")
                  secrets = {}
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps({
                      'message': 'Hello from secure serverless API!',
                      'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                      'secretsLoaded': len(secrets) > 0
                  })
              }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Lambda CloudWatch Log Group
  ApiLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ApiLambdaFunction}'
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # API Gateway REST API
  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      Description: Secure serverless API
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # API Gateway Resource
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
      PathPart: api

  # API Gateway Method
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiLambdaFunction.Arn}/invocations'

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${ApiGatewayRestApi}/*/GET/api'

  # API Gateway Deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayMethod
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      Description: !Sub 'Deployment for ${Environment} environment'

  # API Gateway Stage
  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      DeploymentId: !Ref ApiGatewayDeployment
      StageName: !Ref StageName
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # API Gateway CloudWatch Log Group
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # WAF Web ACL
  WebAcl:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-waf'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: !Sub '${ProjectName}-${Environment}-CommonRuleSet'
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: !Sub '${ProjectName}-${Environment}-KnownBadInputs'
        - Name: RateLimitRule
          Priority: 3
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: !Sub '${ProjectName}-${Environment}-RateLimit'
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-${Environment}-WebACL'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # WAF Association with API Gateway Stage
  WebAclAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub '${ApiGatewayRestApi}/stages/${StageName}'
      WebACLArn: !GetAtt WebAcl.Arn

Outputs:
  ApiInvokeUrl:
    Description: API Gateway invoke URL
    Value: !Sub 'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/api'
    Export:
      Name: !Sub '${AWS::StackName}-ApiInvokeUrl'

  WebAclArn:
    Description: WAF Web ACL ARN
    Value: !GetAtt WebAcl.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebAclArn'

  LambdaFunctionArn:
    Description: Lambda function ARN
    Value: !GetAtt ApiLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  ApiGatewayId:
    Description: API Gateway REST API ID
    Value: !Ref ApiGatewayRestApi
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayId'
```