# Payment Processing System Migration - CloudFormation Implementation

This CloudFormation template provisions a complete AWS infrastructure for migrating an on-premises payment processing system to AWS with zero downtime using Database Migration Service.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Payment Processing System Migration - Complete infrastructure with VPC, RDS MySQL Multi-AZ, DMS, ALB, Auto Scaling, and monitoring

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to enable multiple deployments
    Default: dev
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  VpcCIDR:
    Type: String
    Description: CIDR block for VPC
    Default: 10.0.0.0/16
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  PublicSubnet1CIDR:
    Type: String
    Description: CIDR block for public subnet in AZ1
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Type: String
    Description: CIDR block for public subnet in AZ2
    Default: 10.0.2.0/24

  PublicSubnet3CIDR:
    Type: String
    Description: CIDR block for public subnet in AZ3
    Default: 10.0.3.0/24

  PrivateSubnet1CIDR:
    Type: String
    Description: CIDR block for private subnet in AZ1
    Default: 10.0.11.0/24

  PrivateSubnet2CIDR:
    Type: String
    Description: CIDR block for private subnet in AZ2
    Default: 10.0.12.0/24

  PrivateSubnet3CIDR:
    Type: String
    Description: CIDR block for private subnet in AZ3
    Default: 10.0.13.0/24

  DBUsername:
    Type: String
    Description: Master username for RDS MySQL database
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DBPassword:
    Type: String
    Description: Master password for RDS MySQL database
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+-=]*$'

  DBInstanceClass:
    Type: String
    Description: RDS instance class for MySQL database
    Default: db.t3.medium
    AllowedValues:
      - db.t3.small
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge

  DBAllocatedStorage:
    Type: Number
    Description: Allocated storage for RDS instance in GB
    Default: 100
    MinValue: 20
    MaxValue: 1000

  DMSInstanceClass:
    Type: String
    Description: DMS replication instance class
    Default: dms.t3.medium
    AllowedValues:
      - dms.t3.small
      - dms.t3.medium
      - dms.t3.large
      - dms.c5.large
      - dms.c5.xlarge

  OnPremisesDBHost:
    Type: String
    Description: Hostname or IP address of on-premises MySQL database
    Default: 192.168.1.100

  OnPremisesDBPort:
    Type: Number
    Description: Port number of on-premises MySQL database
    Default: 3306

  OnPremisesDBName:
    Type: String
    Description: Database name on on-premises MySQL
    Default: paymentdb

  OnPremisesDBUsername:
    Type: String
    Description: Username for on-premises MySQL database
    Default: migrationuser

  OnPremisesDBPassword:
    Type: String
    Description: Password for on-premises MySQL database
    NoEcho: true

  EC2InstanceType:
    Type: String
    Description: EC2 instance type for application servers
    Default: t3.medium
    AllowedValues:
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Description: Latest Amazon Linux 2 AMI ID
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

  AlarmEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    Default: ops@example.com
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  Environment:
    Type: String
    Description: Environment tag value
    Default: production
    AllowedValues:
      - development
      - staging
      - production

  Project:
    Type: String
    Description: Project tag value
    Default: payment-processing-migration

  CostCenter:
    Type: String
    Description: Cost center tag value
    Default: finance-ops

Resources:
  # ==================== VPC and Networking ====================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub payment-processing-vpc-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub payment-processing-igw-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets across 3 AZs
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub payment-processing-public-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub payment-processing-public-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet3CIDR
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub payment-processing-public-subnet-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: public

  # Private Subnets across 3 AZs
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub payment-processing-private-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub payment-processing-private-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet3CIDR
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub payment-processing-private-subnet-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Tier
          Value: private

  # NAT Gateways for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-eip-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-eip-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-eip-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub payment-processing-nat-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub payment-processing-public-rt-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

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
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub payment-processing-private-rt-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

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
          Value: !Sub payment-processing-private-rt-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
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
          Value: !Sub payment-processing-private-rt-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # ==================== Security Groups ====================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub payment-processing-alb-sg-${EnvironmentSuffix}
      GroupDescription: Security group for Application Load Balancer - allows HTTPS traffic from internet
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from internet (redirect to HTTPS)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub payment-processing-alb-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  AppServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub payment-processing-app-sg-${EnvironmentSuffix}
      GroupDescription: Security group for application servers - allows traffic only from ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB on application port
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS traffic from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub payment-processing-app-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub payment-processing-rds-sg-${EnvironmentSuffix}
      GroupDescription: Security group for RDS MySQL - allows MySQL traffic only from application servers and DMS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppServerSecurityGroup
          Description: Allow MySQL traffic from application servers
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref DMSSecurityGroup
          Description: Allow MySQL traffic from DMS replication instance
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub payment-processing-rds-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DMSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub payment-processing-dms-sg-${EnvironmentSuffix}
      GroupDescription: Security group for DMS replication instance - allows access to source and target databases
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 0.0.0.0/0
          Description: Allow MySQL traffic to on-premises and RDS
      Tags:
        - Key: Name
          Value: !Sub payment-processing-dms-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  # ==================== KMS Key for RDS Encryption ====================

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub KMS key for RDS MySQL encryption - ${EnvironmentSuffix}
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
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub payment-processing-rds-kms-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/payment-processing-rds-${EnvironmentSuffix}
      TargetKeyId: !Ref RDSKMSKey

  # ==================== Secrets Manager for Database Credentials ====================

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub payment-processing-db-secret-${EnvironmentSuffix}
      Description: Database credentials for RDS MySQL instance
      SecretString: !Sub |
        {
          "username": "${DBUsername}",
          "password": "${DBPassword}",
          "engine": "mysql",
          "host": "${RDSInstance.Endpoint.Address}",
          "port": 3306,
          "dbname": "paymentdb"
        }
      Tags:
        - Key: Name
          Value: !Sub payment-processing-db-secret-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  # ==================== RDS MySQL Multi-AZ ====================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub payment-processing-db-subnet-group-${EnvironmentSuffix}
      DBSubnetGroupDescription: Subnet group for RDS MySQL across 3 AZs
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub payment-processing-db-subnet-group-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub payment-processing-db-${EnvironmentSuffix}
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: 8.0.35
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub payment-processing-db-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  # ==================== DMS Resources ====================

  DMSReplicationSubnetGroup:
    Type: AWS::DMS::ReplicationSubnetGroup
    Properties:
      ReplicationSubnetGroupIdentifier: !Sub payment-processing-dms-subnet-group-${EnvironmentSuffix}
      ReplicationSubnetGroupDescription: Subnet group for DMS replication instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub payment-processing-dms-subnet-group-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DMSReplicationInstance:
    Type: AWS::DMS::ReplicationInstance
    DependsOn:
      - RDSInstance
    Properties:
      ReplicationInstanceIdentifier: !Sub payment-processing-dms-${EnvironmentSuffix}
      ReplicationInstanceClass: !Ref DMSInstanceClass
      AllocatedStorage: 50
      VpcSecurityGroupIds:
        - !Ref DMSSecurityGroup
      ReplicationSubnetGroupIdentifier: !Ref DMSReplicationSubnetGroup
      PubliclyAccessible: false
      MultiAZ: false
      EngineVersion: 3.5.2
      Tags:
        - Key: Name
          Value: !Sub payment-processing-dms-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DMSSourceEndpoint:
    Type: AWS::DMS::Endpoint
    Properties:
      EndpointIdentifier: !Sub payment-processing-source-endpoint-${EnvironmentSuffix}
      EndpointType: source
      EngineName: mysql
      ServerName: !Ref OnPremisesDBHost
      Port: !Ref OnPremisesDBPort
      DatabaseName: !Ref OnPremisesDBName
      Username: !Ref OnPremisesDBUsername
      Password: !Ref OnPremisesDBPassword
      Tags:
        - Key: Name
          Value: !Sub payment-processing-source-endpoint-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  DMSTargetEndpoint:
    Type: AWS::DMS::Endpoint
    DependsOn:
      - RDSInstance
    Properties:
      EndpointIdentifier: !Sub payment-processing-target-endpoint-${EnvironmentSuffix}
      EndpointType: target
      EngineName: mysql
      ServerName: !GetAtt RDSInstance.Endpoint.Address
      Port: 3306
      DatabaseName: paymentdb
      Username: !Ref DBUsername
      Password: !Ref DBPassword
      Tags:
        - Key: Name
          Value: !Sub payment-processing-target-endpoint-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  # ==================== IAM Roles ====================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub payment-processing-ec2-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                  - secretsmanager:DescribeSecret
                Resource: !Ref DBSecret
      Tags:
        - Key: Name
          Value: !Sub payment-processing-ec2-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub payment-processing-ec2-profile-${EnvironmentSuffix}
      Roles:
        - !Ref EC2InstanceRole

  # ==================== Application Load Balancer ====================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub pp-alb-${EnvironmentSuffix}
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub payment-processing-alb-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub pp-tg-${EnvironmentSuffix}
      VpcId: !Ref VPC
      Port: 8080
      Protocol: HTTP
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub payment-processing-tg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ==================== EC2 Auto Scaling ====================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub payment-processing-lt-${EnvironmentSuffix}
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref AppServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Install application dependencies
            yum install -y java-11-amazon-corretto

            # Configure CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c default

            # Application will be deployed separately
            echo "Instance provisioned for payment processing application"
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub payment-processing-app-${EnvironmentSuffix}
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref Project
              - Key: CostCenter
                Value: !Ref CostCenter

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub payment-processing-asg-${EnvironmentSuffix}
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub payment-processing-asg-${EnvironmentSuffix}
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref Project
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # ==================== CloudWatch Monitoring ====================

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub payment-processing-alarms-${EnvironmentSuffix}
      DisplayName: Payment Processing CloudWatch Alarms
      Subscription:
        - Endpoint: !Ref AlarmEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub payment-processing-alarms-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub payment-processing-rds-high-cpu-${EnvironmentSuffix}
      AlarmDescription: Alarm when RDS CPU utilization exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  RDSLowStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub payment-processing-rds-low-storage-${EnvironmentSuffix}
      AlarmDescription: Alarm when RDS free storage space is below 10GB
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: VPC ID for payment processing infrastructure
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPCId

  PublicSubnet1Id:
    Description: Public Subnet 1 ID (AZ1)
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnet1

  PublicSubnet2Id:
    Description: Public Subnet 2 ID (AZ2)
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnet2

  PublicSubnet3Id:
    Description: Public Subnet 3 ID (AZ3)
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnet3

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID (AZ1)
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${AWS::StackName}-PrivateSubnet1

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID (AZ2)
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${AWS::StackName}-PrivateSubnet2

  PrivateSubnet3Id:
    Description: Private Subnet 3 ID (AZ3)
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub ${AWS::StackName}-PrivateSubnet3

  RDSInstanceEndpoint:
    Description: RDS MySQL instance endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-RDSEndpoint

  RDSInstancePort:
    Description: RDS MySQL instance port
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub ${AWS::StackName}-RDSPort

  DBSecretArn:
    Description: ARN of Secrets Manager secret containing database credentials
    Value: !Ref DBSecret
    Export:
      Name: !Sub ${AWS::StackName}-DBSecretArn

  ALBDNSName:
    Description: DNS name of Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${AWS::StackName}-ALBDNSName

  ALBTargetGroupArn:
    Description: ARN of ALB Target Group
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub ${AWS::StackName}-ALBTargetGroupArn

  DMSReplicationInstanceArn:
    Description: ARN of DMS replication instance
    Value: !Ref DMSReplicationInstance
    Export:
      Name: !Sub ${AWS::StackName}-DMSReplicationInstanceArn

  DMSSourceEndpointArn:
    Description: ARN of DMS source endpoint
    Value: !Ref DMSSourceEndpoint
    Export:
      Name: !Sub ${AWS::StackName}-DMSSourceEndpointArn

  DMSTargetEndpointArn:
    Description: ARN of DMS target endpoint
    Value: !Ref DMSTargetEndpoint
    Export:
      Name: !Sub ${AWS::StackName}-DMSTargetEndpointArn

  ALBSecurityGroupId:
    Description: Security Group ID for ALB
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-ALBSecurityGroup

  AppServerSecurityGroupId:
    Description: Security Group ID for application servers
    Value: !Ref AppServerSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-AppServerSecurityGroup

  RDSSecurityGroupId:
    Description: Security Group ID for RDS
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-RDSSecurityGroup

  SNSTopicArn:
    Description: ARN of SNS topic for CloudWatch alarms
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${AWS::StackName}-SNSTopicArn

  KMSKeyId:
    Description: KMS Key ID for RDS encryption
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub ${AWS::StackName}-KMSKeyId
```