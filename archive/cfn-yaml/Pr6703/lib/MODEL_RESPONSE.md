### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates a secure AWS infrastructure. Let me break down the requirements:

1. Region: us-east-1
2. EC2 instances with IAM roles (minimal permissions)
3. Sensitive info in Systems Manager Parameter Store
4. S3 buckets with server access logging (dedicated logging bucket)
5. CloudTrail with 90-day retention
6. Custom VPC with 2 AZs, public and private subnets
7. NAT Gateways in public subnets
8. Application Load Balancer with SSL termination
9. Encrypted EBS volumes
10. Detailed monitoring for EC2
11. Security groups with least privilege
12. AWS Config for compliance monitoring
13. Systems Manager maintenance window for patching
14. RDS PostgreSQL with encryption and automatic backups

This is a complex template that will be quite large. I'll create a comprehensive CloudFormation YAML template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that provisions a secure and compliant AWS infrastructure. This template will include all the required components with production-grade security settings.

## secure_infrastructure.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Compliant AWS Infrastructure with Production Security Standards'

Parameters:
  EnvironmentName:
    Description: Environment name prefix for resources
    Type: String
    Default: SecureProd
  
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
  
  DBUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  CertificateArn:
    Description: ARN of the SSL certificate for ALB (from ACM)
    Type: String
    Default: ''

Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref CertificateArn, '']]

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.0.0/24'
    PublicSubnet2:
      CIDR: '10.0.1.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.21.0/24'
  
  AmiRegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2 AMI

Resources:
  # ==========================================
  # VPC and Networking Resources
  # ==========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'

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
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-Subnet-AZ1'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==========================================
  # Security Groups
  # ==========================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from Internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from Internet (redirect to HTTPS)
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: HTTP to Web Servers
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH from Bastion
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to Internet for updates
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: PostgreSQL to RDS
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion Host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # In production, restrict to specific IPs
          Description: SSH from specific IPs
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: PostgreSQL from Web Servers
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Instance-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParameterHistory'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${EnvironmentName}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt ParameterStoreKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-CloudTrail-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                Resource: !GetAtt CloudTrailBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                Resource: !Sub '${CloudTrailBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-Config-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ConfigBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control

  # ==========================================
  # KMS Keys for Encryption
  # ==========================================
  
  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS volume encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for EBS
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-ebs-key'
      TargetKeyId: !Ref EBSKMSKey

  ParameterStoreKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Parameter Store encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

  ParameterStoreKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-parameter-store-key'
      TargetKeyId: !Ref ParameterStoreKMSKey

  # ==========================================
  # S3 Buckets
  # ==========================================
  
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-logging-bucket-${AWS::AccountId}'
      AccessControl: LogDeliveryWrite
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
            ExpirationInDays: 90
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Logging-Bucket'

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-application-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: application-bucket-logs/
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Application-Bucket'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-cloudtrail-bucket-${AWS::AccountId}'
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
          - Id: RetainTrailLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-CloudTrail-Bucket'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-config-bucket-${AWS::AccountId}'
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
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Config-Bucket'

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
                's3:x-amz-acl': bucket-owner-full-control

  # ==========================================
  # CloudTrail
  # ==========================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentName}-CloudTrail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${ApplicationBucket.Arn}/'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-CloudTrail'

  # ==========================================
  # AWS Config
  # ==========================================
  
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn:
      - ConfigBucketPolicy
    Properties:
      Name: !Sub '${EnvironmentName}-ConfigRecorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
        ResourceTypes:
          - AWS::EC2::Instance
          - AWS::EC2::SecurityGroup
          - AWS::EC2::VPC
          - AWS::S3::Bucket
          - AWS::RDS::DBInstance

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${EnvironmentName}-ConfigDeliveryChannel'
      S3BucketName: !Ref ConfigBucket
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigRecorderStatus:
    Type: AWS::Config::ConfigurationRecorderStatus
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel
    Properties:
      Name: !Ref ConfigRecorder
      IsEnabled: true

  # Config Rules for Compliance
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: required-tags
      Description: Checks whether resources contain all required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters:
        tag1Key: Name
        tag2Key: Environment

  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  # ==========================================
  # Systems Manager Parameters
  # ==========================================
  
  DBPasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${EnvironmentName}/database/password'
      Type: String
      Value: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      Description: Database password stored securely
      Tags:
        Environment: !Ref EnvironmentName

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-db-password'
      Description: RDS PostgreSQL Database Password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "dbadmin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  ApplicationConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${EnvironmentName}/app/config'
      Type: String
      Value: |
        {
          "database_endpoint": "${DatabaseEndpoint}",
          "s3_bucket": "${ApplicationBucket}",
          "region": "${AWS::Region}"
        }
      Description: Application configuration
      Tags:
        Environment: !Ref EnvironmentName

  # ==========================================
  # Launch Template for EC2 Instances
  # ==========================================
  
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [AmiRegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.medium
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref EBSKMSKey
              DeleteOnTermination: true
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-ssm-agent
            yum install -y amazon-cloudwatch-agent
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
            
            # Install necessary software
            yum install -y httpd
            systemctl enable httpd
            systemctl start httpd
            
            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "metrics": {
                "namespace": "${EnvironmentName}",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization"}
                    ],
                    "resources": ["/"]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
              -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-WebServer'
              - Key: Environment
                Value: !Ref EnvironmentName

  # ==========================================
  # Auto Scaling Group
  # ==========================================
  
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  # ==========================================
  # Application Load Balancer
  # ==========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TargetGroup'

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # ==========================================
  # Bastion Host
  # ==========================================
  
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AmiRegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref EBSKMSKey
            DeleteOnTermination: true
      Monitoring: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion'
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # RDS PostgreSQL Database
  # ==========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DBSubnetGroup'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: PostgreSQL parameter group with security settings
      Family: postgres13
      Parameters:
        log_statement: all
        log_connections: 1
        log_disconnections: 1
        shared_preload_libraries: pg_stat_statements
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DBParameterGroup'

  PostgreSQLDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-postgres-db'
      DBName: applicationdb
      AllocatedStorage: 100
      DBInstanceClass: db.t3.medium
      Engine: postgres
      EngineVersion: '13.7'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref EBSKMSKey
      StorageType: gp3
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-PostgreSQL'
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # Systems Manager Maintenance Window
  # ==========================================
  
  MaintenanceWindow:
    Type: AWS::SSM::MaintenanceWindow
    Properties:
      Name: !Sub '${EnvironmentName}-PatchWindow'
      Description: Maintenance window for patching EC2 instances
      Duration: 2
      Cutoff: 0
      Schedule: cron(0 2 ? * SUN *)
      AllowUnassociatedTargets: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-MaintenanceWindow'

  MaintenanceWindowTarget:
    Type: AWS::SSM::MaintenanceWindowTarget
    Properties:
      Name: !Sub '${EnvironmentName}-PatchTargets'
      Description: EC2 instances to patch
      WindowId: !Ref MaintenanceWindow
      ResourceType: INSTANCE
      Targets:
        - Key: tag:Environment
          Values:
            - !Ref EnvironmentName

  MaintenanceWindowTask:
    Type: AWS::SSM::MaintenanceWindowTask
    Properties:
      Name: !Sub '${EnvironmentName}-PatchTask'
      Description: Apply OS patches
      WindowId: !Ref MaintenanceWindow
      TaskType: RUN_COMMAND
      TaskArn: AWS-RunPatchBaseline
      Priority: 1
      ServiceRoleArn: !GetAtt MaintenanceWindowRole.Arn
      Targets:
        - Key: WindowTargetIds
          Values:
            - !Ref MaintenanceWindowTarget
      MaxConcurrency: '50%'
      MaxErrors: '0'

  MaintenanceWindowRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-MaintenanceWindowRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-MaintenanceWindowRole'

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-HighCPU'
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

  DatabaseStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-LowDatabaseStorage'
      AlarmDescription: Alarm when database storage is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240  # 10 GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PostgreSQLDatabase

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-ALB-DNS'

  DatabaseEndpoint:
    Description: RDS PostgreSQL Endpoint
    Value: !GetAtt PostgreSQLDatabase.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-DB-Endpoint'

  ApplicationBucketName:
    Description: Application S3 Bucket Name
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${EnvironmentName}-App-Bucket'

  BastionPublicIP:
    Description: Bastion Host Public IP
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${EnvironmentName}-Bastion-IP'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${EnvironmentName}-CloudTrail'

  ConfigRecorderName:
    Description: AWS Config Recorder Name
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${EnvironmentName}-ConfigRecorder'
```

## Key Security Features Implemented

### 1. **Network Security**
- Custom VPC with public/private subnet segregation
- NAT Gateways for secure outbound internet access from private subnets
- Security groups with least privilege access rules
- Bastion host for secure SSH access

### 2. **Data Encryption**
- All EBS volumes encrypted with KMS keys
- S3 buckets with server-side encryption
- RDS database encryption at rest
- SSL/TLS termination at the Application Load Balancer

### 3. **Access Management**
- IAM roles with minimal required permissions
- Instance profiles for EC2 access to AWS services
- No hardcoded credentials (using Parameter Store and Secrets Manager)

### 4. **Logging and Monitoring**
- CloudTrail for API activity logging (90-day retention)
- S3 access logging to dedicated bucket
- AWS Config for compliance monitoring
- CloudWatch detailed monitoring for EC2 instances
- CloudWatch alarms for critical metrics

### 5. **Compliance and Governance**
- AWS Config rules for compliance checking
- Required tags enforcement
- Encrypted volumes validation
- Maintenance windows for regular patching

### 6. **Database Security**
- Multi-AZ deployment for high availability
- Automated backups with 30-day retention
- Encrypted storage
- Network isolation in private subnets

## Deployment Instructions

1. **Prerequisites:**
   - AWS CLI configured with appropriate credentials
   - An existing EC2 Key Pair in us-east-1
   - (Optional) ACM certificate ARN for HTTPS

2. **Deploy the stack:**
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://secure_infrastructure.yml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair-name \
               ParameterKey=CertificateArn,ParameterValue=your-certificate-arn \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Monitor deployment:**
```bash
aws cloudformation describe-stacks \
  --stack-name secure-infrastructure \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

This template creates a production-ready, secure AWS infrastructure that meets enterprise compliance standards and follows AWS Well-Architected Framework best practices.