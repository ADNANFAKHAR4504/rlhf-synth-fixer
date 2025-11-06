```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Secure and scalable serverless infrastructure with SAM

# Template Parameters
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name for the deployment
  
  ProjectName:
    Type: String
    Default: secureserverlessapp
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens
    Description: Project name for resource naming and tagging (lowercase only)
  
  GitHubOwner:
    Type: String
    Default: your-github-username
    Description: GitHub username or organization name

  GitHubRepo:
    Type: String
    Default: your-github-repo
    Description: GitHub repository name for CI/CD

  GitHubBranch:
    Type: String
    Default: main
    Description: GitHub branch for CI/CD

  CodeStarConnectionArn:
    Type: String
    Default: ''
    Description: ARN of the CodeStar Connection for GitHub (create this manually in AWS Console first, or leave empty to skip CI/CD pipeline)

# Conditions
Conditions:
  CreatePipeline: !Not [!Equals [!Ref CodeStarConnectionArn, '']]

# Global Configuration for Lambda Functions
Globals:
  Function:
    Runtime: python3.9
    Timeout: 15
    MemorySize: 512
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        PROJECT_NAME: !Ref ProjectName
        TABLE_NAME: !Ref UserDataTable
    Tracing: Active  # Enable X-Ray tracing
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
    Tags:
      Environment: !Ref Environment
      ProjectName: !Ref ProjectName

Resources:
  # ==================== DynamoDB Table ====================
  UserDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${Environment}-UserData'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: alias/aws/dynamodb
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # DynamoDB Auto Scaling Role
  DynamoDBAutoScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DynamoDBAutoScalingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeTable
                  - dynamodb:UpdateTable
                  - cloudwatch:PutMetricAlarm
                  - cloudwatch:DescribeAlarms
                  - cloudwatch:GetMetricStatistics
                  - cloudwatch:SetAlarmState
                  - cloudwatch:DeleteAlarms
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # Read Capacity Auto Scaling
  UserTableReadCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 20
      MinCapacity: 5
      ResourceId: !Sub 'table/${UserDataTable}'
      RoleARN: !GetAtt DynamoDBAutoScalingRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  UserTableReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${Environment}-ReadAutoScaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref UserTableReadCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization

  # Write Capacity Auto Scaling
  UserTableWriteCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 20
      MinCapacity: 5
      ResourceId: !Sub 'table/${UserDataTable}'
      RoleARN: !GetAtt DynamoDBAutoScalingRole.Arn
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  UserTableWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${Environment}-WriteAutoScaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref UserTableWriteCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization

  # ==================== Systems Manager Parameter Store ====================
  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/database/endpoint'
      Type: String
      Value: !GetAtt UserDataTable.Arn
      Description: DynamoDB table ARN
      Tags:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName

  ApiKeyParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/api/key'
      Type: String
      Value: !Sub '${AWS::StackName}-api-key-${AWS::AccountId}'
      Description: API Key for authentication (use AWS Secrets Manager for production secrets)
      Tags:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName

  # ==================== Lambda IAM Role ====================
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
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource:
                  - !GetAtt UserDataTable.Arn
                  - !Sub '${UserDataTable.Arn}/index/*'
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/ssm'
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # ==================== Lambda Functions ====================
  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-GetUser'
      InlineCode: |
        import json
        import boto3
        import os
        from decimal import Decimal

        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        def lambda_handler(event, context):
            try:
                user_id = event['pathParameters']['userId']
                response = table.get_item(Key={'userId': user_id})

                if 'Item' in response:
                    return {
                        'statusCode': 200,
                        'body': json.dumps(response['Item'], default=str),
                        'headers': {'Content-Type': 'application/json'}
                    }
                else:
                    return {
                        'statusCode': 404,
                        'body': json.dumps({'message': 'User not found'}),
                        'headers': {'Content-Type': 'application/json'}
                    }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)}),
                    'headers': {'Content-Type': 'application/json'}
                }
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Events:
        GetUserApi:
          Type: Api
          Properties:
            RestApiId: !Ref PublicApi
            Path: /users/{userId}
            Method: GET
      Environment:
        Variables:
          SSM_PARAMETER_PREFIX: !Sub '/${ProjectName}/${Environment}'

  CreateUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-CreateUser'
      InlineCode: |
        import json
        import boto3
        import os
        from datetime import datetime

        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        def lambda_handler(event, context):
            try:
                body = json.loads(event['body'])
                user_id = body.get('userId')

                if not user_id:
                    return {
                        'statusCode': 400,
                        'body': json.dumps({'error': 'userId is required'}),
                        'headers': {'Content-Type': 'application/json'}
                    }

                item = {
                    'userId': user_id,
                    'timestamp': int(datetime.now().timestamp()),
                    **body
                }

                table.put_item(Item=item)

                return {
                    'statusCode': 201,
                    'body': json.dumps({'message': 'User created successfully', 'userId': user_id}),
                    'headers': {'Content-Type': 'application/json'}
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)}),
                    'headers': {'Content-Type': 'application/json'}
                }
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Events:
        CreateUserApi:
          Type: Api
          Properties:
            RestApiId: !Ref PublicApi
            Path: /users
            Method: POST

  ProcessDataFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-ProcessData'
      InlineCode: |
        import json
        import boto3
        import os

        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        def lambda_handler(event, context):
            try:
                body = json.loads(event['body'])

                # Process data logic here
                processed_result = {
                    'status': 'processed',
                    'data': body,
                    'message': 'Data processed successfully'
                }

                return {
                    'statusCode': 200,
                    'body': json.dumps(processed_result),
                    'headers': {'Content-Type': 'application/json'}
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)}),
                    'headers': {'Content-Type': 'application/json'}
                }
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Events:
        ProcessDataApi:
          Type: Api
          Properties:
            RestApiId: !Ref PrivateApi
            Path: /process
            Method: POST

  # ==================== API Gateway ====================
  # Public API
  PublicApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-PublicAPI'
      StageName: !Ref Environment
      TracingEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt ApiLogGroup.Arn
        Format: '$context.requestId $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.httpMethod $context.resourcePath $context.status'
      Cors:
        AllowMethods: "'GET, POST, PUT, DELETE, OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
      Auth:
        ApiKeyRequired: true
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName

  # API Key for Public API (SAM creates the stage automatically)
  PublicApiKey:
    Type: AWS::ApiGateway::ApiKey
    DependsOn: PublicApiStage
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-ApiKey'
      Description: API Key for Public API access
      Enabled: true
      StageKeys:
        - RestApiId: !Ref PublicApi
          StageName: !Ref Environment

  # Usage Plan
  PublicApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: PublicApiStage
    Properties:
      UsagePlanName: !Sub '${ProjectName}-${Environment}-UsagePlan'
      Description: Usage plan for Public API
      ApiStages:
        - ApiId: !Ref PublicApi
          Stage: !Ref Environment
      Throttle:
        BurstLimit: 100
        RateLimit: 50
      Quota:
        Limit: 10000
        Period: DAY

  # Link API Key to Usage Plan
  PublicApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref PublicApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref PublicApiUsagePlan

  # Private API
  PrivateApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-PrivateAPI'
      StageName: !Ref Environment
      TracingEnabled: true
      EndpointConfiguration:
        Type: PRIVATE
        VPCEndpointIds:
          - !Ref VPCEndpoint
      Auth:
        ResourcePolicy:
          CustomStatements:
            - Effect: Allow
              Principal: '*'
              Action: 'execute-api:Invoke'
              Resource: '*'
              Condition:
                StringEquals:
                  aws:SourceVpce: !Ref VPCEndpoint
      Tags:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName

  # VPC Endpoint for Private API
  VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcEndpointType: Interface
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.execute-api'
      VpcId: !Ref VPC
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # ==================== VPC Resources (Simplified) ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

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

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS outbound for AWS service access
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-LambdaSG'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoint
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow HTTPS from Lambda functions
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # ==================== AWS WAF ====================
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-WebACL'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        # SQL Injection Protection
        - Name: SQLInjectionRule
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLInjectionRule
        # XSS Protection
        - Name: XSSProtectionRule
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: XSSProtectionRule
        # Rate Limiting
        - Name: RateLimitRule
          Priority: 3
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        # Core Rule Set
        - Name: CoreRuleSet
          Priority: 4
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CoreRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-${Environment}-WebACL'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # Associate WAF with API Gateway
  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    DependsOn: PublicApiStage
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${PublicApi}/stages/${Environment}'
      WebACLArn: !GetAtt WAFWebACL.Arn

  # ==================== CloudWatch Log Groups ====================
  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: 30

  # ==================== CI/CD Pipeline ====================
  # S3 Bucket for Pipeline Artifacts
  PipelineArtifactStore:
    Type: AWS::S3::Bucket
    Condition: CreatePipeline
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-pipeline-artifacts-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # CodeBuild Project
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Condition: CreatePipeline
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-Build'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: ENVIRONMENT
            Value: !Ref Environment
          - Name: PROJECT_NAME
            Value: !Ref ProjectName
          - Name: BUCKET_NAME
            Value: !Ref PipelineArtifactStore
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                python: 3.9
              commands:
                - pip install --upgrade aws-sam-cli
            build:
              commands:
                - sam build
                - sam package --s3-bucket $BUCKET_NAME --output-template-file packaged.yaml
          artifacts:
            files:
              - packaged.yaml
              - '**/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # CodeBuild IAM Role
  CodeBuildRole:
    Type: AWS::IAM::Role
    Condition: CreatePipeline
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub '${PipelineArtifactStore.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # CodePipeline
  DeploymentPipeline:
    Type: AWS::CodePipeline::Pipeline
    Condition: CreatePipeline
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-Pipeline'
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref PipelineArtifactStore
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: '1'
              Configuration:
                ConnectionArn: !Ref CodeStarConnectionArn
                FullRepositoryId: !Sub '${GitHubOwner}/${GitHubRepo}'
                BranchName: !Ref GitHubBranch
                OutputArtifactFormat: CODE_ZIP
              OutputArtifacts:
                - Name: SourceOutput
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub '${ProjectName}-${Environment}-Stack'
                TemplatePath: BuildOutput::packaged.yaml
                Capabilities: CAPABILITY_IAM,CAPABILITY_AUTO_EXPAND
                RoleArn: !GetAtt CloudFormationRole.Arn
              InputArtifacts:
                - Name: BuildOutput
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # CodePipeline IAM Role
  CodePipelineRole:
    Type: AWS::IAM::Role
    Condition: CreatePipeline
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub '${PipelineArtifactStore.Arn}/*'
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn
              - Effect: Allow
                Action:
                  - cloudformation:*
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource: !GetAtt CloudFormationRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # CloudFormation Execution Role
  CloudFormationRole:
    Type: AWS::IAM::Role
    Condition: CreatePipeline
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName

  # ==================== CloudWatch Alarms ====================
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-LambdaErrors'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  APIGateway4XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-API-4XX-Errors'
      AlarmDescription: Alert on API Gateway 4XX errors
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-${Environment}-PublicAPI'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-DynamoDB-Throttles'
      AlarmDescription: Alert on DynamoDB throttling
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Dimensions:
        - Name: TableName
          Value: !Ref UserDataTable
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold

# Outputs
Outputs:
  PublicApiUrl:
    Description: URL of the public API
    Value: !Sub 'https://${PublicApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PublicApiUrl'

  PrivateApiUrl:
    Description: URL of the private API
    Value: !Sub 'https://${PrivateApi}-vpce-${VPCEndpoint}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateApiUrl'

  UserDataTableName:
    Description: Name of the DynamoDB table
    Value: !Ref UserDataTable
    Export:
      Name: !Sub '${ProjectName}-${Environment}-TableName'

  PipelineUrl:
    Condition: CreatePipeline
    Description: URL of the CodePipeline
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${DeploymentPipeline}/view'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PipelineUrl'

  PublicApiKey:
    Description: API Key ID for Public API
    Value: !Ref PublicApiKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PublicApiKeyId'

  GetUserFunctionName:
    Description: Name of the GetUser Lambda function
    Value: !Ref GetUserFunction
    Export:
      Name: !Sub '${ProjectName}-${Environment}-GetUserFunctionName'

  CreateUserFunctionName:
    Description: Name of the CreateUser Lambda function
    Value: !Ref CreateUserFunction
    Export:
      Name: !Sub '${ProjectName}-${Environment}-CreateUserFunctionName'

  ProcessDataFunctionName:
    Description: Name of the ProcessData Lambda function
    Value: !Ref ProcessDataFunction
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ProcessDataFunctionName'

  GetUserFunctionArn:
    Description: ARN of the GetUser Lambda function
    Value: !GetAtt GetUserFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-GetUserFunctionArn'

  CreateUserFunctionArn:
    Description: ARN of the CreateUser Lambda function
    Value: !GetAtt CreateUserFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-CreateUserFunctionArn'

  ProcessDataFunctionArn:
    Description: ARN of the ProcessData Lambda function
    Value: !GetAtt ProcessDataFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ProcessDataFunctionArn'

  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPCId'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateSubnet2Id'

  LambdaSecurityGroupId:
    Description: Lambda Security Group ID
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-LambdaSecurityGroupId'

  VPCEndpointId:
    Description: VPC Endpoint ID for Private API
    Value: !Ref VPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPCEndpointId'

  WAFWebACLArn:
    Description: ARN of the WAF Web ACL
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-WAFWebACLArn'

  WAFWebACLId:
    Description: ID of the WAF Web ACL
    Value: !GetAtt WAFWebACL.Id
    Export:
      Name: !Sub '${ProjectName}-${Environment}-WAFWebACLId'

  ApiLogGroupName:
    Description: CloudWatch Log Group name for API Gateway
    Value: !Ref ApiLogGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ApiLogGroupName'

  DatabaseEndpointParameterName:
    Description: SSM Parameter name for database endpoint
    Value: !Ref DatabaseEndpointParameter
    Export:
      Name: !Sub '${ProjectName}-${Environment}-DatabaseEndpointParameterName'

  ApiKeyParameterName:
    Description: SSM Parameter name for API key
    Value: !Ref ApiKeyParameter
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ApiKeyParameterName'

  UserDataTableArn:
    Description: ARN of the DynamoDB table
    Value: !GetAtt UserDataTable.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-TableArn'

  UserDataTableStreamArn:
    Description: Stream ARN of the DynamoDB table
    Value: !GetAtt UserDataTable.StreamArn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-TableStreamArn'

  LambdaExecutionRoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-LambdaExecutionRoleArn'

  PipelineArtifactStoreBucket:
    Condition: CreatePipeline
    Description: S3 Bucket for pipeline artifacts
    Value: !Ref PipelineArtifactStore
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PipelineArtifactStoreBucket'

  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-StackName'

  Region:
    Description: AWS Region where the stack is deployed
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Region'
```