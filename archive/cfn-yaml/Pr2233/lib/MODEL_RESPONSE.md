I'll create a comprehensive CloudFormation template that implements all the required security and compliance controls. This template will focus on secure infrastructure configuration across multiple AWS services.

Key features of this template:
- S3 bucket encryption and security controls
- IAM role configurations with MFA enforcement
- EC2 instances with detailed monitoring and security controls
- Multi-AZ subnet configuration
- Comprehensive logging and monitoring setup

```yaml
I'll create a comprehensive CloudFormation template that implements all the required security and compliance controls. This template will focus on secure infrastructure configuration across multiple AWS services.

Key features of this template:
- S3 bucket encryption and security controls
- IAM role configurations with MFA enforcement
- EC2 instances with detailed monitoring and security controls
- Multi-AZ subnet configuration
- Comprehensive logging and monitoring setup

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Template with comprehensive security controls, monitoring, and compliance features'

# ============================================================================
# PARAMETERS SECTION
# Environment-specific and configurable values
# ============================================================================
Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource naming and configuration'
    
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet in AZ1'
    
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet in AZ2'
    
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for private subnet in AZ1'
    
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for private subnet in AZ2'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type for application servers'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
    
  AllowedCidrForSSH:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for SSH access (restrict in production)'
    
  CloudTrailBucketRetentionDays:
    Type: Number
    Default: 90
    MinValue: 30
    MaxValue: 365
    Description: 'Number of days to retain CloudTrail logs'

# ============================================================================
# MAPPINGS SECTION
# Static values and region-specific configurations
# ============================================================================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023 AMI
    us-west-2:
      AMI: ami-008fe2fc65df48dac  # Amazon Linux 2023 AMI

# ============================================================================
# RESOURCES SECTION
# Infrastructure components with security controls
# ============================================================================
Resources:

  # ========================================
  # VPC AND NETWORKING RESOURCES
  # ========================================
  
  MyAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-vpc-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway for public subnet connectivity
  MyAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'myapp-igw-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyAppVPC
      InternetGatewayId: !Ref MyAppInternetGateway

  # Public Subnets (Multi-AZ for high availability)
  MyAppPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-public-subnet-1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  MyAppPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-public-subnet-2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Private Subnets (Multi-AZ for high availability)
  MyAppPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'myapp-private-subnet-1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  MyAppPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'myapp-private-subnet-2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  # NAT Gateways for private subnet internet access
  MyAppNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: MyAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'myapp-nat-eip-1-${Environment}'

  MyAppNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: MyAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'myapp-nat-eip-2-${Environment}'

  MyAppNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt MyAppNATGateway1EIP.AllocationId
      SubnetId: !Ref MyAppPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'myapp-nat-gateway-1-${Environment}'

  MyAppNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt MyAppNATGateway2EIP.AllocationId
      SubnetId: !Ref MyAppPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'myapp-nat-gateway-2-${Environment}'

  # Route Tables
  MyAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-public-rt-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-private-rt-1-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-private-rt-2-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Routes
  MyAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: MyAppVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref MyAppPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref MyAppInternetGateway

  MyAppPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref MyAppPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref MyAppNATGateway1

  MyAppPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref MyAppPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref MyAppNATGateway2

  # Route Table Associations
  MyAppPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref MyAppPublicSubnet1
      RouteTableId: !Ref MyAppPublicRouteTable

  MyAppPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref MyAppPublicSubnet2
      RouteTableId: !Ref MyAppPublicRouteTable

  MyAppPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref MyAppPrivateSubnet1
      RouteTableId: !Ref MyAppPrivateRouteTable1

  MyAppPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref MyAppPrivateSubnet2
      RouteTableId: !Ref MyAppPrivateRouteTable2

  # ========================================
  # SECURITY GROUPS
  # ========================================
  
  # Application Load Balancer Security Group
  MyAppALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'myapp-alb-sg-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP/HTTPS traffic'
      VpcId: !Ref MyAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref MyAppWebServerSecurityGroup
          Description: 'Allow HTTP to web servers'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-alb-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Web Server Security Group
  MyAppWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'myapp-webserver-sg-${Environment}'
      GroupDescription: 'Security group for web servers - allows traffic from ALB and SSH from bastion'
      VpcId: !Ref MyAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref MyAppALBSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref MyAppBastionSecurityGroup
          Description: 'Allow SSH from bastion host'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS for package updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP for package updates'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-webserver-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Bastion Host Security Group
  MyAppBastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'myapp-bastion-sg-${Environment}'
      GroupDescription: 'Security group for bastion host - allows SSH from specified CIDR'
      VpcId: !Ref MyAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCidrForSSH
          Description: 'Allow SSH from specified CIDR range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref MyAppWebServerSecurityGroup
          Description: 'Allow SSH to web servers'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS for updates'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-bastion-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================
  
  # EC2 Instance Role with minimal permissions
  MyAppEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'myapp-ec2-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'false'  # MFA not required for service roles
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: !Sub 'myapp-ec2-policy-${Environment}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: 
                  - !Sub '${MyAppS3Bucket}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-server-side-encryption': 'AES256'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/myapp-${Environment}:*'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-ec2-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'myapp-ec2-profile-${Environment}'
      Roles:
        - !Ref MyAppEC2Role

  # Admin Role with MFA requirement
  MyAppAdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'myapp-admin-role-${Environment}'
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
                'aws:MultiFactorAuthAge': '3600'  # MFA must be within 1 hour
      Policies:
        - PolicyName: !Sub 'myapp-admin-policy-${Environment}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:*'
                  - 's3:*'
                  - 'cloudformation:*'
                  - 'iam:ListRoles'
                  - 'iam:ListPolicies'
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:RequestedRegion': !Ref 'AWS::Region'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-admin-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # S3 STORAGE WITH ENCRYPTION
  # ========================================
  
  MyAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'myapp-storage-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
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
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-storage-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail S3 Bucket
  MyAppCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'myapp-cloudtrail-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !Ref CloudTrailBucketRetentionDays
      Tags:
        - Key: Name
          Value: !Sub 'myapp-cloudtrail-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref MyAppCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt MyAppCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${MyAppCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # ========================================
  # EC2 INSTANCES WITH ENCRYPTED EBS
  # ========================================
  
  # Launch Template for Web Servers
  MyAppWebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'myapp-webserver-lt-${Environment}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt MyAppEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref MyAppWebServerSecurityGroup
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
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "metrics": {
                "namespace": "MyApp/${Environment}",
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
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/myapp-${Environment}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'myapp-webserver-${Environment}'
              - Key: Environment
                Value: !Ref Environment
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'myapp-webserver-volume-${Environment}'
              - Key: Environment
                Value: !Ref Environment

  # Web Server Instances
  MyAppWebServer1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref MyAppWebServerLaunchTemplate
        Version: !GetAtt MyAppWebServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref MyAppPrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'myapp-webserver-1-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppWebServer2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref MyAppWebServerLaunchTemplate
        Version: !GetAtt MyAppWebServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref MyAppPrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'myapp-webserver-2-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Bastion Host
  MyAppBastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SubnetId: !Ref MyAppPublicSubnet1
      SecurityGroupIds:
        - !Ref MyAppBastionSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-bastion-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # APPLICATION LOAD BALANCER
  # ========================================
  
  MyAppApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'myapp-alb-${Environment}'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref MyAppALBSecurityGroup
      Subnets:
        - !Ref MyAppPublicSubnet1
        - !Ref MyAppPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'myapp-alb-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'myapp-tg-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref MyAppVPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref MyAppWebServer1
          Port: 80
        - Id: !Ref MyAppWebServer2
          Port: 80
      Tags:
        - Key: Name
          Value: !Sub 'myapp-tg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  MyAppALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref MyAppALBTargetGroup
      LoadBalancerArn: !Ref MyAppApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ========================================
  # CLOUDWATCH MONITORING AND ALARMS
  # ========================================
  
  # CPU Utilization Alarms for Web Servers
  MyAppWebServer1CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'myapp-webserver-1-cpu-${Environment}'
      AlarmDescription: 'CPU utilization alarm for web server 1'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref MyAppWebServer1
      TreatMissingData: notBreaching

  MyAppWebServer2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'myapp-webserver-2-cpu-${Environment}'
      AlarmDescription: 'CPU utilization alarm for web server 2'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref MyAppWebServer2
      TreatMissingData: notBreaching

  # CloudWatch Log Group
  MyAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/myapp-${Environment}'
      RetentionInDays: 30

  # ========================================
  # CLOUDTRAIL FOR AUDIT LOGGING
  # ========================================
  
  MyAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: MyAppCloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'myapp-cloudtrail-${Environment}'
      S3BucketName: !Ref MyAppCloudTrailBucket
      S3KeyPrefix: !Sub 'cloudtrail-logs/${Environment}/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: 
                - !Sub '${MyAppS3Bucket}/*'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-cloudtrail-${Environment}'