```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket for data science team with VPC endpoint and KMS encryption'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Environment suffix for the deployment'
    Default: dev

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  # Only create access logging resources in production
  IsProdEnvironment: !Equals [!Ref EnvironmentSuffix, prod]

# =============================================================================
# RESOURCES
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # NETWORKING INFRASTRUCTURE
  # ---------------------------------------------------------------------------

  # VPC for secure networking
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'secure-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private subnet for VPC endpoint
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway for NAT Gateway connectivity (if needed for updates)
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Public subnet for NAT Gateway
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateway for outbound internet access from private subnet
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route table for public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate public subnet with public route table
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Route table for private subnet
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route to NAT Gateway for outbound internet access
  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Associate private subnet with private route table
  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  # ---------------------------------------------------------------------------
  # IAM ROLE FOR DATA SCIENTISTS
  # ---------------------------------------------------------------------------

  # IAM role for data scientists to access the S3 bucket
  DataScientistRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'DataScientistRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Policies:
        - PolicyName: SecureDataAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                  - s3:GetBucketLocation
                Resource:
                  - !Sub 'arn:aws:s3:::secure-datascience-${AWS::AccountId}-${EnvironmentSuffix}'
                  - !Sub 'arn:aws:s3:::secure-datascience-${AWS::AccountId}-${EnvironmentSuffix}/*'
      Tags:
        - Key: Name
          Value: !Sub 'data-scientist-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ---------------------------------------------------------------------------
  # KMS ENCRYPTION KEY
  # ---------------------------------------------------------------------------

  # Custom KMS key for S3 bucket encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for secure S3 bucket encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full access for management
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

          # Allow DataScientistRole to use the key
          - Sid: Allow DataScientist Role
            Effect: Allow
            Principal:
              AWS: !GetAtt DataScientistRole.Arn
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

          # Allow S3 service to use the key
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 's3-encryption-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # KMS key alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/s3-secure-data-${EnvironmentSuffix}'
      TargetKeyId: !Ref S3EncryptionKey

  # ---------------------------------------------------------------------------
  # CLOUDTRAIL LOGGING
  # ---------------------------------------------------------------------------

  # Dedicated S3 bucket for CloudTrail logs
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}'
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
          Value: !Sub 'cloudtrail-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudTrail bucket policy to allow CloudTrail service access
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
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-${EnvironmentSuffix}'

  # CloudTrail for audit logging
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}-${EnvironmentSuffix}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudTrail trail for S3 and KMS activity
  CloudTrailTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${AWS::StackName}-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogsRole.Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      IsLogging: true
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM role for CloudTrail to write to CloudWatch Logs
  CloudTrailLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'CloudTrailLogsRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource:
                  - !GetAtt CloudTrailBucket.Arn
                  - !Sub '${CloudTrailBucket.Arn}/cloudtrail-logs/*'
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-logs-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ---------------------------------------------------------------------------
  # S3 VPC ENDPOINT
  # ---------------------------------------------------------------------------

  # Security group for VPC endpoint
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'vpc-endpoint-sg-${EnvironmentSuffix}'
      GroupDescription: !Sub 'Security group for VPC endpoint access - ${EnvironmentSuffix}'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.1.0/24 # Private subnet CIDR
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0 # Allow HTTPS outbound to S3
      Tags:
        - Key: Name
          Value: !Sub 'vpc-endpoint-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # VPC Endpoint for S3 (Gateway type)
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource: '*'

  # ---------------------------------------------------------------------------
  # ACCESS LOGGING BUCKET (PROD ONLY)
  # ---------------------------------------------------------------------------

  # S3 bucket for access logging (only in production)
  AccessLogBucket:
    Type: AWS::S3::Bucket
    Condition: IsProdEnvironment
    Properties:
      BucketName: !Sub 'access-logs-${AWS::AccountId}-${EnvironmentSuffix}'
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
          Value: !Sub 'access-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ---------------------------------------------------------------------------
  # MAIN SECURE S3 BUCKET
  # ---------------------------------------------------------------------------

  # Main secure S3 bucket for data science team
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-datascience-${AWS::AccountId}-${EnvironmentSuffix}'

      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled

      # KMS encryption using custom key
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true

      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

      # Enable access logging only in production
      LoggingConfiguration: !If
        - IsProdEnvironment
        - DestinationBucketName: !Ref AccessLogBucket
          LogFilePrefix: 'access-logs/'
        - !Ref AWS::NoValue

      # Lifecycle configuration
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER

      Tags:
        - Key: Name
          Value: !Sub 'secure-data-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Team
          Value: DataScience

  # ---------------------------------------------------------------------------
  # S3 BUCKET POLICY
  # ---------------------------------------------------------------------------

  # Bucket policy for secure access control
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow DataScientistRole to get and put objects (only through VPC endpoint)
          - Sid: AllowDataScientistAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/DataScientistRole-${EnvironmentSuffix}'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - !Sub 'arn:aws:s3:::secure-datascience-${AWS::AccountId}-${EnvironmentSuffix}'
              - !Sub 'arn:aws:s3:::secure-datascience-${AWS::AccountId}-${EnvironmentSuffix}/*'
            Condition:
              StringEquals:
                'aws:SourceVpce': !Ref S3VPCEndpoint

          # Note: CloudTrail service access is allowed above
          # VPC endpoint security is enforced at the network level through routing

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'

  KMSKeyId:
    Description: 'KMS Key ID for bucket encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyAlias:
    Description: 'KMS Key Alias for bucket encryption'
    Value: !Ref S3EncryptionKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'

  VPCEndpointId:
    Description: 'VPC Endpoint ID for S3 access'
    Value: !Ref S3VPCEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-VPCEndpointId'

  VPCId:
    Description: 'VPC ID for the secure network'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetId'

  AccessLogBucket:
    Condition: IsProdEnvironment
    Description: 'Access log bucket name (prod only)'
    Value: !Ref AccessLogBucket
    Export:
      Name: !Sub '${AWS::StackName}-AccessLogBucket'

  Environment:
    Description: 'Deployment environment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 bucket name for audit logs'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  CloudTrailTrailName:
    Description: 'CloudTrail trail name for audit logging'
    Value: !Ref CloudTrailTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailTrailName'

  CloudTrailLogGroupName:
    Description: 'CloudTrail CloudWatch Logs group name'
    Value: !Ref CloudTrailLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailLogGroupName'

  VPCEndpointSecurityGroupId:
    Description: 'Security group ID for VPC endpoint access'
    Value: !Ref VPCEndpointSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-VPCEndpointSecurityGroupId'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetId'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

  NATGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayId'

  NATGatewayEIP:
    Description: 'NAT Gateway Elastic IP'
    Value: !Ref NATGatewayEIP
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayEIP'

  PrivateRouteTableId:
    Description: 'Private Route Table ID'
    Value: !Ref PrivateRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-PrivateRouteTableId'

  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-PublicRouteTableId'

  BucketDomainName:
    Description: 'S3 Bucket Domain Name'
    Value: !GetAtt SecureS3Bucket.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-BucketDomainName'

  BucketRegionalDomainName:
    Description: 'S3 Bucket Regional Domain Name'
    Value: !GetAtt SecureS3Bucket.RegionalDomainName
    Export:
      Name: !Sub '${AWS::StackName}-BucketRegionalDomainName'

  KMSKeyArn:
    Description: 'KMS Key ARN for bucket encryption'
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  DataScientistRoleArn:
    Description: 'ARN of the DataScientist IAM Role'
    Value: !GetAtt DataScientistRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataScientistRoleArn'

  DataScientistRoleName:
    Description: 'Name of the DataScientist IAM Role'
    Value: !Ref DataScientistRole
    Export:
      Name: !Sub '${AWS::StackName}-DataScientistRoleName'
```
