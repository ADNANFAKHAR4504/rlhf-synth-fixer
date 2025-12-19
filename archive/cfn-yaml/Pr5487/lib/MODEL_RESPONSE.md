### Reasoning Trace

---

This is a comprehensive request for a production-grade CloudFormation template for a financial services startup. Let me break down the requirements:

1. **Multi-tier architecture** with:
   - ECS Fargate cluster across 3 AZs
   - Custom VPC with public and private subnets
   - ALB in public subnets
   - RDS Aurora MySQL in private subnets
   - NAT Gateways in public subnets

2. **Security requirements**:
   - RDS must be private-only
   - SSL/TLS encryption for database connections
   - AWS Secrets Manager for database credentials
   - Least privilege IAM roles
   - KMS encryption for S3
   - HTTPS-only access with TLS 1.2+

3. **High availability and scalability**:
   - 3 Availability Zones
   - Auto-scaling for ECS services
   - Blue-green deployment capability
   - Zero downtime deployments

4. **Components needed**:
   - VPC with subnets
   - ECS Cluster with Fargate
   - RDS Aurora MySQL cluster
   - Application Load Balancer
   - CloudFront distribution
   - Route53 with weighted routing
   - S3 buckets for static assets
   - CloudWatch Container Insights
   - IAM roles and policies
   - Secrets Manager
   - ACM certificate

5. **Outputs required**:
   - ECS cluster name
   - ALB DNS name
   - CloudFront distribution domain
   - Route53 record set
   - RDS endpoint

This is quite extensive, so I'll create a comprehensive CloudFormation template that addresses all these requirements. Given the size constraints, I'll focus on the most critical components and provide a well-structured template that can be extended.

### Answer

---

# Production-Grade Multi-Tier CloudFormation Template

I'll design a comprehensive CloudFormation template for your financial services startup that meets all the specified requirements. This template follows AWS best practices for security, high availability, and compliance.

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-tier web application stack for financial services with HA, blue-green deployment, and compliance'

# ============================
# Parameters
# ============================
Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name for resource naming

  ProjectName:
    Type: String
    Default: fintech-app
    Description: Project name for resource identification

  DomainName:
    Type: String
    Description: Domain name for the application (e.g., example.com)

  CertificateArn:
    Type: String
    Description: ACM certificate ARN for the domain

  DBMasterUsername:
    Type: String
    Default: admin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBInstanceClass:
    Type: String
    Default: db.r5.large
    Description: Aurora instance class

  ContainerImage:
    Type: String
    Description: Docker image URI for the application

  DesiredTaskCount:
    Type: Number
    Default: 3
    Description: Number of ECS tasks to run

  DeploymentColor:
    Type: String
    Default: blue
    AllowedValues:
      - blue
      - green
    Description: Deployment color for blue-green deployments

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for bastion host (optional)

# ============================
# Mappings
# ============================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PublicSubnet3:
      CIDR: 10.0.3.0/24
    PrivateSubnet1:
      CIDR: 10.0.11.0/24
    PrivateSubnet2:
      CIDR: 10.0.12.0/24
    PrivateSubnet3:
      CIDR: 10.0.13.0/24
    DatabaseSubnet1:
      CIDR: 10.0.21.0/24
    DatabaseSubnet2:
      CIDR: 10.0.22.0/24
    DatabaseSubnet3:
      CIDR: 10.0.23.0/24

# ============================
# Conditions
# ============================
Conditions:
  IsProduction: !Equals [!Ref Environment, prod]
  CreateBastion: !Not [!Equals [!Ref KeyPairName, '']]

# ============================
# Resources
# ============================
Resources:
  # ============================
  # VPC and Networking
  # ============================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-vpc
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-public-subnet-1
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-public-subnet-2
        - Key: Type
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-public-subnet-3
        - Key: Type
          Value: Public

  # Private Subnets (for ECS)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-private-subnet-1
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-private-subnet-2
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-private-subnet-3
        - Key: Type
          Value: Private

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-subnet-1
        - Key: Type
          Value: Database

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-subnet-2
        - Key: Type
          Value: Database

  DatabaseSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-subnet-3
        - Key: Type
          Value: Database

  # NAT Gateways and EIPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-natgw-1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-natgw-2

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-natgw-3

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-private-rt-1

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
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
          Value: !Sub ${ProjectName}-${Environment}-private-rt-2

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-private-rt-3

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Database Route Table
  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-rt

  DatabaseSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref DatabaseRouteTable

  DatabaseSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref DatabaseRouteTable

  DatabaseSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet3
      RouteTableId: !Ref DatabaseRouteTable

  # ============================
  # Security Groups
  # ============================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
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
          Description: HTTP from anywhere (will redirect to HTTPS)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-alb-sg

  ECSTaskSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ecs-task-sg

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ECSTaskSecurityGroup
          Description: MySQL from ECS tasks
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-sg

  # ============================
  # KMS Keys
  # ============================
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow CloudFront to use the key
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/${ProjectName}-${Environment}-s3-key
      TargetKeyId: !Ref S3KMSKey

  # ============================
  # S3 Buckets
  # ============================
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${ProjectName}-${Environment}-static-assets-${AWS::AccountId}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
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
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub ${StaticAssetsBucket.Arn}/*
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}

  # ============================
  # Secrets Manager
  # ============================
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-db-password
      Description: RDS Aurora master password
      GenerateSecretString:
        SecretStringTemplate: !Sub |
          {
            "username": "${DBMasterUsername}"
          }
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  SecretRDSAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBPasswordSecret
      TargetId: !Ref AuroraDBCluster
      TargetType: AWS::RDS::DBCluster

  # ============================
  # RDS Aurora MySQL
  # ============================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub ${ProjectName}-${Environment}-db-subnet-group
      DBSubnetGroupDescription: Subnet group for Aurora cluster
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
        - !Ref DatabaseSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-db-subnet-group

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Aurora MySQL cluster parameter group with SSL enforcement
      Family: aurora-mysql5.7
      Parameters:
        require_secure_transport: 'ON'
        character_set_database: utf8mb4
        collation_server: utf8mb4_unicode_ci

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: aurora-mysql
      EngineMode: provisioned
      EngineVersion: 5.7.mysql_aurora.2.10.1
      DBClusterIdentifier: !Sub ${ProjectName}-${Environment}-aurora-cluster
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      DatabaseName: !Sub ${ProjectName}db
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      StorageEncrypted: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-aurora-cluster

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${ProjectName}-${Environment}-aurora-instance-1
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClass
      Engine: aurora-mysql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-aurora-instance-1

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${ProjectName}-${Environment}-aurora-instance-2
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClass
      Engine: aurora-mysql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-aurora-instance-2

  # ============================
  # ECS Cluster and Task Definition
  # ============================
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${ProjectName}-${Environment}-cluster
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 2
          Base: 2
        - CapacityProvider: FARGATE_SPOT
          Weight: 1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-cluster

  # IAM Roles for ECS
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: SecretManagerAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  - !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: '*'
                Condition:
                  StringEquals:
                    kms:ViaService:
                      - !Sub secretsmanager.${AWS::Region}.amazonaws.com
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ecs-execution-role

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub ${StaticAssetsBucket.Arn}/*
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ecs-task-role

  # CloudWatch Log Group
  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /ecs/${ProjectName}-${Environment}
      RetentionInDays: !If [IsProduction, 90, 30]

  # ECS Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${ProjectName}-${Environment}-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub ${ProjectName}-app
          Image: !Ref ContainerImage
          Essential: true
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          Environment:
            - Name: ENVIRONMENT
              Value: !Ref Environment
            - Name: DB_HOST
              Value: !GetAtt AuroraDBCluster.Endpoint.Address
            - Name: DB_NAME
              Value: !Sub ${ProjectName}db
          Secrets:
            - Name: DB_USERNAME
              ValueFrom: !Sub '${DBPasswordSecret}:username::'
            - Name: DB_PASSWORD
              ValueFrom: !Sub '${DBPasswordSecret}:password::'
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost/health || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  # ============================
  # Application Load Balancer
  # ============================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-alb-${DeploymentColor}
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-alb-${DeploymentColor}
        - Key: DeploymentColor
          Value: !Ref DeploymentColor

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-tg-${DeploymentColor}
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 15
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: 200-299
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-tg-${DeploymentColor}

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  # ============================
  # ECS Service
  # ============================
  ECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - ALBListenerHTTPS
      - ALBListenerHTTP
    Properties:
      ServiceName: !Sub ${ProjectName}-${Environment}-service-${DeploymentColor}
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: !Ref DesiredTaskCount
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSTaskSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      LoadBalancers:
        - ContainerName: !Sub ${ProjectName}-app
          ContainerPort: 80
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 60
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 100
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-service-${DeploymentColor}
        - Key: DeploymentColor
          Value: !Ref DeploymentColor

  # ============================
  # Auto Scaling
  # ============================
  ServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: !If [IsProduction, 3, 2]
      ResourceId: !Sub service/${ECSCluster}/${ECSService.Name}
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ServiceScalingPolicyCPU:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub ${ProjectName}-${Environment}-cpu-scaling
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 75.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  ServiceScalingPolicyMemory:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub ${ProjectName}-${Environment}-memory-scaling
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 75.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ============================
  # CloudFront Distribution
  # ============================
  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub ${ProjectName}-${Environment}-oac
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub ${ProjectName} ${Environment} CloudFront Distribution
        HttpVersion: http2and3
        DefaultRootObject: index.html
        Aliases:
          - !Ref DomainName
        ViewerCertificate:
          AcmCertificateArn: !Ref CertificateArn
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
          - Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.DomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref CloudFrontOriginAccessControl
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
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # CachingDisabled
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf # CORS-S3Origin
          ResponseHeadersPolicyId: 67f7725c-6f97-4210-82d7-5512b31e9d03 # SecurityHeadersPolicy
        CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: https-only
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # Managed-CachingOptimized
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 10
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 10
        Logging:
          Bucket: !GetAtt StaticAssetsBucket.DomainName
          Prefix: cloudfront-logs/
          IncludeCookies: false
        WebACLId: !If [IsProduction, !Ref WAFWebACL, !Ref AWS::NoValue]
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-cf-distribution

  # ============================
  # WAF (for Production)
  # ============================
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: IsProduction
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-waf
      Scope: CLOUDFRONT
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
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub ${ProjectName}-${Environment}-waf

  # ============================
  # Route53
  # ============================
  Route53RecordSet:
    Type: AWS::Route53::RecordSetGroup
    Properties:
      HostedZoneName: !Sub ${DomainName}.
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          SetIdentifier: !Sub ${DeploymentColor}-environment
          Weight: !If
            - IsProduction
            - 100
            - 50
          AliasTarget:
            DNSName: !GetAtt CloudFrontDistribution.DomainName
            HostedZoneId: Z2FDTNDATAQYW2 # CloudFront Hosted Zone ID
            EvaluateTargetHealth: false

  # ============================
  # CloudWatch Alarms
  # ============================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when ECS service CPU exceeds 85%
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt ECSService.Name
        - Name: ClusterName
          Value: !Ref ECSCluster

  HighMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when ECS service memory exceeds 85%
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt ECSService.Name
        - Name: ClusterName
          Value: !Ref ECSCluster

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when database CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster

  TargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when target response time exceeds 1 second
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1.0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

# ============================
# Outputs
# ============================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${ProjectName}-${Environment}-vpc-id

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub ${ProjectName}-${Environment}-cluster-name

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${ProjectName}-${Environment}-alb-dns-${DeploymentColor}

  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub ${ProjectName}-${Environment}-cf-domain

  CloudFrontDistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub ${ProjectName}-${Environment}-cf-id

  Route53RecordName:
    Description: Route53 Record Set Name
    Value: !Ref DomainName
    Export:
      Name: !Sub ${ProjectName}-${Environment}-route53-record

  RDSEndpoint:
    Description: RDS Aurora Cluster Endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub ${ProjectName}-${Environment}-db-endpoint

  RDSReadEndpoint:
    Description: RDS Aurora Cluster Read Endpoint
    Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub ${ProjectName}-${Environment}-db-read-endpoint

  DBSecretArn:
    Description: Database Secret ARN
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub ${ProjectName}-${Environment}-db-secret

  StaticAssetsBucketName:
    Description: Static Assets S3 Bucket Name
    Value: !Ref StaticAssetsBucket
    Export:
      Name: !Sub ${ProjectName}-${Environment}-static-bucket

  DeploymentColor:
    Description: Current deployment color (blue/green)
    Value: !Ref DeploymentColor
    Export:
      Name: !Sub ${ProjectName}-${Environment}-deployment-color

  ServiceName:
    Description: ECS Service Name
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub ${ProjectName}-${Environment}-service-name-${DeploymentColor}

  TaskDefinitionArn:
    Description: ECS Task Definition ARN
    Value: !Ref TaskDefinition
    Export:
      Name: !Sub ${ProjectName}-${Environment}-task-definition
```

## Key Features Implemented

### 1. **Security & Compliance**

- **Network Isolation**: Private subnets for ECS tasks and RDS with no direct internet access
- **SSL/TLS Enforcement**: Database connections require SSL, CloudFront enforces TLS 1.2+
- **Secrets Management**: Database credentials stored in AWS Secrets Manager
- **IAM Least Privilege**: Specific roles for each service with minimal permissions
- **KMS Encryption**: S3 buckets encrypted with customer-managed KMS keys
- **WAF Protection**: Production environment includes WAF rules for rate limiting

### 2. **High Availability**

- **Multi-AZ Deployment**: Resources spread across 3 availability zones
- **Aurora Cluster**: Multi-AZ database with automated failover
- **NAT Gateway Redundancy**: One NAT Gateway per AZ for fault tolerance
- **Auto-scaling**: ECS services scale based on CPU and memory metrics

### 3. **Blue-Green Deployment**

- **Weighted Routing**: Route53 supports traffic distribution between environments
- **Environment Tagging**: Resources tagged with deployment color
- **Zero-Downtime**: Gradual traffic shifting capability

### 4. **Monitoring & Observability**

- **Container Insights**: Enabled for comprehensive ECS monitoring
- **CloudWatch Alarms**: Alerts for CPU, memory, and response time thresholds
- **Centralized Logging**: ECS logs aggregated in CloudWatch

### 5. **CI/CD Integration**

- **Parameterized Template**: Environment-specific deployments
- **Consistent Naming**: Resource naming follows conventions
- **Output Exports**: Key values exported for cross-stack references

## Deployment Instructions

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Domain name** registered and hosted zone created in Route53
3. **ACM Certificate** validated for your domain
4. **Docker image** pushed to ECR or accessible registry

### Deployment Steps

```bash
# 1. Validate the template
aws cloudformation validate-template \
  --template-body file://infrastructure.yaml

# 2. Create the stack
aws cloudformation create-stack \
  --stack-name fintech-app-prod \
  --template-body file://infrastructure.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=DomainName,ParameterValue=example.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:... \
    ParameterKey=ContainerImage,ParameterValue=123456789.dkr.ecr.region.amazonaws.com/app:latest \
    ParameterKey=DeploymentColor,ParameterValue=blue \
  --capabilities CAPABILITY_IAM

# 3. Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name fintech-app-prod

# 4. Get stack outputs
aws cloudformation describe-stacks \
  --stack-name fintech-app-prod \
  --query 'Stacks[0].Outputs'
```

### Blue-Green Deployment Process

```bash
# 1. Deploy green environment
aws cloudformation update-stack \
  --stack-name fintech-app-prod \
  --use-previous-template \
  --parameters \
    ParameterKey=DeploymentColor,ParameterValue=green \
    ParameterKey=ContainerImage,ParameterValue=new-image:tag

# 2. Gradually shift traffic in Route53
# Update the Weight parameter to control traffic distribution

# 3. Monitor metrics and rollback if necessary
```

## Cost Optimization Considerations

1. **Fargate Spot**: Uses mix of on-demand and spot instances
2. **S3 Lifecycle**: Automatic transition to cheaper storage tiers
3. **Reserved Capacity**: Consider RDS reserved instances for production
4. **CloudWatch Logs**: Retention policies to manage storage costs

## Security Best Practices

1. Enable **AWS GuardDuty** for threat detection
2. Configure **AWS Config** for compliance monitoring
3. Implement **AWS Security Hub** for security posture management
4. Regular **security group audits**
5. Enable **VPC Flow Logs** for network monitoring

This template provides a solid foundation for a financial services application with enterprise-grade security, scalability, and reliability features. Customize parameters and add additional microservices as needed for your specific use case.
