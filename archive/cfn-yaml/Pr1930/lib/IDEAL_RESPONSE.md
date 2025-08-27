# IDEAL_RESPONSE.md

This file contains the ideal CloudFormation template for the TAP Stack (Task Assignment Platform) infrastructure.  
It demonstrates best practices for multi-AZ networking, secure EC2 instances, IAM, monitoring, and outputs.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  TAP Stack - Task Assignment Platform Infrastructure
  Development-ready web hosting environment with multi-AZ networking, 
  secure EC2 instances, and comprehensive monitoring.
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Security Configuration"
        Parameters:
          - KeyName
          - SSHLocation
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
    ParameterLabels:
      KeyName:
        default: "EC2 Key Pair"
      SSHLocation:
        default: "SSH Access CIDR"
      Environment:
        default: "Environment Tag"

Parameters:
  KeyName:
    Type: String
    Default: 'my-key'
    Description: 'Name of an existing EC2 KeyPair to enable SSH access to the instances'
    MinLength: 1

  SSHLocation:
    Type: String
    Description: 'The IP address range that can be used to SSH to the EC2 instances'
    Default: '0.0.0.0/0'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid IP CIDR range of the form x.x.x.x/x'

  Environment:
    Type: String
    Default: 'Development'
    Description: 'Environment designation for resource tagging'
    AllowedValues: [Development, Staging, Production]

Resources:
  # ===== NETWORKING INFRASTRUCTURE =====

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${Environment}-TAP'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'TAP Platform Infrastructure'

  # Public Subnet in First AZ
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${Environment}-TAP-Public-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Public Subnet in Second AZ
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${Environment}-TAP-Public-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${Environment}-TAP'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
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
          Value: !Sub 'RT-${Environment}-TAP-Public'
        - Key: Environment
          Value: !Ref Environment

  # Default route to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet 1 with Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Associate Public Subnet 2 with Route Table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # ===== SECURITY CONFIGURATION =====

  # Security Group for web servers
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SG-${Environment}-TAP-WebServer'
      GroupDescription: 'Enable SSH and HTTP access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: 'tcp'
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from anywhere'
        - IpProtocol: 'tcp'
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
          Description: 'Allow SSH from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${Environment}-TAP-WebServer'
        - Key: Environment
          Value: !Ref Environment

  # ===== IAM ROLES AND POLICIES =====

  # IAM Role for EC2 instances
  EC2Role:
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
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
                  - !Sub 'arn:aws:s3:::${S3Bucket}/*'
                  - !Sub 'arn:aws:s3:::${S3Bucket}'
      Tags:
        - Key: Name
          Value: !Sub 'Role-${Environment}-TAP-EC2'
        - Key: Environment
          Value: !Ref Environment

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ===== STORAGE & DATA MANAGEMENT =====

  # S3 Bucket for application data
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-1930-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'S3-${Environment}-TAP-Data'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'TAP Application Data Storage'

  # ===== MONITORING & ALERTING =====

  # CloudWatch Log Group
  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}/tap/webserver'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub 'LogGroup-${Environment}-TAP-WebServer'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarm for CPU Utilization - Instance 1
  CPUAlarmInstance1:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'CPUAlarm-${Environment}-TAP-Instance1'
      AlarmDescription: 'CPU utilization alarm for EC2 Instance 1'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance1
      TreatMissingData: notBreaching

  # CloudWatch Alarm for CPU Utilization - Instance 2  
  CPUAlarmInstance2:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'CPUAlarm-${Environment}-TAP-Instance2'
      AlarmDescription: 'CPU utilization alarm for EC2 Instance 2'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance2
      TreatMissingData: notBreaching

  # ===== COMPUTE RESOURCES =====

  # EC2 Instance 1 in Subnet 1
  WebServerInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: 't3.micro'
      KeyName: !Ref KeyName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet1
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd awscli
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>TAP Platform - Instance 1</h1>" > /var/www/html/index.html
          echo "<p>Environment: ${Environment}</p>" >> /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
          echo "<p>S3 Bucket: ${S3Bucket}</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub 'EC2-${Environment}-TAP-WebServer-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'TAP Web Server'

  # EC2 Instance 2 in Subnet 2
  WebServerInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: 't3.micro'
      KeyName: !Ref KeyName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet2
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd awscli
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>TAP Platform - Instance 2</h1>" > /var/www/html/index.html
          echo "<p>Environment: ${Environment}</p>" >> /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
          echo "<p>S3 Bucket: ${S3Bucket}</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub 'EC2-${Environment}-TAP-WebServer-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'TAP Web Server'

# ===== OUTPUTS =====

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'ID of the first public subnet'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'ID of the second public subnet'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  SecurityGroupId:
    Description: 'ID of the web server security group'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup-ID'

  S3BucketName:
    Description: 'Name of the S3 bucket for application data'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  Instance1Id:
    Description: 'ID of the first EC2 instance'
    Value: !Ref WebServerInstance1

  Instance2Id:
    Description: 'ID of the second EC2 instance'  
    Value: !Ref WebServerInstance2

  Instance1PublicIp:
    Description: 'Public IP address of the first EC2 instance'
    Value: !GetAtt WebServerInstance1.PublicIp

  Instance2PublicIp:
    Description: 'Public IP address of the second EC2 instance'
    Value: !GetAtt WebServerInstance2.PublicIp

  Instance1PublicDNS:
    Description: 'Public DNS name of the first EC2 instance'
    Value: !GetAtt WebServerInstance1.PublicDnsName

  Instance2PublicDNS:
    Description: 'Public DNS name of the second EC2 instance'
    Value: !GetAtt WebServerInstance2.PublicDnsName

  WebSite1URL:
    Description: 'URL of the first web server'
    Value: !Sub 'http://${WebServerInstance1.PublicDnsName}'

  WebSite2URL:
    Description: 'URL of the second web server'
    Value: !Sub 'http://${WebServerInstance2.PublicDnsName}'
```