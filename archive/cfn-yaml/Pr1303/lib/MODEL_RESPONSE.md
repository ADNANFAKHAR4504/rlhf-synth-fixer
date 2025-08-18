```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Enterprise-grade serverless infrastructure with API Gateway, Lambda, and comprehensive security'

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [prod, dev]
    Description: Environment name
  
  AllowedCIDRRanges:
    Type: CommaDelimitedList
    Default: "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
    Description: Comma-delimited list of CIDR ranges for IP whitelisting
  
  LogLevel:
    Type: String
    Default: ERROR
    AllowedValues: [ERROR, WARN]
    Description: CloudWatch log level

Globals:
  Function:
    Runtime: python3.11
    Timeout: 30
    MemorySize: 256
    Tracing: Active
    Environment:
      Variables:
        LOG_LEVEL: !Ref LogLevel
        ENVIRONMENT: !Ref Environment
    Tags:
      Environment: !Ref Environment
      Project: MyAPI
      ManagedBy: CloudFormation

Resources:
  # ========================================
  # KMS Key for Encryption
  # ========================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "${Environment}-MyAPI KMS Key for encryption"
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::123456789012:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow Lambda Functions
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: "*"

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${Environment}-myapi-key"
      TargetKeyId: !Ref KMSKey

  # ========================================
  # IAM Roles and Policies
  # ========================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Environment}-lambda-execution-role"
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
        - PolicyName: KMSDecryptPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt KMSKey.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:us-west-2:123456789012:log-group:/aws/lambda/${Environment}-*"

  APIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Environment}-apigateway-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaInvokePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: lambda:InvokeFunction
                Resource: 
                  - !GetAtt UserManagementFunction.Arn
                  - !GetAtt OrderProcessingFunction.Arn
                  - !GetAtt AuthorizerFunction.Arn

  # ========================================
  # Lambda Functions
  # ========================================
  AuthorizerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${Environment}-authorizer-function"
      CodeUri: src/authorizer/
      Handler: handler.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          KMS_KEY_ID: !Ref KMSKey
      AutoPublishAlias: live
      DeploymentPreference:
        Type: AllAtOnce
      VersionDescription: "Initial version"

  UserManagementFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${Environment}-user-management-function"
      CodeUri: src/user-management/
      Handler: handler.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 512
      Timeout: 60
      Environment:
        Variables:
          KMS_KEY_ID: !Ref KMSKey
          DB_CONNECTION_STRING: !Sub "{{resolve:secretsmanager:${Environment}-db-connection:SecretString:connection_string}}"
      AutoPublishAlias: live
      DeploymentPreference:
        Type: AllAtOnce
      VersionDescription: "Initial version"

  OrderProcessingFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${Environment}-order-processing-function"
      CodeUri: src/order-processing/
      Handler: handler.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 1024
      Timeout: 300
      Environment:
        Variables:
          KMS_KEY_ID: !Ref KMSKey
          PAYMENT_API_KEY: !Sub "{{resolve:secretsmanager:${Environment}-payment-api:SecretString:api_key}}"
      AutoPublishAlias: live
      DeploymentPreference:
        Type: AllAtOnce
      VersionDescription: "Initial version"

  # ========================================
  # API Gateway
  # ========================================
  MyAPIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "${Environment}-MyAPI"
      Description: "Enterprise-grade API Gateway with comprehensive security"
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: "*"
            Action: execute-api:Invoke
            Resource: "*"
            Condition:
              IpAddress:
                aws:SourceIp: !Ref AllowedCIDRRanges

  # Custom Authorizer
  CustomAuthorizer:
    Type: AWS::ApiGateway::Authorizer
    Properties:
      Name: !Sub "${Environment}-custom-authorizer"
      RestApiId: !Ref MyAPIGateway
      Type: TOKEN
      AuthorizerUri: !Sub "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${AuthorizerFunction.Arn}/invocations"
      AuthorizerCredentials: !GetAtt APIGatewayRole.Arn
      AuthorizerResultTtlInSeconds: 300
      IdentitySource: method.request.header.Authorization

  # API Resources and Methods
  UsersResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref MyAPIGateway
      ParentId: !GetAtt MyAPIGateway.RootResourceId
      PathPart: users

  UsersMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref MyAPIGateway
      ResourceId: !Ref UsersResource
      HttpMethod: POST
      AuthorizationType: CUSTOM
      AuthorizerId: !Ref CustomAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${UserManagementFunction.Arn}/invocations"
        Credentials: !GetAtt APIGatewayRole.Arn
      MethodResponses:
        - StatusCode: 200
        - StatusCode: 400
        - StatusCode: 401
        - StatusCode: 500

  OrdersResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref MyAPIGateway
      ParentId: !GetAtt MyAPIGateway.RootResourceId
      PathPart: orders

  OrdersMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref MyAPIGateway
      ResourceId: !Ref OrdersResource
      HttpMethod: POST
      AuthorizationType: CUSTOM
      AuthorizerId: !Ref CustomAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${OrderProcessingFunction.Arn}/invocations"
        Credentials: !GetAtt APIGatewayRole.Arn
      MethodResponses:
        - StatusCode: 200
        - StatusCode: 400
        - StatusCode: 401
        - StatusCode: 500

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - UsersMethod
      - OrdersMethod
    Properties:
      RestApiId: !Ref MyAPIGateway
      Description: !Sub "${Environment} API Deployment"

  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref MyAPIGateway
      DeploymentId: !Ref APIDeployment
      StageName: !Ref Environment
      Description: !Sub "${Environment} API Stage"
      TracingConfig:
        TracingEnabled: true
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: ERROR
          DataTraceEnabled: false
          MetricsEnabled: true
          ThrottlingBurstLimit: 2000
          ThrottlingRateLimit: 1000
      AccessLogSetting:
        DestinationArn: !GetAtt APIGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'

  # ========================================
  # WAF Web ACL
  # ========================================
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub "${Environment}-MyAPI-WebACL"
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
            MetricName: CommonRuleSetMetric
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
            MetricName: KnownBadInputsRuleSetMetric
        - Name: IPWhitelistRule
          Priority: 3
          Action:
            Allow: {}
          Statement:
            IPSetReferenceStatement:
              Arn: !GetAtt IPWhitelist.Arn
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: IPWhitelistMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${Environment}-MyAPI-WebACL"

  IPWhitelist:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: !Sub "${Environment}-IPWhitelist"
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses: !Ref AllowedCIDRRanges

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub "arn:aws:apigateway:us-west-2::/restapis/${MyAPIGateway}/stages/${Environment}"
      WebACLArn: !GetAtt WebACL.Arn

  # ========================================
  # CloudWatch Logs
  # ========================================
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/${Environment}-MyAPI"
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  AuthorizerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${Environment}-authorizer-function"
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  UserManagementLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${Environment}-user-management-function"
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  OrderProcessingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${Environment}-order-processing-function"
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # ========================================
  # AWS Config
  # ========================================
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Environment}-config-service-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigDeliveryPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                  - s3:GetBucketLocation
                  - s3:PutObject
                  - s3:GetObject
                Resource:
                  - !Sub "${ConfigBucket}/*"
                  - !Ref ConfigBucket
```
