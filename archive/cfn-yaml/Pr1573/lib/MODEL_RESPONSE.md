I'll help you create a production-ready AWS infrastructure using CloudFormation templates. I'll break this down into modular templates that follow AWS best practices.

## Architecture Overview

Before diving into the templates, let me explain the architecture design decisions:

1. **Modular Approach**: I'll create separate templates for networking, security, compute, and storage components
2. **Network Isolation**: VPC with public/private subnets across multiple AZs
3. **Security**: Principle of least privilege with proper IAM roles and security groups
4. **High Availability**: Resources distributed across multiple AZs
5. **Monitoring**: Comprehensive CloudWatch and CloudTrail setup

## Template Structure

I'll provide you with the following templates:

1. **Master Template** - Orchestrates all components
2. **Network Template** - VPC, subnets, routing
3. **Security Template** - IAM roles, security groups, key pairs
4. **Compute Template** - EC2 instances, Auto Scaling Group, Load Balancer
5. **Storage Template** - S3 bucket, DynamoDB table
6. **Monitoring Template** - CloudWatch, CloudTrail

---

## 1. Master Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Master template for scalable web application infrastructure'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'

  Department:
    Type: String
    Default: 'engineering'
    Description: 'Department name for resource tagging'

  KeyPairName:
    Type: String
    Description: 'Name of existing EC2 Key Pair for SSH access'

  TemplatesBucketName:
    Type: String
    Description: 'S3 bucket containing nested CloudFormation templates'

Resources:
  # Network Infrastructure
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucketName}.s3.amazonaws.com/network.yaml'
      Parameters:
        Environment: !Ref Environment
        Department: !Ref Department
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Security Components
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucketName}.s3.amazonaws.com/security.yaml'
      Parameters:
        Environment: !Ref Environment
        Department: !Ref Department
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        KeyPairName: !Ref KeyPairName
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Storage Components
  StorageStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: SecurityStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucketName}.s3.amazonaws.com/storage.yaml'
      Parameters:
        Environment: !Ref Environment
        Department: !Ref Department
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Compute Infrastructure
  ComputeStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: [NetworkStack, SecurityStack, StorageStack]
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucketName}.s3.amazonaws.com/compute.yaml'
      Parameters:
        Environment: !Ref Environment
        Department: !Ref Department
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        PublicSubnet1Id: !GetAtt NetworkStack.Outputs.PublicSubnet1Id
        PublicSubnet2Id: !GetAtt NetworkStack.Outputs.PublicSubnet2Id
        PrivateSubnet1Id: !GetAtt NetworkStack.Outputs.PrivateSubnet1Id
        PrivateSubnet2Id: !GetAtt NetworkStack.Outputs.PrivateSubnet2Id
        WebServerSecurityGroupId: !GetAtt SecurityStack.Outputs.WebServerSecurityGroupId
        LoadBalancerSecurityGroupId: !GetAtt SecurityStack.Outputs.LoadBalancerSecurityGroupId
        EC2InstanceProfile: !GetAtt SecurityStack.Outputs.EC2InstanceProfile
        KeyPairName: !Ref KeyPairName
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Monitoring Components
  MonitoringStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: ComputeStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucketName}.s3.amazonaws.com/monitoring.yaml'
      Parameters:
        Environment: !Ref Environment
        Department: !Ref Department
        AutoScalingGroupName: !GetAtt ComputeStack.Outputs.AutoScalingGroupName
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ComputeStack.Outputs.LoadBalancerDNS
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  S3BucketName:
    Description: 'Name of the S3 bucket for application assets'
    Value: !GetAtt StorageStack.Outputs.S3BucketName
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'
```

---

## 2. Network Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Network infrastructure - VPC, subnets, routing, and NAT gateway'

Parameters:
  Environment:
    Type: String
    Description: 'Environment name'

  Department:
    Type: String
    Description: 'Department name for resource tagging'

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

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
          Value: !Sub '${Environment}-${Department}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.4.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # NAT Gateway for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-public-routes'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-private-routes-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

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

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'
```

---

## 3. Security Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security components - IAM roles, security groups, and key pairs'

Parameters:
  Environment:
    Type: String
    Description: 'Environment name'

  Department:
    Type: String
    Description: 'Department name for resource tagging'

  VpcId:
    Type: String
    Description: 'VPC ID for security groups'

  KeyPairName:
    Type: String
    Description: 'Name of existing EC2 Key Pair'

Resources:
  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-${Department}-ec2-role'
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
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${Environment}-${Department}-app-assets-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::${Environment}-${Department}-app-assets-${AWS::AccountId}/*'
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${Environment}-${Department}-app-state'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-${Department}-ec2-instance-profile'
      Roles:
        - !Ref EC2Role

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-${Department}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP traffic from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-alb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-${Department}-web-server-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from load balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from bastion host'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-web-server-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-${Department}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'SSH access from internet (restrict to your IP in production)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-bastion-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # KMS Key for encryption
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} ${Department} application encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-app-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-${Department}-app-key'
      TargetKeyId: !Ref ApplicationKMSKey

Outputs:
  EC2InstanceProfile:
    Description: 'EC2 Instance Profile ARN'
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfile'

  WebServerSecurityGroupId:
    Description: 'Web Server Security Group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServerSecurityGroupId'

  LoadBalancerSecurityGroupId:
    Description: 'Load Balancer Security Group ID'
    Value: !Ref LoadBalancerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerSecurityGroupId'

  BastionSecurityGroupId:
    Description: 'Bastion Security Group ID'
    Value: !Ref BastionSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-BastionSecurityGroupId'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref ApplicationKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt ApplicationKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
```

---

## 4. Storage Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Storage components - S3 bucket and DynamoDB table'

Parameters:
  Environment:
    Type: String
    Description: 'Environment name'

  Department:
    Type: String
    Description: 'Department name for resource tagging'

Resources:
  # S3 Bucket for application assets
  ApplicationAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-${Department}-app-assets-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Sub 'alias/${Environment}-${Department}-app-key'
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
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Sub '/aws/s3/${Environment}-${Department}-app-assets'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-app-assets'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # S3 Bucket Policy
  ApplicationAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationAssetsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ApplicationAssetsBucket}/*'
              - !Sub '${ApplicationAssetsBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # DynamoDB Table for application state
  ApplicationStateTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-${Department}-app-state'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Sub 'alias/${Environment}-${Department}-app-key'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      BackupPolicy:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-${Department}-app-state'
        - Key: Environment
          Value: !Ref Environment
        - Key: Department
          Value: !Ref Department

  # DynamoDB Backup Vault (for on-demand backups)
  DynamoDBBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${Environment}-${Department}-dynamodb-backup-vault'
      EncryptionKeyArn: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/${Environment}-${Department}-app-key'
      BackupVaultTags:
        Environment: !Ref Environment
        Department: !Ref Department

  # Backup Plan for DynamoDB
  DynamoDBBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${Environment}-${Department}-dynamodb-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref DynamoDBBackupVault
            ScheduleExpression: 'cron(0 2 ? * * *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
              MoveToColdStorageAfterDays: 7
      BackupPlanTags:
        Environment: !Ref Environment
        Department: !Ref Department

  # IAM Role for AWS Backup
  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-${Department}-backup-role'
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
  DynamoDBBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref DynamoDBBackupPlan
      BackupSelection:
        SelectionName: !Sub '${Environment}-${Department}-dynamodb-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !GetAtt ApplicationStateTable.Arn

Outputs:
  S3BucketName:
    Description: 'S3 Bucket Name for application assets'
    Value: !Ref ApplicationAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3BucketArn:
    Description: 'S3 Bucket ARN'
    Value: !GetAtt ApplicationAssetsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref ApplicationStateTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  DynamoDBTableArn:
    Description: 'DynamoDB Table ARN'
    Value: !GetAtt ApplicationStateTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'
```

---

## 5. Compute Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Compute infrastructure - EC2 instances, Auto Scaling Group, and Load Balancer'

Parameters:
  Environment:
    Type: String
    Description: 'Environment name'

  Department:
    Type: String
    Description: 'Department name for resource tagging'

  VpcId:
    Type: String
    Description: 'VPC ID'

  PublicSubnet1Id:
    Type: String
    Description: 'Public Subnet 1 ID'

  PublicSubnet2Id:
    Type: String
    Description: 'Public Subnet 2 ID'

  PrivateSubnet1Id:
    Type: String
    Description: 'Private Subnet 1 ID'

  PrivateSubnet2Id:
    Type: String
    Description: 'Private Subnet 2 ID'

  WebServerSecurityGroupId:
    Type: String
    Description: 'Web Server Security Group ID'

  LoadBalancerSecurityGroupId:
    Type: String
    Description: 'Load Balancer Security Group ID'

  EC2InstanceProfile:
    Type: String
    Description: 'EC2 Instance Profile'

  KeyPairName:
    Type: String
    Description: 'EC2 Key Pair name'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI

Resources:
  # Launch Template
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-${Department}-web-server-template'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        KeyName: !Ref Key
```
