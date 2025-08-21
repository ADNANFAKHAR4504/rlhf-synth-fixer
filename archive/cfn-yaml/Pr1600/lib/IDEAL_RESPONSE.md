```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Production-grade AWS infrastructure with VPC, public subnets, NAT Gateway, 
  S3 logging bucket, IAM roles, and security groups following AWS best practices

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VPCCIDRBlock
          - PublicSubnet1CIDRBlock
          - PublicSubnet2CIDRBlock
      - Label:
          default: 'Security Configuration'
        Parameters:
          - SSHAllowedCIDR
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentName
          - S3BucketPrefix

Parameters:
  VPCCIDRBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^10\.0\.0\.0/16$'
    ConstraintDescription: 'Must be 10.0.0.0/16 as per requirements'

  PublicSubnet1CIDRBlock:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'
    AllowedPattern: '^10\.0\.1\.0/24$'
    ConstraintDescription: 'Must be 10.0.1.0/24 as per requirements'

  PublicSubnet2CIDRBlock:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'
    AllowedPattern: '^10\.0\.2\.0/24$'
    ConstraintDescription: 'Must be 10.0.2.0/24 as per requirements'

  SSHAllowedCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^203\.0\.113\.0/24$'
    ConstraintDescription: 'Must be 203.0.113.0/24 as per security requirements'


  EnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Environment name for tagging'
    AllowedValues: ['Production']
    ConstraintDescription: 'Must be Production as per requirements'

  S3BucketPrefix:
    Type: String
    Default: 'production-logs'
    Description: 'Prefix for S3 bucket name (will be suffixed with account ID and region)'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'



Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDRBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet 1 (AZ 1)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDRBlock
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  # Public Subnet 2 (AZ 2)
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDRBlock
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-PublicSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NATGW-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName

  # NAT Gateway in Public Subnet 1
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NATGW'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-PublicRouteTable'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Public Route to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet 1 with Public Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  # Associate Public Subnet 2 with Public Route Table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # S3 Bucket for Logging with Versioning
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketPrefix}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
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
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-LoggingBucket'
        - Key: Environment
          Value: !Ref EnvironmentName

  # S3 Bucket Policy to enforce secure transport
  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
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

  # IAM Role for EC2 Instances (Least Privilege)
  EC2LoggingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3LoggingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: WriteLogsToS3
                Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${LoggingBucket.Arn}/*'
              - Sid: ListBucket
                Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                Resource: !GetAtt LoggingBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2LoggingRole'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Instance Profile for EC2 Role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2LoggingRole

  # Security Group for SSH Access
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'Security group for SSH access from ${SSHAllowedCIDR}'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
          Description: !Sub 'SSH access from ${SSHAllowedCIDR}'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for package updates and S3 access'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SSHSecurityGroup'
        - Key: Environment
          Value: !Ref EnvironmentName

  # VPC Flow Logs for security monitoring
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPCFlowLogRole'
        - Key: Environment
          Value: !Ref EnvironmentName

  # CloudWatch Log Group for VPC Flow Logs
  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${EnvironmentName}'
      RetentionInDays: 30

  # VPC Flow Logs
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
          Value: !Sub '${EnvironmentName}-VPCFlowLog'
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  S3BucketName:
    Description: 'S3 Logging Bucket Name'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  NATGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway-ID'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGateway-ID'

  EC2LoggingRoleArn:
    Description: 'EC2 Logging Role ARN'
    Value: !GetAtt EC2LoggingRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2LoggingRole-ARN'

  SSHSecurityGroupId:
    Description: 'SSH Security Group ID'
    Value: !Ref SSHSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SSHSecurityGroup-ID'

  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref AWS::StackName

  Region:
    Description: 'AWS Region'
    Value: !Ref AWS::Region
    ```