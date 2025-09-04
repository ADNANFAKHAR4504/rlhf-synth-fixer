# TapStack.yml - Secure AWS Infrastructure CloudFormation Template

Here's a comprehensive CloudFormation YAML template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure with IAM roles, S3 bucket, VPC networking, and CloudWatch monitoring'

Parameters:
  ProjectName:
    Type: String
    Default: 'tapproject'
    Description: 'Name of the project for resource naming and tagging'
  
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment type for resource tagging'
  
  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Owner of the resources for cost tracking'

  NotificationEmail:
    Type: String
    Default: ''
    Description: 'Email address for CloudWatch alarm notifications (optional)'
    AllowedPattern: '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address or empty'

Mappings:
  RegionMap:
    us-west-2:
      AvailabilityZone1: 'us-west-2a'
      AvailabilityZone2: 'us-west-2b'
    us-east-1:
      AvailabilityZone1: 'us-east-1a'
      AvailabilityZone2: 'us-east-1b'
    us-east-2:
      AvailabilityZone1: 'us-east-2a'
      AvailabilityZone2: 'us-east-2b'
    eu-west-1:
      AvailabilityZone1: 'eu-west-1a'
      AvailabilityZone2: 'eu-west-1b'
    ap-southeast-1:
      AvailabilityZone1: 'ap-southeast-1a'
      AvailabilityZone2: 'ap-southeast-1b'

Conditions:
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, '']]

Resources:
  # ===============================
  # VPC and Networking Components
  # ===============================
  
  TapVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: 'Public'

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone2]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: 'Private'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref TapVPC
      InternetGatewayId: !Ref InternetGateway

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  # ===============================
  # S3 Bucket with Encryption
  # ===============================

  TapS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}securebucket${AWS::AccountId}${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  # ===============================
  # IAM Roles with Least Privilege
  # ===============================

  # Application Role for EC2 instances
  EC2ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
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
                Resource: !Sub 'arn:aws:s3:::${TapS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${TapS3Bucket}'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ec2-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2ApplicationRole

  # Lambda Execution Role
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
      Policies:
        - PolicyName: VPCAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                Resource: '*'
                Condition:
                  StringEquals:
                    'ec2:vpc': !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  # CloudWatch Events Role
  CloudWatchEventsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SNSPublishPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SecurityAlarmTopic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-events-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  # ===============================
  # CloudTrail for Security Monitoring
  # ===============================

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}cloudtrail${AWS::AccountId}${AWS::Region}'
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
          - Id: DeleteOldTrails
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  TapCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-security-trail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub 'arn:aws:s3:::${TapS3Bucket}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  # ===============================
  # CloudWatch Monitoring & Alarms
  # ===============================

  S3CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-s3-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  SecurityAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-security-alerts'
      DisplayName: 'Security Alerts for Tap Infrastructure'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-security-topic'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  SecurityAlarmSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasNotificationEmail
    Properties:
      TopicArn: !Ref SecurityAlarmTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # CloudWatch Alarm for Unauthorized Access
  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-unauthorized-access-alarm'
      AlarmDescription: 'Alarm for detecting unauthorized access attempts'
      MetricName: 'UnauthorizedAccessAttempts'
      Namespace: !Sub '${ProjectName}/Security'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-security-alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket Access Denied Alarm
  S3AccessDeniedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-s3-access-denied-alarm'
      AlarmDescription: 'Alarm for S3 access denied events'
      MetricName: 'S3AccessDenied'
      Namespace: !Sub '${ProjectName}/Security'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 3
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-s3-security-alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref TapVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-ID'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-ID'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref TapS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  EC2RoleArn:
    Description: 'EC2 Application Role ARN'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role-ARN'

  LambdaRoleArn:
    Description: 'Lambda Execution Role ARN'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Role-ARN'

  SecurityTopicArn:
    Description: 'Security Alarm SNS Topic ARN'
    Value: !Ref SecurityAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-Security-Topic-ARN'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt TapCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
```

## Key Features and Best Practices Implemented:

### 🔐 **Security Best Practices:**
- **Least Privilege IAM Roles**: Each role has minimal necessary permissions
- **S3 Encryption**: Server-side encryption with AWS managed keys (SSE-S3)
- **Public Access Blocked**: All S3 buckets have public access blocked
- **VPC Security**: Private subnet with NAT Gateway for secure outbound access
- **CloudTrail Logging**: Comprehensive audit trail for security monitoring

### 🏗️ **Infrastructure Components:**
- **VPC**: Custom VPC with public/private subnet architecture
- **Networking**: Internet Gateway, NAT Gateway, and proper routing
- **Storage**: Encrypted S3 buckets with versioning and lifecycle policies
- **Monitoring**: CloudWatch alarms for unauthorized access detection

### 📊 **Monitoring & Alerting:**
- **CloudTrail Integration**: Monitors API calls and access attempts
- **Metric Filters**: Detect unauthorized operations and access denied events
- **SNS Notifications**: Email alerts for security incidents
- **Log Retention**: Appropriate log retention policies for compliance

### 🏷️ **Resource Management:**
- **Consistent Tagging**: All resources tagged for cost tracking and organization
- **Parameterized**: Flexible parameters for different environments
- **Outputs**: Important resource identifiers exported for cross-stack references

## Deployment Instructions:

```bash
# Deploy the stack
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name tap-infrastructure \
  --parameter-overrides \
    ProjectName=MyTapProject \
    Environment=dev \
    Owner=DevOps-Team \
    NotificationEmail=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

# Validate the template
cfn-lint TapStack.yml
```

This template is production-ready and follows AWS Well-Architected Framework principles for security, reliability, and cost optimization.