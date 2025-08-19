AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, scalable, and highly available web application architecture'

Parameters:
  ExistingVPCId:
    Type: String
    Default: vpc-123abcde
    Description: Existing VPC ID where resources will be deployed
  
  SSHAccessCIDR:
    Type: String
    Default: 203.0.113.0/24
    Description: CIDR block allowed for SSH access
    AllowedPattern: ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$
  
  S3AccessCIDR:
    Type: String
    Default: 203.0.113.0/24
    Description: CIDR block allowed for S3 bucket access
    AllowedPattern: ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$
  
  DBMasterUsername:
    Type: String
    Default: admin
    Description: Master username for RDS instance
    MinLength: 1
    MaxLength: 16
    AllowedPattern: ^[a-zA-Z][a-zA-Z0-9]*$
  
  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: Master password for RDS instance
    MinLength: 8
    MaxLength: 41
    AllowedPattern: ^[a-zA-Z0-9]*$

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI
    us-west-2:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI
    eu-west-1:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI

Resources:
  # ===== NETWORKING =====
  
  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet1
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet2
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet1
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet2
        - Key: Environment
          Value: Production

  # Database Subnets
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.5.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: DBSubnet1
        - Key: Environment
          Value: Production

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      CidrBlock: 10.0.6.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: DBSubnet2
        - Key: Environment
          Value: Production

  # Internet Gateway (assuming it exists, but creating route tables)
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: WebApp-IGW
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ExistingVPCId
      InternetGatewayId: !Ref InternetGateway

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: NAT-Gateway-EIP
        - Key: Environment
          Value: Production

  # NAT Gateway
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: WebApp-NAT-Gateway
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ExistingVPCId
      Tags:
        - Key: Name
          Value: PublicRouteTable
        - Key: Environment
          Value: Production

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ExistingVPCId
      Tags:
        - Key: Name
          Value: PrivateRouteTable
        - Key: Environment
          Value: Production

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Subnet Route Table Associations
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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ===== SECURITY GROUPS =====
  
  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref ExistingVPCId
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
          Value: ALB-SecurityGroup
        - Key: Environment
          Value: Production

  # EC2 Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAccessCIDR
      Tags:
        - Key: Name
          Value: EC2-SecurityGroup
        - Key: Environment
          Value: Production

  # RDS Security Group
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS MySQL database
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: RDS-SecurityGroup
        - Key: Environment
          Value: Production

  # ===== IAM ROLES & POLICIES =====
  
  # EC2 IAM Role
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: 
                  - !Sub "${AppDataBucket}/*"
                  - !Sub "${AppLogsBucket}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !Ref AppDataBucket
                  - !Ref AppLogsBucket
      Tags:
        - Key: Environment
          Value: Production

  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ===== S3 BUCKETS =====
  
  # Application Data Bucket
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-app-data-${AWS::AccountId}"
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
          Value: Production

  # Application Logs Bucket
  AppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-app-logs-${AWS::AccountId}"
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
          Value: Production

  # S3 Bucket Policies
  AppDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppDataBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              AWS: !GetAtt EC2Role.Arn
            Action:
              - s3:GetObject
              - s3:PutObject
            Resource: !Sub "${AppDataBucket}/*"
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Ref AppDataBucket
              - !Sub "${AppDataBucket}/*"
            Condition:
              IpAddressIfExists:
                aws:SourceIp: !Ref S3AccessCIDR
              Bool:
                aws:ViaAWSService: "false"

  AppLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppLogsBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              AWS: !GetAtt EC2Role.Arn
            Action:
              - s3:GetObject
              - s3:PutObject
            Resource: !Sub "${AppLogsBucket}/*"
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Ref AppLogsBucket
              - !Sub "${AppLogsBucket}/*"
            Condition:
              IpAddressIfExists:
                aws:SourceIp: !Ref S3AccessCIDR
              Bool:
                aws:ViaAWSService: "false"

  # ===== RDS DATABASE =====
  
  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Name
          Value: WebApp-DB-SubnetGroup
        - Key: Environment
          Value: Production

  # RDS MySQL Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-mysql-db"
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: 8.0.35
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: WebApp-MySQL-DB
        - Key: Environment
          Value: Production

  # ===== LAUNCH TEMPLATE =====
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-launch-template"
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Install and configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "cwagent"
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/webapp",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "WebApp/EC2",
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
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Install web server (example)
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create simple index page
            echo "<h1>Web Application Server</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: WebApp-Instance
              - Key: Environment
                Value: Production

  # ===== AUTO SCALING =====
  
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-asg"
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
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: WebApp-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # ===== APPLICATION LOAD BALANCER =====
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${AWS::StackName}-alb"
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: WebApp-ALB
        - Key: Environment
          Value: Production

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-tg"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ExistingVPCId
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: WebApp-TargetGroup
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ===== CLOUDWATCH ALARMS =====
  
  # CloudWatch Log Group
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/ec2/webapp
      RetentionInDays: 14

  # CPU Utilization Alarm
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-CPU-High"
      AlarmDescription: Alarm when CPU exceeds 80%
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
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-CPU-Low"
      AlarmDescription: Alarm when CPU is below 20%
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

  # ALB Target Health Alarm
  ALBTargetHealthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-ALB-UnhealthyTargets"
      AlarmDescription: Alarm when ALB has unhealthy targets
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  # ===== CLOUDTRAIL =====
  
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/cloudtrail/${AWS::StackName}"
      RetentionInDays: 90

  CloudTrailLogStream:
    Type: AWS::Logs::LogStream
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      LogStreamName: !Sub "${AWS::StackName}-cloudtrail-log-stream"

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub "${AWS::StackName}-cloudtrail"
      S3BucketName: !Ref AppLogsBucket
      S3KeyPrefix: cloudtrail-logs/
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      Tags:
        - Key: Environment
          Value: Production

# ===== OUTPUTS =====

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref ExistingVPCId
    Export:
      Name: !Sub "${AWS::StackName}-VPC-ID"

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-DNS"

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub "http://${ApplicationLoadBalancer.DNSName}"

  RDSEndpoint:
    Description: RDS MySQL database endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-RDS-Endpoint"

  AppDataBucket:
    Description: S3 bucket for application data
    Value: !Ref AppDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-AppData-Bucket"

  AppLogsBucket:
    Description: S3 bucket for application logs
    Value: !Ref AppLogsBucket
    Export:
      Name: !Sub "${AWS::StackName}-AppLogs-Bucket"

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-ASG-Name"

  NATGatewayEIP:
    Description: Elastic IP of the NAT Gateway
    Value: !Ref NATGatewayEIP
    Export:
      Name: !Sub "${AWS::StackName}-NAT-EIP"