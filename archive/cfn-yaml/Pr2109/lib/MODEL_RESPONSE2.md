# Complete Secure Multi-Region Infrastructure Template

You're absolutely right! Here's the complete, production-ready CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-Region Infrastructure for HIPAA/PCI DSS Compliant Web Application'

Parameters:
  Environment:
    Type: String
    Default: 'Production'
    AllowedValues: ['Development', 'Staging', 'Production']
    Description: 'Environment name for resource tagging and configuration'
  
  CostCenter:
    Type: String
    Default: 'Compliance'
    Description: 'Cost center for billing allocation'
  
  PrimaryRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Primary AWS region for deployment'
  
  SecondaryRegion:
    Type: String
    Default: 'us-west-2'
    Description: 'Secondary AWS region for disaster recovery'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  DBInstanceClass:
    Type: String
    Default: 'db.r5.xlarge'
    AllowedValues: ['db.r5.large', 'db.r5.xlarge', 'db.r5.2xlarge']
    Description: 'RDS instance class for database'
  
  WebInstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type for web servers'
  
  NotificationEmail:
    Type: String
    Description: 'Email address for CloudFormation notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for the application'

Mappings:
  RegionMap:
    us-east-1:
      AMI: 'ami-0c02fb55956c7d316'
    us-west-2:
      AMI: 'ami-0841edc20334f9287'
  
  EnvironmentMap:
    Development:
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
    Staging:
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
    Production:
      MinSize: 2
      MaxSize: 8
      DesiredCapacity: 4

Conditions:
  IsProduction: !Equals [!Ref Environment, 'Production']

Resources:
  # SNS Topic for CloudFormation Notifications
  CloudFormationNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-cloudformation-notifications'
      DisplayName: 'CloudFormation Stack Notifications'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  CloudFormationNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref CloudFormationNotificationTopic
      Endpoint: !Ref NotificationEmail

  # KMS Key for Encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for HIPAA/PCI DSS Compliant Infrastructure'
      KeyPolicy:
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
          - Sid: Allow SNS
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: 'HIPAA-PCI-DSS'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-secure-app-key'
      TargetKeyId: !Ref KMSKey

  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # VPC Flow Logs
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

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]
      KmsKeyId: !GetAtt KMSKey.Arn

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref VPC
      TrafficType: 'ALL'
      LogDestinationType: 'cloud-watch-logs'
      LogDestination: !GetAtt VPCFlowLogsGroup.Arn
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-flow-logs'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment

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
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.1.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.2.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.10.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.11.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.20.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidrPrefix}.21.0/24'
        - VpcCidrPrefix: !Select [0, !Split ['.0/16', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-1-eip'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-2-eip'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-routes'

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
          Value: !Sub '${Environment}-private-routes-1'

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
          Value: !Sub '${Environment}-private-routes-2'

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

  DatabaseRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-routes-1'

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable1
      SubnetId: !Ref DatabaseSubnet1

  DatabaseRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-routes-2'

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable2
      SubnetId: !Ref DatabaseSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP traffic (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-sg'
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-web-sg'
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
          Description: 'SSH from Bastion'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-db-sg'
      GroupDescription: 'Security group for database'
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
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL from Lambda'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'
        - Key: Environment
          Value: !Ref Environment

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access (restrict to specific IPs in production)'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-bastion-sg'
        - Key: Environment
          Value: !Ref Environment

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-lambda-sg'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-lambda-sg'
        - Key: Environment
          Value: !Ref Environment

  # S3 Buckets
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-app-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
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
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-app-assets-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-app-assets'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Database Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  # RDS Enhanced Monitoring Role
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
      Path: /

  # RDS Database
  DatabaseCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.02.0'
      DatabaseName: 'secureapp'
      MasterUsername: 'admin'
      ManageMasterUserPassword: true
      MasterUserSecret:
        KmsKeyId: !Ref KMSKey
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-aurora-cluster'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  DatabasePrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-mysql
      DBInstanceClass: !Ref DBInstanceClass
      DBClusterIdentifier: !Ref DatabaseCluster
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PerformanceInsightsEnabled: true
      PerformanceInsightsKMSKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-aurora-primary'
        - Key: Environment
          Value: !Ref Environment

  DatabaseReplicaInstance:
    Type: AWS::RDS::DBInstance
    Condition: IsProduction
    Properties:
      Engine: aurora-mysql
      DBInstanceClass: !Ref DBInstanceClass
      DBClusterIdentifier: !Ref DatabaseCluster
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PerformanceInsightsEnabled: true
      PerformanceInsightsKMSKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-aurora-replica'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Groups
  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/webserver/${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]
      KmsKeyId: !GetAtt KMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]
      KmsKeyId: !GetAtt KMSKey.Arn

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]
      KmsKeyId: !GetAtt KMSKey.Arn

  # IAM Roles
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
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/*'
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
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: DatabaseAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBClusters'
                  - 'rds:DescribeDBInstances'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseCluster
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn

  CodeDeployRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole'
        - 'arn:aws:iam::aws:policy/AutoScalingFullAccess'

  # Systems Manager Parameters
  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter