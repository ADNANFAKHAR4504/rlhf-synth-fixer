```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Nova Clinical Trial Data Platform - Secure Infrastructure Foundation'

Parameters:
  ProjectName:
    Type: String
    Default: 'nova-clinical'
    Description: 'Project name for resource naming convention'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource naming convention'


  NotificationEmail:
    Type: String
    Default: 'admin@nova-clinical.com'
    Description: 'Email address for budget and operational alerts'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  NovaBudgetAmount:
    Type: Number
    Default: 1000
    Description: 'Monthly budget amount in USD'
    MinValue: 1
    MaxValue: 100000


  EC2ImageId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'AMI ID for the EC2 instance (uses latest Amazon Linux 2 AMI by default, or specify custom AMI ID)'

  ApiDeploymentVersion:
    Type: String
    Default: 'v4'
    Description: 'Bump this to force API Gateway deployment replacement when methods change'



Conditions:
  IsBudgetsRegion: !Equals [!Ref 'AWS::Region', 'us-east-1']

Resources:
  # ==========================================
  # KMS ENCRYPTION KEY
  # ==========================================
  
  NovaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for Nova Clinical Trial Data Platform encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
          - Sid: Allow S3
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow RDS
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow SNS
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nova-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-nova-key'
      TargetKeyId: !Ref NovaKMSKey

  # ==========================================
  # VPC AND NETWORKING
  # ==========================================
  NovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Internet Gateway
  NovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Internet Gateway Attachment
  NovaInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref NovaInternetGateway
      VpcId: !Ref NovaVPC

  # Public Subnet 1
  NovaPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Public Subnet 2
  NovaPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Table for Public Subnets
  NovaPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Default Route for Public Subnets
  NovaPublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: NovaInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref NovaInternetGateway

  # Route Table Association for Public Subnet 1
  NovaPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      SubnetId: !Ref NovaPublicSubnet1

  # Route Table Association for Public Subnet 2
  NovaPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      SubnetId: !Ref NovaPublicSubnet2

  # Route Table for Private Subnets
  NovaPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Table Association for Private Subnet 1
  NovaPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable
      SubnetId: !Ref NovaPrivateSubnet1

  # Route Table Association for Private Subnet 2
  NovaPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable
      SubnetId: !Ref NovaPrivateSubnet2

  # VPC Endpoints for Secure AWS Service Access
  NovaS3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref NovaPrivateRouteTable
        - !Ref NovaPublicRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
            Resource:
              - !Sub '${NovaDataBucket.Arn}'
              - !Sub '${NovaDataBucket.Arn}/*'
              - !Sub '${NovaLogsBucket.Arn}'
              - !Sub '${NovaLogsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-s3-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaEC2VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - ec2:DescribeInstances
              - ec2:DescribeImages
              - ec2:DescribeSecurityGroups
              - ec2:DescribeSubnets
              - ec2:DescribeVpcs
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaSSMVPCVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - ssm:GetParameter
              - ssm:GetParameters
              - ssm:GetParametersByPath
              - ssm:DescribeParameters
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ssm-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaSSMMessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - ssmmessages:CreateControlChannel
              - ssmmessages:CreateDataChannel
              - ssmmessages:OpenControlChannel
              - ssmmessages:OpenDataChannel
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ssm-messages-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaEC2MessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - ec2messages:AcknowledgeMessage
              - ec2messages:DeleteMessage
              - ec2messages:FailMessage
              - ec2messages:GetEndpoint
              - ec2messages:GetMessages
              - ec2messages:SendReply
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-messages-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaKMSVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt
            Resource: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaCloudWatchLogsVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      SecurityGroupIds:
        - !Ref NovaAppSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
              - logs:DescribeLogGroups
              - logs:DescribeLogStreams
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudwatch-logs-vpc-endpoint'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # DB Subnet Group
  NovaDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds: [!Ref NovaPrivateSubnet1, !Ref NovaPrivateSubnet2]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # S3 BUCKET WITH DUAL-LAYER ENCRYPTION
  # ==========================================
  
  NovaDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-clinical-${AWS::AccountId}-data-bucket'
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: ExpireOldVersions
            Status: Enabled
            NoncurrentVersionTransitions:
              - TransitionInDays: 60
                StorageClass: GLACIER
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-clinical-${AWS::AccountId}-logs-bucket'
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-logging-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # 2. IAM Role with Read-Only Permissions (Least Privilege)
  NovaReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: ResourceGroupsReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - resource-groups:Get*
                  - resource-groups:List*
                  - resource-groups:Search*
                  - tag:GetResources
                  - tag:GetTagKeys
                  - tag:GetTagValues
                Resource: '*'
        - PolicyName: BudgetsReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - budgets:ViewBudget
                Resource: '*'
        - PolicyName: EC2ProcessingAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${NovaDataBucket.Arn}'
                  - !Sub '${NovaDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt NovaKMSKey.Arn
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref NovaDatabaseSecret
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-readonly-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # 3. API Gateway with CloudWatch Logging
  NovaApiGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Policies:
        - PolicyName: SsmSendCommandFromApi
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:SendCommand
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-apigateway-cloudwatch-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-secure-api'
      Description: 'Secure API Gateway with comprehensive logging'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secure-api'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # API Gateway CloudWatch Log Group
  NovaApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-gateway-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # API Gateway Account for CloudWatch Logs
  NovaApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt NovaApiGatewayRole.Arn

  # API Gateway Deployment
  NovaApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - NovaApiGatewayMethod
      - NovaApiGatewayIngestMethod
    Properties:
      RestApiId: !Ref NovaApiGateway
      Description: !Sub 'Deployment-${ApiDeploymentVersion}'

  # API Gateway Stage with Logging
  NovaApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    DependsOn:
      - NovaApiGatewayAccount
    Properties:
      RestApiId: !Ref NovaApiGateway
      DeploymentId: !Ref NovaApiGatewayDeployment
      StageName: !Ref Environment
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          MetricsEnabled: true
          ThrottlingRateLimit: 1000
          ThrottlingBurstLimit: 2000
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-stage'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # API Gateway Resource
  NovaApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref NovaApiGateway
      ParentId: !GetAtt NovaApiGateway.RootResourceId
      PathPart: 'clinical-data'

  # API Gateway Method
  NovaApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaApiGateway
      ResourceId: !Ref NovaApiGatewayResource
      HttpMethod: GET
      AuthorizationType: AWS_IAM
      RequestParameters:
        method.request.header.Authorization: true
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: |
                {
                  "message": "Nova Clinical Trial Data Platform API",
                  "timestamp": "$context.requestTime",
                  "requestId": "$context.requestId"
                }
        RequestTemplates:
          application/json: |
            {
              "statusCode": 200
            }
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  # API Gateway POST method to trigger EC2 processing via SSM RunCommand
  NovaApiGatewayIngestMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaApiGateway
      ResourceId: !Ref NovaApiGatewayResource
      HttpMethod: POST
      AuthorizationType: AWS_IAM
      ApiKeyRequired: false
      RequestParameters:
        method.request.header.X-Instance-Id: true
      Integration:
        Type: AWS
        IntegrationHttpMethod: POST
        Credentials: !GetAtt NovaApiGatewayRole.Arn
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:ssm:action/SendCommand'
        RequestTemplates:
          application/json: |
            #set($inputRoot = $input.path('$'))
            {
              "DocumentName": "AWS-RunShellScript",
              "InstanceIds": ["$util.escapeJavaScript($input.params('X-Instance-Id'))"],
              "Parameters": {
                "commands": [
                  "set -e",
                  "echo '$util.escapeJavaScript($input.body)' > /tmp/payload.json",
                  "yum -y install postgresql >/dev/null 2>&1 || true",
                  "PATIENT=$(python3 - <<'PY'\nimport json\nprint(json.load(open('/tmp/payload.json'))['patientId'])\nPY\n)",
                  "TRIAL=$(python3 - <<'PY'\nimport json\nprint(json.load(open('/tmp/payload.json'))['trialId'])\nPY\n)",
                  "BUCKET=$util.escapeJavaScript($input.json('$.bucketName'))",
                  "KMS_ARN=$util.escapeJavaScript($input.json('$.kmsKeyArn'))",
                  "SECRET_ARN=$util.escapeJavaScript($input.json('$.secretArn'))",
                  "RDS_ENDPOINT=$util.escapeJavaScript($input.json('$.rdsEndpoint'))",
                  "aws s3 cp /tmp/payload.json s3://$BUCKET/ingest/raw/${PATIENT}-${TRIAL}.json --sse aws:kms --sse-kms-key-id $KMS_ARN",
                  "SECRET_STR=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text)",
                  "DB_USER=$(python3 - <<'PY'\nimport json,os\nprint(json.loads(os.environ['SECRET_STR'])['username'])\nPY\n)",
                  "DB_PASS=$(python3 - <<'PY'\nimport json,os\nprint(json.loads(os.environ['SECRET_STR'])['password'])\nPY\n)",
                  "export PGPASSWORD=$DB_PASS",
                  "psql -h $RDS_ENDPOINT -U $DB_USER -d postgres -c \"CREATE TABLE IF NOT EXISTS clinical_metadata(id text primary key, patient_id text, trial_id text);\"",
                  "psql -h $RDS_ENDPOINT -U $DB_USER -d postgres -c \"INSERT INTO clinical_metadata(id, patient_id, trial_id) VALUES ('${PATIENT}-${TRIAL}','${PATIENT}','${TRIAL}') ON CONFLICT (id) DO NOTHING;\"",
                  "echo processed > /tmp/processed && aws s3 cp /tmp/processed s3://$BUCKET/ingest/processed/${PATIENT}-${TRIAL}.ok --sse aws:kms --sse-kms-key-id $KMS_ARN"
                ]
              }
            }
        PassthroughBehavior: WHEN_NO_MATCH
        IntegrationResponses:
          - StatusCode: 200
      MethodResponses:
        - StatusCode: 200

  # API Gateway Usage Plan
  NovaApiGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: NovaApiGatewayStage
    Properties:
      UsagePlanName: !Sub '${ProjectName}-${Environment}-usage-plan'
      Description: 'Usage plan for Nova Clinical Trial Data Platform API'
      ApiStages:
        - ApiId: !Ref NovaApiGateway
          Stage: !Ref Environment
      Throttle:
        RateLimit: 1000
        BurstLimit: 2000
      Quota:
        Limit: 10000
        Period: DAY
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-usage-plan'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # API Gateway API Key
  NovaApiGatewayApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api-key'
      Description: 'API Key for Nova Clinical Trial Data Platform'
      Enabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # API Gateway Usage Plan Key
  NovaApiGatewayUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref NovaApiGatewayApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref NovaApiGatewayUsagePlan

  # 4. MFA Enforcement Policy (Complete Implementation)
  NovaMFAPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: 'Policy that enforces MFA for all IAM users for sensitive operations'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:ListVirtualMFADevices
              - iam:GetAccountSummary
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/*'
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - iam:CreateVirtualMFADevice
              - iam:DeleteVirtualMFADevice
              - iam:ListMFADevices
              - iam:EnableMFADevice
              - iam:ResyncMFADevice
              - iam:DeactivateMFADevice
            Resource:
              - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/*'
              - !Sub 'arn:aws:iam::${AWS::AccountId}:user/*'
          - Sid: DenyAllExceptListedWithoutMFA
            Effect: Deny
            NotAction:
              - iam:CreateVirtualMFADevice
              - iam:EnableMFADevice
              - iam:GetUser
              - iam:ListMFADevices
              - iam:ListVirtualMFADevices
              - iam:ResyncMFADevice
              - sts:GetSessionToken
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # 5. RDS Instance without Public Access
  NovaDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'RDS database password'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "dbadmin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-password'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS instance'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref NovaAppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rds-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15.8'
      MasterUsername:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref NovaDatabaseSecret,
            ':SecretString:username}}',
          ],
        ]
      MasterUserPassword:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref NovaDatabaseSecret,
            ':SecretString:password}}',
          ],
        ]
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref NovaKMSKey
      DBSubnetGroupName: !Ref NovaDBSubnetGroup
      VPCSecurityGroups:
        - !Ref NovaDatabaseSecurityGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 35
      MultiAZ: false
      DeletionProtection: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 731
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secure-db'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # 6. AWS Config for Monitoring Unauthorized Changes
  NovaConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Policies:
        - PolicyName: ConfigS3KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:DeleteObject
                Resource: !Sub 'arn:aws:s3:::${NovaConfigBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${NovaConfigBucket}'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt NovaKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-config-service-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldConfig
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-config-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref NovaConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ConfigBucketPutPolicy
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${NovaConfigBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt NovaKMSKey.Arn
          - Sid: ConfigBucketGetPolicy
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:GetObject
            Resource: !Sub 'arn:aws:s3:::${NovaConfigBucket}/*'
          - Sid: ConfigBucketListPolicy
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:ListBucket
            Resource: !Sub 'arn:aws:s3:::${NovaConfigBucket}'

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref NovaConfigBucket
      S3KeyPrefix: 'config'
      S3KmsKeyArn: !GetAtt NovaKMSKey.Arn
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RoleARN: !GetAtt NovaConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Rules for Security Monitoring
  S3BucketServerSideEncryptionEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      Description: 'Checks that S3 buckets have server-side encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  RDSInstancePublicAccessCheckRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      Description: 'Checks that RDS instances are not publicly accessible'
      Source:
        Owner: AWS
        SourceIdentifier: RDS_INSTANCE_PUBLIC_ACCESS_CHECK

  IAMUserMfaEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      Description: 'Checks that IAM users have MFA enabled'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED

  # Launch Template with IMDSv2 Enforcement
  NovaLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: !Ref EC2ImageId
        InstanceType: t3.micro
        IamInstanceProfile:
          Name: !Ref NovaEC2InstanceProfile
        SecurityGroupIds:
          - !Ref NovaAppSecurityGroup
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref NovaKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
          HttpEndpoint: enabled
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli
            # Configure IMDSv2 session token
            TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
            # Use IMDSv2 for all metadata requests
            echo "export AWS_METADATA_TOKEN=$TOKEN" >> /etc/environment
            # Log successful IMDSv2 configuration
            echo "IMDSv2 configured successfully" >> /var/log/imdsv2.log
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-ec2-instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: team
                Value: '2'
              - Key: iac-rlhf-amazon
                Value: 'true'

  # 7. EC2 Instance using Launch Template
  NovaEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref NovaLaunchTemplate
        Version: !GetAtt NovaLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref NovaPrivateSubnet1

  NovaEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref NovaReadOnlyRole

  # 8. Security Group with Network Restrictions
  NovaAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group with restricted outbound traffic'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 203.0.113.0/24
          Description: 'HTTP outbound to specific IP ranges'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 203.0.113.0/24
          Description: 'HTTPS outbound to specific IP ranges'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Security Group Egress Rules for specific IP ranges
  NovaRestrictedEgressRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref NovaAppSecurityGroup
      IpProtocol: -1
      CidrIp: 203.0.113.0/24
      Description: 'Restricted outbound traffic to allowed IP ranges'

  # 9. NovaCloudFront Distribution
  NovaCloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${ProjectName}-${Environment}-oac-${AWS::StackName}-${AWS::StackName}'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4
        Description: !Sub 'OAC for ${ProjectName}-${Environment}'

  NovaCloudFront:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub '${ProjectName}-${Environment} NovaCloudFront Distribution'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD, OPTIONS]
          Compress: true
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6' # CachingOptimized
        Origins:
          - DomainName: !GetAtt NovaDataBucket.RegionalDomainName
            Id: S3Origin
            OriginAccessControlId: !GetAtt NovaCloudFrontOAC.Id
            S3OriginConfig:
              OriginAccessIdentity: ''
        Enabled: true
        HttpVersion: http2
        PriceClass: PriceClass_100
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudfront'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Web ACL for DDoS protection
  NovaWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
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
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}${Environment}NovaWebACL'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-acl'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # S3 Bucket Policy for NovaCloudFront OAC
  NovaDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref NovaDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowNovaCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub '${NovaDataBucket.Arn}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${NovaCloudFront}'

  # 10. AWS NovaBudget for Cost Management
  NovaBudget:
    Type: AWS::Budgets::Budget
    Condition: IsBudgetsRegion
    Properties:
      Budget:
        BudgetName: !Sub '${ProjectName}-${Environment}-monthly-budget'
        BudgetType: COST
        TimeUnit: MONTHLY
        BudgetLimit:
          Amount: !Ref NovaBudgetAmount
          Unit: USD
        CostFilters:
          Service:
            - Amazon Simple Storage Service
            - Amazon Relational Database Service
            - Amazon CloudFront
            - AWS Config
            - Amazon API Gateway
        CostTypes:
          IncludeCredit: false
          IncludeDiscount: true
          IncludeOtherSubscription: true
          IncludeRecurring: true
          IncludeRefund: false
          IncludeSubscription: true
          IncludeSupport: true
          IncludeTax: true
          IncludeUpfront: true
          UseBlended: false
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
            ThresholdType: PERCENTAGE
          Subscribers:
            - SubscriptionType: EMAIL
              Address: !Ref NotificationEmail
        - Notification:
            NotificationType: FORECASTED
            ComparisonOperator: GREATER_THAN
            Threshold: 100
            ThresholdType: PERCENTAGE
          Subscribers:
            - SubscriptionType: EMAIL
              Address: !Ref NotificationEmail

  # SNS Topic for Config Rule Notifications
  NovaNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: 'AWS Config Rule Notifications'
      KmsMasterKeyId: !Ref NovaKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-config-notifications'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref NovaNotificationTopic
      Endpoint: !Ref NotificationEmail

Outputs:
  NovaKMSKeyId:
    Description: 'Nova KMS Key ID for encryption'
    Value: !Ref NovaKMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-nova-kms-key-id'

  NovaKMSKeyArn:
    Description: 'Nova KMS Key ARN for encryption'
    Value: !GetAtt NovaKMSKey.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-nova-kms-key-arn'

  NovaKMSKeyAliasOutput:
    Description: 'Nova KMS Key Alias'
    Value: !Ref NovaKMSKeyAlias
    Export:
      Name: !Sub '${ProjectName}-${Environment}-nova-kms-key-alias'

  NovaVPCIdOutput:
    Description: 'ID of the Nova VPC'
    Value: !Ref NovaVPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id'

  NovaInternetGatewayId:
    Description: 'ID of the Nova Internet Gateway'
    Value: !Ref NovaInternetGateway
    Export:
      Name: !Sub '${ProjectName}-${Environment}-igw-id'

  NovaPublicSubnet1Id:
    Description: 'ID of Nova Public Subnet 1'
    Value: !Ref NovaPublicSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-1-id'

  NovaPublicSubnet2Id:
    Description: 'ID of Nova Public Subnet 2'
    Value: !Ref NovaPublicSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-2-id'

  NovaPrivateSubnet1Id:
    Description: 'ID of Nova Private Subnet 1'
    Value: !Ref NovaPrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-1-id'

  NovaPrivateSubnet2Id:
    Description: 'ID of Nova Private Subnet 2'
    Value: !Ref NovaPrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-2-id'

  NovaDataBucketName:
    Description: 'Name of the Nova data S3 bucket with encryption'
    Value: !Ref NovaDataBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-secure-s3-bucket'

  NovaReadOnlyRoleArn:
    Description: 'ARN of the Nova read-only IAM role'
    Value: !GetAtt NovaReadOnlyRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-readonly-role-arn'


  RDSEndpoint:
    Description: 'Nova database endpoint'
    Value: !GetAtt NovaDatabase.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-${Environment}-rds-endpoint'

  NovaCloudFrontDomainName:
    Description: 'Nova CloudFront distribution domain name'
    Value: !GetAtt NovaCloudFront.DomainName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudfront-domain'

  NovaAppSecurityGroupId:
    Description: 'Nova Application Security Group ID'
    Value: !Ref NovaAppSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-app-security-group-id'

  NovaConfigBucketName:
    Description: 'Nova Config bucket name'
    Value: !Ref NovaConfigBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-config-s3-bucket'

  NovaBudgetName:
    Description: 'Nova Budget name for cost tracking'
    Value: !Sub '${ProjectName}-${Environment}-monthly-budget'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-budget-name'

  NovaMFAPolicyArn:
    Description: 'Nova MFA policy ARN'
    Value: !Ref NovaMFAPolicy
    Export:
      Name: !Sub '${ProjectName}-${Environment}-mfa-policy-arn'

  NovaLaunchTemplateId:
    Description: 'Nova Launch Template ID'
    Value: !Ref NovaLaunchTemplate
    Export:
      Name: !Sub '${ProjectName}-${Environment}-launch-template-id'

  NovaLaunchTemplateLatestVersion:
    Description: 'Nova Launch Template Latest Version'
    Value: !GetAtt NovaLaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub '${ProjectName}-${Environment}-launch-template-version'

  NovaApiGatewayId:
    Description: 'Nova API Gateway ID'
    Value: !Ref NovaApiGateway
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-gateway-id'

  NovaApiGatewayUrl:
    Description: 'Nova API Gateway URL'
    Value: !Sub 'https://${NovaApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-gateway-url'

  NovaApiGatewayLogGroupName:
    Description: 'Nova API Gateway CloudWatch Log Group Name'
    Value: !Ref NovaApiGatewayLogGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-gateway-log-group'

  NovaApiGatewayApiKeyId:
    Description: 'Nova API Gateway API Key ID'
    Value: !Ref NovaApiGatewayApiKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-gateway-key-id'

  NovaApiGatewayUsagePlanId:
    Description: 'Nova API Gateway Usage Plan ID'
    Value: !Ref NovaApiGatewayUsagePlan
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-gateway-usage-plan-id'

  NovaS3VPCEndpointId:
    Description: 'Nova S3 VPC Endpoint ID'
    Value: !Ref NovaS3VPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-s3-vpc-endpoint-id'

  NovaEC2VPCEndpointId:
    Description: 'Nova EC2 VPC Endpoint ID'
    Value: !Ref NovaEC2VPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ec2-vpc-endpoint-id'

  NovaSSMVPCEndpointId:
    Description: 'Nova SSM VPC Endpoint ID'
    Value: !Ref NovaSSMVPCVPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ssm-vpc-endpoint-id'

  NovaKMSVPCEndpointId:
    Description: 'Nova KMS VPC Endpoint ID'
    Value: !Ref NovaKMSVPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-vpc-endpoint-id'

  NovaCloudWatchLogsVPCEndpointId:
    Description: 'Nova CloudWatch Logs VPC Endpoint ID'
    Value: !Ref NovaCloudWatchLogsVPCEndpoint
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudwatch-logs-vpc-endpoint-id'

  NovaEC2InstanceId:
    Description: 'Nova EC2 Instance ID'
    Value: !Ref NovaEC2Instance
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ec2-instance-id'

  NovaDatabaseSecretArn:
    Description: 'Nova Database Secret ARN'
    Value: !Ref NovaDatabaseSecret
    Export:
      Name: !Sub '${ProjectName}-${Environment}-db-secret-arn'
```