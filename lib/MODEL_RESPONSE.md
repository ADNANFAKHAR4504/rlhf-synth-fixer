AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-Ready Highly Available Web Application Architecture with Security Best Practices'

# ====================================
# PARAMETERS
# ====================================
Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
    ConstraintDescription: Must be an existing EC2 KeyPair

  DBMasterUsername:
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database master username

  AlertEmail:
    Type: String
    Description: Email address for SNS notifications
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'

  DomainName:
    Type: String
    Description: Domain name for the application
    Default: example.com

# ====================================
# MAPPINGS
# ====================================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c

# ====================================
# RESOURCES
# ====================================
Resources:

  # KMS
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for application encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableIAMUserPermissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowServiceUse
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - rds.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
                - lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-app-key'
      TargetKeyId: !Ref ApplicationKMSKey

  # VPC and networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: cost-center
          Value: '1234'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.30.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnet1'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Database

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.40.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnet2'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Database

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT1-EIP'
        - Key: cost-center
          Value: '1234'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT2-EIP'
        - Key: cost-center
          Value: '1234'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway1'
        - Key: cost-center
          Value: '1234'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway2'
        - Key: cost-center
          Value: '1234'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: cost-center
          Value: '1234'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
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
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
        - Key: cost-center
          Value: '1234'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
        - Key: cost-center
          Value: '1234'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
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
                Resource: '*'
      Tags:
        - Key: cost-center
          Value: '1234'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${AWS::StackName}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPCFlowLog'
        - Key: cost-center
          Value: '1234'

  # SECURITY GROUPS
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from anywhere (redirect to HTTPS)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
          Description: Allow outbound to VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: cost-center
          Value: '1234'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
          Description: SSH from admin network (replace with your IP)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
          Description: Allow outbound to VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'
        - Key: cost-center
          Value: '1234'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion Host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Replace with admin IP in production
          Description: SSH from specific IPs
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Bastion-SG'
        - Key: cost-center
          Value: '1234'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL from web servers
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: MySQL from Lambda functions
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SG'
        - Key: cost-center
          Value: '1234'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to anywhere
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/8
          Description: MySQL to database
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Lambda-SG'
        - Key: cost-center
          Value: '1234'

  # SECRETS MANAGER
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: RDS Master Database Password
      KmsKeyId: !Ref ApplicationKMSKey
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      Tags:
        - Key: cost-center
          Value: '1234'

  # RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: cost-center
          Value: '1234'

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.42'                     # <-- updated to a supported version
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref ApplicationKMSKey
      PerformanceInsightsRetentionPeriod: 7
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db-replica'
      SourceDBInstanceIdentifier: !Ref RDSDatabase
      DBInstanceClass: db.t3.medium
      PubliclyAccessible: false
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: cost-center
          Value: '1234'

  SecretRDSAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBPasswordSecret
      TargetId: !Ref RDSDatabase
      TargetType: AWS::RDS::DBInstance

  # S3 buckets (note: use KMSMasterKeyID for S3 server-side encryption)
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref ApplicationKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 60
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 's3-logs/'
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAccessLogs
            Status: Enabled
            ExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: cost-center
          Value: '1234'

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LogsBucket.Arn
              - !Sub '${LogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${LogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  - !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: cost-center
          Value: '1234'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ALB
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: true
        - Key: access_logs.s3.bucket
          Value: !Ref LogsBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: deletion_protection.enabled
          Value: true
        - Key: idle_timeout.timeout_seconds
          Value: 60
        - Key: routing.http2.enabled
          Value: true
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: true
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: !Ref Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 443
      Protocol: HTTPS
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTPS
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-299
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: 30
        - Key: stickiness.enabled
          Value: true
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: 86400
      Tags:
        - Key: cost-center
          Value: '1234'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  ALBListenerHTTP:
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

  # ACM and Route53
  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZone
      Tags:
        - Key: cost-center
          Value: '1234'

  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName}'
      HostedZoneTags:
        - Key: cost-center
          Value: '1234'

  # Launch template and ASG
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        KeyName: !Ref KeyPairName
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref ApplicationKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          InstanceMetadataTags: enabled
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/messages",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {
                        "name": "mem_used_percent",
                        "rename": "MemoryUtilization"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: cost-center
                Value: '1234'
              - Key: Environment
                Value: !Ref Environment

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 4
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupInServiceInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: cost-center
          Value: '1234'
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  # WAF
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-WebACL'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
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
        - Name: SQLiRule
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRule
        - Name: CommonRule
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-WebACL'
      Tags:
        - Key: cost-center
          Value: '1234'

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # CloudFront (logging bucket must be bucket name)
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub 'CloudFront distribution for ${AWS::StackName}'
        Enabled: true
        HttpVersion: http2
        DefaultRootObject: index.html
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: !Ref ACMCertificate
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf
          ResponseHeadersPolicyId: 67f7725c-6f97-4210-82d7-5512b31e9d03
        Logging:
          Bucket: !Ref AccessLogsBucket
          Prefix: cloudfront/
          IncludeCookies: false
        WebACLId: !GetAtt WebACL.Arn
      Tags:
        - Key: cost-center
          Value: '1234'

  # Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: 'arn:aws:logs:*:*:*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt ApplicationKMSKey.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${LogsBucket.Arn}/*'
      Tags:
        - Key: cost-center
          Value: '1234'

  DataProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-DataProcessor'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DB_SECRET_ARN: !Ref DBPasswordSecret
          KMS_KEY_ID: !Ref ApplicationKMSKey
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def handler(event, context):
              return {'statusCode': 200, 'body': json.dumps('Data processing completed')}
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Tags:
        - Key: cost-center
          Value: '1234'

  # SNS
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Alerts'
      DisplayName: Application Alerts
      KmsMasterKeyId: !Ref ApplicationKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: cost-center
          Value: '1234'

  # CloudWatch alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Triggers when CPU utilization is high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DatabaseHighCPU'
      AlarmDescription: Triggers when database CPU is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase

  UnHealthyTargetAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnhealthyTargets'
      AlarmDescription: Triggers when targets are unhealthy
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  # CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
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
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: cost-center
          Value: '1234'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-Trail'
      S3BucketName: !Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${LogsBucket.Arn}/'
          # removed unsupported AWS::RDS::DBCluster data resource (not valid in this validator)
      IsLogging: true
      IsMultiRegionTrail: true
      Tags:
        - Key: cost-center
          Value: '1234'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTrailLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: cost-center
          Value: '1234'

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
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # AWS Config
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
      Tags:
        - Key: cost-center
          Value: '1234'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-ConfigRecorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-ConfigDeliveryChannel'
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref AlertTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-config-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldConfigs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: cost-center
          Value: '1234'

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: required-tags
      Description: Checks whether resources have the required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance
      InputParameters: |
        {
          "tag1Key": "cost-center"
        }

  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

# ====================================
# OUTPUTS
# ====================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  CloudFrontDomain:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-Domain'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  SNSTopic:
    Description: SNS Topic ARN for Alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'

  LogsBucket:
    Description: S3 Bucket for Logs
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Logs-Bucket'

  KMSKeyId:
    Description: KMS Key ID for Encryption
    Value: !Ref ApplicationKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'
<<<<<<< HEAD
=======

>>>>>>> 7e434f8fa5554304eacc8eaf9cabe16c537c4712
