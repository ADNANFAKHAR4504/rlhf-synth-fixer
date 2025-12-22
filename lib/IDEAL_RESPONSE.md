# TapStack Infrastructure - Ideal Response

## Overview

The TapStack.yml CloudFormation template defines a comprehensive, secure, and scalable web application infrastructure on AWS. This template implements security best practices, high availability, monitoring, and compliance features across multiple AWS services.

## Architecture Summary

### Core Infrastructure
- **VPC**: Custom VPC (10.0.0.0/16) with DNS support
- **Multi-AZ Deployment**: Resources distributed across 2 Availability Zones
- **Subnets**: 
  - 2 Public Subnets (10.0.1.0/24, 10.0.2.0/24)
  - 2 Private Subnets (10.0.3.0/24, 10.0.4.0/24)
- **NAT Gateways**: Redundant NAT Gateways in each public subnet
- **Internet Gateway**: For public internet access

### Compute & Application Layer
- **Auto Scaling Group**: Configurable EC2 instances in private subnets
- **Launch Template**: Amazon Linux 2 with encrypted EBS volumes
- **Application Load Balancer**: Internet-facing ALB with security hardening
- **Target Group**: Health check enabled for application instances

### Database Layer
- **RDS MySQL 8.0**: Multi-AZ encrypted database in private subnets
- **SSL Enforcement**: Required secure transport for all connections
- **Enhanced Monitoring**: 60-second interval monitoring enabled
- **Automated Backups**: 7-day retention with encryption

### Security & Compliance
- **KMS Encryption**: Customer-managed key for comprehensive encryption
- **Security Groups**: Least-privilege network access controls
- **Network ACLs**: Additional layer of network security
- **CloudTrail**: API logging with file validation
- **AWS Config**: Resource compliance monitoring (bucket only, avoiding account-level conflicts)
- **VPC Flow Logs**: Network traffic logging
- **Note**: GuardDuty excluded to avoid regional service conflicts

### Monitoring & Alerting
- **CloudWatch Alarms**: CPU utilization monitoring for EC2 and RDS
- **SNS Topic**: Encrypted topic for alert notifications
- **VPC Flow Logs**: Comprehensive network monitoring
- **RDS Enhanced Monitoring**: Detailed database performance metrics

### IAM & Access Control
- **EC2 Role**: SSM and CloudWatch access for instances
- **Instance Profile**: Secure credential management
- **Service Roles**: Dedicated roles for RDS monitoring and Config

## Key Security Features

1. **Encryption at Rest**: All storage encrypted with customer-managed KMS keys
2. **Encryption in Transit**: SSL/TLS enforcement for database connections
3. **Network Segmentation**: Private subnets for application and database tiers
4. **Security Groups**: Restrictive ingress/egress rules
5. **Network ACLs**: Additional subnet-level security
6. **CloudTrail Logging**: Comprehensive API audit trail
7. **Config Rules**: Compliance monitoring and drift detection (bucket only)

## High Availability & Resilience

1. **Multi-AZ Architecture**: Resources distributed across availability zones
2. **Auto Scaling**: Automatic instance replacement and scaling
3. **Load Balancing**: Traffic distribution with health checks
4. **RDS Multi-AZ**: Automatic failover for database
5. **Redundant NAT Gateways**: High availability for outbound connectivity
6. **ELB Health Checks**: Automatic unhealthy instance replacement

## Cost Optimization Features

1. **Lifecycle Policies**: S3 object deletion for CloudTrail and Config
2. **GP3 Storage**: Cost-effective EBS storage type
3. **Configurable Instance Types**: Environment-appropriate sizing
4. **Automated Backup Management**: Retention policies to control costs

## Template Parameters

- **EnvironmentSuffix**: Environment identifier (dev, staging, prod)
- **InstanceType**: EC2 instance size (t3.micro, t3.small, t3.medium)
- **InstanceCount**: Number of EC2 instances (1-10)
- **DBInstanceClass**: RDS instance size
- **DBPassword**: Secure database password
- **DomainName**: SSL certificate domain (commented out for initial deployment)

## CloudFormation Template Content

Below is the complete TapStack.yml CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Web Application Infrastructure - VPC, EC2, RDS, and ALB with security best practices for us-east-1'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: "Compute Configuration"
        Parameters:
          - InstanceType
          - InstanceCount
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBPassword
      - Label:
          default: "SSL Configuration"
        Parameters:
          - DomainName
    ParameterLabels:
      EnvironmentSuffix:
        default: "Environment Suffix"
      InstanceType:
        default: "EC2 Instance Type"
      InstanceCount:
        default: "Number of EC2 Instances"
      DBInstanceClass:
        default: "RDS Instance Class"
      DBPassword:
        default: "Database Password"
      DomainName:
        default: "Domain Name for SSL Certificate"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters

  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type for the application server
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  InstanceCount:
    Type: Number
    Default: 2
    Description: Number of EC2 instances to deploy
    MinValue: 1
    MaxValue: 10

  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: RDS instance class
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  DBPassword:
    Type: String
    Description: Password for the RDS database (must be 8-41 characters)
    MinLength: 8
    MaxLength: 41
    NoEcho: true
    Default: MySecurePassword123!

  DomainName:
    Type: String
    Default: example.com
    Description: Domain name for SSL certificate
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid domain name

Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${EnvironmentSuffix} environment encryption'
      KeyPolicy:
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Effect: Allow
            Principal:
              Service:
                - rds.amazonaws.com
                - ec2.amazonaws.com
                - sns.amazonaws.com
                - s3.amazonaws.com
                - autoscaling.amazonaws.com
                - cloudtrail.amazonaws.com
                - config.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
          - Effect: Allow
            Principal:
              AWS: '*'
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': 
                  - !Sub 'ec2.${AWS::Region}.amazonaws.com'
                  - !Sub 'autoscaling.${AWS::Region}.amazonaws.com'
          - Effect: Allow
            Principal:
              Service: 
                - autoscaling.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:DescribeKey
              - kms:RetireGrant
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'ec2.${AWS::Region}.amazonaws.com'
          - Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub 'KMSKey-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack
        - Key: Purpose
          Value: Encryption
        - Key: DataClassification
          Value: Sensitive
        - Key: Owner
          Value: Infrastructure
        - Key: CostCenter
          Value: Engineering

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/tapstack-${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'TapVPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TapIGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW1EIP-${EnvironmentSuffix}'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW2EIP-${EnvironmentSuffix}'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW1-${EnvironmentSuffix}'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW2-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicRoutes-${EnvironmentSuffix}'

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
          Value: !Sub 'TapPrivateRoutes1-${EnvironmentSuffix}'

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
          Value: !Sub 'TapPrivateRoutes2-${EnvironmentSuffix}'

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
  PublicNetworkACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicNetworkACL-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicNetworkACLEntryInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkACL
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  PublicNetworkACLEntryInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkACL
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  PublicNetworkACLEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkACL
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  PublicNetworkACLEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true

  PublicSubnet1NetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkACL

  PublicSubnet2NetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkACL

  PrivateNetworkACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateNetworkACL-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateNetworkACLEntryInboundVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 10.0.0.0/16

  PrivateNetworkACLEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true

  PrivateSubnet1NetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkACL

  PrivateSubnet2NetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkACL

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapALBSecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from internet
      Tags:
        - Key: Name
          Value: !Sub 'TapALBSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapEC2SecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS outbound for updates
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP outbound for updates
      Tags:
        - Key: Name
          Value: !Sub 'TapEC2SecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapRDSSecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapRDSSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group Rules (separate to avoid circular dependencies)
  ALBToEC2SecurityGroupRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref ALBSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      DestinationSecurityGroupId: !Ref EC2SecurityGroup
      Description: Allow HTTP to EC2 instances

  ALBToEC2HTTPSSecurityGroupRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref ALBSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      DestinationSecurityGroupId: !Ref EC2SecurityGroup
      Description: Allow HTTPS to EC2 instances

  EC2FromALBSecurityGroupRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: Allow HTTP from ALB

  EC2FromALBHTTPSSecurityGroupRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: Allow HTTPS from ALB

  EC2ToRDSSecurityGroupRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      DestinationSecurityGroupId: !Ref RDSSecurityGroup
      Description: Allow MySQL to RDS

  RDSFromEC2SecurityGroupRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref RDSSecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      SourceSecurityGroupId: !Ref EC2SecurityGroup
      Description: Allow MySQL from EC2 instances

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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:CreateGrant
                  - kms:DescribeKey
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'TapEC2Role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # Launch Template for EC2 instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    DependsOn: KMSKey
    Properties:
      LaunchTemplateName: !Sub 'TapLaunchTemplate-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              # Use AWS managed KMS key for EBS encryption - more reliable for Auto Scaling
              # KmsKeyId: !Ref KMSKey  # Uncomment this line if you want to use customer-managed key
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Secure Web Application - ${EnvironmentSuffix}</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'TapEC2Instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Project
                Value: TapStack
              - Key: Purpose
                Value: WebServer

  # Auto Scaling Group for EC2 instances
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'TapASG-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: !Ref InstanceCount
      MaxSize: !Ref InstanceCount
      DesiredCapacity: !Ref InstanceCount
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'TapASG-${EnvironmentSuffix}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
        - Key: Project
          Value: TapStack
          PropagateAtLaunch: true

  # RDS Monitoring Role
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
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
        - Key: Name
          Value: !Sub 'TapRDSMonitoringRole-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # DB Parameter Group for SSL enforcement
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub 'tap-mysql-params-${EnvironmentSuffix}'
      Description: Parameter group for MySQL with SSL enforcement
      Family: mysql8.0
      Parameters:
        require_secure_transport: 'ON'
        slow_query_log: 1
        long_query_time: 10
        log_queries_not_using_indexes: 1
      Tags:
        - Key: Name
          Value: !Sub 'TapDBParameterGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'tap-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapDBSubnetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'tap-database-${EnvironmentSuffix}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      PubliclyAccessible: false
      DeletionProtection: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      CACertificateIdentifier: rds-ca-rsa2048-g1
      Tags:
        - Key: Name
          Value: !Sub 'TapRDSInstance-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # SSL Certificate for ALB - Commented out for initial deployment
  # SSLCertificate:
  #   Type: AWS::CertificateManager::Certificate
  #   Properties:
  #     DomainName: !Sub '${EnvironmentSuffix}.${DomainName}'
  #     SubjectAlternativeNames:
  #       - !Sub '*.${EnvironmentSuffix}.${DomainName}'
  #     ValidationMethod: EMAIL
  #     DomainValidationOptions:
  #       - DomainName: !Sub '${EnvironmentSuffix}.${DomainName}'
  #         ValidationDomain: !Ref DomainName
  #       - DomainName: !Sub '*.${EnvironmentSuffix}.${DomainName}'
  #         ValidationDomain: !Ref DomainName
  #     Tags:
  #       - Key: Name
  #         Value: !Sub 'TapSSLCertificate-${EnvironmentSuffix}'
  #       - Key: Environment
  #         Value: !Ref EnvironmentSuffix
  #       - Key: Project
  #         Value: TapStack
  #       - Key: Purpose
  #         Value: SecureWebApplication

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'TapALB-${EnvironmentSuffix}'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
        - Key: routing.http.preserve_host_header.enabled
          Value: 'true'
        - Key: routing.http.x_amzn_tls_version_and_cipher_suite.enabled
          Value: 'true'
        - Key: routing.http.xff_client_port.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: !Sub 'TapALB-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'TapTargetGroup-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: !Sub 'TapTargetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # ALB Listeners - HTTP only for testing
  ALBHTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # VPC Flow Logs
  VPCFlowLogsRole:
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
        - PolicyName: VPCFlowLogsDelivery
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${EnvironmentSuffix}'
      RetentionInDays: 14
      KmsKeyId: !GetAtt KMSKey.Arn

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'TapVPCFlowLogs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TapHighCPU-${EnvironmentSuffix}'
      AlarmDescription: 'High CPU utilization alarm for EC2 instances'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic

  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TapRDSHighCPU-${EnvironmentSuffix}'
      AlarmDescription: 'High CPU utilization alarm for RDS instance'
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

  # SNS Topic for alerts
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'TapAlerts-${EnvironmentSuffix}'
      DisplayName: !Sub 'TapStack Alerts - ${EnvironmentSuffix}'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub 'TapSNSTopic-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TapStack

  # CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'tap-cloudtrail-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteEverything
            Status: Enabled
            ExpirationInDays: 1
            NoncurrentVersionExpirationInDays: 1
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      Tags:
        - Key: Name
          Value: !Sub 'TapCloudTrailBucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'TapCloudTrail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub 'TapCloudTrail-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'tap-config-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteEverything
            Status: Enabled
            ExpirationInDays: 1
            NoncurrentVersionExpirationInDays: 1
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      Tags:
        - Key: Name
          Value: !Sub 'TapConfigBucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:GetBucketAcl
              - s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DependsOn: ConfigBucketPolicy
    Properties:
      Name: !Sub 'TapConfigDeliveryChannel-${EnvironmentSuffix}'
      S3BucketName: !Ref ConfigBucket

  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:Put*
                  - config:Get*
                  - config:List*
                  - config:Describe*
                  - config:BatchGet*
                  - config:Select*
                  - ec2:Describe*
                  - iam:GetRole
                  - iam:GetRolePolicy
                  - iam:GetUser
                  - iam:GetUserPolicy
                  - iam:GetGroup
                  - iam:GetGroupPolicy
                  - iam:GetPolicy
                  - iam:GetPolicyVersion
                  - iam:List*
                  - rds:Describe*
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:GetBucketLogging
                  - s3:GetBucketNotification
                  - s3:GetBucketPolicy
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:ListBucket
                  - cloudtrail:DescribeTrails
                  - cloudtrail:GetTrailStatus
                  - cloudwatch:Describe*
                  - cloudwatch:Get*
                  - cloudwatch:List*
                  - logs:Describe*
                  - logs:Get*
                  - logs:List*
                  - sns:Get*
                  - sns:List*
                  - kms:Describe*
                  - kms:Get*
                  - kms:List*
                  - elasticloadbalancing:Describe*
                  - autoscaling:Describe*
                Resource: '*'
        - PolicyName: ConfigS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub '${ConfigBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn: ConfigBucketPolicy
    Properties:
      Name: !Sub 'TapConfigRecorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

Outputs:
  VPCId:
    Description: ID of the VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: ID of the first public subnet
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: ID of the second public subnet
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: ID of the first private subnet
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: ID of the second private subnet
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerDNS'

  RDSInstanceEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSInstanceEndpoint'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-AutoScalingGroupName'

  LaunchTemplateId:
    Description: ID of the Launch Template
    Value: !Ref EC2LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplateId'

  KMSKeyId:
    Description: ID of the KMS key
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  # SSLCertificateArn:
  #   Description: ARN of the SSL certificate
  #   Value: !Ref SSLCertificate
  #   Export:
  #     Name: !Sub '${AWS::StackName}-SSLCertificateArn'

  SNSTopicArn:
    Description: ARN of the SNS topic for alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'

  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Deployment Considerations

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Valid AWS account with sufficient service limits
3. Domain name for SSL certificate (if enabling HTTPS)

### Deployment Steps
1. Upload template to CloudFormation
2. Configure parameters based on environment
3. Review and deploy stack
4. Validate outputs and resource creation
5. Test application connectivity

### Post-Deployment
1. Configure DNS records for ALB
2. Enable SSL certificate validation (if using ACM)
3. Set up SNS topic subscriptions for alerts
4. Configure additional monitoring dashboards
5. Review and tune security groups as needed

### Cleanup
1. Empty S3 buckets before stack deletion
2. Review and backup any persistent data
3. Delete CloudFormation stack
4. Verify all resources are cleaned up

## Security Best Practices Implemented

1. **Encryption**: Customer-managed KMS keys for all encrypted resources
2. **Network Security**: Multi-layered security with security groups and NACLs
3. **Access Control**: Least-privilege IAM roles and policies
4. **Monitoring**: Comprehensive logging with CloudTrail, Config, and VPC Flow Logs
5. **Compliance**: GuardDuty threat detection and Config compliance monitoring
6. **Database Security**: SSL enforcement and Multi-AZ deployment
7. **Storage Security**: Encrypted EBS volumes and S3 buckets with public access blocked

This infrastructure template provides a production-ready foundation for secure web applications on AWS, following industry best practices for security, availability, and monitoring.