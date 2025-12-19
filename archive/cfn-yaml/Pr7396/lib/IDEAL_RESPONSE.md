```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure environment setup with VPC, EC2, RDS, S3, and monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

  VpcCidrBlock:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    ConstraintDescription: Must be a valid CIDR range of the form x.x.x.x/16-28

  PublicSubnet1CidrBlock:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for the first public subnet
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'

  PrivateSubnet1CidrBlock:
    Type: String
    Default: 10.0.10.0/24
    Description: CIDR block for the first private subnet
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'

  PrivateSubnet2CidrBlock:
    Type: String
    Default: 10.0.11.0/24
    Description: CIDR block for the second private subnet
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'

  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: The database instance type
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.t3.large
      - db.t3.xlarge
      - db.t3.2xlarge
    ConstraintDescription: Must be a valid RDS instance type

  DBMasterUsername:
    Type: String
    Default: admin
    Description: The database admin account username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  EC2InstanceType:
    Type: String
    Default: t2.micro
    Description: EC2 instance type
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
      - t2.large
      - t2.xlarge
      - t2.2xlarge
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - t3.2xlarge
    ConstraintDescription: Must be a valid EC2 instance type

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc"

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw"

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CidrBlock
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1"

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CidrBlock
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1"

  # Private Subnet 2 (for RDS Multi-AZ)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CidrBlock
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2"

  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip"

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway"

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt"

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

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt"

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances - HTTPS only
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg"

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg"

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-bucket"
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
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-bucket"

  # CloudWatch Log Group
  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-log-group"
      RetentionInDays: 7

  # CloudTrail Bucket
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-trail-bucket"
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
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail-bucket"

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  # IAM Role for EC2
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Ref S3ReadAccessPolicy
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"

  S3ReadAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-S3ReadAccess"
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
              - s3:GetBucketLocation
              - s3:GetBucketVersioning
              - s3:GetObjectVersion
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub "${S3Bucket.Arn}/*"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"
      Roles:
        - !Ref EC2Role

  # KMS Key for RDS
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for RDS encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: kms:*
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-kms-key"

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-key"
      TargetKeyId: !Ref RDSKMSKey

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"
      DBSubnetGroupDescription: Subnet group for RDS instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-secret"
      Description: RDS master password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template"
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance"

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 1
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-instance"
          PropagateAtLaunch: true

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail"
      S3BucketName: !Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: !GetAtt CloudWatchLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudtrail-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudWatchLogGroup.Arn

Outputs:
  # Networking Outputs
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPCId"

  VPCCidrBlock:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPCCidrBlock"

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-InternetGatewayId"

  NatGatewayId:
    Description: NAT Gateway ID
    Value: !Ref NatGateway
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NatGatewayId"

  NatGatewayEIP:
    Description: NAT Gateway Elastic IP
    Value: !Ref NatGatewayEIP
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NatGatewayEIP"

  # Subnet Outputs
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet1Id"

  PublicSubnet1CidrBlock:
    Description: Public Subnet 1 CIDR Block
    Value: !Ref PublicSubnet1CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet1CidrBlock"

  PublicSubnet1AZ:
    Description: Public Subnet 1 Availability Zone
    Value: !GetAtt PublicSubnet1.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet1AZ"

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet1Id"

  PrivateSubnet1CidrBlock:
    Description: Private Subnet 1 CIDR Block
    Value: !Ref PrivateSubnet1CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet1CidrBlock"

  PrivateSubnet1AZ:
    Description: Private Subnet 1 Availability Zone
    Value: !GetAtt PrivateSubnet1.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet1AZ"

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet2Id"

  PrivateSubnet2CidrBlock:
    Description: Private Subnet 2 CIDR Block
    Value: !Ref PrivateSubnet2CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet2CidrBlock"

  PrivateSubnet2AZ:
    Description: Private Subnet 2 Availability Zone
    Value: !GetAtt PrivateSubnet2.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet2AZ"

  # Route Table Outputs
  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PublicRouteTableId"

  PrivateRouteTableId:
    Description: Private Route Table ID
    Value: !Ref PrivateRouteTable
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateRouteTableId"

  # Security Group Outputs
  EC2SecurityGroupId:
    Description: EC2 Security Group ID
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EC2SecurityGroupId"

  RDSSecurityGroupId:
    Description: RDS Security Group ID
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSSecurityGroupId"

  # S3 Bucket Outputs
  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3BucketName"

  S3BucketArn:
    Description: S3 Bucket ARN
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3BucketArn"

  S3BucketDomainName:
    Description: S3 Bucket Domain Name
    Value: !GetAtt S3Bucket.DomainName
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3BucketDomainName"

  CloudTrailBucketName:
    Description: CloudTrail S3 Bucket Name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudTrailBucketName"

  CloudTrailBucketArn:
    Description: CloudTrail S3 Bucket ARN
    Value: !GetAtt CloudTrailBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudTrailBucketArn"

  # RDS Outputs
  RDSInstanceId:
    Description: RDS Instance ID
    Value: !Ref RDSInstance
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSInstanceId"

  RDSEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSEndpoint"

  RDSPort:
    Description: RDS Instance Port
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSPort"

  RDSConnectionString:
    Description: RDS Connection String (without password)
    Value: !Sub "mysql://${DBMasterUsername}@${RDSInstance.Endpoint.Address}:${RDSInstance.Endpoint.Port}"
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSConnectionString"

  RDSSecretArn:
    Description: RDS Secret ARN for password retrieval
    Value: !Ref RDSSecret
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSSecretArn"

  DBSubnetGroupName:
    Description: DB Subnet Group Name
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-DBSubnetGroupName"

  # KMS Outputs
  RDSKMSKeyId:
    Description: RDS KMS Key ID
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSKMSKeyId"

  RDSKMSKeyArn:
    Description: RDS KMS Key ARN
    Value: !GetAtt RDSKMSKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSKMSKeyArn"

  RDSKMSKeyAlias:
    Description: RDS KMS Key Alias
    Value: !Ref RDSKMSKeyAlias
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-RDSKMSKeyAlias"

  # IAM Outputs
  EC2RoleArn:
    Description: EC2 IAM Role ARN
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EC2RoleArn"

  EC2RoleName:
    Description: EC2 IAM Role Name
    Value: !Ref EC2Role
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EC2RoleName"

  EC2InstanceProfileArn:
    Description: EC2 Instance Profile ARN
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EC2InstanceProfileArn"

  S3ReadAccessPolicyArn:
    Description: S3 Read Access Policy ARN
    Value: !Ref S3ReadAccessPolicy
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3ReadAccessPolicyArn"

  CloudTrailRoleArn:
    Description: CloudTrail IAM Role ARN
    Value: !GetAtt CloudTrailRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudTrailRoleArn"

  # EC2 and Auto Scaling Outputs
  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-LaunchTemplateId"

  LaunchTemplateVersion:
    Description: Launch Template Latest Version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-LaunchTemplateVersion"

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-AutoScalingGroupName"

  AutoScalingGroupArn:
    Description: Auto Scaling Group ARN
    Value: !Sub "arn:aws:autoscaling:${AWS::Region}:${AWS::AccountId}:autoScalingGroup:*:autoScalingGroupName/${AutoScalingGroup}"
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-AutoScalingGroupArn"

  # CloudWatch and Monitoring Outputs
  CloudWatchLogGroupName:
    Description: CloudWatch Log Group Name
    Value: !Ref CloudWatchLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudWatchLogGroupName"

  CloudWatchLogGroupArn:
    Description: CloudWatch Log Group ARN
    Value: !GetAtt CloudWatchLogGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudWatchLogGroupArn"

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudTrailName"

  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-CloudTrailArn"

  # Stack Information Outputs
  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-StackName"

  Region:
    Description: AWS Region
    Value: !Ref AWS::Region
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Region"

  EnvironmentSuffix:
    Description: Environment Suffix used for resources
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EnvironmentSuffix"
```