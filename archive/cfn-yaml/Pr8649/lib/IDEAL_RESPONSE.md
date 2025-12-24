# Secure AWS Web Application Infrastructure

This CloudFormation template creates a comprehensive, secure infrastructure for hosting web applications on AWS. The template follows security best practices and provides a foundation for scalable web applications.

## Architecture Overview

The infrastructure includes a multi-tier architecture with proper network segmentation:

- **Networking**: VPC with public and private subnets across two availability zones
- **Security**: Multiple security groups with restrictive access rules
- **Storage**: S3 buckets with versioning and KMS encryption
- **Monitoring**: CloudTrail for API logging and CloudWatch for metrics
- **Access Management**: IAM roles with least privilege principles

## Key Components

### Network Infrastructure
The template creates a VPC with CIDR 10.0.0.0/16, containing four subnets:
- Two public subnets (10.0.1.0/24, 10.0.2.0/24) for load balancers and bastion hosts
- Two private subnets (10.0.3.0/24, 10.0.4.0/24) for application servers and databases

NAT gateways in each availability zone provide internet access for private subnets while maintaining security.

### Security Groups
Four security groups control network access:
- ALB Security Group: Allows HTTP/HTTPS from internet
- Web Server Security Group: Allows traffic only from ALB and bastion
- Database Security Group: Allows MySQL access only from web servers
- Bastion Security Group: Allows SSH access from internet (restricted source recommended)

### Storage and Encryption
Three S3 buckets are created with versioning and KMS encryption:
- Web application bucket for storing application data
- Logging bucket for access logs and audit trails
- CloudTrail bucket for API logging

All buckets use customer-managed KMS keys and have public access blocked by default.

### Monitoring and Compliance
CloudTrail is configured to log all API calls across all regions, with logs stored in the dedicated S3 bucket and streamed to CloudWatch for real-time monitoring. The trail includes data events for S3 objects and uses KMS encryption for log files.

### IAM Configuration
EC2 instances receive an IAM role with minimal permissions:
- Read/write access to the web application S3 bucket
- KMS permissions for encryption/decryption
- CloudWatch agent permissions for monitoring

CloudTrail has its own service role for logging to CloudWatch.

## Template Features

- **Parameterized**: Environment suffix allows multiple deployments
- **Cross-AZ**: Resources distributed across availability zones for high availability
- **Secure by Default**: All network access is explicitly controlled
- **Encrypted**: All data at rest uses KMS encryption
- **Auditable**: Complete API logging with CloudTrail
- **Scalable**: Foundation supports adding auto scaling and load balancing

## Deployment Requirements

The template requires:
- AWS CLI with appropriate permissions
- CloudFormation deployment capabilities
- KMS permissions for encryption key creation
- S3 permissions for CloudTrail bucket setup

## Security Considerations

The template implements defense in depth with multiple security layers. Network segmentation isolates different tiers, while security groups enforce strict access controls. All data storage uses encryption, and comprehensive logging ensures audit trails for compliance.

For production use, consider additional hardening like Web Application Firewall, additional monitoring tools, and regular security assessments.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Web Application Infrastructure with comprehensive security controls'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: '10.0.0.0/16'
  
  PublicSubnet1CIDR:
    Description: CIDR block for public subnet 1
    Type: String
    Default: '10.0.1.0/24'
  
  PublicSubnet2CIDR:
    Description: CIDR block for public subnet 2
    Type: String
    Default: '10.0.2.0/24'
  
  PrivateSubnet1CIDR:
    Description: CIDR block for private subnet 1
    Type: String
    Default: '10.0.3.0/24'
  
  PrivateSubnet2CIDR:
    Description: CIDR block for private subnet 2
    Type: String
    Default: '10.0.4.0/24'

Resources:
  # KMS Key for encryption
  WebAppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for Web App encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  WebAppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/securewebapp${EnvironmentSuffix}-key'
      TargetKeyId: !Ref WebAppKMSKey

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-IGW'

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
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Private-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
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

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Private-Routes-AZ1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Private-Routes-AZ2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-${EnvironmentSuffix}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-${EnvironmentSuffix}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
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
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from Bastion'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-WebServer-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-${EnvironmentSuffix}-Database-SG'
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Database-SG'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-${EnvironmentSuffix}-Bastion-SG'
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'securewebapp${EnvironmentSuffix}-Bastion-SG'

  # S3 Buckets with versioning and encryption
  WebAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'securewebapp-${EnvironmentSuffix}-${AWS::AccountId}-webapp-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref WebAppKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingS3Bucket
        LogFilePrefix: 'webapp-access-logs/'

  LoggingS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'securewebapp-${EnvironmentSuffix}-${AWS::AccountId}-logs-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref WebAppKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'securewebapp-${EnvironmentSuffix}-${AWS::AccountId}-trail-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref WebAppKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # S3 Bucket Policy for CloudTrail
  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # IAM Roles
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureWebApp-${EnvironmentSuffix}-EC2-Role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${WebAppS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt WebAppS3Bucket.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt WebAppKMSKey.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'securewebapp${EnvironmentSuffix}-EC2-Profile'
      Roles:
        - !Ref EC2InstanceRole

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureWebApp-${EnvironmentSuffix}-CloudTrail-Role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudTrailLogGroup}:*'

  # CloudWatch Log Groups
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/SecureWebApp-${EnvironmentSuffix}'
      RetentionInDays: 90

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/SecureWebApp-${EnvironmentSuffix}'
      RetentionInDays: 30

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub 'securewebapp${EnvironmentSuffix}-CloudTrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      KMSKeyId: !Ref WebAppKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: 
                - !Sub '${CloudTrailS3Bucket.Arn}/*'

Outputs:
  VPC:
    Description: A reference to the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-VPCID'

  PublicSubnets:
    Description: A list of the public subnets
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-PUB-NETS'

  PrivateSubnets:
    Description: A list of the private subnets
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-PRIV-NETS'

  ALBSecurityGroup:
    Description: Security group for the Application Load Balancer
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-ALB-SG'

  WebServerSecurityGroup:
    Description: Security group for web servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-WEB-SG'

  DatabaseSecurityGroup:
    Description: Security group for database
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-DB-SG'

  WebAppS3Bucket:
    Description: S3 bucket for web application
    Value: !Ref WebAppS3Bucket
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-S3-BUCKET'

  KMSKey:
    Description: KMS Key for encryption
    Value: !Ref WebAppKMSKey
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-KMS-KEY'

  EC2InstanceProfile:
    Description: EC2 Instance Profile
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub 'securewebapp${EnvironmentSuffix}-EC2-PROFILE'
```