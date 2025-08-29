```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Available Web Application Infrastructure with Multi-AZ and Cross-Region Simulation'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'
  
  CostCenter:
    Type: String
    Default: 'engineering'
    Description: 'Cost center for resource tagging'
  
  CPUThresholdEast:
    Type: Number
    Default: 70
    MinValue: 1
    MaxValue: 100
    Description: 'CPU threshold for auto scaling in us-east-1'
  
  CPUThresholdWest:
    Type: Number
    Default: 75
    MinValue: 1
    MaxValue: 100
    Description: 'CPU threshold for auto scaling in us-west-2'
  
  MemoryThresholdEast:
    Type: Number
    Default: 80
    MinValue: 1
    MaxValue: 100
    Description: 'Memory threshold for auto scaling in us-east-1'
  
  MemoryThresholdWest:
    Type: Number
    Default: 85
    MinValue: 1
    MaxValue: 100
    Description: 'Memory threshold for auto scaling in us-west-2'
  
  DomainName:
    Type: String
    Default: 'webapp.local'
    Description: 'Domain name for Route 53 DNS (use .local for testing)'
  
  DBUsername:
    Type: String
    Default: 'appuser'
    Description: 'Database username'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database password'

Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']
  EnableCrossRegionReplication: !Equals [!Ref Environment, 'prod']

Resources:
  # VPC Infrastructure - US-East-1
  VPCEast:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Public Subnets - US-East-1
  PublicSubnetEast1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: 'us-east-1a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-east-1a'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicSubnetEast2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: 'us-east-1b'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-east-1b'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Private Subnets - US-East-1
  PrivateSubnetEast1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: 'us-east-1a'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-east-1a'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnetEast2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: 'us-east-1b'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-east-1b'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Database Subnets - US-East-1
  DBSubnetEast1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.5.0/24'
      AvailabilityZone: 'us-east-1a'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-east-1a'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  DBSubnetEast2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCEast
      CidrBlock: '10.0.6.0/24'
      AvailabilityZone: 'us-east-1b'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-east-1b'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Internet Gateway
  InternetGatewayEast:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  AttachGatewayEast:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPCEast
      InternetGatewayId: !Ref InternetGatewayEast

  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGatewayEast
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  NATGatewayEast:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnetEast1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Tables
  PublicRouteTableEast:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCEast
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateRouteTableEast:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCEast
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Routes
  PublicRouteEast:
    Type: AWS::EC2::Route
    DependsOn: AttachGatewayEast
    Properties:
      RouteTableId: !Ref PublicRouteTableEast
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGatewayEast

  PrivateRouteEast:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableEast
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayEast

  # Route Table Associations
  PublicSubnetRouteTableAssociationEast1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetEast1
      RouteTableId: !Ref PublicRouteTableEast

  PublicSubnetRouteTableAssociationEast2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetEast2
      RouteTableId: !Ref PublicRouteTableEast

  PrivateSubnetRouteTableAssociationEast1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetEast1
      RouteTableId: !Ref PrivateRouteTableEast

  PrivateSubnetRouteTableAssociationEast2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetEast2
      RouteTableId: !Ref PrivateRouteTableEast

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPCEast
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPCEast
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPCEast
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-role'
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
                Resource: !Sub '${S3Bucket}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  EmergencyAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-emergency-access-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': ['us-east-1', 'us-west-2']
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # S3 Bucket for application assets
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-webapp-assets-${AWS::AccountId}'
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
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Groups
  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-webserver'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/application/${Environment}'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DBSubnetEast1
        - !Ref DBSubnetEast2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS PostgreSQL Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-postgres-db'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15.3'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false  # Allow manual failover
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-postgres-db'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Read Replica in different AZ (simulates cross-region)
  DatabaseReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-postgres-read-replica'
      SourceDBInstanceIdentifier: !Ref DatabaseInstance
      DBInstanceClass: db.t3.micro
      PubliclyAccessible: false
      AvailabilityZone: 'us-east-1b'  # Different AZ simulates cross-region
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-postgres-read-replica'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Region
          Value: 'simulated-us-west-2'

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-web-server-template'
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment} environment</h1>" > /var/www/html/index.html
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent with memory metrics
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "CWAgent",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60,
                    "totalmem": false
                  },
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": false
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
                        "log_stream_name": "{instance_id}/httpd/access_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Environment}-web-server'
              - Key: Environment
                Value: !Ref Environment
              - Key: CostCenter
                Value: !Ref CostCenter

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnetEast1
        - !Ref PublicSubnetEast2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPCEast
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-tg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnetEast1
        - !Ref PrivateSubnetEast2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      StepAdjustments:
        - MetricIntervalLowerBound: 0
          ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      StepAdjustments:
        - MetricIntervalUpperBound: 0
          ScalingAdjustment: -1

  # CloudWatch Alarms - CPU and Memory
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-cpu-high'
      AlarmDescription: 'Scale up on high CPU'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref CPUThresholdEast
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-cpu-low'
      AlarmDescription: 'Scale down on low CPU'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  MemoryAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-memory-high'
      AlarmDescription: 'Scale up on high memory usage'
      MetricName: MemoryUtilization
      Namespace: CWAgent
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref MemoryThresholdEast
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  MemoryAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-memory-low'
      AlarmDescription: 'Scale down on low memory usage'
      MetricName: MemoryUtilization
      Namespace: CWAgent
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 40
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # Route 53 Private Hosted Zone (for CI/CD compatibility)
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      VPCs:
        - VPCId: !Ref VPCEast
          VPCRegion: !Ref AWS::Region
      HostedZoneConfig:
        Comment: !Sub 'Private hosted zone for ${Environment} environment'
      HostedZoneTags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route 53 Health Check for us-east-1
  HealthCheckEast:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-health-check-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route 53 Record with Failover Routing
  DNSRecordPrimary:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'app.${DomainName}'
      Type: A
      SetIdentifier: 'primary-east'
      Failover: PRIMARY
      HealthCheckId: !Ref HealthCheckEast
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # Secondary ALB (simulates us-west-2 region)
  ApplicationLoadBalancerSecondary:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb-secondary'
      Scheme: internal  # Internal to simulate cross-region
      Type: application
      Subnets:
        - !Ref PrivateSubnetEast1
        - !Ref PrivateSubnetEast2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-secondary'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Region
          Value: 'simulated-us-west-2'

  # Secondary Target Group
  TargetGroupSecondary:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-tg-secondary'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPCEast
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-tg-secondary'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Region
          Value: 'simulated-us-west-2'

  # Secondary ALB Listener
  ALBListenerSecondary:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroupSecondary
      LoadBalancerArn: !Ref ApplicationLoadBalancerSecondary
      Port: 80
      Protocol: HTTP

  # Route 53 Health Check for Secondary ALB
  HealthCheckSecondary:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancerSecondary.DNSName
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-health-check-secondary'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # DNS Record with Failover - Secondary
  DNSRecordSecondary:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'app.${DomainName}'
      Type: A
      SetIdentifier: 'secondary-simulated-west'
      Failover: SECONDARY
      HealthCheckId: !Ref HealthCheckSecondary
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancerSecondary.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancerSecondary.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # AWS Backup Vault
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${Environment}-backup-vault'
      EncryptionKeyArn: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/backup'
      BackupVaultTags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter

  # Backup Plan
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${Environment}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 2 ? * MON-FRI *)'  # Weekdays only
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
      BackupPlanTags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter

  # Backup Selection
  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${Environment}-rds-selection'
        IamRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/service-role/AWSBackupDefaultServiceRole'
        Resources:
          - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${DatabaseInstance}'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPCEast
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  HealthCheckId:
    Description: 'Route 53 Health Check ID'
    Value: !Ref HealthCheckEast
    Export:
      Name: !Sub '${AWS::StackName}-Health-Check'

  HostedZoneId:
    Description: 'Route 53 Hosted Zone ID'
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-Hosted-Zone'

  DomainName:
    Description: 'Domain Name'
    Value: !Ref DomainName
    Export:
      Name: !Sub '${AWS::StackName}-Domain-Name'

  ReadReplicaEndpoint:
    Description: 'RDS Read Replica Endpoint'
    Value: !GetAtt DatabaseReadReplica.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Read-Replica-Endpoint'

  SecondaryLoadBalancerDNS:
    Description: 'Secondary Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancerSecondary.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-Secondary-ALB-DNS'
```