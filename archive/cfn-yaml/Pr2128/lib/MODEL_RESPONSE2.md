You're absolutely right! The template was cut off. Let me provide the complete CloudFormation template with the missing sections:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready multi-region AWS infrastructure stack for company migration initiative. Supports us-east-1 and us-west-2 with high availability, security, and compliance features.'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Deployment environment'

  CompanyIPRange:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'Company IP range for restricted access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'RDS MySQL master username'
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'RDS MySQL master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge']
    Description: 'EC2 instance type for application servers'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for Route 53 hosted zone'

Mappings:
  RegionMap:
    us-east-1:
      AMI: 'ami-0abcdef1234567890'  # Amazon Linux 2 AMI
      AZ1: 'us-east-1a'
      AZ2: 'us-east-1b'
      AZ3: 'us-east-1c'
    us-west-2:
      AMI: 'ami-0fedcba0987654321'  # Amazon Linux 2 AMI
      AZ1: 'us-west-2a'
      AZ2: 'us-west-2b'
      AZ3: 'us-west-2c'

  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.100.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.200.0/24'

Conditions:
  IsProduction: !Equals [!Ref Environment, 'production']
  CreateMultiAZ: !Equals [!Ref Environment, 'production']

Resources:
  # ============================================================================
  # KMS Key for Encryption
  # ============================================================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for infrastructure encryption'
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
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-kms-key'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Environment
          Value: !Ref Environment

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-key'
      TargetKeyId: !Ref KMSKey

  # ============================================================================
  # VPC and Network Infrastructure
  # ============================================================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

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
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Type
          Value: 'Private'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Type
          Value: 'Database'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
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
          Value: !Sub '${AWS::StackName}-nat-eip-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

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
          Value: !Sub '${AWS::StackName}-private-routes-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

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
          Value: !Sub '${AWS::StackName}-private-routes-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

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

  # ============================================================================
  # Security Groups
  # ============================================================================
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref CompanyIPRange
          Description: 'HTTP access from company IP range'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref CompanyIPRange
          Description: 'HTTPS access from company IP range'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTPS from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref CompanyIPRange
          Description: 'SSH from company IP range'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # ============================================================================
  # IAM Roles and Policies
  # ============================================================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref S3Bucket
      Tags:
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-ec2-profile'
      Roles:
        - !Ref EC2Role

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # ============================================================================
  # S3 Bucket
  # ============================================================================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-bucket'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Environment
          Value: !Ref Environment

  # ============================================================================
  # RDS Database
  # ============================================================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${AWS::StackName}-db-params'
      Description: 'Parameter group for MySQL database'
      Family: mysql8.0
      Parameters:
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}'
        max_connections: '1000'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-params'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-mysql'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: !If [IsProduction, 7, 3]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !If [CreateMultiAZ, true, false]
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref KMSKey
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-mysql'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'
        - Key: Environment
          Value: !Ref Environment

  # ============================================================================
  # Application Load Balancer
  # ============================================================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ============================================================================
  # Launch Template and Auto Scaling Group
  # ============================================================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        DisableApiTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd mysql
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::Region}</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "AWS/EC2/Custom",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${WebServerLogGroup}",
                        "log_stream_name": "{instance_id}/httpd/access.log"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${WebServerLogGroup}",
                        "log_stream_name": "{instance_id}/httpd/error.log"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-web-server'
              - Key: Project
                Value: 'Migration'
              - Key: Creator
                Value: 'CloudEngineer'
              - Key: Environment
                Value: !Ref Environment

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg'
          PropagateAtLaunch: false
        - Key: Project
          Value: 'Migration'
          PropagateAtLaunch: true
        - Key: Creator
          Value: 'CloudEngineer'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      Sc
```
