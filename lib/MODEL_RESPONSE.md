# AWS CloudFormation YAML Infrastructure for Secure Web Application

I'll create a comprehensive CloudFormation template that addresses all your requirements. Due to the complexity, I'll structure this as a main template with nested stacks for better organization.

## Main CloudFormation Template: `secure-web-app-setup.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, scalable web application infrastructure with multi-region deployment, GDPR compliance, and comprehensive security controls'

Parameters:
  ProjectName:
    Type: String
    Default: 'securewebapp'
    Description: 'Project name for resource naming convention'
    AllowedPattern: '^[a-z0-9]+$'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment for deployment'

  PrimaryRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Primary AWS region'

  SecondaryRegion:
    Type: String
    Default: 'eu-west-1'
    Description: 'Secondary AWS region for DR'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    NoEcho: true

  NotificationEmail:
    Type: String
    Description: 'Email for security notifications'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - Environment
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PrimaryRegion
          - SecondaryRegion
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBMasterUsername
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - NotificationEmail

Resources:
  # =============================================================================
  # KMS Keys for Encryption
  # =============================================================================

  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${ProjectName}-${Environment} - Application encryption key'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Application encryption'

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-app-key'
      TargetKeyId: !Ref ApplicationKMSKey

  # =============================================================================
  # VPC and Networking
  # =============================================================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Type
          Value: 'Private'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-1'
        - Key: Type
          Value: 'Database'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-2'
        - Key: Type
          Value: 'Database'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Database Route Table
  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-rt'

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet2

  # =============================================================================
  # Security Groups
  # =============================================================================

  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP traffic from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'HTTP to web servers'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'HTTPS to web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-sg'
        - Key: Purpose
          Value: 'Load balancer security'

  # Web Server Security Group
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from bastion host'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for updates'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL to database'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-sg'
        - Key: Purpose
          Value: 'Web server security'

  # Database Security Group
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-db-sg'
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'MySQL from bastion for admin'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'
        - Key: Purpose
          Value: 'Database security'

  # Bastion Host Security Group
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # In production, restrict to specific IP ranges
          Description: 'SSH access to bastion'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'SSH to web servers'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL to database'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for updates'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion-sg'
        - Key: Purpose
          Value: 'Bastion host security'

  # =============================================================================
  # Network ACLs for Additional Security
  # =============================================================================

  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-nacl'

  PublicInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  # =============================================================================
  # IAM Roles and Policies
  # =============================================================================

  # EC2 Instance Role for Web Servers
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-web-server-role'
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
        - PolicyName: WebServerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt ApplicationKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}-${Environment}*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-server-role'
        - Key: Purpose
          Value: 'Web server IAM role with least privilege'

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-web-server-profile'
      Roles:
        - !Ref WebServerRole

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaSecurityPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:Encrypt
                Resource: !GetAtt ApplicationKMSKey.Arn
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:PutParameter
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-role'

  # =============================================================================
  # Parameter Store for Secure Configuration
  # =============================================================================

  DatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/database/password'
      Type: SecureString
      Value: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      KeyId: !Ref ApplicationKMSKey
      Description: 'Database master password'
      Tags:
        Environment: !Ref Environment
        Purpose: 'Database credentials'

  # =============================================================================
  # Secrets Manager for Database Credentials
  # =============================================================================

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-db-credentials'
      Description: 'Database master credentials'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref ApplicationKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-secret'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # RDS Database
  # =============================================================================

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'

  DatabaseCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Sub '${ProjectName}-${Environment}-db-cluster'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.02.0'
      MasterUsername: !Ref DBMasterUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        KmsKeyId: !Ref ApplicationKMSKey
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-cluster'
        - Key: Environment
          Value: !Ref Environment
        - Key: BackupRetention
          Value: '30-days'

  DatabasePrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db-primary'
      DBClusterIdentifier: !Ref DatabaseCluster
      DBInstanceClass: db.r6g.large
      Engine: aurora-mysql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref ApplicationKMSKey
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-primary'
        - Key: Environment
          Value: !Ref Environment

  DatabaseReplicaInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db-replica'
      DBClusterIdentifier: !Ref DatabaseCluster
      DBInstanceClass: db.r6g.large
      Engine: aurora-mysql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref ApplicationKMSKey
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-replica'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # Application Load Balancer
  # =============================================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref AccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # S3 Buckets for Logs and Static Content
  # =============================================================================

  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-access-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'ALB access logs storage'

  AccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AccessLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::Region}:root'  # ELB service account for the region
            Action: s3:PutObject
            Resource: !Sub '${AccessLogsBucket}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::Region}:root'
            Action: s3:GetBucketAcl
            Resource: !Ref AccessLogsBucket

  # =============================================================================
  # CloudWatch Logs and Monitoring
  # =============================================================================

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties
```
