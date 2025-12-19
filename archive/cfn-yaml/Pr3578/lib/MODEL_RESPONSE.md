### Reasoning Trace

---

Alright, I need to create a comprehensive CloudFormation template that sets up a secure and scalable AWS environment for a web application. Let's break down what's required:

1. **Template Name**: secure-environment-setup.yaml
2. **Region**: us-east-1
3. **Network Setup**:
   - Dedicated VPC
   - Public subnets for web application (EC2 instances)
   - Private subnets for RDS database
   - Proper Network ACLs

4. **Security Components**:
   - IAM roles with least privilege principle
   - Encrypted S3 bucket with strict policies
   - KMS-managed encryption keys

5. **Monitoring and Logging**:
   - CloudWatch for logs, monitoring, and alerts
   - Alarms for critical metrics

6. **Scalability**:
   - Auto Scaling for EC2 instances
   - Elastic Load Balancer (ELB)

7. **High Availability**:
   - Multi-AZ RDS configuration

8. **Compliance**:
   - AWS Config for configuration tracking
   - VPC peering if needed

9. **Naming and Tagging**:
   - "prod-" prefix
   - Consistent tagging for all resources

10. **Cost Optimization**:
    - Efficient Auto Scaling policies

Let me create a CloudFormation template that addresses all these requirements.

First, I'll start with the template structure and then define the resources:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Scalable Production Environment for Web Application'

Parameters:
  # Define parameters here

Resources:
  # Define resources here

Outputs:
  # Define outputs here
```

Now, let's flesh out each section of the template:

### Parameters Section

```yaml
Parameters:
  EnvironmentName:
    Description: Environment name that is prefixed to resource names
    Type: String
    Default: prod

  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Description: CIDR block for Public Subnet 1
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for Public Subnet 2
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for Private Subnet 1
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for Private Subnet 2
    Type: String
    Default: 10.0.4.0/24

  DBInstanceClass:
    Description: RDS instance class
    Type: String
    Default: db.t3.small

  DBName:
    Description: Database name
    Type: String
    Default: proddb

  DBUsername:
    Description: Database admin username
    Type: String
    NoEcho: true

  DBPassword:
    Description: Database admin password
    Type: String
    NoEcho: true

  EC2InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.medium

  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances
    Type: AWS::EC2::KeyPair::KeyName
```

### Resources Section

Let's define the resources one by one:

1. **VPC and Network Resources**:

```yaml
Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc
        - Key: Environment
          Value: !Ref EnvironmentName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-igw
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-public-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-private-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName

  # NAT Gateways for private subnet internet access
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

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-1
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-2
        - Key: Environment
          Value: !Ref EnvironmentName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-route-table
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-private-route-table-1
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-private-route-table-2
        - Key: Environment
          Value: !Ref EnvironmentName

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
```

2. **Network ACLs**:

```yaml
# Network ACLs
PublicNetworkAcl:
  Type: AWS::EC2::NetworkAcl
  Properties:
    VpcId: !Ref VPC
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-public-nacl
      - Key: Environment
        Value: !Ref EnvironmentName

PublicNetworkAclEntryIngressHTTP:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PublicNetworkAcl
    RuleNumber: 100
    Protocol: 6
    RuleAction: allow
    Egress: false
    CidrBlock: 0.0.0.0/0
    PortRange:
      From: 80
      To: 80

PublicNetworkAclEntryIngressHTTPS:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PublicNetworkAcl
    RuleNumber: 110
    Protocol: 6
    RuleAction: allow
    Egress: false
    CidrBlock: 0.0.0.0/0
    PortRange:
      From: 443
      To: 443

PublicNetworkAclEntryIngressSSH:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PublicNetworkAcl
    RuleNumber: 120
    Protocol: 6
    RuleAction: allow
    Egress: false
    CidrBlock: 0.0.0.0/0
    PortRange:
      From: 22
      To: 22

PublicNetworkAclEntryIngressEphemeralTraffic:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PublicNetworkAcl
    RuleNumber: 140
    Protocol: 6
    RuleAction: allow
    Egress: false
    CidrBlock: 0.0.0.0/0
    PortRange:
      From: 1024
      To: 65535

PublicNetworkAclEntryEgressAll:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PublicNetworkAcl
    RuleNumber: 100
    Protocol: -1
    RuleAction: allow
    Egress: true
    CidrBlock: 0.0.0.0/0

PublicSubnet1NetworkAclAssociation:
  Type: AWS::EC2::SubnetNetworkAclAssociation
  Properties:
    SubnetId: !Ref PublicSubnet1
    NetworkAclId: !Ref PublicNetworkAcl

PublicSubnet2NetworkAclAssociation:
  Type: AWS::EC2::SubnetNetworkAclAssociation
  Properties:
    SubnetId: !Ref PublicSubnet2
    NetworkAclId: !Ref PublicNetworkAcl

PrivateNetworkAcl:
  Type: AWS::EC2::NetworkAcl
  Properties:
    VpcId: !Ref VPC
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-private-nacl
      - Key: Environment
        Value: !Ref EnvironmentName

PrivateNetworkAclEntryIngressVPC:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PrivateNetworkAcl
    RuleNumber: 100
    Protocol: -1
    RuleAction: allow
    Egress: false
    CidrBlock: !Ref VpcCIDR

PrivateNetworkAclEntryEgressAll:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PrivateNetworkAcl
    RuleNumber: 100
    Protocol: -1
    RuleAction: allow
    Egress: true
    CidrBlock: 0.0.0.0/0

PrivateSubnet1NetworkAclAssociation:
  Type: AWS::EC2::SubnetNetworkAclAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet1
    NetworkAclId: !Ref PrivateNetworkAcl

PrivateSubnet2NetworkAclAssociation:
  Type: AWS::EC2::SubnetNetworkAclAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet2
    NetworkAclId: !Ref PrivateNetworkAcl
```

3. **Security Groups**:

```yaml
# Security Groups
WebServerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Allow HTTP/HTTPS and SSH access
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
        CidrIp: 0.0.0.0/0
    SecurityGroupEgress:
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-web-sg
      - Key: Environment
        Value: !Ref EnvironmentName

DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Allow database access from web servers
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        SourceSecurityGroupId: !Ref WebServerSecurityGroup
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-db-sg
      - Key: Environment
        Value: !Ref EnvironmentName
```

4. **IAM Roles**:

```yaml
# IAM Roles and Policies
WebAppRole:
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
    RoleName: !Sub ${EnvironmentName}-web-app-role
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-web-app-role
      - Key: Environment
        Value: !Ref EnvironmentName

WebAppPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: !Sub ${EnvironmentName}-web-app-policy
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:ListBucket
          Resource:
            - !Sub arn:aws:s3:::${AppDataBucket}
            - !Sub arn:aws:s3:::${AppDataBucket}/*
        - Effect: Allow
          Action:
            - cloudwatch:PutMetricData
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: '*'
    Roles:
      - !Ref WebAppRole

WebAppInstanceProfile:
  Type: AWS::IAM::InstanceProfile
  Properties:
    Path: /
    Roles:
      - !Ref WebAppRole

DBAccessRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: ec2.amazonaws.com
          Action: sts:AssumeRole
    Path: /
    RoleName: !Sub ${EnvironmentName}-db-access-role
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-db-access-role
      - Key: Environment
        Value: !Ref EnvironmentName

DBAccessPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: !Sub ${EnvironmentName}-db-access-policy
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Action:
            - rds:Connect
          Resource: !Sub arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}
    Roles:
      - !Ref DBAccessRole
```

5. **KMS Key and S3 Bucket**:

```yaml
# KMS Key for encryption
AppDataKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for encrypting app data
    EnableKeyRotation: true
    KeyPolicy:
      Version: '2012-10-17'
      Id: !Sub ${EnvironmentName}-key-policy
      Statement:
        - Sid: Allow root account full control
          Effect: Allow
          Principal:
            AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
          Action: kms:*
          Resource: '*'
        - Sid: Allow use of the key by web app role
          Effect: Allow
          Principal:
            AWS: !GetAtt WebAppRole.Arn
          Action:
            - kms:Encrypt
            - kms:Decrypt
            - kms:ReEncrypt*
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: '*'
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-app-data-key
      - Key: Environment
        Value: !Ref EnvironmentName

AppDataKeyAlias:
  Type: AWS::KMS::Alias
  Properties:
    AliasName: !Sub alias/${EnvironmentName}-app-data-key
    TargetKeyId: !Ref AppDataKey

# S3 Bucket for app data
AppDataBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub ${EnvironmentName}-app-data-${AWS::AccountId}
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref AppDataKey
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    VersioningConfiguration:
      Status: Enabled
    LoggingConfiguration:
      DestinationBucketName: !Ref LoggingBucket
      LogFilePrefix: app-data-access-logs/
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-app-data
      - Key: Environment
        Value: !Ref EnvironmentName

AppDataBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref AppDataBucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: DenyUnEncryptedObjectUploads
          Effect: Deny
          Principal: '*'
          Action: s3:PutObject
          Resource: !Sub arn:aws:s3:::${AppDataBucket}/*
          Condition:
            StringNotEquals:
              's3:x-amz-server-side-encryption': aws:kms
        - Sid: DenyInsecureConnections
          Effect: Deny
          Principal: '*'
          Action: s3:*
          Resource: !Sub arn:aws:s3:::${AppDataBucket}/*
          Condition:
            Bool:
              aws:SecureTransport: false

LoggingBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub ${EnvironmentName}-logs-${AWS::AccountId}
    AccessControl: LogDeliveryWrite
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    VersioningConfiguration:
      Status: Enabled
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-logs
      - Key: Environment
        Value: !Ref EnvironmentName
```

6. **RDS Database**:

```yaml
# Database Subnet Group
DBSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupDescription: Subnet group for RDS database
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-db-subnet-group
      - Key: Environment
        Value: !Ref EnvironmentName

# RDS Database Instance
RDSInstance:
  Type: AWS::RDS::DBInstance
  Properties:
    DBName: !Ref DBName
    AllocatedStorage: 20
    DBInstanceClass: !Ref DBInstanceClass
    Engine: mysql
    EngineVersion: 8.0.28
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Ref DBPassword
    MultiAZ: true
    StorageType: gp2
    StorageEncrypted: true
    KmsKeyId: !Ref AppDataKey
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref DatabaseSecurityGroup
    BackupRetentionPeriod: 7
    DeleteAutomatedBackups: false
    PubliclyAccessible: false
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-rds
      - Key: Environment
        Value: !Ref EnvironmentName
```

7. **Load Balancer and Auto Scaling**:

```yaml
# Load Balancer
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: !Sub ${EnvironmentName}-alb
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
    SecurityGroups:
      - !Ref WebServerSecurityGroup
    Scheme: internet-facing
    LoadBalancerAttributes:
      - Key: idle_timeout.timeout_seconds
        Value: '60'
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-alb
      - Key: Environment
        Value: !Ref EnvironmentName

ALBTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: !Sub ${EnvironmentName}-tg
    Port: 80
    Protocol: HTTP
    VpcId: !Ref VPC
    HealthCheckPath: /health
    HealthCheckIntervalSeconds: 30
    HealthCheckTimeoutSeconds: 5
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 5
    TargetType: instance
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-tg
      - Key: Environment
        Value: !Ref EnvironmentName

ALBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref ALBTargetGroup
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP

# Launch Template
WebAppLaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateName: !Sub ${EnvironmentName}-launch-template
    VersionDescription: Initial version
    LaunchTemplateData:
      ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 - please replace with latest AMI ID
      InstanceType: !Ref EC2InstanceType
      KeyName: !Ref KeyName
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile:
        Name: !Ref WebAppInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<html><body><h1>Hello World from ${EnvironmentName} Environment</h1></body></html>" > /var/www/html/index.html

          # Set up CloudWatch Logs agent
          yum install -y awslogs
          cat > /etc/awslogs/awslogs.conf << EOF
          [general]
          state_file = /var/lib/awslogs/agent-state

          [/var/log/httpd/access_log]
          file = /var/log/httpd/access_log
          log_group_name = ${EnvironmentName}-web-access-logs
          log_stream_name = {instance_id}/access.log
          datetime_format = %d/%b/%Y:%H:%M:%S %z

          [/var/log/httpd/error_log]
          file = /var/log/httpd/error_log
          log_group_name = ${EnvironmentName}-web-error-logs
          log_stream_name = {instance_id}/error.log
          datetime_format = %d/%b/%Y:%H:%M:%S %z
          EOF

          # Start CloudWatch Logs agent
          systemctl start awslogsd
          systemctl enable awslogsd
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 30
            VolumeType: gp2
            DeleteOnTermination: true
            Encrypted: true
      MetadataOptions:
        HttpEndpoint: enabled
        HttpTokens: required # IMDSv2
      TagSpecifications:
        - ResourceType: instance
          Tags:
            - Key: Name
              Value: !Sub ${EnvironmentName}-web-server
            - Key: Environment
              Value: !Ref EnvironmentName

# Auto Scaling Group
WebAppAutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    AutoScalingGroupName: !Sub ${EnvironmentName}-asg
    LaunchTemplate:
      LaunchTemplateId: !Ref WebAppLaunchTemplate
      Version: !GetAtt WebAppLaunchTemplate.LatestVersionNumber
    MinSize: 2
    MaxSize: 10
    DesiredCapacity: 2
    VPCZoneIdentifier:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
    TargetGroupARNs:
      - !Ref ALBTargetGroup
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
    Tags:
      - Key: Name
        Value: !Sub ${EnvironmentName}-web-server
        PropagateAtLaunch: true
      - Key: Environment
        Value: !Ref EnvironmentName
        PropagateAtLaunch: true

# Scaling Policies
WebAppScaleUpPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    AutoScalingGroupName: !Ref WebAppAutoScalingGroup
    PolicyType: TargetTrackingScaling
    TargetTrackingConfiguration:
      PredefinedMetricSpecification:
        PredefinedMetricType: ASGAverageCPUUtilization
      TargetValue: 70.0
```

8. **CloudWatch Monitoring**:

```yaml
# CloudWatch Alarms
CPUUtilizationAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub ${EnvironmentName}-high-cpu-alarm
    AlarmDescription: Alarm if CPU exceeds 80% for 5 minutes
    MetricName: CPUUtilization
    Namespace: AWS/EC2
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    AlarmActions:
      - !Ref SNSTopic
    Dimensions:
      - Name: AutoScalingGroupName
        Value: !Ref WebAppAutoScalingGroup
    ComparisonOperator: GreaterThanThreshold

RDSCPUUtilizationAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub ${EnvironmentName}-db-high-cpu-alarm
    AlarmDescription: Alarm if RDS CPU exceeds 80% for 5 minutes
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    AlarmActions:
      - !Ref SNSTopic
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref RDSInstance
    ComparisonOperator: GreaterThanThreshold

RDSFreeStorageSpaceAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub ${EnvironmentName}-db-free-storage-alarm
    AlarmDescription: Alarm if RDS free storage space is less than 1GB
    MetricName: FreeStorageSpace
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 1000000000 # 1GB in bytes
    AlarmActions:
      - !Ref SNSTopic
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref RDSInstance
    ComparisonOperator: LessThanThreshold

SNSTopic:
  Type: AWS::SNS::Topic
  Properties:
    DisplayName: !Sub ${EnvironmentName}-alarms
    TopicName: !Sub ${EnvironmentName}-alarms

# CloudWatch Dashboard
AppDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: !Sub ${EnvironmentName}-dashboard
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${WebAppAutoScalingGroup}" ]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "EC2 CPU Utilization"
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${RDSInstance}" ]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "RDS CPU Utilization"
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}" ]
              ],
              "period": 300,
              "stat": "Sum",
              "region": "${AWS::Region}",
              "title": "ALB Request Count"
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${RDSInstance}" ]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "RDS Free Storage Space"
            }
          }
        ]
      }
```

9. **AWS Config**:

```yaml
# AWS Config
ConfigRecorder:
  Type: AWS::Config::ConfigurationRecorder
  Properties:
    Name: !Sub ${EnvironmentName}-config-recorder
    RecordingGroup:
      AllSupported: true
      IncludeGlobalResources: true
    RoleARN: !GetAtt ConfigRole.Arn

ConfigDeliveryChannel:
  Type: AWS::Config::DeliveryChannel
  Properties:
    Name: !Sub ${EnvironmentName}-config-delivery
    S3BucketName: !Ref LoggingBucket
    S3KeyPrefix: config-snapshots
    ConfigSnapshotDeliveryProperties:
      DeliveryFrequency: Six_Hours

ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
    Policies:
      - PolicyName: !Sub ${EnvironmentName}-config-s3-policy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:PutObject
              Resource: !Sub arn:aws:s3:::${LoggingBucket}/config-snapshots/*
              Condition:
                StringLike:
                  s3:x-amz-acl: bucket-owner-full-control
            - Effect: Allow
              Action:
                - s3:GetBucketAcl
              Resource: !Sub arn:aws:s3:::${LoggingBucket}
```

### Outputs Section

```yaml
Outputs:
  VPC:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC

  PublicSubnets:
    Description: List of public subnets
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-PublicSubnets

  PrivateSubnets:
    Description: List of private subnets
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-PrivateSubnets

  WebServerSecurityGroup:
    Description: Security group for web servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-WebServerSecurityGroup

  DatabaseSecurityGroup:
    Description: Security group for database
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-DatabaseSecurityGroup

  ApplicationLoadBalancerDNS:
    Description: DNS name for the application load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALBDNS

  AppDataBucket:
    Description: S3 bucket for application data
    Value: !Ref AppDataBucket
    Export:
      Name: !Sub ${EnvironmentName}-AppDataBucket

  RDSEndpoint:
    Description: Endpoint for the RDS database
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-RDSEndpoint

  WebAppAutoScalingGroup:
    Description: Auto Scaling Group for web application
    Value: !Ref WebAppAutoScalingGroup
    Export:
      Name: !Sub ${EnvironmentName}-ASG

  DashboardURL:
    Description: URL to the CloudWatch Dashboard
    Value: !Sub https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${EnvironmentName}-dashboard
    Export:
      Name: !Sub ${EnvironmentName}-DashboardURL
```

Now, let's assemble the complete template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Scalable Production Environment for Web Application'

Parameters:
  EnvironmentName:
    Description: Environment name that is prefixed to resource names
    Type: String
    Default: prod

  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Description: CIDR block for Public Subnet 1
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for Public Subnet 2
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for Private Subnet 1
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for Private Subnet 2
    Type: String
    Default: 10.0.4.0/24

  DBInstanceClass:
    Description: RDS instance class
    Type: String
    Default: db.t3.small

  DBName:
    Description: Database name
    Type: String
    Default: proddb

  DBUsername:
    Description: Database admin username
    Type: String
    NoEcho: true

  DBPassword:
    Description: Database admin password
    Type: String
    NoEcho: true

  EC2InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.medium

  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances
    Type: AWS::EC2::KeyPair::KeyName

Resources:
  # VPC and Network Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-igw
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName

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

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-1
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-2
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-route-table
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-private-route-table-1
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-private-route-table-2
        - Key: Environment
          Value: !Ref EnvironmentName

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

  # Network ACLs
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-nacl
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicNetworkAclEntryIngressHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  PublicNetworkAclEntryIngressHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  PublicNetworkAclEntryIngressSSH:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 22
        To: 22

  PublicNetworkAclEntryIngressEphemeralTraffic:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 140
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  PublicNetworkAclEntryEgressAll:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: true
      CidrBlock: 0.0.0.0/0

  PublicSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-nacl
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateNetworkAclEntryIngressVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: false
      CidrBlock: !Ref VpcCIDR

  PrivateNetworkAclEntryEgressAll:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: true
      CidrBlock: 0.0.0.0/0

  PrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP/HTTPS and SSH access
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
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-web-sg
        - Key: Environment
          Value: !Ref EnvironmentName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow database access from web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-sg
        - Key: Environment
          Value: !Ref EnvironmentName

  # IAM Roles and Policies
  WebAppRole:
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
      RoleName: !Sub ${EnvironmentName}-web-app-role
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-web-app-role
        - Key: Environment
          Value: !Ref EnvironmentName

  WebAppPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub ${EnvironmentName}-web-app-policy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !Sub arn:aws:s3:::${AppDataBucket}
              - !Sub arn:aws:s3:::${AppDataBucket}/*
          - Effect: Allow
            Action:
              - cloudwatch:PutMetricData
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: '*'
      Roles:
        - !Ref WebAppRole

  WebAppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref WebAppRole

  DBAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      RoleName: !Sub ${EnvironmentName}-db-access-role
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-access-role
        - Key: Environment
          Value: !Ref EnvironmentName

  DBAccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub ${EnvironmentName}-db-access-policy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - rds:Connect
            Resource: !Sub arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}
      Roles:
        - !Ref DBAccessRole

  # KMS Key for encryption
  AppDataKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting app data
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: !Sub ${EnvironmentName}-key-policy
        Statement:
          - Sid: Allow root account full control
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow use of the key by web app role
            Effect: Allow
            Principal:
              AWS: !GetAtt WebAppRole.Arn
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-app-data-key
        - Key: Environment
          Value: !Ref EnvironmentName

  AppDataKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/${EnvironmentName}-app-data-key
      TargetKeyId: !Ref AppDataKey

  # S3 Bucket for app data
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-logs-${AWS::AccountId}
      AccessControl: LogDeliveryWrite
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-logs
        - Key: Environment
          Value: !Ref EnvironmentName

  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-app-data-${AWS::AccountId}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref AppDataKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: app-data-access-logs/
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-app-data
        - Key: Environment
          Value: !Ref EnvironmentName

  AppDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub arn:aws:s3:::${AppDataBucket}/*
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': aws:kms
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource: !Sub arn:aws:s3:::${AppDataBucket}/*
            Condition:
              Bool:
                aws:SecureTransport: false

  # Database Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-subnet-group
        - Key: Environment
          Value: !Ref EnvironmentName

  # RDS Database Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: !Ref DBName
      AllocatedStorage: 20
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      Engine
### Answer
---

```
