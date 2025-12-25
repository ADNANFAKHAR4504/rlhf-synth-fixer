```
AWSTemplateFormatVersion: '2010-09-09'
Description: A secure, scalable, and fully serverless web application infrastructure.

Resources:
  MyDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: MyDataTable
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      Tags:
        - Key: Environment
          Value: Production

  MyLambdaExecutionRole:
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
        - PolicyName: LambdaDynamoDBPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                Resource: !GetAtt MyDynamoDBTable.Arn
      Tags:
        - Key: Environment
          Value: Production

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: MyBackendProcessor
      Handler: index.handler
      Role: !GetAtt MyLambdaExecutionRole.Arn
      Code:
        S3Bucket: my-lambda-code-bucket
        S3Key: lambda-code.zip
      Runtime: nodejs14.x
      Environment:
        Variables:
          TABLE_NAME: !Ref MyDynamoDBTable
      KmsKeyArn: !GetAtt MyKMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  MyKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for securing sensitive resources
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-default-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Environment
          Value: Production

  MyS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MyKMSKey
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production

  MyApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: MySecureApi
      Description: API Gateway with API Key and CloudWatch logging
      FailOnWarnings: true
      Tags:
        - Key: Environment
          Value: Production

  MyApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - MyApiGatewayMethod
    Properties:
      RestApiId: !Ref MyApiGateway
      StageName: Prod

  MyApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref MyApiGateway
      ResourceId: !GetAtt MyApiGateway.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        IntegrationHttpMethod: POST
        Type: AWS_PROXY
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${MyLambdaFunction.Arn}/invocations

  MyApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ApiGatewayCloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: arn:aws:logs:*:*:*

  MyApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt MyApiGatewayCloudWatchRole.Arn

  MyApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Enabled: true
      StageKeys:
        - RestApiId: !Ref MyApiGateway
          StageName: Prod

  MyApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      ApiStages:
        - ApiId: !Ref MyApiGateway
          Stage: Prod
      Quota:
        Limit: 5000
        Period: MONTH
      Throttle:
        BurstLimit: 1000
        RateLimit: 500

  MyApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref MyApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref MyApiUsagePlan

  MyWAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      DefaultAction:
        Allow: {}
      Scope: REGIONAL
      Description: Protect against common web exploits
      Rules:
        - Name: AWS-AWSManagedRulesCommonRuleSet
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesCommonRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: webACL

  MyWAFWebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !GetAtt MyApiGateway.Arn
      WebACLArn: !GetAtt MyWAFWebACL.Arn

Outputs:
  ApiUrl:
    Description: URL of the API Gateway
    Value: !Sub https://${MyApiGateway}.execute-api.${AWS::Region}.amazonaws.com/Prod

```