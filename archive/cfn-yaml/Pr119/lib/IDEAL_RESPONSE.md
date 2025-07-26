# Ideal CloudFormation Template Response

## Template Overview

This is the ideal CloudFormation template that demonstrates best practices for the infrastructure challenge. It creates a complete, secure, development-ready web hosting environment.

## Template Features

- ✅ Multi-AZ VPC with public subnets
- ✅ Secure EC2 instance with parameterized SSH access
- ✅ Encrypted S3 bucket with versioning
- ✅ Least-privilege IAM roles and policies
- ✅ CloudWatch monitoring and alerting
- ✅ Consistent resource naming and tagging
- ✅ Comprehensive outputs for integration

---

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  Development-ready web hosting environment with multi-AZ networking, 
  secure EC2 instance, encrypted S3 storage, IAM integration, and CloudWatch monitoring.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Security Configuration'
        Parameters:
          - SSHLocation
          - KeyPairName
      - Label:
          default: 'Resource Naming'
        Parameters:
          - UniqueId
          - Environment
    ParameterLabels:
      SSHLocation:
        default: 'SSH Access CIDR'
      KeyPairName:
        default: 'EC2 Key Pair'
      UniqueId:
        default: 'Unique Identifier'
      Environment:
        default: 'Environment Tag'

Parameters:
  SSHLocation:
    Type: String
    Description: The IP range that can SSH to the EC2 instance (e.g., 203.0.113.0/24)
    Default: 10.0.0.0/8
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: Must be a valid IP CIDR range (x.x.x.x/x)

  KeyPairName:
    Type: String
    Description: Name of existing EC2 key pair for SSH access
    Default: iac-rlhf-aws-trainer-instance
    MinLength: 1

  UniqueId:
    Type: String
    Description: Unique identifier for resource names (e.g., 001, dev, test)
    Default: dev001
    MinLength: 1
    MaxLength: 10
    AllowedPattern: '^[a-zA-Z0-9]+$'

  Environment:
    Type: String
    Description: Environment designation for resource tagging
    Default: Development
    AllowedValues: [Development, Staging, Production]

Resources:
  # ===== NETWORKING INFRASTRUCTURE =====

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${Environment}-${UniqueId}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Web hosting infrastructure

  # Public Subnet in First AZ
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${Environment}-${UniqueId}-Public-A'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  # Public Subnet in Second AZ
  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${Environment}-${UniqueId}-Public-B'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  # Internet Gateway for public access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${Environment}-${UniqueId}'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table for public subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${Environment}-${UniqueId}-Public'
        - Key: Environment
          Value: !Ref Environment

  # Route to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet A with Route Table
  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  # Associate Public Subnet B with Route Table
  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  # ===== SECURITY CONFIGURATION =====

  # Security Group for web server
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web server - allows HTTP and restricted SSH
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
          Description: Allow SSH from trusted networks only
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'SG-${Environment}-${UniqueId}-WebServer'
        - Key: Environment
          Value: !Ref Environment

  # ===== IAM ROLES AND POLICIES =====

  # IAM Role for EC2 instance
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-${Environment}-${UniqueId}-EC2-S3Access'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3BucketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${S3Bucket}/*'
                  - !Ref S3Bucket
      Tags:
        - Key: Name
          Value: !Sub 'Role-${Environment}-${UniqueId}-EC2'
        - Key: Environment
          Value: !Ref Environment

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'Profile-${Environment}-${UniqueId}-EC2'
      Roles:
        - !Ref EC2InstanceRole

  # ===== COMPUTE RESOURCES =====

  # EC2 Instance for web hosting
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      VpcSecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnetA
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true # Enable detailed monitoring
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Hello from ${Environment} Environment</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub 'EC2-${Environment}-${UniqueId}-WebServer'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Web hosting

  # ===== STORAGE RESOURCES =====

  # S3 Bucket for application data
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${Environment}-${UniqueId}-${AWS::AccountId}-webdata'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'S3-${Environment}-${UniqueId}-WebData'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Application data storage

  # ===== MONITORING AND ALERTING =====

  # CloudWatch Alarm for high CPU utilization
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'Alarm-${Environment}-${UniqueId}-HighCPU'
      AlarmDescription: Alert when CPU utilization exceeds 70% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300 # 5 minutes
      EvaluationPeriods: 1
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance
      TreatMissingData: notBreaching

# ===== OUTPUTS =====

Outputs:
  VPCId:
    Description: ID of the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetAId:
    Description: ID of Public Subnet A
    Value: !Ref PublicSubnetA
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetA-ID'

  PublicSubnetBId:
    Description: ID of Public Subnet B
    Value: !Ref PublicSubnetB
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetB-ID'

  EC2InstanceId:
    Description: ID of the EC2 web server instance
    Value: !Ref WebServerInstance

  EC2PublicIP:
    Description: Public IP address of the EC2 instance
    Value: !GetAtt WebServerInstance.PublicIp

  EC2PublicDNS:
    Description: Public DNS name of the EC2 instance
    Value: !GetAtt WebServerInstance.PublicDnsName

  S3BucketName:
    Description: Name of the created S3 bucket
    Value: !Ref S3Bucket

  SecurityGroupId:
    Description: ID of the web server security group
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup-ID'

  WebsiteURL:
    Description: URL of the web server
    Value: !Sub 'http://${WebServerInstance.PublicDnsName}'
```

## Key Features Explained

### 🔒 Security Best Practices

- **Parameterized SSH Access**: SSH restricted to specified CIDR range, not open to the world
- **Least Privilege IAM**: EC2 role has minimal permissions needed for S3 access
- **Encrypted Storage**: S3 bucket uses server-side encryption with managed keys
- **Public Access Blocked**: S3 bucket blocks all public access configurations

### 🌐 Network Architecture

- **Multi-AZ Design**: Resources distributed across multiple availability zones
- **Dynamic AZ Selection**: Uses `!GetAZs` for region-agnostic deployment
- **Proper Routing**: Internet gateway with route tables for public subnet access
- **DNS Enabled**: VPC configured with DNS resolution and hostnames

### 📊 Monitoring & Operations

- **Detailed Monitoring**: EC2 instance has CloudWatch detailed monitoring enabled
- **CPU Alerting**: CloudWatch alarm monitors CPU usage with 70% threshold
- **Resource Tagging**: Consistent tagging strategy for all resources
- **Comprehensive Outputs**: All necessary resource references for integration

### 🔧 Operational Excellence

- **Parameter Validation**: Input parameters have appropriate constraints and patterns
- **Resource Dependencies**: Proper use of `DependsOn` and implicit dependencies
- **User Data Script**: Automated web server setup with environment information
- **Export Values**: Critical resource IDs exported for cross-stack references

This template demonstrates production-ready infrastructure code with proper security, monitoring, and operational practices.
SecurityGroupIngress: - IpProtocol: tcp
FromPort: 22
ToPort: 22
CidrIp: !Ref SSHLocation - IpProtocol: tcp
FromPort: 80
ToPort: 80
CidrIp: 0.0.0.0/0
Tags: - Key: Environment
Value: Development - Key: Name
Value: SG-Development-!Ref UniqueId

EC2Instance:
Type: AWS::EC2::Instance
Properties:
InstanceType: t3.micro
SubnetId: !Ref SubnetA
ImageId: ami-0c02fb55956c7d316 # Latest Amazon Linux 2 in us-west-2, update if using another region
KeyName: !Ref KeyPair
SecurityGroupIds: - !Ref SecurityGroup
Tags: - Key: Environment
Value: Development - Key: Name
Value: EC2-Development-!Ref UniqueId

S3Bucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub s3-development-${UniqueId}
VersioningConfiguration:
Status: Enabled
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
Tags: - Key: Environment
Value: Development - Key: Name
Value: S3-Development-!Ref UniqueId

S3AccessRole:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub S3AccessRole-Development-${UniqueId}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Policies:
        - PolicyName: S3FullAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:*
                Resource: !Sub arn:aws:s3:::s3-development-${UniqueId}/\*

      Tags:
        - Key: Environment
          Value: Development
        - Key: Name
          Value: IAMRole-Development-!Ref UniqueId

InstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
Roles: - !Ref S3AccessRole
InstanceProfileName: !Sub InstanceProfile-Development-${UniqueId}

CWAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmDescription: Alarm if CPU > 70% for 5 minutes
Namespace: AWS/EC2
MetricName: CPUUtilization
Dimensions: - Name: InstanceId
Value: !Ref EC2Instance
Statistic: Average
Period: 300
EvaluationPeriods: 1
Threshold: 70
ComparisonOperator: GreaterThanThreshold
AlarmActions: []
Tags: - Key: Environment
Value: Development - Key: Name
Value: CWAlarm-Development-!Ref UniqueId

Outputs:
VpcId:
Value: !Ref VPC
Description: The ID of the created VPC
SubnetIds:
Value: !Join [',', [!Ref SubnetA, !Ref SubnetB]]
Description: The IDs of the created subnets
EC2PublicIP:
Value: !GetAtt EC2Instance.PublicIp
Description: The public IP of the EC2 instance
