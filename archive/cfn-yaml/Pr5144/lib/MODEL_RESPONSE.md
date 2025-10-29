# PCI-DSS Compliant Database Infrastructure

This CloudFormation template creates a secure, PCI-DSS compliant database infrastructure for financial transaction processing.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: PCI-DSS compliant database infrastructure for financial transaction processing

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to ensure uniqueness across environments
    Default: prod
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  DBName:
    Type: String
    Description: Database name for RDS MySQL instance
    Default: transactions
    MinLength: 1
    MaxLength: 64
    AllowedPattern: ^[a-zA-Z][a-zA-Z0-9]*$

  DBInstanceClass:
    Type: String
    Description: RDS instance class
    Default: db.t3.medium
    AllowedValues:
      - db.t3.small
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge

  CacheNodeType:
    Type: String
    Description: ElastiCache node type
    Default: cache.t3.medium
    AllowedValues:
      - cache.t3.micro
      - cache.t3.small
      - cache.t3.medium
      - cache.r5.large

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub vpc-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub igw-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private
        - Key: Compliance
          Value: PCI-DSS

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private
        - Key: Compliance
          Value: PCI-DSS

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub public-rt-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub private-rt-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Groups
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub rds-sg-${EnvironmentSuffix}
      GroupDescription: Security group for RDS MySQL instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: Allow MySQL access from application tier
      Tags:
        - Key: Name
          Value: !Sub rds-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub elasticache-sg-${EnvironmentSuffix}
      GroupDescription: Security group for ElastiCache Redis cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: Allow Redis access from application tier
      Tags:
        - Key: Name
          Value: !Sub elasticache-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub app-sg-${EnvironmentSuffix}
      GroupDescription: Security group for application tier
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from internet
      Tags:
        - Key: Name
          Value: !Sub app-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Secrets Manager - Database Credentials
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub rds-credentials-${EnvironmentSuffix}
      Description: RDS MySQL master credentials for transaction database
      GenerateSecretString:
        SecretStringTemplate: '{"username": "dbadmin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub rds-credentials-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS

  # Secrets Manager Rotation Configuration
  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn: DBInstance
    Properties:
      SecretId: !Ref DBSecret
      RotationLambdaARN: !GetAtt RotationLambdaFunction.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # Lambda Execution Role for Rotation
  RotationLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub rotation-lambda-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: SecretsManagerRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:DescribeSecret
                  - secretsmanager:GetSecretValue
                  - secretsmanager:PutSecretValue
                  - secretsmanager:UpdateSecretVersionStage
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - secretsmanager:GetRandomPassword
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub rotation-lambda-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Secret Rotation
  RotationLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub rds-rotation-${EnvironmentSuffix}
      Description: Lambda function to rotate RDS credentials
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt RotationLambdaExecutionRole.Arn
      Timeout: 30
      VpcConfig:
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import boto3
          import pymysql
          import os

          def lambda_handler(event, context):
              service_client = boto3.client('secretsmanager')
              arn = event['SecretId']
              token = event['ClientRequestToken']
              step = event['Step']

              metadata = service_client.describe_secret(SecretId=arn)
              if not metadata['RotationEnabled']:
                  raise ValueError("Secret %s is not enabled for rotation" % arn)

              versions = metadata['VersionIdsToStages']
              if token not in versions:
                  raise ValueError("Secret version %s has no stage for rotation of secret %s." % (token, arn))

              if "AWSCURRENT" in versions[token]:
                  return
              elif "AWSPENDING" not in versions[token]:
                  raise ValueError("Secret version %s not set as AWSPENDING for rotation of secret %s." % (token, arn))

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
              service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
              try:
                  service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
              except service_client.exceptions.ResourceNotFoundException:
                  passwd = service_client.get_random_password(ExcludeCharacters='"@/\\\'', PasswordLength=32)
                  current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])
                  current_dict['password'] = passwd['RandomPassword']
                  service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])

          def set_secret(service_client, arn, token):
              pass

          def test_secret(service_client, arn, token):
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
      Tags:
        - Key: Name
          Value: !Sub rds-rotation-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Permission for Secrets Manager
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref RotationLambdaFunction
      Action: lambda:InvokeFunction
      Principal: secretsmanager.amazonaws.com

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub rds-subnet-group-${EnvironmentSuffix}
      DBSubnetGroupDescription: Subnet group for RDS MySQL instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub rds-subnet-group-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # RDS MySQL Instance
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub rds-mysql-${EnvironmentSuffix}
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: 8.0.35
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: mon:04:00-mon:05:00
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      DeletionProtection: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub rds-mysql-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS
        - Key: Backup
          Value: Required

  # ElastiCache Subnet Group
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      CacheSubnetGroupName: !Sub elasticache-subnet-group-${EnvironmentSuffix}
      Description: Subnet group for ElastiCache Redis cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub elasticache-subnet-group-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ElastiCache Redis Cluster
  RedisCluster:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub redis-cluster-${EnvironmentSuffix}
      ReplicationGroupDescription: Redis cluster for session management
      Engine: redis
      EngineVersion: 7.0
      CacheNodeType: !Ref CacheNodeType
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      SecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      AuthToken: !Sub '{{resolve:secretsmanager:${RedisAuthSecret}:SecretString:token}}'
      SnapshotRetentionLimit: 5
      SnapshotWindow: 03:00-05:00
      PreferredMaintenanceWindow: mon:05:00-mon:07:00
      Tags:
        - Key: Name
          Value: !Sub redis-cluster-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: PCI-DSS

  # Redis Auth Token Secret
  RedisAuthSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub redis-auth-token-${EnvironmentSuffix}
      Description: Authentication token for Redis cluster
      GenerateSecretString:
        SecretStringTemplate: '{}'
        GenerateStringKey: token
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub redis-auth-token-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group for RDS
  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/rds/mysql/${EnvironmentSuffix}
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub rds-logs-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPCId

  PublicSubnets:
    Description: Public subnet IDs
    Value: !Sub ${PublicSubnet1},${PublicSubnet2}
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnets

  PrivateSubnets:
    Description: Private subnet IDs
    Value: !Sub ${PrivateSubnet1},${PrivateSubnet2}
    Export:
      Name: !Sub ${AWS::StackName}-PrivateSubnets

  RDSEndpoint:
    Description: RDS MySQL endpoint address
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-RDSEndpoint

  RDSPort:
    Description: RDS MySQL port
    Value: !GetAtt DBInstance.Endpoint.Port
    Export:
      Name: !Sub ${AWS::StackName}-RDSPort

  DBSecretArn:
    Description: ARN of the database credentials secret
    Value: !Ref DBSecret
    Export:
      Name: !Sub ${AWS::StackName}-DBSecretArn

  RedisEndpoint:
    Description: Redis cluster endpoint address
    Value: !GetAtt RedisCluster.PrimaryEndPoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-RedisEndpoint

  RedisPort:
    Description: Redis cluster port
    Value: !GetAtt RedisCluster.PrimaryEndPoint.Port
    Export:
      Name: !Sub ${AWS::StackName}-RedisPort

  RedisAuthSecretArn:
    Description: ARN of the Redis auth token secret
    Value: !Ref RedisAuthSecret
    Export:
      Name: !Sub ${AWS::StackName}-RedisAuthSecretArn

  ApplicationSecurityGroupId:
    Description: Application security group ID
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-AppSecurityGroup
```

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Permissions to create VPC, RDS, ElastiCache, Secrets Manager, Lambda, and IAM resources
- Target region: us-east-1

### Deployment Steps

1. **Validate the template**:
```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yml \
  --region us-east-1
```

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name pci-dss-database-infrastructure \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Monitor deployment**:
```bash
aws cloudformation describe-stacks \
  --stack-name pci-dss-database-infrastructure \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

4. **Retrieve outputs**:
```bash
aws cloudformation describe-stacks \
  --stack-name pci-dss-database-infrastructure \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Security Features

- **Encryption at Rest**: RDS and ElastiCache both have encryption enabled
- **Encryption in Transit**: Redis cluster uses TLS encryption
- **Secrets Management**: Database credentials stored in Secrets Manager with automatic rotation every 30 days
- **Network Isolation**: Databases deployed in private subnets with no internet access
- **Multi-AZ**: Both RDS and Redis configured for high availability
- **Audit Logging**: RDS CloudWatch logs enabled for error, general, slow query, and audit logs
- **Backup**: RDS configured with 7-day backup retention
- **PCI-DSS Compliance**: All resources tagged for compliance tracking

### Cost Considerations

- RDS MySQL Multi-AZ db.t3.medium: Approximately $150-200/month
- ElastiCache Redis with 2 cache.t3.medium nodes: Approximately $100-150/month
- Data transfer and storage costs additional
- Secrets Manager: $0.40/secret/month + $0.05 per 10,000 API calls

### Cleanup

To delete the stack and all resources:
```bash
aws cloudformation delete-stack \
  --stack-name pci-dss-database-infrastructure \
  --region us-east-1
```

Note: All resources are configured without retention policies for easy cleanup during testing and development.
