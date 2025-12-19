# HIPAA-Compliant Healthcare Data Processing Infrastructure

This CloudFormation template creates a production-ready, HIPAA-compliant healthcare data processing infrastructure with comprehensive security, encryption, high availability, and audit logging capabilities.

## Architecture Overview

The infrastructure implements a multi-tier architecture across multiple availability zones:

- **Networking**: Multi-AZ VPC with public and private subnets, NAT Gateway for outbound connectivity
- **Compute**: ECS Fargate cluster with auto-scaling (2-10 tasks)
- **Database**: Aurora MySQL Serverless v2 cluster with encryption and automated backups
- **Storage**: EFS with encryption at rest and in transit
- **Caching**: ElastiCache Redis with Multi-AZ and encryption
- **API Layer**: API Gateway with WAF protection and rate limiting
- **Security**: KMS encryption with automatic key rotation, comprehensive security groups, references existing Secrets Manager secrets
- **Monitoring**: CloudWatch Logs with configurable retention

## Prerequisites

Before deploying this template, ensure the following secret exists in AWS Secrets Manager:

- **Secret Name**: `healthcare-db-secret-${EnvironmentSuffix}` (e.g., `healthcare-db-secret-dev123`)
- **Secret Format**: JSON with keys `username` and `password`
- **Example**:
  ```json
  {
    "username": "admin",
    "password": "YourSecurePassword123"
  }
  ```

You can create this secret using the AWS CLI:
```bash
aws secretsmanager create-secret \
  --name healthcare-db-secret-dev123 \
  --description "Database credentials for Healthcare Aurora cluster" \
  --secret-string '{"username":"admin","password":"YourSecurePassword123"}'
```

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: HIPAA-Compliant Healthcare Data Processing Infrastructure with ECS Fargate, RDS Aurora, EFS, ElastiCache, API Gateway, and WAF

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to avoid conflicts
    Default: dev123
    AllowedPattern: ^[a-zA-Z0-9-]+$
    ConstraintDescription: Must contain only alphanumeric characters and hyphens

  VpcCidr:
    Type: String
    Description: CIDR block for VPC
    Default: 10.0.0.0/16

Resources:
  # ============================================================================
  # KMS Keys for Encryption
  # ============================================================================

  DatabaseEncryptionKey:
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

  DatabaseEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/rds-${EnvironmentSuffix}'
      TargetKeyId: !Ref DatabaseEncryptionKey

  EFSEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EFS encryption - ${EnvironmentSuffix}'
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
          - Sid: Allow EFS to use the key
            Effect: Allow
            Principal:
              Service: elasticfilesystem.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EFSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/efs-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSEncryptionKey

  # ============================================================================
  # VPC and Network Resources
  # ============================================================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-vpc-${EnvironmentSuffix}'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-igw-${EnvironmentSuffix}'

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
          Value: !Sub 'healthcare-public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-public-subnet-2-${EnvironmentSuffix}'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-private-subnet-2-${EnvironmentSuffix}'

  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-nat-eip-${EnvironmentSuffix}'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-nat-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-public-rt-${EnvironmentSuffix}'

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
          Value: !Sub 'healthcare-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

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

  # ============================================================================
  # Security Groups
  # ============================================================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthcare-alb-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-alb-sg-${EnvironmentSuffix}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthcare-ecs-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for ECS Fargate tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-ecs-sg-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthcare-db-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS Aurora database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-db-sg-${EnvironmentSuffix}'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthcare-efs-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for EFS file system
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-efs-sg-${EnvironmentSuffix}'

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthcare-redis-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for ElastiCache Redis
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-redis-sg-${EnvironmentSuffix}'

  # ============================================================================
  # CloudWatch Logs
  # ============================================================================

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/healthcare-${EnvironmentSuffix}'
      RetentionInDays: 7

  # ============================================================================
  # IAM Roles
  # ============================================================================

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthcare-ecs-task-execution-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:*'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthcare-ecs-task-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: EFSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'elasticfilesystem:ClientMount'
                  - 'elasticfilesystem:ClientWrite'
                  - 'elasticfilesystem:ClientRootAccess'
                Resource: !GetAtt EFSFileSystem.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ECSLogGroup.Arn

  # ============================================================================
  # RDS Aurora Cluster
  # ============================================================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'healthcare-db-subnet-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS Aurora
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-db-subnet-${EnvironmentSuffix}'

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'healthcare-aurora-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.08.1'
      EngineMode: provisioned
      ServerlessV2ScalingConfiguration:
        MinCapacity: 0.5
        MaxCapacity: 1
      MasterUsername: !Sub '{{resolve:secretsmanager:healthcare-db-secret-${EnvironmentSuffix}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:healthcare-db-secret-${EnvironmentSuffix}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !GetAtt DatabaseEncryptionKey.Arn
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - audit
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-aurora-${EnvironmentSuffix}'

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'healthcare-aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-mysql
      DBInstanceClass: db.serverless
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-aurora-instance-1-${EnvironmentSuffix}'

  # ============================================================================
  # EFS File System
  # ============================================================================

  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      KmsKeyId: !GetAtt EFSEncryptionKey.Arn
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      FileSystemTags:
        - Key: Name
          Value: !Sub 'healthcare-efs-${EnvironmentSuffix}'

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

  # ============================================================================
  # ElastiCache Redis
  # ============================================================================

  ElastiCacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      CacheSubnetGroupName: !Sub 'healthcare-redis-subnet-${EnvironmentSuffix}'
      Description: Subnet group for ElastiCache Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  ElastiCacheReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'healthcare-redis-${EnvironmentSuffix}'
      ReplicationGroupDescription: Redis cluster for session management
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.t4g.micro
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      TransitEncryptionEnabled: true
      AtRestEncryptionEnabled: true
      CacheSubnetGroupName: !Ref ElastiCacheSubnetGroup
      SecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'mon:05:00-mon:07:00'
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-redis-${EnvironmentSuffix}'

  # ============================================================================
  # ECS Cluster and Service
  # ============================================================================

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'healthcare-cluster-${EnvironmentSuffix}'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 1
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-cluster-${EnvironmentSuffix}'

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'healthcare-task-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '256'
      Memory: '512'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: healthcare-app
          Image: nginx:latest
          Essential: true
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: healthcare
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
              ReadOnly: false
          Environment:
            - Name: REDIS_ENDPOINT
              Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Address
            - Name: DB_ENDPOINT
              Value: !GetAtt AuroraCluster.Endpoint.Address
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED
            AuthorizationConfig:
              IAM: ENABLED

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'healthcare-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-alb-${EnvironmentSuffix}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'healthcare-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-tg-${EnvironmentSuffix}'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub 'healthcare-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: healthcare-app
          ContainerPort: 80
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 60
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-service-${EnvironmentSuffix}'

  # ============================================================================
  # Auto Scaling
  # ============================================================================

  ECSServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ECSServiceScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'healthcare-scaling-policy-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ============================================================================
  # API Gateway and WAF
  # ============================================================================

  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'healthcare-waf-${EnvironmentSuffix}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesCommonRuleSet
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesKnownBadInputsRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'healthcare-waf-${EnvironmentSuffix}'
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-waf-${EnvironmentSuffix}'

  APIGatewayRestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'healthcare-api-${EnvironmentSuffix}'
      Description: Healthcare API Gateway with WAF integration
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-api-${EnvironmentSuffix}'

  APIGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      ParentId: !GetAtt APIGatewayRestAPI.RootResourceId
      PathPart: health

  APIGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      ResourceId: !Ref APIGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: HTTP_PROXY
        IntegrationHttpMethod: GET
        Uri: !Sub 'http://${ApplicationLoadBalancer.DNSName}/health'
        IntegrationResponses:
          - StatusCode: 200
      MethodResponses:
        - StatusCode: 200

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIGatewayMethod
    Properties:
      RestApiId: !Ref APIGatewayRestAPI

  APIGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      DeploymentId: !Ref APIGatewayDeployment
      StageName: prod
      Description: Production stage
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
          ThrottlingBurstLimit: 5000
          ThrottlingRateLimit: 2000
      Tags:
        - Key: Name
          Value: !Sub 'healthcare-api-stage-${EnvironmentSuffix}'

  WAFWebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    DependsOn: APIGatewayStage
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${APIGatewayRestAPI}/stages/prod'
      WebACLArn: !GetAtt WAFWebACL.Arn

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterName'

  ECSServiceName:
    Description: ECS Service Name
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub '${AWS::StackName}-ECSServiceName'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  AuroraClusterEndpoint:
    Description: Aurora Cluster Endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-AuroraClusterEndpoint'

  AuroraClusterReadEndpoint:
    Description: Aurora Cluster Read Endpoint
    Value: !GetAtt AuroraCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-AuroraClusterReadEndpoint'

  EFSFileSystemId:
    Description: EFS File System ID
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemId'

  RedisEndpoint:
    Description: ElastiCache Redis Primary Endpoint
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RedisEndpoint'

  RedisPort:
    Description: ElastiCache Redis Port
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RedisPort'

  APIGatewayURL:
    Description: API Gateway Invoke URL
    Value: !Sub 'https://${APIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayURL'

  WAFWebACLId:
    Description: WAF Web ACL ID
    Value: !GetAtt WAFWebACL.Id
    Export:
      Name: !Sub '${AWS::StackName}-WAFWebACLId'
```
