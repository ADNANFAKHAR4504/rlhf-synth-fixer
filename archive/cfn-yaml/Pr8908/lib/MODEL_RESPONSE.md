# Secure AWS Cloud Environment - CloudFormation Solution

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS cloud environment with API Gateway, S3, IAM, WAF, and VPC networking'

# =============================================================================
# PARAMETERS SECTION
# Define configurable values for template customization
# =============================================================================
Parameters:
  ProjectName:
    Type: String
    Default: 'cfn-secure-project'
    Description: 'Name prefix for all resources'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'

  LogRetentionDays:
    Type: Number
    Default: 30
    AllowedValues:
      [
        1,
        3,
        5,
        7,
        14,
        30,
        60,
        90,
        120,
        150,
        180,
        365,
        400,
        545,
        731,
        1827,
        3653,
      ]
    Description: 'CloudWatch Logs retention period in days'

# =============================================================================
# RESOURCES SECTION
# All AWS resources required for the secure environment
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING COMPONENTS
  # Single VPC containing all networking resources
  # ---------------------------------------------------------------------------

  # Main VPC for all resources
  MainVPC:
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

  # Public subnet for NAT Gateway and Load Balancer
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  # Private subnets for application resources
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC

  # Elastic IP for NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateway for private subnet internet access
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway'
        - Key: Environment
          Value: !Ref Environment

  # Route tables and associations
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security group for API Gateway VPC endpoint
  APIGatewaySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for API Gateway VPC endpoint'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '10.0.0.0/16'
          Description: 'HTTPS access from VPC'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound access'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-gateway-sg'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # S3 BUCKETS WITH ENCRYPTION AND SECURITY
  # Server-side encryption with AES-256 and blocked public access
  # ---------------------------------------------------------------------------

  # Primary S3 bucket for application data
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        LambdaConfigurations: []
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-data'
        - Key: Environment
          Value: !Ref Environment

  # S3 bucket policy for additional security
  ApplicationDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ApplicationDataBucket.Arn
              - !Sub '${ApplicationDataBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # S3 bucket for API Gateway access logs
  APIGatewayLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-api-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-logs'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # VPC ENDPOINTS FOR SECURE ACCESS
  # Private connectivity to AWS services
  # ---------------------------------------------------------------------------

  # VPC Endpoint for S3
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref MainVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  # VPC Endpoint for API Gateway
  APIGatewayVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref MainVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.execute-api'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref APIGatewaySecurityGroup
      PrivateDnsEnabled: true

  # ---------------------------------------------------------------------------
  # CLOUDWATCH LOGS GROUPS
  # Centralized logging with proper retention settings
  # ---------------------------------------------------------------------------

  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: !Ref LogRetentionDays

  WAFLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/waf/${ProjectName}-${Environment}'
      RetentionInDays: !Ref LogRetentionDays

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}'
      RetentionInDays: !Ref LogRetentionDays

  # ---------------------------------------------------------------------------
  # IAM ROLES AND POLICIES
  # Least privilege access for all resources
  # ---------------------------------------------------------------------------

  # IAM Role for API Gateway to write to CloudWatch Logs
  APIGatewayCloudWatchRole:
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-apigateway-role'
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Lambda function
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub '${ApplicationDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationDataBucket.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${LambdaLogGroup.Arn}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-role'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # AWS WAF WEB ACL
  # Protection against common web exploits (SQL injection, XSS, etc.)
  # ---------------------------------------------------------------------------

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-web-acl'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
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
        - Name: XSSRule
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
            MetricName: XSSRule
        - Name: KnownBadInputsRule
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRule
        - Name: RateLimitRule
          Priority: 4
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
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-${Environment}-web-acl'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-acl'
        - Key: Environment
          Value: !Ref Environment

  # WAF Logging Configuration
  WAFLoggingConfiguration:
    Type: AWS::WAFv2::LoggingConfiguration
    Properties:
      ResourceArn: !GetAtt WebACL.Arn
      LogDestinationConfigs:
        - !GetAtt WAFLogGroup.Arn

  # ---------------------------------------------------------------------------
  # API GATEWAY CONFIGURATION
  # REST API with CloudWatch logging and WAF protection
  # ---------------------------------------------------------------------------

  # API Gateway Account configuration for CloudWatch Logs
  APIGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt APIGatewayCloudWatchRole.Arn

  # REST API Gateway
  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      Description: 'Secure REST API with WAF protection and CloudWatch logging'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api'
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Resources and Methods
  APIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'secure'

  APIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref APIResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: '200'
            ResponseTemplates:
              application/json: |
                {
                  "message": "Secure API is working",
                  "timestamp": "$context.requestTime",
                  "requestId": "$context.requestId"
                }
        RequestTemplates:
          application/json: |
            {
              "statusCode": 200
            }
      MethodResponses:
        - StatusCode: '200'
          ResponseModels:
            application/json: Empty

  HealthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'health'

  HealthMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref HealthResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: '200'
            ResponseTemplates:
              application/json: |
                {
                  "status": "healthy",
                  "timestamp": "$context.requestTime"
                }
        RequestTemplates:
          application/json: |
            {
              "statusCode": 200
            }
      MethodResponses:
        - StatusCode: '200'
          ResponseModels:
            application/json: Empty

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - APIMethod
      - HealthMethod
    Properties:
      RestApiId: !Ref RestAPI
      Description: 'Deployment with security features'

  # API Gateway Stage with logging enabled
  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestAPI
      DeploymentId: !Ref APIDeployment
      StageName: !Ref Environment
      AccessLogSetting:
        DestinationArn: !GetAtt APIGatewayLogGroup.Arn
        Format: >
          {
            "requestId": "$context.requestId",
            "ip": "$context.identity.sourceIp",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "resourcePath": "$context.resourcePath",
            "status": "$context.status",
            "protocol": "$context.protocol"
          }
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
          ThrottlingBurstLimit: 1000
          ThrottlingRateLimit: 500
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api-stage'
        - Key: Environment
          Value: !Ref Environment

  # Associate WAF Web ACL with API Gateway
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${RestAPI}/stages/${APIStage}'
      WebACLArn: !GetAtt WebACL.Arn

# =============================================================================
# OUTPUTS SECTION
# Export important resource identifiers and endpoints
# =============================================================================
Outputs:
  VPCId:
    Description: 'VPC ID for the secure environment'
    Value: !Ref MainVPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id'

  PrivateSubnetIds:
    Description: 'Private subnet IDs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnets'

  APIGatewayURL:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-url'

  ApplicationDataBucketName:
    Description: 'Name of the application data S3 bucket'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-app-bucket'

  WebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-web-acl-arn'
```

## Issues with This Template

This template has several problems that would prevent successful deployment in a multi-environment setup:

1. **Missing EnvironmentSuffix Parameter**: Uses only Environment parameter which can cause resource naming conflicts
2. **Resource Naming Issues**: All resources use `${Environment}` which doesn't provide unique naming
3. **Export Name Conflicts**: Stack exports could conflict between multiple deployments to same environment
4. **Missing S3 Lifecycle Rules**: No cost optimization policies
5. **Incomplete S3 Bucket Policy**: Missing VPC endpoint restrictions
6. **Missing VPC Policy**: API Gateway doesn't restrict access to VPC endpoint only
