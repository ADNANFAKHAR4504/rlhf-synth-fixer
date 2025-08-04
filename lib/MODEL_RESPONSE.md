```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC-AWS-Nova-Model: Production-ready, highly available web application infrastructure with multi-AZ deployment, auto-scaling, and comprehensive monitoring'

# ================================
# PARAMETERS SECTION
# ================================
Parameters:
  # Network Configuration
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    ConstraintDescription: 'CIDR block parameter must be in the form x.x.x.x/16-28'

  # Compute Configuration
  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for web servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
    ConstraintDescription: 'Must be a valid EC2 instance type'

  # Auto Scaling Configuration
  MinSize:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: 'Minimum number of instances in Auto Scaling Group'

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 1
    MaxValue: 20
    Description: 'Maximum number of instances in Auto Scaling Group'

  DesiredCapacity:
    Type: Number
    Default: 3
    MinValue: 1
    MaxValue: 20
    Description: 'Desired number of instances in Auto Scaling Group'

  # DNS and SSL Configuration
  DomainName:
    Type: String
    Description: 'Domain name for the application (e.g., app.example.com)'
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid domain name'

  HostedZoneId:
    Type: String
    Description: 'Route 53 Hosted Zone ID for the domain'
    AllowedPattern: '^Z[A-Z0-9]+$'
    ConstraintDescription: 'Must be a valid Route 53 Hosted Zone ID'

  CertificateArn:
    Type: String
    Description: 'ARN of the ACM SSL certificate for HTTPS'
    AllowedPattern: '^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate\/[a-f0-9-]+$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN'

  # Notification Configuration
  NotificationEmail:
    Type: String
    Description: 'Email address for SNS notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

# ================================
# MAPPINGS SECTION
# ================================
Mappings:
  # Subnet CIDR blocks for three AZ deployment
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnetAZ1:
      CIDR: '10.0.1.0/24'
    PublicSubnetAZ2:
      CIDR: '10.0.2.0/24'
    PublicSubnetAZ3:
      CIDR: '10.0.3.0/24'
    PrivateSubnetAZ1:
      CIDR: '10.0.11.0/24'
    PrivateSubnetAZ2:
      CIDR: '10.0.12.0/24'
    PrivateSubnetAZ3:
      CIDR: '10.0.13.0/24'

# ================================
# RESOURCES SECTION
# ================================
Resources:
  # ================================
  # NETWORKING RESOURCES
  # ================================

  # VPC - Virtual Private Cloud
  IaCNovaModelVPC:
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
  IaCNovaModelIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-IGW
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Attach Internet Gateway to VPC
  IaCNovaModelIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      InternetGatewayId: !Ref IaCNovaModelIGW

  # Public Subnets (3 AZs)
  IaCNovaModelPublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-AZ1
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  IaCNovaModelPublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-AZ2
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  IaCNovaModelPublicSubnetAZ3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Subnet-AZ3
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Public

  # Private Subnets (3 AZs)
  IaCNovaModelPrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-AZ1
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private
        - Key: BackupTarget
          Value: 'true'

  IaCNovaModelPrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-AZ2
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private
        - Key: BackupTarget
          Value: 'true'

  IaCNovaModelPrivateSubnetAZ3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Subnet-AZ3
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Type
          Value: Private
        - Key: BackupTarget
          Value: 'true'

  # NAT Gateways for Private Subnets (3 AZs for high availability)
  IaCNovaModelNATGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaModelIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-AZ1
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelNATGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaModelIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-AZ2
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelNATGatewayEIP3:
    Type: AWS::EC2::EIP
    DependsOn: IaCNovaModelIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-EIP-AZ3
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelNATGatewayAZ1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaModelNATGatewayEIP1.AllocationId
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ1
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-AZ1
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelNATGatewayAZ2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaModelNATGatewayEIP2.AllocationId
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ2
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-AZ2
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelNATGatewayAZ3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt IaCNovaModelNATGatewayEIP3.AllocationId
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ3
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-NAT-Gateway-AZ3
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Route Tables
  IaCNovaModelPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Public-Route-Table
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelPrivateRouteTableAZ1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Route-Table-AZ1
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelPrivateRouteTableAZ2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Route-Table-AZ2
        - Key: Project
          Value: IaC-AWS-Nova-Model

  IaCNovaModelPrivateRouteTableAZ3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref IaCNovaModelVPC
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Private-Route-Table-AZ3
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Routes
  IaCNovaModelPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: IaCNovaModelIGWAttachment
    Properties:
      RouteTableId: !Ref IaCNovaModelPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref IaCNovaModelIGW

  IaCNovaModelPrivateRouteAZ1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref IaCNovaModelNATGatewayAZ1

  IaCNovaModelPrivateRouteAZ2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref IaCNovaModelNATGatewayAZ2

  IaCNovaModelPrivateRouteAZ3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ3
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref IaCNovaModelNATGatewayAZ3

  # Subnet Route Table Associations
  IaCNovaModelPublicSubnetRouteTableAssociationAZ1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ1
      RouteTableId: !Ref IaCNovaModelPublicRouteTable

  IaCNovaModelPublicSubnetRouteTableAssociationAZ2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ2
      RouteTableId: !Ref IaCNovaModelPublicRouteTable

  IaCNovaModelPublicSubnetRouteTableAssociationAZ3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPublicSubnetAZ3
      RouteTableId: !Ref IaCNovaModelPublicRouteTable

  IaCNovaModelPrivateSubnetRouteTableAssociationAZ1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPrivateSubnetAZ1
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ1

  IaCNovaModelPrivateSubnetRouteTableAssociationAZ2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPrivateSubnetAZ2
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ2

  IaCNovaModelPrivateSubnetRouteTableAssociationAZ3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref IaCNovaModelPrivateSubnetAZ3
      RouteTableId: !Ref IaCNovaModelPrivateRouteTableAZ3

  # ================================
  # SECURITY GROUPS
  # ================================

  # ALB Security Group - Allows HTTP/HTTPS from internet
  IaCNovaModelALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: IaC-AWS-Nova-Model-ALB-SG
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP/HTTPS from internet'
      VpcId: !Ref IaCNovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-ALB-SG
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # EC2 Security Group - Allows traffic only from ALB
  IaCNovaModelEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: IaC-AWS-Nova-Model-EC2-SG
      GroupDescription: 'Security group for EC2 instances - allows traffic only from ALB'
      VpcId: !Ref IaCNovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref IaCNovaModelALBSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref IaCNovaModelALBSecurityGroup
          Description: 'Allow HTTPS from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-EC2-SG
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # ================================
  # IAM ROLES AND POLICIES
  # ================================

  # IAM Role for EC2 instances
  IaCNovaModelEC2Role:
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
                Resource: !Sub '${IaCNovaModelS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref IaCNovaModelS3Bucket
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-EC2-Role
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Instance Profile for EC2 Role
  IaCNovaModelEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: IaC-AWS-Nova-Model-EC2-Instance-Profile
      Roles:
        - !Ref IaCNovaModelEC2Role

  # ================================
  # STORAGE RESOURCES
  # ================================

  # S3 Bucket for application assets
  IaCNovaModelS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'iac-aws-nova-model-assets-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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

  # ================================
  # BACKUP RESOURCES
  # ================================

  # Backup Vault
  IaCNovaModelBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: IaC-AWS-Nova-Model-Backup-Vault
      EncryptionKeyArn: alias/aws/backup
      BackupVaultTags:
        Name: IaC-AWS-Nova-Model-Backup-Vault
        Project: IaC-AWS-Nova-Model

  # Backup Service Role
  IaCNovaModelBackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: IaC-AWS-Nova-Model-Backup-Role
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
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Backup-Role
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Backup Plan
  IaCNovaModelBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: IaC-AWS-Nova-Model-Backup-Plan
        BackupPlanRule:
          - RuleName: DailyBackupRule
            TargetBackupVault: !Ref IaCNovaModelBackupVault
            ScheduleExpression: 'cron(0 2 ? * * *)'  # Daily at 2 AM UTC
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 7
            RecoveryPointTags:
              Name: IaC-AWS-Nova-Model-Daily-Backup
              Project: IaC-AWS-Nova-Model
      BackupPlanTags:
        Name: IaC-AWS-Nova-Model-Backup-Plan
        Project: IaC-AWS-Nova-Model

  # Backup Selection
  IaCNovaModelBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref IaCNovaModelBackupPlan
      BackupSelection:
        SelectionName: IaC-AWS-Nova-Model-Backup-Selection
        IamRoleArn: !GetAtt IaCNovaModelBackupRole.Arn
        Resources:
          - '*'
        Conditions:
          StringEquals:
            'aws:ResourceTag/BackupTarget':
              - 'true'

  # ================================
  # NOTIFICATION RESOURCES
  # ================================

  # SNS Topic for notifications
  IaCNovaModelSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: IaC-AWS-Nova-Model-Notifications
      DisplayName: 'IaC AWS Nova Model Notifications'
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-SNS-Topic
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # SNS Subscription
  IaCNovaModelSNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref IaCNovaModelSNSTopic
      Endpoint: !Ref NotificationEmail

  # ================================
  # LOAD BALANCER RESOURCES
  # ================================

  # Application Load Balancer
  IaCNovaModelALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: IaC-AWS-Nova-Model-ALB
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref IaCNovaModelALBSecurityGroup
      Subnets:
        - !Ref IaCNovaModelPublicSubnetAZ1
        - !Ref IaCNovaModelPublicSubnetAZ2
        - !Ref IaCNovaModelPublicSubnetAZ3
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-ALB
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # Target Group for ALB
  IaCNovaModelTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: IaC-AWS-Nova-Model-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref IaCNovaModelVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: IaC-AWS-Nova-Model-Target-Group
        - Key: Project
          Value: IaC-AWS-Nova-Model

  # HTTPS Listener for ALB
  IaCNovaModelALBHTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref IaCNovaModelTargetGroup
      LoadBalancerArn: !Ref IaCNovaModelALB
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn

  # HTTP Listener for ALB (redirects to HTTPS)
  IaCNovaModelALBHTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref IaCNovaModelALB
      Port: 80
      Protocol: HTTP

  # ================================
  # LAUNCH TEMPLATE AND AUTO SCALING
  # ================================

  # Launch Template for EC2 instances
  IaCNovaModelLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: IaC-AWS-Nova-Model-Launch-Template
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt IaCNovaModelEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref IaCNovaModelEC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeType: gp3
              VolumeSize: 20
              DeleteOnTermination: true
              Encrypted: true
        Monitoring:
          Enabled: true  # Enable detailed monitoring
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
```
