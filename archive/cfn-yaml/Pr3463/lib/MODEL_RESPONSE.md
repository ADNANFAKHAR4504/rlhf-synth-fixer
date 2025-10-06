### Reasoning Trace
---

This is a comprehensive AWS CloudFormation template request for a fitness tracking backend. I need to create a YAML template with all the specified components:

1. API Gateway + Lambda integration
2. DynamoDB with proper keys for efficient querying
3. S3 bucket with versioning and encryption
4. Cognito User Pool with App Client
5. SNS for notifications
6. ElastiCache Redis cluster in VPC
7. CloudWatch dashboard and alarms
8. Proper IAM roles with least-privilege
9. KMS encryption
10. VPC configuration for ElastiCache

Let me structure this properly:

- Parameters section
- Conditions (for optional email/social provider)
- Resources:
  - VPC resources (VPC, subnets, security groups for ElastiCache)
  - KMS keys
  - DynamoDB tables
  - S3 bucket
  - Cognito User Pool and App Client
  - SNS Topic
  - Lambda functions and IAM roles
  - API Gateway
  - ElastiCache Redis cluster
  - CloudWatch Dashboard and Alarms
- Outputs

I'll make sure to include all the required tags and proper permissions.
### Answer 
---

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Fitness Tracking Backend Infrastructure'

Parameters:
  ApiName:
    Type: String
    Default: 'FitnessAPI'
    Description: 'Name of the API Gateway'
  
  DynamoDBReadCapacity:
    Type: Number
    Default: 5
    MinValue: 1
    MaxValue: 100
    Description: 'Read capacity units for DynamoDB tables'
  
  DynamoDBWriteCapacity:
    Type: Number
    Default: 5
    MinValue: 1
    MaxValue: 100
    Description: 'Write capacity units for DynamoDB tables'
  
  CognitoSocialProvider:
    Type: String
    Default: ''
    Description: 'Social identity provider (e.g., Facebook, Google)'
  
  NotificationEmail:
    Type: String
    Default: ''
    Description: 'Email for SNS notifications'
  
  RedisNodeType:
    Type: String
    Default: 'cache.t3.micro'
    AllowedValues:
      - cache.t3.micro
      - cache.t3.small
      - cache.t3.medium
    Description: 'ElastiCache Redis node type'

Conditions:
  HasSocialProvider: !Not [!Equals [!Ref CognitoSocialProvider, '']]
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, '']]

Resources:
  # VPC Configuration for ElastiCache
  FitnessVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref FitnessVPC
      InternetGatewayId: !Ref InternetGateway

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FitnessVPC
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FitnessVPC
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FitnessVPC
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref FitnessVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for ElastiCache Redis'
      VpcId: !Ref FitnessVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # KMS Keys
  FitnessKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for fitness tracker encryption'
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
                - sns.amazonaws.com
                - lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  FitnessKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 'alias/fitness-tracker-key'
      TargetKeyId: !Ref FitnessKMSKey

  # DynamoDB Tables
  UserProfilesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-UserProfiles'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: email
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: EmailIndex
          KeySchema:
            - AttributeName: email
              KeyType: HASH
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref FitnessKMSKey
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  WorkoutHistoryTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-WorkoutHistory'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: workoutTimestamp
          AttributeType: N
        - AttributeName: workoutType
          AttributeType: S
        - AttributeName: workoutDate
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: workoutTimestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: WorkoutTypeIndex
          KeySchema:
            - AttributeName: workoutType
              KeyType: HASH
            - AttributeName: workoutTimestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
        - IndexName: UserDateIndex
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
            - AttributeName: workoutDate
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref FitnessKMSKey
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # S3 Bucket
  FitnessAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-fitness-assets-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref FitnessKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # Cognito User Pool
  FitnessUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub '${AWS::StackName}-UserPool'
      UsernameAttributes:
        - email
      AutoVerifiedAttributes:
        - email
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
          Mutable: false
        - Name: name
          AttributeDataType: String
          Required: true
          Mutable: true
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
      UserPoolTags:
        Environment: fitness-dev
        Project: FitnessTracker
        Owner: FitnessBackendTeam

  FitnessUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub '${AWS::StackName}-AppClient'
      UserPoolId: !Ref FitnessUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_SRP_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
      GenerateSecret: false
      PreventUserExistenceErrors: ENABLED
      SupportedIdentityProviders:
        - COGNITO
        - !If [HasSocialProvider, !Ref CognitoSocialProvider, !Ref 'AWS::NoValue']

  # SNS Topic
  AchievementTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Achievements'
      DisplayName: 'Fitness Achievement Notifications'
      KmsMasterKeyId: !Ref FitnessKMSKey
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  EmailSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasNotificationEmail
    Properties:
      Protocol: email
      TopicArn: !Ref AchievementTopic
      Endpoint: !Ref NotificationEmail

  # Lambda IAM Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: FitnessLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:BatchGetItem'
                  - 'dynamodb:BatchWriteItem'
                Resource:
                  - !GetAtt UserProfilesTable.Arn
                  - !Sub '${UserProfilesTable.Arn}/index/*'
                  - !GetAtt WorkoutHistoryTable.Arn
                  - !Sub '${WorkoutHistoryTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt FitnessAssetsBucket.Arn
                  - !Sub '${FitnessAssetsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AchievementTopic
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'elasticache:DescribeCacheClusters'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt FitnessKMSKey.Arn
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # Lambda Functions
  WorkoutProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-WorkoutProcessing'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          USER_PROFILES_TABLE: !Ref UserProfilesTable
          WORKOUT_HISTORY_TABLE: !Ref WorkoutHistoryTable
          ACHIEVEMENT_TOPIC_ARN: !Ref AchievementTopic
          ASSETS_BUCKET: !Ref FitnessAssetsBucket
          REDIS_ENDPOINT: !GetAtt RedisCluster.RedisEndpoint.Address
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          dynamodb = boto3.resource('dynamodb')
          sns = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')
          
          def handler(event, context):
              # Process workout data
              workout_table = dynamodb.Table(os.environ['WORKOUT_HISTORY_TABLE'])
              user_table = dynamodb.Table(os.environ['USER_PROFILES_TABLE'])
              
              body = json.loads(event.get('body', '{}'))
              user_id = body.get('userId')
              workout_type = body.get('workoutType')
              duration = body.get('duration')
              calories = body.get('calories')
              
              timestamp = int(datetime.now().timestamp())
              workout_date = datetime.now().strftime('%Y-%m-%d')
              
              # Save workout to DynamoDB
              workout_table.put_item(
                  Item={
                      'userId': user_id,
                      'workoutTimestamp': timestamp,
                      'workoutType': workout_type,
                      'workoutDate': workout_date,
                      'duration': duration,
                      'calories': calories
                  }
              )
              
              # Check for achievements and send notifications
              check_achievements(user_id, workout_type)
              
              # Send custom metric to CloudWatch
              cloudwatch.put_metric_data(
                  Namespace='FitnessTracker',
                  MetricData=[
                      {
                          'MetricName': 'ActiveUsers',
                          'Value': 1,
                          'Unit': 'Count',
                          'Dimensions': [
                              {
                                  'Name': 'WorkoutType',
                                  'Value': workout_type
                              }
                          ]
                      }
                  ]
              )
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps({'message': 'Workout processed successfully'})
              }
          
          def check_achievements(user_id, workout_type):
              # Placeholder for achievement logic
              pass
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  LeaderboardFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-Leaderboard'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          WORKOUT_HISTORY_TABLE: !Ref WorkoutHistoryTable
          REDIS_ENDPOINT: !GetAtt RedisCluster.RedisEndpoint.Address
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta
          
          dynamodb = boto3.resource('dynamodb')
          
          def handler(event, context):
              # Get leaderboard data
              workout_table = dynamodb.Table(os.environ['WORKOUT_HISTORY_TABLE'])
              
              # Query recent workouts for leaderboard
              end_date = datetime.now()
              start_date = end_date - timedelta(days=7)
              
              # Placeholder response - would integrate with Redis
              leaderboard = {
                  'weekly': [],
                  'monthly': [],
                  'allTime': []
              }
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps(leaderboard)
              }
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # API Gateway
  FitnessAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Ref ApiName
      Description: 'Fitness Tracking Mobile API'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  WorkoutResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FitnessAPI
      ParentId: !GetAtt FitnessAPI.RootResourceId
      PathPart: 'workout'

  WorkoutMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FitnessAPI
      ResourceId: !Ref WorkoutResource
      HttpMethod: POST
      AuthorizationType: COGNITO_USER_POOLS
      AuthorizerId: !Ref ApiAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WorkoutProcessingFunction.Arn}/invocations'

  LeaderboardResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FitnessAPI
      ParentId: !GetAtt FitnessAPI.RootResourceId
      PathPart: 'leaderboard'

  LeaderboardMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FitnessAPI
      ResourceId: !Ref LeaderboardResource
      HttpMethod: GET
      AuthorizationType: COGNITO_USER_POOLS
      AuthorizerId: !Ref ApiAuthorizer
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LeaderboardFunction.Arn}/invocations'

  ApiAuthorizer:
    Type: AWS::ApiGateway::Authorizer
    Properties:
      Name: CognitoAuthorizer
      Type: COGNITO_USER_POOLS
      IdentitySource: method.request.header.Authorization
      RestApiId: !Ref FitnessAPI
      ProviderARNs:
        - !GetAtt FitnessUserPool.Arn

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - WorkoutMethod
      - LeaderboardMethod
    Properties:
      RestApiId: !Ref FitnessAPI
      StageName: dev

  WorkoutLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref WorkoutProcessingFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FitnessAPI}/*/*'

  LeaderboardLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LeaderboardFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FitnessAPI}/*/*'

  # ElastiCache Redis
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: 'Subnet group for Redis cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: !Ref RedisNodeType
      Engine: redis
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      Tags:
        - Key: Environment
          Value: fitness-dev
        - Key: Project
          Value: FitnessTracker
        - Key: Owner
          Value: FitnessBackendTeam

  # CloudWatch Dashboard
  FitnessDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-FitnessMetrics'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["FitnessTracker", "ActiveUsers", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Active Users",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Errors", {"stat": "Sum", "dimensions": {"FunctionName": "${WorkoutProcessingFunction}"}}],
                  [".", "Duration", {"stat": "Average", "dimensions": {"FunctionName": "${WorkoutProcessingFunction}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Performance"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum", "dimensions": {"TableName": "${WorkoutHistoryTable}"}}],
                  [".", "ConsumedWriteCapacityUnits", {"stat": "Sum", "dimensions": {"TableName": "${WorkoutHistoryTable}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "DynamoDB Usage"
              }
            }
          ]
        }

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LambdaErrors'
      AlarmDescription: 'Alert on Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref WorkoutProcessingFunction
      TreatMissingData: notBreaching

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DynamoDBThrottle'
      AlarmDescription: 'Alert on DynamoDB throttling'
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref WorkoutHistoryTable
      TreatMissingData: notBreaching

Outputs:
  ApiEndpoint:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${FitnessAPI}.execute-api.${AWS::Region}.amazonaws.com/dev'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  WorkoutProcessingFunctionArn:
    Description: 'Workout Processing Lambda Function ARN'
    Value: !GetAtt WorkoutProcessingFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WorkoutFunctionArn'

  LeaderboardFunctionArn:
    Description: 'Leaderboard Lambda Function ARN'
    Value: !GetAtt LeaderboardFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LeaderboardFunctionArn'

  WorkoutHistoryTableName:
    Description: 'DynamoDB Workout History Table Name'
    Value: !Ref WorkoutHistoryTable
    Export:
      Name: !Sub '${AWS::StackName}-WorkoutHistoryTable'

  S3BucketName:
    Description: 'S3 Bucket for fitness assets'
    Value: !Ref FitnessAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AssetsBucket'

  CognitoUserPoolId:
    Description: 'Cognito User Pool ID'
    Value: !Ref FitnessUserPool
    Export:
      Name: !Sub '${AWS::StackName}-UserPoolId'

  SNSTopicArn:
    Description: 'SNS Topic ARN for achievement notifications'
    Value: !Ref AchievementTopic
    Export:
      Name: !Sub '${AWS::StackName}-AchievementTopicArn'

  RedisClusterEndpoint:
    Description: 'ElastiCache Redis Cluster Endpoint'
    Value: !GetAtt RedisCluster.RedisEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RedisEndpoint'

  CloudWatchDashboardName:
    Description: 'CloudWatch Dashboard Name'
    Value: !Sub '${AWS::StackName}-FitnessMetrics'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardName'
```