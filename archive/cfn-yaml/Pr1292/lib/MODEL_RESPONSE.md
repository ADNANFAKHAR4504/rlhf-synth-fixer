```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade web application infrastructure with VPC, public/private subnets, RDS, and secure S3 access'

Parameters:
  # Database configuration parameters
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS instance'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  # EC2 instance configuration
  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for web servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

Resources:
  # VPC - Main network container for all resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'Production-VPC'

  # Internet Gateway - Provides internet access to public subnets
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'Production-IGW'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1 - Hosts load balancer and NAT gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Public Subnet 1 (AZ1)'

  # Public Subnet 2 - Second AZ for high availability
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Public Subnet 2 (AZ2)'

  # Private Subnet 1 - Hosts web servers with outbound internet via NAT
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: 'Private Subnet 1 (AZ1)'

  # Private Subnet 2 - Second AZ for high availability
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: 'Private Subnet 2 (AZ2)'

  # Database Subnet 1 - Isolated subnet for RDS
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.21.0/24'
      Tags:
        - Key: Name
          Value: 'Database Subnet 1 (AZ1)'

  # Database Subnet 2 - Second AZ for RDS Multi-AZ deployment
  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.22.0/24'
      Tags:
        - Key: Name
          Value: 'Database Subnet 2 (AZ2)'

  # NAT Gateway EIP - Elastic IP for NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'NAT Gateway 1 EIP'

  # NAT Gateway - Provides outbound internet access for private subnets
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: 'NAT Gateway 1'

  # Public Route Table - Routes traffic to Internet Gateway
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'Public Routes'

  # Default public route - All traffic to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate public subnets with public route table
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

  # Private Route Table - Routes outbound traffic through NAT Gateway
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'Private Routes (AZ1)'

  # Default private route - Outbound traffic to NAT Gateway
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Associate private subnets with private route table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTable Association
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # S3 Bucket - Storage for application assets
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-assets-${AWS::AccountId}'
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

  # IAM Role - Grants EC2 instances least-privilege access to S3
  EC2S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-S3-Access-Role'
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
        - PolicyName: S3BucketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Allow listing bucket contents
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt S3Bucket.Arn
              # Allow read/write access to objects in the bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket.Arn}/*'

  # Instance Profile - Allows EC2 instances to assume the IAM role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2S3AccessRole

  # Security Group - Load Balancer (allows HTTP/HTTPS from internet)
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'LoadBalancer-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Allow HTTP traffic from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from internet'
        # Allow HTTPS traffic from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic from internet'
      SecurityGroupEgress:
        # Allow all outbound traffic to web servers
        - IpProtocol: -1
          CidrIp: '10.0.0.0/16'
          Description: 'Allow all traffic to VPC resources'
      Tags:
        - Key: Name
          Value: 'LoadBalancer Security Group'

  # Security Group - Web Servers (only accessible via Load Balancer)
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'WebServer-SG'
      GroupDescription: 'Security group for web servers - only accessible via load balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Allow HTTP traffic only from Load Balancer
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTP from Load Balancer only'
        # Allow SSH access from within VPC for management
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
          Description: 'Allow SSH from within VPC'
      SecurityGroupEgress:
        # Allow all outbound traffic for updates and S3 access
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'WebServer Security Group'

  # Security Group - Database (only accessible from web servers)
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'Database-SG'
      GroupDescription: 'Security group for RDS database - only accessible from web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Allow MySQL/Aurora access only from web servers
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow MySQL access from web servers only'
      Tags:
        - Key: Name
          Value: 'Database Security Group'

  # DB Subnet Group - Required for RDS deployment across multiple AZs
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: 'Database Subnet Group'

  # RDS Instance - MySQL database with encryption at rest enabled
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      # Encryption at rest is mandatory per requirements
      StorageEncrypted: true
      # Use default KMS key for encryption
      KmsKeyId: alias/aws/rds
      VpcSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      # Enable automated backups
      BackupRetentionPeriod: 7
      # Enable Multi-AZ for high availability
      MultiAZ: true
      # Enable monitoring
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      # Enable deletion protection for production
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: 'Production Database'

  # Application Load Balancer - Distributes traffic to web servers
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
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
          Value: 'Application Load Balancer'

  # Target Group - Defines health check and routing for web servers
  WebServerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-WebServers'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: 'WebServer Target Group'

  # Load Balancer Listener - Routes HTTP traffic to target group
  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebServerTargetGroup

  # Launch Template - Defines EC2 instance configuration
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-WebServer-Template'
      LaunchTemplateData:
        ImageId: 'ami-0c2d3e23b7b644f5c' # Amazon Linux 2023 AMI in us-west-2
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          # Base64 encoded script to install and start Apache web server
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Web Server in ${AWS::Region}</h1>" > /var/www/html/index.html
            # Install CloudWatch agent for monitoring
            yum install -y amazon-cloudwatch-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'Production Web Server'

  # Auto Scaling Group - Manages web server instances across AZs
  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-WebServer-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref WebServerTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: 'Production Web Server'
          PropagateAtLaunch: true

Outputs:
  # VPC Information
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  # Load Balancer DNS Name
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  # Database Endpoint
  DatabaseEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  # S3 Bucket Name
  S3BucketName:
    Description: 'Name of the S3 bucket'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  # IAM Role ARN
  EC2RoleArn:
    Description: 'ARN of the IAM role for EC2 instances'
    Value: !GetAtt EC2S3AccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role-ARN'
```
