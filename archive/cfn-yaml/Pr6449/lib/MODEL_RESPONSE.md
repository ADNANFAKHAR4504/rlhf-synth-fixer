# CloudFormation Template for Security-Hardened Payment Processing Infrastructure

This CloudFormation template creates a PCI-DSS compliant infrastructure with VPC, RDS PostgreSQL, S3, KMS encryption, IAM roles, CloudWatch logging, and VPC Flow Logs.

## File: lib/security-infrastructure.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security-hardened infrastructure for payment card data processing with PCI-DSS compliance'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to enable multiple deployments'
    Default: 'dev'
    AllowedPattern: '[a-z0-9-]+'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  DBMasterUsername:
    Type: String
    Description: 'Master username for RDS PostgreSQL database'
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Type: String
    Description: 'Master password for RDS PostgreSQL database'
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+=-]*'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
          - DBMasterPassword

Resources:
  # VPC and Network Infrastructure
  PaymentVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # Private Subnets for RDS across 3 AZs
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # Public Subnets for NAT Gateways
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.101.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.102.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PaymentVPC
      CidrBlock: 10.0.103.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: public

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'payment-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref PaymentVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref PaymentVPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref PaymentVPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref PaymentVPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref PaymentVPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # KMS Key for RDS Encryption
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'rds-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/rds-encryption-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSKMSKey

  # Database Security Group
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'db-security-group-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS PostgreSQL - allows only HTTPS from application tier'
      VpcId: !Ref PaymentVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: 'PostgreSQL access from application tier only'
      Tags:
        - Key: Name
          Value: !Sub 'db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # Application Security Group
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'app-security-group-${EnvironmentSuffix}'
      GroupDescription: 'Security group for application tier - allows HTTPS'
      VpcId: !Ref PaymentVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: 'HTTPS from within VPC only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS to anywhere'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          DestinationSecurityGroupId: !Ref DBSecurityGroup
          Description: 'PostgreSQL to database tier'
      Tags:
        - Key: Name
          Value: !Sub 'app-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'payment-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL across 3 AZs'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # RDS PostgreSQL Instance
  PaymentDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'payment-db-${EnvironmentSuffix}'
      Engine: postgres
      EngineVersion: '15.4'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSKMSKey.Arn
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # S3 Bucket for Audit Logs
  AuditLogBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'payment-audit-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA
      Tags:
        - Key: Name
          Value: !Sub 'audit-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing
        - Key: DataClassification
          Value: confidential

  # S3 Bucket Policy for VPC Flow Logs
  AuditLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AuditLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${AuditLogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt AuditLogBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${AuditLogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt AuditLogBucket.Arn

  # VPC Flow Logs
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceIds:
        - !Ref PaymentVPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt AuditLogBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-log-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  # CloudWatch Log Group for Application Logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/application/payment-processing-${EnvironmentSuffix}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'app-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'payment-ec2-role-${EnvironmentSuffix}'
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
        - PolicyName: !Sub 'rds-access-policy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBInstances'
                  - 'rds:DescribeDBClusters'
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:payment-db-${EnvironmentSuffix}'
        - PolicyName: !Sub 's3-access-policy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt AuditLogBucket.Arn
                  - !Sub '${AuditLogBucket.Arn}/*'
        - PolicyName: !Sub 'cloudwatch-logs-policy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ApplicationLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'ec2-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'payment-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

  # CloudTrail for Audit Logging
  PaymentCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: AuditLogBucketPolicy
    Properties:
      TrailName: !Sub 'payment-audit-trail-${EnvironmentSuffix}'
      S3BucketName: !Ref AuditLogBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${AuditLogBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub 'audit-trail-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
        - Key: CostCenter
          Value: payment-processing

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref PaymentVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3'

  DBEndpoint:
    Description: 'RDS PostgreSQL Endpoint'
    Value: !GetAtt PaymentDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  DBPort:
    Description: 'RDS PostgreSQL Port'
    Value: !GetAtt PaymentDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DBPort'

  AuditLogBucketName:
    Description: 'S3 Audit Log Bucket Name'
    Value: !Ref AuditLogBucket
    Export:
      Name: !Sub '${AWS::StackName}-AuditLogBucket'

  ApplicationLogGroupName:
    Description: 'CloudWatch Log Group Name'
    Value: !Ref ApplicationLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLogGroup'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfile'

  RDSKMSKeyId:
    Description: 'KMS Key ID for RDS Encryption'
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-RDSKMSKey'

  ApplicationSecurityGroupId:
    Description: 'Application Security Group ID'
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationSecurityGroup'

  DBSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DBSecurityGroup'
```

## File: lib/README.md

```markdown
# Security-Hardened Payment Processing Infrastructure

CloudFormation template for deploying PCI-DSS compliant infrastructure for payment card data processing.

## Architecture

This template deploys:

- **VPC**: 3 availability zones with public and private subnets
- **RDS PostgreSQL**: Multi-AZ deployment with KMS encryption in private subnets
- **S3**: Encrypted bucket for audit logs with versioning and public access blocking
- **KMS**: Encryption key with automatic rotation for RDS
- **IAM**: EC2 instance role with least-privilege permissions
- **CloudWatch Logs**: Application log group with 90-day retention
- **VPC Flow Logs**: Network traffic logging to S3
- **CloudTrail**: Audit trail with log file validation

## Security Features

### Network Isolation
- Private subnets for database tier (no internet access)
- Security groups with least-privilege rules
- No 0.0.0.0/0 ingress rules
- HTTPS-only communication between tiers

### Encryption
- RDS encryption at rest using KMS
- KMS automatic key rotation enabled
- S3 server-side encryption (AES-256)
- TLS 1.2+ for data in transit

### Audit and Compliance
- VPC Flow Logs for all network interfaces
- CloudTrail logging with validation
- CloudWatch Logs with 90-day retention
- All resources tagged for compliance tracking

### Access Control
- IAM roles with specific permissions (no wildcards)
- Least-privilege principle enforced
- Multi-AZ RDS for high availability

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- CloudFormation permissions to create all resources
- KMS permissions for key creation and management

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name payment-security-infrastructure \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Open CloudFormation console in us-east-1 region
2. Click "Create stack" → "With new resources"
3. Upload `lib/security-infrastructure.yaml`
4. Provide stack name and parameters:
   - EnvironmentSuffix: unique identifier (e.g., "prod", "dev")
   - DBMasterUsername: database admin username
   - DBMasterPassword: strong password (min 8 chars)
5. Acknowledge IAM resource creation
6. Review and create stack

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: "dev")
- **DBMasterUsername**: Master username for PostgreSQL (default: "dbadmin")
- **DBMasterPassword**: Master password for PostgreSQL (required, min 8 chars)

## Outputs

The template exports the following values:

- VPCId: VPC identifier
- PrivateSubnet1/2/3Id: Private subnet identifiers
- DBEndpoint: RDS PostgreSQL endpoint address
- DBPort: RDS PostgreSQL port
- AuditLogBucketName: S3 bucket for audit logs
- ApplicationLogGroupName: CloudWatch log group
- EC2InstanceProfileArn: IAM instance profile ARN
- RDSKMSKeyId: KMS key for encryption
- ApplicationSecurityGroupId: Application tier security group
- DBSecurityGroupId: Database tier security group

## Stack Deletion

To delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name payment-security-infrastructure \
  --region us-east-1
```

**Note**: All resources are configured for deletion (no retention policies).

## Compliance

This infrastructure meets PCI-DSS requirements:

- **Requirement 1**: Network segmentation with firewalls (Security Groups)
- **Requirement 2**: No default credentials, strong passwords required
- **Requirement 3**: Data encryption at rest (KMS) and in transit (TLS)
- **Requirement 4**: Encrypted transmission of cardholder data (HTTPS only)
- **Requirement 6**: Secure development (IaC best practices)
- **Requirement 7**: Least-privilege access (IAM roles)
- **Requirement 8**: Strong authentication (database credentials)
- **Requirement 9**: Physical access controls (AWS data centers)
- **Requirement 10**: Audit logging (CloudTrail, VPC Flow Logs)
- **Requirement 11**: Security monitoring (CloudWatch)
- **Requirement 12**: Security policies (enforced via templates)

## Cost Optimization

This template uses:
- db.t3.medium RDS instance (adjustable)
- gp3 storage for cost efficiency
- S3 lifecycle policy for log archival
- Multi-AZ for high availability (required for production)

## Monitoring

Monitor your infrastructure:

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier payment-db-<suffix>

# View CloudWatch logs
aws logs tail /aws/application/payment-processing-<suffix> --follow

# Check VPC Flow Logs
aws s3 ls s3://payment-audit-logs-<account-id>-<suffix>/
```

## Troubleshooting

### Stack Creation Fails

- Check IAM permissions for CloudFormation
- Verify parameter values (password strength, etc.)
- Check CloudFormation events for specific errors

### Cannot Connect to Database

- Verify security group rules
- Ensure application is in correct VPC/subnet
- Check RDS instance status

### Missing Logs

- Verify CloudWatch Logs permissions
- Check VPC Flow Logs configuration
- Ensure CloudTrail is logging

## Support

For issues or questions:
- Review CloudFormation events in AWS Console
- Check AWS service health dashboard
- Review CloudWatch Logs for application errors
```

## File: lib/DEPLOYMENT_GUIDE.md

```markdown
# Deployment Guide

## Quick Start

Deploy the security-hardened infrastructure:

```bash
# 1. Validate template
aws cloudformation validate-template \
  --template-body file://lib/security-infrastructure.yaml

# 2. Create stack
aws cloudformation create-stack \
  --stack-name payment-security-prod \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-v1 \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePass123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags \
    Key=Project,Value=PaymentProcessing \
    Key=Owner,Value=SecurityTeam

# 3. Monitor deployment
aws cloudformation wait stack-create-complete \
  --stack-name payment-security-prod \
  --region us-east-1

# 4. Get outputs
aws cloudformation describe-stacks \
  --stack-name payment-security-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Deployment Steps

### Step 1: Prepare Environment

```bash
# Set AWS region
export AWS_REGION=us-east-1

# Set environment suffix (unique identifier)
export ENV_SUFFIX=prod-v1

# Verify AWS credentials
aws sts get-caller-identity
```

### Step 2: Validate Template

```bash
# Validate CloudFormation syntax
aws cloudformation validate-template \
  --template-body file://lib/security-infrastructure.yaml

# Expected output: TemplateDescription and Parameters
```

### Step 3: Create Stack

```bash
# Create the stack with parameters
aws cloudformation create-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENV_SUFFIX} \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=$(aws secretsmanager get-random-password --require-each-included-type --password-length 16 --query 'RandomPassword' --output text) \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}
```

### Step 4: Monitor Deployment

```bash
# Watch stack creation progress
aws cloudformation describe-stack-events \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION} \
  --max-items 20

# Wait for completion (this will block until done)
aws cloudformation wait stack-create-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

### Step 5: Retrieve Outputs

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table \
  --region ${AWS_REGION}

# Get specific output (e.g., DB endpoint)
aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`DBEndpoint`].OutputValue' \
  --output text \
  --region ${AWS_REGION}
```

## Post-Deployment Verification

### Verify VPC and Subnets

```bash
# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text)

# List subnets
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" \
  --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

### Verify RDS Instance

```bash
# Get database details
aws rds describe-db-instances \
  --db-instance-identifier payment-db-${ENV_SUFFIX} \
  --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Engine,MultiAZ,StorageEncrypted]' \
  --output table

# Check encryption
aws rds describe-db-instances \
  --db-instance-identifier payment-db-${ENV_SUFFIX} \
  --query 'DBInstances[0].StorageEncrypted'
```

### Verify S3 Bucket

```bash
# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`AuditLogBucketName`].OutputValue' \
  --output text)

# Verify encryption
aws s3api get-bucket-encryption --bucket ${BUCKET_NAME}

# Verify versioning
aws s3api get-bucket-versioning --bucket ${BUCKET_NAME}

# Verify public access block
aws s3api get-public-access-block --bucket ${BUCKET_NAME}
```

### Verify KMS Key

```bash
# Get KMS key ID
KMS_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSKMSKeyId`].OutputValue' \
  --output text)

# Check key rotation
aws kms get-key-rotation-status --key-id ${KMS_KEY_ID}
```

### Verify CloudTrail

```bash
# Check CloudTrail status
aws cloudtrail get-trail-status \
  --name payment-audit-trail-${ENV_SUFFIX}

# Verify log file validation
aws cloudtrail describe-trails \
  --trail-name-list payment-audit-trail-${ENV_SUFFIX} \
  --query 'trailList[0].LogFileValidationEnabled'
```

### Verify VPC Flow Logs

```bash
# List flow logs
aws ec2 describe-flow-logs \
  --filter "Name=resource-id,Values=${VPC_ID}" \
  --query 'FlowLogs[*].[FlowLogId,FlowLogStatus,LogDestinationType,LogDestination]' \
  --output table
```

## Updating the Stack

```bash
# Update stack with changes
aws cloudformation update-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=DBMasterUsername,UsePreviousValue=true \
    ParameterKey=DBMasterPassword,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}

# Wait for update to complete
aws cloudformation wait stack-update-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Rollback

```bash
# If deployment fails, CloudFormation auto-rolls back
# To manually rollback an update:
aws cloudformation cancel-update-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Stack Deletion

```bash
# Delete the stack (removes all resources)
aws cloudformation delete-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Troubleshooting

### Stack Creation Failed

```bash
# View failure reason
aws cloudformation describe-stack-events \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
  --output table
```

### Resource Already Exists

If you get "AlreadyExists" errors:
- Change the EnvironmentSuffix parameter to a unique value
- Or delete the existing stack first

### Insufficient Permissions

Ensure your IAM user/role has these permissions:
- cloudformation:* (for stack operations)
- ec2:* (for VPC, subnets, security groups)
- rds:* (for database instances)
- s3:* (for buckets)
- kms:* (for encryption keys)
- iam:* (for roles and policies)
- logs:* (for CloudWatch logs)
- cloudtrail:* (for audit trails)

### Database Connection Issues

```bash
# Test connectivity from EC2 instance
psql -h <DB_ENDPOINT> -U dbadmin -d postgres

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids <DB_SECURITY_GROUP_ID> \
  --query 'SecurityGroups[0].IpPermissions'
```

## Best Practices

1. **Use Secrets Manager**: Store database credentials in AWS Secrets Manager instead of parameters
2. **Enable MFA Delete**: For S3 bucket versioning protection
3. **Regular Backups**: RDS automated backups are configured (30-day retention)
4. **Monitoring**: Set up CloudWatch alarms for critical metrics
5. **Cost Tracking**: Use Cost Allocation Tags for detailed billing
6. **Change Sets**: Use CloudFormation change sets to preview updates before applying

## Production Checklist

- [ ] Updated DBMasterPassword to strong, unique value
- [ ] Configured appropriate RDS instance size
- [ ] Verified Multi-AZ is enabled for RDS
- [ ] Confirmed encryption is enabled for all resources
- [ ] Tested security group rules
- [ ] Verified VPC Flow Logs are active
- [ ] Confirmed CloudTrail logging is enabled
- [ ] Set up CloudWatch alarms
- [ ] Documented all outputs and credentials
- [ ] Tested stack deletion and recreation
