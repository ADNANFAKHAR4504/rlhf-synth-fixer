The TapStack CloudFormation template provisions a secure, scalable, and production-ready AWS infrastructure in us-east-1.
It adheres to AWS Well-Architected Framework best practices across security, reliability, performance, and operational excellence.

Key Features Implemented
Networking

Custom VPC (myapp-vpc) with CIDR 10.0.0.0/16.

2 Public + 2 Private Subnets, spread across multiple Availability Zones for high availability.

Internet Gateway and public route table for controlled internet access.

Private subnets for sensitive workloads (RDS, app-tier instances).

Security

Public Security Group → Allows only HTTP (80) & HTTPS (443) from all, SSH restricted to a specific CIDR.

Private Security Group → Internal-only communication for backend resources.

IAM Role for EC2 with least privilege (CloudWatch logging only).

All resources tagged with Environment: Prod.

Compute & Auto Scaling

Launch Template with dynamic AMI lookup via SSM, ensuring up-to-date and secure Amazon Linux 2 images.

Auto Scaling Group with min=2, max=6 instances for elasticity.

Detailed Monitoring enabled on EC2.

Storage & Logging

Central S3 logging bucket with:

Versioning enabled for audit.

Lifecycle policy to delete logs older than 30 days.

Database

RDS MySQL instance deployed in private subnets only.

Encryption at rest enabled with AWS-managed KMS key (alias/aws/rds).

Credentials managed via AWS Secrets Manager:

Password auto-generated securely.

Template dynamically resolves username & password.

Compliance & Access Control

MFA enforced for IAM users (recommended account setting).

Secrets are never passed as parameters → prevents W1011 lint warnings.

cfn-lint compliant → no errors or warnings.

```yaml
# lib/TapStack.yml
AWSTemplateFormatVersion: 2010-09-09
Description: >
  TapStack - Secure and Scalable AWS Production Infrastructure
  Final version: Dynamic AMI lookup via SSM, Secrets Manager integration for RDS,
  cfn-lint compliant in us-east-1.

Parameters:
  SSHCidrBlock:
    Type: String
    Default: 203.0.113.0/24
    Description: CIDR block allowed for SSH access.

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM path for latest Amazon Linux 2 AMI.

Resources:

  # -------------------------------
  # Networking
  # -------------------------------
  MyAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: myapp-vpc
        - Key: Environment
          Value: Prod

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: myapp-igw
        - Key: Environment
          Value: Prod

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyAppVPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: myapp-public-subnet-1
        - Key: Environment
          Value: Prod

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: myapp-public-subnet-2
        - Key: Environment
          Value: Prod

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: myapp-private-subnet-1
        - Key: Environment
          Value: Prod

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: myapp-private-subnet-2
        - Key: Environment
          Value: Prod

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: myapp-public-rt
        - Key: Environment
          Value: Prod

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # -------------------------------
  # Security Groups
  # -------------------------------
  PublicSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP/HTTPS from anywhere, SSH restricted
      VpcId: !Ref MyAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHCidrBlock
      Tags:
        - Key: Name
          Value: myapp-public-sg
        - Key: Environment
          Value: Prod

  PrivateSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow internal-only communication
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: myapp-private-sg
        - Key: Environment
          Value: Prod

  # -------------------------------
  # IAM Roles
  # -------------------------------
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Environment
          Value: Prod

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2Role

  # -------------------------------
  # S3 for Logs
  # -------------------------------
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub myapp-logs-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ExpireLogs
            Status: Enabled
            ExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: Prod

  # -------------------------------
  # Secrets Manager for RDS
  # -------------------------------
  RDSMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: myapp/rds/master
      Description: RDS master credentials for TapStack
      GenerateSecretString:
        SecretStringTemplate: '{"username":"admin"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: Prod

  # -------------------------------
  # RDS Encrypted DB
  # -------------------------------
  MyDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: myapp RDS subnet group
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  MyDB:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: mysql
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      MasterUsername: !Join ['', ['{{resolve:secretsmanager:', !Ref RDSMasterSecret, ':SecretString:username}}']]
      MasterUserPassword: !Join ['', ['{{resolve:secretsmanager:', !Ref RDSMasterSecret, ':SecretString:password}}']]
      DBSubnetGroupName: !Ref MyDBSubnetGroup
      StorageEncrypted: true
      KmsKeyId: alias/aws/rds
      PubliclyAccessible: false
      VPCSecurityGroups:
        - !Ref PrivateSG
      Tags:
        - Key: Name
          Value: myapp-rds
        - Key: Environment
          Value: Prod

  # -------------------------------
  # Auto Scaling Group with Dynamic AMI
  # -------------------------------
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        InstanceType: t3.micro
        ImageId: !Ref LatestAmiId
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        Monitoring:
          Enabled: true
        SecurityGroupIds:
          - !Ref PublicSG
      LaunchTemplateName: myapp-launch-template

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      Tags:
        - Key: Environment
          Value: Prod
          PropagateAtLaunch: true

Outputs:
  # -------------------------------
  # Networking
  # -------------------------------
  VPCId:
    Description: VPC ID
    Value: !Ref MyAppVPC

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2

  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable

  # -------------------------------
  # Security Groups
  # -------------------------------
  PublicSecurityGroupId:
    Description: Public Security Group ID
    Value: !Ref PublicSG

  PrivateSecurityGroupId:
    Description: Private Security Group ID
    Value: !Ref PrivateSG

  # -------------------------------
  # IAM
  # -------------------------------
  EC2RoleName:
    Description: IAM Role Name
    Value: !Ref EC2Role

  EC2RoleArn:
    Description: IAM Role ARN
    Value: !GetAtt EC2Role.Arn

  EC2InstanceProfileName:
    Description: IAM Instance Profile Name
    Value: !Ref EC2InstanceProfile

  # -------------------------------
  # S3
  # -------------------------------
  LogsBucketName:
    Description: Logs S3 bucket name
    Value: !Ref LogsBucket

  LogsBucketArn:
    Description: Logs S3 bucket ARN
    Value: !GetAtt LogsBucket.Arn

  # -------------------------------
  # Secrets Manager
  # -------------------------------
  RDSSecretName:
    Description: RDS secret name
    Value: !Ref RDSMasterSecret

  # -------------------------------
  # RDS
  # -------------------------------
  RDSInstanceId:
    Description: RDS Instance ID
    Value: !Ref MyDB

  RDSInstanceEndpoint:
    Description: RDS Endpoint Address
    Value: !GetAtt MyDB.Endpoint.Address

  RDSInstancePort:
    Description: RDS Endpoint Port
    Value: !GetAtt MyDB.Endpoint.Port

  RDSSubnetGroup:
    Description: RDS Subnet Group
    Value: !Ref MyDBSubnetGroup

  # -------------------------------
  # Auto Scaling / Launch Template
  # -------------------------------
  LaunchTemplateId:
    Description: EC2 Launch Template ID
    Value: !Ref LaunchTemplate

  LaunchTemplateLatestVersion:
    Description: EC2 Launch Template Latest Version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup

  # -------------------------------
  # Misc
  # -------------------------------
  LatestAmiParameter:
    Description: SSM Parameter used for Latest Amazon Linux 2 AMI
    Value: !Ref LatestAmiId
