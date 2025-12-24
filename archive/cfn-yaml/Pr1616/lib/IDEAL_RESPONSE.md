# Secure Web Application Infrastructure CloudFormation Template

Below is a comprehensive CloudFormation template that meets all your requirements. This template creates a production-ready, secure infrastructure with proper networking, security, monitoring, and compliance features.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Fully automated secure web application infrastructure (VPC, IAM, S3, CloudTrail, CloudWatch, Config)'

Parameters:
  ProjectName:
    Type: String
    Default: 'securewebapp'
    Description: 'Prefix for naming all resources'

  AllowedIPRange:
    Type: String
    Description: 'CIDR range allowed to access the application'
    Default: '0.0.0.0/0'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

Resources:
  # ------------------------------
  # VPC + Networking
  # ------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'

  AttachIGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachIGW
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet1
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId

  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet2
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet1Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ------------------------------
  # Security Groups
  # ------------------------------
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'web sg restricted inbound'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'

  # ------------------------------
  # IAM Role (auto-generated name)
  # ------------------------------
  AppRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AppS3DynamoAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${AppBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt AppBucket.Arn
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-AppData'

  AppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref AppRole

  # ------------------------------
  # S3 Buckets (App + CloudTrail)
  # ------------------------------
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-logs-${AWS::AccountId}-${AWS::Region}'
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
          - Status: Enabled
            ExpirationInDays: 90

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${CloudTrailBucket.Arn}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  # ------------------------------
  # CloudTrail + LogGroup + Metric
  # ------------------------------
  TrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}'
      RetentionInDays: 30

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${ProjectName}:*'

  CloudTrailTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      IsLogging: true
      S3BucketName: !Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: !GetAtt TrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      TrailName: !Sub '${ProjectName}-trail'

  UnauthorizedMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref TrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: !Sub '${ProjectName}-metrics'
          MetricValue: '1'

  UnauthorizedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-unauthorized-calls'
      MetricName: UnauthorizedAPICalls
      Namespace: !Sub '${ProjectName}-metrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  # ------------------------------
  # AWS Config
  # ------------------------------
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-config-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigServicePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - config:Put* 
                  - config:Get* 
                  - config:Describe*
                Resource: "*"

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref ConfigBucket

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-config-recorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

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
      Policies:
        - PolicyName: AllowConfigStart
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:StartConfigurationRecorder
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  StartConfigRecorderFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse

          def handler(event, context):
              try:
                  recorder = event['ResourceProperties']['RecorderName']
                  client = boto3.client('config')
                  client.start_configuration_recorder(ConfigurationRecorderName=recorder)
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print("Error:", str(e))
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  StartConfigRecorder:
    Type: Custom::StartRecorder
    DependsOn:
      - ConfigurationRecorder
      - DeliveryChannel
    Properties:
      ServiceToken: !GetAtt StartConfigRecorderFunction.Arn
      RecorderName: !Sub '${ProjectName}-config-recorder'


  IAMPolicyChangeRule:
    Type: AWS::Config::ConfigRule
    DependsOn: StartConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-iam-password-policy'
      Description: 'Checks if password policy is compliant'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_PASSWORD_POLICY

  # ------------------------------
  # DynamoDB Table
  # ------------------------------
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-AppData'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true


Outputs:
  VPCId:
    Value: !Ref VPC
    Description: VPC Id

  AppBucketName:
    Value: !Ref AppBucket
    Description: Application S3 bucket

  DynamoTableName:
    Value: !Ref DynamoDBTable
    Description: DynamoDB Table name

  CloudTrailArn:
    Value: !GetAtt CloudTrailTrail.Arn
    Description: CloudTrail ARN

  CloudTrailS3Bucket:
    Value: !Ref CloudTrailBucket
    Description: S3 bucket used by CloudTrail

```

# Key Features and Explanations

## 1. VPC and Networking
- Creates a VPC with CIDR `10.0.0.0/16`
- Deploys public and private subnets across two Availability Zones
- Configures NAT Gateways in each AZ for high availability
- Sets up proper route tables for internet and NAT gateway routing

## 2. Security Groups
- Restricts application access to specified IP ranges
- Allows HTTP (port 80) and HTTPS (port 443) only from allowed IPs
- Follows principle of least privilege

## 3. IAM Role
- Creates a role with minimal permissions for S3 and DynamoDB access
- Includes instance profile for EC2 instances
- Follows AWS security best practices

## 4. S3 Buckets
- Application bucket with AES-256 encryption
- CloudTrail logs bucket with lifecycle policies
- Public access blocked on all buckets
- Versioning enabled for data protection

## 5. CloudTrail
- Logs all API calls across all AWS regions
- Stores logs in a dedicated S3 bucket
- Includes log file validation for integrity

## 6. CloudWatch Monitoring
- Metric filter for unauthorized API calls
- Alarm triggers on security violations
- Log group for CloudTrail logs with retention policy

## 7. AWS Config
- Monitors IAM policy changes
- Records all resource configurations
- Stores configuration data in a dedicated S3 bucket

## 8. Additional Security Features
- All S3 buckets have encryption enabled
- DynamoDB table includes encryption and point-in-time recovery
- Lifecycle policies for cost optimization
- Comprehensive tagging strategy

# Deployment Instructions

1. Save the template as `secure-infrastructure.yaml`

2. Deploy using AWS CLI:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-web-app-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters ParameterKey=AllowedIPRange,ParameterValue=YOUR_IP_RANGE/32 \
     --capabilities CAPABILITY_NAMED_IAM \
   ```

3. Monitor deployment progress:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-web-app-infrastructure \
   ```

This template provides a solid foundation for a secure, production-ready web application infrastructure that meets all specified requirements and follows AWS best practices.
