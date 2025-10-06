### Reasoning Trace

---

Let's start by breaking down the requirements and planning the CloudFormation template structure.

Key Components to Include in the Template:

1. VPC with CIDR block (e.g., 10.0.0.0/16)
2. 3 Public Subnets (one in each AZ)
3. 3 Private Subnets (one in each AZ)
4. Internet Gateway
5. NAT Gateways (one in each AZ)
6. Route Tables (separate for public and private subnets)
7. Security Groups
8. S3 Bucket for Flow Logs (with encryption)
9. VPC Flow Logs
10. RDS MySQL (Multi-AZ, encrypted)
11. Bastion Host
12. Load Balancer
13. IAM Roles
14. EC2 Instances
15. Tagging (Environment: Production)

Let's start building the CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production High-Availability VPC Infrastructure with Multi-AZ Deployment'

Parameters:
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in the first Availability Zone
    Type: String
    Default: 10.0.0.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in the second Availability Zone
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet3CIDR:
    Description: CIDR block for the public subnet in the third Availability Zone
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in the first Availability Zone
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in the second Availability Zone
    Type: String
    Default: 10.0.4.0/24

  PrivateSubnet3CIDR:
    Description: CIDR block for the private subnet in the third Availability Zone
    Type: String
    Default: 10.0.5.0/24

  BastionKeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the bastion host
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: must be the name of an existing EC2 KeyPair.

  DBName:
    Description: The database name
    Type: String
    Default: proddb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: must begin with a letter and contain only alphanumeric characters.

  DBUser:
    Description: The database admin account username
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: must begin with a letter and contain only alphanumeric characters.

  DBPassword:
    Description: The database admin account password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: must contain only alphanumeric characters.

  DBClass:
    Description: Database instance class
    Type: String
    Default: db.t3.small
    AllowedValues: [db.t3.micro, db.t3.small, db.t3.medium, db.r5.large]
    ConstraintDescription: must select a valid database instance type.

  DBAllocatedStorage:
    Description: The size of the database (GiB)
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 1024
    ConstraintDescription: must be between 20 and 1024 GiB.

  BastionInstanceType:
    Description: Bastion Host EC2 instance type
    Type: String
    Default: t3.micro
    AllowedValues: [t3.nano, t3.micro, t3.small, t3.medium]
    ConstraintDescription: must be a valid EC2 instance type.

  AppInstanceType:
    Description: Application Server EC2 instance type
    Type: String
    Default: t3.small
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
    ConstraintDescription: must be a valid EC2 instance type.

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: Production VPC
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: Production IGW
        - Key: Environment
          Value: Production

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
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ1)
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ2)
        - Key: Environment
          Value: Production

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PublicSubnet3CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ3)
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ1)
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ2)
        - Key: Environment
          Value: Production

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet3CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ3)
        - Key: Environment
          Value: Production

  # NAT Gateways with Elastic IPs
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ1)
        - Key: Environment
          Value: Production

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ2)
        - Key: Environment
          Value: Production

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ3)
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 1
        - Key: Environment
          Value: Production

  PublicRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 2
        - Key: Environment
          Value: Production

  PublicRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 3
        - Key: Environment
          Value: Production

  DefaultPublicRoute1:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPublicRoute2:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPublicRoute3:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable2
      SubnetId: !Ref PublicSubnet2

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable3
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 1
        - Key: Environment
          Value: Production

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 2
        - Key: Environment
          Value: Production

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 3
        - Key: Environment
          Value: Production

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion hosts
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0 # This should be restricted to your IP in a real environment
      Tags:
        - Key: Name
          Value: Bastion Security Group
        - Key: Environment
          Value: Production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: Web Server Security Group
        - Key: Environment
          Value: Production

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for load balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
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
          Value: Load Balancer Security Group
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: Database Security Group
        - Key: Environment
          Value: Production

  # S3 Bucket for VPC Flow Logs with Encryption
  FlowLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: VPC Flow Logs Bucket
        - Key: Environment
          Value: Production

  FlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub ${FlowLogsBucket.Arn}/*
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt FlowLogsBucket.Arn

  # VPC Flow Logs
  FlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: flowlogsRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*

  VpcFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn
      LogDestinationType: s3
      LogDestination: !GetAtt FlowLogsBucket.Arn
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: Production VPC Flow Logs
        - Key: Environment
          Value: Production

  # RDS MySQL DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: DB subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: Production DB Subnet Group
        - Key: Environment
          Value: Production

  # RDS MySQL Instance with Multi-AZ and Encryption
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: !Ref DBName
      Engine: MySQL
      MultiAZ: true
      StorageEncrypted: true
      MasterUsername: !Ref DBUser
      MasterUserPassword: !Ref DBPassword
      DBInstanceClass: !Ref DBClass
      AllocatedStorage: !Ref DBAllocatedStorage
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !GetAtt DatabaseSecurityGroup.GroupId
      BackupRetentionPeriod: 7
      DeleteAutomatedBackups: false
      Tags:
        - Key: Name
          Value: Production MySQL RDS
        - Key: Environment
          Value: Production

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Path: /

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2InstanceRole

  # Bastion Host
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref BastionInstanceType
      KeyName: !Ref BastionKeyName
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: Bastion Host
        - Key: Environment
          Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: Production Application Load Balancer
        - Key: Environment
          Value: Production

  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 80
      Protocol: HTTP
      UnhealthyThresholdCount: 5
      VpcId: !Ref VPC
      TargetType: instance
      Tags:
        - Key: Name
          Value: Production Target Group
        - Key: Environment
          Value: Production

  # Launch Template for App Instances
  AppServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${AWS::StackName}-app-launch-template
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: ami-12345678 # Replace with appropriate AMI ID
        InstanceType: !Ref AppInstanceType
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            # Install necessary software
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "Hello from $(hostname)" > /var/www/html/index.html

  # Auto Scaling Group for App Instances
  AppServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${AWS::StackName}-app-asg
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      LaunchTemplate:
        LaunchTemplateId: !Ref AppServerLaunchTemplate
        Version: !GetAtt AppServerLaunchTemplate.LatestVersionNumber
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: App Server
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnets:
    Description: Public subnets
    Value:
      !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: Private subnets
    Value:
      !Join [
        ',',
        [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3],
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  BastionIP:
    Description: Bastion host public IP
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-IP'

  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LB-DNS'

  RDSEndpoint:
    Description: RDS endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  FlowLogsBucketName:
    Description: Name of the S3 bucket for VPC flow logs
    Value: !Ref FlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-Bucket'
```

The above CloudFormation template satisfies the requirements specified, but there might be a need for some adjustments or improvements:

1. For the EC2 instances, a real AMI ID should be specified instead of "ami-12345678".
2. It might be more secure to use AWS Secrets Manager for the database password instead of passing it as a parameter.
3. The SSH access to the bastion host should ideally be restricted to specific IP addresses rather than allowing access from anywhere (0.0.0.0/0).
4. We could add more advanced features such as auto scaling policies, CloudWatch alarms, and SNS notifications.
5. For enhanced security, we could implement AWS WAF with the load balancer.

Let me enhance the template with some additional security features and best practices:

1. Replace the database password parameter with a reference to Secrets Manager.
2. Add a HTTPS listener to the load balancer.
3. Configure CloudWatch Alarms for monitoring.
4. Implement WAF for the load balancer.
5. Set up SNS notifications for critical events.

Let's improve the template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production High-Availability VPC Infrastructure with Multi-AZ Deployment'

Parameters:
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in the first Availability Zone
    Type: String
    Default: 10.0.0.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in the second Availability Zone
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet3CIDR:
    Description: CIDR block for the public subnet in the third Availability Zone
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in the first Availability Zone
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in the second Availability Zone
    Type: String
    Default: 10.0.4.0/24

  PrivateSubnet3CIDR:
    Description: CIDR block for the private subnet in the third Availability Zone
    Type: String
    Default: 10.0.5.0/24

  BastionKeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the bastion host
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: must be the name of an existing EC2 KeyPair.

  DBName:
    Description: The database name
    Type: String
    Default: proddb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: must begin with a letter and contain only alphanumeric characters.

  DBUser:
    Description: The database admin account username
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: must begin with a letter and contain only alphanumeric characters.

  DBClass:
    Description: Database instance class
    Type: String
    Default: db.t3.small
    AllowedValues: [db.t3.micro, db.t3.small, db.t3.medium, db.r5.large]
    ConstraintDescription: must select a valid database instance type.

  DBAllocatedStorage:
    Description: The size of the database (GiB)
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 1024
    ConstraintDescription: must be between 20 and 1024 GiB.

  BastionInstanceType:
    Description: Bastion Host EC2 instance type
    Type: String
    Default: t3.micro
    AllowedValues: [t3.nano, t3.micro, t3.small, t3.medium]
    ConstraintDescription: must be a valid EC2 instance type.

  AppInstanceType:
    Description: Application Server EC2 instance type
    Type: String
    Default: t3.small
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
    ConstraintDescription: must be a valid EC2 instance type.

  BastionAllowedCIDR:
    Description: CIDR block allowed to SSH to the bastion host
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: '(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})'
    ConstraintDescription: must be a valid CIDR range of the form x.x.x.x/x.

  SSLCertificateARN:
    Description: ARN of the SSL certificate for HTTPS
    Type: String
    Default: ''
    ConstraintDescription: must be a valid certificate ARN.

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: Production VPC
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: Production IGW
        - Key: Environment
          Value: Production

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
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ1)
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ2)
        - Key: Environment
          Value: Production

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PublicSubnet3CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet (AZ3)
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ1)
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ2)
        - Key: Environment
          Value: Production

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet3CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet (AZ3)
        - Key: Environment
          Value: Production

  # NAT Gateways with Elastic IPs
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ1)
        - Key: Environment
          Value: Production

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ2)
        - Key: Environment
          Value: Production

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: NAT Gateway (AZ3)
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 1
        - Key: Environment
          Value: Production

  PublicRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 2
        - Key: Environment
          Value: Production

  PublicRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Public Route Table 3
        - Key: Environment
          Value: Production

  DefaultPublicRoute1:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPublicRoute2:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPublicRoute3:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable2
      SubnetId: !Ref PublicSubnet2

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable3
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 1
        - Key: Environment
          Value: Production

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 2
        - Key: Environment
          Value: Production

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: Private Route Table 3
        - Key: Environment
          Value: Production

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion hosts
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref BastionAllowedCIDR
      Tags:
        - Key: Name
          Value: Bastion Security Group
        - Key: Environment
          Value: Production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: Web Server Security Group
        - Key: Environment
          Value: Production

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for load balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
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
          Value: Load Balancer Security Group
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: Database Security Group
        - Key: Environment
          Value: Production

  # S3 Bucket for VPC Flow Logs with Encryption
  FlowLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: VPC Flow Logs Bucket
        - Key: Environment
          Value: Production

  FlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub ${FlowLogsBucket.Arn}/*
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt FlowLogsBucket.Arn

  # VPC Flow Logs
  FlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: flowlogsRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*

  VpcFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn
      LogDestinationType: s3
      LogDestination: !GetAtt FlowLogsBucket.Arn
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: Production VPC Flow Logs
        - Key: Environment
          Value: Production

  # Database Password Secret
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'Secret for Production RDS Database Password'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUser}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: Production

  # RDS MySQL DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: DB subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: Production DB Subnet Group
        - Key: Environment
          Value: Production

  # RDS MySQL Instance with Multi-AZ and Encryption
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: !Ref DBName
      Engine: MySQL
      MultiAZ: true
      StorageEncrypted: true
      MasterUsername: !Ref DBUser
      MasterUserPassword:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref DBPasswordSecret,
            ':SecretString:password}}',
          ],
        ]
      DBInstanceClass: !Ref DBClass
      AllocatedStorage: !Ref DBAllocatedStorage
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !GetAtt DatabaseSecurityGroup.GroupId
      BackupRetentionPeriod: 7
      DeleteAutomatedBackups: false
      Tags:
        - Key: Name
          Value: Production MySQL RDS
        - Key: Environment
          Value: Production

  # SNS Topic for Alarms
  AlarmNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: ProdInfraAlarms
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if CPU exceeds 75% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 75
      AlarmActions:
        - !Ref AlarmNotificationTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AppServerAutoScalingGroup
      ComparisonOperator: GreaterThanThreshold

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if RDS CPU exceeds 80% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      AlarmActions:
        - !Ref AlarmNotificationTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      ComparisonOperator: GreaterThanThreshold

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Path: /

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2InstanceRole

  # Bastion Host
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref BastionInstanceType
      KeyName: !Ref BastionKeyName
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: Bastion Host
        - Key: Environment
          Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: Production Application Load Balancer
        - Key: Environment
          Value: Production

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            Host: '#{host}'
            Path: '/#{path}'
            Query: '#{query}'
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificateARN

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 80
      Protocol: HTTP
      UnhealthyThresholdCount: 5
      VpcId: !Ref VPC
      TargetType: instance
      Tags:
        - Key: Name
          Value: Production Target Group
        - Key: Environment
          Value: Production

  # Launch Template for App Instances
  AppServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${AWS::StackName}-app-launch-template
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: ami-12345678 # Replace with appropriate AMI ID
        InstanceType: !Ref AppInstanceType
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            # Install necessary software
            yum update -y
            yum install -y httpd
            amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2
            yum install -y amazon-cloudwatch-agent
            systemctl start httpd
            systemctl enable httpd
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "metrics": {
                "append_dimensions": {
                  "AutoScalingGroupName": "${!aws:AutoScalingGroupName}",
                  "ImageId": "${!aws:ImageId}",
                  "InstanceId": "${!aws:InstanceId}",
                  "InstanceType": "${!aws:InstanceType}"
                },
                "metrics_collected": {
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
                        "log_group_name": "${AWS::StackName}/httpd/access_log",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${AWS::StackName}/httpd/error_log",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            # Create a simple web page
            echo "<html><body><h1>Hello from $(hostname)</h1><p>Production Environment</p></body></html>" > /var/www/html/index.html

  # Auto Scaling Group for App Instances
  AppServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${AWS::StackName}-app-asg
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      LaunchTemplate:
        LaunchTemplateId: !Ref AppServerLaunchTemplate
        Version: !GetAtt AppServerLaunchTemplate.LatestVersionNumber
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: App Server
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # Auto Scaling Policies
  AppServerScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AppServerAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref SSLCertificateARN, '']]

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnets:
    Description: Public subnets
    Value:
      !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: Private subnets
    Value:
      !Join [
        ',',
        [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3],
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  BastionIP:
    Description: Bastion host public IP
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-IP'

  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LB-DNS'

  RDSEndpoint:
    Description: RDS endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  FlowLogsBucketName:

### Answer
---
```
