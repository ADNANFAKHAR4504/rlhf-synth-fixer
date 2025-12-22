# IDEAL RESPONSE

Based on your requirements, I'll create a comprehensive secure AWS infrastructure using CloudFormation in YAML format. This solution not only meets your specific requirements but also incorporates additional security best practices and production-ready features.

Here's the enhanced CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enhanced secure AWS infrastructure with VPC, subnets across 2 AZs, NAT Gateway, encrypted S3 bucket, restricted SSH access, and additional security features'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - EnvironmentSuffix
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr
    ParameterLabels:
      ProjectName:
        default: "Project Name"
      EnvironmentSuffix:
        default: "Environment"

Parameters:
  ProjectName:
    Type: String
    Default: 'secureinfra'
    AllowedPattern: '^[a-z0-9-]+$'
    Description: 'Name prefix for all resources (lowercase, numbers, and hyphens only)'
    MaxLength: 20

  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'test', 'staging', 'prod']
    Description: 'Environment suffix for all resources'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for the VPC (valid range: /16 to /28)'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for public subnet in AZ1'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for public subnet in AZ2'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for private subnet in AZ1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for private subnet in AZ2'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
    DeletionPolicy: Delete

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

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
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  # NAT Gateway with High Availability considerations
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-AZ1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

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

  # Separate route tables for each private subnet
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

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
          Value: !Sub '${ProjectName}-Private-Routes-AZ2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

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

  # Enhanced Security Group for SSH access
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-SSH-SecurityGroup-${EnvironmentSuffix}'
      GroupDescription: 'Enhanced security group allowing SSH access only from 192.168.1.0/24 with comprehensive logging'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '192.168.1.0/24'
          Description: 'SSH access from trusted network range 192.168.1.0/24'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-SSH-SG-${EnvironmentSuffix}'
        - Key: Purpose
          Value: 'SSH Access Control'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: SecurityLevel
          Value: 'High'
    DeletionPolicy: Delete

  # S3 Access Logs Bucket (created first to avoid dependency issues)
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub
        - '${projectname}-access-logs-${environment}-${AWS::AccountId}-${region}'
        - projectname: !Ref ProjectName
          environment: !Ref EnvironmentSuffix
          region: !Ref 'AWS::Region'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Access-Logs-Bucket-${EnvironmentSuffix}'
        - Key: Purpose
          Value: 'S3 Access Logging'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: DataClassification
          Value: 'Internal'
    DeletionPolicy: Delete

  # Enhanced S3 Bucket with comprehensive security
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub
        - '${projectname}-secure-bucket-${environment}-${AWS::AccountId}-${region}'
        - projectname: !Ref ProjectName
          environment: !Ref EnvironmentSuffix
          region: !Ref 'AWS::Region'
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
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            TransitionInDays: 30
            StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            TransitionInDays: 90
            StorageClass: GLACIER
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 365
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Secure-Bucket-${EnvironmentSuffix}'
        - Key: Encryption
          Value: 'AES256-Enabled'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: BackupPolicy
          Value: 'Required'
        - Key: DataClassification
          Value: 'Confidential'
    DeletionPolicy: Delete

  # S3 Bucket Policy for additional encryption enforcement
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
              - !Sub '${SecureS3Bucket}'
            Condition:
              Bool:
                'aws:SecureTransport': false
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # CloudWatch Log Group for S3 events and monitoring
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-bucket-logs-${EnvironmentSuffix}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-S3-LogGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  # VPC Flow Logs for security monitoring
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-VPCFlowLog-Role-${EnvironmentSuffix}'
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPCFlowLog-Role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${EnvironmentSuffix}'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC-FlowLogs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Delete

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      LogFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC-FlowLogs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: 'Security Monitoring'
    DeletionPolicy: Delete

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-VPC-ID-${EnvironmentSuffix}'

  VPCCidr:
    Description: 'CIDR block of the VPC'
    Value: !Ref VpcCidr
    Export:
      Name: !Sub '${ProjectName}-VPC-CIDR-${EnvironmentSuffix}'

  PublicSubnet1Id:
    Description: 'ID of the public subnet in AZ1'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${ProjectName}-Public-Subnet-AZ1-ID-${EnvironmentSuffix}'

  PublicSubnet2Id:
    Description: 'ID of the public subnet in AZ2'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${ProjectName}-Public-Subnet-AZ2-ID-${EnvironmentSuffix}'

  PrivateSubnet1Id:
    Description: 'ID of the private subnet in AZ1'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-Private-Subnet-AZ1-ID-${EnvironmentSuffix}'

  PrivateSubnet2Id:
    Description: 'ID of the private subnet in AZ2'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-Private-Subnet-AZ2-ID-${EnvironmentSuffix}'

  SSHSecurityGroupId:
    Description: 'ID of the SSH Security Group'
    Value: !Ref SSHSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-SSH-SG-ID-${EnvironmentSuffix}'

  SecureS3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ProjectName}-Secure-S3-Bucket-Name-${EnvironmentSuffix}'

  SecureS3BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${ProjectName}-Secure-S3-Bucket-ARN-${EnvironmentSuffix}'

  S3AccessLogsBucketName:
    Description: 'Name of the S3 access logs bucket'
    Value: !Ref S3AccessLogsBucket
    Export:
      Name: !Sub '${ProjectName}-S3-AccessLogs-Bucket-Name-${EnvironmentSuffix}'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${ProjectName}-NAT-Gateway-ID-${EnvironmentSuffix}'

  VPCFlowLogGroupName:
    Description: 'Name of the VPC Flow Log Group'
    Value: !Ref VPCFlowLogGroup
    Export:
      Name: !Sub '${ProjectName}-VPC-FlowLog-Group-${EnvironmentSuffix}'
```

## Key Enhancements in This Ideal Response:

### 1. **Enhanced Parameter Validation**
- CIDR block validation using regex patterns
- Environment-specific allowed values
- Parameter grouping with CloudFormation Interface metadata

### 2. **Production-Ready Security Features**
- VPC Flow Logs for comprehensive network monitoring
- S3 bucket policies enforcing encryption and secure transport
- Separate access logging bucket with lifecycle policies
- Enhanced security group with detailed descriptions

### 3. **Operational Excellence**
- Comprehensive tagging strategy for cost allocation and management
- CloudWatch log groups with appropriate retention policies
- Proper deletion policies for clean stack removal
- Resource naming with environment suffixes for multi-environment support

### 4. **Advanced S3 Security**
- Mandatory encryption enforcement via bucket policy
- Access logging to separate audit bucket
- Lifecycle policies for cost optimization
- Versioning enabled for data protection

### 5. **High Availability Considerations**
- Separate route tables for each private subnet
- Proper dependencies and resource organization
- Support for multiple environments through parameterization

### 6. **Monitoring and Compliance**
- VPC Flow Logs for security monitoring
- CloudWatch integration for operational visibility
- Comprehensive tagging for governance and compliance

This template not only meets all your specified requirements but provides a production-ready, secure, and scalable foundation that follows AWS Well-Architected Framework principles. The infrastructure can be easily deployed across multiple environments while maintaining security best practices and operational excellence.