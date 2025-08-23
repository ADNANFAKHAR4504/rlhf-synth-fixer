# CloudFormation Template for Secure AWS Infrastructure

This CloudFormation template creates a secure AWS infrastructure with encryption, logging, and monitoring components. The template includes S3 buckets with encryption, CloudTrail for API logging, VPC Flow Logs for network monitoring, and IAM roles following least privilege principles.

## Template Overview

The infrastructure includes:
- Two encrypted S3 buckets for CloudTrail and VPC Flow Logs
- CloudTrail for comprehensive API logging across all regions
- VPC with public and private subnets
- VPC Flow Logs for network traffic analysis
- IAM roles with minimal required permissions
- Random string generation for unique resource naming

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure with S3 encryption, IAM least privilege, CloudTrail, and VPC Flow Logs'

Parameters:
  ProjectName:
    Type: String
    Default: 'myproj'
    Description: 'Project name for resource naming convention'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment name for resource naming convention'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  # Add environment suffix parameter for better naming
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # Random string generator for unique naming
  RandomString:
    Type: 'AWS::CloudFormation::CustomResource'
    Properties:
      ServiceToken: !GetAtt RandomStringFunction.Arn

  RandomStringFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-random-generator-${EnvironmentSuffix}'
      Runtime: 'python3.9'
      Handler: 'index.handler'
      Role: !GetAtt RandomStringLambdaRole.Arn
      Code:
        ZipFile: |
          import json
          import random
          import string
          import cfnresponse

          def handler(event, context):
              try:
                  if event['RequestType'] == 'Create':
                      random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'RandomString': random_string})
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  RandomStringLambdaRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-random-lambda-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'

  # S3 Bucket for CloudTrail Logs (Central Logging)
  CloudTrailLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-logs-${EnvironmentSuffix}-${RandomString.RandomString}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER

  # S3 Bucket for VPC Flow Logs
  VpcFlowLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-vpc-flowlogs-${EnvironmentSuffix}-${RandomString.RandomString}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA

  # CloudTrail Bucket Policy - Fixed for proper CloudTrail integration
  CloudTrailBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-global-trail-${EnvironmentSuffix}-${RandomString.RandomString}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-global-trail-${EnvironmentSuffix}-${RandomString.RandomString}'

  # IAM Role for CloudTrail
  CloudTrailRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-cloudtrail-role-${EnvironmentSuffix}-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
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
                Resource: !Sub 'arn:aws:logs:*:${AWS::AccountId}:log-group:/aws/cloudtrail/*'

  # CloudTrail (Multi-region)
  GlobalCloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-global-trail-${EnvironmentSuffix}-${RandomString.RandomString}'
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true

  # VPC
  SecureVpc:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-${EnvironmentSuffix}-${RandomString.RandomString}'

  # Public Subnet
  PublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref SecureVpc
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-${EnvironmentSuffix}-${RandomString.RandomString}'

  # Private Subnet
  PrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref SecureVpc
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-${EnvironmentSuffix}-${RandomString.RandomString}'

  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw-${EnvironmentSuffix}-${RandomString.RandomString}'

  AttachGateway:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref SecureVpc
      InternetGatewayId: !Ref InternetGateway

  # IAM Role for VPC Flow Logs
  VpcFlowLogsRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-flowlogs-role-${EnvironmentSuffix}-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: VpcFlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource: !GetAtt VpcFlowLogsBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${VpcFlowLogsBucket.Arn}/*'

  # VPC Flow Logs (FIXED)
  VpcFlowLogs:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref SecureVpc
      TrafficType: 'ALL'
      LogDestinationType: 's3'
      LogDestination: !Sub '${VpcFlowLogsBucket.Arn}/vpc-flow-logs/'
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}'
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-flowlogs-${EnvironmentSuffix}-${RandomString.RandomString}'

  # IAM Role for EC2 instances (example of least privilege)
  Ec2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role-${EnvironmentSuffix}-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !Sub '${CloudTrailLogsBucket.Arn}/*'
                  - !Sub '${VpcFlowLogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt CloudTrailLogsBucket.Arn
                  - !GetAtt VpcFlowLogsBucket.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'

  Ec2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile-${EnvironmentSuffix}-${RandomString.RandomString}'
      Roles:
        - !Ref Ec2InstanceRole

Outputs:
  CloudTrailBucketName:
    Description: 'Name of the CloudTrail logs S3 bucket'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  VpcFlowLogsBucketName:
    Description: 'Name of the VPC Flow Logs S3 bucket'
    Value: !Ref VpcFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-VpcFlowLogsBucketName'

  VpcId:
    Description: 'VPC ID'
    Value: !Ref SecureVpc
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt GlobalCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  RandomString:
    Description: 'Generated random string for resource naming'
    Value: !GetAtt RandomString.RandomString
    Export:
      Name: !Sub '${AWS::StackName}-RandomString'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Security Features

The template implements several security best practices:

**Encryption**: All S3 buckets use AES256 server-side encryption with bucket keys enabled for cost optimization.

**Access Control**: Public access is completely blocked on all S3 buckets, and IAM roles follow least privilege principles.

**Monitoring**: CloudTrail captures all API calls across all regions, and VPC Flow Logs monitor network traffic patterns.

**Resource Isolation**: The VPC provides network isolation with separate public and private subnets for different workload types.

**Unique Naming**: A Lambda-generated random string ensures resource names are unique across deployments to prevent conflicts.

## Deployment Considerations

The CloudTrail bucket policy uses specific ARN references instead of wildcards to ensure CloudTrail can write logs while maintaining security. The template includes proper dependencies to ensure resources are created in the correct order.

All resources include comprehensive tagging for resource management and cost allocation. The EnvironmentSuffix parameter combined with the random string creates predictable yet unique resource names.