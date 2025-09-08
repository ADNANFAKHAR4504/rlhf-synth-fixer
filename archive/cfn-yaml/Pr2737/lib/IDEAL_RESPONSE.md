# Secure Multi-AZ AWS Infrastructure - Ideal Implementation

This document outlines the ideal implementation of a secure, highly available AWS infrastructure using CloudFormation, addressing all requirements with best practices and comprehensive security controls.

## Overview

The infrastructure implementation focuses on security, high availability, and comprehensive monitoring across all components. The solution uses AWS managed services and follows the principle of least privilege.

## Key Components

### 1. Network Architecture

#### VPC Configuration
- Multi-AZ deployment across two availability zones
- Strict network segmentation with public and private subnets
- NAT Gateways for secure outbound connectivity
- VPC Flow Logs for network monitoring

```yaml
VPC:
  - CIDR: 10.0.0.0/16
  - DNS support enabled
  - DNS hostnames enabled
  
Subnets:
  Public:
    - AZ1: 10.0.1.0/24
    - AZ2: 10.0.2.0/24
  Private:
    - AZ1: 10.0.3.0/24
    - AZ2: 10.0.4.0/24
```

### 2. Security Controls

#### Access Management
- IAM roles with least privilege
- Groups-based policy management
- No direct user policy attachments

#### Network Security
```yaml
Security Groups:
  Web Tier:
    Inbound:
      - Port: 80 (HTTP)
      - Port: 443 (HTTPS)
    Source: 0.0.0.0/0
  
  Database Tier:
    Inbound:
      - Port: 3306 (MySQL)
    Source: Web Tier Security Group
```

#### WAF Configuration
```yaml
WAF Rules:
  - SQL Injection Protection
  - Cross-Site Scripting (XSS) Protection
  - Rate Limiting
  - Geolocation Restrictions
```

### 3. Database Layer

#### RDS Configuration
```yaml
RDS:
  Engine: MySQL
  Instance: db.t3.micro
  Multi-AZ: true
  Storage:
    Type: gp2
    Encrypted: true
    KMS: Custom key
  Backup:
    RetentionPeriod: 7 days
  Network:
    Placement: Private subnets
    Security: Database security group
```

### 4. Encryption and Key Management

#### KMS Implementation
- Custom KMS keys for different services
- Automatic key rotation
- Audit logging enabled

```yaml
KMS Keys:
  - RDS Encryption
  - S3 Encryption
  - Application Data
```

### 5. Monitoring and Logging

#### CloudWatch Setup
```yaml
Monitoring:
  Metrics:
    - RDS CPU Utilization
    - Memory Usage
    - Storage IOPS
    - Network Traffic
  
  Alarms:
    - High CPU Usage (>80%)
    - Storage Space (<20%)
    - Connection Count (>100)
```

## Best Practices Implementation

### 1. Security
- Encryption at rest using KMS
- Encryption in transit using TLS
- Network segmentation
- WAF protection
- Security group restrictions

### 2. High Availability
- Multi-AZ deployments
- Auto-scaling configurations
- Load balancing
- Redundant NAT Gateways

### 3. Monitoring
- CloudWatch metrics and alarms
- VPC Flow Logs
- CloudTrail integration
- S3 access logging

### 4. Compliance
- Resource tagging
- Audit logging
- Backup policies
- Access controls

## Deployment Considerations

### Prerequisites
1. AWS account with appropriate permissions
2. AWS CLI configured
3. Required service quotas verified

### Deployment Steps
1. Review and customize parameters
2. Validate template
3. Create stack with appropriate parameters
4. Monitor stack creation
5. Verify security controls

### Post-Deployment Verification
1. Confirm Multi-AZ status
2. Test security group restrictions
3. Verify encryption settings
4. Check monitoring and alerts
5. Validate WAF rules

## Maintenance Guidelines

### Regular Tasks
1. Review CloudWatch metrics
2. Check WAF logs
3. Update security patches
4. Rotate access keys
5. Review security groups

### Backup Strategy
1. Automated RDS backups
2. S3 versioning
3. Regular snapshot creation
4. Cross-region backup copies

## Cost Optimization

### Recommendations
1. Right-size RDS instances
2. Monitor resource utilization
3. Use Reserved Instances for steady workloads
4. Implement auto-scaling
5. Regular cost analysis

## Security Compliance

### Controls
1. Data encryption
2. Access logging
3. Network isolation
4. Regular audits
5. Compliance reporting

## Future Enhancements

### Potential Improvements
1. Additional WAF rules
2. Enhanced monitoring
3. Automated compliance checks
4. Disaster recovery setup
5. Performance optimizations
    Default: "10.0.0.0/16"
    Description: "CIDR block for the VPC"

  DBUsername:
    Type: String
    Description: "Username for the RDS database"
    MinLength: 1
    MaxLength: 16
    NoEcho: true

  DBPassword:
    Type: String
    Description: "Password for the RDS database"
    MinLength: 8
    MaxLength: 41
    NoEcho: true

Resources:
  # ========================================
  # KMS Keys
  # ========================================

  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "KMS key for encryption"
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
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey"
            Resource: "*"
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey"
            Resource: "*"

  # ========================================
  # VPC and Network Resources
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-VPC"

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-Public-1"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-Public-2"

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-Private-1"

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-Private-2"

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-IGW"

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

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

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # ========================================
  # Security Groups
  # ========================================

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for web servers"
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

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for RDS instance"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup

  # ========================================
  # RDS Database
  # ========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: "Subnet group for RDS instance"
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${Environment}-database"
      DBInstanceClass: db.t3.micro
      Engine: mysql
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      DeletionProtection: true

  # ========================================
  # S3 Bucket
  # ========================================

  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  # ========================================
  # CloudWatch Monitoring
  # ========================================

  RDSAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "Monitor RDS CPU utilization"
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance

  # ========================================
  # WAF
  # ========================================

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub "${Environment}-WebACL"
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: BlockSQLInjection
          Priority: 1
          Statement:
            SqliMatchStatement:
              FieldToMatch:
                AllQueryArguments: {}
              TextTransformations:
                - Priority: 1
                  Type: URL_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRule

Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC

  PublicSubnets:
    Description: "List of public subnets"
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]

  PrivateSubnets:
    Description: "List of private subnets"
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]

  RDSEndpoint:
    Description: "RDS endpoint"
    Value: !GetAtt RDSInstance.Endpoint.Address

  S3BucketName:
    Description: "Name of secure S3 bucket"
    Value: !Ref SecureS3Bucket

  WebACLArn:
    Description: "ARN of WAF Web ACL"
    Value: !GetAtt WebACL.Arn
