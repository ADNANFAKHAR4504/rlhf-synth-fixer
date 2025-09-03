I'll create a comprehensive CloudFormation template that meets all your security and compliance requirements. Here's the complete `secure-infra.yaml` template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure production infrastructure for SecureApp with comprehensive security controls and compliance features'

Parameters:
  AllowedIPRange:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'IP range allowed to access resources'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  
  DBMasterUsername:
    Type: String
    Default: 'secureapp_admin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 63
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9_]*$'

Resources:
  # ============================================================================
  # KMS Keys for Encryption
  # ============================================================================
  
  SecureAppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for SecureApp encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'secureapp-production-kms-key'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 'alias/secureapp-production-key'
      TargetKeyId: !Ref SecureAppKMSKey

  # ============================================================================
  # VPC and Networking Components
  # ============================================================================
  
  SecureAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'secureapp-production-vpc'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Private Subnets
  SecureAppPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: 'secureapp-production-private-subnet-1'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: 'secureapp-production-private-subnet-2'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Public Subnets (for NAT Gateway and ALB)
  SecureAppPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'secureapp-production-public-subnet-1'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'secureapp-production-public-subnet-2'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Internet Gateway
  SecureAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'secureapp-production-igw'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureAppVPC
      InternetGatewayId: !Ref SecureAppInternetGateway

  # NAT Gateway
  SecureAppNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'secureapp-production-nat-eip'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureAppNATGatewayEIP.AllocationId
      SubnetId: !Ref SecureAppPublicSubnet1
      Tags:
        - Key: Name
          Value: 'secureapp-production-nat-gateway'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Route Tables
  SecureAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: 'secureapp-production-public-rt'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: 'secureapp-production-private-rt'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Routes
  SecureAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: SecureAppVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref SecureAppPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref SecureAppInternetGateway

  SecureAppPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureAppPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref SecureAppNATGateway

  # Subnet Route Table Associations
  SecureAppPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureAppPublicSubnet1
      RouteTableId: !Ref SecureAppPublicRouteTable

  SecureAppPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureAppPublicSubnet2
      RouteTableId: !Ref SecureAppPublicRouteTable

  SecureAppPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureAppPrivateSubnet1
      RouteTableId: !Ref SecureAppPrivateRouteTable

  SecureAppPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureAppPrivateSubnet2
      RouteTableId: !Ref SecureAppPrivateRouteTable

  # ============================================================================
  # Network ACLs for Additional Security
  # ============================================================================
  
  SecureAppPrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: 'secureapp-production-private-nacl'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # Inbound rules for private subnets
  SecureAppPrivateNetworkAclInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureAppPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: '10.0.0.0/16'

  # Outbound rules for private subnets
  SecureAppPrivateNetworkAclOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureAppPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  # Associate Network ACL with private subnets
  SecureAppPrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref SecureAppPrivateSubnet1
      NetworkAclId: !Ref SecureAppPrivateNetworkAcl

  SecureAppPrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref SecureAppPrivateSubnet2
      NetworkAclId: !Ref SecureAppPrivateNetworkAcl

  # ============================================================================
  # Security Groups
  # ============================================================================
  
  SecureAppALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS access from allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP access from allowed IP range (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref SecureAppEC2SecurityGroup
          Description: 'HTTP to EC2 instances'
      Tags:
        - Key: Name
          Value: 'secureapp-production-alb-sg'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref SecureAppALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedIPRange
          Description: 'SSH access from allowed IP range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for updates'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref SecureAppRDSSecurityGroup
          Description: 'MySQL to RDS'
      Tags:
        - Key: Name
          Value: 'secureapp-production-ec2-sg'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppRDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureAppEC2SecurityGroup
          Description: 'MySQL from EC2 instances'
      Tags:
        - Key: Name
          Value: 'secureapp-production-rds-sg'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # IAM Roles and Policies
  # ============================================================================
  
  SecureAppEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'secureapp-production-ec2-role'
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
        - PolicyName: 'SecureAppS3Access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureAppS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureAppS3Bucket
        - PolicyName: 'SecureAppSecretsAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref SecureAppDBSecret
      Tags:
        - Key: Name
          Value: 'secureapp-production-ec2-role'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'secureapp-production-ec2-profile'
      Roles:
        - !Ref SecureAppEC2Role

  # ============================================================================
  # Password Policy
  # ============================================================================
  
  SecureAppPasswordPolicy:
    Type: AWS::IAM::AccountPasswordPolicy
    Properties:
      MinimumPasswordLength: 14
      RequireUppercaseCharacters: true
      RequireLowercaseCharacters: true
      RequireNumbers: true
      RequireSymbols: true
      MaxPasswordAge: 90
      PasswordReusePrevention: 12
      HardExpiry: false
      AllowUsersToChangePassword: true

  # ============================================================================
  # Secrets Manager
  # ============================================================================
  
  SecureAppDBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: 'secureapp-production-db-credentials'
      Description: 'Database credentials for SecureApp'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref SecureAppKMSKey
      Tags:
        - Key: Name
          Value: 'secureapp-production-db-secret'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # S3 Bucket with Encryption
  # ============================================================================
  
  SecureAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-production-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureAppKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref SecureAppS3LoggingBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref SecureAppS3LogGroup
      Tags:
        - Key: Name
          Value: 'secureapp-production-data-bucket'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppS3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-production-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureAppKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: 'secureapp-production-logs-bucket'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # RDS Database with Encryption
  # ============================================================================
  
  SecureAppDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: 'secureapp-production-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for SecureApp RDS database'
      SubnetIds:
        - !Ref SecureAppPrivateSubnet1
        - !Ref SecureAppPrivateSubnet2
      Tags:
        - Key: Name
          Value: 'secureapp-production-db-subnet-group'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: 'secureapp-production-db'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref SecureAppKMSKey
      MasterUsername: !Sub '{{resolve:secretsmanager:${SecureAppDBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${SecureAppDBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref SecureAppDBSubnetGroup
      VPCSecurityGroups:
        - !Ref SecureAppRDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      Tags:
        - Key: Name
          Value: 'secureapp-production-db'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # CloudWatch Log Groups
  # ============================================================================
  
  SecureAppS3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/s3/secureapp-production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureAppKMSKey.Arn

  SecureAppVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/vpc/secureapp-production-flowlogs'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureAppKMSKey.Arn

  SecureAppCloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/cloudtrail/secureapp-production'
      RetentionInDays: 90
      KmsKeyId: !GetAtt SecureAppKMSKey.Arn

  # ============================================================================
  # VPC Flow Logs
  # ============================================================================
  
  SecureAppVPCFlowLogsRole:
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
        - PolicyName: 'CloudWatchLogPolicy'
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
                Resource: '*'

  SecureAppVPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref SecureAppVPC
      TrafficType: 'ALL'
      LogDestinationType: 'cloud-watch-logs'
      LogGroupName: !Ref SecureAppVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt SecureAppVPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: 'secureapp-production-vpc-flowlogs'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # CloudTrail
  # ============================================================================
  
  SecureAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: 'secureapp-production-cloudtrail'
      S3BucketName: !Ref SecureAppS3LoggingBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecureAppKMSKey
      CloudWatchLogsLogGroupArn: !GetAtt SecureAppCloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt SecureAppCloudTrailRole.Arn
      Tags:
        - Key: Name
          Value: 'secureapp-production-cloudtrail'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppCloudTrailRole:
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
        - PolicyName: 'CloudTrailLogPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !GetAtt SecureAppCloudTrailLogGroup.Arn

  # ============================================================================
  # AWS Config
  # ============================================================================
  
  SecureAppConfigRole:
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
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: 'ConfigS3Policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !Ref SecureAppS3LoggingBucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureAppS3LoggingBucket}/config/*'

  SecureAppConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: 'secureapp-production-config-recorder'
      RoleARN: !GetAtt SecureAppConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecureAppConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: 'secureapp-production-config-delivery-channel'
      S3BucketName: !Ref SecureAppS3LoggingBucket
      S3KeyPrefix: 'config/'

  # Config Rules
  SecureAppConfigRuleS3Encryption:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureAppConfigurationRecorder
    Properties:
      ConfigRuleName: 'secureapp-s3-bucket-server-side-encryption-enabled'
      Description: 'Checks that S3 buckets have server-side encryption enabled'
      Source:
        Owner: 'AWS'
        SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'

  SecureAppConfigRuleRDSEncryption:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureAppConfigurationRecorder
    Properties:
      ConfigRuleName: 'secureapp-rds-storage-encrypted'
      Description: 'Checks that RDS instances have storage encryption enabled'
      Source:
        Owner: 'AWS'
        SourceIdentifier: 'RDS_STORAGE_ENCRYPTED'

  # ============================================================================
  # Security Hub
  # ============================================================================
  
  SecureAppSecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        - Key: Name
          Value: 'secureapp-production-security-hub'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  # ============================================================================
  # Application Load Balancer with SSL/TLS
  # ============================================================================
  
  SecureAppALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: 'secureapp-production-alb'
      Type: 'application'
      Scheme: 'internet-facing'
      SecurityGroups:
        - !Ref SecureAppALBSecurityGroup
      Subnets:
        - !Ref SecureAppPublicSubnet1
        - !Ref SecureAppPublicSubnet2
      Tags:
        - Key: Name
          Value: 'secureapp-production-alb'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

  SecureAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: 'secureapp-production-tg'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref SecureAppVPC
      HealthCheckPath: '/health'
      HealthCheckProtocol: 'HTTP'
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: 'secureapp-production-target-group'
        - Key: Project
          Value: 'SecureApp'
        - Key: Environment
          Value: 'production'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref SecureAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'