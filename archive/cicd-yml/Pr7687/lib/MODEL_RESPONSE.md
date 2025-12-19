### Reasoning Trace
---

This is a comprehensive CloudFormation template request for a multi-environment CI/CD pipeline. Let me break down what needs to be included:

1. **Three Isolated VPCs** (Dev, Staging, Prod) with:
   - Private subnets across 2 AZs
   - Public subnets for NAT Gateways
   - NAT Gateways for outbound access
   - No cross-environment routing

2. **ECR Repository** with:
   - Image scanning on push
   - Lifecycle policy for untagged images

3. **CodeCommit Repository** with branch triggers

4. **S3 Artifact Bucket** with:
   - KMS encryption
   - Versioning
   - 30-day lifecycle policy

5. **Parameter Store** hierarchies:
   - /app/dev/*
   - /app/staging/*
   - /app/prod/*
   - All using KMS encryption

6. **ECS Clusters & Services** for each environment:
   - Fargate launch type
   - ALBs and target groups for blue/green

7. **CodeDeploy** for blue/green deployments with automatic rollback

8. **CodeBuild Projects** for:
   - Docker image building
   - Unit tests
   - Integration tests

9. **CodePipeline** with stages:
   - Source (CodeCommit)
   - Build
   - Test
   - Deploy-Dev
   - Deploy-Staging
   - Manual Approval
   - Deploy-Prod

10. **CloudWatch Alarms** for:
    - Deployment failures
    - Container health
    - Resource utilization

11. **SNS Topic** for notifications

12. **IAM Roles** with least privilege for:
    - CodePipeline
    - CodeBuild
    - CodeDeploy
    - ECS Task execution and task roles

This is a large template, so I'll need to structure it carefully with clear sections and comments.


I'll start by designing a modular approach that allows for flexible, environment-specific configurations while maintaining robust security and deployment practices.
### Answer 
---

```yaml
# ci-cd.yml
AWSTemplateFormatVersion: "2010-09-09"
Description: >
  Multi-environment CI/CD for containerized applications (dev/staging/prod)
  with isolated VPCs, ECR scanning, CodePipeline, CodeBuild, ECS Fargate,
  CodeDeploy blue/green, Parameter Store, CloudWatch, SNS, and S3 artifacts.

Parameters:
  ApplicationName:
    Type: String
    Default: containerized-app
    Description: Name of the application
  
  NotificationEmail:
    Type: String
    Description: Email address for pipeline notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  
  GitBranch:
    Type: String
    Default: main
    Description: Git branch to track
    AllowedValues:
      - main
      - dev
      - staging

Mappings:
  EnvironmentConfig:
    dev:
      VpcCidr: 10.0.0.0/16
      PublicSubnet1Cidr: 10.0.1.0/24
      PublicSubnet2Cidr: 10.0.2.0/24
      PrivateSubnet1Cidr: 10.0.10.0/24
      PrivateSubnet2Cidr: 10.0.11.0/24
    staging:
      VpcCidr: 10.1.0.0/16
      PublicSubnet1Cidr: 10.1.1.0/24
      PublicSubnet2Cidr: 10.1.2.0/24
      PrivateSubnet1Cidr: 10.1.10.0/24
      PrivateSubnet2Cidr: 10.1.11.0/24
    prod:
      VpcCidr: 10.2.0.0/16
      PublicSubnet1Cidr: 10.2.1.0/24
      PublicSubnet2Cidr: 10.2.2.0/24
      PrivateSubnet1Cidr: 10.2.10.0/24
      PrivateSubnet2Cidr: 10.2.11.0/24

Resources:
  # ==========================================
  # KMS Keys
  # ==========================================
  
  ArtifactKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for pipeline artifacts encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - codepipeline.amazonaws.com
                - codebuild.amazonaws.com
                - s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  ArtifactKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-artifacts'
      TargetKeyId: !Ref ArtifactKMSKey

  ParameterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Parameter Store encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow ECS tasks to decrypt parameters
            Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action:
              - 'kms:Decrypt'
            Resource: '*'
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  ParameterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-parameters'
      TargetKeyId: !Ref ParameterKMSKey

  # ==========================================
  # VPCs - Development Environment
  # ==========================================
  
  DevVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, dev, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-vpc'
        - Key: Environment
          Value: dev
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  DevInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-igw'
        - Key: Environment
          Value: dev

  DevVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref DevVpc
      InternetGatewayId: !Ref DevInternetGateway

  DevPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVpc
      CidrBlock: !FindInMap [EnvironmentConfig, dev, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-public-1'
        - Key: Environment
          Value: dev

  DevPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVpc
      CidrBlock: !FindInMap [EnvironmentConfig, dev, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-public-2'
        - Key: Environment
          Value: dev

  DevPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVpc
      CidrBlock: !FindInMap [EnvironmentConfig, dev, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-private-1'
        - Key: Environment
          Value: dev

  DevPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVpc
      CidrBlock: !FindInMap [EnvironmentConfig, dev, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-private-2'
        - Key: Environment
          Value: dev

  DevNatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: DevVPCGatewayAttachment
    Properties:
      Domain: vpc

  DevNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt DevNatGatewayEIP1.AllocationId
      SubnetId: !Ref DevPublicSubnet1

  DevPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-public-rt'
        - Key: Environment
          Value: dev

  DevPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: DevVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref DevPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref DevInternetGateway

  DevPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPublicSubnet1
      RouteTableId: !Ref DevPublicRouteTable

  DevPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPublicSubnet2
      RouteTableId: !Ref DevPublicRouteTable

  DevPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-private-rt'
        - Key: Environment
          Value: dev

  DevPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref DevPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref DevNatGateway1

  DevPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPrivateSubnet1
      RouteTableId: !Ref DevPrivateRouteTable

  DevPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPrivateSubnet2
      RouteTableId: !Ref DevPrivateRouteTable

  # ==========================================
  # VPCs - Staging Environment
  # ==========================================
  
  StagingVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, staging, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-vpc'
        - Key: Environment
          Value: staging
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  StagingInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-igw'
        - Key: Environment
          Value: staging

  StagingVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref StagingVpc
      InternetGatewayId: !Ref StagingInternetGateway

  StagingPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVpc
      CidrBlock: !FindInMap [EnvironmentConfig, staging, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-public-1'
        - Key: Environment
          Value: staging

  StagingPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVpc
      CidrBlock: !FindInMap [EnvironmentConfig, staging, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-public-2'
        - Key: Environment
          Value: staging

  StagingPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVpc
      CidrBlock: !FindInMap [EnvironmentConfig, staging, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-private-1'
        - Key: Environment
          Value: staging

  StagingPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVpc
      CidrBlock: !FindInMap [EnvironmentConfig, staging, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-private-2'
        - Key: Environment
          Value: staging

  StagingNatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: StagingVPCGatewayAttachment
    Properties:
      Domain: vpc

  StagingNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt StagingNatGatewayEIP1.AllocationId
      SubnetId: !Ref StagingPublicSubnet1

  StagingPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref StagingVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-public-rt'
        - Key: Environment
          Value: staging

  StagingPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: StagingVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref StagingPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref StagingInternetGateway

  StagingPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref StagingPublicSubnet1
      RouteTableId: !Ref StagingPublicRouteTable

  StagingPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref StagingPublicSubnet2
      RouteTableId: !Ref StagingPublicRouteTable

  StagingPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref StagingVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-private-rt'
        - Key: Environment
          Value: staging

  StagingPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref StagingPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref StagingNatGateway1

  StagingPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref StagingPrivateSubnet1
      RouteTableId: !Ref StagingPrivateRouteTable

  StagingPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref StagingPrivateSubnet2
      RouteTableId: !Ref StagingPrivateRouteTable

  # ==========================================
  # VPCs - Production Environment
  # ==========================================
  
  ProdVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, prod, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-vpc'
        - Key: Environment
          Value: prod
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-igw'
        - Key: Environment
          Value: prod

  ProdVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVpc
      InternetGatewayId: !Ref ProdInternetGateway

  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: !FindInMap [EnvironmentConfig, prod, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-public-1'
        - Key: Environment
          Value: prod

  ProdPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: !FindInMap [EnvironmentConfig, prod, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-public-2'
        - Key: Environment
          Value: prod

  ProdPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: !FindInMap [EnvironmentConfig, prod, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-private-1'
        - Key: Environment
          Value: prod

  ProdPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: !FindInMap [EnvironmentConfig, prod, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-private-2'
        - Key: Environment
          Value: prod

  ProdNatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      Domain: vpc

  ProdNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNatGatewayEIP1.AllocationId
      SubnetId: !Ref ProdPublicSubnet1

  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-public-rt'
        - Key: Environment
          Value: prod

  ProdPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProdInternetGateway

  ProdPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet1
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet2
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-private-rt'
        - Key: Environment
          Value: prod

  ProdPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProdNatGateway1

  ProdPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet1
      RouteTableId: !Ref ProdPrivateRouteTable

  ProdPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet2
      RouteTableId: !Ref ProdPrivateRouteTable

  # ==========================================
  # ECR Repository
  # ==========================================
  
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub '${ApplicationName}'
      ImageScanningConfiguration:
        ScanOnPush: true
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Remove untagged images after 7 days",
                "selection": {
                  "tagStatus": "untagged",
                  "countType": "sinceImagePushed",
                  "countUnit": "days",
                  "countNumber": 7
                },
                "action": {
                  "type": "expire"
                }
              },
              {
                "rulePriority": 2,
                "description": "Keep only 10 most recent images",
                "selection": {
                  "tagStatus": "any",
                  "countType": "imageCountMoreThan",
                  "countNumber": 10
                },
                "action": {
                  "type": "expire"
                }
              }
            ]
          }
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  # ==========================================
  # CodeCommit Repository
  # ==========================================
  
  CodeCommitRepository:
    Type: AWS::CodeCommit::Repository
    Properties:
      RepositoryName: !Sub '${ApplicationName}'
      RepositoryDescription: Source repository for containerized application
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  # ==========================================
  # S3 Bucket for Artifacts
  # ==========================================
  
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-artifacts-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt ArtifactKMSKey.Arn
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline
        - Key: ManagedBy
          Value: CloudFormation

  # ==========================================
  # Parameter Store
  # ==========================================
  
  DevDatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/dev/database/endpoint
      Type: String
      Value: dev-db.example.com
      Description: Development database endpoint
      Tags:
        Environment: dev
        Project: ContainerizedAppPipeline

  DevDatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/dev/database/password
      Type: String
      Value: changeme-dev
      Description: Development database password
      KmsKeyId: !Ref ParameterKMSKey
      Tags:
        Environment: dev
        Project: ContainerizedAppPipeline

  StagingDatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/staging/database/endpoint
      Type: String
      Value: staging-db.example.com
      Description: Staging database endpoint
      Tags:
        Environment: staging
        Project: ContainerizedAppPipeline

  StagingDatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/staging/database/password
      Type: String
      Value: changeme-staging
      Description: Staging database password
      KmsKeyId: !Ref ParameterKMSKey
      Tags:
        Environment: staging
        Project: ContainerizedAppPipeline

  ProdDatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/prod/database/endpoint
      Type: String
      Value: prod-db.example.com
      Description: Production database endpoint
      Tags:
        Environment: prod
        Project: ContainerizedAppPipeline

  ProdDatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /app/prod/database/password
      Type: String
      Value: changeme-prod
      Description: Production database password
      KmsKeyId: !Ref ParameterKMSKey
      Tags:
        Environment: prod
        Project: ContainerizedAppPipeline

  # ==========================================
  # Security Groups
  # ==========================================
  
  DevECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Dev ECS tasks
      VpcId: !Ref DevVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-dev-ecs-sg'
        - Key: Environment
          Value: dev

  StagingECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Staging ECS tasks
      VpcId: !Ref StagingVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-staging-ecs-sg'
        - Key: Environment
          Value: staging

  ProdECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Prod ECS tasks
      VpcId: !Ref ProdVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-prod-ecs-sg'
        - Key: Environment
          Value: prod

  # ==========================================
  # Load Balancers
  # ==========================================
  
  DevALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ApplicationName}-dev-alb'
      Type: application
      Subnets:
        - !Ref DevPublicSubnet1
        - !Ref DevPublicSubnet2
      SecurityGroups:
        - !Ref DevECSSecurityGroup
      Tags:
        - Key: Environment
          Value: dev
        - Key: Project
          Value: ContainerizedAppPipeline

  DevTargetGroupBlue:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-dev-tg-blue'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref DevVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: dev

  DevTargetGroupGreen:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-dev-tg-green'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref DevVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: dev

  DevListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref DevALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref DevTargetGroupBlue

  StagingALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ApplicationName}-staging-alb'
      Type: application
      Subnets:
        - !Ref StagingPublicSubnet1
        - !Ref StagingPublicSubnet2
      SecurityGroups:
        - !Ref StagingECSSecurityGroup
      Tags:
        - Key: Environment
          Value: staging
        - Key: Project
          Value: ContainerizedAppPipeline

  StagingTargetGroupBlue:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-staging-tg-blue'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref StagingVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: staging

  StagingTargetGroupGreen:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-staging-tg-green'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref StagingVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: staging

  StagingListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref StagingALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref StagingTargetGroupBlue

  ProdALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ApplicationName}-prod-alb'
      Type: application
      Subnets:
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      SecurityGroups:
        - !Ref ProdECSSecurityGroup
      Tags:
        - Key: Environment
          Value: prod
        - Key: Project
          Value: ContainerizedAppPipeline

  ProdTargetGroupBlue:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-prod-tg-blue'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref ProdVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: prod

  ProdTargetGroupGreen:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ApplicationName}-prod-tg-green'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref ProdVpc
      HealthCheckPath: /health
      Tags:
        - Key: Environment
          Value: prod

  ProdListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ProdALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ProdTargetGroupBlue

  # ==========================================
  # ECS Clusters
  # ==========================================
  
  DevECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${ApplicationName}-dev'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Environment
          Value: dev
        - Key: Project
          Value: ContainerizedAppPipeline

  StagingECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${ApplicationName}-staging'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Environment
          Value: staging
        - Key: Project
          Value: ContainerizedAppPipeline

  ProdECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${ApplicationName}-prod'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Environment
          Value: prod
        - Key: Project
          Value: ContainerizedAppPipeline

  # ==========================================
  # IAM Roles
  # ==========================================
  
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: ECRAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ecr:GetAuthorizationToken'
                  - 'ecr:BatchCheckLayerAvailability'
                  - 'ecr:GetDownloadUrlForLayer'
                  - 'ecr:BatchGetImage'
                Resource: '*'
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource:
                  - !GetAtt ParameterKMSKey.Arn
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  # ==========================================
  # ECS Task Definitions
  # ==========================================
  
  DevTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub '${ApplicationName}-dev'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '256'
      Memory: '512'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub '${ApplicationName}'
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}:latest'
          PortMappings:
            - ContainerPort: 80
          Environment:
            - Name: ENVIRONMENT
              Value: dev
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref DevLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
      Tags:
        - Key: Environment
          Value: dev

  StagingTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub '${ApplicationName}-staging'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub '${ApplicationName}'
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}:latest'
          PortMappings:
            - ContainerPort: 80
          Environment:
            - Name: ENVIRONMENT
              Value: staging
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref StagingLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
      Tags:
        - Key: Environment
          Value: staging

  ProdTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub '${ApplicationName}-prod'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub '${ApplicationName}'
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}:latest'
          PortMappings:
            - ContainerPort: 80
          Environment:
            - Name: ENVIRONMENT
              Value: prod
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ProdLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
      Tags:
        - Key: Environment
          Value: prod

  # ==========================================
  # CloudWatch Log Groups
  # ==========================================
  
  DevLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/${ApplicationName}/dev'
      RetentionInDays: 7

  StagingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/${ApplicationName}/staging'
      RetentionInDays: 14

  ProdLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/${ApplicationName}/prod'
      RetentionInDays: 30

  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${ApplicationName}'
      RetentionInDays: 30

  # ==========================================
  # ECS Services
  # ==========================================
  
  DevECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - DevListener
    Properties:
      ServiceName: !Sub '${ApplicationName}-dev-service'
      Cluster: !Ref DevECSCluster
      TaskDefinition: !Ref DevTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 1
      DeploymentController:
        Type: CODE_DEPLOY
      LoadBalancers:
        - ContainerName: !Sub '${ApplicationName}'
          ContainerPort: 80
          TargetGroupArn: !Ref DevTargetGroupBlue
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref DevECSSecurityGroup
          Subnets:
            - !Ref DevPrivateSubnet1
            - !Ref DevPrivateSubnet2
      Tags:
        - Key: Environment
          Value: dev

  StagingECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - StagingListener
    Properties:
      ServiceName: !Sub '${ApplicationName}-staging-service'
      Cluster: !Ref StagingECSCluster
      TaskDefinition: !Ref StagingTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 2
      DeploymentController:
        Type: CODE_DEPLOY
      LoadBalancers:
        - ContainerName: !Sub '${ApplicationName}'
          ContainerPort: 80
          TargetGroupArn: !Ref StagingTargetGroupBlue
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref StagingECSSecurityGroup
          Subnets:
            - !Ref StagingPrivateSubnet1
            - !Ref StagingPrivateSubnet2
      Tags:
        - Key: Environment
          Value: staging

  ProdECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - ProdListener
    Properties:
      ServiceName: !Sub '${ApplicationName}-prod-service'
      Cluster: !Ref ProdECSCluster
      TaskDefinition: !Ref ProdTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 3
      DeploymentController:
        Type: CODE_DEPLOY
      LoadBalancers:
        - ContainerName: !Sub '${ApplicationName}'
          ContainerPort: 80
          TargetGroupArn: !Ref ProdTargetGroupBlue
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ProdECSSecurityGroup
          Subnets:
            - !Ref ProdPrivateSubnet1
            - !Ref ProdPrivateSubnet2
      Tags:
        - Key: Environment
          Value: prod

  # ==========================================
  # CodeDeploy
  # ==========================================
  
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${ApplicationName}'
      ComputePlatform: ECS
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  CodeDeployServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  DevCodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ApplicationName}-dev'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSAllAtOnceBlueGreen
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
        GreenFleetProvisioningOption:
          Action: COPY_AUTO_SCALING_GROUP
      LoadBalancerInfo:
        TargetGroupPairInfoList:
          - ProdTrafficRoute:
              ListenerArns:
                - !Ref DevListener
            TargetGroups:
              - Name: !GetAtt DevTargetGroupBlue.TargetGroupName
              - Name: !GetAtt DevTargetGroupGreen.TargetGroupName
      ECSServices:
        - ServiceName: !GetAtt DevECSService.Name
          ClusterName: !Ref DevECSCluster
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM

  StagingCodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ApplicationName}-staging'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSLinear10PercentEvery1Minutes
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
        GreenFleetProvisioningOption:
          Action: COPY_AUTO_SCALING_GROUP
      LoadBalancerInfo:
        TargetGroupPairInfoList:
          - ProdTrafficRoute:
              ListenerArns:
                - !Ref StagingListener
            TargetGroups:
              - Name: !GetAtt StagingTargetGroupBlue.TargetGroupName
              - Name: !GetAtt StagingTargetGroupGreen.TargetGroupName
      ECSServices:
        - ServiceName: !GetAtt StagingECSService.Name
          ClusterName: !Ref StagingECSCluster
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM

  ProdCodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ApplicationName}-prod'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSCanary10Percent5Minutes
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 15
        DeploymentReadyOption:
          ActionOnTimeout: STOP_DEPLOYMENT
        GreenFleetProvisioningOption:
          Action: COPY_AUTO_SCALING_GROUP
      LoadBalancerInfo:
        TargetGroupPairInfoList:
          - ProdTrafficRoute:
              ListenerArns:
                - !Ref ProdListener
            TargetGroups:
              - Name: !GetAtt ProdTargetGroupBlue.TargetGroupName
              - Name: !GetAtt ProdTargetGroupGreen.TargetGroupName
      ECSServices:
        - ServiceName: !GetAtt ProdECSService.Name
          ClusterName: !Ref ProdECSCluster
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
          - DEPLOYMENT_STOP_ON_REQUEST

  # ==========================================
  # CodeBuild Projects
  # ==========================================
  
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ecr:GetAuthorizationToken'
                  - 'ecr:BatchCheckLayerAvailability'
                  - 'ecr:GetDownloadUrlForLayer'
                  - 'ecr:BatchGetImage'
                  - 'ecr:PutImage'
                  - 'ecr:InitiateLayerUpload'
                  - 'ecr:UploadLayerPart'
                  - 'ecr:CompleteLayerUpload'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'codecommit:GitPull'
                Resource:
                  - !GetAtt CodeCommitRepository.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt ArtifactKMSKey.Arn
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ApplicationName}-build'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Source:
        Type: CODECOMMIT
        Location: !GetAtt CodeCommitRepository.CloneUrlHttp
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
                - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
                - IMAGE_TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}
            build:
              commands:
                - echo Build started on `date`
                - echo Building the Docker image...
                - docker build -t $REPOSITORY_URI:latest .
                - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker images...
                - docker push $REPOSITORY_URI:latest
                - docker push $REPOSITORY_URI:$IMAGE_TAG
                - printf '[{"name":"%s","imageUri":"%s"}]' $CONTAINER_NAME $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
          artifacts:
            files:
              - imagedefinitions.json
              - '**/*'
      Artifacts:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionDisabled: false
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: IMAGE_REPO_NAME
            Value: !Ref ApplicationName
          - Name: CONTAINER_NAME
            Value: !Ref ApplicationName
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  UnitTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ApplicationName}-unit-tests'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Source:
        Type: CODECOMMIT
        Location: !GetAtt CodeCommitRepository.CloneUrlHttp
        BuildSpec: |
          version: 0.2
          phases:
            install:
              commands:
                - echo Installing dependencies...
                - npm install
            build:
              commands:
                - echo Running unit tests...
                - npm test
          reports:
            test-reports:
              files:
                - 'test-results/**/*'
              file-format: 'JUNITXML'
      Artifacts:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionDisabled: false
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  IntegrationTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ApplicationName}-integration-tests'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Source:
        Type: CODECOMMIT
        Location: !GetAtt CodeCommitRepository.CloneUrlHttp
        BuildSpec: |
          version: 0.2
          phases:
            install:
              commands:
                - echo Installing test dependencies...
                - npm install
            build:
              commands:
                - echo Running integration tests...
                - npm run test:integration
          reports:
            integration-reports:
              files:
                - 'integration-results/**/*'
              file-format: 'JUNITXML'
      Artifacts:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionDisabled: false
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================
  
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ApplicationName}-pipeline-notifications'
      DisplayName: Pipeline Notifications
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  # ==========================================
  # CodePipeline
  # ==========================================
  
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ArtifactBucket.Arn
              - Effect: Allow
                Action:
                  - 'codecommit:GetBranch'
                  - 'codecommit:GetCommit'
                  - 'codecommit:UploadArchive'
                  - 'codecommit:GetUploadArchiveStatus'
                  - 'codecommit:CancelUploadArchive'
                Resource:
                  - !GetAtt CodeCommitRepository.Arn
              - Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource:
                  - !GetAtt BuildProject.Arn
                  - !GetAtt UnitTestProject.Arn
                  - !GetAtt IntegrationTestProject.Arn
              - Effect: Allow
                Action:
                  - 'codedeploy:CreateDeployment'
                  - 'codedeploy:GetApplication'
                  - 'codedeploy:GetApplicationRevision'
                  - 'codedeploy:GetDeployment'
                  - 'codedeploy:GetDeploymentConfig'
                  - 'codedeploy:RegisterApplicationRevision'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'ecs:*'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource:
                  - !Ref PipelineNotificationTopic
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt ArtifactKMSKey.Arn
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ApplicationName}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionKey:
          Id: !GetAtt ArtifactKMSKey.Arn
          Type: KMS
      Stages:
        # Source Stage
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeCommit
                Version: '1'
              Configuration:
                RepositoryName: !GetAtt CodeCommitRepository.Name
                BranchName: !Ref GitBranch
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
        
        # Build Stage
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        
        # Test Stage
        - Name: Test
          Actions:
            - Name: UnitTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref UnitTestProject
              InputArtifacts:
                - Name: SourceOutput
              RunOrder: 1
            - Name: IntegrationTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref IntegrationTestProject
              InputArtifacts:
                - Name: SourceOutput
              RunOrder: 2
        
        # Deploy to Dev
        - Name: Deploy-Dev
          Actions:
            - Name: DeployToDevECS
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref DevCodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: BuildOutput
                AppSpecTemplatePath: appspec.yaml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: BuildOutput
        
        # Deploy to Staging
        - Name: Deploy-Staging
          Actions:
            - Name: DeployToStagingECS
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref StagingCodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: BuildOutput
                AppSpecTemplatePath: appspec.yaml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: BuildOutput
        
        # Manual Approval for Production
        - Name: Approval
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: 'Please review staging deployment and approve for production'
        
        # Deploy to Production
        - Name: Deploy-Prod
          Actions:
            - Name: DeployToProdECS
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref ProdCodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: BuildOutput
                AppSpecTemplatePath: appspec.yaml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: BuildOutput
      Tags:
        - Key: Project
          Value: ContainerizedAppPipeline

  # ==========================================
  # EventBridge Rule for Pipeline Trigger
  # ==========================================
  
  PipelineTriggerRule:
    Type: AWS::Events::Rule
    Properties:
      Description: Trigger pipeline on CodeCommit changes
      EventPattern:
        source:
          - aws.codecommit
        detail-type:
          - CodeCommit Repository State Change
        resources:
          - !GetAtt CodeCommitRepository.Arn
        detail:
          event:
            - referenceCreated
            - referenceUpdated
          referenceType:
            - branch
          referenceName:
            - !Ref GitBranch
      State: ENABLED
      Targets:
        - Arn: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${Pipeline}'
          RoleArn: !GetAtt PipelineTriggerRole.Arn
          Id: 1

  PipelineTriggerRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: TriggerPipeline
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'codepipeline:StartPipelineExecution'
                Resource: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${Pipeline}'

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  
  PipelineFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-pipeline-failure'
      AlarmDescription: Alert when pipeline fails
      MetricName: PipelineExecutionFailure
      Namespace: AWS/CodePipeline
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: PipelineName
          Value: !Ref Pipeline
      AlarmActions:
        - !Ref PipelineNotificationTopic
      TreatMissingData: notBreaching

  DevECSTaskCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-dev-ecs-task-count'
      AlarmDescription: Alert when Dev ECS service has no running tasks
      MetricName: RunningTaskCount
      Namespace: ECS/ContainerInsights
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt DevECSService.Name
        - Name: ClusterName
          Value: !Ref DevECSCluster
      AlarmActions:
        - !Ref PipelineNotificationTopic
      TreatMissingData: breaching

  StagingECSTaskCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-staging-ecs-task-count'
      AlarmDescription: Alert when Staging ECS service has insufficient running tasks
      MetricName: RunningTaskCount
      Namespace: ECS/ContainerInsights
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt StagingECSService.Name
        - Name: ClusterName
          Value: !Ref StagingECSCluster
      AlarmActions:
        - !Ref PipelineNotificationTopic
      TreatMissingData: breaching

  ProdECSTaskCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-prod-ecs-task-count'
      AlarmDescription: Alert when Prod ECS service has insufficient running tasks
      MetricName: RunningTaskCount
      Namespace: ECS/ContainerInsights
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt ProdECSService.Name
        - Name: ClusterName
          Value: !Ref ProdECSCluster
      AlarmActions:
        - !Ref PipelineNotificationTopic
      TreatMissingData: breaching

  DevECSCPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-dev-cpu-utilization'
      AlarmDescription: Alert when Dev ECS service CPU exceeds 80%
      MetricName: CpuUtilized
      Namespace: ECS/ContainerInsights
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt DevECSService.Name
        - Name: ClusterName
          Value: !Ref DevECSCluster
      AlarmActions:
        - !Ref PipelineNotificationTopic

  ProdECSCPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-prod-cpu-utilization'
      AlarmDescription: Alert when Prod ECS service CPU exceeds 80%
      MetricName: CpuUtilized
      Namespace: ECS/ContainerInsights
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt ProdECSService.Name
        - Name: ClusterName
          Value: !Ref ProdECSCluster
      AlarmActions:
        - !Ref PipelineNotificationTopic

Outputs:
  PipelineUrl:
    Description: URL of the CodePipeline
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${Pipeline}/view'
  
  ECRRepositoryUri:
    Description: URI of the ECR repository
    Value: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}'
  
  DevALBUrl:
    Description: Dev Application Load Balancer URL
    Value: !GetAtt DevALB.DNSName
  
  StagingALBUrl:
    Description: Staging Application Load Balancer URL
    Value: !GetAtt StagingALB.DNSName
  
  ProdALBUrl:
    Description: Production Application Load Balancer URL
    Value: !GetAtt ProdALB.DNSName
```