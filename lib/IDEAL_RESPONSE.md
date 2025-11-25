```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready web application infrastructure with auto-scaling, monitoring, and high availability'

# ==========================================
# Metadata Section
# ==========================================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - EnvironmentName
          - OwnerEmail
      - Label:
          default: "Network Configuration"
        Parameters:
          - AllowedSSHIP
          - EnableNATGateway
      - Label:
          default: "Compute Configuration"
        Parameters:
          - KeyPairName
          - InstanceType
          - MinSize
          - MaxSize
          - DesiredCapacity
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBMasterUsername
          - DBAllocatedStorage
          - PostgreSQLVersion
          - EnableMultiAZ
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - EnableDetailedMonitoring
          - AlertEmail

# ==========================================
# Parameters Section
# ==========================================
Parameters:
  ProjectName:
    Type: String
    Default: 'StartupPlatform'
    Description: 'Name of the project'
    MinLength: 1
    MaxLength: 50
    
  EnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Environment name (Production, Staging, Development)'
    AllowedValues:
      - Production
      - Staging
      - Development
      
  OwnerEmail:
    Type: String
    Default: 'owner@example.com'
    Description: 'Email address of the resource owner'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
  HasKeyPair:
    Type: String
    Default: 'false'
    Description: 'Set to true if you have an existing EC2 KeyPair to use'
    AllowedValues:
      - 'true'
      - 'false'
      
  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 KeyPair name for SSH access when HasKeyPair is true'
    
  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for web servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'
    Description: 'Latest Amazon Linux 2023 AMI from SSM Parameter Store'
      
  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of EC2 instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 10
    
  MaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of EC2 instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 20
    
  DesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of EC2 instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 20
    
  DBInstanceClass:
    Type: String
    Default: 'db.t3.small'
    Description: 'RDS instance type (minimum db.t3.small for production)'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge
      
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    
  DBAllocatedStorage:
    Type: Number
    Default: 100
    Description: 'Allocated storage for RDS database (GB)'
    MinValue: 20
    MaxValue: 1000
    
  PostgreSQLVersion:
    Type: String
    Default: '15.15'
    Description: 'PostgreSQL engine version'
    AllowedValues:
      - '18.1'
      - '17.7'
      - '16.11'
      - '15.15'
      - '15.14'
      
  EnableMultiAZ:
    Type: String
    Default: 'true'
    Description: 'Enable Multi-AZ deployment for RDS'
    AllowedValues:
      - 'true'
      - 'false'
      
  AllowedSSHIP:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'IP address range allowed for SSH access (restrict in production)'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$'
    
  EnableNATGateway:
    Type: String
    Default: 'true'
    Description: 'Enable NAT Gateway for private subnet internet access'
    AllowedValues:
      - 'true'
      - 'false'
      
  EnableDetailedMonitoring:
    Type: String
    Default: 'true'
    Description: 'Enable detailed CloudWatch monitoring'
    AllowedValues:
      - 'true'
      - 'false'
      
  AlertEmail:
    Type: String
    Default: 'alerts@example.com'
    Description: 'Email address for CloudWatch alarm notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# ==========================================
# Conditions Section
# ==========================================
Conditions:
  CreateNATGateway: !Equals [!Ref EnableNATGateway, 'true']
  EnableMultiAZCondition: !Equals [!Ref EnableMultiAZ, 'true']
  EnableDetailedMonitoringCondition: !Equals [!Ref EnableDetailedMonitoring, 'true']
  IsProduction: !Equals [!Ref EnvironmentName, 'Production']
  HasKeyPairCondition: !Equals [!Ref HasKeyPair, 'true']

# ==========================================
# Resources Section
# ==========================================
Resources:

  # ==========================================
  # Secrets Manager for Database Password
  # ==========================================
  
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-password'
      Description: 'RDS Master Password'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "dbadmin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
  
  # ==========================================
  # S3 Resources
  # ==========================================
  
  # S3 Bucket for Static Website Hosting
  StaticWebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      # Remove WebsiteConfiguration as we're using CloudFront OAI
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: IntelligentTiering
            Status: Enabled
            Transitions:
              - StorageClass: INTELLIGENT_TIERING
                TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # S3 Bucket Policy for CloudFront Access
  StaticWebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticWebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action:
              - 's3:GetObject'
            Resource: !Sub '${StaticWebsiteBucket.Arn}/*'
            
  # S3 Bucket for VPC Flow Logs 
  FlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # Lambda function to initialize S3 content
  S3ContentInitFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-s3-init'
      Handler: index.handler
      Role: !GetAtt S3ContentInitRole.Arn
      Runtime: python3.11
      Timeout: 60
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import json
          
          def handler(event, context):
              try:
                  s3 = boto3.client('s3')
                  bucket = event['ResourceProperties']['BucketName']
                  
                  if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                      # Create index.html
                      index_content = """<!DOCTYPE html>
                      <html>
                      <head>
                          <title>Startup Platform</title>
                          <meta charset="UTF-8">
                          <style>
                              body { font-family: Arial, sans-serif; margin: 40px; }
                              h1 { color: #232f3e; }
                              .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
                          </style>
                      </head>
                      <body>
                          <h1>Welcome to Startup Platform</h1>
                          <div class="info">
                              <p>Your infrastructure is successfully deployed!</p>
                              <p>Environment: Production</p>
                              <p>Powered by AWS CloudFormation</p>
                          </div>
                      </body>
                      </html>"""
                      
                      # Create error.html
                      error_content = """<!DOCTYPE html>
                      <html>
                      <head>
                          <title>Error - Startup Platform</title>
                          <meta charset="UTF-8">
                          <style>
                              body { font-family: Arial, sans-serif; margin: 40px; }
                              h1 { color: #d13212; }
                          </style>
                      </head>
                      <body>
                          <h1>Error</h1>
                          <p>Sorry, the page you're looking for could not be found.</p>
                          <p><a href="/">Return to Home</a></p>
                      </body>
                      </html>"""
                      
                      s3.put_object(Bucket=bucket, Key='index.html', Body=index_content, ContentType='text/html')
                      s3.put_object(Bucket=bucket, Key='error.html', Body=error_content, ContentType='text/html')
                      
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  S3ContentInitRole:
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3WritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${StaticWebsiteBucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  S3ContentInitCustomResource:
    Type: Custom::S3ContentInit
    Properties:
      ServiceToken: !GetAtt S3ContentInitFunction.Arn
      BucketName: !Ref StaticWebsiteBucket
      
  # ==========================================
  # CloudFront Resources
  # ==========================================
  
  # CloudFront Origin Access Identity
  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${AWS::StackName}'
        
  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    DependsOn: S3ContentInitCustomResource
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CDN for ${ProjectName} ${EnvironmentName}'
        DefaultRootObject: 'index.html'
        HttpVersion: http2and3
        IPV6Enabled: true
        PriceClass: PriceClass_100
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticWebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
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
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
        CacheBehaviors:
          - PathPattern: '*.css'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            DefaultTTL: 604800
            MaxTTL: 31536000
          - PathPattern: '*.js'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            DefaultTTL: 604800
            MaxTTL: 31536000
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: '/error.html'
            ErrorCachingMinTTL: 60
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: '/error.html'
            ErrorCachingMinTTL: 60
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # ==========================================
  # WAF Resources for CloudFront Protection
  # ==========================================
  
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-WebACL'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
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
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-WebACL'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  WAFWebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn
          
  # ==========================================
  # VPC and Networking Resources
  # ==========================================
  
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
      
  # Public Subnets (Multi-AZ)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # Private Subnets for RDS and EC2
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # NAT Gateway for Private Subnet Internet Access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNATGateway
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  NATGateway:
    Type: AWS::EC2::NatGateway
    Condition: CreateNATGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRT'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
      
  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable
      
  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable
      
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRT'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  PrivateRoute:
    Type: AWS::EC2::Route
    Condition: CreateNATGateway
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway
      
  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable
      
  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable
      
  # VPC Flow Logs (Both CloudWatch and S3)
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
        - PolicyName: S3LogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                Resource: !Sub '${FlowLogsBucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}'
      RetentionInDays: 30
      
  VPCFlowLogsCloudWatch:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-FlowLogs-CloudWatch'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  VPCFlowLogsS3:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt FlowLogsBucket.Arn
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-FlowLogs-S3'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # ==========================================
  # Security Groups
  # ==========================================
  
  # Application Load Balancer Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
  
  # Security Group for EC2 Instances
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServerSG'
      GroupDescription: 'Security group for web server EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'Allow SSH access from specific IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServerSG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # Security Group for RDS Database
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-DatabaseSG'
      GroupDescription: 'Security group for RDS PostgreSQL database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow PostgreSQL traffic from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # ==========================================
  # IAM Resources
  # ==========================================
  
  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt StaticWebsiteBucket.Arn
                  - !Sub '${StaticWebsiteBucket.Arn}/*'
        - PolicyName: CloudFrontInvalidation
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudfront:CreateInvalidation'
                Resource: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBPasswordSecret
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: '/'
      Roles:
        - !Ref EC2InstanceRole
        
  # ==========================================
  # Application Load Balancer
  # ==========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
        
  # ==========================================
  # EC2 Auto Scaling Resources
  # ==========================================
  
  # Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPairCondition, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        Monitoring:
          Enabled: !If [EnableDetailedMonitoringCondition, true, false]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd postgresql15 aws-cli jq
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Start Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Get database credentials from Secrets Manager
            SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id ${DBPasswordSecret} --region ${AWS::Region} --query SecretString --output text)
            DB_PASSWORD=$(echo $SECRET_VALUE | jq -r .password)
            
            # Create application page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>${ProjectName} - ${EnvironmentName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #232f3e; }
                    .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>Welcome to ${ProjectName}</h1>
                <div class="info">
                    <p><strong>Environment:</strong> ${EnvironmentName}</p>
                    <p><strong>Instance ID:</strong> $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
                    <p><strong>Availability Zone:</strong> $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
                    <p><strong>CloudFront Distribution:</strong> ${CloudFrontDistribution.DomainName}</p>
                    <p><strong>Database Status:</strong> Connected</p>
                </div>
            </body>
            </html>
            EOF
            
            # Set environment variables
            echo "export DB_HOST=${PostgreSQLDatabase.Endpoint.Address}" >> /etc/environment
            echo "export DB_PORT=${PostgreSQLDatabase.Endpoint.Port}" >> /etc/environment
            echo "export DB_NAME=startupdb" >> /etc/environment
            echo "export DB_USER=${DBMasterUsername}" >> /etc/environment
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "${AWS::StackName}",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization", "unit": "Percent"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization", "unit": "Percent"}
                    ],
                    "resources": ["/"]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer-Volume'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName
              - Key: iac-rlhf-amazon
                Value: 'true'
                
  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true
          
  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      
  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      
  # Single EC2 Instance with Elastic IP 
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyPairCondition, !Ref KeyPairName, !Ref 'AWS::NoValue']
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Monitoring: !If [EnableDetailedMonitoringCondition, true, false]
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd postgresql15 aws-cli jq
          
          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
          
          # Start Apache
          systemctl start httpd
          systemctl enable httpd
          
          # Get database credentials
          SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id ${DBPasswordSecret} --region ${AWS::Region} --query SecretString --output text)
          DB_PASSWORD=$(echo $SECRET_VALUE | jq -r .password)
          
          # Create index page
          cat > /var/www/html/index.html << EOF
          <!DOCTYPE html>
          <html>
          <head>
              <title>${ProjectName} - ${EnvironmentName}</title>
          </head>
          <body>
              <h1>Welcome to ${ProjectName}</h1>
              <p>Environment: ${EnvironmentName}</p>
              <p>Instance: Management Server</p>
              <p>CloudFront: ${CloudFrontDistribution.DomainName}</p>
          </body>
          </html>
          EOF
          
          # Set environment variables
          echo "export DB_HOST=${PostgreSQLDatabase.Endpoint.Address}" >> /etc/environment
          echo "export DB_PORT=${PostgreSQLDatabase.Endpoint.Port}" >> /etc/environment
          echo "export DB_NAME=startupdb" >> /etc/environment
          echo "export DB_USER=${DBMasterUsername}" >> /etc/environment
          
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ManagementServer'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  EIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      InstanceId: !Ref WebServerInstance
      EIP: !Ref ElasticIP
      
  # ==========================================
  # RDS Resources
  # ==========================================
  
  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # RDS PostgreSQL Database
  PostgreSQLDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-postgres-db'
      Engine: postgres
      EngineVersion: !Ref PostgreSQLVersion
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      DBName: startupdb
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: !If [IsProduction, 31, 7]
      MultiAZ: !If [EnableMultiAZCondition, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PostgreSQL'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # ==========================================
  # CloudWatch Monitoring and Alarms
  # ==========================================
  
  # SNS Topic for Alarms
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub '${AWS::StackName}-Alarms'
      TopicName: !Sub '${AWS::StackName}-alarm-topic'
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
        - Key: iac-rlhf-amazon
          Value: 'true'
          
  # CPU Alarm for Auto Scaling
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: 'Trigger when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref AlarmTopic
        
  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LowCPU'
      AlarmDescription: 'Trigger when CPU is below 30%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
        
  # RDS Alarms
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Database-HighCPU'
      AlarmDescription: 'Database CPU utilization'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PostgreSQLDatabase
      AlarmActions:
        - !Ref AlarmTopic
        
  DatabaseStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Database-LowStorage'
      AlarmDescription: 'Database free storage space'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240  # 10GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PostgreSQLDatabase
      AlarmActions:
        - !Ref AlarmTopic
        
  # ALB Target Health Alarm
  UnhealthyTargetsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnhealthyTargets'
      AlarmDescription: 'Alert when targets are unhealthy'
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
      AlarmActions:
        - !Ref AlarmTopic

# ==========================================
# Outputs Section
# ==========================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
      
  VPCCidr:
    Description: 'VPC CIDR Block'
    Value: '10.0.0.0/16'
    Export:
      Name: !Sub '${AWS::StackName}-VPC-CIDR'
      
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'
      
  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'
      
  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'
      
  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'
      
  NATGatewayId:
    Condition: CreateNATGateway
    Description: 'NAT Gateway ID'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway-ID'
      
  ManagementServerPublicIP:
    Description: 'Public IP of management server'
    Value: !Ref ElasticIP
    Export:
      Name: !Sub '${AWS::StackName}-Management-PublicIP'
      
  ManagementServerInstanceId:
    Description: 'Management EC2 Instance ID'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-Management-InstanceID'
      
  ManagementServerSSH:
    Description: 'SSH connection command'
    Value: !If 
      - HasKeyPairCondition
      - !Sub 'ssh -i ${KeyPairName}.pem ec2-user@${ElasticIP}'
      - 'Key pair not provided'
    
  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'
      
  LaunchTemplateId:
    Description: 'Launch Template ID'
    Value: !Ref EC2LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate-ID'
      
  ApplicationLoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'
      
  ApplicationLoadBalancerArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ALB-ARN'
      
  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TargetGroup-ARN'
      
  CloudFrontDistributionURL:
    Description: 'CloudFront distribution URL'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-URL'
      
  CloudFrontDistributionId:
    Description: 'CloudFront distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-ID'
      
  S3BucketName:
    Description: 'S3 static website bucket name'
    Value: !Ref StaticWebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-BucketName'
      
  S3BucketArn:
    Description: 'S3 static website bucket ARN'
    Value: !GetAtt StaticWebsiteBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3-BucketArn'
      
  FlowLogsBucketName:
    Description: 'S3 flow logs bucket name'
    Value: !Ref FlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-BucketName'
      
  DatabaseEndpoint:
    Description: 'RDS PostgreSQL endpoint'
    Value: !GetAtt PostgreSQLDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
      
  DatabasePort:
    Description: 'RDS PostgreSQL port'
    Value: !GetAtt PostgreSQLDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
      
  DatabaseJDBCConnectionString:
    Description: 'JDBC connection string for PostgreSQL'
    Value: !Sub 'jdbc:postgresql://${PostgreSQLDatabase.Endpoint.Address}:${PostgreSQLDatabase.Endpoint.Port}/startupdb'
    Export:
      Name: !Sub '${AWS::StackName}-DB-JDBC'
      
  DatabaseSecretArn:
    Description: 'ARN of database password secret'
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-SecretArn'
      
  WebServerSecurityGroupId:
    Description: 'Web server security group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG'
      
  DatabaseSecurityGroupId:
    Description: 'Database security group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Database-SG'
      
  ALBSecurityGroupId:
    Description: 'ALB security group ID'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG'
      
  VPCFlowLogsGroupName:
    Description: 'CloudWatch Log Group for VPC Flow Logs'
    Value: !Ref VPCFlowLogsGroup
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-LogGroup'
      
  AlarmTopicArn:
    Description: 'SNS Topic ARN for CloudWatch alarms'
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlarmTopic-ARN'
      
  WAFWebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WAF-WebACL-ARN'
      
  StackRegion:
    Description: 'AWS Region where stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'
      
  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-StackName'
```