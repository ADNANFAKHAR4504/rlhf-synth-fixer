# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-grade AWS infrastructure with dual VPC setup for web application deployment'

Parameters:
  ProjectName:
    Type: String
    Default: 'WebApp'
    Description: 'Project name for resource tagging'
  
  OfficeIPCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'Office IP CIDR for restricted access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for the environment (e.g., dev, prod)'
    Default: 'dev'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'

Resources:
  # =====================================================
  # KMS Key for Encryption
  # =====================================================
  # UPDATED: KMS Key with Config Service Access
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 and CloudWatch Logs encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
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
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-encryption-key'
      TargetKeyId: !Ref KMSKey

  # =====================================================
  # Production VPC Configuration
  # =====================================================
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-VPC'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-Public-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionPrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-Private-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-IGW'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProductionVPC
      InternetGatewayId: !Ref ProductionInternetGateway

  ProductionPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-Public-RT'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProductionAttachGateway
    Properties:
      RouteTableId: !Ref ProductionPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProductionInternetGateway

  ProductionPublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProductionPublicSubnet
      RouteTableId: !Ref ProductionPublicRouteTable

  # =====================================================
  # Staging VPC Configuration
  # =====================================================
  StagingVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.1.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-VPC'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVPC
      CidrBlock: '10.1.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-Public-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingPrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVPC
      CidrBlock: '10.1.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-Private-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-IGW'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref StagingVPC
      InternetGatewayId: !Ref StagingInternetGateway

  StagingPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref StagingVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-Public-RT'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: StagingAttachGateway
    Properties:
      RouteTableId: !Ref StagingPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref StagingInternetGateway

  StagingPublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref StagingPublicSubnet
      RouteTableId: !Ref StagingPublicRouteTable

  # =====================================================
  # Security Groups
  # =====================================================
  ProductionWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for production web servers - restricts access to office IP'
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref OfficeIPCIDR
          Description: 'HTTP access from office IP'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref OfficeIPCIDR
          Description: 'HTTPS access from office IP'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-Web-SG'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for staging web servers - restricts access to office IP'
      VpcId: !Ref StagingVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref OfficeIPCIDR
          Description: 'HTTP access from office IP'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref OfficeIPCIDR
          Description: 'HTTPS access from office IP'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-Web-SG'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # =====================================================
  # Network ACLs for Private Subnets
  # =====================================================
  ProductionPrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Production-Private-NACL'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ProductionPrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref ProductionPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: '10.0.0.0/16'

  ProductionPrivateNetworkAclEntryOutboundDeny:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref ProductionPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: deny
      CidrBlock: '0.0.0.0/0'

  ProductionPrivateSubnetNetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref ProductionPrivateSubnet
      NetworkAclId: !Ref ProductionPrivateNetworkAcl

  StagingPrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref StagingVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Staging-Private-NACL'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingPrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref StagingPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: '10.1.0.0/16'

  StagingPrivateNetworkAclEntryOutboundDeny:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref StagingPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: deny
      CidrBlock: '0.0.0.0/0'

  StagingPrivateSubnetNetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref StagingPrivateSubnet
      NetworkAclId: !Ref StagingPrivateNetworkAcl

  # =====================================================
  # IAM Roles and Policies
  # =====================================================
  
  # VPC Flow Logs Role - Allows VPC Flow Logs to write to CloudWatch Logs
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
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
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
                Resource: 
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/*:*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # FIXED: EC2 Instance Role - Minimal permissions for web application instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy  # AWS managed policy for CloudWatch agent
      Policies:
        # Custom policy for S3 access with least privilege - only specific bucket access
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: 
                  - !Sub '${ProductionS3Bucket.Arn}/*'  # ✅ FIXED: Use .Arn
                  - !Sub '${StagingS3Bucket.Arn}/*'     # ✅ FIXED: Use .Arn
                Condition:
                  StringEquals:
                    's3:x-amz-server-side-encryption': 'aws:kms'  # Enforce KMS encryption
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: 
                  - !GetAtt ProductionS3Bucket.Arn      # ✅ FIXED: Use GetAtt
                  - !GetAtt StagingS3Bucket.Arn         # ✅ FIXED: Use GetAtt
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # =====================================================
  # S3 Buckets with Security Configuration
  # =====================================================
  ProductionS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # FIXED: Production S3 Bucket Policy
  ProductionS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProductionS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Enforce HTTPS only access
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ProductionS3Bucket.Arn}/*'  # ✅ FIXED: Use .Arn
              - !GetAtt ProductionS3Bucket.Arn      # ✅ FIXED: Use GetAtt for bucket ARN
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  StagingS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # FIXED: Staging S3 Bucket Policy
  StagingS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StagingS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Enforce HTTPS only access
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${StagingS3Bucket.Arn}/*'     # ✅ FIXED: Use .Arn
              - !GetAtt StagingS3Bucket.Arn         # ✅ FIXED: Use GetAtt for bucket ARN
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # =====================================================
  # CloudWatch Log Groups for VPC Flow Logs
  # =====================================================
  ProductionVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-production'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-staging'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # =====================================================
  # VPC Flow Logs
  # =====================================================
  ProductionVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref ProductionVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref ProductionVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  StagingVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref StagingVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref StagingVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  ProductionVPCId:
    Description: 'Production VPC ID'
    Value: !Ref ProductionVPC
    Export:
      Name: !Sub '${AWS::StackName}-ProductionVPC'

  StagingVPCId:
    Description: 'Staging VPC ID'
    Value: !Ref StagingVPC
    Export:
      Name: !Sub '${AWS::StackName}-StagingVPC'

  ProductionPublicSubnetId:
    Description: 'Production Public Subnet ID'
    Value: !Ref ProductionPublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-ProductionPublicSubnet'

  ProductionPrivateSubnetId:
    Description: 'Production Private Subnet ID'
    Value: !Ref ProductionPrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-ProductionPrivateSubnet'

  StagingPublicSubnetId:
    Description: 'Staging Public Subnet ID'
    Value: !Ref StagingPublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-StagingPublicSubnet'

  StagingPrivateSubnetId:
    Description: 'Staging Private Subnet ID'
    Value: !Ref StagingPrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-StagingPrivateSubnet'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfile'
```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
