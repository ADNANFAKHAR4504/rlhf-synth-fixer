```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Environment - Production-Ready Deployment with Comprehensive Security Controls'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource tagging and configuration'

  DBUsername:
    Type: String
    Default: 'admin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    Description: 'Database administrator username'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: 'CIDR block for VPC'

  CloudTrailLogRetentionDays:
    Type: Number
    Default: 90
    MinValue: 1
    MaxValue: 3653
    Description: 'Number of days to retain CloudTrail logs'

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']

# =============================================================================
# RESOURCES
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # KMS ENCRYPTION KEY
  # ---------------------------------------------------------------------------
  MasterEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Master encryption key for secure environment'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-master-key'
        - Key: Environment
          Value: !Ref Environment

  MasterKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-master-key'
      TargetKeyId: !Ref MasterEncryptionKey

  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING
  # ---------------------------------------------------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets across multiple AZs
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidrBlock, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidrBlock, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Private Subnets across multiple AZs
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidrBlock, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidrBlock, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  # NAT Gateways for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'
        - Key: Environment
          Value: !Ref Environment

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-routes'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

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

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database - allows access from private subnets only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: !Select [2, !Cidr [!Ref VpcCidrBlock, 6, 8]]
          Description: 'Allow MySQL from private subnet 1'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: !Select [3, !Cidr [!Ref VpcCidrBlock, 6, 8]]
          Description: 'Allow MySQL from private subnet 2'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database-sg'
        - Key: Environment
          Value: !Ref Environment

  # Network ACL for additional security layer
  PrivateNetworkACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-nacl'
        - Key: Environment
          Value: !Ref Environment

  PrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidrBlock

  PrivateNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkACL
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  # ---------------------------------------------------------------------------
  # IAM ROLES AND POLICIES (LEAST PRIVILEGE)
  # ---------------------------------------------------------------------------
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-rds-monitoring-role'
        - Key: Environment
          Value: !Ref Environment

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetBucketAcl'
                  - 's3:PutBucketAcl'
                Resource:
                  - !GetAtt CloudTrailS3Bucket.Arn
                  - !Sub '${CloudTrailS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudtrail-role'
        - Key: Environment
          Value: !Ref Environment

  # IAM Group for operational management
  OperationsGroup:
    Type: AWS::IAM::Group
    Properties:
      Policies:
        - PolicyName: ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:Describe*'
                  - 'rds:Describe*'
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                  - 'cloudtrail:DescribeTrails'
                  - 'cloudtrail:GetTrailStatus'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'

  # ---------------------------------------------------------------------------
  # S3 BUCKET WITH SERVER-SIDE ENCRYPTION
  # ---------------------------------------------------------------------------
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref MasterEncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment

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
              - !GetAtt SecureS3Bucket.Arn
              - !Sub '${SecureS3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # ---------------------------------------------------------------------------
  # RDS DATABASE WITH AUTOMATIC MINOR VERSION UPGRADES
  # ---------------------------------------------------------------------------
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database - private subnets only'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'Database credentials for secure environment'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref MasterEncryptionKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-secret'
        - Key: Environment
          Value: !Ref Environment

  SecureDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.42'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref MasterEncryptionKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProduction, true, false]
      AutoMinorVersionUpgrade: true
      DeletionProtection: !If [IsProduction, true, false]
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-database'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # CLOUDTRAIL FOR COMPREHENSIVE API LOGGING
  # ---------------------------------------------------------------------------
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref MasterEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: CloudTrailLogRetention
            Status: Enabled
            ExpirationInDays: !Ref CloudTrailLogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudtrail-bucket'
        - Key: Environment
          Value: !Ref Environment

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: !If [IsProduction, 90, 30]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudtrail-logs'
        - Key: Environment
          Value: !Ref Environment

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      IsLogging: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: 
                - !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      KMSKeyId: !Ref MasterEncryptionKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # CLOUDWATCH MONITORING
  # ---------------------------------------------------------------------------
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${AWS::StackName}'
      RetentionInDays: !If [IsProduction, 90, 30]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-s3-logs'
        - Key: Environment
          Value: !Ref Environment

  DatabaseLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/${AWS::StackName}/database'
      RetentionInDays: !If [IsProduction, 90, 30]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database-logs'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarms for monitoring
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-database-cpu-high'
      AlarmDescription: 'Alarm when database CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureDatabase
      TreatMissingData: notBreaching

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-database-connections-high'
      AlarmDescription: 'Alarm when database connections exceed threshold'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 15
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureDatabase

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  VPCId:
    Description: 'ID of the secure VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetIds:
    Description: 'IDs of the public subnets'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnetIds:
    Description: 'IDs of the private subnets'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt SecureDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref MasterEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  CloudTrailArn:
    Description: 'CloudTrail ARN for API logging'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'

  CloudTrailS3Bucket:
    Description: 'S3 bucket for CloudTrail logs'
    Value: !Ref CloudTrailS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'
```