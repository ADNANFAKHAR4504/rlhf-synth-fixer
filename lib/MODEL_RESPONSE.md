```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure AWS foundation with multi-VPC architecture, least-privilege IAM, and encryption at rest'

Parameters:
  Environment:
    Type: String
    Default: 'Production'
    Description: 'Environment name for resource tagging'
    
  ApplicationName:
    Type: String
    Default: 'SecureApp'
    Description: 'Application name for resource tagging'
    
  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Owner for resource tagging'

  AllowedCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for management access'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

Mappings:
  NetworkConfig:
    us-west-2:
      AppVPCCIDR: '10.1.0.0/16'
      AppPrivateSubnet1CIDR: '10.1.1.0/24'
      AppPrivateSubnet2CIDR: '10.1.2.0/24'
      AppPublicSubnet1CIDR: '10.1.10.0/24'
      AppPublicSubnet2CIDR: '10.1.11.0/24'
      SharedVPCCIDR: '10.2.0.0/16'
      SharedPrivateSubnet1CIDR: '10.2.1.0/24'
      SharedPrivateSubnet2CIDR: '10.2.2.0/24'

Conditions:
  IsUSWest2: !Equals [!Ref 'AWS::Region', 'us-west-2']

Resources:
  # ========================================
  # KMS Keys for Encryption at Rest
  # ========================================
  ProdKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Production KMS key for encryption at rest'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption services
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - rds.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'prod-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 'alias/prod-encryption-key'
      TargetKeyId: !Ref ProdKMSKey

  # ========================================
  # Application VPC and Networking
  # ========================================
  ProdAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppVPCCIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'prod-vpc-app'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'prod-igw-app'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdAppVPC
      InternetGatewayId: !Ref ProdAppInternetGateway

  # Public Subnets
  ProdAppPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppPublicSubnet1CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: 'prod-subnet-app-public-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppPublicSubnet2CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: 'prod-subnet-app-public-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  ProdAppPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppPrivateSubnet1CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'prod-subnet-app-private-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppPrivateSubnet2CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'prod-subnet-app-private-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways
  ProdAppNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: ProdAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'prod-eip-nat-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdAppNATGateway1EIP.AllocationId
      SubnetId: !Ref ProdAppPublicSubnet1
      Tags:
        - Key: Name
          Value: 'prod-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  ProdAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdAppVPC
      Tags:
        - Key: Name
          Value: 'prod-rt-app-public'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdAppVPC
      Tags:
        - Key: Name
          Value: 'prod-rt-app-private'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdAppVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdAppPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdAppInternetGateway

  ProdAppPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdAppPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdAppNATGateway1

  # Route Table Associations
  ProdAppPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPublicSubnet1
      RouteTableId: !Ref ProdAppPublicRouteTable

  ProdAppPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPublicSubnet2
      RouteTableId: !Ref ProdAppPublicRouteTable

  ProdAppPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPrivateSubnet1
      RouteTableId: !Ref ProdAppPrivateRouteTable

  ProdAppPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPrivateSubnet2
      RouteTableId: !Ref ProdAppPrivateRouteTable

  # ========================================
  # Shared Services VPC
  # ========================================
  ProdSharedVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', SharedVPCCIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'prod-vpc-shared'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdSharedPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdSharedVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', SharedPrivateSubnet1CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'prod-subnet-shared-private-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdSharedPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdSharedVPC
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', SharedPrivateSubnet2CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'prod-subnet-shared-private-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # VPC Peering Connection
  ProdVPCPeeringConnection:
    Type: AWS::EC2::VPCPeeringConnection
    Properties:
      VpcId: !Ref ProdAppVPC
      PeerVpcId: !Ref ProdSharedVPC
      Tags:
        - Key: Name
          Value: 'prod-peering-app-shared'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # Security Groups
  # ========================================
  ProdWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'prod-sg-web'
      GroupDescription: 'Security group for web tier - minimal ingress/egress'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP from internet (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound'
      Tags:
        - Key: Name
          Value: 'prod-sg-web'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'prod-sg-app'
      GroupDescription: 'Security group for application tier'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup
          Description: 'Application port from web tier'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for API calls'
      Tags:
        - Key: Name
          Value: 'prod-sg-app'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'prod-sg-database'
      GroupDescription: 'Security group for database tier'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ProdAppSecurityGroup
          Description: 'PostgreSQL from application tier'
      Tags:
        - Key: Name
          Value: 'prod-sg-database'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdManagementSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'prod-sg-management'
      GroupDescription: 'Security group for management access'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCIDR
          Description: 'SSH from management network'
      Tags:
        - Key: Name
          Value: 'prod-sg-management'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # Network ACLs for Additional Security
  # ========================================
  ProdPrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref ProdAppVPC
      Tags:
        - Key: Name
          Value: 'prod-nacl-private'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdPrivateInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref ProdPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppVPCCIDR]

  ProdPrivateOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref ProdPrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  # ========================================
  # IAM Roles with Least Privilege
  # ========================================
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'prod-role-ec2-app'
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
        - PolicyName: 'prod-policy-ec2-minimal'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: 
                  - !Sub '${ProdS3Bucket}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ProdKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/prod-*'
      Tags:
        - Key: Name
          Value: 'prod-role-ec2-app'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'prod-profile-ec2-app'
      Roles:
        - !Ref ProdEC2Role

  ProdLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'prod-role-lambda-execution'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: 'prod-policy-lambda-minimal'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ProdKMSKey.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub '${ProdS3Bucket}/*'
      Tags:
        - Key: Name
          Value: 'prod-role-lambda-execution'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # S3 Bucket with Encryption
  # ========================================
  ProdS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref ProdS3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: 'prod-bucket-app-data'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  ProdS3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-bucket-access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: 'prod-bucket-access-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # VPC Endpoints for Secure Communication
  # ========================================
  ProdS3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref ProdAppVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref ProdAppPrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
            Resource:
              - !Sub '${ProdS3Bucket}/*'
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:ListBucket'
            Resource: !GetAtt ProdS3Bucket.Arn

  ProdKMSVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref ProdAppVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref ProdAppPrivateSubnet1
        - !Ref ProdAppPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProdVPCEndpointSecurityGroup
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: !GetAtt ProdKMSKey.Arn

  ProdVPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'prod-sg-vpc-endpoints'
      GroupDescription: 'Security group for VPC endpoints'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !FindInMap [NetworkConfig, !Ref 'AWS::Region', AppVPCCIDR]
          Description: 'HTTPS from VPC'
      Tags:
        - Key: Name
          Value: 'prod-sg-vpc-endpoints'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # CloudWatch Log Groups with Encryption
  # ========================================
  ProdApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/prod-application'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProdKMSKey.Arn
      Tags:
        - Key: Name
          Value: 'prod-logs-application'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref Owner

Outputs:
  AppVPCId:
    Description: 'Application VPC ID'
    Value: !Ref ProdAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-AppVPC-ID'

  SharedVPCId:
    Description: 'Shared Services VPC ID'
    Value: !Ref ProdSharedVPC
    Export:
      Name: !Sub '${AWS::StackName}-SharedVPC-ID'

  AppPrivateSubnets:
    Description: 'Application Private Subnet IDs'
    Value: !Join [',', [!Ref ProdAppPrivateSubnet1, !Ref ProdAppPrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-AppPrivateSubnets'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref ProdWebSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebSG-ID'

  AppSecurityGroupId:
    Description: 'Application Security Group ID'
    Value: !Ref ProdAppSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-AppSG-ID'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref ProdDatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSG-ID'

  KMSKeyId:
    Description: 'Production KMS Key ID'
    Value: !Ref ProdKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey-ID'

  KMSKeyArn:
    Description: 'Production KMS Key ARN'
    Value: !GetAtt ProdKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey-ARN'

  S3BucketName:
    Description: 'Production S3 Bucket Name'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket-Name'

  EC2RoleArn:
    Description: 'EC2 Instance Role ARN'
    Value: !GetAtt ProdEC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2Role-ARN'

  InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt ProdEC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-InstanceProfile-ARN'
```