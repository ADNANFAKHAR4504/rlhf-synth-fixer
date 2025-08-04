Below is a comprehensive, production-ready CloudFormation template that meets all your specified requirements. This template creates a highly available, scalable web application infrastructure across three availability zones in the us-west-2 region.
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC-AWS-Nova-Model: Highly available, scalable web application infrastructure with multi-AZ deployment, auto-scaling, and comprehensive monitoring'

# Parameters section for user-configurable values
Parameters:
  # Domain and SSL Configuration
  DomainName:
    Type: String
    Description: 'Domain name for the application (e.g., app.example.com)'
    Default: 'app.example.com'

  HostedZoneId:
    Type: String
    Description: 'Route 53 Hosted Zone ID for the domain'

  CertificateArn:
    Type: String
    Description: 'ACM Certificate ARN for SSL/TLS encryption'

  # Infrastructure Configuration
  VpcCidr:
    Type: String
    Description: 'CIDR block for the VPC'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([0-9]|[1-2][0-9]|3[0-2])$'

  InstanceType:
    Type: String
    Description: 'EC2 instance type for web servers'
    Default: 't3.medium'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  # Auto Scaling Configuration
  MinInstances:
    Type: Number
    Description: 'Minimum number of EC2 instances'
    Default: 2
    MinValue: 1
    MaxValue: 10

  MaxInstances:
    Type: Number
    Description: 'Maximum number of EC2 instances'
    Default: 6
    MinValue: 1
    MaxValue: 20

  DesiredInstances:
    Type: Number
    Description: 'Desired number of EC2 instances'
    Default: 3
    MinValue: 1
    MaxValue: 20

  # Notification Configuration
  NotificationEmail:
    Type: String
    Description: 'Email address for SNS notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# Mappings for region-specific configurations
Mappings:
  # Availability Zones mapping for us-west-2
  RegionMap:
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b
      AZ3: us-west-2c

# Resources section
Resources:
  # ==========================================
  # VPC AND NETWORKING RESOURCES
  # ==========================================

  # Main VPC
  IaCNovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-VPC
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Environment
          Value: Production

  # Internet Gateway
  IaCNovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-IGW
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Attach Internet Gateway to VPC
  IaCNovaVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref IaCNovaVPC
      InternetGatewayId: !Ref IaCNovaInternetGateway

  # Public Subnets (3 AZs)
  IaCNovaPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-1
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  IaCNovaPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-2
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  IaCNovaPublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ3]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-3
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  # Private Subnets (3 AZs)
  IaCNovaPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-1
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private

  IaCNovaPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-2
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private

  IaCNovaPrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaVPC
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ3]
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-3
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private

  # NAT Gateways for private subnet internet access
  IaCNovaNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-1

  IaCNovaNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-2

  IaCNovaNATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-3

  IaCNovaNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaNATGateway1EIP.AllocationId
      SubnetId: !Ref IaCNovaPublicSubnet1
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-1

  IaCNovaNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaNATGateway2EIP.AllocationId
      SubnetId: !Ref IaCNovaPublicSubnet2
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-2

  IaCNovaNATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaNATGateway3EIP.AllocationId
      SubnetId: !Ref IaCNovaPublicSubnet3
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-3

  # Route Tables
  IaCNovaPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-RT
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-RT-1
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-RT-2
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaPrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-RT-3
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Routes
  IaCNovaPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: IaCNovaVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref IaCNovaPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IaCNovaInternetGateway

  IaCNovaPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref IaCNovaNATGateway1

  IaCNovaPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref IaCNovaNATGateway2

  IaCNovaPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaPrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref IaCNovaNATGateway3

  # Route Table Associations
  IaCNovaPublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPublicSubnet1
      RouteTableId: !Ref IaCNovaPublicRouteTable

  IaCNovaPublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPublicSubnet2
      RouteTableId: !Ref IaCNovaPublicRouteTable

  IaCNovaPublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPublicSubnet3
      RouteTableId: !Ref IaCNovaPublicRouteTable

  IaCNovaPrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPrivateSubnet1
      RouteTableId: !Ref IaCNovaPrivateRouteTable1

  IaCNovaPrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPrivateSubnet2
      RouteTableId: !Ref IaCNovaPrivateRouteTable2

  IaCNovaPrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaPrivateSubnet3
      RouteTableId: !Ref IaCNovaPrivateRouteTable3

  # ==========================================
  # SECURITY GROUPS
  # ==========================================

  # Security Group for Application Load Balancer
  IaCNovaALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: IaC-AWS-Nova-Model-ALB-SG
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP and HTTPS traffic from internet'
      VpcId: !Ref IaCNovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP traffic from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-ALB-SG
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Security Group for EC2 Instances
  IaCNovaEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: IaC-AWS-Nova-Model-EC2-SG
      GroupDescription: 'Security group for EC2 instances - allows traffic only from ALB'
      VpcId: !Ref IaCNovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref IaCNovaALBSecurityGroup
          Description: 'HTTP traffic from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref IaCNovaALBSecurityGroup
          Description: 'HTTPS traffic from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-EC2-SG
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # ==========================================
  # IAM ROLES AND POLICIES
  # ==========================================

  # IAM Role for EC2 Instances
  IaCNovaEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: IaC-AWS-Nova-Model-EC2-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: IaC-AWS-Nova-Model-EC2-Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch permissions
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - cloudwatch:GetMetricStatistics
                  - cloudwatch:ListMetrics
                Resource: '*'
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/IaC-AWS-Nova-Model*'
              # S3 permissions for application bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${IaCNovaS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref IaCNovaS3Bucket
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-EC2-Role
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Instance Profile for EC2 Role
  IaCNovaEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: IaC-AWS-Nova-Model-EC2-InstanceProfile
      Roles:
        - !Ref IaCNovaEC2Role

  # ==========================================
  # STORAGE RESOURCES
  # ==========================================

  # S3 Bucket for application assets
  IaCNovaS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'iac-aws-nova-model-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-S3-Bucket
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # ==========================================
  # BACKUP RESOURCES
  # ==========================================

  # Backup Vault
  IaCNovaBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: IaC-AWS-Nova-Model-BackupVault
      EncryptionKeyArn: alias/aws/backup
      BackupVaultTags:
        Name: IaC-AWS-Nova-Model-BackupVault
        Project: IaC-AWS-Nova-Model

  # Backup Plan
  IaCNovaBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: IaC-AWS-Nova-Model-BackupPlan
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref IaCNovaBackupVault
            ScheduleExpression: cron(0 2 ? * * *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 7
            RecoveryPointTags:
              Name: IaC-AWS-Nova-Model-Backup
              Project: IaC-AWS-Nova-Model
      BackupPlanTags:
        Name: IaC-AWS-Nova-Model-BackupPlan
        Project: IaC-AWS-Nova-Model

  # Backup Service Role
  IaCNovaBackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: IaC-AWS-Nova-Model-BackupRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores

  # Backup Selection
  IaCNovaBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref IaCNovaBackupPlan
      BackupSelection:
        SelectionName: IaC-AWS-Nova-Model-BackupSelection
        IamRoleArn: !GetAtt IaCNovaBackupRole.Arn
        Resources:
          - '*'
        Conditions:
          StringEquals:
            'aws:ResourceTag/BackupEnabled':
              - 'true'
            'aws:ResourceTag/Project':
              - 'IaC-AWS-Nova-Model'

  # ==========================================
  # LAUNCH TEMPLATE AND AUTO SCALING
  # ==========================================

  # Launch Template for EC2 instances
  IaCNovaLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: IaC-AWS-Nova-Model-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt IaCNovaEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref IaCNovaEC2SecurityGroup
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeType: gp3
              VolumeSize: 20
              DeleteOnTermination: true
              Encrypted: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            yum update -y

            # Install and configure nginx
            yum install -y nginx

            # Create a simple index page
            cat > /usr/share/nginx/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>IaC AWS Nova Model</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
                    .container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #232f3e; }
                    .info { background-color: #e8f4fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 IaC AWS Nova Model</h1>
                    <p>Welcome to the highly available, scalable web application!</p>
                    <div class="info">
                        <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                        <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                        <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
                        <p><strong>Timestamp:</strong> $(date)</p>
                    </div>
                    <p>This instance is running behind an Application Load Balancer with auto-scaling capabilities.</p>
                </div>
            </body>
            </html>
            EOF

            # Start and enable nginx
            systemctl start nginx
            systemctl enable nginx

            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent

            # Create CloudWatch agent configuration
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "IaC-AWS-Nova-Model",
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
                                    "file_path": "/var/log/nginx/access.log",
                                    "log_group_name": "/aws/ec2/IaC-AWS-Nova-Model/nginx/access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/nginx/error.log",
                                    "log_group_name": "/aws/ec2/IaC-AWS-Nova-Model/nginx/error",
                                    "log_stream_name": "{instance_id}"
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
                Value: IaC-AWS-Nova-Model-WebServer
              - Key: Project
                Value: IaC-AWS-Nova-Model
              - Key: BackupEnabled
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: IaC-AWS-Nova-Model-WebServer-Volume
              - Key: Project
                Value: IaC-AWS-Nova-Model
              - Key: BackupEnabled
                Value: 'true'

  # Auto Scaling Group
  IaCNovaAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: IaC-AWS-Nova-Model-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref IaCNovaLaunchTemplate
        Version: !GetAtt IaCNovaLaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref DesiredInstances
      VPCZoneIdentifier:
        - !Ref IaCNovaPrivateSubnet1
        - !Ref IaCNovaPrivateSubnet2
        - !Ref IaCNovaPrivateSubnet3
      TargetGroupARNs:
        - !Ref IaCNovaTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      NotificationConfigurations:
        - TopicARN: !Ref IaCNovaSNSTopic
          NotificationTypes:
            - autoscaling:EC2_INSTANCE_LAUNCH
            - autoscaling:EC2_INSTANCE_LAUNCH_ERROR
            - autoscaling:EC2_INSTANCE_TERMINATE
            - autoscaling:EC2_INSTANCE_TERMINATE_ERROR
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-ASG
          PropagateAtLaunch: false
        - Key: Project
          Value: IaC-AWS-Nova-Model
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false
```
