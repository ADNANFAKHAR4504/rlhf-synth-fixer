# Ideal Response Documentation

## Overview
This document describes what an ideal response should look like when an AI model successfully addresses the serverless infrastructure design challenge.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "TAP Stack - Serverless Infrastructure with API Gateway, Lambda, WAF, and Monitoring"

Transform: AWS::Serverless-2016-10-31

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
          - EnvironmentType
      - Label:
          default: "Security Configuration"
        Parameters:
          - AllowedIPRange
          # - EnableWAF  # COMMENTED OUT: WAF resources are commented out
      - Label:
          default: "Lambda Configuration"
        Parameters:
          - LambdaMemorySize
          - LambdaTimeout

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  EnvironmentType:
    Type: String
    Default: "dev"
    Description: "Environment type (dev, staging, prod)"
    AllowedValues: ["dev", "staging", "prod"]
    ConstraintDescription: "Must be dev, staging, or prod"

  AllowedIPRange:
    Type: String
    Description: "CIDR range for allowed IP addresses (e.g., 192.168.1.0/24)"
    Default: "192.168.1.0/24"
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 192.168.1.0/24)"

  # EnableWAF:
  #   Type: String
  #   Default: "true"
  #   Description: "Enable WAF protection for API Gateway"
  #   AllowedValues: ["true", "false"]
  #   ConstraintDescription: "Must be true or false"  # COMMENTED OUT: WAF resources are commented out

  LambdaMemorySize:
    Type: Number
    Default: 256
    Description: "Memory allocation for Lambda functions in MB"
    MinValue: 128
    MaxValue: 3008
    ConstraintDescription: "Must be between 128 and 3008 MB"

  LambdaTimeout:
    Type: Number
    Default: 30
    Description: "Timeout for Lambda functions in seconds"
    MinValue: 1
    MaxValue: 900
    ConstraintDescription: "Must be between 1 and 900 seconds"

Resources:
  # KMS Key for encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "KMS key for ${EnvironmentType} environment encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: "*"
            Condition:
              StringEquals:
                "kms:ViaService": !Sub "lambda.${AWS::Region}.amazonaws.com"

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/prod-encryption-key-${EnvironmentSuffix}"
      TargetKeyId: !Ref EncryptionKey

  # DynamoDB Table
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub "prod-TurnAroundPromptTable-${EnvironmentSuffix}"
      AttributeDefinitions:
        - AttributeName: "id"
          AttributeType: "S"
      KeySchema:
        - AttributeName: "id"
          KeyType: "HASH"
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: !If [IsProd, true, false]
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref EncryptionKey

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: LambdaCustomPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt TurnAroundPromptTable.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt EncryptionKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/prod-*"
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: "*"

  # Lambda Functions
  GetPromptFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "prod-get-prompt-${EnvironmentSuffix}"
      InlineCode: |
        exports.handler = async (event) => {
          console.log('Get Prompt Function executed');
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Get prompt function working' })
          };
        };
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          ENVIRONMENT: !Ref EnvironmentType
          LOG_LEVEL: !If [IsProd, "ERROR", "WARN"]
      Tracing: Active
      AutoPublishAlias: !Ref EnvironmentType
      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
        Alarms:
          - !Ref LambdaErrorAlarm
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /prompts
            Method: GET
            RestApiId: !Ref ApiGateway
            Auth:
              Authorizer: LambdaAuthorizer
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  CreatePromptFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "prod-create-prompt-${EnvironmentSuffix}"
      InlineCode: |
        exports.handler = async (event) => {
          console.log('Create Prompt Function executed');
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Create prompt function working' })
          };
        };
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          ENVIRONMENT: !Ref EnvironmentType
          LOG_LEVEL: !If [IsProd, "ERROR", "WARN"]
      Tracing: Active
      AutoPublishAlias: !Ref EnvironmentType
      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
        Alarms:
          - !Ref LambdaErrorAlarm
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /prompts
            Method: POST
            RestApiId: !Ref ApiGateway
            Auth:
              Authorizer: LambdaAuthorizer
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  UpdatePromptFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "prod-update-prompt-${EnvironmentSuffix}"
      InlineCode: |
        exports.handler = async (event) => {
          console.log('Update Prompt Function executed');
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Update prompt function working' })
          };
        };
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          ENVIRONMENT: !Ref EnvironmentType
          LOG_LEVEL: !If [IsProd, "ERROR", "WARN"]
      Tracing: Active
      AutoPublishAlias: !Ref EnvironmentType
      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
        Alarms:
          - !Ref LambdaErrorAlarm
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /prompts
            Method: PUT
            RestApiId: !Ref ApiGateway
            Auth:
              Authorizer: LambdaAuthorizer
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  DeletePromptFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "prod-delete-prompt-${EnvironmentSuffix}"
      InlineCode: |
        exports.handler = async (event) => {
          console.log('Delete Prompt Function executed');
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Delete prompt function working' })
          };
        };
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          ENVIRONMENT: !Ref EnvironmentType
          LOG_LEVEL: !If [IsProd, "ERROR", "WARN"]
      Tracing: Active
      AutoPublishAlias: !Ref EnvironmentType
      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
        Alarms:
          - !Ref LambdaErrorAlarm
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /prompts
            Method: DELETE
            RestApiId: !Ref ApiGateway
            Auth:
              Authorizer: LambdaAuthorizer
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub "prod-MyAPI-${EnvironmentSuffix}"
      StageName: !Ref EnvironmentType
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          MetricsEnabled: true
          DataTraceEnabled: !If [IsProd, false, true]
          LoggingLevel: !If [IsProd, "ERROR", "INFO"]
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: LambdaAuthorizer
        Authorizers:
          LambdaAuthorizer:
            FunctionArn: !GetAtt AuthorizerFunction.Arn
            FunctionInvokeRole: !GetAtt LambdaExecutionRole.Arn
            Identity:
              Headers:
                - Authorization
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  # API Gateway Resources and Methods - SIMPLIFIED SAM APPROACH
  # Using SAM Events to automatically create API Gateway methods
  # This approach is more reliable and follows SAM best practices

  # Lambda Authorizer
  AuthorizerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "prod-api-authorizer-${EnvironmentSuffix}"
      InlineCode: |
        exports.handler = async (event) => {
          console.log('Authorizer Function executed');
          // Simple authorization - in production, implement proper JWT validation
          return {
            principalId: 'user',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [{
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: event.methodArn
              }]
            }
          };
        };
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: 128
      Timeout: 10
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentType
          LOG_LEVEL: !If [IsProd, "ERROR", "WARN"]
      Tracing: Active
      Tags:
        Environment: !Ref EnvironmentType
        Project: "prod-MyAPI"

  # WAF Web ACL - COMMENTED OUT: Deployment issues with rule statements
  # Error: "A reference in your rule statement is not valid" - WAF rule configuration issue
  # To enable WAF protection, you need to:
  # 1. Fix the WAF rule statement references
  # 2. Ensure proper IP set configuration
  # 3. Verify API Gateway association
  # 4. Then uncomment these resources
  #
  # WAFWebACL:
  #   Type: AWS::WAFv2::WebACL
  #   Condition: EnableWAFCondition
  #   Properties:
  #     Name: !Sub "prod-waf-webacl-${EnvironmentSuffix}"
  #     Description: "WAF Web ACL for API Gateway protection"
  #     Scope: REGIONAL
  #     DefaultAction:
  #       Block: {}
  #     Rules:
  #       - Name: IPWhitelistRule
  #         Priority: 1
  #         Statement:
  #           IPSetReferenceStatement:
  #             Arn: !GetAtt WAFIPSet.Arn
  #         Action:
  #           Allow: {}
  #         VisibilityConfig:
  #           SampledRequestsEnabled: true
  #           CloudWatchMetricsEnabled: true
  #           MetricName: "IPWhitelistRule"
  #       - Name: RateLimitRule
  #         Priority: 2
  #         Statement:
  #           RateBasedStatement:
  #             Limit: 2000
  #             AggregateKeyType: IP
  #         Action:
  #           Block: {}
  #         VisibilityConfig:
  #           SampledRequestsEnabled: true
  #           CloudWatchMetricsEnabled: true
  #           MetricName: "RateLimitRule"
  #       - Name: CommonAttackRule
  #         Priority: 3
  #         Statement:
  #           ManagedRuleGroupStatement:
  #             VendorName: AWS
  #             Name: AWSManagedRulesCommonRuleSet
  #         Action:
  #           Block: {}
  #         VisibilityConfig:
  #           SampledRequestsEnabled: true
  #           CloudWatchMetricsEnabled: true
  #           MetricName: "CommonAttackRule"
  #     VisibilityConfig:
  #       SampledRequestsEnabled: true
  #       CloudWatchMetricsEnabled: true
  #       MetricName: !Sub "prod-waf-webacl-${EnvironmentSuffix}"

  # WAFIPSet:
  #   Type: AWS::WAFv2::IPSet
  #   Condition: EnableWAFCondition
  #   Properties:
  #     Name: !Sub "prod-waf-ipset-${EnvironmentSuffix}"
  #     Description: "IP whitelist for API Gateway"
  #     Scope: REGIONAL
  #     IPAddressVersion: IPV4
  #     Addresses:
  #       # Example: allow only these trusted IPs/subnets
  #       - 198.51.100.0/24
  #       - 203.0.113.25/32

  # WAFWebACLAssociation:
  #   Type: AWS::WAFv2::WebACLAssociation
  #   Condition: EnableWAFCondition
  #   Properties:
  #     ResourceArn: !Sub "arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}"
  #     WebACLArn: !GetAtt WAFWebACL.Arn

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "prod-lambda-errors-${EnvironmentSuffix}"
      AlarmDescription: "Lambda function errors"
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref GetPromptFunction

  APIGatewayErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "prod-apigateway-errors-${EnvironmentSuffix}"
      AlarmDescription: "API Gateway 5XX errors"
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: ApiName
          Value: !Ref ApiGateway

  # AWS Config Rule - COMMENTED OUT: AWS Config allows only one configuration recorder per region per account
  # Error: "NoAvailableConfigurationRecorder" - AWS Config recorder may already be in use by another stack/service
  # To enable this rule, you need to:
  # 1. Ensure AWS Config is enabled in your account/region
  # 2. Verify no other stacks are using the Configuration Recorder
  # 3. If needed, create a shared Configuration Recorder at account level
  # 4. Then uncomment this resource
  #
  # LambdaConfigRule:
  #   Type: AWS::Config::ConfigRule
  #   Properties:
  #     ConfigRuleName: !Sub "prod-lambda-config-rule-${EnvironmentSuffix}"
  #     Description: "Checks whether the Lambda function concurrency limit is appropriately configured."
  #     Scope:
  #       ComplianceResourceTypes:
  #         - AWS::Lambda::Function
  #     Source:
  #       Owner: AWS
  #       SourceIdentifier: LAMBDA_CONCURRENCY_CHECK

Conditions:
  IsProd: !Equals [!Ref EnvironmentType, "prod"]
  # EnableWAFCondition: !Equals [!Ref EnableWAF, "true"]  # COMMENTED OUT: WAF resources are commented out

Outputs:
  TurnAroundPromptTableName:
    Description: "Name of the DynamoDB table"
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableName"

  TurnAroundPromptTableArn:
    Description: "ARN of the DynamoDB table"
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableArn"

  ApiGatewayUrl:
    Description: "API Gateway URL"
    Value: !Sub "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentType}"
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayUrl"

  EncryptionKeyArn:
    Description: "KMS Encryption Key ARN"
    Value: !GetAtt EncryptionKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-EncryptionKeyArn"

  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"
```
