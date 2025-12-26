```
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready multi-tier application infrastructure with high availability, security, and monitoring'

Parameters:
  # Environment Configuration
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
  
  OwnerEmail:
    Type: String
    Description: 'Team email for resource ownership and notifications'
    Default: 'devops-team@company.com'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'
  
  # Compute Configuration
  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for application servers'
    AllowedValues:
      - 't3.small'
      - 't3.medium'
      - 't3.large'
      - 'm5.large'
      - 'm5.xlarge'
  
  AMIId:
    Type: AWS::EC2::Image::Id
    Default: 'ami-0c02fb55956c7d316'  # Amazon Linux 2 AMI in us-east-1
    Description: 'AMI ID for EC2 instances'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
  
  # Database Configuration
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - 'db.t3.micro'
      - 'db.t3.small'
      - 'db.t3.medium'
  
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
  
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: 'Must be 8-41 characters, alphanumeric only'

Conditions:
  # Condition to check if we're in production environment
  IsProduction: !Equals [!Ref EnvironmentSuffix, 'prod']

Resources:
  # =============================================
  # NETWORKING - VPC AND SUBNETS
  # =============================================
  
  # Main VPC with DNS support for RDS and other services
  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-main-vpc'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Internet Gateway for public subnet internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC
  
  # Public Subnet 1 (AZ-a) - For Load Balancer
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1a'
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Public Subnet 2 (AZ-b) - For Load Balancer HA
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1b'
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Private Subnet 1 (AZ-a) - For Application Servers
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1a'
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Private Subnet 2 (AZ-b) - For Application Servers HA
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1b'
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Database Subnet 1 (AZ-a) - For RDS Multi-AZ
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1a'
      CidrBlock: '10.0.21.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-database-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Database Subnet 2 (AZ-b) - For RDS Multi-AZ
  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: 'us-east-1b'
      CidrBlock: '10.0.22.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-database-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # NAT Gateway EIP - For outbound internet access from private subnets
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-nat-eip-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # NAT Gateway for private subnet internet access
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-nat-gateway-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Public Route Table - Routes to Internet Gateway
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-routes'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Default route for public subnets to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
  
  # Associate public subnets with public route table
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
  
  # Private Route Table - Routes to NAT Gateway
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-routes-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Default route for private subnets to NAT Gateway
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1
  
  # Associate private subnets with private route table
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
  
  # =============================================
  # SECURITY GROUPS
  # =============================================
  
  # Load Balancer Security Group - Allow HTTP traffic from internet
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow outbound to web servers'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alb-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Web Server Security Group - Allow traffic from ALB and SSH
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTP from Load Balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
          Description: 'Allow SSH from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-web-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Database Security Group - Allow access only from web servers
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-db-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # =============================================
  # IAM ROLES AND POLICIES
  # =============================================
  
  # IAM Role for EC2 instances with least privilege
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentSuffix}-ec2-instance-role'
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
                Resource: !Sub '${ApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref ApplicationBucket
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentSuffix}-ec2-instance-profile'
      Roles:
        - !Ref EC2InstanceRole
  
  # =============================================
  # LOAD BALANCER AND TARGET GROUP
  # =============================================
  
  # Application Load Balancer in public subnets
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentSuffix}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alb'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # Target Group for web servers
  WebServerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentSuffix}-web-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref MainVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-web-tg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # ALB Listener for HTTP traffic
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebServerTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
  
  # =============================================
  # AUTO SCALING GROUP AND LAUNCH TEMPLATE
  # =============================================
  
  # Launch Template for EC2 instances
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentSuffix}-web-lt'
      LaunchTemplateData:
        ImageId: !Ref AMIId
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple health check endpoint
            echo "<html><body><h1>Health Check OK</h1></body></html>" > /var/www/html/health
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "CWAgent",
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
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentSuffix}-web-server'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Owner
                Value: !Ref OwnerEmail
  
  # Auto Scaling Group
  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentSuffix}-web-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
      TargetGroupARNs:
        - !Ref WebServerTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-web-asg'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
  
  # =============================================
  # RDS DATABASE
  # =============================================
  
  # DB Subnet Group for Multi-AZ deployment
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-db-subnet-group'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # RDS MySQL Database with Multi-AZ and encryption
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentSuffix}-mysql-db'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-mysql-db'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # =============================================
  # S3 STORAGE
  # =============================================
  
  # S3 Bucket for application data with versioning and encryption
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentSuffix}-app-data-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
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
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-app-data-bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # =============================================
  # CLOUDWATCH MONITORING AND ALERTS
  # =============================================
  
  # SNS Topic for CloudWatch Alarms
  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentSuffix}-alerts'
      DisplayName: !Sub '${EnvironmentSuffix} Infrastructure Alerts'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alerts-topic'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # SNS Subscription for email notifications
  AlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AlertsTopic
      Protocol: email
      Endpoint: !Ref OwnerEmail
  
  # CloudWatch Alarm for high CPU utilization
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-high-cpu-utilization'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      AlarmActions:
        - !Ref AlertsTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-high-cpu-alarm'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail
  
  # CloudWatch Alarm for ALB target health
  UnhealthyTargetsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-unhealthy-targets'
      AlarmDescription: 'Alarm when there are unhealthy targets'
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt WebServerTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref AlertsTopic
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-unhealthy-targets-alarm'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

# =============================================
# OUTPUTS
# =============================================

Outputs:
  # Network Outputs
  VPCId:
    Description: 'VPC ID'
    Value: !Ref MainVPC
    Export:
      Name: !Sub '${EnvironmentSuffix}-vpc-id'
  
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${EnvironmentSuffix}-public-subnet-1-id'
  
  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${EnvironmentSuffix}-public-subnet-2-id'
  
  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${EnvironmentSuffix}-private-subnet-1-id'
  
  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${EnvironmentSuffix}-private-subnet-2-id'
  
  # Load Balancer Outputs
  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentSuffix}-alb-dns'
  
  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
  
  # Database Outputs
  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentSuffix}-db-endpoint'
  
  DatabasePort:
    Description: 'RDS Database Port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${EnvironmentSuffix}-db-port'
  
  # Storage Outputs
  S3BucketName:
    Description: 'S3 Bucket Name for Application Data'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${EnvironmentS

```