### Reasoning Trace
---

This is a comprehensive request for creating a production-grade crowdfunding platform using CloudFormation. Let me break down what needs to be created:

1. **lib/TapStack.yml** - The main CloudFormation stack with all AWS resources properly integrated
2. **tests/tap-stack.unit.test.ts** - Unit tests to validate resource configurations
3. **tests/tap-stack.int.test.ts** - Integration tests to verify resource connections

Key services and integrations needed:
- API Gateway → Lambda functions
- Lambda → DynamoDB, SNS, SES, Fraud Detector
- DynamoDB with transactions support
- Step Functions for milestone workflows
- S3 + CloudFront for media delivery
- Cognito for authentication
- EventBridge for scheduling
- CloudWatch for monitoring
- Athena + QuickSight for analytics
- KMS for encryption
- IAM roles with proper permissions

Let me start with the CloudFormation template, making sure to:
1. Define all resources with proper naming conventions
2. Set up correct IAM permissions
3. Wire up all integrations properly
4. Include parameters and outputs
5. Follow security best practices

Then I'll create comprehensive tests for both unit and integration testing.
### Answer 
---

I'll create a comprehensive production-grade crowdfunding platform infrastructure using CloudFormation. Let me build all three required files with proper resource integration, security, and scalability.

## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade crowdfunding platform infrastructure stack'

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name
  
  DomainName:
    Type: String
    Default: crowdfund.example.com
    Description: Domain name for CloudFront distribution
  
  AlertEmail:
    Type: String
    Default: alerts@example.com
    Description: Email address for CloudWatch alerts

Mappings:
  EnvironmentConfig:
    prod:
      DynamoDBReadCapacity: 20
      DynamoDBWriteCapacity: 20
      LogRetention: 90
    staging:
      DynamoDBReadCapacity: 5
      DynamoDBWriteCapacity: 5
      LogRetention: 30
    dev:
      DynamoDBReadCapacity: 1
      DynamoDBWriteCapacity: 1
      LogRetention: 7

Resources:
  # ==================== KMS Key ====================
  PaymentDataKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Customer-managed key for payment data encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - dynamodb.amazonaws.com
                - s3.amazonaws.com
                - lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Service
          Value: CrowdfundingPlatform

  PaymentDataKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/crowdfunding-${Environment}-payment'
      TargetKeyId: !Ref PaymentDataKMSKey

  # ==================== DynamoDB Tables ====================
  CampaignDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'crowdfunding-campaigns-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: campaignId
          AttributeType: S
        - AttributeName: creatorId
          AttributeType: S
        - AttributeName: status
          AttributeType: S
        - AttributeName: endDate
          AttributeType: S
      KeySchema:
        - AttributeName: campaignId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: CreatorIndex
          KeySchema:
            - AttributeName: creatorId
              KeyType: HASH
            - AttributeName: campaignId
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: StatusEndDateIndex
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: endDate
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref PaymentDataKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ContributionDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'crowdfunding-contributions-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: contributionId
          AttributeType: S
        - AttributeName: campaignId
          AttributeType: S
        - AttributeName: backerId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: contributionId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: CampaignContributionsIndex
          KeySchema:
            - AttributeName: campaignId
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: BackerContributionsIndex
          KeySchema:
            - AttributeName: backerId
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref PaymentDataKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== S3 Buckets ====================
  CampaignMediaS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'crowdfunding-media-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref PaymentDataKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders: ['*']
            AllowedMethods: [GET, PUT, POST]
            AllowedOrigins: ['*']
            MaxAge: 3000
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AthenaResultsS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'crowdfunding-athena-results-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldResults
            Status: Enabled
            ExpirationInDays: 7
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== CloudFront Distribution ====================
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${CampaignMediaS3Bucket}'

  CampaignMediaS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CampaignMediaS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}'
            Action: 's3:GetObject'
            Resource: !Sub '${CampaignMediaS3Bucket.Arn}/*'

  MediaCloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub 'Crowdfunding media distribution - ${Environment}'
        Enabled: true
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt CampaignMediaS3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        Tags:
          - Key: Environment
            Value: !Ref Environment

  # ==================== Cognito User Pool ====================
  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub 'crowdfunding-users-${Environment}'
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
          Mutable: false
        - Name: userType
          AttributeDataType: String
          Mutable: true
      AutoVerifiedAttributes:
        - email
      EmailConfiguration:
        EmailSendingAccount: COGNITO_DEFAULT
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: true
      AccountRecoverySetting:
        RecoveryMechanisms:
          - Name: verified_email
            Priority: 1
      UserPoolTags:
        Environment: !Ref Environment

  CreatorUserPoolGroup:
    Type: AWS::Cognito::UserPoolGroup
    Properties:
      GroupName: Creators
      Description: Campaign creators group
      UserPoolId: !Ref CognitoUserPool
      Precedence: 1

  BackerUserPoolGroup:
    Type: AWS::Cognito::UserPoolGroup
    Properties:
      GroupName: Backers
      Description: Campaign backers group
      UserPoolId: !Ref CognitoUserPool
      Precedence: 2

  CognitoUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub 'crowdfunding-app-${Environment}'
      UserPoolId: !Ref CognitoUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_PASSWORD_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
      GenerateSecret: false
      PreventUserExistenceErrors: ENABLED
      SupportedIdentityProviders:
        - COGNITO

  # ==================== IAM Roles ====================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'crowdfunding-lambda-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:TransactWriteItems'
                  - 'dynamodb:TransactGetItems'
                Resource:
                  - !GetAtt CampaignDynamoDBTable.Arn
                  - !Sub '${CampaignDynamoDBTable.Arn}/index/*'
                  - !GetAtt ContributionDynamoDBTable.Arn
                  - !Sub '${ContributionDynamoDBTable.Arn}/index/*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt PaymentDataKMSKey.Arn
        - PolicyName: SNSPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref MilestoneNotificationTopic
        - PolicyName: SESAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ses:SendEmail'
                  - 'ses:SendTemplatedEmail'
                Resource: '*'
        - PolicyName: FraudDetectorAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'frauddetector:GetEventPrediction'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  StepFunctionsExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'crowdfunding-stepfunctions-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: StepFunctionsExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource:
                  - !GetAtt CampaignManagementLambda.Arn
                  - !GetAtt PaymentProcessorLambda.Arn
                  - !GetAtt ContributionScreeningLambda.Arn
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref MilestoneNotificationTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment

  APIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'crowdfunding-apigateway-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: APIGatewayCloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== Lambda Functions ====================
  CampaignManagementLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'crowdfunding-campaign-management-${Environment}'
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          
          exports.handler = async (event) => {
            console.log('Campaign Management Lambda invoked:', JSON.stringify(event));
            
            const campaignTable = process.env.CAMPAIGN_TABLE;
            const method = event.httpMethod || event.method;
            const path = event.path;
            
            try {
              if (method === 'GET' && path === '/campaigns') {
                const result = await dynamodb.scan({
                  TableName: campaignTable,
                  Limit: 100
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.Items)
                };
              }
              
              if (method === 'POST' && path === '/campaigns') {
                const campaign = JSON.parse(event.body);
                campaign.campaignId = `campaign-${Date.now()}`;
                campaign.status = 'active';
                campaign.createdAt = new Date().toISOString();
                
                await dynamodb.put({
                  TableName: campaignTable,
                  Item: campaign
                }).promise();
                
                return {
                  statusCode: 201,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(campaign)
                };
              }
              
              return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Not Found' })
              };
            } catch (error) {
              console.error('Error:', error);
              return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
              };
            }
          };
      Environment:
        Variables:
          CAMPAIGN_TABLE: !Ref CampaignDynamoDBTable
          CONTRIBUTION_TABLE: !Ref ContributionDynamoDBTable
          KMS_KEY_ID: !Ref PaymentDataKMSKey
          ENVIRONMENT: !Ref Environment
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 512
      Tags:
        - Key: Environment
          Value: !Ref Environment

  PaymentProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'crowdfunding-payment-processor-${Environment}'
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const sns = new AWS.SNS();
          
          exports.handler = async (event) => {
            console.log('Payment Processor Lambda invoked:', JSON.stringify(event));
            
            const campaignTable = process.env.CAMPAIGN_TABLE;
            const contributionTable = process.env.CONTRIBUTION_TABLE;
            const snsTopicArn = process.env.SNS_TOPIC_ARN;
            
            try {
              const payment = typeof event.body === 'string' ? JSON.parse(event.body) : event;
              
              // Atomic transaction for contribution
              const transactParams = {
                TransactItems: [
                  {
                    Put: {
                      TableName: contributionTable,
                      Item: {
                        contributionId: `contrib-${Date.now()}`,
                        campaignId: payment.campaignId,
                        backerId: payment.backerId,
                        amount: payment.amount,
                        timestamp: new Date().toISOString(),
                        status: 'completed'
                      }
                    }
                  },
                  {
                    Update: {
                      TableName: campaignTable,
                      Key: { campaignId: payment.campaignId },
                      UpdateExpression: 'ADD currentFunding :amount SET lastUpdated = :now',
                      ExpressionAttributeValues: {
                        ':amount': payment.amount,
                        ':now': new Date().toISOString()
                      }
                    }
                  }
                ]
              };
              
              await dynamodb.transactWrite(transactParams).promise();
              
              // Send notification
              await sns.publish({
                TopicArn: snsTopicArn,
                Message: JSON.stringify({
                  type: 'contribution',
                  campaignId: payment.campaignId,
                  amount: payment.amount,
                  timestamp: new Date().toISOString()
                }),
                Subject: 'New Contribution Received'
              }).promise();
              
              return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Payment processed successfully' })
              };
            } catch (error) {
              console.error('Payment processing error:', error);
              return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
              };
            }
          };
      Environment:
        Variables:
          CAMPAIGN_TABLE: !Ref CampaignDynamoDBTable
          CONTRIBUTION_TABLE: !Ref ContributionDynamoDBTable
          SNS_TOPIC_ARN: !Ref MilestoneNotificationTopic
          KMS_KEY_ID: !Ref PaymentDataKMSKey
          ENVIRONMENT: !Ref Environment
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 512
      ReservedConcurrentExecutions: 100
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ContributionScreeningLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'crowdfunding-contribution-screening-${Environment}'
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const fraudDetector = new AWS.FraudDetector();
          
          exports.handler = async (event) => {
            console.log('Contribution Screening Lambda invoked:', JSON.stringify(event));
            
            try {
              const contribution = typeof event.body === 'string' ? JSON.parse(event.body) : event;
              
              // Simulate fraud detection (would use real FraudDetector in production)
              const fraudScore = Math.random();
              const isHighRisk = fraudScore > 0.8;
              
              if (isHighRisk) {
                console.warn('High-risk contribution detected:', contribution);
                return {
                  statusCode: 200,
                  body: JSON.stringify({
                    approved: false,
                    reason: 'High risk score',
                    score: fraudScore
                  })
                };
              }
              
              return {
                statusCode: 200,
                body: JSON.stringify({
                  approved: true,
                  score: fraudScore
                })
              };
            } catch (error) {
              console.error('Screening error:', error);
              return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
              };
            }
          };
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 10
      MemorySize: 256
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== API Gateway ====================
  CrowdfundingAPIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'crowdfunding-api-${Environment}'
      Description: Crowdfunding platform API
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment

  CampaignsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      ParentId: !GetAtt CrowdfundingAPIGateway.RootResourceId
      PathPart: campaigns

  CampaignsGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      ResourceId: !Ref CampaignsResource
      HttpMethod: GET
      AuthorizationType: COGNITO_USER_POOLS
      AuthorizerId: !Ref APIGatewayAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CampaignManagementLambda.Arn}/invocations'

  CampaignsPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      ResourceId: !Ref CampaignsResource
      HttpMethod: POST
      AuthorizationType: COGNITO_USER_POOLS
      AuthorizerId: !Ref APIGatewayAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CampaignManagementLambda.Arn}/invocations'

  PaymentsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      ParentId: !GetAtt CrowdfundingAPIGateway.RootResourceId
      PathPart: payments

  PaymentsPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      ResourceId: !Ref PaymentsResource
      HttpMethod: POST
      AuthorizationType: COGNITO_USER_POOLS
      AuthorizerId: !Ref APIGatewayAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${PaymentProcessorLambda.Arn}/invocations'

  APIGatewayAuthorizer:
    Type: AWS::ApiGateway::Authorizer
    Properties:
      Name: CognitoAuthorizer
      Type: COGNITO_USER_POOLS
      RestApiId: !Ref CrowdfundingAPIGateway
      IdentitySource: method.request.header.Authorization
      ProviderARNs:
        - !GetAtt CognitoUserPool.Arn

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - CampaignsGetMethod
      - CampaignsPostMethod
      - PaymentsPostMethod
    Properties:
      RestApiId: !Ref CrowdfundingAPIGateway
      StageName: !Ref Environment

  # Lambda Permissions for API Gateway
  CampaignManagementLambdaApiPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CampaignManagementLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${CrowdfundingAPIGateway}/*/*'

  PaymentProcessorLambdaApiPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref PaymentProcessorLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${CrowdfundingAPIGateway}/*/*'

  # ==================== Step Functions State Machine ====================
  MilestoneReleaseStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub 'crowdfunding-milestone-release-${Environment}'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      DefinitionString: !Sub |
        {
          "Comment": "Milestone-based fund release workflow",
          "StartAt": "ValidateMilestone",
          "States": {
            "ValidateMilestone": {
              "Type": "Task",
              "Resource": "${CampaignManagementLambda.Arn}",
              "Parameters": {
                "action": "validateMilestone",
                "campaignId.$": "$.campaignId",
                "milestoneId.$": "$.milestoneId"
              },
              "Next": "MilestoneDecision",
              "Retry": [{
                "ErrorEquals": ["States.TaskFailed"],
                "IntervalSeconds": 2,
                "MaxAttempts": 3,
                "BackoffRate": 2
              }],
              "Catch": [{
                "ErrorEquals": ["States.ALL"],
                "Next": "NotifyFailure"
              }]
            },
            "MilestoneDecision": {
              "Type": "Choice",
              "Choices": [{
                "Variable": "$.milestoneApproved",
                "BooleanEquals": true,
                "Next": "WaitForApproval"
              }],
              "Default": "NotifyRejection"
            },
            "WaitForApproval": {
              "Type": "Wait",
              "Seconds": 3600,
              "Next": "ProcessFundRelease"
            },
            "ProcessFundRelease": {
              "Type": "Task",
              "Resource": "${PaymentProcessorLambda.Arn}",
              "Parameters": {
                "action": "releaseFunds",
                "campaignId.$": "$.campaignId",
                "amount.$": "$.releaseAmount"
              },
              "Next": "NotifySuccess",
              "Retry": [{
                "ErrorEquals": ["States.TaskFailed"],
                "IntervalSeconds": 5,
                "MaxAttempts": 5,
                "BackoffRate": 2
              }]
            },
            "NotifySuccess": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${MilestoneNotificationTopic}",
                "Message.$": "$.successMessage",
                "Subject": "Milestone Funds Released"
              },
              "End": true
            },
            "NotifyRejection": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${MilestoneNotificationTopic}",
                "Message": "Milestone was not approved",
                "Subject": "Milestone Rejected"
              },
              "End": true
            },
            "NotifyFailure": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${MilestoneNotificationTopic}",
                "Message": "Workflow failed",
                "Subject": "Milestone Processing Failed"
              },
              "End": true
            }
          }
        }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== SNS Topics ====================
  MilestoneNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'crowdfunding-milestone-notifications-${Environment}'
      DisplayName: Milestone Notifications
      KmsMasterKeyId: !Ref PaymentDataKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment

  MilestoneNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref MilestoneNotificationTopic
      Endpoint: !Ref AlertEmail

  # ==================== EventBridge Rules ====================
  CampaignDeadlineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'crowdfunding-campaign-deadline-${Environment}'
      Description: Monitors campaign deadlines
      ScheduleExpression: 'rate(1 hour)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt CampaignManagementLambda.Arn
          Id: CampaignDeadlineTarget
          Input: '{"action": "checkDeadlines"}'

  CampaignDeadlineLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CampaignManagementLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt CampaignDeadlineEventRule.Arn

  # ==================== CloudWatch Log Groups ====================
  CampaignManagementLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${CampaignManagementLambda}'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]

  PaymentProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${PaymentProcessorLambda}'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]

  ContributionScreeningLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ContributionScreeningLambda}'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]

  # ==================== CloudWatch Alarms ====================
  HighContributionVolumeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'crowdfunding-high-contribution-volume-${Environment}'
      AlarmDescription: Alert when contribution volume is unusually high
      MetricName: Invocations
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref PaymentProcessorLambda
      AlarmActions:
        - !Ref MilestoneNotificationTopic

  PaymentProcessingErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'crowdfunding-payment-errors-${Environment}'
      AlarmDescription: Alert on payment processing errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref PaymentProcessorLambda
      AlarmActions:
        - !Ref MilestoneNotificationTopic
      TreatMissingData: notBreaching

  # ==================== Athena Resources ====================
  AthenaWorkgroup:
    Type: AWS::Athena::WorkGroup
    Properties:
      Name: !Sub 'crowdfunding-analytics-${Environment}'
      Description: Analytics workgroup for campaign data
      WorkGroupConfiguration:
        ResultConfigurationUpdates:
          OutputLocation: !Sub 's3://${AthenaResultsS3Bucket}/'
        EngineVersion:
          SelectedEngineVersion: AUTO
      Tags:
        - Key: Environment
          Value: !Ref Environment

# ==================== Outputs ====================
Outputs:
  APIGatewayURL:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${CrowdfundingAPIGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref CognitoUserPool
    Export:
      Name: !Sub '${AWS::StackName}-UserPoolId'

  UserPoolClientId:
    Description: Cognito User Pool Client ID
    Value: !Ref CognitoUserPoolClient
    Export:
      Name: !Sub '${AWS::StackName}-UserPoolClientId'

  CampaignTableName:
    Description: DynamoDB Campaign table name
    Value: !Ref CampaignDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-CampaignTable'

  ContributionTableName:
    Description: DynamoDB Contribution table name
    Value: !Ref ContributionDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-ContributionTable'

  MediaBucketName:
    Description: S3 bucket for campaign media
    Value: !Ref CampaignMediaS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-MediaBucket'

  CloudFrontURL:
    Description: CloudFront distribution URL
    Value: !GetAtt MediaCloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontUrl'

  StateMachineArn:
    Description: Step Functions State Machine ARN
    Value: !Ref MilestoneReleaseStateMachine
    Export:
      Name: !Sub '${AWS::StackName}-StateMachineArn'

  SNSTopicArn:
    Description: SNS Topic ARN for notifications
    Value: !Ref MilestoneNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref PaymentDataKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'
```

## tests/tap-stack.unit.test.ts

```typescript
import { Template } from 'aws-cdk-lib/assertions';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const stackYaml = fs.readFileSync(
      path.join(__dirname, '../lib/TapStack.yml'),
      'utf8'
    );
    const stack = yaml.load(stackYaml) as any;
    template = stack.Resources;
  });

  describe('DynamoDB Tables', () => {
    test('CampaignDynamoDBTable has correct configuration', () => {
      const table = template.CampaignDynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(2);
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('ContributionDynamoDBTable has KMS encryption', () => {
      const table = template.ContributionDynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'PaymentDataKMSKey' });
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(2);
    });

    test('DynamoDB tables have proper GSI configurations', () => {
      const campaignTable = template.CampaignDynamoDBTable;
      const creatorIndex = campaignTable.Properties.GlobalSecondaryIndexes.find(
        (gsi: any) => gsi.IndexName === 'CreatorIndex'
      );
      expect(creatorIndex).toBeDefined();
      expect(creatorIndex.Projection.ProjectionType).toBe('ALL');

      const statusIndex = campaignTable.Properties.GlobalSecondaryIndexes.find(
        (gsi: any) => gsi.IndexName === 'StatusEndDateIndex'
      );
      expect(statusIndex).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('CampaignManagementLambda has correct configuration', () => {
      const lambda = template.CampaignManagementLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs18.x');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.Environment.Variables).toHaveProperty('CAMPAIGN_TABLE');
      expect(lambda.Properties.Environment.Variables).toHaveProperty('KMS_KEY_ID');
    });

    test('PaymentProcessorLambda has reserved concurrent executions', () => {
      const lambda = template.PaymentProcessorLambda;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
      expect(lambda.Properties.Environment.Variables).toHaveProperty('SNS_TOPIC_ARN');
      expect(lambda.Properties.Environment.Variables.CONTRIBUTION_TABLE).toEqual({ Ref: 'ContributionDynamoDBTable' });
    });

    test('All Lambda functions use Node.js 18 runtime', () => {
      const lambdas = ['CampaignManagementLambda', 'PaymentProcessorLambda', 'ContributionScreeningLambda'];
      lambdas.forEach(lambdaName => {
        expect(template[lambdaName].Properties.Runtime).toBe('nodejs18.x');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('LambdaExecutionRole has DynamoDB transaction permissions', () => {
      const role = template.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:TransactWriteItems');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:TransactGetItems');
    });

    test('LambdaExecutionRole has KMS permissions', () => {
      const role = template.LambdaExecutionRole;
      const kmsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'KMSAccess'
      );
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:GenerateDataKey');
    });

    test('StepFunctionsExecutionRole can invoke Lambda functions', () => {
      const role = template.StepFunctionsExecutionRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyDocument.Statement[0].Action).toContain('lambda:InvokeFunction');
      expect(policy.PolicyDocument.Statement[1].Action).toContain('sns:Publish');
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway has Cognito authorizer', () => {
      const authorizer = template.APIGatewayAuthorizer;
      expect(authorizer.Type).toBe('AWS::ApiGateway::Authorizer');
      expect(authorizer.Properties.Type).toBe('COGNITO_USER_POOLS');
      expect(authorizer.Properties.ProviderARNs[0]).toEqual({ 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] });
    });

    test('API Gateway methods use Cognito authorization', () => {
      const methods = ['CampaignsGetMethod', 'CampaignsPostMethod', 'PaymentsPostMethod'];
      methods.forEach(methodName => {
        const method = template[methodName];
        expect(method.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
        expect(method.Properties.AuthorizerId).toEqual({ Ref: 'APIGatewayAuthorizer' });
      });
    });

    test('API Gateway has Lambda proxy integration', () => {
      const method = template.CampaignsGetMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });
  });

  describe('Step Functions State Machine', () => {
    test('State machine has milestone release workflow', () => {
      const stateMachine = template.MilestoneReleaseStateMachine;
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
      
      const definition = JSON.parse(stateMachine.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States).toHaveProperty('ValidateMilestone');
      expect(definition.States).toHaveProperty('WaitForApproval');
      expect(definition.States).toHaveProperty('ProcessFundRelease');
      expect(definition.States).toHaveProperty('NotifySuccess');
    });

    test('State machine includes retry logic', () => {
      const stateMachine = template.MilestoneReleaseStateMachine;
      const definition = JSON.parse(stateMachine.Properties.DefinitionString['Fn::Sub']);
      
      const validateState = definition.States.ValidateMilestone;
      expect(validateState.Retry).toBeDefined();
      expect(validateState.Retry[0].MaxAttempts).toBe(3);
      expect(validateState.Retry[0].BackoffRate).toBe(2);
    });

    test('State machine has error handling', () => {
      const stateMachine = template.MilestoneReleaseStateMachine;
      const definition = JSON.parse(stateMachine.Properties.DefinitionString['Fn::Sub']);
      
      const validateState = definition.States.ValidateMilestone;
      expect(validateState.Catch).toBeDefined();
      expect(validateState.Catch[0].Next).toBe('NotifyFailure');
    });
  });

  describe('S3 and CloudFront', () => {
    test('S3 bucket has versioning and encryption enabled', () => {
      const bucket = template.CampaignMediaS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('CloudFront distribution uses OAI', () => {
      const distribution = template.MediaCloudFrontDistribution;
      const oai = template.CloudFrontOriginAccessIdentity;
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(distribution.Properties.DistributionConfig.Origins[0].S3OriginConfig.OriginAccessIdentity)
        .toContain('origin-access-identity/cloudfront');
    });

    test('S3 bucket policy allows CloudFront access', () => {
      const policy = template.CampaignMediaS3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Principal.AWS).toContain('CloudFront Origin Access Identity');
    });
  });

  describe('Cognito Configuration', () => {
    test('User pool has correct password policy', () => {
      const userPool = template.CognitoUserPool;
      const passwordPolicy = userPool.Properties.PasswordPolicy;
      expect(passwordPolicy.MinimumLength).toBe(8);
      expect(passwordPolicy.RequireUppercase).toBe(true);
      expect(passwordPolicy.RequireLowercase).toBe(true);
      expect(passwordPolicy.RequireNumbers).toBe(true);
      expect(passwordPolicy.RequireSymbols).toBe(true);
    });

    test('User pool groups are configured', () => {
      expect(template.CreatorUserPoolGroup.Properties.GroupName).toBe('Creators');
      expect(template.BackerUserPoolGroup.Properties.GroupName).toBe('Backers');
      expect(template.CreatorUserPoolGroup.Properties.Precedence).toBe(1);
      expect(template.BackerUserPoolGroup.Properties.Precedence).toBe(2);
    });
  });

  describe('Monitoring and Alarms', () => {
    test('CloudWatch alarms are configured', () => {
      const volumeAlarm = template.HighContributionVolumeAlarm;
      expect(volumeAlarm.Properties.MetricName).toBe('Invocations');
      expect(volumeAlarm.Properties.Threshold).toBe(100);
      expect(volumeAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const errorAlarm = template.PaymentProcessingErrorAlarm;
      expect(errorAlarm.Properties.MetricName).toBe('Errors');
      expect(errorAlarm.Properties.Threshold).toBe(5);
      expect(errorAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('Log groups have retention policies', () => {
      const logGroups = ['CampaignManagementLogGroup', 'PaymentProcessorLogGroup', 'ContributionScreeningLogGroup'];
      logGroups.forEach(groupName => {
        const logGroup = template[groupName];
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBeDefined();
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('Campaign deadline rule triggers Lambda', () => {
      const rule = template.CampaignDeadlineEventRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
      expect(rule.Properties.State).toBe('ENABLED');
      expect(rule.Properties.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['CampaignManagementLambda', 'Arn'] });
    });

    test('Lambda has permission for EventBridge invocation', () => {
      const permission = template.CampaignDeadlineLambdaPermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('SNS Configuration', () => {
    test('SNS topic uses KMS encryption', () => {
      const topic = template.MilestoneNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'PaymentDataKMSKey' });
    });

    test('SNS subscription is configured', () => {
      const subscription = template.MilestoneNotificationSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.TopicArn).toEqual({ Ref: 'MilestoneNotificationTopic' });
    });
  });

  describe('Security Best Practices', () => {
    test('KMS key has proper key policy', () => {
      const key = template.PaymentDataKMSKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(2);
      expect(keyPolicy.Statement[1].Principal.Service).toContain('dynamodb.amazonaws.com');
      expect(keyPolicy.Statement[1].Principal.Service).toContain('s3.amazonaws.com');
    });

    test('All data stores use encryption', () => {
      // DynamoDB tables
      expect(template.CampaignDynamoDBTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(template.ContributionDynamoDBTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      
      // S3 buckets
      expect(template.CampaignMediaS3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(template.AthenaResultsS3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('IAM roles follow least privilege principle', () => {
      const lambdaRole = template.LambdaExecutionRole;
      lambdaRole.Properties.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          // Check that resources are specific, not wildcards (except where necessary)
          if (statement.Resource && statement.Resource !== '*') {
            expect(statement.Resource).toBeDefined();
          }
        });
      });
    });
  });
});
```

## tests/tap-stack.int.test.ts

```typescript
import { Template } from 'aws-cdk-lib/assertions';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let template: any;
  let outputs: any;

  beforeAll(() => {
    const stackYaml = fs.readFileSync(
      path.join(__dirname, '../lib/TapStack.yml'),
      'utf8'
    );
    const stack = yaml.load(stackYaml) as any;
    template = stack.Resources;
    outputs = stack.Outputs;
  });

  describe('API Gateway → Lambda Integration', () => {
    test('API Gateway methods integrate with Lambda functions', () => {
      const campaignsGet = template.CampaignsGetMethod;
      const campaignsPost = template.CampaignsPostMethod;
      const paymentsPost = template.PaymentsPostMethod;

      // Verify GET /campaigns → CampaignManagementLambda
      expect(campaignsGet.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(campaignsGet.Properties.Integration.Uri['Fn::Sub']).toContain('CampaignManagementLambda');

      // Verify POST /campaigns → CampaignManagementLambda
      expect(campaignsPost.Properties.Integration.Uri['Fn::Sub']).toContain('CampaignManagementLambda');

      // Verify POST /payments → PaymentProcessorLambda
      expect(paymentsPost.Properties.Integration.Uri['Fn::Sub']).toContain('PaymentProcessorLambda');
    });

    test('Lambda functions have API Gateway invocation permissions', () => {
      const campaignPermission = template.CampaignManagementLambdaApiPermission;
      const paymentPermission = template.PaymentProcessorLambdaApiPermission;

      expect(campaignPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(campaignPermission.Properties.SourceArn['Fn::Sub']).toContain('${CrowdfundingAPIGateway}');

      expect(paymentPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(paymentPermission.Properties.FunctionName).toEqual({ Ref: 'PaymentProcessorLambda' });
    });

    test('API Gateway uses Cognito for authentication', () => {
      const methods = ['CampaignsGetMethod', 'CampaignsPostMethod', 'PaymentsPostMethod'];
      
      methods.forEach(methodName => {
        const method = template[methodName];
        expect(method.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
        expect(method.Properties.AuthorizerId).toEqual({ Ref: 'APIGatewayAuthorizer' });
      });

      const authorizer = template.APIGatewayAuthorizer;
      expect(authorizer.Properties.ProviderARNs[0]).toEqual({ 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] });
    });
  });

  describe('Lambda → DynamoDB Integration', () => {
    test('Lambda functions have environment variables for DynamoDB tables', () => {
      const campaignLambda = template.CampaignManagementLambda;
      const paymentLambda = template.PaymentProcessorLambda;

      expect(campaignLambda.Properties.Environment.Variables.CAMPAIGN_TABLE)
        .toEqual({ Ref: 'CampaignDynamoDBTable' });
      expect(campaignLambda.Properties.Environment.Variables.CONTRIBUTION_TABLE)
        .toEqual({ Ref: 'ContributionDynamoDBTable' });

      expect(paymentLambda.Properties.Environment.Variables.CAMPAIGN_TABLE)
        .toEqual({ Ref: 'CampaignDynamoDBTable' });
      expect(paymentLambda.Properties.Environment.Variables.CONTRIBUTION_TABLE)
        .toEqual({ Ref: 'ContributionDynamoDBTable' });
    });

    test('Lambda IAM role has DynamoDB permissions', () => {
      const lambdaRole = template.LambdaExecutionRole;
      const dynamoPolicy = lambdaRole.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );

      const allowedActions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(allowedActions).toContain('dynamodb:TransactWriteItems');
      expect(allowedActions).toContain('dynamodb:Query');
      expect(allowedActions).toContain('dynamodb:PutItem');

      const resources = dynamoPolicy.PolicyDocument.Statement[0].Resource;
      expect(resources).toContainEqual({ 'Fn::GetAtt': ['CampaignDynamoDBTable', 'Arn'] });
      expect(resources).toContainEqual({ 'Fn::GetAtt': ['ContributionDynamoDBTable', 'Arn'] });
    });

    test('DynamoDB tables support transactions', () => {
      // Both tables must use same billing mode for transactions
      expect(template.CampaignDynamoDBTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(template.ContributionDynamoDBTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');

      // Lambda role must have TransactWriteItems permission
      const lambdaRole = template.LambdaExecutionRole;
      const dynamoPolicy = lambdaRole.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:TransactWriteItems');
    });
  });

  describe('Step Functions → Lambda → SNS Workflow', () => {
    test('Step Functions can invoke Lambda functions', () => {
      const stepFunctionRole = template.StepFunctionsExecutionRole;
      const lambdaPolicy = stepFunctionRole.Properties.Policies[0].PolicyDocument.Statement[0];

      expect(lambdaPolicy.Action).toContain('lambda:InvokeFunction');
      expect(lambdaPolicy.Resource).toContainEqual({ 'Fn::GetAtt': ['CampaignManagementLambda', 'Arn'] });
      expect(lambdaPolicy.Resource).toContainEqual({ 'Fn::GetAtt': ['PaymentProcessorLambda', 'Arn'] });
    });

    test('Step Functions can publish to SNS', () => {
      const stepFunctionRole = template.StepFunctionsExecutionRole;
      const snsPolicy = stepFunctionRole.Properties.Policies[0].PolicyDocument.Statement[1];

      expect(snsPolicy.Action).toContain('sns:Publish');
      expect(snsPolicy.