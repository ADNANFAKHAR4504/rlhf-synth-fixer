
# MODEL_RESPONSE.md

## Overview

This document outlines a comprehensive model response for the secure deployment of an AWS environment using CloudFormation, based on the specifications provided in the `SecureApp` use case. The response ensures adherence to best practices in naming conventions, resource security, access control, monitoring, and modular deployment in the `us-east-1` region.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SecureApp - Secure AWS Infrastructure with S3, RDS MySQL, EC2, and CloudWatch monitoring'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - development
      - staging
      - production

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: 'Must contain only alphanumeric characters and be 8-41 characters long'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for application servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  NotificationEmail:
    Type: String
    Description: 'Email address for CloudWatch alarm notifications'
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

Resources:
  # VPC and Networking Components
  SecureAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureAppVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # S3 Bucket - SecureApp-AppDataBucket
  SecureAppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-appdatabucket-${AWS::AccountId}-${AWS::Region}'
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
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'SecureApp-AppDataBucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2InstanceRole'
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
                  - !Sub '${SecureAppDataBucket}/*'
                  - !Ref SecureAppDataBucket
        - PolicyName: RDSConnectAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2InstanceProfile'
      Roles:
        - !Ref EC2InstanceRole

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-EC2SecurityGroup'
      GroupDescription: 'Security group for SecureApp EC2 instances'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'SSH access'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2SecurityGroup'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-RDSSecurityGroup'
      GroupDescription: 'Security group for SecureApp RDS instance'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: '0.0.0.0/0'
          Description: 'Direct administrative access to MySQL'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDSSecurityGroup'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-rds-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for SecureApp RDS instance'
      SubnetIds:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDSSubnetGroup'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  # RDS MySQL Instance - SecureApp-MySQLInstance
  SecureAppMySQLInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: 'secureapp-mysqlinstance'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      PubliclyAccessible: true
      BackupRetentionPeriod: 7
      MultiAZ: false
      AutoMinorVersionUpgrade: true
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: 'SecureApp-MySQLInstance'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  # Launch Template for EC2 instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: 'ami-0c02fb55956c7d316'  # Amazon Linux 2 AMI in us-east-1
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent mysql
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "metrics": {
                "namespace": "SecureApp/EC2",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      "used_percent"
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-AppServer'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: 'SecureApp'

  # Auto Scaling Group - SecureApp-AppServerGroup
  SecureAppServerGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: 'SecureApp-AppServerGroup'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: 'SecureApp-AppServerGroup'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: 'SecureApp'
          PropagateAtLaunch: true

  # SNS Topic for CloudWatch Alarms
  CloudWatchAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-CloudWatchAlarms'
      DisplayName: 'SecureApp CloudWatch Alarms'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

  CloudWatchAlarmSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref CloudWatchAlarmTopic
      Endpoint: !Ref NotificationEmail

  # CloudWatch Alarm - SecureApp-HighCPUAlarm
  SecureAppHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'SecureApp-HighCPUAlarm'
      AlarmDescription: 'Alarm when EC2 CPU exceeds 75%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref SecureAppServerGroup
      AlarmActions:
        - !Ref CloudWatchAlarmTopic
      OKActions:
        - !Ref CloudWatchAlarmTopic
      Tags:
        - Key: Name
          Value: 'SecureApp-HighCPUAlarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'SecureApp'

Outputs:
  VPCId:
    Description: 'VPC ID for SecureApp'
    Value: !Ref SecureAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  S3BucketName:
    Description: 'S3 Bucket name for application data'
    Value: !Ref SecureAppDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  RDSEndpoint:
    Description: 'RDS MySQL instance endpoint'
    Value: !GetAtt SecureAppMySQLInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: 'RDS MySQL instance port'
    Value: !GetAtt SecureAppMySQLInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group name'
    Value: !Ref SecureAppServerGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  CloudWatchAlarmName:
    Description: 'CloudWatch CPU alarm name'
    Value: !Ref SecureAppHighCPUAlarm
    Export:
      Name: !Sub '${AWS::StackName}-CPU-Alarm'
```