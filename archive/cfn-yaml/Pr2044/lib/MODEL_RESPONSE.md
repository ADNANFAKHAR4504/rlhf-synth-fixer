```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure infrastructure environment with VPC, subnets, NAT Gateway, S3 buckets, and IAM roles following least privilege principles'

Parameters:
  EnvironmentName:
    Description: An environment name that is prefixed to resource names
    Type: String
    Default: SecureInfra
  
  VpcCIDR:
    Description: CIDR block for this VPC
    Type: String
    Default: 10.192.0.0/16
    
  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in the first Availability Zone
    Type: String
    Default: 10.192.10.0/24
    
  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in the second Availability Zone
    Type: String
    Default: 10.192.11.0/24
    
  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in the first Availability Zone
    Type: String
    Default: 10.192.20.0/24
    
  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in the second Availability Zone
    Type: String
    Default: 10.192.21.0/24

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW

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
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ2

  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-Gateway

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Routes

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
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ1

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
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ2

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

  # S3 Buckets with Versioning Enabled
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-app-data-${AWS::AccountId}-${AWS::Region}
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ApplicationData

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-logs-${AWS::AccountId}-${AWS::Region}
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Logs

  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-backup-${AWS::AccountId}-${AWS::Region}
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Backup

  # IAM Roles with Least Privilege (No Wildcards)
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-Instance-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ApplicationDataAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:GetObjectVersion
                  - s3:ListBucket
                Resource:
                  - !Sub ${ApplicationDataBucket}
                  - !Sub ${ApplicationDataBucket}/*
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource:
                  - !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${EnvironmentName}
                  - !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${EnvironmentName}:*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ${EnvironmentName}-EC2-Instance-Profile
      Roles:
        - !Ref EC2InstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-Lambda-Execution-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                  - ec2:AttachNetworkInterface
                  - ec2:DetachNetworkInterface
                Resource:
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:network-interface/*
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:subnet/${PrivateSubnet1}
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:subnet/${PrivateSubnet2}
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:security-group/*
        - PolicyName: S3LogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub ${LogsBucket}
                  - !Sub ${LogsBucket}/*
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${EnvironmentName}-*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Lambda-Role

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-Backup-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3BackupAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:GetObjectVersion
                  - s3:ListBucket
                  - s3:ListBucketVersions
                Resource:
                  - !Sub ${BackupBucket}
                  - !Sub ${BackupBucket}/*
                  - !Sub ${ApplicationDataBucket}
                  - !Sub ${ApplicationDataBucket}/*
        - PolicyName: EC2BackupAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateSnapshot
                  - ec2:DescribeSnapshots
                  - ec2:DescribeVolumes
                  - ec2:CreateTags
                Resource:
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:volume/*
                  - !Sub arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:snapshot/*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Backup-Role

Outputs:
  VPC:
    Description: A reference to the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCID

  PublicSubnets:
    Description: A list of the public subnets
    Value: !Join [ ",", [ !Ref PublicSubnet1, !Ref PublicSubnet2 ]]
    Export:
      Name: !Sub ${EnvironmentName}-PUB-NETS

  PrivateSubnets:
    Description: A list of the private subnets
    Value: !Join [ ",", [ !Ref PrivateSubnet1, !Ref PrivateSubnet2 ]]
    Export:
      Name: !Sub ${EnvironmentName}-PRIV-NETS

  PublicSubnet1:
    Description: A reference to the public subnet in the 1st Availability Zone
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${EnvironmentName}-PUB1-SN

  PublicSubnet2:
    Description: A reference to the public subnet in the 2nd Availability Zone
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${EnvironmentName}-PUB2-SN

  PrivateSubnet1:
    Description: A reference to the private subnet in the 1st Availability Zone
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${EnvironmentName}-PRI1-SN

  PrivateSubnet2:
    Description: A reference to the private subnet in the 2nd Availability Zone
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${EnvironmentName}-PRI2-SN

  NatGateway1:
    Description: A reference to the NAT Gateway
    Value: !Ref NatGateway1
    Export:
      Name: !Sub ${EnvironmentName}-NAT1

  ApplicationDataBucket:
    Description: Name of the Application Data S3 bucket
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub ${EnvironmentName}-APP-DATA-BUCKET

  LogsBucket:
    Description: Name of the Logs S3 bucket
    Value: !Ref LogsBucket
    Export:
      Name: !Sub ${EnvironmentName}-LOGS-BUCKET

  BackupBucket:
    Description: Name of the Backup S3 bucket
    Value: !Ref BackupBucket
    Export:
      Name: !Sub ${EnvironmentName}-BACKUP-BUCKET

  EC2InstanceRole:
    Description: ARN of the EC2 Instance Role
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-EC2-ROLE-ARN

  EC2InstanceProfile:
    Description: Name of the EC2 Instance Profile
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub ${EnvironmentName}-EC2-INSTANCE-PROFILE

  LambdaExecutionRole:
    Description: ARN of the Lambda Execution Role
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-LAMBDA-ROLE-ARN

  BackupRole:
    Description: ARN of the Backup Role
    Value: !GetAtt BackupRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-BACKUP-ROLE-ARN
```