```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure AWS Cloud Environment - Highly secure infrastructure with encryption, least-privilege IAM, network hardening, and compliance monitoring"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
          - TrustedIpAddresses
      - Label:
          default: "Database Configuration"
        Parameters:
          - DatabaseUsername
      - Label:
          default: "Security Configuration"
        Parameters:
          - CreateCloudTrail

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  TrustedIpAddresses:
    Type: CommaDelimitedList
    Default: "203.0.113.0/24,198.51.100.0/24"
    Description: "List of trusted IP addresses/CIDR blocks for HTTP/HTTPS access"

  DatabaseUsername:
    Type: String
    Default: "securedbuser"
    Description: "Database username for Secrets Manager"
    MinLength: 1
    MaxLength: 64

  CreateCloudTrail:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: "Whether to create CloudTrail (set to false if you already have 5 trails in the region)"

Conditions:
  ShouldCreateCloudTrail: !Equals [!Ref CreateCloudTrail, "true"]

Resources:
  # =========================================================================
  # KMS Customer-Managed Key for S3 Encryption (no dependencies)
  # =========================================================================
  S3KMSKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: "Customer-managed KMS key for S3 bucket encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow S3 service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey"
            Resource: "*"
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: S3-Encryption

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/secure-s3-key-${EnvironmentSuffix}-${AWS::StackName}"
      TargetKeyId: !Ref S3KMSKey

  # =========================================================================
  # VPC and Network Configuration (no dependencies)
  # =========================================================================
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: "10.0.0.0/16"
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "SecureVPC-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.1.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "PublicSubnet-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.2.0/24"
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "PrivateSubnet-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "IGW-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "NATGatewayEIP-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub "NATGateway-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "PublicRouteTable-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "PrivateRouteTable-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
      NatGatewayId: !Ref NATGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  # Network ACL with deny-by-default, allow only HTTP/HTTPS from trusted IPs
  SecureNetworkACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "SecureNetworkACL-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  NetworkACLEntryInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureNetworkACL
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Select [0, !Ref TrustedIpAddresses]
      PortRange:
        From: 80
        To: 80

  NetworkACLEntryInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureNetworkACL
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Select [0, !Ref TrustedIpAddresses]
      PortRange:
        From: 443
        To: 443

  NetworkACLEntryOutboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureNetworkACL
      RuleNumber: 200
      Protocol: 6
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"
      PortRange:
        From: 80
        To: 80

  NetworkACLEntryOutboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureNetworkACL
      RuleNumber: 210
      Protocol: 6
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"
      PortRange:
        From: 443
        To: 443

  NetworkACLEntryOutboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref SecureNetworkACL
      RuleNumber: 220
      Protocol: 6
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"
      PortRange:
        From: 1024
        To: 65535

  PublicSubnetNetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      NetworkAclId: !Ref SecureNetworkACL

  PrivateSubnetNetworkACLAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      NetworkAclId: !Ref SecureNetworkACL

  # =========================================================================
  # Security Groups with Minimal Rules (depends on VPC)
  # =========================================================================
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Minimal security group for web servers - only HTTP/HTTPS from trusted sources"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Select [0, !Ref TrustedIpAddresses]
          Description: "HTTP from trusted IP range 1"
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Select [0, !Ref TrustedIpAddresses]
          Description: "HTTPS from trusted IP range 1"
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: "0.0.0.0/0"
          Description: "Outbound HTTP"
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: "0.0.0.0/0"
          Description: "Outbound HTTPS"
      Tags:
        - Key: Name
          Value: !Sub "WebSecurityGroup-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for database access - only from web security group"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: "MySQL access from web servers"
      Tags:
        - Key: Name
          Value: !Sub "DatabaseSecurityGroup-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  # =========================================================================
  # VPC Endpoints for Systems Manager (depends on VPC and security group)
  # =========================================================================
  SSMVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ssm"
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: "*"
            Action:
              - "ssm:*"
            Resource: "*"

  SSMMessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ssmmessages"
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: "*"
            Action:
              - "ssmmessages:*"
            Resource: "*"

  EC2MessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ec2messages"
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      PrivateDnsEnabled: true
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: "*"
            Action:
              - "ec2messages:*"
            Resource: "*"

  # =========================================================================
  # AWS Secrets Manager (no dependencies)
  # =========================================================================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "DatabaseCredentials-${EnvironmentSuffix}"
      Description: "Database credentials with automatic rotation"
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseUsername}"}'
        GenerateStringKey: "password"
        PasswordLength: 16
        ExcludeCharacters: '"@/'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: DatabaseCredentials

  # =========================================================================
  # S3 Buckets (depends on KMS key)
  # =========================================================================
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub "access-logs-bucket-${EnvironmentSuffix}-${AWS::AccountId}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: AccessLogs

  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub "secure-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: "aws:kms"
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: "access-logs/"
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: SecureDataStorage

  # =========================================================================
  # IAM Roles with Least Privilege (depends on S3 bucket and KMS key)
  # =========================================================================
  EC2S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      Policies:
        - PolicyName: S3SpecificBucketAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - "s3:ListBucket"
                  - "s3:GetObject"
                  - "s3:PutObject"
                Resource:
                  - !GetAtt SecureS3Bucket.Arn
                  - !Sub "${SecureS3Bucket.Arn}/*"
              - Effect: Allow
                Action:
                  - "kms:Decrypt"
                  - "kms:GenerateDataKey"
                Resource: !GetAtt S3KMSKey.Arn
        - PolicyName: SecretsManagerReadAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - "secretsmanager:GetSecretValue"
                  - "secretsmanager:DescribeSecret"
                Resource: !Ref DatabaseSecret
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2S3AccessRole

  # =========================================================================
  # S3 Bucket Policy (depends on IAM role and S3 bucket)
  # =========================================================================
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: RestrictPutObjectToSpecificRoles
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2S3AccessRole.Arn
            Action: "s3:PutObject"
            Resource: !Sub "${SecureS3Bucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-server-side-encryption": "aws:kms"
                "s3:x-amz-server-side-encryption-aws-kms-key-id": !Ref S3KMSKey
          - Sid: AllowListAndGetObject
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2S3AccessRole.Arn
            Action:
              - "s3:ListBucket"
              - "s3:GetObject"
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub "${SecureS3Bucket.Arn}/*"
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub "${SecureS3Bucket.Arn}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"

  # =========================================================================
  # EC2 Instance (depends on IAM role, security group, and subnet)
  # =========================================================================
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}"
      InstanceType: "t3.micro"
      SubnetId: !Ref PrivateSubnet
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-ssm-agent
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent

          # Install CloudWatch agent
          yum install -y amazon-cloudwatch-agent

          # Create a simple test file in S3
          aws s3 cp /var/log/messages s3://${SecureS3Bucket}/instance-logs/messages.log --sse aws:kms --sse-kms-key-id ${S3KMSKey}
      Tags:
        - Key: Name
          Value: !Sub "SecureEC2Instance-${EnvironmentSuffix}"
        - Key: Environment
          Value: Production

  # =========================================================================
  # CloudTrail (Conditional - depends on KMS key and S3 bucket)
  # =========================================================================
  CloudTrailKMSKey:
    Type: AWS::KMS::Key
    Condition: ShouldCreateCloudTrail
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: "KMS key for CloudTrail log encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
            Resource: "*"
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: CloudTrail-Encryption

  CloudTrailKMSKeyAlias:
    Type: AWS::KMS::Alias
    Condition: ShouldCreateCloudTrail
    Properties:
      AliasName: !Sub "alias/cloudtrail-key-${EnvironmentSuffix}-${AWS::StackName}"
      TargetKeyId: !Ref CloudTrailKMSKey

  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Condition: ShouldCreateCloudTrail
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub "cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: CloudTrailLogs

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: ShouldCreateCloudTrail
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailLogsBucket.Arn
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecurityAuditTrail-${EnvironmentSuffix}"
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:aws:s3:::${CloudTrailLogsBucket}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecurityAuditTrail-${EnvironmentSuffix}"

  SecurityAuditTrail:
    Type: AWS::CloudTrail::Trail
    Condition: ShouldCreateCloudTrail
    DependsOn: CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub "SecurityAuditTrail-${EnvironmentSuffix}"
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: !Sub "cloudtrail-logs/${AWS::AccountId}/"
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref CloudTrailKMSKey
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: SecurityAudit

Outputs:
  # VPC and Network Outputs
  VPCId:
    Description: "ID of the secure VPC"
    Value: !Ref SecureVPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnetId:
    Description: "ID of the public subnet"
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnetId"

  PrivateSubnetId:
    Description: "ID of the private subnet"
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnetId"

  # S3 Outputs
  SecureS3BucketName:
    Description: "Name of the secure S3 bucket"
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub "${AWS::StackName}-SecureS3BucketName"

  S3KMSKeyId:
    Description: "ID of the KMS key used for S3 encryption"
    Value: !Ref S3KMSKey
    Export:
      Name: !Sub "${AWS::StackName}-S3KMSKeyId"

  # EC2 Outputs
  EC2InstanceId:
    Description: "ID of the secure EC2 instance"
    Value: !Ref SecureEC2Instance
    Export:
      Name: !Sub "${AWS::StackName}-EC2InstanceId"

  EC2RoleArn:
    Description: "ARN of the EC2 IAM role"
    Value: !GetAtt EC2S3AccessRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-EC2RoleArn"

  # Security Outputs
  WebSecurityGroupId:
    Description: "ID of the web security group"
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-WebSecurityGroupId"

  DatabaseSecurityGroupId:
    Description: "ID of the database security group"
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecurityGroupId"

  # Secrets Manager Output
  DatabaseSecretArn:
    Description: "ARN of the database secret"
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecretArn"

  # CloudTrail Output (Conditional)
  CloudTrailArn:
    Condition: ShouldCreateCloudTrail
    Description: "ARN of the CloudTrail"
    Value: !GetAtt SecurityAuditTrail.Arn
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailArn"

  # Stack Information
  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"
```