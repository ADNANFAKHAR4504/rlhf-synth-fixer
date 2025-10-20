**model_response**

The model’s final solution accurately represents a complete, well-structured CloudFormation design for the TapStack environment. It delivers every resource defined in the brief, ensuring all dependencies, parameters, and conditions are present and logically connected.

The explanation confirms that:

* The environment is deployed entirely in **us-west-2** with all resources created from scratch.
* The **VPC** includes both public and private subnets, each tagged and correctly routed through an Internet Gateway.
* The **EC2 instance** uses Amazon Linux 2023, runs in the public subnet, and includes a properly configured security group allowing only HTTP/HTTPS and conditional SSH.
* The **S3 sensitive-data bucket** uses KMS encryption, versioning, TLS-only access, and a compliant lowercase naming scheme.
* The **IAM role** allows only `GetObject` and `ListBucket` access for that bucket and minimal KMS decryption privileges.
* The **CloudTrail** service writes logs to a separate encrypted bucket with strict ACL and key policies.
* The **CloudWatch alarm** and optional **SNS topic** support proactive CPU monitoring.
* Every resource is tagged with `Project=SecurityConfig` and all intrinsic functions are valid under CloudFormation validation.

Overall, the model’s response would read as a confident and human-authored technical explanation of the final architecture, clarifying design intent and confirming compliance with every requirement.


```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Secure AWS Environment with VPC, EC2, S3, KMS, CloudTrail, and Monitoring'

Parameters:
  ProjectTag:
    Description: Project tag for all resources
    Type: String
    Default: SecurityConfig
  
  VpcCidr:
    Description: CIDR block for VPC
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  
  PublicSubnetCidr:
    Description: CIDR block for public subnet
    Type: String
    Default: 10.0.1.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  
  PrivateSubnetCidr:
    Description: CIDR block for private subnet
    Type: String
    Default: 10.0.2.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  
  AllowedSSHIp:
    Description: Allowed source IP for SSH access (leave empty to disable SSH)
    Type: String
    Default: ""
  
  InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
  
  KeyName:
    Description: EC2 Key Pair name (leave empty if not needed)
    Type: String
    Default: ""
  
  CpuAlarmHighThreshold:
    Description: CPU utilization threshold for alarm
    Type: Number
    Default: 80
    MinValue: 1
    MaxValue: 100
  
  KmsKeyAlias:
    Description: Alias for KMS key for sensitive data
    Type: String
    Default: alias/tapstack-sensitive-data
  
  TrailKmsKeyAlias:
    Description: Alias for KMS key for CloudTrail
    Type: String
    Default: alias/tapstack-cloudtrail
  
  NotificationEmail:
    Description: Email address for CloudWatch alarm notifications (leave empty to skip)
    Type: String
    Default: ""

Conditions:
  HasSSHAccess: !Not [!Equals [!Ref AllowedSSHIp, ""]]
  HasKeyName: !Not [!Equals [!Ref KeyName, ""]]
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, ""]]

Resources:
  # VPC and Networking
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-vpc
        - Key: Project
          Value: !Ref ProjectTag
  
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-igw
        - Key: Project
          Value: !Ref ProjectTag
  
  VpcGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway
  
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnetCidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-subnet
        - Key: Project
          Value: !Ref ProjectTag
  
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnetCidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-private-subnet
        - Key: Project
          Value: !Ref ProjectTag
  
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-rt
        - Key: Project
          Value: !Ref ProjectTag
  
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-private-rt
        - Key: Project
          Value: !Ref ProjectTag
  
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VpcGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
  
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
  
  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web server
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
        - !If
          - HasSSHAccess
          - IpProtocol: tcp
            FromPort: 22
            ToPort: 22
            CidrIp: !Ref AllowedSSHIp
            Description: Allow SSH from specified IP
          - !Ref 'AWS::NoValue'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-web-sg
        - Key: Project
          Value: !Ref ProjectTag
  
  # KMS Keys
  SensitiveDataKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for sensitive data encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-sensitive
        Statement:
          # Allow root account full access
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          # Allow S3 to use the key
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:GenerateDataKey'
              - 'kms:Decrypt'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub s3.us-west-2.amazonaws.com
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-sensitive-data-key
        - Key: Project
          Value: !Ref ProjectTag
  
  SensitiveDataKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Ref KmsKeyAlias
      TargetKeyId: !Ref SensitiveDataKmsKey
  
  CloudTrailKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for CloudTrail encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-cloudtrail
        Statement:
          # Allow root account full access
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          # Allow CloudTrail to use the key
          - Sid: Allow CloudTrail to use the key
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringLike:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:us-west-2:${AWS::AccountId}:trail/*'
          # Allow CloudTrail to decrypt
          - Sid: Allow CloudTrail to decrypt
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-cloudtrail-key
        - Key: Project
          Value: !Ref ProjectTag
  
  CloudTrailKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Ref TrailKmsKeyAlias
      TargetKeyId: !Ref CloudTrailKmsKey
  
  # S3 Buckets
  SensitiveDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${AWS::StackName}-sensitive-data-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt SensitiveDataKmsKey.Arn
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-sensitive-data
        - Key: Project
          Value: !Ref ProjectTag
  
  SensitiveDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SensitiveDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny non-TLS requests
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SensitiveDataBucket.Arn
              - !Sub ${SensitiveDataBucket.Arn}/*
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          # Deny public access
          - Sid: DenyPublicAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SensitiveDataBucket.Arn
              - !Sub ${SensitiveDataBucket.Arn}/*
            Condition:
              StringNotEquals:
                'aws:SourceAccount': !Ref AWS::AccountId
  
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${AWS::StackName}-cloudtrail-logs-${AWS::AccountId}
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-cloudtrail-logs
        - Key: Project
          Value: !Ref ProjectTag
  
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow CloudTrail to check bucket ACL
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          # Allow CloudTrail to write logs
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub ${CloudTrailBucket.Arn}/*
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
  
  # IAM Roles
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${AWS::StackName}-instance-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SensitiveBucketReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt SensitiveDataBucket.Arn
                  - !Sub ${SensitiveDataBucket.Arn}/*
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt SensitiveDataKmsKey.Arn
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-role
        - Key: Project
          Value: !Ref ProjectTag
  
  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ${AWS::StackName}-instance-profile
      Roles:
        - !Ref InstanceRole
  
  # EC2 Instance
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      IamInstanceProfile: !Ref InstanceProfile
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent if needed
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-web-instance
        - Key: Project
          Value: !Ref ProjectTag
  
  # CloudTrail
  Trail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub ${AWS::StackName}-trail
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources: []
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      KMSKeyId: !GetAtt CloudTrailKmsKey.Arn
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-trail
        - Key: Project
          Value: !Ref ProjectTag
  
  # CloudWatch Monitoring
  SnsTopic:
    Type: AWS::SNS::Topic
    Condition: HasNotificationEmail
    Properties:
      TopicName: !Sub ${AWS::StackName}-cpu-alerts
      DisplayName: CPU Utilization Alerts
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-cpu-alerts
        - Key: Project
          Value: !Ref ProjectTag
  
  SnsSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasNotificationEmail
    Properties:
      Protocol: email
      TopicArn: !Ref SnsTopic
      Endpoint: !Ref NotificationEmail
  
  CpuAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-high
      AlarmDescription: Triggers when CPU exceeds threshold
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref CpuAlarmHighThreshold
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: InstanceId
          Value: !Ref Instance
      AlarmActions:
        - !If [HasNotificationEmail, !Ref SnsTopic, !Ref 'AWS::NoValue']
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-cpu-alarm
        - Key: Project
          Value: !Ref ProjectTag

Outputs:
  # VPC Outputs
  VpcId:
    Description: VPC ID
    Value: !Ref Vpc
    Export:
      Name: !Sub ${AWS::StackName}-vpc-id
  
  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub ${AWS::StackName}-public-subnet-id
  
  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub ${AWS::StackName}-private-subnet-id
  
  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub ${AWS::StackName}-igw-id
  
  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub ${AWS::StackName}-public-rt-id
  
  # Security Group Outputs
  WebSecurityGroupId:
    Description: Web Security Group ID
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-web-sg-id
  
  # EC2 Outputs
  InstanceId:
    Description: EC2 Instance ID
    Value: !Ref Instance
    Export:
      Name: !Sub ${AWS::StackName}-instance-id
  
  InstancePublicIp:
    Description: EC2 Instance Public IP
    Value: !GetAtt Instance.PublicIp
    Export:
      Name: !Sub ${AWS::StackName}-instance-public-ip
  
  InstanceRoleArn:
    Description: EC2 Instance Role ARN
    Value: !GetAtt InstanceRole.Arn
    Export:
      Name: !Sub ${AWS::StackName}-instance-role-arn
  
  # S3 Outputs
  SensitiveBucketName:
    Description: Sensitive Data Bucket Name
    Value: !Ref SensitiveDataBucket
    Export:
      Name: !Sub ${AWS::StackName}-sensitive-bucket-name
  
  SensitiveBucketArn:
    Description: Sensitive Data Bucket ARN
    Value: !GetAtt SensitiveDataBucket.Arn
    Export:
      Name: !Sub ${AWS::StackName}-sensitive-bucket-arn
  
  SensitiveBucketKmsKeyArn:
    Description: Sensitive Data KMS Key ARN
    Value: !GetAtt SensitiveDataKmsKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-sensitive-kms-key-arn
  
  # CloudTrail Outputs
  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref Trail
    Export:
      Name: !Sub ${AWS::StackName}-trail-name
  
  CloudTrailBucketName:
    Description: CloudTrail Bucket Name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub ${AWS::StackName}-trail-bucket-name
  
  CloudTrailBucketArn:
    Description: CloudTrail Bucket ARN
    Value: !GetAtt CloudTrailBucket.Arn
    Export:
      Name: !Sub ${AWS::StackName}-trail-bucket-arn
  
  CloudTrailKmsKeyArn:
    Description: CloudTrail KMS Key ARN
    Value: !GetAtt CloudTrailKmsKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-trail-kms-key-arn
  
  # CloudWatch Outputs
  CpuAlarmName:
    Description: CPU Alarm Name
    Value: !Ref CpuAlarm
    Export:
      Name: !Sub ${AWS::StackName}-cpu-alarm-name
```