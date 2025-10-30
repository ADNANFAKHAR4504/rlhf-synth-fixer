### Reasoning Trace
---

This is a comprehensive request for a secure AWS CloudFormation template. I need to create a YAML template that includes:

1. VPC with public and private subnets across 2 AZs
2. EC2 instances (Amazon Linux 2, t2.micro) with CloudWatch logging
3. RDS instance with 7-day backup retention
4. S3 buckets with encryption and versioning
5. IAM roles/policies with least privilege
6. MFA enforcement for console users
7. CloudTrail for audit logging
8. S3 bucket access restrictions by IP
9. ALB with SSL certificate
10. AWS Config Rules for compliance
11. SSH access restrictions

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that implements a secure AWS infrastructure with strong IAM controls and resource-level security. This template follows AWS best practices and includes all the requested components.

## Secure AWS Infrastructure CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with Strong IAM and Resource Security'

# Template Parameters
Parameters:
  AllowedSSHIP:
    Description: 'IP address range allowed for SSH access (e.g., 203.0.113.0/24)'
    Type: String
    Default: '10.0.0.0/8'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/([0-9]|[1-2][0-9]|3[0-2])$'
    ConstraintDescription: 'Must be a valid IP CIDR range'
  
  AllowedS3AccessIP:
    Description: 'IP address range allowed for S3 bucket access'
    Type: String
    Default: '203.0.113.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/([0-9]|[1-2][0-9]|3[0-2])$'
    ConstraintDescription: 'Must be a valid IP CIDR range'
  
  DBUsername:
    Description: 'Database master username'
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'
  
  DBPassword:
    Description: 'Database master password'
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  DomainName:
    Description: 'Domain name for SSL certificate (e.g., example.com)'
    Type: String
    Default: 'example.com'

# Mappings for latest Amazon Linux 2 AMI IDs
Mappings:
  RegionAMI:
    us-east-1:
      AMI: 'ami-0b5eea76982371e91'  # Amazon Linux 2 AMI (update as needed)

# Resources Section
Resources:
  
  # ===== NETWORKING =====
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Production
  
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
  
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
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Type
          Value: Public
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Type
          Value: Public
  
  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Type
          Value: Private
  
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Type
          Value: Private
  
  # NAT Gateways for Private Subnets
  EIPForNAT1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
  
  EIPForNAT2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
  
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT1'
  
  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT2'
  
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRT'
  
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
  
  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable
  
  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable
  
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRT1'
  
  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1
  
  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1
  
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRT2'
  
  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2
  
  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ===== IAM ROLES AND POLICIES =====
  # EC2 Instance Role
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ApplicationDataBucket.Arn
                  - !Sub '${ApplicationDataBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Role'
  
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
  
  # IAM Group with MFA Policy
  SecureAdminGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${AWS::StackName}-SecureAdmins'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Policies:
        - PolicyName: EnforceMFAPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: DenyAllExceptListedIfNoMFA
                Effect: Deny
                NotAction:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:DeleteVirtualMFADevice'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:EnableMFADevice'
                  - 'iam:ResyncMFADevice'
                  - 'iam:ListAccountAliases'
                  - 'iam:ListUsers'
                  - 'iam:ListSSHPublicKeys'
                  - 'iam:ListAccessKeys'
                  - 'iam:ListServiceSpecificCredentials'
                  - 'iam:ListMFADevices'
                  - 'iam:GetAccountSummary'
                  - 'sts:GetSessionToken'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': false

  # ===== SECURITY GROUPS =====
  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP from anywhere (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
  
  # EC2 Instance Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'SSH from allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-SG'
  
  # RDS Security Group
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-SG'

  # ===== S3 BUCKETS =====
  # CloudTrail Logs Bucket
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrailLogs'
  
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
  
  # Application Data Bucket
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppData'
  
  ApplicationDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowIPAccess
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt ApplicationDataBucket.Arn
              - !Sub '${ApplicationDataBucket.Arn}/*'
            Condition:
              IpAddress:
                'aws:SourceIp': !Ref AllowedS3AccessIP

  # ===== CLOUDTRAIL =====
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-Trail'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationDataBucket.Arn}/'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail'

  # ===== CLOUDWATCH LOG GROUPS =====
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: 30

  # ===== EC2 INSTANCES =====
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            
            # Install and configure CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Create CloudWatch agent config
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/messages"
                      },
                      {
                        "file_path": "/var/log/secure",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/secure"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Instance1'
  
  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Instance2'

  # ===== RDS DATABASE =====
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnetGroup'
  
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t2.micro
      Engine: mysql
      EngineVersion: '8.0.33'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: '20'
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS'

  # ===== APPLICATION LOAD BALANCER =====
  # SSL Certificate (requires validation)
  Certificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          ValidationDomain: !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Certificate'
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
  
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref EC2Instance1
        - Id: !Ref EC2Instance2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TG'
  
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
  
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref Certificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # ===== AWS CONFIG =====
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-config-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
  
  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
  
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
  
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn: ConfigBucketPolicy
    Properties:
      Name: !Sub '${AWS::StackName}-Recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
  
  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-DeliveryChannel'
      S3BucketName: !Ref ConfigBucket
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours
  
  # Start Config Recording
  ConfigRecorderStatus:
    Type: AWS::Config::ConfigurationRecorderStatus
    DependsOn:
      - ConfigRecorder
      - DeliveryChannel
    Properties:
      Name: !Ref ConfigRecorder
      IsEnabled: true

  # ===== CONFIG RULES =====
  # Rule: Check if S3 buckets have encryption enabled
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-S3-Encryption'
      Description: 'Checks that S3 buckets have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
  
  # Rule: Check if S3 buckets have versioning enabled
  S3BucketVersioningRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-S3-Versioning'
      Description: 'Checks that S3 buckets have versioning enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_VERSIONING_ENABLED
  
  # Rule: Check if EC2 instances are in a VPC
  EC2InVPCRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-EC2-In-VPC'
      Description: 'Checks that EC2 instances are launched in a VPC'
      Source:
        Owner: AWS
        SourceIdentifier: EC2_INSTANCES_IN_VPC
  
  # Rule: Check if RDS instances have backup enabled
  RDSBackupEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-RDS-Backup-Enabled'
      Description: 'Checks that RDS instances have backup enabled with retention >= 7 days'
      Source:
        Owner: AWS
        SourceIdentifier: DB_INSTANCE_BACKUP_ENABLED
      InputParameters: |
        {
          "backupRetentionMinimum": "7"
        }
  
  # Rule: Check if RDS instances are encrypted
  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-RDS-Encryption'
      Description: 'Checks that RDS instances have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED
  
  # Rule: Check SSH access restrictions
  SSHRestrictedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-SSH-Restricted'
      Description: 'Checks that SSH access is restricted in security groups'
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
  
  # Rule: Check IAM users have MFA enabled
  IAMUserMFARule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-IAM-User-MFA'
      Description: 'Checks that IAM users have MFA enabled'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED
  
  # Rule: Check CloudTrail is enabled
  CloudTrailEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-CloudTrail-Enabled'
      Description: 'Checks that CloudTrail is enabled and logging'
      Source:
        Owner: AWS
        SourceIdentifier: CLOUD_TRAIL_ENABLED

# Outputs
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  
  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
  
  CloudTrailName:
    Description: 'CloudTrail Name'
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'
  
  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'
  
  ApplicationDataBucketName:
    Description: 'Application Data S3 Bucket Name'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppBucket'
  
  SecureAdminGroupName:
    Description: 'IAM Group Name for Secure Admins'
    Value: !Ref SecureAdminGroup
    Export:
      Name: !Sub '${AWS::StackName}-AdminGroup'
```

## Key Security Features Implemented

### 1. **Identity and Access Management (IAM)**
- **Principle of Least Privilege**: Each role has minimal required permissions
- **MFA Enforcement**: IAM group policy denies actions without MFA
- **Instance Profiles**: EC2 instances use IAM roles instead of access keys
- **AWS Managed Policies**: Using standard AWS policies where appropriate

### 2. **Network Security**
- **VPC Isolation**: Resources deployed in private subnets
- **Security Groups**: Restrictive ingress rules, SSH limited to specific IPs
- **NAT Gateways**: Private instances access internet through NAT
- **Multi-AZ**: Resources distributed across availability zones

### 3. **Data Protection**
- **Encryption at Rest**: All S3 buckets and RDS instances encrypted
- **S3 Versioning**: Enabled on all buckets
- **RDS Backups**: 7-day retention with automated backups
- **SSL/TLS**: HTTPS enforced on ALB with redirect

### 4. **Audit and Compliance**
- **CloudTrail**: Comprehensive audit logging of management events
- **AWS Config**: Continuous compliance monitoring with rules
- **CloudWatch Logs**: EC2 instance logging enabled
- **Log Validation**: CloudTrail log file validation enabled

### 5. **Access Controls**
- **S3 Bucket Policies**: IP-based restrictions
- **Public Access Block**: Enabled on all S3 buckets
- **Deletion Protection**: Enabled on critical resources

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Validate template syntax
   aws cloudformation validate-template \
     --template-body file://secure-infrastructure.yaml \
     --region us-east-1
   ```

2. **Create Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters \
       ParameterKey=AllowedSSHIP,ParameterValue=YOUR_IP_RANGE/32 \
       ParameterKey=AllowedS3AccessIP,ParameterValue=YOUR_IP_RANGE/32 \
       ParameterKey=DBUsername,ParameterValue=dbadmin \
       ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
       ParameterKey=DomainName,ParameterValue=yourdomain.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor Stack Creation**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-infrastructure \
     --region us-east-1 \
     --query 'Stacks[0].StackStatus'
   ```

## Post-Deployment Tasks

1. **Certificate Validation**: Complete DNS validation for ACM certificate
2. **Create IAM Users**: Add users to SecureAdminGroup
3. **Enable MFA**: Configure MFA for all IAM users
4. **Update Security Groups**: Adjust IP ranges as needed
5. **Review Config Rules**: Check compliance dashboard

## Compliance Verification

The template includes AWS Config rules that automatically check:
- ✅ S3 encryption and versioning
- ✅ EC2 instances in VPC
- ✅ RDS backup configuration
- ✅ SSH access restrictions
- ✅ IAM MFA enforcement
- ✅ CloudTrail logging

This template provides a robust, secure foundation that meets corporate compliance requirements while following AWS Well-Architected Framework best practices.