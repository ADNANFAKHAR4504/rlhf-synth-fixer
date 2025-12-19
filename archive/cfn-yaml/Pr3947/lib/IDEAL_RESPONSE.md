# Ideal Infrastructure Response

This document outlines the ideal infrastructure setup for a highly available and fault-tolerant web application using AWS CloudFormation.

### Answer

---

## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Available and Fault-Tolerant Web Application Infrastructure'

Parameters:
  ProjectName:
    Type: String
    Default: 'ha-webapp'
    Description: 'Project name for resource naming and tagging'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - production
      - staging
      - development
    Description: 'Environment name'

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, test, prod)'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  TrustedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'Trusted IP range for HTTP/HTTPS access (e.g., office IP)'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues:
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
    Description: 'EC2 instance type for web servers'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.small'
    Description: 'RDS instance class'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DomainName:
    Type: String
    Default: 'myapp-test.local'
    Description: 'Domain name for Route 53 (e.g., myapp.com). Use .local for testing or provide your actual domain.'

  MinInstances:
    Type: Number
    Default: 2
    Description: 'Minimum number of EC2 instances'
    MinValue: 2

  MaxInstances:
    Type: Number
    Default: 6
    Description: 'Maximum number of EC2 instances'
    MinValue: 2

  DesiredInstances:
    Type: Number
    Default: 2
    Description: 'Desired number of EC2 instances'
    MinValue: 2

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'
    Description: 'Latest Amazon Linux 2023 AMI ID from SSM Parameter Store (works in all regions)'

Resources:
  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateways for private subnets
  NatGatewayEIPAZ1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  NatGatewayEIPAZ2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  NatGatewayAZ1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIPAZ1.AllocationId
      SubnetId: !Ref PublicSubnetAZ1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  NatGatewayAZ2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIPAZ2.AllocationId
      SubnetId: !Ref PublicSubnetAZ2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRouteTableAZ1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateRouteAZ1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableAZ1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayAZ1

  PrivateRouteTableAZ2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateRouteAZ2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableAZ2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayAZ2

  # S3 Buckets
  StaticContentBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-static-content-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-static-content-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  LogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: false
        IgnorePublicAcls: true
        RestrictPublicBuckets: false
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogsBucket.Arn}/alb-logs/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LogsBucket.Arn

  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} ${Environment} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - secretsmanager.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey

  # Subnets
  PublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnetAZ1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetAZ2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.12.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnetAZ1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetAZ1
      RouteTableId: !Ref PrivateRouteTableAZ1

  PrivateSubnetAZ2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetAZ2
      RouteTableId: !Ref PrivateRouteTableAZ2

  DBSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.21.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-az1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DBSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.22.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-az2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTP access from trusted IPs'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTPS access from trusted IPs'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP access from ALB'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-webserver-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
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
          Value: !Sub '${ProjectName}-${Environment}-database-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${StaticContentBucket.Arn}/*'
                  - !Sub '${LogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt StaticContentBucket.Arn
                  - !GetAtt LogsBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: LogsBucketPolicy
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnetAZ1
        - !Ref PublicSubnetAZ2
      LoadBalancerAttributes:
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/health'
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: 'lb_cookie'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-lt-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-webserver-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd amazon-cloudwatch-agent

            # Configure simple health check endpoint
            echo "OK" > /var/www/html/health

            # Start services
            systemctl start httpd
            systemctl enable httpd

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "${ProjectName}/${Environment}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_active"
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
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${ProjectName}/${Environment}/httpd",
                        "log_stream_name": "{instance_id}/access_log"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${ProjectName}/${Environment}/httpd",
                        "log_stream_name": "{instance_id}/error_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref DesiredInstances
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      VPCZoneIdentifier:
        - !Ref PrivateSubnetAZ1
        - !Ref PrivateSubnetAZ2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg-instance-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # RDS Database
  DBMasterPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-db-master-password-${EnvironmentSuffix}'
      Description: !Sub 'Master password for ${ProjectName} ${Environment} RDS database'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-password-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DBSubnetAZ1
        - !Ref DBSubnetAZ2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db-${EnvironmentSuffix}'
      Engine: mysql
      EngineVersion: '8.0.43'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterPasswordSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # CloudWatch Log Groups
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}/${Environment}/httpd'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # CloudWatch Alarms
  ALBTargetHealthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-alb-unhealthy-targets-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when ALB has unhealthy targets'
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when CPU utilization is high'
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

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-database-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when database CPU utilization is high'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database

  DatabaseStorageSpaceAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-database-low-storage-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when database storage space is low'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648 # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database

  # Route 53 Hosted Zone, Health Check and Record
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${ProjectName} ${Environment} environment'
      HostedZoneTags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-hosted-zone-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  Route53HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTP
        ResourcePath: '/health'
        FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
        Port: 80
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-health-check-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  Route53RecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: !Sub '${AWS::Region}-primary'
      Weight: 100
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true
      HealthCheckId: !Ref Route53HealthCheck

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-alb-dns-${EnvironmentSuffix}'

  StaticContentBucketName:
    Description: 'Name of the static content S3 bucket'
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-static-bucket-${EnvironmentSuffix}'

  LogsBucketName:
    Description: 'Name of the logs S3 bucket'
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-logs-bucket-${EnvironmentSuffix}'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-${Environment}-db-endpoint-${EnvironmentSuffix}'

  WebServerSecurityGroupId:
    Description: 'Security group ID for web servers'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-webserver-sg-${EnvironmentSuffix}'
```

## Key Features Implemented

### End-to-End Workflow Validation

**Complete Request Flow**: Internet -> IGW -> ALB -> EC2 -> RDS

- VPC routing allows internet to ALB through IGW
- ALB in public subnets with IGW route verification
- ALB can forward traffic to EC2 via security groups
- EC2 instances can connect to RDS via security groups
- Complete S3 workflow: write, read, encrypt, verify

**Fault Tolerance Workflows**:

- Multi-AZ architecture ensures no single point of failure
- RDS Multi-AZ validation with real database queries
- ALB spans multiple AZs
- ASG spans multiple AZs
- NAT Gateways in multiple AZs

### Security and Compliance

**Security Best Practices**:

- All S3 buckets have KMS encryption enabled
- RDS uses encryption at rest with KMS validation
- Security groups follow principle of least privilege
- No 0.0.0.0/0 ingress on web servers (verified via AWS API)
- Database only accessible from VPC (PubliclyAccessible=false)
- Secrets Manager used for credentials

**IAM Least Privilege**:

- EC2 role has specific S3 permissions (not wildcard)
- CloudWatch agent policy attached
- Proper trust policies for services
