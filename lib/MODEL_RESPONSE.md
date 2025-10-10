```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Real Estate Platform Infrastructure - Production Environment'

Parameters:
  # Environment parameters
  EnvironmentName:
    Description: Environment name (e.g., prod, staging)
    Type: String
    Default: prod

  # VPC parameters
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.45.0.0/16

  # Database parameters
  DBInstanceClass:
    Description: Database instance class
    Type: String
    Default: db.r5.large

  DBName:
    Description: Aurora database name
    Type: String
    Default: realestate

  DBUsername:
    Description: Aurora database admin username
    Type: String
    NoEcho: true

  DBPassword:
    Description: Aurora database admin password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: "[a-zA-Z0-9]*"

  # ECS parameters
  ECSServiceDesiredCount:
    Type: Number
    Default: 2
    Description: Desired number of ECS tasks

  # Certificate ARN for ALB
  CertificateArn:
    Type: String
    Description: ARN of the SSL certificate for the ALB

  # DynamoDB parameters
  DynamoDBReadCapacity:
    Type: Number
    Default: 5
    Description: Read capacity units for DynamoDB tables

  DynamoDBWriteCapacity:
    Type: Number
    Default: 5
    Description: Write capacity units for DynamoDB tables

Mappings:
  RegionMap:
    us-east-2:
      "AMI": "ami-0c55b159cbfafe1f0"

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, "prod"]

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-igw

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-2

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [4, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-subnet-1

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [5, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-subnet-2

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gw-1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gw-2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-rt

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

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-rt-1

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-rt-2

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  DatabaseRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-rt-1

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable1
      SubnetId: !Ref DatabaseSubnet1

  DatabaseRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-rt-2

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable2
      SubnetId: !Ref DatabaseSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group
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
          Value: !Sub ${EnvironmentName}-alb-sg

  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: WebApp Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-webapp-sg

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Database Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebAppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-sg

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ElastiCache Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref WebAppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-elasticache-sg

  OpenSearchSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: OpenSearch Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebAppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-opensearch-sg

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-alb

  ALBHttpListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBHttpsListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebAppTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn

  WebAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: 60
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-webapp-tg

  # WAF Web ACL
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub ${EnvironmentName}-web-acl
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        CloudWatchMetricsEnabled: true
        MetricName: !Sub ${EnvironmentName}-web-acl
        SampledRequestsEnabled: true
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 0
          OverrideAction:
            None: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesCommonRuleSet
            SampledRequestsEnabled: true
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
        - Name: RateLimitRule
          Priority: 1
          Action:
            Block: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
            SampledRequestsEnabled: true
          Statement:
            RateBasedStatement:
              Limit: 1000
              AggregateKeyType: IP

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${EnvironmentName}-cluster
      ClusterSettings:
        - Name: containerInsights
          Value: enabled

  # ECS Task Execution Role
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

  # ECS Task Role
  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

  # ECS Task Definition
  WebAppTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${EnvironmentName}-webapp
      Cpu: '1024'
      Memory: '2048'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: webapp
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/realestate-webapp:latest
          Essential: true
          PortMappings:
            - ContainerPort: 80
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref WebAppLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: webapp
          Environment:
            - Name: DB_HOST
              Value: !GetAtt AuroraDBCluster.Endpoint.Address
            - Name: DB_NAME
              Value: !Ref DBName
            - Name: REDIS_HOST
              Value: !GetAtt ElastiCacheCluster.RedisEndpoint.Address
            - Name: OPENSEARCH_ENDPOINT
              Value: !GetAtt OpenSearchDomain.DomainEndpoint

  # ECS Service
  WebAppService:
    Type: AWS::ECS::Service
    DependsOn:
      - ALBHttpsListener
    Properties:
      ServiceName: !Sub ${EnvironmentName}-webapp
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref WebAppTaskDefinition
      DesiredCount: !Ref ECSServiceDesiredCount
      LaunchType: FARGATE
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 75
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref WebAppSecurityGroup
      LoadBalancers:
        - ContainerName: webapp
          ContainerPort: 80
          TargetGroupArn: !Ref WebAppTargetGroup

  # Auto Scaling for ECS
  WebAppAutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub service/${ECSCluster}/${WebAppService.Name}
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService

  WebAppAutoScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub ${EnvironmentName}-webapp-cpu-tracking
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref WebAppAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # CloudWatch Logs
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/ecs/${EnvironmentName}-webapp
      RetentionInDays: 30

  # Aurora MySQL Cluster
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for Aurora DB
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-subnet-group

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-mysql
      EngineMode: provisioned
      EngineVersion: 8.0.mysql_aurora.3.02.0
      DatabaseName: !Ref DBName
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 02:00-03:00
      PreferredMaintenanceWindow: mon:03:00-mon:04:00
      StorageEncrypted: true
      EnableIAMDatabaseAuthentication: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-aurora-cluster

  AuroraPrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-mysql
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClass
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-aurora-primary

  AuroraReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-mysql
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClass
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-aurora-replica

  # DynamoDB Tables
  UserFavoritesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-user-favorites
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: propertyId
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: propertyId
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: CreatedAtIndex
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
            - AttributeName: createdAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-user-favorites-table

  SearchHistoryTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-search-history
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: searchTimestamp
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: searchTimestamp
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-search-history-table

  # ElastiCache Redis
  ElastiCacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet Group for ElastiCache
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-elasticache-subnet-group

  ElastiCacheParameterGroup:
    Type: AWS::ElastiCache::ParameterGroup
    Properties:
      CacheParameterGroupFamily: redis6.x
      Description: Parameter group for ElastiCache Redis
      Properties:
        maxmemory-policy: allkeys-lru

  ElastiCacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      AutoMinorVersionUpgrade: true
      CacheNodeType: cache.r5.large
      CacheParameterGroupName: !Ref ElastiCacheParameterGroup
      CacheSubnetGroupName: !Ref ElastiCacheSubnetGroup
      Engine: redis
      EngineVersion: 6.2
      NumCacheNodes: 1
      Port: 6379
      PreferredMaintenanceWindow: sun:05:00-sun:06:00
      VpcSecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-elasticache

  # OpenSearch Domain
  OpenSearchDomain:
    Type: AWS::OpenSearchService::Domain
    Properties:
      DomainName: !Sub ${EnvironmentName}-realestate
      EngineVersion: OpenSearch_1.3
      ClusterConfig:
        InstanceType: r5.large.search
        InstanceCount: 2
        ZoneAwarenessEnabled: true
        ZoneAwarenessConfig:
          AvailabilityZoneCount: 2
      EBSOptions:
        EBSEnabled: true
        VolumeType: gp3
        VolumeSize: 100
        Iops: 3000
      EncryptionAtRestOptions:
        Enabled: true
      NodeToNodeEncryptionOptions:
        Enabled: true
      DomainEndpointOptions:
        EnforceHTTPS: true
        TLSSecurityPolicy: Policy-Min-TLS-1-2-2019-07
      AdvancedSecurityOptions:
        Enabled: true
        InternalUserDatabaseEnabled: true
        MasterUserOptions:
          MasterUserName: !Ref DBUsername
          MasterUserPassword: !Ref DBPassword
      VPCOptions:
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        SecurityGroupIds:
          - !Ref OpenSearchSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-opensearch

  # S3 Buckets
  PropertyImagesBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-property-images-${AWS::AccountId}-${AWS::Region}
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToStandardIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
            AllowedOrigins:
              - '*'
            MaxAge: 3000
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-property-images

  PropertyToursBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-property-tours-${AWS::AccountId}-${AWS::Region}
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToStandardIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-property-tours

  # CloudFront Origin Access Identity
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub ${EnvironmentName} OAI for property images and tours

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt PropertyImagesBucket.RegionalDomainName
            Id: PropertyImagesOrigin
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
          - DomainName: !GetAtt PropertyToursBucket.RegionalDomainName
            Id: PropertyToursOrigin
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
        Enabled: true
        HttpVersion: http2
        DefaultRootObject: index.html
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: PropertyImagesOrigin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
        CacheBehaviors:
          - PathPattern: /tours/*
            AllowedMethods:
              - GET
              - HEAD
              - OPTIONS
            TargetOriginId: PropertyToursOrigin
            ViewerProtocolPolicy: redirect-to-https
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
            OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
            TrustedKeyGroups:
              - !Ref CloudFrontKeyGroup
        Logging:
          Bucket: !GetAtt CloudFrontLogsBucket.DomainName
          Prefix: cloudfront/
        Tags:
          - Key: Name
            Value: !Sub ${EnvironmentName}-cloudfront

  # CloudFront Logs Bucket
  CloudFrontLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-cf-logs-${AWS::AccountId}-${AWS::Region}
      AccessControl: Private
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
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-cloudfront-logs

  # CloudFront Key for Signed URLs
  CloudFrontPublicKey:
    Type: AWS::CloudFront::PublicKey
    Properties:
      PublicKeyConfig:
        CallerReference: !Ref AWS::StackName
        Name: !Sub ${EnvironmentName}-cf-public-key
        EncodedKey: |
          -----BEGIN PUBLIC KEY-----
          MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPX+znJwPbNbJ3u/jjUx
          T3KT3HVqI1hv9pqIBkKEpv6iLfnEXvhl5jfJGxs5bRMm0QEgdXOJZWMbJdW0HhIL
          1oSvIwBHMZ/JcQJJUky8B0yI8xG1NRLtWKKwGvU3QpNGA5yZsIA7Ae5JlmP9oJDQ
          AQPnX1xzPcbGI6QCgvfMNR9PbTllZYRBIoHNqPkZQU21gI9aQBaHruMNZpXgYkMJ
          Hd8kpUeW4lSXzx4HtCy8Gq/ZrDtWoUMxe6FcLxy0mVIFnnJbdRgHyXiKqb8WMcSk
          zsY+U/zeDUVx0H0D2+EJv0w8z7zJbtUQlJZ7M5dWxX2G/wn6JxiP3RgGXeaZEIxh
          swIDAQAB
          -----END PUBLIC KEY-----

  CloudFrontKeyGroup:
    Type: AWS::CloudFront::KeyGroup
    Properties:
      KeyGroupConfig:
        Items:
          - !Ref CloudFrontPublicKey
        Name: !Sub ${EnvironmentName}-cf-key-group

  # S3 Bucket Policies
  PropertyImagesBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref PropertyImagesBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId
            Action: 's3:GetObject'
            Resource: !Sub ${PropertyImagesBucket.Arn}/*

  PropertyToursBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref PropertyToursBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId
            Action: 's3:GetObject'
            Resource: !Sub ${PropertyToursBucket.Arn}/*

  # Lambda Functions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
        - arn:aws:iam::aws:policy/AmazonS3FullAccess

  MortgageCalculatorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-mortgage-calculator
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            // Simple mortgage calculator logic
            const { principal, rate, years } = JSON.parse(event.body);
            const monthlyRate = rate / 100 / 12;
            const payments = years * 12;
            const x = Math.pow(1 + monthlyRate, payments);
            const monthly = (principal * x * monthlyRate) / (x - 1);

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                monthlyPayment: monthly.toFixed(2),
                totalPayment: (monthly * payments).toFixed(2),
                totalInterest: ((monthly * payments) - principal).toFixed(2)
              })
            };
          };
      Runtime: nodejs18.x
      Timeout: 10
      MemorySize: 128
      Environment:
        Variables:
          STAGE: !Ref EnvironmentName
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-mortgage-calculator

  ImageProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-image-processing
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const s3 = new AWS.S3();
          const rekognition = new AWS.Rekognition();
          const dynamodb = new AWS.DynamoDB.DocumentClient();

          exports.handler = async (event) => {
            for (const record of event.Records) {
              const bucket = record.s3.bucket.name;
              const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

              // Call Rekognition to analyze image
              const rekognitionParams = {
                Image: {
                  S3Object: {
                    Bucket: bucket,
                    Name: key
                  }
                },
                MaxLabels: 10
              };

              try {
                const rekognitionResponse = await rekognition.detectLabels(rekognitionParams).promise();

                // Process and store metadata
                const metadata = {
                  imageKey: key,
                  labels: rekognitionResponse.Labels.map(label => ({
                    name: label.Name,
                    confidence: label.Confidence
                  })),
                  processedAt: new Date().toISOString()
                };

                // Store metadata in DynamoDB
                await dynamodb.put({
                  TableName: process.env.METADATA_TABLE,
                  Item: metadata
                }).promise();

                console.log(`Successfully processed ${key}`);
              } catch (error) {
                console.error(`Error processing ${key}: ${error.message}`);
                throw error;
              }
            }
          };
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          METADATA_TABLE: !Sub ${EnvironmentName}-image-metadata
          STAGE: !Ref EnvironmentName
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-image-processing

  ImageMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-image-metadata
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: imageKey
          AttributeType: S
      KeySchema:
        - AttributeName: imageKey
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-image-metadata-table

  # S3 Bucket Notification Configuration
  PropertyImagesBucketNotificationConfiguration:
    Type: AWS::S3::BucketNotification
    Properties:
      Bucket: !Ref PropertyImagesBucket
      LambdaConfigurations:
        - Event: s3:ObjectCreated:*
          Filter:
            S3Key:
              Rules:
                - Name: suffix
                  Value: .jpg
                - Name: suffix
                  Value: .jpeg
                - Name: suffix
                  Value: .png
          Function: !GetAtt ImageProcessingFunction.Arn

  # Lambda Permission for S3
  ImageProcessingPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt ImageProcessingFunction.Arn
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !GetAtt PropertyImagesBucket.Arn

  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub ${EnvironmentName}-realestate-api
      Description: API for Real Estate Platform
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-api-gateway

  MortgageCalculatorResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: mortgage-calculator

  MortgageCalculatorMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref MortgageCalculatorResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${MortgageCalculatorFunction.Arn}/invocations
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true

  MortgageCalculatorOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref MortgageCalculatorResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
            ResponseTemplates:
              application/json: "{}"
        PassthroughBehavior: WHEN_NO_MATCH
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - MortgageCalculatorMethod
      - MortgageCalculatorOptionsMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref EnvironmentName

  LambdaPermissionForApiGateway:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt MortgageCalculatorFunction.Arn
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*

  # Amazon Cognito
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub ${EnvironmentName}-users
      UsernameAttributes:
        - email
      AutoVerifiedAttributes:
        - email
      EmailVerificationMessage: Your verification code is {####}
      EmailVerificationSubject: Your verification code
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
          RequireUppercase: true
      Schema:
        - Name: email
          AttributeDataType: String
          Mutable: true
          Required: true
        - Name: given_name
          AttributeDataType: String
          Mutable: true
          Required: true
        - Name: family_name
          AttributeDataType: String
          Mutable: true
          Required: true
      MfaConfiguration: 'OFF'
      AdminCreateUserConfig:
        AllowAdminCreateUserOnly: false
      UserPoolTags:
        Name: !Sub ${EnvironmentName}-user-pool

  UserPoolDomain:
    Type: AWS::Cognito::UserPoolDomain
    Properties:
      Domain: !Sub ${EnvironmentName}-realestate-${AWS::AccountId}
      UserPoolId: !Ref UserPool

  UserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub ${EnvironmentName}-web-client
      UserPoolId: !Ref UserPool
      ExplicitAuthFlows:
        - ALLOW_USER_SRP_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
      GenerateSecret: false
      PreventUserExistenceErrors: ENABLED
      RefreshTokenValidity: 30
      SupportedIdentityProviders:
        - COGNITO

  IdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: !Sub ${EnvironmentName}IdentityPool
      AllowUnauthenticatedIdentities: false
      CognitoIdentityProviders:
        - ClientId: !Ref UserPoolClient
          ProviderName: !GetAtt UserPool.ProviderName

  IdentityPoolRoleAttachment:
    Type: AWS::Cognito::IdentityPoolRoleAttachment
    Properties:
      IdentityPoolId: !Ref IdentityPool
      Roles:
        authenticated: !GetAtt AuthenticatedRole.Arn
        unauthenticated: !GetAtt UnauthenticatedRole.Arn

  AuthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: cognito-identity.amazonaws.com
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                cognito-identity.amazonaws.com:aud: !Ref IdentityPool
              ForAnyValue:StringLike:
                cognito-identity.amazonaws.com:amr: authenticated
      Policies:
        - PolicyName: AuthenticatedPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - mobileanalytics:PutEvents
                  - cognito-sync:*
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource:
                  - !Sub ${PropertyImagesBucket.Arn}/*
                  - !Sub ${PropertyToursBucket.Arn}/*
              - Effect: Allow
                Action:
                  - execute-api:Invoke
                Resource: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*

  UnauthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: cognito-identity.amazonaws.com
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                cognito-identity.amazonaws.com:aud: !Ref IdentityPool
              ForAnyValue:StringLike:
                cognito-identity.amazonaws.com:amr: unauthenticated
      Policies:
        - PolicyName: UnauthenticatedPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - mobileanalytics:PutEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub ${PropertyImagesBucket.Arn}/public/*

  # Amazon SES Configuration
  SESEmailIdentity:
    Type: AWS::SES::EmailIdentity
    Properties:
      EmailIdentity: noreply@example.com

  # CloudWatch Dashboard
  Dashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub ${EnvironmentName}-realestate-dashboard
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ECS", "CPUUtilization", "ServiceName", "${WebAppService}", "ClusterName", "${ECSCluster}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ECS CPU Utilization"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ECS", "MemoryUtilization", "ServiceName", "${WebAppService}", "ClusterName", "${ECSCluster}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ECS Memory Utilization"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/RDS", "CPUUtilization", "DBClusterIdentifier", "${AuroraDBCluster}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Aurora CPU Utilization"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${ElastiCacheCluster}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ElastiCache CPU Utilization"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Count", "ApiName", "${ApiGateway}" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "API Requests"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${MortgageCalculatorFunction}" ],
                  [ "AWS/Lambda", "Errors", "FunctionName", "${MortgageCalculatorFunction}" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Lambda Invocations and Errors"
              }
            }
          ]
        }

  # CloudWatch Alarms
  CPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-high-cpu-alarm
      AlarmDescription: Alarm if CPU usage is high
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt WebAppService.Name
        - Name: ClusterName
          Value: !Ref ECSCluster
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertNotificationTopic

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-db-cpu-alarm
      AlarmDescription: Alarm if database CPU usage is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertNotificationTopic

  APILatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-api-latency-alarm
      AlarmDescription: Alarm if API latency is high
      MetricName: Latency
      Namespace: AWS/ApiGateway
      Dimensions:
        - Name: ApiName
          Value: !Ref ApiGateway
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertNotificationTopic

  # SNS Topic for Alerts
  AlertNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub ${EnvironmentName}-alerts
      TopicName: !Sub ${EnvironmentName}-alerts

  # EventBridge Rules for Scheduled Tasks
  DailyMaintenanceRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub ${EnvironmentName}-daily-maintenance
      ScheduleExpression: cron(0 3 * * ? *)
      State: ENABLED
      Targets:
        - Arn: !GetAtt MaintenanceFunction.Arn
          Id: MaintenanceFunction

  MaintenanceFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-maintenance
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log('Executing daily maintenance tasks...');
            // Placeholder for maintenance tasks
            return {
              statusCode: 200,
              body: 'Maintenance completed successfully'
            };
          };
      Runtime: nodejs18.x
      Timeout: 60
      MemorySize: 128
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-maintenance-function

  MaintenanceFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt MaintenanceFunction.Arn
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DailyMaintenanceRule.Arn

  # AWS Config
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: One_Hour
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: config

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSConfigRole
      Policies:
        - PolicyName: S3BucketDelivery
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub ${ConfigBucket.Arn}/*
                Condition:
                  StringEquals:
                    s3:x-amz-acl: bucket-owner-full-control
              - Effect: Allow
                Action: s3:GetBucketAcl
                Resource: !GetAtt ConfigBucket.Arn

  ConfigBucket:
    Type
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-config-${AWS::AccountId}-${AWS::Region}
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldConfig
            Status: Enabled
            ExpirationInDays: 90
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-config-bucket

  # Secrets Manager
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${EnvironmentName}-db-credentials
      Description: Aurora database credentials
      SecretString: !Sub |
        {
          "username": "${DBUsername}",
          "password": "${DBPassword}",
          "engine": "mysql",
          "host": "${AuroraDBCluster.Endpoint.Address}",
          "port": 3306,
          "dbname": "${DBName}"
        }
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-secret

  SecretAuroraAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref AuroraDBCluster
      TargetType: AWS::RDS::DBCluster

  # Additional Lambda for Search Indexing
  SearchIndexingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-search-indexing
      Handler: index.handler
      Role: !GetAtt SearchIndexingRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const opensearch = new AWS.OpenSearchService();
          const dynamodb = new AWS.DynamoDB.DocumentClient();

          exports.handler = async (event) => {
            console.log('Processing DynamoDB stream records:', JSON.stringify(event));

            for (const record of event.Records) {
              if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

                // Index to OpenSearch
                const document = {
                  id: newImage.propertyId,
                  location: {
                    lat: newImage.latitude,
                    lon: newImage.longitude
                  },
                  price: newImage.price,
                  bedrooms: newImage.bedrooms,
                  bathrooms: newImage.bathrooms,
                  sqft: newImage.sqft,
                  description: newImage.description,
                  timestamp: new Date().toISOString()
                };

                console.log('Indexed document:', document);
              }
            }

            return { statusCode: 200 };
          };
      Runtime: nodejs18.x
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          OPENSEARCH_ENDPOINT: !GetAtt OpenSearchDomain.DomainEndpoint
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-search-indexing

  SearchIndexingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: OpenSearchAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - es:ESHttpPost
                  - es:ESHttpPut
                Resource: !Sub ${OpenSearchDomain.Arn}/*
        - PolicyName: DynamoDBStreamAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeStream
                  - dynamodb:GetRecords
                  - dynamodb:GetShardIterator
                  - dynamodb:ListStreams
                Resource: '*'

  # Properties Table with Stream
  PropertiesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-properties
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 10
        WriteCapacityUnits: 10
      AttributeDefinitions:
        - AttributeName: propertyId
          AttributeType: S
        - AttributeName: listingDate
          AttributeType: S
        - AttributeName: priceRange
          AttributeType: S
      KeySchema:
        - AttributeName: propertyId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ListingDateIndex
          KeySchema:
            - AttributeName: listingDate
              KeyType: HASH
            - AttributeName: propertyId
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
        - IndexName: PriceRangeIndex
          KeySchema:
            - AttributeName: priceRange
              KeyType: HASH
            - AttributeName: propertyId
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-properties-table

  # Event Source Mapping for DynamoDB Stream
  SearchIndexingEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt PropertiesTable.StreamArn
      FunctionName: !GetAtt SearchIndexingFunction.Arn
      StartingPosition: TRIM_HORIZON
      MaximumBatchingWindowInSeconds: 10

  # Appointment Scheduling Lambda
  AppointmentSchedulingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-appointment-scheduling
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const ses = new AWS.SES();

          exports.handler = async (event) => {
            const { userId, propertyId, appointmentDate, appointmentTime } = JSON.parse(event.body);

            const appointmentId = `${userId}-${propertyId}-${Date.now()}`;

            // Store appointment in DynamoDB
            await dynamodb.put({
              TableName: process.env.APPOINTMENTS_TABLE,
              Item: {
                appointmentId,
                userId,
                propertyId,
                appointmentDate,
                appointmentTime,
                status: 'scheduled',
                createdAt: new Date().toISOString()
              }
            }).promise();

            // Send confirmation email
            const emailParams = {
              Source: 'noreply@example.com',
              Destination: {
                ToAddresses: [event.userEmail]
              },
              Message: {
                Subject: {
                  Data: 'Appointment Confirmation'
                },
                Body: {
                  Text: {
                    Data: `Your appointment for property ${propertyId} is confirmed for ${appointmentDate} at ${appointmentTime}.`
                  }
                }
              }
            };

            await ses.sendEmail(emailParams).promise();

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                appointmentId,
                message: 'Appointment scheduled successfully'
              })
            };
          };
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          APPOINTMENTS_TABLE: !Ref AppointmentsTable
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-appointment-scheduling

  AppointmentsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-appointments
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      AttributeDefinitions:
        - AttributeName: appointmentId
          AttributeType: S
        - AttributeName: userId
          AttributeType: S
        - AttributeName: appointmentDate
          AttributeType: S
      KeySchema:
        - AttributeName: appointmentId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserAppointmentsIndex
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
            - AttributeName: appointmentDate
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-appointments-table

  # API Gateway Resources for Appointment Scheduling
  AppointmentResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: appointments

  AppointmentMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref AppointmentResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${AppointmentSchedulingFunction.Arn}/invocations
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true

  AppointmentLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt AppointmentSchedulingFunction.Arn
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*

  # EventBridge Rule for Appointment Reminders
  AppointmentReminderRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub ${EnvironmentName}-appointment-reminders
      ScheduleExpression: rate(1 hour)
      State: ENABLED
      Targets:
        - Arn: !GetAtt AppointmentReminderFunction.Arn
          Id: AppointmentReminderFunction

  AppointmentReminderFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-appointment-reminder
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const sns = new AWS.SNS();

          exports.handler = async (event) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];

            // Query appointments for tomorrow
            const params = {
              TableName: process.env.APPOINTMENTS_TABLE,
              IndexName: 'UserAppointmentsIndex',
              KeyConditionExpression: 'appointmentDate = :date',
              ExpressionAttributeValues: {
                ':date': tomorrowDate
              }
            };

            const result = await dynamodb.query(params).promise();

            // Send reminders for each appointment
            for (const appointment of result.Items) {
              const message = `Reminder: You have an appointment scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}`;

              await sns.publish({
                TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
                Message: message,
                Subject: 'Appointment Reminder'
              }).promise();
            }

            return {
              statusCode: 200,
              body: `Sent ${result.Items.length} reminders`
            };
          };
      Runtime: nodejs18.x
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          APPOINTMENTS_TABLE: !Ref AppointmentsTable
          NOTIFICATION_TOPIC_ARN: !Ref AlertNotificationTopic
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-appointment-reminder

  AppointmentReminderPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt AppointmentReminderFunction.Arn
      Principal: events.amazonaws.com
      SourceArn: !GetAtt AppointmentReminderRule.Arn

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-vpc-id

  ALBDNSName:
    Description: ALB DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-alb-dns

  CloudFrontURL:
    Description: CloudFront Distribution URL
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub ${EnvironmentName}-cloudfront-url

  APIGatewayURL:
    Description: API Gateway URL
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}
    Export:
      Name: !Sub ${EnvironmentName}-api-url

  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref UserPool
    Export:
      Name: !Sub ${EnvironmentName}-user-pool-id

  UserPoolClientId:
    Description: Cognito User Pool Client ID
    Value: !Ref UserPoolClient
    Export:
      Name: !Sub ${EnvironmentName}-user-pool-client-id

  IdentityPoolId:
    Description: Cognito Identity Pool ID
    Value: !Ref IdentityPool
    Export:
      Name: !Sub ${EnvironmentName}-identity-pool-id

  DatabaseEndpoint:
    Description: Aurora Database Endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-db-endpoint

  DatabaseReadEndpoint:
    Description: Aurora Database Read Endpoint
    Value: !GetAtt AuroraDBCluster.ReaderEndpoint
    Export:
      Name: !Sub ${EnvironmentName}-db-read-endpoint

  ElastiCacheEndpoint:
    Description: ElastiCache Redis Endpoint
    Value: !GetAtt ElastiCacheCluster.RedisEndpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-redis-endpoint

  OpenSearchEndpoint:
    Description: OpenSearch Domain Endpoint
    Value: !GetAtt OpenSearchDomain.DomainEndpoint
    Export:
      Name: !Sub ${EnvironmentName}-opensearch-endpoint

  PropertyImagesBucket:
    Description: S3 Bucket for Property Images
    Value: !Ref PropertyImagesBucket
    Export:
      Name: !Sub ${EnvironmentName}-property-images-bucket

  PropertyToursBucket:
    Description: S3 Bucket for Property Tours
    Value: !Ref PropertyToursBucket
    Export:
      Name: !Sub ${EnvironmentName}-property-tours-bucket

  PropertiesTableName:
    Description: DynamoDB Properties Table
    Value: !Ref PropertiesTable
    Export:
      Name: !Sub ${EnvironmentName}-properties-table

  UserFavoritesTableName:
    Description: DynamoDB User Favorites Table
    Value: !Ref UserFavoritesTable
    Export:
      Name: !Sub ${EnvironmentName}-user-favorites-table

  AppointmentsTableName:
    Description: DynamoDB Appointments Table
    Value: !Ref AppointmentsTable
    Export:
      Name: !Sub ${EnvironmentName}-appointments-table

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub ${EnvironmentName}-ecs-cluster

  WebAppServiceName:
    Description: ECS Web Application Service Name
    Value: !GetAtt WebAppService.Name
    Export:
      Name: !Sub ${EnvironmentName}-webapp-service

  AlertTopicArn:
    Description: SNS Topic for Alerts
    Value: !Ref AlertNotificationTopic
    Export:
      Name: !Sub ${EnvironmentName}-alert-topic-arn
```
