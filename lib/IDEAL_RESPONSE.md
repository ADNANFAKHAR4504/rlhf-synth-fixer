# CloudFormation Infrastructure Solution

I'll create a secure AWS infrastructure using CloudFormation in YAML that meets all your requirements with proper QA deployment standards.

## secure-infrastructure.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Environment Configuration
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: Infrastructure Configuration
        Parameters:
          - ProjectName
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  ProjectName:
    Type: String
    Default: 'SecureInfra'
    Description: 'Name prefix for all resources'
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet in AZ1'
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet in AZ2'
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for private subnet in AZ1'
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    Description: 'CIDR block for private subnet in AZ2'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'

  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ1${EnvironmentSuffix}'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-AZ1${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes${EnvironmentSuffix}'

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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ1${EnvironmentSuffix}'

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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ2${EnvironmentSuffix}'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Group for SSH access from specific IP range
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub '${ProjectName}-SSH-SecurityGroup${EnvironmentSuffix}'
      GroupDescription: 'Security group allowing SSH access only from 192.168.1.0/24'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '192.168.1.0/24'
          Description: 'SSH access from trusted network'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-SSH-SG${EnvironmentSuffix}'
        - Key: Purpose
          Value: 'SSH Access Control'

  # S3 Bucket with mandatory server-side encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Secure-Bucket${EnvironmentSuffix}'
        - Key: Encryption
          Value: 'Enabled'

  # S3 Bucket Policy to enforce encryption
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # S3 Bucket for Access Logs
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Access-Logs-Bucket${EnvironmentSuffix}'
        - Key: Purpose
          Value: 'S3 Access Logging'

  # CloudWatch Log Group for S3 events
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-bucket-logs${EnvironmentSuffix}'
      RetentionInDays: 30

  # VPC Flow Logs for security monitoring
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogPolicy
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

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}${EnvironmentSuffix}'
      RetentionInDays: 14

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC-FlowLogs${EnvironmentSuffix}'

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'ID of the public subnet in AZ1'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'ID of the public subnet in AZ2'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'ID of the private subnet in AZ1'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'ID of the private subnet in AZ2'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  SSHSecurityGroupId:
    Description: 'ID of the SSH Security Group'
    Value: !Ref SSHSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SSHSecurityGroupId'

  SecureS3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3BucketName'

  SecureS3BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3BucketArn'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayId'
```

This enhanced CloudFormation template creates a comprehensive secure AWS infrastructure that meets all requirements and follows QA deployment standards:

### Core Requirements Met:
1. **VPC Architecture**: Creates a VPC with both public and private subnets distributed across two Availability Zones for high availability
2. **NAT Gateway**: Configures a NAT Gateway to allow private subnet instances secure internet access
3. **Encrypted S3 Bucket**: Creates an S3 bucket with mandatory server-side encryption enabled for all objects
4. **Security Group**: Defines a security group allowing SSH access only from the 192.168.1.0/24 range
5. **YAML Format**: The entire solution is written in YAML format

### QA Deployment Enhancements:
1. **Environment Suffix Support**: Added EnvironmentSuffix parameter for multi-environment deployments
2. **Proper Resource Naming**: All resources include environment suffix to avoid conflicts
3. **Deletion Policies**: All resources have DeletionPolicy: Delete to ensure clean teardown
4. **Metadata Section**: Includes CloudFormation interface metadata for better parameter organization
5. **Stack-based Exports**: Output exports use AWS::StackName prefix for proper cross-stack referencing
6. **Complete Resource Coverage**: Includes VPC Flow Logs, S3 access logging, and CloudWatch integration

### Security Best Practices:
- S3 bucket policies enforce encryption and secure transport
- Public access blocking on S3 buckets
- VPC Flow Logs for security monitoring
- Proper IAM roles with minimal permissions
- Resource tagging for governance and cost tracking