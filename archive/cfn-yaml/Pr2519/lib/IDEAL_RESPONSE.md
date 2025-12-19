# AWS Infrastructure Design

## Template Overview
- **Version**: 2010-09-09
- **Description**: Secure and highly available AWS infrastructure with comprehensive monitoring and compliance

## Parameters

### Environment Settings
```yaml
Environment:
  Type: String
  Default: "prod"
  AllowedValues:
    - "dev"
    - "staging"
    - "prod"
  Description: Environment name
```

### Access Configuration
```yaml
KeyPairName:
  Type: AWS::EC2::KeyPair::KeyName
  Description: EC2 Key Pair for SSH access

WhitelistedCIDR:
  Type: String
  Default: "10.0.0.0/16"
  Description: CIDR block for SSH access whitelist
  AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
```

### Database Configuration
```yaml
DBUsername:
  Type: String
  Default: "admin"
  MinLength: 1
  MaxLength: 16
  AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
  Description: Database admin username

DBPassword:
  Type: String
  NoEcho: true
  MinLength: 8
  MaxLength: 41
  AllowedPattern: "[a-zA-Z0-9]*"
  Description: Database admin password
```

## Region Configuration
| Region    | AMI ID                | Description        |
|-----------|----------------------|-------------------|
| us-east-1 | ami-0c02fb55956c7d316 | Amazon Linux 2 AMI |

## Resource Configuration

### Network Infrastructure

#### VPC Configuration
```yaml
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsHostnames: true
    EnableDnsSupport: true
    Tags:
      - Key: Name
        Value: ${Environment}-vpc
```

#### Internet Gateway
```yaml
InternetGateway:
  Type: AWS::EC2::InternetGateway
  Properties:
    Tags:
      - Key: Name
        Value: ${Environment}-igw

VPCGatewayAttachment:
  Type: AWS::EC2::VPCGatewayAttachment
  Properties:
    VpcId: !Ref VPC
    InternetGatewayId: !Ref InternetGateway
```

### Subnet Configuration

#### Public Subnets
1. **Public Subnet 1**
```yaml
PublicSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.1.0/24
    AvailabilityZone: !Select [0, !GetAZs ""]
    MapPublicIpOnLaunch: true
    Tags:
      - Key: Name
        Value: ${Environment}-public-subnet-1
```

2. **Public Subnet 2**
```yaml
PublicSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.2.0/24
    AvailabilityZone: !Select [1, !GetAZs ""]
    MapPublicIpOnLaunch: true
    Tags:
      - Key: Name
        Value: ${Environment}-public-subnet-2
```

#### Private Subnets
1. **Private Subnet 1**
```yaml
PrivateSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.3.0/24
    AvailabilityZone: !Select [0, !GetAZs ""]
    Tags:
```
        - Key: Name
          Value: !Sub ${Environment}-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-private-subnet-2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
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

  # KMS Keys
  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "KMS Key for EBS encryption"
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow use of the key for EBS
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: "*"
      Tags:
        - Key: Name
### Encryption Configuration

#### KMS Keys
1. **EBS KMS Key**
   - Purpose: EBS volume encryption
   - Key rotation: Enabled
   - Tags: ${Environment}-ebs-kms-key

2. **RDS KMS Key**
```yaml
RDSKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: "KMS Key for RDS encryption"
    EnableKeyRotation: true
    KeyPolicy:
      Version: "2012-10-17"
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
        - Sid: Allow use of the key for RDS
          Effect: Allow
          Principal:
            Service: rds.amazonaws.com
          Action:
            - kms:Decrypt
            - kms:GenerateDataKey
          Resource: "*"
```

### Security Groups

#### Bastion Host Security Group
```yaml
BastionSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for bastion hosts
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: !Ref WhitelistedCIDR
    Tags:
      - Key: Name
        Value: ${Environment}-bastion-sg
```

#### Web Server Security Group
```yaml
WebServerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for web servers
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
    Tags:
      - Key: Name
        Value: ${Environment}-webserver-sg
```

  ### Database Infrastructure

#### RDS Security Group
```yaml
RDSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for RDS instance
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        SourceSecurityGroupId: !Ref WebServerSecurityGroup
    Tags:
      - Key: Name
        Value: ${Environment}-rds-sg
```

#### Database Subnet Group
```yaml
DBSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupDescription: Subnet group for RDS instance
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
```

#### RDS Instance Configuration
```yaml
RDSInstance:
  Type: AWS::RDS::DBInstance
  Properties:
    DBName: ${Environment}database
    Engine: mysql
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Ref DBPassword
    DBInstanceClass: db.t3.medium
    AllocatedStorage: "20"
    StorageType: gp2
    MultiAZ: true
    PubliclyAccessible: false
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    BackupRetentionPeriod: 7
    StorageEncrypted: true
    KmsKeyId: !GetAtt RDSKMSKey.Arn
    Tags:
      - Key: Name
        Value: ${Environment}-rds
```

  ### Storage Configuration

#### S3 Buckets

##### Logging Bucket
```yaml
LoggingBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  Properties:
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
        Value: ${Environment}-logging-bucket
```

##### RDS Backup Bucket
```yaml
RDSBackupBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    LoggingConfiguration:
      DestinationBucketName: !Ref LoggingBucket
      LogFilePrefix: rds-backup-logs/
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    VersioningConfiguration:
      Status: Enabled
    Tags:
      - Key: Name
        Value: ${Environment}-rds-backup-bucket
```

  ### Monitoring and Compliance

#### CloudWatch Alarms
```yaml
CPUUtilizationAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: Alarm if CPU utilization exceeds 75%
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    ThresholdMetricId: e1
    ComparisonOperator: GreaterThanThreshold
    Threshold: 75
    AlarmActions:
      - !Ref AlarmTopic
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref RDSInstance
```

#### SNS Topic for Notifications
```yaml
AlarmTopic:
  Type: AWS::SNS::Topic
  Properties:
    DisplayName: ${Environment}-infrastructure-alarms
    TopicName: ${Environment}-infrastructure-alarms
```

#### AWS Config Setup

##### Configuration Recorder
```yaml
ConfigRecorder:
  Type: AWS::Config::ConfigurationRecorder
  Properties:
    RoleARN: !GetAtt ConfigRole.Arn
    RecordingGroup:
      AllSupported: true
      IncludeGlobalResources: true
```

##### Config IAM Role
```yaml
ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSConfigRole
```

## Stack Outputs

### Network Outputs
| Output | Description | Export Name |
|--------|-------------|-------------|
| VPCId | VPC ID | ${AWS::StackName}-VPCId |
| PublicSubnet1Id | Public Subnet 1 ID | ${AWS::StackName}-PublicSubnet1Id |
| PublicSubnet2Id | Public Subnet 2 ID | ${AWS::StackName}-PublicSubnet2Id |
| PrivateSubnet1Id | Private Subnet 1 ID | ${AWS::StackName}-PrivateSubnet1Id |
| PrivateSubnet2Id | Private Subnet 2 ID | ${AWS::StackName}-PrivateSubnet2Id |

### Resource Endpoints
| Output | Description |
|--------|-------------|
| RDSEndpoint | RDS Instance Endpoint |
| LoggingBucketName | Name of the Logging Bucket |
| RDSBackupBucketName | Name of the RDS Backup Bucket |

## Security Features
1. **Data Encryption**
   - EBS volumes encrypted with KMS
   - RDS storage encrypted with dedicated KMS key
   - S3 buckets using AES-256 encryption

2. **Network Security**
   - VPC with public and private subnets
   - Restricted SSH access via security groups
   - Private subnets for sensitive resources

3. **Monitoring & Compliance**
   - CloudWatch alarms for performance monitoring
   - AWS Config for resource compliance
   - Comprehensive logging enabled

4. **Access Control**
   - IAM roles with least privilege
   - Security group restrictions
   - No public database access

5. **High Availability**
   - Multi-AZ RDS deployment
   - Resources distributed across AZs
   - Redundant subnet configuration
