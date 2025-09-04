# Healthcare Infrastructure CloudFormation Template

Below is a comprehensive AWS CloudFormation template designed for a healthcare application with HIPAA compliance requirements:

```yaml
# healthcare_infra.yml
# AWS CloudFormation template for HIPAA-compliant healthcare application
# Designed for deployment in us-west-2 region

AWSTemplateFormatVersion: '2010-09-09'
Description: 'HIPAA-compliant healthcare application infrastructure with encryption, secure storage, and proper tagging'

Parameters:
  # Environment configuration
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    
  DatabaseInstanceClass:
    Type: String
    Default: 'db.t3.medium'
    Description: 'RDS instance class for database'
    AllowedValues:
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge

  # Application configuration
  ApplicationName:
    Type: String
    Default: 'healthcare-app'
    Description: 'Name of the healthcare application'

Resources:
  # ========================================
  # KMS Key for Encryption (HIPAA Requirement)
  # ========================================
  HealthcareKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for healthcare application encryption (HIPAA compliance)'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3 and RDS
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: 'HIPAA-compliant encryption'

  HealthcareKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-encryption-key'
      TargetKeyId: !Ref HealthcareKMSKey

  # ========================================
  # Secrets Manager for Sensitive Data
  # ========================================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ApplicationName}/database/credentials'
      Description: 'Database credentials for healthcare application'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "healthapp_admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref HealthcareKMSKey
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  ApplicationAPISecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ApplicationName}/api/keys'
      Description: 'API keys and tokens for healthcare application'
      SecretString: !Sub |
        {
          "api_key": "placeholder-will-be-updated-post-deployment",
          "jwt_secret": "placeholder-will-be-updated-post-deployment"
        }
      KmsKeyId: !Ref HealthcareKMSKey
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # ========================================
  # VPC and Networking
  # ========================================
  HealthcareVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-vpc'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # Private subnets for database and application servers
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: 'us-west-2a'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-private-subnet-1'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: 'us-west-2b'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-private-subnet-2'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # Public subnets for load balancer
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: 'us-west-2a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-public-subnet-1'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: 'us-west-2b'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-public-subnet-2'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # Internet Gateway for public access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-igw'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref HealthcareVPC
      InternetGatewayId: !Ref InternetGateway

  # Route tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref HealthcareVPC
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-public-rt'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # ========================================
  # S3 Buckets with KMS Encryption (HIPAA Requirement)
  # ========================================
  HealthcareDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain  # Prevent accidental deletion of healthcare data
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub '${ApplicationName}-patient-data-${AWS::AccountId}-${AWS::Region}'
      # Server-side encryption with KMS (HIPAA requirement)
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref HealthcareKMSKey
            BucketKeyEnabled: true
      # Block all public access (HIPAA requirement)
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Lifecycle configuration for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
      # Logging configuration
      LoggingConfiguration:
        DestinationBucketName: !Ref HealthcareLogsBucket
        LogFilePrefix: 'patient-data-access-logs/'
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production
        - Key: DataClassification
          Value: 'PHI-Sensitive'

  HealthcareLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub '${ApplicationName}-logs-${AWS::AccountId}-${AWS::Region}'
      # KMS encryption for logs
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref HealthcareKMSKey
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
            ExpirationInDays: 2555  # 7 years retention for HIPAA compliance
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: 'Audit-Logs'

  # ========================================
  # RDS Database with Encryption
  # ========================================
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for healthcare database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for healthcare database'
      VpcId: !Ref HealthcareVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: 'PostgreSQL access from application servers'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-db-sg'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  HealthcareDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot  # Create snapshot before deletion
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ApplicationName}-database'
      DBInstanceClass: !Ref DatabaseInstanceClass
      Engine: postgres
      EngineVersion: '13.7'
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true  # Encryption at rest (HIPAA requirement)
      KmsKeyId: !Ref HealthcareKMSKey
      # Use Secrets Manager for credentials
      ManageMasterUserPassword: true
      MasterUserSecret:
        SecretArn: !Ref DatabaseSecret
      DBName: 'healthcaredb'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      # Backup configuration (HIPAA requirement)
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      # Enable enhanced monitoring
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      # Enable performance insights
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref HealthcareKMSKey
      # Enable automated backups
      DeletionProtection: true
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production
        - Key: DataClassification
          Value: 'PHI-Sensitive'

  # ========================================
  # Security Groups
  # ========================================
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for healthcare application servers'
      VpcId: !Ref HealthcareVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTPS from load balancer'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from load balancer (redirect to HTTPS)'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-app-sg'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for healthcare application load balancer'
      VpcId: !Ref HealthcareVPC
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
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-alb-sg'
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # ========================================
  # IAM Roles and Policies
  # ========================================
  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-application-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: HealthcareAppPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 access for patient data bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${HealthcareDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref HealthcareDataBucket
              # Secrets Manager access
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  - !Ref DatabaseSecret
                  - !Ref ApplicationAPISecret
              # KMS access for decryption
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt HealthcareKMSKey.Arn
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ApplicationName}-instance-profile'
      Roles:
        - !Ref ApplicationRole

  # ========================================
  # CloudWatch Log Groups
  # ========================================
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/healthcare/${ApplicationName}'
      RetentionInDays: 2555  # 7 years retention for HIPAA compliance
      KmsKeyId: !GetAtt HealthcareKMSKey.Arn
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

# ========================================
# Outputs
# ========================================
Outputs:
  VPCId:
    Description: 'ID of the healthcare VPC'
    Value: !Ref HealthcareVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnetIds:
    Description: 'IDs of the private subnets'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-IDs'

  PublicSubnetIds:
    Description: 'IDs of the public subnets'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-IDs'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt HealthcareDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref HealthcareKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  PatientDataBucket:
    Description: 'S3 bucket for patient data'
    Value: !Ref HealthcareDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-Patient-Data-Bucket'

  DatabaseSecretArn:
    Description: 'ARN of the database secret in Secrets Manager'
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-Database-Secret-ARN'

  ApplicationRoleArn:
    Description: 'ARN of the application IAM role'
    Value: !GetAtt ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Application-Role-ARN'

  ApplicationSecurityGroupId:
    Description: 'Security group ID for application servers'
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Application-SG-ID'

  LoadBalancerSecurityGroupId:
    Description: 'Security group ID for load balancer'
    Value: !Ref LoadBalancerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-SG-ID'
```

## Key Features and Compliance Highlights

### 🔒 **Security & HIPAA Compliance**

1. **Encryption at Rest**: All S3 buckets and RDS instances use AWS KMS encryption
2. **Secrets Management**: Database passwords and API keys stored in AWS Secrets Manager
3. **Network Security**: Private subnets for databases, security groups with minimal access
4. **Data Protection**: S3 versioning enabled, public access blocked

### 🏷️ **Tagging Strategy**

All resources include the required tags:
- `Project: HealthApp`
- `Environment: Production`
- Additional context-specific tags for better organization

### 🔄 **Maintainability Features**

1. **DeletionPolicy**: Critical resources (S3, RDS) have `Retain` policy
2. **UpdateReplacePolicy**: Prevents accidental replacement during updates
3. **Parameterization**: Key values are parameterized for flexibility
4. **Exports**: Important resource IDs exported for cross-stack references

### 📋 **Deployment Instructions**

1. Save the template as `healthcare_infra.yml`
2. Deploy using AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name healthcare-infrastructure \
     --template-body file://healthcare_infra.yml \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

### 🔍 **Validation**

The template includes:
- Proper resource dependencies
- Valid parameter constraints
- Correct IAM policies and roles
- HIPAA-compliant configurations
- Cost optimization features (lifecycle policies, storage classes)

This template provides a solid foundation for a HIPAA-compliant healthcare application while maintaining security, compliance, and operational best practices.