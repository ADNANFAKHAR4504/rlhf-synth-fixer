AWSTemplateFormatVersion: '2010-09-09'
Description: 'Fitness Tracking Backend Infrastructure - LocalStack Compatible'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
  
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
  
  NotificationEmail:
    Type: String
    Default: 'test@example.com'
    Description: 'Email for SNS notifications'

Conditions:
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, '']]

Resources:
  # VPC Configuration (Simplified for LocalStack)
  FitnessVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FitnessVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref FitnessVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FitnessVPC
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FitnessVPC
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  # KMS Keys (Simplified for LocalStack)
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  # S3 Bucket (Simplified for LocalStack)
  FitnessAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: 'fitness-assets-cfn'
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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  # Cognito User Pool (Simplified for LocalStack)
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
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: false

  FitnessUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub '${AWS::StackName}-AppClient'
      UserPoolId: !Ref FitnessUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_SRP_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
      GenerateSecret: false

  # SNS Topic
  AchievementTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Achievements'
      DisplayName: 'Fitness Achievement Notifications'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

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
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  # Lambda Functions (Removed VPC config and Redis references for LocalStack)
  WorkoutProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-WorkoutProcessing'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          USER_PROFILES_TABLE: !Ref UserProfilesTable
          WORKOUT_HISTORY_TABLE: !Ref WorkoutHistoryTable
          ACHIEVEMENT_TOPIC_ARN: !Ref AchievementTopic
          ASSETS_BUCKET: !Ref FitnessAssetsBucket
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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

  LeaderboardFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-Leaderboard'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          WORKOUT_HISTORY_TABLE: !Ref WorkoutHistoryTable
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
              
              # Placeholder response
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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: FitnessTracker

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
          Value: !Ref EnvironmentSuffix
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

  # CloudWatch Alarms (Basic for LocalStack)
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

  UserProfilesTableName:
    Description: 'DynamoDB User Profiles Table Name'
    Value: !Ref UserProfilesTable
    Export:
      Name: !Sub '${AWS::StackName}-UserProfilesTable'

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

  CognitoUserPoolClientId:
    Description: 'Cognito User Pool Client ID'
    Value: !Ref FitnessUserPoolClient
    Export:
      Name: !Sub '${AWS::StackName}-UserPoolClientId'

  SNSTopicArn:
    Description: 'SNS Topic ARN for achievement notifications'
    Value: !Ref AchievementTopic
    Export:
      Name: !Sub '${AWS::StackName}-AchievementTopicArn'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref FitnessVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref FitnessKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'