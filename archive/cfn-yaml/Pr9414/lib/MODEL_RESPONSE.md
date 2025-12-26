# Media Asset Processing Pipeline Infrastructure

This CloudFormation template implements a complete media asset processing pipeline for StreamTech Japan, deployed in the Tokyo region (ap-northeast-1) with multi-AZ configuration and comprehensive security features.

## Architecture Overview

The infrastructure includes:
- VPC with multi-AZ public and private subnets
- RDS PostgreSQL instance for metadata storage
- EFS file system for temporary media file storage
- ElastiCache Redis cluster for caching
- API Gateway for content management endpoints
- CodePipeline for CI/CD workflow
- Security groups and network configuration
- Encryption at rest using AWS managed keys

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Media Asset Processing Pipeline for StreamTech Japan - Multi-AZ Infrastructure'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'

Mappings:
  RegionMap:
    ap-northeast-1:
      AZs: ['ap-northeast-1a', 'ap-northeast-1c']

Resources:
  # ========================================
  # VPC and Network Resources
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'media-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'media-igw-${EnvironmentSuffix}'

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
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'media-public-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'media-public-2-${EnvironmentSuffix}'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub 'media-private-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub 'media-private-2-${EnvironmentSuffix}'

  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'media-nat-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'media-public-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'media-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  # Route Table Associations
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

  # ========================================
  # Security Groups
  # ========================================

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS PostgreSQL'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VpcCidr
          Description: 'PostgreSQL from VPC'
      Tags:
        - Key: Name
          Value: !Sub 'media-rds-sg-${EnvironmentSuffix}'

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for ElastiCache Redis'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          CidrIp: !Ref VpcCidr
          Description: 'Redis from VPC'
      Tags:
        - Key: Name
          Value: !Sub 'media-elasticache-sg-${EnvironmentSuffix}'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EFS'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          CidrIp: !Ref VpcCidr
          Description: 'NFS from VPC'
      Tags:
        - Key: Name
          Value: !Sub 'media-efs-sg-${EnvironmentSuffix}'

  APIGatewaySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for API Gateway VPC Link'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from anywhere'
      Tags:
        - Key: Name
          Value: !Sub 'media-apigw-sg-${EnvironmentSuffix}'

  # ========================================
  # RDS PostgreSQL Database
  # ========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'media-db-subnet-group-${EnvironmentSuffix}'

  RDSDBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'media-postgres-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '14.7'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBName: mediadb
      MasterUsername: !Sub '{{resolve:secretsmanager:media-db-credentials-${EnvironmentSuffix}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:media-db-credentials-${EnvironmentSuffix}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 1
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'media-postgres-${EnvironmentSuffix}'

  # ========================================
  # EFS File System
  # ========================================

  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      FileSystemTags:
        - Key: Name
          Value: !Sub 'media-efs-${EnvironmentSuffix}'

  EFSMountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  EFSMountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # ========================================
  # ElastiCache Redis Cluster
  # ========================================

  ElastiCacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: 'Subnet group for ElastiCache Redis'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  ElastiCacheReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'media-redis-${EnvironmentSuffix}'
      ReplicationGroupDescription: 'Redis cluster for media content metadata caching'
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.t3.micro
      NumCacheClusters: 2
      MultiAZEnabled: true
      AutomaticFailoverEnabled: true
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      SecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      CacheSubnetGroupName: !Ref ElastiCacheSubnetGroup
      SnapshotRetentionLimit: 1
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      Tags:
        - Key: Name
          Value: !Sub 'media-redis-${EnvironmentSuffix}'

  # ========================================
  # API Gateway
  # ========================================

  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'media-content-api-${EnvironmentSuffix}'
      Description: 'API Gateway for content management endpoints'
      EndpointConfiguration:
        Types:
          - REGIONAL

  APIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'content'

  APIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref APIResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        RequestTemplates:
          application/json: '{"statusCode": 200}'
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"message": "Content management API endpoint"}'
      MethodResponses:
        - StatusCode: 200

  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIMethod
    Properties:
      RestApiId: !Ref RestAPI
      StageName: !Ref EnvironmentSuffix

  # ========================================
  # CodePipeline and CI/CD Resources
  # ========================================

  ArtifactBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'media-pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}'
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

  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'media-codepipeline-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSCodePipelineFullAccess'
      Policies:
        - PolicyName: CodePipelineAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ArtifactBucket.Arn
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource: '*'

  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'media-codebuild-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}/*'

  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub 'media-build-project-${EnvironmentSuffix}'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: 'aws/codebuild/standard:5.0'
        EnvironmentVariables:
          - Name: ENVIRONMENT_SUFFIX
            Value: !Ref EnvironmentSuffix
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            build:
              commands:
                - echo "Building media processing application"
                - echo "Environment $ENVIRONMENT_SUFFIX"
          artifacts:
            files:
              - '**/*'

  MediaPipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub 'media-processing-pipeline-${EnvironmentSuffix}'
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                S3Bucket: !Ref ArtifactBucket
                S3ObjectKey: 'source.zip'
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput

  # ========================================
  # CloudWatch Logs
  # ========================================

  APILogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/media-api-${EnvironmentSuffix}'
      RetentionInDays: 7

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnets:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'

  PrivateSubnets:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  RDSEndpoint:
    Description: 'RDS PostgreSQL endpoint'
    Value: !GetAtt RDSDBInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  RDSPort:
    Description: 'RDS PostgreSQL port'
    Value: !GetAtt RDSDBInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDSPort'

  EFSFileSystemId:
    Description: 'EFS file system ID'
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemId'

  RedisEndpoint:
    Description: 'ElastiCache Redis primary endpoint'
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RedisEndpoint'

  RedisPort:
    Description: 'ElastiCache Redis port'
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RedisPort'

  APIEndpoint:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-APIEndpoint'

  PipelineName:
    Description: 'CodePipeline name'
    Value: !Ref MediaPipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  ArtifactBucketName:
    Description: 'S3 bucket for pipeline artifacts'
    Value: !Ref ArtifactBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactBucketName'

  StackName:
    Description: 'CloudFormation stack name'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Implementation Notes

### Security Features
- All data stores (RDS, EFS, ElastiCache) use encryption at rest with AWS managed keys
- ElastiCache Redis uses transit encryption (TLS)
- Security groups follow least privilege access
- S3 bucket has public access blocked
- Database credentials reference Secrets Manager (existing secret: `media-db-credentials-${EnvironmentSuffix}`)

### Multi-AZ Configuration
- RDS PostgreSQL deployed across two availability zones with automatic failover
- ElastiCache Redis cluster with 2 nodes and automatic failover enabled
- EFS mount targets in both availability zones
- Private and public subnets in both AZs

### Cost Optimization
- Single NAT Gateway (sufficient for synthetic tasks)
- Small instance types (db.t3.micro, cache.t3.micro)
- Minimal backup retention (1 day)
- No unnecessary resources

### Destroyability
- DeletionPolicy: Delete on RDS and S3 (no Retain)
- DeletionProtection: false on RDS
- All resources can be cleanly destroyed

### Resource Naming
- All resources use `EnvironmentSuffix` parameter
- Pattern: `media-{resource}-${EnvironmentSuffix}`
- Prevents naming conflicts in parallel deployments

## Deployment Instructions

1. Ensure Secrets Manager secret exists: `media-db-credentials-${EnvironmentSuffix}` with keys `username` and `password`
2. Deploy the CloudFormation template with desired EnvironmentSuffix
3. Stack outputs provide all necessary connection details
4. Resources are deployed in ap-northeast-1 region
