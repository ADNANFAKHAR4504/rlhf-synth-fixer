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
  # ====================================
  # KMS KEYS
  # ====================================
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for application encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: 
                Fn::Sub: 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
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
          Value: "EnvironmentPlaceholder"
  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 
        Fn::Sub: 'alias/${AWS::StackName}-app-key'
      TargetKeyId:
        Ref: ApplicationKMSKey
  # ====================================
  # VPC AND NETWORKING
  # ====================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 
          Fn::Sub: '${AWS::StackName}-VPC'
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: production
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value:
          Fn::Sub: '${AWS::StackName}-IGW'
        - Key: cost-center
          Value: '1234'
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: { Ref: VPC }
      InternetGatewayId: { Ref: InternetGateway }
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.1.0/24
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ""
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${AWS::StackName}-PublicSubnet1'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: { Fn::Select: [1, Fn::GetAZs: ""] }
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PublicSubnet2' }
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: { Fn::Select: [0, Fn::GetAZs: ""] }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PrivateSubnet1' }
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: { Fn::Select: [1, Fn::GetAZs: ""] }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PrivateSubnet2' }
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.30.0/24
      AvailabilityZone: { Fn::Select: [0, Fn::GetAZs: ""] }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-DBSubnet1' }
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Database
  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: { Ref: VPC }
      CidrBlock: 10.0.40.0/24
      AvailabilityZone: { Fn::Select: [1, Fn::GetAZs: ""] }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-DBSubnet2' }
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
          Value: { Fn::Sub: '${AWS::StackName}-NAT1-EIP' }
        - Key: cost-center
          Value: '1234'
  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-NAT2-EIP' }
        - Key: cost-center
          Value: '1234'
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: { Fn::GetAtt: [NATGateway1EIP, AllocationId] }
      SubnetId: { Ref: PublicSubnet1 }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-NATGateway1' }
        - Key: cost-center
          Value: '1234'
  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: { Fn::GetAtt: [NATGateway2EIP, AllocationId] }
      SubnetId: { Ref: PublicSubnet2 }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-NATGateway2' }
        - Key: cost-center
          Value: '1234'
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: { Ref: VPC }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PublicRouteTable' }
        - Key: cost-center
          Value: '1234'
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: { Ref: PublicRouteTable }
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: { Ref: InternetGateway }
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: { Ref: PublicSubnet1 }
      RouteTableId: { Ref: PublicRouteTable }
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: { Ref: PublicSubnet2 }
      RouteTableId: { Ref: PublicRouteTable }
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: { Ref: VPC }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PrivateRouteTable1' }
        - Key: cost-center
          Value: '1234'
  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: { Ref: PrivateRouteTable1 }
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: { Ref: NATGateway1 }
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: { Ref: PrivateSubnet1 }
      RouteTableId: { Ref: PrivateRouteTable1 }
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: { Ref: VPC }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-PrivateRouteTable2' }
        - Key: cost-center
          Value: '1234'
  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: { Ref: PrivateRouteTable2 }
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: { Ref: NATGateway2 }
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: { Ref: PrivateSubnet2 }
      RouteTableId: { Ref: PrivateRouteTable2 }
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
      LogGroupName: { Fn::Sub: '/aws/vpc/flowlogs/${AWS::StackName}' }
      RetentionInDays: 30
      KmsKeyId: { Fn::GetAtt: [ ApplicationKMSKey, Arn ] }
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId:
        Ref: VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: { Ref: VPCFlowLogGroup }
      DeliverLogsPermissionArn: { GetAtt: VPCFlowLogsRole.Arn }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-VPCFlowLog' }
        - Key: cost-center
          Value: '1234'
  # ====================================
  # SECURITY GROUPS
  # ====================================
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: { Ref: VPC }
      GroupDescription: Enable SSH and HTTP access
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: '22'
          ToPort: '22'
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: '80'
          ToPort: '80'
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-InstanceSG' }
        - Key: cost-center
          Value: '1234'
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: { Ref: VPC }
      GroupDescription: Enable HTTP and HTTPS access for load balancer
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: '80'
          ToPort: '80'
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: '443'
          ToPort: '443'
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-LB-SG' }
        - Key: cost-center
          Value: '1234'
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: { Ref: VPC }
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: { Ref: WebServerSecurityGroup }
          Description: HTTPS to web servers
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-ALB-SG' }
        - Key: cost-center
          Value: '1234'
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: { Ref: VPC }
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: { Ref: ALBSecurityGroup }
          Description: HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: { Ref: BastionSecurityGroup }
          Description: SSH from Bastion
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-WebServer-SG' }
        - Key: cost-center
          Value: '1234'
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion Host
      VpcId: { Ref: VPC }
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict this to your IP in production
          Description: SSH from specific IPs
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-Bastion-SG' }
        - Key: cost-center
          Value: '1234'
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: { Ref: VPC }
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: { Ref: WebServerSecurityGroup }
          Description: MySQL from web servers
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: { Ref: LambdaSecurityGroup }
          Description: MySQL from Lambda functions
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-Database-SG' }
        - Key: cost-center
          Value: '1234'
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: { Ref: VPC }
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to anywhere
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: { Ref: DatabaseSecurityGroup }
          Description: MySQL to database
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-Lambda-SG' }
        - Key: cost-center
          Value: '1234'
  # ====================================
  # EC2 INSTANCES
  # ====================================
  WebServer1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      KeyName: { Ref: KeyPairName }
      ImageId: { Fn::FindInMap: [RegionMap, { Ref: AWS::Region }, AMI] }
      SubnetId: { Ref: PublicSubnet1 }
      SecurityGroupIds:
        - { Ref: InstanceSecurityGroup }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-WebServer1' }
        - Key: cost-center
          Value: '1234'
  WebServer2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      KeyName: { Ref: KeyPairName }
      ImageId: { Fn::FindInMap: [RegionMap, { Ref: AWS::Region }, AMI] }
      SubnetId: { Ref: PublicSubnet2 }
      SecurityGroupIds:
        - { Ref: InstanceSecurityGroup }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-WebServer2' }
        - Key: cost-center
          Value: '1234'
  AppServer1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      KeyName: { Ref: KeyPairName }
      ImageId: { Fn::FindInMap: [RegionMap, { Ref: AWS::Region }, AMI] }
      SubnetId: { Ref: PrivateSubnet1 }
      SecurityGroupIds:
        - { Ref: InstanceSecurityGroup }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-AppServer1' }
        - Key: cost-center
          Value: '1234'
  AppServer2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      KeyName: { Ref: KeyPairName }
      ImageId: { Fn::FindInMap: [RegionMap, { Ref: AWS::Region }, AMI] }
      SubnetId: { Ref: PrivateSubnet2 }
      SecurityGroupIds:
        - { Ref: InstanceSecurityGroup }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-AppServer2' }
        - Key: cost-center
          Value: '1234'
  # ====================================
  # LOAD BALANCER
  # ====================================
  LoadBalancer:
    Type: AWS::ElasticLoadBalancing::LoadBalancer
    Properties:
      AvailabilityZones: { Fn::GetAZs: '' }
      Listeners:
        - LoadBalancerPort: '80'
          InstancePort: '80'
          Protocol: HTTP
        - LoadBalancerPort: '443'
          InstancePort: '443'
          Protocol: HTTPS
      HealthCheck:
        Target: HTTP:80/
        Interval: '30'
        Timeout: '5'
        UnhealthyThreshold: '2'
        HealthyThreshold: '2'
      SecurityGroups:
        - { Ref: LoadBalancerSecurityGroup }
      Subnets:
        - { Ref: PublicSubnet1 }
        - { Ref: PublicSubnet2 }
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-LoadBalancer' }
        - Key: cost-center
          Value: '1234'
  # ====================================
  # RDS DATABASE
  # ====================================
  DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t2.micro
      Engine: mysql
      MasterUsername: { Ref: DBMasterUsername }
      MasterUserPassword: { Ref: DBPassword }
      DBName: { Ref: DBName }
      AllocatedStorage: '20'
      StorageType: gp2
      VPCSecurityGroups:
        - { Ref: DBSecurityGroup }
      DBSubnetGroupName: { Ref: DBSubnetGroup }
      MultiAZ: false
      EngineVersion: '5.7'
      BackupRetentionPeriod: '7'
      Tags:
        - Key: Name
          Value: { Fn::Sub: '${AWS::StackName}-DBInstance' }
        - Key: cost-center
          Value: '1234'
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - { Ref: DBSubnet1 }
        - { Ref: DBSubnet2 }
      Tags:
        - Key: cost-center
          Value: '1234'
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: { Fn::Sub: '${AWS::StackName}-db' }
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: { Fn::Sub: '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:username}}' }
      MasterUserPassword: { Fn::Sub: '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}' }
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: { Ref: ApplicationKMSKey }
      DBSubnetGroupName: { Ref: DBSubnetGroup }
      VPCSecurityGroups:
        - { Ref: DatabaseSecurityGroup }
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: { Ref: ApplicationKMSKey }
      PerformanceInsightsRetentionPeriod: 7
      MonitoringInterval: 60
      MonitoringRoleArn: { GetAtt: RDSEnhancedMonitoringRole.Arn }
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: { Ref: Environment }
  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: { Fn::Sub: '${AWS::StackName}-db-replica' }
      SourceDBInstanceIdentifier: { Ref: RDSDatabase }
      DBInstanceClass: db.t3.medium
      PubliclyAccessible: false
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: { Ref: Environment }
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
      SecretId: { Ref: DBPasswordSecret }
      TargetId: { Ref: RDSDatabase }
      TargetType: AWS::RDS::DBInstance
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: { Fn::Sub: '${AWS::StackName}-logs-${AWS::AccountId}' }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: { Ref: ApplicationKMSKey }
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
        DestinationBucketName: { Ref: AccessLogsBucket }
        LogFilePrefix: 's3-logs/'
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value: { Ref: Environment }
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: { Fn::Sub: '${AWS::StackName}-access-logs-${AWS::AccountId}' }
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
      Bucket: { Ref: LogsBucket }
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - { GetAtt: LogsBucket.Arn }
              - { Fn::Sub: '${LogsBucket.Arn}/*' }
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
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
                  - { Fn::Sub: '${LogsBucket.Arn}/*' }
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  - { Ref: DBPasswordSecret }
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - { GetAtt: ApplicationKMSKey.Arn }
      Tags:
        - Key: cost-center
          Value: '1234'
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - { Ref: EC2Role }
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: { Fn::Sub: '${AWS::StackName}-ALB' }
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - { Ref: ALBSecurityGroup }
      Subnets:
        - { Ref: PublicSubnet1 }
        - { Ref: PublicSubnet2 }
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: true
        - Key: access_logs.s3.bucket
          Value: { Ref: LogsBucket }
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
          Value: { Ref: Environment }
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: { Fn::Sub: '${AWS::StackName}-TG' }
      Port: 443
      Protocol: HTTPS
      VpcId: { Ref: VPC }
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
          TargetGroupArn: { Ref: ALBTargetGroup }
      LoadBalancerArn: { Ref: ApplicationLoadBalancer }
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: { Ref: ACMCertificate }
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
      LoadBalancerArn: { Ref: ApplicationLoadBalancer }
      Port: 80
      Protocol: HTTP
  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: { Ref: DomainName }
      SubjectAlternativeNames:
        - { Fn::Sub: '*.${DomainName}' }
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: { Ref: DomainName }
          HostedZoneId: { Ref: HostedZone }
      Tags:
        - Key: cost-center
          Value: '1234'
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: { Ref: DomainName }
      HostedZoneConfig:
        Comment: { Fn::Sub: 'Hosted zone for ${DomainName}' }
      HostedZoneTags:
        - Key: cost-center
          Value: '1234'
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: { Fn::Sub: '${AWS::StackName}-LaunchTemplate' }
      LaunchTemplateData:
        ImageId: { Fn::FindInMap: [RegionMap, { Ref: 'AWS::Region' }, AMI] }
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: { Fn::GetAtt: [EC2InstanceProfile, Arn] }
        SecurityGroupIds:
          - { Ref: WebServerSecurityGroup }
        KeyName: { Ref: KeyPairName }
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: { Ref: ApplicationKMSKey }
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          InstanceMetadataTags: enabled
        UserData:
          Fn::Base64:
            Fn::Sub: |
              #Fn::/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              # Install and configure application
              # Add your application setup here
              # Configure CloudWatch agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
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
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: Fn::Sub '${AWS::StackName}-Instance'
              - Key: cost-center
                Value: '1234'
              - Key: Environment
                Value: { Ref: Environment }
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: Fn::Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: { Ref: LaunchTemplate }
        Version: { GetAtt: [LaunchTemplate, LatestVersionNumber] }
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 4
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - { Ref: PrivateSubnet1 }
        - { Ref: PrivateSubnet2 }
      TargetGroupARNs:
        - { Ref: ALBTargetGroup }
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupInServiceInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: Fn::Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: cost-center
          Value: '1234'
          PropagateAtLaunch: true
  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: { Ref: AutoScalingGroup }
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: Fn::Sub '${AWS::StackName}-WebACL'
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
        MetricName: Fn::Sub '${AWS::StackName}-WebACL'
      Tags:
        - Key: cost-center
          Value: '1234'
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: { Ref: ApplicationLoadBalancer }
      WebACLArn: { GetAtt: [WebACL, Arn] }
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: Fn::Sub 'CloudFront distribution for ${AWS::StackName}'
        Enabled: true
        HttpVersion: http2
        DefaultRootObject: index.html
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: { Ref: ACMCertificate }
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
        Origins:
          - Id: ALBOrigin
            DomainName: { GetAtt: [ApplicationLoadBalancer, DNSName] }
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
          Bucket: { GetAtt: [LogsBucket, DomainName] }
          Prefix: cloudfront/
          IncludeCookies: false
        WebACLId: { GetAtt: [WebACL, Arn] }
      Tags:
        - Key: cost-center
          Value: '1234'
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
                Resource: { Ref: DBPasswordSecret }
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: { GetAtt: [ApplicationKMSKey, Arn] }
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: { Sub: '${LogsBucket.Arn}/*' }
      Tags:
        - Key: cost-center
          Value: '1234'
  DataProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: Fn::Sub '${AWS::StackName}-DataProcessor'
      Runtime: python3.9
      Handler: index.handler
      Role: Fn::GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - Fn::Ref LambdaSecurityGroup
        SubnetIds:
          - Fn::Ref PrivateSubnet1
          - Fn::Ref PrivateSubnet2
      Environment:
        Variables:
          DB_SECRET_ARN: Fn::Ref DBPasswordSecret
          KMS_KEY_ID: Fn::Ref ApplicationKMSKey
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          def handler(event, context):
              # Sample Lambda function
              # Add your business logic here
              return {
                  'statusCode': 200,
                  'body': json.dumps('Data processing completed')
              }
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Tags:
        - Key: cost-center
          Value: '1234'
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: Fn::Sub '${AWS::StackName}-Alerts'
      DisplayName: Application Alerts
      KmsMasterKeyId: Fn::Ref ApplicationKMSKey
      Subscription:
        - Endpoint: Fn::Ref AlertEmail
          Protocol: email
      Tags:
        - Key: cost-center
          Value: '1234'
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Fn::Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Triggers when CPU utilization is high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Fn::Ref AlertTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: Fn::Ref AutoScalingGroup
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Fn::Sub '${AWS::StackName}-DatabaseHighCPU'
      AlarmDescription: Triggers when database CPU is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Fn::Ref AlertTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: Fn::Ref RDSDatabase
  UnHealthyTargetAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Fn::Sub '${AWS::StackName}-UnhealthyTargets'
      AlarmDescription: Triggers when targets are unhealthy
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 5
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - Fn::Ref AlertTopic
      Dimensions:
        - Name: TargetGroup
          Value: Fn::GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: Fn::GetAtt ApplicationLoadBalancer.LoadBalancerFullName
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: Fn::Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: 90
      KmsKeyId: Fn::GetAtt ApplicationKMSKey.Arn
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
                Resource: Fn::GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: cost-center
          Value: '1234'
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: Fn::Sub '${AWS::StackName}-Trail'
      S3BucketName: Fn::Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: Fn::GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: Fn::GetAtt CloudTrailRole.Arn
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - Fn::Sub '${LogsBucket.Arn}/'
            - Type: AWS::RDS::DBCluster
              Values:
                - 'arn:aws:rds:*:*:cluster/*'
      IsLogging: true
      IsMultiRegionTrail: true
      Tags:
        - Key: cost-center
          Value: '1234'
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: Fn::Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: Fn::Ref ApplicationKMSKey
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
      Bucket: Fn::Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              AWS: Fn::Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 's3:GetBucketAcl'
            Resource: Fn::GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: Fn::Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: Fn::Sub '${AWS::StackName}-ConfigRecorder'
      RoleArn: Fn::GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: Fn::Sub '${AWS::StackName}-ConfigDeliveryChannel'
      S3BucketName: Fn::Ref ConfigBucket
      SnsTopicARN: Fn::Ref AlertTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: Fn::Sub '${AWS::StackName}-config-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: Fn::Ref ApplicationKMSKey
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
      Bucket: Fn::Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: Fn::GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: Fn::GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: Fn::Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
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
                  - Fn::GetAtt ConfigBucket.Arn
                  - Fn::Sub '${ConfigBucket.Arn}/*'
      Tags:
        - Key: cost-center
          Value: '1234'
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
Outputs:
  VPCId:
    Description: VPC ID
    Value: Fn::Ref VPC
    Export:
      Name: Fn::Sub '${AWS::StackName}-VPC'
  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: Fn::GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: Fn::Sub '${AWS::StackName}-ALB-DNS'
  CloudFrontDomain:
    Description: CloudFront Distribution Domain Name
    Value: Fn::GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: Fn::Sub '${AWS::StackName}-CloudFront-Domain'
  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: Fn::GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: Fn::Sub '${AWS::StackName}-RDS-Endpoint'
  SNSTopic:
    Description: SNS Topic ARN for Alerts
    Value: Fn::Ref AlertTopic
    Export:
      Name: Fn::Sub '${AWS::StackName}-SNS-Topic'
  LogsBucket:
    Description: S3 Bucket for Logs
    Value: Fn::Ref LogsBucket
    Export:
      Name: Fn::Sub '${AWS::StackName}-Logs-Bucket'
  KMSKeyId:
    Description: KMS Key ID for Encryption
    Value: Fn::Ref ApplicationKMSKey
    Export:
      Name: Fn::Sub '${AWS::StackName}-KMS-Key'
