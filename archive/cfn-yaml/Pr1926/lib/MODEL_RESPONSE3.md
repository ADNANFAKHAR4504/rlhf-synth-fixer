```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS CloudFormation template with security best practices and compliance for production environment'
Parameters:
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access'
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    NoEcho: true
Resources:
  # KMS Key for encryption
  ProductionKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for production environment'
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
          Value: 'ProductionKMSKey'
        - Key: AutoTerminate
          Value: '30'
  ProductionKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/production-key
      TargetKeyId: !Ref ProductionKMSKey
  # Database Secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-credentials'
      Description: 'Database credentials for production RDS instance'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref ProductionKMSKey
      Tags:
        - Key: Name
          Value: 'DatabaseSecret'
        - Key: AutoTerminate
          Value: '30'
  # VPC and Networking
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'ProductionVPC'
        - Key: AutoTerminate
          Value: '30'
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'PublicSubnet1'
        - Key: AutoTerminate
          Value: '30'
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'PublicSubnet2'
        - Key: AutoTerminate
          Value: '30'
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'PrivateSubnet1'
        - Key: AutoTerminate
          Value: '30'
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'PrivateSubnet2'
        - Key: AutoTerminate
          Value: '30'
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'ProductionIGW'
        - Key: AutoTerminate
          Value: '30'
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProductionVPC
      InternetGatewayId: !Ref InternetGateway
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: 'PublicRouteTable'
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
      VpcId: !Ref ProductionVPC
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
          Value: 'ALBSecurityGroup'
        - Key: AutoTerminate
          Value: '30'
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref ProductionVPC
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
          Value: 'EC2SecurityGroup'
        - Key: AutoTerminate
          Value: '30'
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: 'DBSecurityGroup'
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
                Resource: !Sub '${ProductionS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ProductionS3Bucket.Arn
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
          Value: 'EC2Role'
        - Key: AutoTerminate
          Value: '30'
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role
  # S3 Bucket
  ProductionS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'production-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProductionKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: 'ProductionS3Bucket'
        - Key: AutoTerminate
          Value: '30'
  ProductionS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProductionS3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyPublicAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ProductionS3Bucket}/*'
              - !GetAtt ProductionS3Bucket.Arn
            Condition:
              StringNotEquals:
                'aws:PrincipalServiceName':
                  - s3.amazonaws.com
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ProductionS3Bucket}/*'
              - !GetAtt ProductionS3Bucket.Arn
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'logging-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProductionKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: 'LoggingBucket'
        - Key: AutoTerminate
          Value: '30'
  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProductionKMSKey.Arn
  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/alb/production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProductionKMSKey.Arn
  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/rds/production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProductionKMSKey.Arn
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/s3/production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProductionKMSKey.Arn
  # Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: 'ProductionLaunchTemplate'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: 't3.micro'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
            echo "AutoTerminate=30" >> /etc/environment
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'ProductionInstance'
              - Key: AutoTerminate
                Value: '30'
  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: 'ProductionASG'
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
          Value: 'ProductionASG'
          PropagateAtLaunch: true
        - Key: AutoTerminate
          Value: '30'
          PropagateAtLaunch: true
  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: 'ProductionALB'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LoggingBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: 'ProductionALB'
        - Key: AutoTerminate
          Value: '30'
  ALBTargetGroup:
    Type: AWS::EC2::TargetGroup
    Properties:
      Name: 'ProductionTargetGroup'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProductionVPC
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: 'ProductionTargetGroup'
        - Key: AutoTerminate
          Value: '30'
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${AWS::StackName}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: 'ProductionSSLCert'
        - Key: AutoTerminate
          Value: '30'
  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: 'ProductionDBSubnetGroup'
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
          Value: 'RDSMonitoringRole'
        - Key: AutoTerminate
          Value: '30'
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: 'production-database'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.43'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref ProductionKMSKey
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
          Value: 'ProductionRDS'
        - Key: AutoTerminate
          Value: '30'
  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'ProductionCPUHigh'
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
      AlarmName: 'ProductionMemoryHigh'
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
      TopicName: 'ProductionAlerts'
      KmsMasterKeyId: !Ref ProductionKMSKey
      Tags:
        - Key: Name
          Value: 'ProductionSNSTopic'
        - Key: AutoTerminate
          Value: '30'
  # AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'config-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProductionKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: 'ConfigBucket'
        - Key: AutoTerminate
          Value: '30'
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
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub '${ConfigBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: 'ConfigRole'
        - Key: AutoTerminate
          Value: '30'
  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: 'ProductionConfigRecorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: 'ProductionConfigDeliveryChannel'
      S3BucketName: !Ref ConfigBucket
  # Lambda function for auto-termination
  AutoTerminationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: AutoTerminationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:TerminateInstances
                  - ec2:DescribeTags
                  - rds:DescribeDBInstances
                  - rds:DeleteDBInstance
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !GetAtt ProductionS3Bucket.Arn
                  - !GetAtt LoggingBucket.Arn
                  - !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - s3:DeleteObject
                Resource:
                  - !Sub '${ProductionS3Bucket.Arn}/*'
                  - !Sub '${LoggingBucket.Arn}/*'
                  - !Sub '${ConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:DeleteBucket
                Resource:
                  - !GetAtt ProductionS3Bucket.Arn
                  - !GetAtt LoggingBucket.Arn
                  - !GetAtt ConfigBucket.Arn
      Tags:
        - Key: Name
          Value: 'AutoTerminationRole'
        - Key: AutoTerminate
          Value: '30'
  AutoTerminationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'AutoTerminationFunction'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt AutoTerminationRole.Arn
      Code:
        ZipFile: |
          import boto3
          import json
          from datetime import datetime, timedelta

          def lambda_handler(event, context):
              ec2 = boto3.client('ec2')
              rds = boto3.client('rds')
              s3 = boto3.client('s3')
              
              # Check EC2 instances
              instances = ec2.describe_instances()
              for reservation in instances['Reservations']:
                  for instance in reservation['Instances']:
                      if instance['State']['Name'] == 'running':
                          launch_time = instance['LaunchTime']
                          if datetime.now(launch_time.tzinfo) - launch_time > timedelta(days=30):
                              for tag in instance.get('Tags', []):
                                  if tag['Key'] == 'AutoTerminate' and tag['Value'] == '30':
                                      ec2.terminate_instances(InstanceIds=[instance['InstanceId']])
                                      print(f"Terminated instance: {instance['InstanceId']}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Auto-termination check completed')
              }
      Tags:
        - Key: Name
          Value: 'AutoTerminationFunction'
        - Key: AutoTerminate
          Value: '30'
  AutoTerminationSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: 'AutoTerminationSchedule'
      Description: 'Daily check for resources to auto-terminate'
      ScheduleExpression: 'rate(1 day)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt AutoTerminationFunction.Arn
          Id: 'AutoTerminationTarget'
  AutoTerminationPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AutoTerminationFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt AutoTerminationSchedule.Arn
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref ProductionVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
  S3BucketName:
    Description: 'Production S3 Bucket Name'
    Value: !Ref ProductionS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'
  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref ProductionKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'
  DatabaseSecretArn:
    Description: 'Database Secret ARN'
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret'
```

## Key Fixes Applied:

### 1. **Fixed S3 Bucket ARN References**

- **EC2Role S3AccessPolicy**: Changed `!Ref ProductionS3Bucket` to `!GetAtt ProductionS3Bucket.Arn` for bucket-level actions
- **ConfigRole ConfigBucketPolicy**: Changed `!Ref ConfigBucket` to `!GetAtt ConfigBucket.
