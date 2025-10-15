Model response:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Production-ready serverless infrastructure with high availability, security, and operational excellence'

# ==========================================
# Parameters
# ==========================================
Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name for resource tagging
  
  Project:
    Type: String
    Default: serverless-webapp
    Description: Project name for resource tagging
    MinLength: 1
    MaxLength: 50
  
  Owner:
    Type: String
    Default: platform-team
    Description: Owner identifier for resource tagging
    MinLength: 1
    MaxLength: 50
  
  DomainName:
    Type: String
    Default: example.com
    Description: Base domain name for Route53 configuration
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$'
  
  AlertEmail:
    Type: String
    Description: Email address for CloudWatch alerts
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# ==========================================
# Mappings
# ==========================================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet1:
      CIDR: 10.0.10.0/24
    PrivateSubnet2:
      CIDR: 10.0.11.0/24

# ==========================================
# Globals for Serverless Functions
# ==========================================
Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Runtime: python3.11
    Architectures:
      - x86_64
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        PROJECT: !Ref Project
    Tags:
      Environment: !Ref Environment
      Project: !Ref Project
      Owner: !Ref Owner

# ==========================================
# Resources
# ==========================================
Resources:

  # ==========================================
  # Networking Resources
  # ==========================================
  
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-public-subnet-1'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-public-subnet-2'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-subnet-1'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-subnet-2'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways and Elastic IPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-nat-eip-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-nat-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-nat-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-rt-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-rt-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Group for Lambda Functions
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions in VPC
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-lambda-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # VPC Endpoints for AWS Services (Cost optimization & security)
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  # ==========================================
  # Security Resources
  # ==========================================

  # KMS Key for Lambda Environment Variables
  LambdaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting Lambda environment variables
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda service to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-lambda-kms'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  LambdaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Project}-${Environment}-lambda'
      TargetKeyId: !Ref LambdaKMSKey

  # Secrets Manager Secret
  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Project}-${Environment}-app-secret'
      Description: Application secrets for Lambda functions
      SecretString: !Sub |
        {
          "api_key": "placeholder-api-key-${AWS::StackName}",
          "db_password": "placeholder-db-password",
          "jwt_secret": "placeholder-jwt-secret"
        }
      KmsKeyId: !Ref LambdaKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  # Lambda Execution Role with Least Privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Project}-${Environment}-lambda-exec-role'
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
        - PolicyName: LambdaExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Project}-${Environment}-*'
              
              # DynamoDB permissions (least privilege)
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: 
                  - !GetAtt DynamoDBTable.Arn
                  - !Sub '${DynamoDBTable.Arn}/index/*'
              
              # S3 permissions (least privilege)
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub '${S3Bucket.Arn}/*'
              
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt S3Bucket.Arn
              
              # Secrets Manager permissions
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref ApplicationSecret
              
              # KMS permissions for secrets decryption
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt LambdaKMSKey.Arn
              
              # SQS DLQ permissions
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt DeadLetterQueue.Arn
              
              # X-Ray tracing permissions
              - Effect: Allow
                Action:
                  - 'xray:PutTraceSegments'
                  - 'xray:PutTelemetryRecords'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ==========================================
  # Storage Resources
  # ==========================================

  # S3 Bucket with Encryption and Versioning
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Project}-${Environment}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # DynamoDB Table with Auto-scaling
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Project}-${Environment}-table'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # DynamoDB Auto-scaling
  DynamoDBTableReadCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub 'table/${DynamoDBTable}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  DynamoDBTableReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${Project}-${Environment}-read-scaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoDBTableReadCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization

  DynamoDBTableWriteCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub 'table/${DynamoDBTable}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  DynamoDBTableWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${Project}-${Environment}-write-scaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoDBTableWriteCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization

  # ==========================================
  # Serverless Compute Resources
  # ==========================================

  # Dead Letter Queue for Lambda
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${Project}-${Environment}-dlq'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Project}-${Environment}-main'
      RetentionInDays: 30

  # Main Lambda Function
  MainLambdaFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${Project}-${Environment}-main'
      Description: Main application Lambda function
      CodeUri: ./src/  # Placeholder - would be replaced with actual code location
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      KmsKeyArn: !GetAtt LambdaKMSKey.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
          BUCKET_NAME: !Ref S3Bucket
          SECRET_NAME: !Ref ApplicationSecret
          REGION: !Ref AWS::Region
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      ReservedConcurrentExecutions: 100
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt DeadLetterQueue.Arn
      Tracing: Active
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Method: ANY
            Path: /{proxy+}
      InlineCode: |
        import json
        import os
        import boto3
        
        def handler(event, context):
            """Placeholder Lambda handler function"""
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Hello from Lambda!',
                    'environment': os.environ.get('ENVIRONMENT'),
                    'region': os.environ.get('REGION')
                })
            }

  # ==========================================
  # API Gateway Resources
  # ==========================================

  # HTTP API (API Gateway V2)
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      Name: !Sub '${Project}-${Environment}-api'
      Description: Main HTTP API endpoint
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowHeaders:
          - '*'
      AccessLogSettings:
        DestinationArn: !GetAtt ApiLogGroup.Arn
        Format: '$context.requestId $context.error.message $context.error.messageString'
      Tags:
        Environment: !Ref Environment
        Project: !Ref Project
        Owner: !Ref Owner

  # CloudWatch Log Group for API Gateway
  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${Project}-${Environment}'
      RetentionInDays: 30

  # ==========================================
  # WAF Resources
  # ==========================================

  # WAF WebACL for API Protection
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${Project}-${Environment}-waf'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        # Rate limiting rule
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
        
        # AWS Managed Core Rule Set
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesCommonRuleSetMetric
        
        # SQL injection protection
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesSQLiRuleSetMetric
      
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${Project}-${Environment}-waf'
      
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Associate WAF with API Gateway
  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/apis/${HttpApi}'
      WebACLArn: !GetAtt WAFWebACL.Arn

  # ==========================================
  # Route 53 DNS Resources
  # ==========================================

  # Route 53 Hosted Zone (placeholder - usually already exists)
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${Project} ${Environment}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Health Check for Multi-Region Failover
  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /health
      FullyQualifiedDomainName: !Sub '${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      MeasureLatency: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-healthcheck'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Primary Region Record Set with Failover
  PrimaryRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'api.${DomainName}'
      Type: A
      SetIdentifier: !Sub '${AWS::Region}-primary'
      Failover: PRIMARY
      HealthCheckId: !Ref HealthCheck
      AliasTarget:
        DNSName: !Sub '${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
        HostedZoneId: !GetAtt HttpApi.HostedZoneId
        EvaluateTargetHealth: true

  # Secondary Region Record Set (placeholder for multi-region setup)
  SecondaryRecordSet:
    Type: AWS::Route53::RecordSet
    Condition: IsSecondaryRegion
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'api.${DomainName}'
      Type: A
      SetIdentifier: !Sub '${AWS::Region}-secondary'
      Failover: SECONDARY
      AliasTarget:
        DNSName: !Sub '${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
        HostedZoneId: !GetAtt HttpApi.HostedZoneId
        EvaluateTargetHealth: false

  # ==========================================
  # Monitoring and Alerting
  # ==========================================

  # SNS Topic for Alerts
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Project}-${Environment}-alerts'
      DisplayName: !Sub '${Project} ${Environment} Alerts'
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # CloudWatch Alarm for Lambda Errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Project}-${Environment}-lambda-errors'
      AlarmDescription: Alert when Lambda function errors exceed threshold
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref MainLambdaFunction
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for DLQ Messages
  DLQAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Project}-${Environment}-dlq-messages'
      AlarmDescription: Alert when messages are sent to DLQ
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt DeadLetterQueue.QueueName
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for API Gateway 4XX Errors
  ApiGateway4XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Project}-${Environment}-api-4xx'
      AlarmDescription: Alert when API Gateway 4XX errors exceed threshold
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Sub '${Project}-${Environment}-api'
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for API Gateway 5XX Errors
  ApiGateway5XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Project}-${Environment}-api-5xx'
      AlarmDescription: Alert when API Gateway 5XX errors exceed threshold
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Sub '${Project}-${Environment}-api'
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

# ==========================================
# Conditions
# ==========================================
Conditions:
  IsSecondaryRegion: !Not [!Equals [!Ref AWS::Region, 'us-east-1']]

# ==========================================
# Outputs
# ==========================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ApiEndpoint:
    Description: HTTP API Gateway endpoint URL
    Value: !Sub 'https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  LambdaFunctionArn:
    Description: Main Lambda Function ARN
    Value: !GetAtt MainLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTable'

  WAFWebACLId:
    Description: WAF WebACL ID
    Value: !GetAtt WAFWebACL.Id
    Export:
      Name: !Sub '${AWS::StackName}-WAFWebACLId'

  SecretArn:
    Description: Secrets Manager Secret ARN
    Value: !Ref ApplicationSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretArn'

  KMSKeyId:
    Description: KMS Key ID for Lambda encryption
    Value: !Ref LambdaKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  DNSName:
    Description: Route53 DNS Name
    Value: !Sub 'api.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-DNSName'

  Region:
    Description: AWS Region where stack is deployed
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```