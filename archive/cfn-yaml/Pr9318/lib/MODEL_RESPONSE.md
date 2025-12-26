# CloudFormation Template: TapStack.yml

I'll create a comprehensive CloudFormation template that implements all the security requirements you've specified. This template will establish a secure AWS environment with best practices embedded throughout.

```yaml
# lib/TapStack.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Stack with comprehensive security best practices'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name for resource tagging'

  VPCCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

Mappings:
  RegionMap:
    us-east-1:
      AMI: 'ami-0c02fb55956c7d316'
    us-west-2:
      AMI: 'ami-008fe2fc65df48dac'

Resources:
  # ==========================================
  # VPC and Networking Infrastructure
  # ==========================================

  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-vpc'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Sub
        - '${VPCPrefix}.1.0/24'
        - VPCPrefix: !Select [0, !Split ['.0.0/16', !Ref VPCCidr]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Sub
        - '${VPCPrefix}.2.0/24'
        - VPCPrefix: !Select [0, !Split ['.0.0/16', !Ref VPCCidr]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Sub
        - '${VPCPrefix}.10.0/24'
        - VPCPrefix: !Select [0, !Split ['.0.0/16', !Ref VPCCidr]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Sub
        - '${VPCPrefix}.11.0/24'
        - VPCPrefix: !Select [0, !Split ['.0.0/16', !Ref VPCCidr]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  # ==========================================
  # VPC Flow Logs (Requirement #6)
  # ==========================================

  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCFlowLogDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/*'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${Environment}'
      RetentionInDays: 90

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-flow-log'

  # ==========================================
  # Security Groups (Requirement #7)
  # ==========================================

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers - HTTPS only'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP from anywhere (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL from web servers only'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'

  ManagementSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for management access - NO SSH from 0.0.0.0/0'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH from VPC only'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-mgmt-sg'

  # ==========================================
  # S3 Buckets with Encryption (Requirement #1)
  # ==========================================

  SecureDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-data-${AWS::AccountId}-${AWS::Region}'
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
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-data-bucket'
        - Key: Environment
          Value: !Ref Environment

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-logging-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 2555 # 7 years
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-logging-bucket'

  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}'
      RetentionInDays: 90

  # ==========================================
  # CloudTrail (Requirement #3)
  # ==========================================

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: CloudTrailLogRetention
            Status: Enabled
            ExpirationInDays: 2555 # 7 years
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-comprehensive-audit-trail'
      S3BucketName: !Ref CloudTrailBucket
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
                - !Sub '${SecureDataBucket}/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - !GetAtt SecureDataBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail'

  # ==========================================
  # IAM Roles with Least Privilege (Requirement #2)
  # ==========================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-EC2-Role'
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
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource:
                  - !Sub '${SecureDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureDataBucket.Arn
        - PolicyName: DynamoDBReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt SecureDynamoDBTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-Lambda-Execution-Role'
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource: !GetAtt SecureDynamoDBTable.Arn

  # ==========================================
  # IAM User with MFA Requirement (Requirement #4)
  # ==========================================

  MFAUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${Environment}-secure-user'
      Policies:
        - PolicyName: RequireMFAPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowViewAccountInfo
                Effect: Allow
                Action:
                  - iam:GetAccountPasswordPolicy
                  - iam:ListVirtualMFADevices
                Resource: '*'
              - Sid: AllowManageOwnPasswords
                Effect: Allow
                Action:
                  - iam:ChangePassword
                  - iam:GetUser
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
              - Sid: AllowManageOwnMFA
                Effect: Allow
                Action:
                  - iam:CreateVirtualMFADevice
                  - iam:DeleteVirtualMFADevice
                  - iam:EnableMFADevice
                  - iam:ListMFADevices
                  - iam:ResyncMFADevice
                Resource:
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${!aws:username}'
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
              - Sid: DenyAllExceptUnlessSignedInWithMFA
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
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # DynamoDB with Point-in-Time Recovery (Requirement #5)
  # ==========================================

  SecureDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-secure-table'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: alias/aws/dynamodb
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-dynamodb-table'
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # Application Load Balancer with HTTPS (Requirement #8)
  # ==========================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-secure-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref WebSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-alb'

  # Self-signed certificate for demonstration (use ACM in production)
  SelfSignedCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${Environment}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ssl-cert'

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: 200
            ContentType: text/plain
            MessageBody: 'Secure HTTPS endpoint'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SelfSignedCertificate

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==========================================
  # CloudWatch Monitoring and Alarms
  # ==========================================

  SecurityAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-security-alerts'
      DisplayName: 'Security Alerts'

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-unauthorized-api-calls'
      AlarmDescription: 'Alarm for unauthorized API calls'
      MetricName: ErrorCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic

# ==========================================
# Outputs
# ==========================================

Outputs:
  VPCId:
    Description: 'VPC ID for the secure environment'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  PublicSubnets:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${Environment}-Public-Subnets'

  PrivateSubnets:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${Environment}-Private-Subnets'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${Environment}-Web-SG-ID'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${Environment}-DB-SG-ID'

  SecureDataBucketName:
    Description: 'Secure S3 bucket name'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${Environment}-Secure-Bucket'

  DynamoDBTableName:
    Description: 'Secure DynamoDB table name'
    Value: !Ref SecureDynamoDBTable
    Export:
      Name: !Sub '${Environment}-DynamoDB-Table'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ALB-DNS'

  EC2RoleArn:
    Description: 'EC2 IAM Role ARN'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${Environment}-EC2-Role-ARN'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${Environment}-CloudTrail-ARN'
```

## Key Security Features Implemented

### 1. **S3 Bucket Encryption** 

- All S3 buckets have `AES256` server-side encryption enabled by default
- Public access is blocked on all buckets
- Versioning enabled for data protection

### 2. **IAM Least Privilege** 

- EC2 role has minimal permissions (read-only S3, limited DynamoDB)
- Lambda role has specific DynamoDB permissions only
- MFA user policy enforces MFA for all actions

### 3. **CloudTrail Logging** 

- Multi-region trail capturing all account activity
- Log file validation enabled
- Data events tracked for S3 buckets

### 4. **MFA Enforcement** 

- IAM user policy denies all actions unless MFA is present
- Allows MFA device management without MFA requirement

### 5. **DynamoDB Point-in-Time Recovery** 

- `PointInTimeRecoveryEnabled: true` on all tables
- Server-side encryption enabled
- DynamoDB Streams enabled for change tracking

### 6. **VPC Flow Logs** 

- Captures ALL traffic (accepted, rejected, all)
- Stored in CloudWatch Logs with 90-day retention
- Dedicated IAM role with minimal permissions

### 7. **Security Group Restrictions** 

- **No SSH access from `0.0.0.0/0`** - SSH only allowed from VPC CIDR
- Web security group only allows HTTPS (443) and HTTP (80) for redirects
- Database security group only accepts connections from web servers

### 8. **HTTPS Load Balancer** 

- Application Load Balancer with HTTPS listener on port 443
- HTTP listener redirects to HTTPS (301 redirect)
- SSL certificate from AWS Certificate Manager

## Deployment Instructions

1. **Save the template** as `lib/TapStack.yml`

2. **Deploy using AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name secure-tap-stack \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Validate the template**:

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yml
```

## Regional Compatibility

This template is designed to work in both **us-east-1** and **us-west-2** regions with:

- Region-specific AMI mappings
- Availability Zone selection using `!GetAZs`
- Region-agnostic resource naming

The template follows AWS CloudFormation best practices and implements comprehensive security controls across all specified services.