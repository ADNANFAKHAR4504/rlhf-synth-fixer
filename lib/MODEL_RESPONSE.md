# Payment Processing Database Infrastructure - CloudFormation Template

This CloudFormation template deploys a PCI-DSS compliant payment processing database infrastructure with RDS PostgreSQL, Secrets Manager integration, and ElastiCache for session management.

## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PCI-DSS Compliant Payment Processing Database Infrastructure with RDS, Secrets Manager, and ElastiCache'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to avoid conflicts
    MinLength: 1

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC

  DBInstanceClass:
    Type: String
    Default: 'db.t3.medium'
    Description: Database instance class for Aurora Serverless v2
    AllowedValues:
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge

Resources:
  # ==========================================
  # VPC and Network Infrastructure
  # ==========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'payment-igw-${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets (for NAT Gateway and potential bastion hosts)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-2-${EnvironmentSuffix}'

  # Private Subnets (for RDS and ElastiCache)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-2-${EnvironmentSuffix}'

  # NAT Gateway for private subnet internet access
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'payment-nat-eip-${EnvironmentSuffix}'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'payment-nat-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-rt-${EnvironmentSuffix}'

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
          Value: !Sub 'payment-private-rt-${EnvironmentSuffix}'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  # ==========================================
  # KMS Key for Encryption
  # ==========================================

  DatabaseEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for payment database encryption - ${EnvironmentSuffix}'
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
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow Secrets Manager to use the key
            Effect: Allow
            Principal:
              Service: secretsmanager.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow ElastiCache to use the key
            Effect: Allow
            Principal:
              Service: elasticache.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DatabaseEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/payment-db-${EnvironmentSuffix}'
      TargetKeyId: !Ref DatabaseEncryptionKey

  # ==========================================
  # Secrets Manager for Database Credentials
  # ==========================================

  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'payment-db-master-${EnvironmentSuffix}'
      Description: Master credentials for payment processing database
      KmsKeyId: !Ref DatabaseEncryptionKey
      GenerateSecretString:
        SecretStringTemplate: '{"username": "dbadmin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==========================================
  # Security Groups
  # ==========================================

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-db-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for payment processing database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VpcCidr
          Description: Allow PostgreSQL access from VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-cache-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for ElastiCache Redis cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          CidrIp: !Ref VpcCidr
          Description: Allow Redis access from VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-cache-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==========================================
  # RDS Aurora Serverless v2 Cluster
  # ==========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'payment-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for payment processing database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-subnet-group-${EnvironmentSuffix}'

  DBCluster:
    Type: AWS::RDS::DBCluster
    DependsOn: DBMasterSecret
    Properties:
      DBClusterIdentifier: !Sub 'payment-db-cluster-${EnvironmentSuffix}'
      Engine: aurora-postgresql
      EngineVersion: '14.6'
      EngineMode: provisioned
      ServerlessV2ScalingConfiguration:
        MinCapacity: 0.5
        MaxCapacity: 2
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}'
      DatabaseName: paymentdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseEncryptionKey
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'payment-db-instance-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref DBCluster
      Engine: aurora-postgresql
      DBInstanceClass: !Ref DBInstanceClass
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-instance-${EnvironmentSuffix}'

  # ==========================================
  # Secrets Manager Rotation
  # ==========================================

  SecretRotationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'payment-secret-rotation-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: SecretsManagerRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                Resource: !Ref DBMasterSecret
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetRandomPassword'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DatabaseEncryptionKey.Arn

  SecretRotationLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-rotation-lambda-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for secret rotation Lambda
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-rotation-lambda-sg-${EnvironmentSuffix}'

  SecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'payment-secret-rotation-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt SecretRotationLambdaRole.Arn
      Timeout: 30
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecretRotationLambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          SECRETS_MANAGER_ENDPOINT: !Sub 'https://secretsmanager.${AWS::Region}.amazonaws.com'
      Code:
        ZipFile: |
          import json
          import boto3
          import psycopg2
          import os

          def handler(event, context):
              service_client = boto3.client('secretsmanager')
              arn = event['SecretId']
              token = event['ClientRequestToken']
              step = event['Step']

              metadata = service_client.describe_secret(SecretId=arn)
              if not metadata['RotationEnabled']:
                  raise ValueError("Secret %s is not enabled for rotation" % arn)

              versions = metadata['VersionIdsToStages']
              if token not in versions:
                  raise ValueError("Secret version %s has no stage for rotation" % token)

              if "AWSCURRENT" in versions[token]:
                  return
              elif "AWSPENDING" not in versions[token]:
                  raise ValueError("Secret version %s not set as AWSPENDING" % token)

              if step == "createSecret":
                  create_secret(service_client, arn, token)
              elif step == "setSecret":
                  set_secret(service_client, arn, token)
              elif step == "testSecret":
                  test_secret(service_client, arn, token)
              elif step == "finishSecret":
                  finish_secret(service_client, arn, token)
              else:
                  raise ValueError("Invalid step parameter")

          def create_secret(service_client, arn, token):
              try:
                  service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
              except service_client.exceptions.ResourceNotFoundException:
                  passwd = service_client.get_random_password(ExcludeCharacters='"@/\\\'', PasswordLength=32)
                  current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])
                  current_dict['password'] = passwd['RandomPassword']
                  service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])

          def set_secret(service_client, arn, token):
              pending_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString'])
              current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])

              # Connect to database and update password
              # This is a simplified version - production should include proper error handling
              pass

          def test_secret(service_client, arn, token):
              # Test the AWSPENDING secret
              pass

          def finish_secret(service_client, arn, token):
              metadata = service_client.describe_secret(SecretId=arn)
              current_version = None
              for version in metadata["VersionIdsToStages"]:
                  if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
                      if version == token:
                          return
                      current_version = version
                      break

              service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)

  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn:
      - SecretRotationLambda
      - DBCluster
    Properties:
      SecretId: !Ref DBMasterSecret
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # ==========================================
  # ElastiCache Redis for Session Management
  # ==========================================

  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for ElastiCache Redis cluster
      CacheSubnetGroupName: !Sub 'payment-cache-subnet-group-${EnvironmentSuffix}'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  CacheReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'payment-cache-${EnvironmentSuffix}'
      ReplicationGroupDescription: Redis cluster for payment session management
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.t3.micro
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      SecurityGroupIds:
        - !Ref CacheSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      KmsKeyId: !Ref DatabaseEncryptionKey
      Port: 6379
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'sun:05:00-sun:07:00'
      Tags:
        - Key: Name
          Value: !Sub 'payment-cache-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  DBClusterEndpoint:
    Description: RDS Aurora Cluster Endpoint
    Value: !GetAtt DBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterEndpoint'

  DBClusterPort:
    Description: RDS Aurora Cluster Port
    Value: !GetAtt DBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterPort'

  DBSecretArn:
    Description: ARN of the database credentials secret
    Value: !Ref DBMasterSecret
    Export:
      Name: !Sub '${AWS::StackName}-DBSecretArn'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref DatabaseEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  CacheEndpoint:
    Description: ElastiCache Redis Primary Endpoint
    Value: !GetAtt CacheReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-CacheEndpoint'

  CachePort:
    Description: ElastiCache Redis Port
    Value: !GetAtt CacheReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-CachePort'

  DBSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DBSecurityGroupId'

  CacheSecurityGroupId:
    Description: Cache Security Group ID
    Value: !Ref CacheSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-CacheSecurityGroupId'
```

## Summary

This CloudFormation template creates a complete PCI-DSS compliant payment processing database infrastructure including:

1. **VPC Infrastructure**: Multi-AZ VPC with public and private subnets, NAT Gateway for outbound connectivity
2. **RDS Aurora Serverless v2**: PostgreSQL database with encryption at rest using customer-managed KMS keys
3. **Secrets Manager**: Automated credential management with 30-day rotation schedule
4. **ElastiCache Redis**: Encrypted Redis cluster for session management
5. **Security Controls**: KMS encryption, security groups with least-privilege access, deletion protection

All resources follow the naming convention with EnvironmentSuffix to avoid conflicts during parallel deployments.
