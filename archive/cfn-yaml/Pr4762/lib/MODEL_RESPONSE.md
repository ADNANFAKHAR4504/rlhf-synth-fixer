# AWS CloudFormation Template Analysis

## Requirements Analysis

### 1. VPC & Networking Requirements
- VPC with configurable CIDR
- 2 public subnets and 2 private subnets across different AZs
- Internet Gateway
- NAT Gateways with Elastic IPs in public subnets
- All parameters to be configurable

### 2. Load Balancing (NLB) Requirements
- Network Load Balancer in public subnets
- HTTP/HTTPS traffic distribution
- Auto-register EC2 instances via Auto Scaling
- Automatic Elastic IP management

### 3. Compute Requirements
- Amazon Linux 2 AMI via SSM Parameter Store
- Create EC2 Key Pair programmatically
- EC2 instances in public subnets with Auto Scaling Group
- Security Group for HTTP/HTTPS via NLB only

### 4. Database Requirements
- RDS MySQL/PostgreSQL with Multi-AZ
- Placement in private subnets
- No public accessibility
- Access restricted to EC2 instances

### 5. Storage Requirements
- S3 bucket with encryption
- Private access only

### 6. Monitoring Requirements
- VPC Flow Logs implementation
- Comprehensive resource tagging

### 7. Cross-Account Requirements
- No hardcoded account IDs, ARNs, or regions
- Use parameters and pseudo parameters for dynamic values

## CloudFormation Template Implementation
The following CloudFormation template implements the requirements for a production-grade, multi-tier infrastructure with high availability, security, and scalability.

### Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-tier infrastructure with VPC, NLB, Auto Scaling, RDS, and S3'

# ==================== PARAMETERS ====================
Parameters:
  ProjectName:
    Type: String
    Default: 'multi-tier-app'
    Description: 'Project name for resource naming and tagging'
    MinLength: 1
    MaxLength: 50
    AllowedPattern: '^[a-zA-Z0-9\-]+$'

  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name'
    AllowedValues:
      - development
      - staging
      - production

  Owner:
    Type: String
    Default: 'devops-team'
    Description: 'Owner tag for all resources'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for private subnet 2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge

  AutoScalingMinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 1

  AutoScalingMaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 1

  AutoScalingDesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of instances in Auto Scaling Group'
    MinValue: 1

  DatabaseEngine:
    Type: String
    Default: 'mysql'
    Description: 'Database engine type'
    AllowedValues:
      - mysql
      - postgres

  DatabaseInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'Database instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  DatabaseMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DatabaseMasterPassword:
    Type: String
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    NoEcho: true
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};:,.<>?]*$'

  DatabaseAllocatedStorage:
    Type: Number
    Default: 20
    Description: 'Database storage size in GB'
    MinValue: 20
    MaxValue: 1000

# ==================== MAPPINGS ====================
Mappings:
  DatabaseEngineMap:
    mysql:
      Engine: 'mysql'
      EngineVersion: '8.0'
      Port: 3306
      Family: 'mysql8.0'
    postgres:
      Engine: 'postgres'
      EngineVersion: '14'
      Port: 5432
      Family: 'postgres14'

# ==================== CONDITIONS ====================
Conditions:
  IsMySQL: !Equals [!Ref DatabaseEngine, 'mysql']
  IsPostgreSQL: !Equals [!Ref DatabaseEngine, 'postgres']

# ==================== RESOURCES ====================
Resources:
  # ==================== VPC & NETWORKING ====================
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-route-table'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-route-table-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-route-table-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ==================== SECURITY GROUPS ====================
  NLBSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Network Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nlb-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref NLBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref NLBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Port]
          ToPort: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Port]
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ==================== EC2 KEY PAIR ====================
  EC2KeyPair:
    Type: 'AWS::EC2::KeyPair'
    Properties:
      KeyName: !Sub '${ProjectName}-${Environment}-keypair'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-keypair'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ==================== LAUNCH TEMPLATE ====================
  LaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-lt'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        KeyName: !Ref EC2KeyPair
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::Region} - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html
            # Install CloudWatch agent
            wget https://s3.${AWS::Region}.amazonaws.com/amazoncloudwatch-agent-${AWS::Region}/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner

  # ==================== IAM ROLES ====================
  EC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy'
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
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref EC2Role

  # ==================== NETWORK LOAD BALANCER ====================
  NetworkLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Type: network
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nlb'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NLBTargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
      Port: 80
      Protocol: TCP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPort: 80
      HealthCheckProtocol: TCP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 3
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NLBListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      LoadBalancerArn: !Ref NetworkLoadBalancer
      Port: 80
      Protocol: TCP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NLBTargetGroup

  # ==================== AUTO SCALING ====================
  AutoScalingGroup:
    Type: 'AWS::AutoScaling::AutoScalingGroup'
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref AutoScalingMinSize
      MaxSize: !Ref AutoScalingMaxSize
      DesiredCapacity: !Ref AutoScalingDesiredCapacity
      TargetGroupARNs:
        - !Ref NLBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true

  # ==================== RDS DATABASE ====================
  DBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DBParameterGroup:
    Type: 'AWS::RDS::DBParameterGroup'
    Properties:
      Description: !Sub 'Parameter group for ${ProjectName} ${Environment} database'
      Family: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Family]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-pg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  Database:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db'
      Engine: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Engine]
      EngineVersion: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, EngineVersion]
      DBInstanceClass: !Ref DatabaseInstanceClass
      AllocatedStorage: !Ref DatabaseAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseMasterUsername
      MasterUserPassword: !Ref DatabaseMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - !If [IsMySQL, 'error', !Ref 'AWS::NoValue']
        - !If [IsMySQL, 'general', !Ref 'AWS::NoValue']
        - !If [IsMySQL, 'slowquery', !Ref 'AWS::NoValue']
        - !If [IsPostgreSQL, 'postgresql', !Ref 'AWS::NoValue']
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ==================== S3 BUCKET ====================
  S3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldVersions
            NoncurrentVersionExpirationInDays: 30
            Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3BucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub '${S3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==================== VPC FLOW LOGS ====================
  VPCFlowLogRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - vpc-flow-logs.amazonaws.com
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
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${ProjectName}-${Environment}*'

  VPCFlowLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/vpc/${ProjectName}-${Environment}'
      RetentionInDays: 7

  VPCFlowLog:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-flow-log'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

# ==================== OUTPUTS ====================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  NLBDNSName:
    Description: 'Network Load Balancer DNS name'
    Value: !GetAtt NetworkLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-NLB-DNS'

  NLBHostedZoneId:
    Description: 'Network Load Balancer Hosted Zone ID'
    Value: !GetAtt NetworkLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${AWS::StackName}-NLB-HostedZoneID'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabasePort:
    Description: 'RDS database port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'

  S3BucketName:
    Description: 'S3 bucket name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  EC2KeyPairName:
    Description: 'EC2 Key Pair name'
    Value: !Ref EC2KeyPair
    Export:
      Name: !Sub '${AWS::StackName}-KeyPair'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'
```

## Key Features Implemented

### 1. **Cross-Account Executability**
- No hardcoded account IDs, regions, or ARNs
- Uses pseudo parameters (`AWS::AccountId`, `AWS::Region`, `AWS::Partition`)
- Dynamic AMI resolution via SSM Parameter Store

### 2. **High Availability & Scalability**
- Multi-AZ deployment across 2 availability zones
- Auto Scaling Group with configurable min/max/desired capacity
- Network Load Balancer for traffic distribution
- Multi-AZ RDS database

### 3. **Security Best Practices**
- Private subnets for database tier
- Security groups with least privilege access
- S3 bucket encryption and access policies
- VPC Flow Logs for network monitoring
- IAM roles with minimal required permissions

### 4. **Fully Parameterized**
- All CIDR blocks configurable
- Instance types, database settings, and scaling parameters adjustable
- Project name, environment, and owner tags parameterized

### 5. **Automated Features**
- EC2 Key Pair created automatically
- NAT Gateways with Elastic IPs provisioned
- Auto Scaling Group automatically registers instances with NLB
- User data script configures web server

### 6. **Monitoring & Compliance**
- VPC Flow Logs enabled
- Comprehensive tagging strategy
- CloudWatch Logs integration
- S3 bucket versioning and lifecycle policies

## Deployment Instructions

1. **Save the template** as `infrastructure.yaml`

2. **Deploy via AWS CLI:**
```bash
aws cloudformation create-stack \
    --stack-name my-multi-tier-app \
    --template-body file://infrastructure.yaml \
    --parameters ParameterKey=DatabaseMasterPassword,ParameterValue=YourSecurePassword123! \
    --capabilities CAPABILITY_IAM \
    --region us-west-2
```

3. **Deploy via AWS Console:**
   - Navigate to CloudFormation
   - Create Stack → Upload template
   - Fill in parameters (especially DatabaseMasterPassword)
   - Review and create

## Post-Deployment Verification

After deployment, you can verify:

1. **Access the application:** Use the NLB DNS name from outputs
2. **Check Auto Scaling:** Instances should be running in both AZs
3. **Verify RDS:** Multi-AZ should be enabled
4. **Review VPC Flow Logs:** Check CloudWatch Logs
5. **Test S3 access:** EC2 instances can read/write to the bucket

The template is production-ready and follows AWS best practices for security, scalability, and maintainability.