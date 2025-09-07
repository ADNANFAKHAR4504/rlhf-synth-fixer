AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-region infrastructure with production-ready security controls'

Parameters:
  EnvironmentName:
    Type: String
    Default: Production
    Description: Environment name for resource tagging
  
  KMSKeyIdUSEast1:
    Type: String
    Description: KMS Customer Managed Key ID for us-east-1
    AllowedPattern: '^arn:aws:kms:us-east-1:[0-9]{12}:key/[a-f0-9-]{36}$'
  
  KMSKeyIdEUCentral1:
    Type: String
    Description: KMS Customer Managed Key ID for eu-central-1
    AllowedPattern: '^arn:aws:kms:eu-central-1:[0-9]{12}:key/[a-f0-9-]{36}$'
  
  VPCCidrUSEast1:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC in us-east-1
  
  VPCCidrEUCentral1:
    Type: String
    Default: '10.1.0.0/16'
    Description: CIDR block for VPC in eu-central-1
  
  RDSInstanceType:
    Type: String
    Default: db.m5.large
    AllowedValues:
      - db.m5.large
      - db.m5.xlarge
    Description: RDS instance type
  
  EC2InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
      AZ1: us-east-1a
      AZ2: us-east-1b
    eu-central-1:
      AMI: ami-0d527b8c289b4af7f
      AZ1: eu-central-1a
      AZ2: eu-central-1b

Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']
  IsEUCentral1: !Equals [!Ref 'AWS::Region', 'eu-central-1']

Resources:
  # VPC Configuration
  VPCProd:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !If 
        - IsUSEast1
        - !Ref VPCCidrUSEast1
        - !Ref VPCCidrEUCentral1
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-prod-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-prod-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPCProd

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.1.0/24'
        - '10.1.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.2.0/24'
        - '10.1.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.3.0/24'
        - '10.1.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.4.0/24'
        - '10.1.4.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

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
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

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
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-2-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

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

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'web-server-sg-${AWS::Region}'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'web-server-sg-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'database-sg-${AWS::Region}'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'database-sg-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ecs-sg-${AWS::Region}'
      GroupDescription: Security group for ECS services
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'ecs-sg-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ec2-${AWS::Region}'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationBucket}/*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ecs-execution-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ecs-task-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  RDSRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-rds-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # S3 Buckets
  ApplicationBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'prod-application-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-application-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'prod-logging-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-logging-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  BackupBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'prod-backup-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-backup-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # RDS Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'prod-db-${AWS::Region}'
      DBInstanceClass: !Ref RDSInstanceType
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !If
        - IsUSEast1
        - !Ref KMSKeyIdUSEast1
        - !Ref KMSKeyIdEUCentral1
      MasterUsername: admin
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'prod-db-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'prod-cluster-${AWS::Region}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'prod-cluster-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Task Definition
  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'prod-task-${AWS::Region}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 256
      Memory: 512
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: web-container
          Image: nginx:latest
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref 'AWS::Region'
              awslogs-stream-prefix: ecs
          Essential: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-task-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ECSCluster
    Properties:
      ServiceName: !Sub 'prod-service-${AWS::Region}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 2
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          AssignPublicIp: DISABLED
      Tags:
        - Key: Name
          Value: !Sub 'prod-service-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Auto Scaling Target
  ECSAutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  # Auto Scaling Policy - CPU
  ECSAutoScalingPolicyCPU:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'ecs-cpu-scaling-${AWS::Region}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleOutCooldown: 300
        ScaleInCooldown: 300

  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref EC2InstanceType
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PrivateSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
      Tags:
        - Key: Name
          Value: !Sub 'web-server-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Log Groups
  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/prod-task-${AWS::Region}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub 'ecs-logs-${AWS::Region}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName