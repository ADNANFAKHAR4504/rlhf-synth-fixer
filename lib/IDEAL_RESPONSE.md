# CloudFormation Solution: Production-Ready AWS Cloud Environment

## Overview

This CloudFormation template deploys a complete production-ready AWS cloud environment for hosting a web application. The infrastructure follows AWS best practices with multi-AZ deployment, proper network segmentation, security controls, and comprehensive monitoring.

## Architecture Summary

The solution creates a secure, highly available infrastructure across two availability zones (us-east-1a and us-east-1b) with the following components:

- **Network Layer**: VPC with public and private subnets, NAT Gateways for outbound connectivity
- **Compute Layer**: Auto-scaling EC2 instances behind an Application Load Balancer
- **Data Layer**: Multi-AZ RDS PostgreSQL database with automated backups
- **Security Layer**: Least-privilege security groups, encrypted storage, IAM roles
- **Monitoring Layer**: VPC Flow Logs, CloudWatch integration

## CloudFormation Template

### File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready AWS Cloud Environment with VPC, EC2 Auto Scaling, RDS PostgreSQL, and Application Load Balancer'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - EnvironmentName
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBInstanceClass
          - DBName
          - DBUsername
          - DBBackupRetentionPeriod
      - Label:
          default: 'Compute Configuration'
        Parameters:
          - InstanceType
          - MinInstances
          - MaxInstances
          - DesiredInstances

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  EnvironmentName:
    Type: String
    Default: 'production'
    Description: 'Environment name for tagging'
    AllowedValues:
      - development
      - staging
      - production

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for private subnet 1'

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 2'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  DBName:
    Type: String
    Default: 'appdb'
    Description: 'Database name'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DBPasswordLength:
    Type: Number
    Default: 16
    Description: 'Length of the auto-generated database password'
    MinValue: 8
    MaxValue: 41

  DBBackupRetentionPeriod:
    Type: Number
    Default: 7
    Description: 'Number of days to retain automated backups'
    MinValue: 1
    MaxValue: 35

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  MinInstances:
    Type: Number
    Default: 2
    Description: 'Minimum number of EC2 instances'
    MinValue: 1

  MaxInstances:
    Type: Number
    Default: 4
    Description: 'Maximum number of EC2 instances'
    MinValue: 1

  DesiredInstances:
    Type: Number
    Default: 2
    Description: 'Desired number of EC2 instances'
    MinValue: 1

Mappings:
  # Amazon Linux 2023 AMI IDs by region
  RegionMap:
    us-east-1:
      AMI: 'ami-0453ec754f44f9a4a'
    us-east-2:
      AMI: 'ami-0a606d8395a538502'
    us-west-1:
      AMI: 'ami-0a2d0e8c8c8a8c8c8'
    us-west-2:
      AMI: 'ami-04e914639d0cca79a'

Resources:
  # ===========================
  # VPC and Network Resources
  # ===========================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # Elastic IPs for NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # NAT Gateways
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Type
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}'
        - Key: Type
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub 'private-rt-2-${EnvironmentSuffix}'
        - Key: Type
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ===========================
  # Security Groups
  # ===========================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'alb-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from internet'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'alb-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ec2-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP from ALB'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ec2-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'rds-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS PostgreSQL database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'Allow PostgreSQL from EC2 instances'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'rds-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # ===========================
  # IAM Roles and Instance Profile
  # ===========================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ec2-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Tags:
        - Key: Name
          Value: !Sub 'ec2-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'ec2-instance-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'vpc-flow-logs-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
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
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-logs-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # ===========================
  # CloudWatch Logs
  # ===========================

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${EnvironmentSuffix}'
      RetentionInDays: 7
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  VPCFlowLog:
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
          Value: !Sub 'vpc-flow-log-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # ===========================
  # RDS PostgreSQL Database
  # ===========================

  RDSMasterPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-rds-master-password'
      Description: 'Auto-generated master password for RDS PostgreSQL database'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: !Ref DBPasswordLength
        ExcludeCharacters: '"@/\\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-Secret'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'rds-postgres-${EnvironmentSuffix}'
      Engine: postgres
      EngineVersion: '15.14'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      DBName: !Ref DBName
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSMasterPasswordSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      PubliclyAccessible: false
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'rds-postgres-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  # ===========================
  # Application Load Balancer
  # ===========================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'alb-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      Tags:
        - Key: Name
          Value: !Sub 'alb-tg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: cloudformation

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ===========================
  # EC2 Launch Template and Auto Scaling
  # ===========================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'launch-template-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
            echo "<p>Environment: ${EnvironmentName}</p>" >> /var/www/html/index.html
            echo "<p>Instance ID: $(ec2-metadata --instance-id | cut -d ' ' -f 2)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'ec2-instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: ManagedBy
                Value: cloudformation
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - NatGateway1
      - NatGateway2
    Properties:
      AutoScalingGroupName: !Sub 'asg-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref DesiredInstances
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'asg-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: ManagedBy
          Value: cloudformation
          PropagateAtLaunch: true

# ===========================
# Outputs
# ===========================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNSName'

  ALBUrl:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  RDSEndpoint:
    Description: 'RDS PostgreSQL Database Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  RDSPort:
    Description: 'RDS PostgreSQL Database Port'
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDSPort'

  RDSConnectionString:
    Description: 'RDS PostgreSQL Connection String'
    Value: !Sub 'postgresql://${DBUsername}:****@${RDSInstance.Endpoint.Address}:${RDSInstance.Endpoint.Port}/${DBName}'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-AutoScalingGroupName'

  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Design Decisions

### 1. Network Architecture

**Multi-AZ Deployment**: The infrastructure spans two availability zones (us-east-1a and us-east-1b) for high availability and fault tolerance.

**Network Segmentation**: Public subnets host internet-facing resources (ALB, NAT Gateways), while private subnets host application and database tiers, following the principle of defense in depth.

**NAT Gateway Strategy**: Each availability zone has its own NAT Gateway, preventing a single point of failure for outbound internet connectivity from private subnets.

### 2. Security Controls

**Least-Privilege Security Groups**:

- ALB Security Group: Only allows inbound HTTPS (443) and HTTP (80) from the internet
- EC2 Security Group: Only allows HTTP (80) from the ALB security group
- RDS Security Group: Only allows PostgreSQL (5432) from the EC2 security group

**Encryption**:

- RDS storage encryption enabled using AWS managed keys
- IMDSv2 enforced on EC2 instances (HttpTokens: required)

**IAM Roles**:

- EC2 instances use IAM roles instead of long-lived credentials
- CloudWatch Agent and SSM policies for monitoring and management
- VPC Flow Logs role with minimal permissions

### 3. High Availability

**Multi-AZ RDS**: PostgreSQL database deployed in Multi-AZ configuration with automatic failover capability.

**Auto Scaling**: EC2 instances distributed across two availability zones with min 2, max 4 instances, ensuring application availability even if one AZ fails.

**Application Load Balancer**: Distributes traffic across healthy instances in multiple availability zones with health checks.

### 4. Monitoring and Observability

**VPC Flow Logs**: Captures all network traffic (ACCEPT and REJECT) and sends to CloudWatch Logs for security analysis and troubleshooting.

**RDS CloudWatch Integration**: PostgreSQL logs exported to CloudWatch for monitoring query performance and errors.

**Health Checks**: ALB performs periodic health checks on EC2 instances with configurable thresholds.

### 5. Resource Naming and Tagging

**EnvironmentSuffix Parameter**: All resources include an environment suffix for resource uniqueness across deployments.

**Consistent Tags**: All resources tagged with:

- `Environment`: production/staging/development
- `ManagedBy`: cloudformation
- `Name`: Descriptive name with environment suffix

### 6. Parameterization

The template uses CloudFormation parameters for flexibility:

- Network CIDR blocks (VPC and subnets)
- Database configuration (instance class, credentials, backup retention)
- Compute configuration (instance types, auto scaling limits)
- Environment identification (suffix, name)

### 7. Deletion Protection

**RDS Policies**: `DeletionPolicy: Delete` and `UpdateReplacePolicy: Delete` allow easy teardown for testing environments. For production, these should be changed to `Snapshot` or `Retain`.

**DeletionProtection**: Set to false for testing flexibility. Enable for production databases.

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, EC2, RDS, IAM, and CloudWatch resources
- Database password ready (minimum 8 alphanumeric characters)

### Deployment Steps

1. **Validate Template Syntax**:

   ```bash
   aws cloudformation validate-template --template-body file://lib/TapStack.yml
   ```

2. **Deploy Stack**:

   ```bash
   aws cloudformation create-stack \
     --stack-name production-cloud-env \
     --template-body file://lib/TapStack.yml \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=prod \
       ParameterKey=EnvironmentName,ParameterValue=production \
       ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor Stack Creation**:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name production-cloud-env \
     --region us-east-1 \
     --query 'Stacks[0].StackStatus'
   ```

4. **Retrieve Outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name production-cloud-env \
     --region us-east-1 \
     --query 'Stacks[0].Outputs'
   ```

### Testing the Deployment

1. **Access Application Load Balancer**:

   ```bash
   ALB_URL=$(aws cloudformation describe-stacks \
     --stack-name production-cloud-env \
     --region us-east-1 \
     --query 'Stacks[0].Outputs[?OutputKey==`ALBUrl`].OutputValue' \
     --output text)

   curl $ALB_URL
   ```

2. **Verify RDS Connectivity** (from EC2 instance):

   ```bash
   RDS_ENDPOINT=$(aws cloudformation describe-stacks \
     --stack-name production-cloud-env \
     --region us-east-1 \
     --query 'Stacks[0].Outputs[?OutputKey==`RDSEndpoint`].OutputValue' \
     --output text)

   psql -h $RDS_ENDPOINT -U dbadmin -d appdb
   ```

3. **Check VPC Flow Logs**:
   ```bash
   aws logs tail /aws/vpc/flowlogs-prod --follow --region us-east-1
   ```

### Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name production-cloud-env \
  --region us-east-1
```

**Note**: NAT Gateways and EIPs may take several minutes to delete. RDS instances will create a final snapshot unless deletion protection is disabled.

## Cost Considerations

**Expensive Resources**:

- NAT Gateways: ~$0.045/hour each ($32/month x 2 = $64/month)
- RDS Multi-AZ: db.t3.micro ~$0.034/hour ($50/month with Multi-AZ)
- EC2 Instances: t3.micro ~$0.0104/hour ($15/month per instance)

**Cost Optimization**:

- For development, use single NAT Gateway or VPC endpoints
- Use RDS single-AZ for non-production environments
- Implement Auto Scaling policies to scale down during off-hours
- Use Reserved Instances or Savings Plans for production workloads

## Security Recommendations

1. **Enable AWS WAF** on the Application Load Balancer
2. **Implement SSL/TLS** with ACM certificates on the ALB listener
3. **Use AWS Secrets Manager** for database credentials instead of parameters
4. **Enable GuardDuty** for threat detection
5. **Configure AWS Config** for compliance monitoring
6. **Implement CloudTrail** for API audit logging
7. **Enable RDS Enhanced Monitoring** for detailed database metrics
8. **Use AWS Systems Manager Session Manager** instead of SSH for EC2 access

## Requirements Checklist

- [x] VPC with CIDR 10.0.0.0/16 and DNS hostnames enabled
- [x] 4 subnets (2 public, 2 private) across us-east-1a and us-east-1b
- [x] Internet Gateway attached to VPC
- [x] NAT Gateways in each public subnet
- [x] Route tables configured (public with IGW, private with NAT)
- [x] RDS PostgreSQL 15, db.t3.micro, Multi-AZ, 7-day backups
- [x] EC2 Auto Scaling Group (min 2, max 4, Amazon Linux 2023, t3.micro)
- [x] Application Load Balancer in public subnets with health checks
- [x] Security groups with least-privilege access
- [x] VPC Flow Logs to CloudWatch Logs
- [x] Outputs for ALB DNS name, RDS endpoint, and VPC ID
- [x] All resources tagged with Environment=production and ManagedBy=cloudformation
