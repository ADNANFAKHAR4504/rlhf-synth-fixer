# AWS Production-Ready Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that addresses all your requirements with production-grade security and reliability. This template follows AWS Well-Architected Framework principles and implements defense-in-depth security.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready AWS infrastructure with VPC, Auto Scaling, RDS, S3, and comprehensive monitoring'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'production'
    Description: 'Environment name prefix for resources'
    
  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large, t3.xlarge]
    Description: 'EC2 instance type for Auto Scaling Group'
    
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues: [db.t3.micro, db.t3.small, db.t3.medium, db.t3.large]
    Description: 'RDS instance class'
    
  DBUsername:
    Type: String
    Default: 'admin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: 'Database admin username'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

Mappings:
  AWSRegionAMI:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023
    us-west-2:
      AMI: ami-008fe2fc65df48dac  # Amazon Linux 2023

Resources:
  # ============================================================================
  # NETWORKING LAYER
  # ============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'

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
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.21.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-Subnet-AZ1'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.22.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'

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
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'

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
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'

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

  # ============================================================================
  # SECURITY GROUPS
  # ============================================================================

  ApplicationLoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-ALB-SecurityGroup'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SecurityGroup'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-WebServer-SecurityGroup'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ApplicationLoadBalancerSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ApplicationLoadBalancerSecurityGroup
          Description: 'HTTPS from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from Bastion'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SecurityGroup'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Bastion-SecurityGroup'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access from anywhere (restrict in production)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion-SecurityGroup'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Database-SecurityGroup'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SecurityGroup'

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
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
        - PolicyName: S3BackupAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${BackupBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref BackupBucket
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # ============================================================================
  # STORAGE (S3)
  # ============================================================================

  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-backup-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Backup-Bucket'

  BackupBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref BackupBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${BackupBucket}/*'
              - !Ref BackupBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ============================================================================
  # DATABASE LAYER
  # ============================================================================

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-database-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SubnetGroup'

  DatabaseParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${EnvironmentName}-mysql-parameters'
      Description: 'Custom parameter group for MySQL'
      Family: mysql8.0
      Parameters:
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}'
        slow_query_log: 1
        long_query_time: 2
        general_log: 1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-ParameterGroup'

  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for RDS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-KMS-Key'

  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-database-key'
      TargetKeyId: !Ref DatabaseKMSKey

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      DBParameterGroupName: !Ref DatabaseParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      AutoMinorVersionUpgrade: true
      DeletionProtection: true
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database'

  DatabaseReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database-replica'
      DBInstanceClass: !Ref DBInstanceClass
      SourceDBInstanceIdentifier: !Ref DatabaseInstance
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      AutoMinorVersionUpgrade: true
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-ReadReplica'

  # ============================================================================
  # COMPUTE LAYER
  # ============================================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ApplicationLoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TargetGroup'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${EnvironmentName}</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
            
            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "metrics": {
                "namespace": "AWS/EC2/Custom",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
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
                        "log_group_name": "${WebServerLogGroup}",
                        "log_stream_name": "{instance_id}/httpd/access.log"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${WebServerLogGroup}",
                        "log_stream_name": "{instance_id}/httpd/error.log"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-WebServer'
              - Key: Environment
                Value: !Ref EnvironmentName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-CPU-High'
      AlarmDescription: 'Scale up on high CPU'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-CPU-Low'
      AlarmDescription: 'Scale down on low CPU'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # Bastion Host
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AWSRegionAMI, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch Agent for bastion
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default -s
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion'

  # ============================================================================
  # MONITORING & LOGGING
  # ============================================================================

  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentName}/webserver'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-LogGroup'

  DatabaseLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/${EnvironmentName}-database/error'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-LogGroup'

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${EnvironmentName}/backup-bucket'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-S3-LogGroup'

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${EnvironmentName}-Infrastructure-Dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width