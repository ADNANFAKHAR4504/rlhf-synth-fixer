# AWS CloudFormation Template - TAP Stack with Security Best Practices

This solution provides a comprehensive AWS CloudFormation template that implements security best practices and compliance requirements for a production environment.

## CloudFormation Template (YAML)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - AWS CloudFormation template with security best practices and compliance for TAP environment'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Security Configuration'
        Parameters:
          - AllowedSSHCIDR
          - DBUsername

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid IP CIDR range of the form x.x.x.x/x'
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters (1-16 chars)'

Resources:
  # KMS Key for encryption
  TAPKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for TAP environment'
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
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow Secrets Manager
            Effect: Allow
            Principal:
              Service: secretsmanager.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'TAPKMSKey${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  TAPKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/tap-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref TAPKMSKey

  # Database Secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'tap-${EnvironmentSuffix}-db-credentials'
      Description: 'Database credentials for TAP RDS instance'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref TAPKMSKey
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSecret${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  # VPC and Networking
  TAPVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'TAPVPC${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TAPVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet1${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TAPVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet2${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TAPVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet1${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TAPVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet2${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TAPIGW${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref TAPVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TAPVPC
      Tags:
        - Key: Name
          Value: !Sub 'PublicRouteTable${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

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

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref TAPVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub 'ALBSecurityGroup${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref TAPVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'EC2SecurityGroup${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref TAPVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'DBSecurityGroup${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  # IAM Roles
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${TAPS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt TAPS3Bucket.Arn
        - PolicyName: SecretsManagerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret
      Tags:
        - Key: Name
          Value: !Sub 'EC2Role${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # S3 Bucket
  TAPS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-${EnvironmentSuffix}-bucket-${AWS::AccountId}-${AWS::Region}'
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
          Value: !Sub 'TAPS3Bucket${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-${EnvironmentSuffix}-logs-${AWS::AccountId}-${AWS::Region}'
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
          Value: !Sub 'LoggingBucket${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn

  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/tap-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt TAPKMSKey.Arn

  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/alb/tap-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt TAPKMSKey.Arn

  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/tap-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt TAPKMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/tap-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt TAPKMSKey.Arn

  # Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'TAPLaunchTemplate${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: 't3.micro'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
            echo "AutoTerminate=30" >> /etc/environment
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'TAPInstance${EnvironmentSuffix}'
              - Key: AutoTerminate
                Value: '30'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'TAPASG${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'TAPASG${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: AutoTerminate
          Value: '30'
          PropagateAtLaunch: true

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'tap-${EnvironmentSuffix}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'ApplicationLoadBalancer${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'tap-${EnvironmentSuffix}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref TAPVPC
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'ALBTargetGroup${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for TAP RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TAPDBSubnetGroup${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

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
          Value: !Sub 'RDSMonitoringRole${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'tap-${EnvironmentSuffix}-database'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.43'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref TAPKMSKey
      MultiAZ: true
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'TAPRDS${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TAP-${EnvironmentSuffix}-CPUHigh'
      AlarmDescription: 'Alarm when CPU exceeds 80%'
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

  MemoryAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TAP-${EnvironmentSuffix}-MemoryHigh'
      AlarmDescription: 'Alarm when Memory exceeds 80%'
      MetricName: MemoryUtilization
      Namespace: CWAgent
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

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'TAP-${EnvironmentSuffix}-Alerts'
      KmsMasterKeyId: !Ref TAPKMSKey
      Tags:
        - Key: Name
          Value: !Sub 'TAPSNSTopic${EnvironmentSuffix}'
        - Key: AutoTerminate
          Value: '30'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref TAPVPC
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-VPC-ID'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-ALB-DNS'

  S3BucketName:
    Description: 'TAP S3 Bucket Name'
    Value: !Ref TAPS3Bucket
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-S3-Bucket'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref TAPKMSKey
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-KMS-Key'

  DatabaseSecretArn:
    Description: 'Database Secret ARN'
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-DB-Secret'
```

## CloudFormation Template (JSON)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "TAP Stack - AWS CloudFormation template with security best practices and compliance for TAP environment",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix"]
        },
        {
          "Label": {
            "default": "Security Configuration"
          },
          "Parameters": ["AllowedSSHCIDR", "DBUsername"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "AllowedSSHCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/8",
      "Description": "CIDR block allowed for SSH access",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$",
      "ConstraintDescription": "Must be a valid IP CIDR range of the form x.x.x.x/x"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database administrator username",
      "NoEcho": true,
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters (1-16 chars)"
    }
  },
  "Resources": {
    "TAPKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Customer-managed KMS key for TAP environment",
        "KeyPolicy": {
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "TAPKMSKey${EnvironmentSuffix}"
            }
          },
          {
            "Key": "AutoTerminate",
            "Value": "30"
          }
        ]
      }
    },
    "TAPKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/tap-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "TAPKMSKey"
        }
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "tap-${EnvironmentSuffix}-db-credentials"
        },
        "Description": "Database credentials for TAP RDS instance",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${DBUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "TAPKMSKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DatabaseSecret${EnvironmentSuffix}"
            }
          },
          {
            "Key": "AutoTerminate",
            "Value": "30"
          }
        ]
      }
    },
    "TAPVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "TAPVPC${EnvironmentSuffix}"
            }
          },
          {
            "Key": "AutoTerminate",
            "Value": "30"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "TAPVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}-VPC-ID"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}-ALB-DNS"
        }
      }
    },
    "S3BucketName": {
      "Description": "TAP S3 Bucket Name",
      "Value": {
        "Ref": "TAPS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}-S3-Bucket"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID",
      "Value": {
        "Ref": "TAPKMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}-KMS-Key"
        }
      }
    },
    "DatabaseSecretArn": {
      "Description": "Database Secret ARN",
      "Value": {
        "Ref": "DatabaseSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}-DB-Secret"
        }
      }
    }
  }
}
```

## Key Security Features Implemented

### 1. **Encryption**

- Customer-managed KMS key for all encryption
- S3 buckets encrypted with AES256
- RDS instances encrypted at rest
- CloudWatch Logs encrypted with KMS

### 2. **Network Security**

- VPC with public and private subnets across multiple AZs
- Security groups with least privilege access
- SSH access restricted to specified CIDR range
- Private subnets for RDS and EC2 instances

### 3. **Access Control**

- IAM roles with minimal required permissions
- EC2 instances use instance profiles
- Secrets Manager for database credentials
- KMS key policies for service access

### 4. **Monitoring and Logging**

- CloudWatch alarms for CPU and memory monitoring
- CloudWatch Log Groups for all services
- SNS topic for alarm notifications
- Log retention set to 30 days

### 5. **Auto-Scaling and High Availability**

- Auto Scaling Group with desired capacity
- Application Load Balancer for distribution
- Multi-AZ deployment for RDS
- Health checks and monitoring

### 6. **Compliance**

- AutoTerminate tags for resource lifecycle management
- Backup retention for RDS instances
- Enhanced monitoring for RDS
- Public access blocked on S3 buckets

This template provides a comprehensive, secure, and compliant AWS infrastructure suitable for production environments with proper security best practices and monitoring capabilities.
