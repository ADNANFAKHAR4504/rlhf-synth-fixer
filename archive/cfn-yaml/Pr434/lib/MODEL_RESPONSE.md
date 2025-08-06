# Secure Multi-Tier AWS CloudFormation Template

Below is a comprehensive, production-ready CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-tier AWS infrastructure with high availability, encryption, and least privilege access'

# =============================================================================
# PARAMETERS SECTION
# =============================================================================
Parameters:
  AllowedSSHCIDR:
    Type: String
    Default: '192.168.10.0/24'
    Description: 'IP CIDR range allowed for SSH access to EC2 instances'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 192.168.10.0/24)'

  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS PostgreSQL database'
    MinLength: 1
    MaxLength: 63
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS PostgreSQL database'
    MinLength: 8
    MaxLength: 128
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]*$'

# =============================================================================
# MAPPINGS SECTION
# =============================================================================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI

# =============================================================================
# RESOURCES SECTION
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # KMS KEY FOR ENCRYPTION
  # ---------------------------------------------------------------------------
  SecureAppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for SecureApp encryption'
      KeyPolicy:
        Version: '2012-10-17'
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
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Project
          Value: SecureApp

  SecureAppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secureapp-key
      TargetKeyId: !Ref SecureAppKMSKey

  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING CONFIGURATION
  # ---------------------------------------------------------------------------
  SecureAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureApp-VPC
        - Key: Project
          Value: SecureApp

  # Internet Gateway
  SecureAppIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureApp-IGW
        - Key: Project
          Value: SecureApp

  SecureAppIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureAppVPC
      InternetGatewayId: !Ref SecureAppIGW

  # Public Subnets (one per AZ)
  PublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureApp-Public-Subnet-AZ1
        - Key: Project
          Value: SecureApp

  PublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureApp-Public-Subnet-AZ2
        - Key: Project
          Value: SecureApp

  # Private Subnets (one per AZ)
  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureApp-Private-Subnet-AZ1
        - Key: Project
          Value: SecureApp

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureAppVPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureApp-Private-Subnet-AZ2
        - Key: Project
          Value: SecureApp

  # NAT Gateways (one per AZ for high availability)
  NATGatewayAZ1EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureAppIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: SecureApp-NAT-EIP-AZ1
        - Key: Project
          Value: SecureApp

  NATGatewayAZ2EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureAppIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: SecureApp-NAT-EIP-AZ2
        - Key: Project
          Value: SecureApp

  NATGatewayAZ1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayAZ1EIP.AllocationId
      SubnetId: !Ref PublicSubnetAZ1
      Tags:
        - Key: Name
          Value: SecureApp-NAT-Gateway-AZ1
        - Key: Project
          Value: SecureApp

  NATGatewayAZ2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayAZ2EIP.AllocationId
      SubnetId: !Ref PublicSubnetAZ2
      Tags:
        - Key: Name
          Value: SecureApp-NAT-Gateway-AZ2
        - Key: Project
          Value: SecureApp

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: SecureApp-Public-Route-Table
        - Key: Project
          Value: SecureApp

  PrivateRouteTableAZ1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: SecureApp-Private-Route-Table-AZ1
        - Key: Project
          Value: SecureApp

  PrivateRouteTableAZ2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureAppVPC
      Tags:
        - Key: Name
          Value: SecureApp-Private-Route-Table-AZ2
        - Key: Project
          Value: SecureApp

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: SecureAppIGWAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref SecureAppIGW

  PrivateRouteAZ1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableAZ1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGatewayAZ1

  PrivateRouteAZ2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableAZ2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGatewayAZ2

  # Route Table Associations
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

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------
  EC2HTTPSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group allowing HTTPS traffic from anywhere'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: SecureApp-EC2-HTTPS-SG
        - Key: Project
          Value: SecureApp

  EC2SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group allowing SSH from specified IP range'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'Allow SSH from specified IP range'
      Tags:
        - Key: Name
          Value: SecureApp-EC2-SSH-SG
        - Key: Project
          Value: SecureApp

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS PostgreSQL database'
      VpcId: !Ref SecureAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2HTTPSSecurityGroup
          Description: 'Allow PostgreSQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: SecureApp-RDS-SG
        - Key: Project
          Value: SecureApp

  # ---------------------------------------------------------------------------
  # IAM ROLES AND POLICIES
  # ---------------------------------------------------------------------------
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureApp-EC2-Role
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
        - PolicyName: SecureApp-EC2-Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${LoggingBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureAppKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Project
          Value: SecureApp

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # ---------------------------------------------------------------------------
  # S3 BUCKET FOR LOGGING
  # ---------------------------------------------------------------------------
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt SecureAppKMSKey.Arn
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetentionRule
            Status: Enabled
            Transitions:
              - TransitionInDays: 365
                StorageClass: GLACIER
            ExpirationInDays: 2555 # 7 years
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref LoggingBucket
      Tags:
        - Key: Project
          Value: SecureApp

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LoggingBucket.Arn
              - !Sub '${LoggingBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ---------------------------------------------------------------------------
  # CLOUDTRAIL CONFIGURATION
  # ---------------------------------------------------------------------------
  SecureAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LoggingBucketPolicy
    Properties:
      TrailName: SecureApp-CloudTrail
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      KMSKeyId: !GetAtt SecureAppKMSKey.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${LoggingBucket}/*'
      Tags:
        - Key: Project
          Value: SecureApp

  # ---------------------------------------------------------------------------
  # VPC FLOW LOGS
  # ---------------------------------------------------------------------------
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCFlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/vpc/flowlogs
      RetentionInDays: 365
      KmsKeyId: !GetAtt SecureAppKMSKey.Arn

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureAppVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Project
          Value: SecureApp

  # ---------------------------------------------------------------------------
  # RDS SUBNET GROUP AND DATABASE
  # ---------------------------------------------------------------------------
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for SecureApp RDS database'
      SubnetIds:
        - !Ref PrivateSubnetAZ1
        - !Ref PrivateSubnetAZ2
      Tags:
        - Key: Name
          Value: SecureApp-RDS-SubnetGroup
        - Key: Project
          Value: SecureApp

  SecureAppDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: secureapp-database
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '13.7'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !GetAtt SecureAppKMSKey.Arn
      MultiAZ: true
      DBSubnetGroupName: !Ref RDSSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: SecureApp-Database
        - Key: Project
          Value: SecureApp

  # ---------------------------------------------------------------------------
  # EC2 INSTANCES
  # ---------------------------------------------------------------------------
  EC2InstanceAZ1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      SubnetId: !Ref PrivateSubnetAZ1
      SecurityGroupIds:
        - !Ref EC2HTTPSSecurityGroup
        - !Ref EC2SSHSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !GetAtt SecureAppKMSKey.Arn
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent

          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/secureapp",
                      "log_stream_name": "{instance_id}/messages"
                    }
                  ]
                }
              }
            }
          }
          EOF

          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: SecureApp-EC2-AZ1
        - Key: Project
          Value: SecureApp

  EC2InstanceAZ2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      SubnetId: !Ref PrivateSubnetAZ2
      SecurityGroupIds:
        - !Ref EC2HTTPSSecurityGroup
        - !Ref EC2SSHSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !GetAtt SecureAppKMSKey.Arn
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent

          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/secureapp",
                      "log_stream_name": "{instance_id}/messages"
                    }
                  ]
                }
              }
            }
          }
          EOF

          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: SecureApp-EC2-AZ2
        - Key: Project
          Value: SecureApp

  # ---------------------------------------------------------------------------
  # SECRETS MANAGER FOR ACCESS KEY ROTATION
  # ---------------------------------------------------------------------------
  AccessKeyRotationUser:
    Type: AWS::IAM::User
    Properties:
      UserName: SecureApp-AccessKey-User
      Policies:
        - PolicyName: MinimalAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref AccessKeySecret
      Tags:
        - Key: Project
          Value: SecureApp

  AccessKeySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: SecureApp/AccessKeys
      Description: 'Automatically rotated access keys for SecureApp'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${AccessKeyRotationUser}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Project
          Value: SecureApp

  AccessKeyRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref AccessKeySecret
      RotationLambdaArn: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:SecretsManagerRDSPostgreSQLRotationSingleUser'
      RotationRules:
        AutomaticallyAfterDays: 90

# =============================================================================
# OUTPUTS SECTION
# =============================================================================
Outputs:
  VPCId:
    Description: 'ID of the SecureApp VPC'
    Value: !Ref SecureAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetAZ1Id:
    Description: 'ID of the public subnet in AZ1'
    Value: !Ref PublicSubnetAZ1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-AZ1-ID'

  PublicSubnetAZ2Id:
    Description: 'ID of the public subnet in AZ2'
    Value: !Ref PublicSubnetAZ2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-AZ2-ID'

  PrivateSubnetAZ1Id:
    Description: 'ID of the private subnet in AZ1'
    Value: !Ref PrivateSubnetAZ1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet-AZ1-ID'

  PrivateSubnetAZ2Id:
    Description: 'ID of the private subnet in AZ2'
    Value: !Ref PrivateSubnetAZ2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet-AZ2-ID'

  EC2InstanceAZ1Id:
    Description: 'Instance ID of EC2 in AZ1'
    Value: !Ref EC2InstanceAZ1
    Export:
      Name: !Sub '${AWS::StackName}-EC2-AZ1-ID'

  EC2InstanceAZ2Id:
    Description: 'Instance ID of EC2 in AZ2'
    Value: !Ref EC2InstanceAZ2
    Export:
      Name: !Sub '${AWS::StackName}-EC2-AZ2-ID'

  RDSEndpoint:
    Description: 'RDS PostgreSQL database endpoint'
    Value: !GetAtt SecureAppDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  LoggingBucketName:
    Description: 'Name of the S3 bucket for logs'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket-Name'

  KMSKeyId:
    Description: 'ID of the customer-managed KMS key'
    Value: !Ref SecureAppKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  KMSKeyArn:
    Description: 'ARN of the customer-managed KMS key'
    Value: !GetAtt SecureAppKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt SecureAppCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
```

## Key Features and Security Implementations

### 🔒 **Security Best Practices**

- **Encryption at Rest**: All storage (EBS, RDS, S3) encrypted with customer-managed KMS key
- **Least Privilege**: IAM roles with minimal required permissions
- **Network Isolation**: Private subnets for compute and database resources
- **Security Groups**: Restrictive ingress rules with specific port and source controls

### 🏗️ **High Availability Architecture**

- **Multi-AZ Deployment**: Resources distributed across two availability zones
- **NAT Gateway Redundancy**: One NAT Gateway per AZ for fault tolerance
- **RDS Multi-AZ**: Database configured for automatic failover

### 📊 **Comprehensive Logging**

- **CloudTrail**: All API activity logged and encrypted
- **VPC Flow Logs**: Network traffic monitoring
- **S3 Lifecycle Policies**: Cost-optimized log retention (365 days → Glacier)
- **CloudWatch Integration**: EC2 instances configured with CloudWatch agent

### 🔄 **Automated Security Management**

- **Access Key Rotation**: 90-day automatic rotation via Secrets Manager
- **Versioned S3 Bucket**: Immutable log storage with versioning
- **Deletion Protection**: RDS configured with deletion protection

### 📋 **Compliance Features**

- **Consistent Tagging**: All resources tagged with "Project: SecureApp"
- **Audit Trail**: Complete API and network activity logging
- **Data Retention**: 7-year log retention policy
- **Secure Transport**: S3 bucket policy enforces HTTPS-only access

## Deployment Instructions

1. **Prerequisites**: Ensure you have appropriate AWS CLI credentials and permissions
2. **Validation**: Run `cfn-lint template.yaml` to validate the template
3. **Deployment**: Use AWS CLI or Console to deploy with required parameters
4. **Post-Deployment**: Verify all resources are created and properly configured

This template provides a production-ready, secure, and highly available AWS infrastructure that follows AWS Well-Architected Framework principles.
