I'll create a comprehensive CloudFormation template that addresses all the complex requirements you've outlined. This is a sophisticated multi-region deployment with intricate failover and data residency constraints.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Available Multi-Region Web Application Infrastructure with Advanced Failover and Data Residency Controls'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment type for resource tagging'
  
  CostCenter:
    Type: String
    Default: 'engineering'
    Description: 'Cost center for resource allocation'
  
  CPUThresholdUSEast1:
    Type: Number
    Default: 70
    MinValue: 1
    MaxValue: 100
    Description: 'CPU threshold for auto-scaling in us-east-1'
  
  CPUThresholdUSWest2:
    Type: Number
    Default: 75
    MinValue: 1
    MaxValue: 100
    Description: 'CPU threshold for auto-scaling in us-west-2'
  
  MemoryThresholdUSEast1:
    Type: Number
    Default: 80
    MinValue: 1
    MaxValue: 100
    Description: 'Memory threshold for auto-scaling in us-east-1'
  
  MemoryThresholdUSWest2:
    Type: Number
    Default: 85
    MinValue: 1
    MaxValue: 100
    Description: 'Memory threshold for auto-scaling in us-west-2'
  
  GlobalLogReplication:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: 'Enable cross-region log replication'
  
  FailoverMode:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: 'Enable failover mode for tag overrides'
  
  DBUsername:
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    Description: 'Database administrator username'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database administrator password'

Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']
  IsUSWest2: !Equals [!Ref 'AWS::Region', 'us-west-2']
  EnableGlobalLogs: !Equals [!Ref GlobalLogReplication, 'true']
  IsFailoverMode: !Equals [!Ref FailoverMode, 'true']
  IsProduction: !Equals [!Ref Environment, 'production']

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI
      BackupWindow: '03:00-04:00'
      MaintenanceWindow: 'sun:04:00-sun:05:00'
    us-west-2:
      AMI: ami-0fedcba0987654321  # Amazon Linux 2 AMI
      BackupWindow: '06:00-07:00'
      MaintenanceWindow: 'sun:07:00-sun:08:00'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !If [IsUSEast1, '10.0.0.0/16', '10.1.0.0/16']
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

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
      CidrBlock: !If [IsUSEast1, '10.0.1.0/24', '10.1.1.0/24']
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-1-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.2.0/24', '10.1.2.0/24']
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-2-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.3.0/24', '10.1.3.0/24']
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-1-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.4.0/24', '10.1.4.0/24']
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-2-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # NAT Gateway for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-1-${AWS::Region}'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway-1-${AWS::Region}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-RT-${AWS::Region}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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
          Value: !Sub '${AWS::StackName}-Private-RT-1-${AWS::Region}'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
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
          Value: !Sub '${AWS::StackName}-ALB-SG-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !If [IsUSEast1, '10.0.0.0/16', '10.1.0.0/16']
        # Cross-region private communication
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !If [IsUSEast1, '10.1.0.0/16', '10.0.0.0/16']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DB-SG-${AWS::Region}'
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # IAM Roles and Policies
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${AWS::StackName}-*/*'
        - PolicyName: CrossRegionAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeRegions
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:RequestedRegion': ['us-east-1', 'us-west-2']
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # Emergency Access Role
  EmergencyAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EmergencyAccess-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      Policies:
        - PolicyName: EmergencyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:*
                  - rds:*
                  - elasticloadbalancing:*
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:RequestedRegion': ['us-east-1', 'us-west-2']

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate-${AWS::Region}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd aws-logs
            systemctl start httpd
            systemctl enable httpd
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "AWS/EC2/Custom",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
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
                        "log_group_name": "${CloudWatchLogGroup}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Create simple web page
            cat > /var/www/html/index.html << EOF
            <html>
            <head><title>Web Server - ${AWS::Region}</title></head>
            <body>
            <h1>Hello from ${AWS::Region}</h1>
            <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p>Region: ${AWS::Region}</p>
            </body>
            </html>
            EOF
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer-${AWS::Region}'
              - Key: Environment
                Value: !If [IsFailoverMode, 'failover', !Ref Environment]
              - Key: CostCenter
                Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB-${AWS::Region}'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG-${AWS::Region}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG-${AWS::Region}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
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
          Value: !Sub '${AWS::StackName}-ASG-Instance-${AWS::Region}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # Auto Scaling Policies
  CPUScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  CPUScaleDownPolicy:
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
      AlarmName: !Sub '${AWS::StackName}-CPU-High-${AWS::Region}'
      AlarmDescription: Scale up on high CPU
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsUSEast1, !Ref CPUThresholdUSEast1, !Ref CPUThresholdUSWest2]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref CPUScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-CPU-Low-${AWS::Region}'
      AlarmDescription: Scale down on low CPU
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
        - !Ref CPUScaleDownPolicy

  MemoryAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Memory-High-${AWS::Region}'
      AlarmDescription: Scale up on high memory usage
      MetricName: mem_used_percent
      Namespace: AWS/EC2/Custom
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsUSEast1, !Ref MemoryThresholdUSEast1, !Ref MemoryThresholdUSWest2]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref CPUScaleUpPolicy

  # CloudWatch Log Group
  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}-${AWS::Region}'
      RetentionInDays: !If [EnableGlobalLogs, 365, 30]
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group-${AWS::Region}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # RDS Instance (Primary in us-east-1)
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Condition: IsUSEast1
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-primary-db'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '13.7'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: !FindInMap [RegionMap, !Ref 'AWS::Region', BackupWindow]
      PreferredMaintenanceWindow: !FindInMap [RegionMap, !Ref 'AWS::Region', MaintenanceWindow]
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # RDS Read Replica (in us-west-2)
  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Condition: IsUSWest2
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-read-replica-db'
      DBInstanceClass: db.t3.micro
      SourceDBInstanceIdentifier: !Sub 'arn:aws:rds:us-east-1:${AWS::AccountId}:db:${AWS::StackName}-primary-db'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      Tags:
        - Key: Environment
          Value: !If [IsFailoverMode, 'failover', !Ref Environment]
        - Key: CostCenter
          Value: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # AWS Backup Vault
  BackupVault:
    Type: AWS::Backup::BackupVault
    Condition: IsUSEast1
    Properties:
      BackupVaultName: !Sub '${AWS::StackName}-backup-vault'
      EncryptionKeyArn: alias/aws/backup
      BackupVaultTags:
        Environment: !If [IsFailoverMode, 'failover', !Ref Environment]
        CostCenter: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # Backup Plan
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Condition: IsUSEast1
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${AWS::StackName}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 2 ? * MON-FRI *)'  # Weekdays only
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
            RecoveryPointTags:
              Environment: !If [IsFailoverMode, 'failover', !Ref Environment]
              CostCenter: !If [IsFailoverMode, 'emergency', !Ref CostCenter]

  # Backup Selection
  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Condition: IsUSEast1
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${AWS::StackName}-rds-selection'
        IamRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/service-role/AWSBackupDefaultServiceRole'
        Resources:
          - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${AWS::StackName}-primary-db'

  # Route 53 Health Check
  Route53HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS_STR_MATCH
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 80
      RequestInterval: 30
      FailureThreshol