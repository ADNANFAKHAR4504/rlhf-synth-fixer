I see the issue. The CloudWatch Logs service requires specific permissions in the KMS key policy to use the key for log group encryption. Let me provide the corrected TapStack.yml template:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Comprehensive AWS Security Infrastructure Template'

# Parameters section - Input variables for the template
Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - 'development'
      - 'staging'
      - 'production'
    Description: 'Environment type for resource naming and configuration'
  
  VPCCidrWest:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC in us-west-2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
  
  VPCCidrEast:
    Type: String
    Default: '10.1.0.0/16'
    Description: 'CIDR block for VPC in us-east-1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
  
  VPNTunnelCIDR:
    Type: String
    Default: '192.168.100.0/24'
    Description: 'CIDR block for IPSec VPN tunnel access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
  
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
  
  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS instance'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
  
  CrossAccountRoleArn:
    Type: String
    Description: 'ARN of the cross-account role to assume'
    Default: 'arn:aws:iam::123456789012:root'

# Mappings section - Static lookup tables
Mappings:
  RegionMap:
    us-west-2:
      AMI: 'ami-0c02fb55956c7d316'
      AZ1: 'us-west-2a'
      AZ2: 'us-west-2b'
      AZ3: 'us-west-2c'
    us-east-1:
      AMI: 'ami-0abcdef1234567890'
      AZ1: 'us-east-1a'
      AZ2: 'us-east-1b'
      AZ3: 'us-east-1c'
  
  EnvironmentMap:
    development:
      InstanceType: 't3.micro'
      DBInstanceClass: 'db.t3.micro'
    staging:
      InstanceType: 't3.small'
      DBInstanceClass: 'db.t3.small'
    production:
      InstanceType: 't3.medium'
      DBInstanceClass: 'db.t3.medium'

# Conditions section - Logical conditions for resource creation
Conditions:
  IsProduction: !Equals [!Ref Environment, 'production']
  IsNotProduction: !Not [!Equals [!Ref Environment, 'production']]

# Resources section - AWS resources to be created
Resources:
  # KMS Key for encryption
  TapStackKMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS Key for TapStack encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: 'Allow'
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow CloudTrail to encrypt logs'
            Effect: 'Allow'
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Decrypt'
            Resource: '*'
          - Sid: 'Allow S3 Service'
            Effect: 'Allow'
            Principal:
              Service: 's3.amazonaws.com'
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: 'Allow CloudWatch Logs'
            Effect: 'Allow'
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/s3/tapstack-${Environment}'

  # KMS Key Alias
  TapStackKMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/tapstack-${Environment}'
      TargetKeyId: !Ref TapStackKMSKey

  # CloudWatch Log Group for S3 (created before S3 bucket)
  S3LogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/s3/tapstack-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt TapStackKMSKey.Arn

  # S3 Bucket for logs (created before main bucket)
  TapStackLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub 'tapstack-logs-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: 'Enabled'
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldLogs'
            Status: 'Enabled'
            ExpirationInDays: 90

  # S3 Bucket for secure storage
  TapStackSecureBucket:
    Type: 'AWS::S3::Bucket'
    DependsOn: TapStackLogsBucket
    Properties:
      BucketName: !Sub 'tapstack-secure-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: 'Enabled'
      LoggingConfiguration:
        DestinationBucketName: !Ref TapStackLogsBucket
        LogFilePrefix: 'access-logs/'

  # S3 Bucket Policy for secure bucket
  TapStackSecureBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref TapStackSecureBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPublicAccess'
            Effect: 'Deny'
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${TapStackSecureBucket}/*'
              - !Ref TapStackSecureBucket
            Condition:
              StringEquals:
                's3:x-amz-acl': 
                  - 'public-read'
                  - 'public-read-write'
                  - 'authenticated-read'
          - Sid: 'DenyUnSecureCommunications'
            Effect: 'Deny'
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${TapStackSecureBucket}/*'
              - !Ref TapStackSecureBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # CloudTrail for logging
  TapStackCloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn: TapStackLogsBucket
    Properties:
      TrailName: !Sub 'TapStack-CloudTrail-${Environment}'
      S3BucketName: !Ref TapStackLogsBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref TapStackKMSKey
      EventSelectors:
        - ReadWriteType: 'All'
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${TapStackSecureBucket}/*'

  # VPC in us-west-2
  VPCWest:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VPCCidrWest
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-VPC-West-${Environment}'
        - Key: 'Environment'
          Value: !Ref Environment

  # Public Subnet in us-west-2
  PublicSubnetWest1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: !Select [0, !Cidr [!Ref VPCCidrWest, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Public-Subnet-West-1-${Environment}'

  PublicSubnetWest2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: !Select [1, !Cidr [!Ref VPCCidrWest, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Public-Subnet-West-2-${Environment}'

  # Private Subnets in us-west-2
  PrivateSubnetWest1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: !Select [2, !Cidr [!Ref VPCCidrWest, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Private-Subnet-West-1-${Environment}'

  PrivateSubnetWest2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: !Select [3, !Cidr [!Ref VPCCidrWest, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Private-Subnet-West-2-${Environment}'

  # Internet Gateway
  InternetGatewayWest:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-IGW-West-${Environment}'

  AttachGatewayWest:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPCWest
      InternetGatewayId: !Ref InternetGatewayWest

  # NAT Gateway
  NATGatewayWest:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt EIPNATWest.AllocationId
      SubnetId: !Ref PublicSubnetWest1
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-NAT-West-${Environment}'

  EIPNATWest:
    Type: 'AWS::EC2::EIP'
    DependsOn: AttachGatewayWest
    Properties:
      Domain: 'vpc'

  # Route Tables
  PublicRouteTableWest:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPCWest
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Public-RT-West-${Environment}'

  PrivateRouteTableWest:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPCWest
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Private-RT-West-${Environment}'

  # Routes
  PublicRouteWest:
    Type: 'AWS::EC2::Route'
    DependsOn: AttachGatewayWest
    Properties:
      RouteTableId: !Ref PublicRouteTableWest
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGatewayWest

  PrivateRouteWest:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTableWest
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayWest

  # Route Table Associations
  PublicSubnetRouteTableAssociationWest1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnetWest1
      RouteTableId: !Ref PublicRouteTableWest

  PublicSubnetRouteTableAssociationWest2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnetWest2
      RouteTableId: !Ref PublicRouteTableWest

  PrivateSubnetRouteTableAssociationWest1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnetWest1
      RouteTableId: !Ref PrivateRouteTableWest

  PrivateSubnetRouteTableAssociationWest2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnetWest2
      RouteTableId: !Ref PrivateRouteTableWest

  # Security Groups
  ALBSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: 'tcp'
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS traffic'
        - IpProtocol: 'tcp'
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP traffic for redirect'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-ALB-SG-${Environment}'

  WebServerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: 'tcp'
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: 'tcp'
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB'
        - IpProtocol: 'tcp'
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref VPNTunnelCIDR
          Description: 'SSH from VPN tunnel only'
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-WebServer-SG-${Environment}'

  DatabaseSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: 'tcp'
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-Database-SG-${Environment}'

  # IAM Role for Cross-Account Access
  CrossAccountAccessRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub 'TapStack-CrossAccount-Role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              AWS: !Ref CrossAccountRoleArn
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Policies:
        - PolicyName: 'MinimalS3Access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${TapStackSecureBucket}/*'
              - Effect: 'Allow'
                Action:
                  - 's3:ListBucket'
                Resource: !Ref TapStackSecureBucket

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub 'TapStack-EC2-Role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: 'S3AccessPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${TapStackSecureBucket}/*'

  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # IAM Role for RDS Monitoring
  RDSMonitoringRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub 'TapStack-RDS-Monitoring-Role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'monitoring.rds.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Name: !Sub 'TapStack-ALB-${Environment}'
      Scheme: 'internet-facing'
      Type: 'application'
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnetWest1
        - !Ref PublicSubnetWest2
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-ALB-${Environment}'

  # ALB Target Group
  ALBTargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: !Sub 'TapStack-TG-${Environment}'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref VPCWest
      HealthCheckPath: '/health'
      HealthCheckProtocol: 'HTTP'
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: 'instance'

  # Self-signed certificate for ALB (for demo purposes)
  # In production, use ACM with proper domain validation
  ALBListenerHTTPS:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      DefaultActions:
        - Type: 'forward'
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: 'HTTPS'
      Certificates:
        - CertificateArn: !Sub 'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/12345678-1234-1234-1234-123456789012'
      SslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01'

  # ALB Listener for HTTP (redirect to HTTPS)
  ALBListenerHTTP:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      DefaultActions:
        - Type: 'redirect'
          RedirectConfig:
            Protocol: 'HTTPS'
            Port: '443'
            StatusCode: 'HTTP_301'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: 'HTTP'

  # WAF Web ACL
  WebACL:
    Type: 'AWS::WAFv2::WebACL'
    Properties:
      Name: !Sub 'TapStack-WAF-${Environment}'
      Scope: 'REGIONAL'
      DefaultAction:
        Allow: {}
      Rules:
        - Name: 'AWSManagedRulesCommonRuleSet'
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesCommonRuleSet'
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'CommonRuleSetMetric'
        - Name: 'AWSManagedRulesKnownBadInputsRuleSet'
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesKnownBadInputsRuleSet'
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'KnownBadInputsRuleSetMetric'
        - Name: 'RateLimitRule'
          Priority: 3
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: 'IP'
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'RateLimitRuleMetric'
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'TapStack-WAF-${Environment}'

  # WAF Association with ALB
  WebACLAssociation:
    Type: 'AWS::WAFv2::WebACLAssociation'
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # RDS Subnet Group
  DBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnetWest1
        - !Ref PrivateSubnetWest2
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-DB-SubnetGroup-${Environment}'

  # RDS Instance
  RDSInstance:
    Type: 'AWS::RDS::DBInstance'
    DeletionPolicy: 'Snapshot'
    Properties:
      DBInstanceIdentifier: !Sub 'tapstack-db-${Environment}'
      DBInstanceClass: !FindInMap [EnvironmentMap, !Ref Environment, DBInstanceClass]
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref TapStackKMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProduction, true, false]
      AutoMinorVersionUpgrade: true
      DeletionProtection: !If [IsProduction, true, false]
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref TapStackKMSKey
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      Tags:
        - Key: 'Name'
          Value: !Sub 'TapStack-RDS-${Environment}'
        - Key: 'Environment'
          Value: !Ref Environment

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: !Sub 'TapStack-LaunchTemplate-${Environment}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>TapStack ${Environment} Environment</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeSize: 20
              VolumeType: 'gp3'
              Encrypted: true
              KmsKeyId: !Ref
```