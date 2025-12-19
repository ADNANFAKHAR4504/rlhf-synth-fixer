```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC - AWS Nova Model Breaking - Multi-Region, Multi-Environment Infrastructure'

# ============================================================================
# PARAMETERS SECTION
# ============================================================================
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - testing
      - production
    Description: 'Target environment for deployment'
    
  ProjectName:
    Type: String
    Default: 'IaC-AWS-Nova-Model-Breaking'
    Description: 'Project name for resource tagging'

# ============================================================================
# MAPPINGS SECTION - Region and Environment Specific Values
# ============================================================================
Mappings:
  # Region-specific AMI mappings
  RegionMap:
    us-west-2:
      AvailabilityZone1: us-west-2a
      AvailabilityZone2: us-west-2b
    us-east-1:
      AvailabilityZone1: us-east-1a
      AvailabilityZone2: us-east-1b
  
  # Environment-specific instance configurations
  EnvironmentMap:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
      DBInstanceClass: db.t3.micro
      DBAllocatedStorage: 20
    testing:
      InstanceType: t3.small
      MinSize: 1
      MaxSize: 3
      DBInstanceClass: db.t3.small
      DBAllocatedStorage: 50
    production:
      InstanceType: t3.medium
      MinSize: 2
      MaxSize: 10
      DBInstanceClass: db.t3.medium
      DBAllocatedStorage: 100

# ============================================================================
# CONDITIONS SECTION - Environment-based Logic
# ============================================================================
Conditions:
  IsProduction: !Equals [!Ref Environment, 'production']

# ============================================================================
# RESOURCES SECTION
# ============================================================================
Resources:
  
  # ========================================
  # IAM RESOURCES
  # ========================================
  
  # EC2 Instance Role
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2Role-${Environment}-${AWS::Region}'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
      Tags:
        - Key: Name
          Value: !Sub 'EC2Role-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2Profile-${Environment}-${AWS::Region}'
      Roles:
        - !Ref EC2InstanceRole

  # ========================================
  # VPC AND NETWORKING RESOURCES
  # ========================================
  
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet1-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet2-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone1]
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet1-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone2]
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet2-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PublicRouteTable-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Public Route
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Public Subnets with Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # ========================================
  # SECURITY GROUPS
  # ========================================
  
  # Web Server Security Group
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'WebServerSG-${Environment}-${AWS::Region}'
      GroupDescription: 'Security group for web servers'
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
        - !If
          - IsProduction
          - IpProtocol: tcp
            FromPort: 22
            ToPort: 22
            CidrIp: 10.0.0.0/16
            Description: 'SSH access from VPC only (Production)'
          - IpProtocol: tcp
            FromPort: 22
            ToPort: 22
            CidrIp: 0.0.0.0/0
            Description: 'SSH access from anywhere (Non-Production)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'WebServerSG-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Database Security Group
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'DatabaseSG-${Environment}-${AWS::Region}'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSG-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # EC2 INSTANCES
  # ========================================
  
  # Web Server Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
      InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Hello from ${Environment} in ${AWS::Region}</h1>" > /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub 'WebServer-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Elastic IP for Web Server (Production only)
  WebServerEIP:
    Type: AWS::EC2::EIP
    Condition: IsProduction
    Properties:
      InstanceId: !Ref WebServerInstance
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'WebServerEIP-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # S3 RESOURCES
  # ========================================
  
  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-bucket-${Environment}-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: !If [IsProduction, Enabled, Suspended]
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - !If
            - IsProduction
            - Id: TransitionToIA
              Status: Enabled
              Transitions:
                - TransitionInDays: 30
                  StorageClass: STANDARD_IA
                - TransitionInDays: 90
                  StorageClass: GLACIER
            - !Ref 'AWS::NoValue'
      Tags:
        - Key: Name
          Value: !Sub 'AppBucket-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket Policy
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${S3Bucket}/*'
              - !Sub 'arn:aws:s3:::${S3Bucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ========================================
  # RDS RESOURCES
  # ========================================
  
  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'db-subnet-group-${Environment}-${AWS::Region}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'DBSubnetGroup-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # DB Parameter Group
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub 'db-params-${Environment}-${AWS::Region}'
      Description: 'Parameter group for MySQL database'
      Family: mysql8.0
      Parameters:
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}'
      Tags:
        - Key: Name
          Value: !Sub 'DBParameterGroup-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment

  # Secrets Manager Secret for RDS Password
  RDSPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'rds-password-${Environment}'
      Description: !Sub 'RDS master password for ${Environment} environment'
      GenerateSecretString:
        SecretStringTemplate: '{"username":"admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\\'

  # RDS Database Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    # DeletionPolicy: !If [IsProduction, Snapshot, Delete]
    # UpdateReplacePolicy: !If [IsProduction, Snapshot, Delete]
    Properties:
      DBInstanceIdentifier: !Sub 'database-${Environment}-${AWS::Region}'
      DBInstanceClass: !FindInMap [EnvironmentMap, !Ref Environment, DBInstanceClass]
      Engine: mysql
      EngineVersion: '8.0.37'
      AllocatedStorage: !FindInMap [EnvironmentMap, !Ref Environment, DBAllocatedStorage]
      StorageType: gp2
      StorageEncrypted: !If [IsProduction, true, false]
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSPasswordSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !If [IsProduction, true, false]
      PubliclyAccessible: false
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub 'Database-${Environment}-${AWS::Region}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

# ============================================================================
# OUTPUTS SECTION
# ============================================================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  WebServerInstanceId:
    Description: 'Web Server Instance ID'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-ID'

  WebServerPublicIP:
    Description: 'Web Server Public IP'
    Value: !GetAtt WebServerInstance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-PublicIP'

  WebServerElasticIP:
    Condition: IsProduction
    Description: 'Web Server Elastic IP (Production only)'
    Value: !Ref WebServerEIP
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-EIP'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  DatabasePort:
    Description: 'RDS Database Port'
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-Database-Port'
```
