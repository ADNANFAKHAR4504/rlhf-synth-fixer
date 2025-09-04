# FinanceApp Production-Grade CloudFormation Template

Below is a comprehensive CloudFormation YAML template that implements a secure three-tier architecture for the FinanceApp following all specified requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade CloudFormation template for FinanceApp - Secure three-tier architecture with high availability'

Parameters:
  Environment:
    Type: String
    Default: 'Prod'
    AllowedValues: ['Dev', 'Prod']
    Description: 'Environment name (Dev or Prod)'
  
  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.small', 't3.medium', 't3.large', 't3.xlarge']
    Description: 'EC2 instance type for application servers'
  
  DBInstanceType:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues: ['db.t3.micro', 'db.t3.small', 'db.t3.medium']
    Description: 'RDS instance type'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
  
  DBMasterUsername:
    Type: String
    Default: 'financeadmin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: 'Database master username'
  
  DBMasterPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Description: 'Database master password (8-41 characters)'

Mappings:
  # AMI mapping for different regions - using Amazon Linux 2
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-0892d3c7ee96c0bf7

Resources:
  # ============================================================================
  # NETWORKING LAYER - VPC, Subnets, Gateways, Route Tables
  # ============================================================================
  
  # Main VPC for both Dev and Prod environments
  FinanceAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-VPC-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Internet Gateway for public subnet connectivity
  FinanceAppIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-IGW-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Attach IGW to VPC
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref FinanceAppVPC
      InternetGatewayId: !Ref FinanceAppIGW

  # Public Subnet 1 (AZ-a) - For Load Balancer and NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PublicSubnet1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Public Subnet 2 (AZ-b) - For Load Balancer redundancy
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PublicSubnet2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Private Subnet 1 (AZ-a) - For Application Servers
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PrivateSubnet1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Private Subnet 2 (AZ-b) - For Application Servers
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PrivateSubnet2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Database Subnet 1 (AZ-a) - For RDS Multi-AZ
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.5.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-DatabaseSubnet1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Database Subnet 2 (AZ-b) - For RDS Multi-AZ
  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinanceAppVPC
      CidrBlock: 10.0.6.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-DatabaseSubnet2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # NAT Gateway EIP
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-NATGW-EIP-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # NAT Gateway for private subnet internet access
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-NATGW-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinanceAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PublicRT-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Public Route to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref FinanceAppIGW

  # Associate Public Subnets with Public Route Table
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

  # Route Table for Private Subnets
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinanceAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-PrivateRT-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Private Route to NAT Gateway
  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Associate Private Subnets with Private Route Table
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

  # ============================================================================
  # SECURITY GROUPS - Network-level security controls
  # ============================================================================

  # Security Group for Application Load Balancer
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'FinanceApp-ALB-SG-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref FinanceAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-ALB-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Security Group for EC2 Application Instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'FinanceApp-EC2-SG-${Environment}'
      GroupDescription: 'Security group for EC2 application instances'
      VpcId: !Ref FinanceAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH access from VPC only'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-EC2-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Security Group for RDS Database
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'FinanceApp-RDS-SG-${Environment}'
      GroupDescription: 'Security group for RDS database instances'
      VpcId: !Ref FinanceAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances only'
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-RDS-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # ============================================================================
  # IAM ROLES AND POLICIES - Least privilege access controls
  # ============================================================================

  # IAM Role for EC2 instances with least privilege
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'FinanceApp-EC2-Role-${Environment}'
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
        - PolicyName: !Sub 'FinanceApp-S3-Access-Policy-${Environment}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${FinanceAppS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref FinanceAppS3Bucket
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'FinanceApp-EC2-Profile-${Environment}'
      Roles:
        - !Ref EC2InstanceRole

  # ============================================================================
  # S3 STORAGE - Secure application data storage
  # ============================================================================

  # S3 Bucket for application data with encryption
  FinanceAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'financeapp-data-${Environment}-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-S3-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # S3 Bucket Policy - Restrict access to EC2 role only
  FinanceAppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FinanceAppS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${FinanceAppS3Bucket}/*'
              - !Ref FinanceAppS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowEC2RoleAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
            Resource:
              - !Sub '${FinanceAppS3Bucket}/*'
              - !Ref FinanceAppS3Bucket

  # ============================================================================
  # DATABASE LAYER - RDS with Multi-AZ for high availability
  # ============================================================================

  # DB Subnet Group for RDS Multi-AZ deployment
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'financeapp-db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for FinanceApp RDS instances'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-DBSubnetGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # RDS Instance with Multi-AZ and encryption
  FinanceAppRDS:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'financeapp-rds-${Environment}'
      DBInstanceClass: !Ref DBInstanceType
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-RDS-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # ============================================================================
  # COMPUTE LAYER - Auto Scaling Group with Launch Template
  # ============================================================================

  # Launch Template for EC2 instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'FinanceApp-LaunchTemplate-${Environment}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
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
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Create a simple index page
            echo "<h1>FinanceApp - ${Environment} Environment</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'FinanceApp-EC2-${Environment}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Department
                Value: 'Finance'
              - Key: Owner
                Value: 'FinanceTeam'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'FinanceApp-EBS-${Environment}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Department
                Value: 'Finance'
              - Key: Owner
                Value: 'FinanceTeam'

  # Auto Scaling Group for high availability
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'FinanceApp-ASG-${Environment}'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
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
          Value: !Sub 'FinanceApp-ASG-${Environment}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Department
          Value: 'Finance'
          PropagateAtLaunch: true
        - Key: Owner
          Value: 'FinanceTeam'
          PropagateAtLaunch: true

  # ============================================================================
  # LOAD BALANCER - Application Load Balancer for high availability
  # ============================================================================

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'FinanceApp-ALB-${Environment}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-ALB-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # Target Group for ALB
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'FinanceApp-TG-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref FinanceAppVPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'FinanceApp-TG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: 'Finance'
        - Key: Owner
          Value: 'FinanceTeam'

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

# ============================================================================
# OUTPUTS - For validation and integration with other stacks
# ============================================================================

Outputs:
  VPCId:
    Description: 'VPC ID for FinanceApp'
    Value: !Ref FinanceAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  DatabaseSubnet1Id:
    Description: 'Database Subnet 1 ID'
    Value: !Ref DatabaseSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet1-ID'

  DatabaseSubnet2Id:
    Description: 'Database Subnet 2 ID'
    Value: !Ref DatabaseSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet2-ID'

  S3BucketName:
    Description: 'S3 Bucket Name for application data'
    Value: !Ref FinanceAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt FinanceAppRDS.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: 'RDS Database Port'
    Value: !GetAtt FinanceAppRDS.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SG-ID'

  RDSSecurityGroupId:
    Description: 'RDS Security Group ID'
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-RDS-SG-ID'
```

## Key Design Decisions and Security Features

### **Security Implementation:**

1. **Least Privilege IAM**: EC2 instances only have access to their specific S3 bucket and CloudWatch
2. **Network Segmentation**: Three-tier architecture with proper subnet isolation
3. **Security Groups**: Restrictive ingress rules with source-based access control
4. **Encryption**: S3 server-side encryption and RDS storage encryption enabled
5. **VPC Security**: Private subnets for application and database tiers

### **High Availability & Resilience:**

1. **Multi-AZ Deployment**: Resources distributed across multiple availability zones
2. **Auto Scaling
