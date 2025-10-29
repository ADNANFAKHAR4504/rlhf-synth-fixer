# IDEAL RESPONSE - CloudFormation Template

This file contains the final, correct CloudFormation YAML template (`TapStack.yml`) with all required infrastructure components and best practices implemented.


```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Fully self-contained CI/CD for ECS Fargate behind ALB using CodePipeline/CodeBuild, public nginx image, long-form intrinsics only, auto-seeded S3 source (no manual edits)

Parameters:
  ProjectName:
    Type: String
    Default: webapp
    AllowedPattern: '^[a-z0-9-]+$'
    Description: Lowercase letters, digits and hyphens only (used in ECR names)
  # FIX: Renamed parameter to EnvironmentSuffix for compliance
  EnvironmentSuffix:
    Type: String
    Default: prod
    AllowedPattern: '^[a-z0-9-]+$'
    Description: Environment suffix for resource isolation (e.g., pr1234, prod)
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
  PublicSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2Cidr:
    Type: String
    Default: 10.0.2.0/24
  PublicSubnet3Cidr:
    Type: String
    Default: 10.0.3.0/24
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.11.0/24
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.12.0/24
  PrivateSubnet3Cidr:
    Type: String
    Default: 10.0.13.0/24
  MonthlyBudgetThreshold:
    Type: Number
    Default: 100
    Description: Monthly spending threshold to trigger a billing alarm (USD)
  UsePublicImage:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Use public nginx image for immediate deployment (true) or ECR image (false)
  CreateConfigRecorder:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Whether to create a new AWS Config Configuration Recorder (only if none exists)
  EnableWAF:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Whether to enable WAF protection for the ALB
  CreateGuardDutyDetector:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Whether to create a new GuardDuty detector (only if none exists)

Conditions:
  IsUSEast1:
    Fn::Equals:
      - Fn::Sub: '${AWS::Region}'
      - us-east-1
  UsePublicImage:
    Fn::Equals:
      - Ref: UsePublicImage
      - 'true'
  CreateConfigRecorder:
    Fn::Equals:
      - Ref: CreateConfigRecorder
      - 'true'
  EnableWAF:
    Fn::Equals:
      - Ref: EnableWAF
      - 'true'
  CreateGuardDutyDetector:
    Fn::Equals:
      - Ref: CreateGuardDutyDetector
      - 'true'

Mappings:
  ELBAccountId:
    us-east-1:
      AccountId: '127311923021'
    us-east-2:
      AccountId: '033677994240'
    us-west-1:
      AccountId: '027434742980'
    us-west-2:
      AccountId: '797873946194'
    ca-central-1:
      AccountId: '985666609251'
    eu-central-1:
      AccountId: '054676820928'
    eu-west-1:
      AccountId: '156460612806'
    eu-west-2:
      AccountId: '652711504416'
    eu-west-3:
      AccountId: '009996457667'
    eu-north-1:
      AccountId: '897822967062'
    eu-south-1:
      AccountId: '635631232127'
    eu-central-2:
      AccountId: '718504428378'
    ap-east-1:
      AccountId: '754344448648'
    ap-northeast-1:
      AccountId: '582318560864'
    ap-northeast-2:
      AccountId: '600734575887'
    ap-northeast-3:
      AccountId: '383597477331'
    ap-southeast-1:
      AccountId: '114774131450'
    ap-southeast-2:
      AccountId: '783225319266'
    ap-southeast-3:
      AccountId: '589379963580'
    ap-south-1:
      AccountId: '718504428378'
    ap-south-2:
      AccountId: '635631232127'
    me-south-1:
      AccountId: '076674570225'
    me-central-1:
      AccountId: '881846578597'
    sa-east-1:
      AccountId: '507241528517'
    af-south-1:
      AccountId: '098369216593'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock:
        Ref: VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-VPC-${AWS::AccountId}'
  
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-IGW-${AWS::AccountId}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId:
        Ref: VPC
      InternetGatewayId:
        Ref: InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      AvailabilityZone: 
        Fn::Select:
          - 0
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PubSubnet-1-${AWS::AccountId}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      AvailabilityZone: 
        Fn::Select:
          - 1
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PubSubnet-2-${AWS::AccountId}'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PublicSubnet3Cidr
      MapPublicIpOnLaunch: true
      AvailabilityZone: 
        Fn::Select:
          - 2
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PubSubnet-3-${AWS::AccountId}'
  
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PubRouteTable-${AWS::AccountId}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId:
        Ref: PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId:
        Ref: InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PublicSubnet1
      RouteTableId:
        Ref: PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PublicSubnet2
      RouteTableId:
        Ref: PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PublicSubnet3
      RouteTableId:
        Ref: PublicRouteTable

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PrivateSubnet1Cidr
      AvailabilityZone: 
        Fn::Select:
          - 0
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PrivSubnet-1-${AWS::AccountId}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PrivateSubnet2Cidr
      AvailabilityZone: 
        Fn::Select:
          - 1
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PrivSubnet-2-${AWS::AccountId}'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock:
        Ref: PrivateSubnet3Cidr
      AvailabilityZone: 
        Fn::Select:
          - 2
          - Fn::GetAZs:
              Ref: AWS::Region
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PrivSubnet-3-${AWS::AccountId}'

  # FIX: Create EIP unconditionally to avoid condition issues
  EIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-EIP-${AWS::AccountId}'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - EIP
          - AllocationId
      SubnetId:
        Ref: PublicSubnet1
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-NAT-${AWS::AccountId}'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-PrivRouteTable-${AWS::AccountId}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PrivateSubnet1
      RouteTableId:
        Ref: PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PrivateSubnet2
      RouteTableId:
        Ref: PrivateRouteTable

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId:
        Ref: PrivateSubnet3
      RouteTableId:
        Ref: PrivateRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ALB-SG-${AWS::AccountId}'
      GroupDescription: Public access to ALB on port 80
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ALB-SG-${AWS::AccountId}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ECS-SG-${AWS::AccountId}'
      GroupDescription: Access from ALB to ECS tasks on port 80
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId:
            Ref: ALBSecurityGroup
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ECS-SG-${AWS::AccountId}'

  # Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: LogsBucketPolicy
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern (max 32 chars for ALB)
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-alb'
      Scheme: internet-facing
      Subnets:
        - Ref: PublicSubnet1
        - Ref: PublicSubnet2
        - Ref: PublicSubnet3
      SecurityGroups:
        - Ref: ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value:
            Ref: LogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-access-logs'
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ALB-${AWS::AccountId}'

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      # Target Group name max 32 chars
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-tg'
      VpcId:
        Ref: VPC
      Port: 80
      Protocol: HTTP
      TargetType: ip
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 10
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Matcher:
        HttpCode: 200-399 

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn:
        Ref: LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn:
            Ref: TargetGroup

  # ECS Resources
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      ClusterName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-cluster-${AWS::AccountId}'
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ECS-Cluster-${AWS::AccountId}'

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      LogGroupName:
        Fn::Sub: '/ecs/${EnvironmentSuffix}-${ProjectName}-svc-${AWS::AccountId}'
      RetentionInDays: 30

  TaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-task-exec-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  TaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-task-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  - Ref: ApplicationSecrets

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-task-${AWS::AccountId}'
      RequiresCompatibilities:
        - FARGATE
      NetworkMode: awsvpc
      Cpu: 256
      Memory: 512
      ExecutionRoleArn:
        Fn::GetAtt:
          - TaskExecutionRole
          - Arn
      TaskRoleArn:
        Fn::GetAtt:
          - TaskRole
          - Arn
      ContainerDefinitions:
        - Name: nginx
          Image:
            Fn::If:
              - UsePublicImage
              - nginx:latest
              - Fn::Sub: '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${EcrRepository}:latest'
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group:
                Ref: LogGroup
              awslogs-region:
                Ref: AWS::Region
              awslogs-stream-prefix: ecs

  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      ServiceName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-service-${AWS::AccountId}'
      Cluster:
        Ref: ECSCluster
      TaskDefinition:
        Ref: TaskDefinition
      LaunchType: FARGATE
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 100
      DesiredCount: 2
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets:
            - Ref: PrivateSubnet1
            - Ref: PrivateSubnet2
            - Ref: PrivateSubnet3
          SecurityGroups:
            - Ref: ECSSecurityGroup
          AssignPublicIp: DISABLED
      LoadBalancers:
        - ContainerName: nginx
          ContainerPort: 80
          TargetGroupArn:
            Ref: TargetGroup
  
  # Auto Scaling
  ServiceScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 50
      MinCapacity: 2
      ResourceId:
        Fn::Join:
          - /
          - - service
            - Ref: ECSCluster
            - Fn::GetAtt:
                - ECSService
                - Name
      ServiceNamespace: ecs
      ScalableDimension: ecs:service:DesiredCount
      RoleARN:
        Fn::Sub: 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'

  ServiceScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-TargetTrackingPolicy-${AWS::AccountId}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId:
        Ref: ServiceScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 50.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization

  # Additional scaling policy for memory utilization
  ServiceMemoryScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-MemoryScalingPolicy-${AWS::AccountId}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId:
        Ref: ServiceScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization

  # Step scaling policy for high traffic scenarios
  ServiceStepScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-StepScalingPolicy-${AWS::AccountId}'
      PolicyType: StepScaling
      ScalingTargetId:
        Ref: ServiceScalableTarget
      StepScalingPolicyConfiguration:
        AdjustmentType: ChangeInCapacity
        Cooldown: 300
        MetricAggregationType: Average
        StepAdjustments:
          - MetricIntervalLowerBound: 0
            MetricIntervalUpperBound: 10
            ScalingAdjustment: 1
          - MetricIntervalLowerBound: 10
            MetricIntervalUpperBound: 20
            ScalingAdjustment: 3
          - MetricIntervalLowerBound: 20
            ScalingAdjustment: 5

  # ECR Repository
  EcrRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-repository-${AWS::AccountId}'
      ImageScanningConfiguration:
        ScanOnPush: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ecr-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'

  # AWS Secrets Manager for sensitive data handling
  ApplicationSecrets:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-app-secrets-${AWS::AccountId}'
      Description: Application secrets for database credentials and API keys
      SecretString: |
        {
          "database_host": "localhost",
          "database_port": "5432",
          "database_name": "webapp",
          "api_key": "placeholder-key",
          "jwt_secret": "placeholder-jwt-secret"
        }
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-app-secrets-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'
          
  # Pipeline Resources
  
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      # FIX: Added VersioningConfiguration to fix CodePipeline
      VersioningConfiguration:
        Status: Enabled
      # FIX: Apply EnvironmentSuffix naming pattern
      BucketName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-artifact-${AWS::AccountId}'
      # FIX: Removed legacy AccessControl property
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Data encryption at rest
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-artifact-bucket-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'
        - Key: DataClassification
          Value: 'Internal'

  # FIX: Add proper S3 bucket policy instead of legacy AccessControl
  ArtifactBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: ArtifactBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - Fn::GetAtt:
                  - ArtifactBucket
                  - Arn
              - Fn::Sub: '${ArtifactBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-pipeline-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 access for artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:GetBucketVersioning
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - Fn::GetAtt:
                      - ArtifactBucket
                      - Arn
                  - Fn::Sub: '${ArtifactBucket.Arn}/*'
              # CodeBuild access
              - Effect: Allow
                Action:
                  - codebuild:StartBuild
                  - codebuild:StopBuild
                  - codebuild:BatchGetBuilds
                Resource:
                  Fn::GetAtt:
                    - CodeBuildProject
                    - Arn
              # CFN access (simplified for pipeline)
              - Effect: Allow
                Action:
                  - cloudformation:CreateStack
                  - cloudformation:DeleteStack
                  - cloudformation:UpdateStack
                  - cloudformation:DescribeStacks
                  - cloudformation:CreateChangeSet
                  - cloudformation:ExecuteChangeSet
                  - cloudformation:DeleteChangeSet
                  - cloudformation:DescribeChangeSet
                  - cloudformation:DescribeStackEvents
                  - cloudformation:GetTemplate
                  - iam:PassRole
                Resource: '*'
              # ECR access (CodeBuild needs this)
              - Effect: Allow
                Action:
                  - ecr:GetAuthorizationToken
                  - ecr:BatchCheckLayerAvailability
                  - ecr:GetDownloadUrlForLayer
                  - ecr:BatchGetImage
                Resource: '*'
              # ECS Deploy permissions
              - Effect: Allow
                Action:
                  - ecs:DescribeServices
                  - ecs:DescribeTaskDefinition
                  - ecs:DescribeTasks
                  - ecs:ListTasks
                  - ecs:RegisterTaskDefinition
                  - ecs:UpdateService
                Resource: '*'
              # FIX: Add required IAM PassRole permissions to resolve CodePipeline deployment failure
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource:
                  - Fn::GetAtt:
                      - TaskExecutionRole
                      - Arn
                  - Fn::GetAtt:
                      - TaskRole
                      - Arn
                Condition:
                  StringEquals:
                    iam:PassedToService: ecs-tasks.amazonaws.com

  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-codebuild-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  Fn::Sub: 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${EnvironmentSuffix}-${ProjectName}-build-${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - ecr:GetAuthorizationToken
                Resource: '*'
              - Effect: Allow
                Action:
                  - ecr:BatchCheckLayerAvailability
                  - ecr:GetDownloadUrlForLayer
                  - ecr:BatchGetImage
                  - ecr:PutImage
                  - ecr:InitiateLayerUpload
                  - ecr:UploadLayerPart
                  - ecr:CompleteLayerUpload
                Resource:
                  Fn::GetAtt:
                    - EcrRepository
                    - Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:GetBucketVersioning
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - Fn::GetAtt:
                      - ArtifactBucket
                      - Arn
                  - Fn::Sub: '${ArtifactBucket.Arn}/*'

  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-build-${AWS::AccountId}'
      ServiceRole:
        Fn::GetAtt:
          - CodeBuildRole
          - Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: ECR_REPO_NAME
            Value:
              Ref: EcrRepository
          - Name: CONTAINER_NAME
            Value: nginx
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR
                - ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
                - REGION=${AWS_DEFAULT_REGION}
                - ECR_URI=${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO_NAME}
                - aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
            build:
              commands:
                - echo Pulling nginx image from public ECR
                - docker pull public.ecr.aws/nginx/nginx:stable
                - echo Tagging image to private ECR
                - docker tag public.ecr.aws/nginx/nginx:stable ${ECR_URI}:latest
                - echo Pushing image to ECR
                - docker push ${ECR_URI}:latest
                - echo Creating imagedefinitions.json for ECS deploy
                - printf '[{"name":"%s","imageUri":"%s"}]' "${CONTAINER_NAME}" "${ECR_URI}:latest" > imagedefinitions.json
          artifacts:
            files:
              - imagedefinitions.json

  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-pipeline-${AWS::AccountId}'
      RoleArn:
        Fn::GetAtt:
          - CodePipelineRole
          - Arn
      ArtifactStore:
        Type: S3
        Location:
          Ref: ArtifactBucket
      Stages:
        - Name: Source
          Actions:
            - Name: Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
                Version: '1'
              OutputArtifacts:
                - Name: SourceArtifact
              Configuration:
                S3Bucket:
                  Ref: ArtifactBucket
                S3ObjectKey: source/source.zip
                PollForSourceChanges: true
        - Name: Build
          Actions:
            - Name: BuildAndPush
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              InputArtifacts:
                - Name: SourceArtifact
              OutputArtifacts:
                - Name: BuildArtifact
              Configuration:
                ProjectName:
                  Ref: CodeBuildProject
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              InputArtifacts:
                - Name: BuildArtifact
              Configuration:
                ClusterName:
                  Ref: ECSCluster
                ServiceName:
                  Ref: ECSService
                FileName: imagedefinitions.json
  
  # Monitoring
  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-alerts-${AWS::AccountId}'

  AlertsTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - Ref: AlertsTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchAlarms
            Effect: Allow
            Principal:
              Service: cloudwatch.amazonaws.com
            Action: sns:Publish
            Resource:
              Ref: AlertsTopic
          - Sid: AllowEventBridge
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sns:Publish
            Resource:
              Ref: AlertsTopic

  BillingAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: IsUSEast1
    Properties:
      # FIX: Apply EnvironmentSuffix naming pattern
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-billing-${AWS::AccountId}'
      AlarmDescription: Estimated charges exceed monthly threshold
      Namespace: AWS/Billing
      MetricName: EstimatedCharges
      Dimensions:
        - Name: Currency
          Value: USD
      Statistic: Maximum
      Period: 86400
      EvaluationPeriods: 1
      Threshold:
        Ref: MonthlyBudgetThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  # Performance and Error Rate Monitoring Alarms
  ALBResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-alb-response-time-${AWS::AccountId}'
      AlarmDescription: ALB response time is too high
      Namespace: AWS/ApplicationELB
      MetricName: TargetResponseTime
      Dimensions:
        - Name: LoadBalancer
          Value:
            Fn::GetAtt:
              - LoadBalancer
              - LoadBalancerFullName
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2.0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  ALBErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-alb-error-rate-${AWS::AccountId}'
      AlarmDescription: ALB error rate is too high
      Namespace: AWS/ApplicationELB
      MetricName: HTTPCode_Target_5XX_Count
      Dimensions:
        - Name: LoadBalancer
          Value:
            Fn::GetAtt:
              - LoadBalancer
              - LoadBalancerFullName
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  ECSHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ecs-high-cpu-${AWS::AccountId}'
      AlarmDescription: ECS service CPU utilization is too high
      Namespace: AWS/ECS
      MetricName: CPUUtilization
      Dimensions:
        - Name: ServiceName
          Value:
            Fn::GetAtt:
              - ECSService
              - Name
        - Name: ClusterName
          Value:
            Ref: ECSCluster
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  ECSHighMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-ecs-high-memory-${AWS::AccountId}'
      AlarmDescription: ECS service memory utilization is too high
      Namespace: AWS/ECS
      MetricName: MemoryUtilization
      Dimensions:
        - Name: ServiceName
          Value:
            Fn::GetAtt:
              - ECSService
              - Name
        - Name: ClusterName
          Value:
            Ref: ECSCluster
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  # Compliance and Security Resources
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName:
        Fn::Sub: '/aws/cloudtrail/${EnvironmentSuffix}-${ProjectName}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-cloudtrail-logs-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-cloudtrail-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-cloudtrail-bucket-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource:
              Fn::GetAtt:
                - CloudTrailBucket
                - Arn
            Condition:
              StringEquals:
                'AWS:SourceArn':
                  Fn::Sub: 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${EnvironmentSuffix}-${ProjectName}-trail-${AWS::AccountId}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource:
              Fn::Sub: '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn':
                  Fn::Sub: 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${EnvironmentSuffix}-${ProjectName}-trail-${AWS::AccountId}'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-trail-${AWS::AccountId}'
      S3BucketName:
        Ref: CloudTrailBucket
      CloudWatchLogsLogGroupArn:
        Fn::GetAtt:
          - CloudTrailLogGroup
          - Arn
      CloudWatchLogsRoleArn:
        Fn::GetAtt:
          - CloudTrailRole
          - Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - Fn::Sub: '${ArtifactBucket.Arn}/*'
            - Type: AWS::S3::Object
              Values:
                - Fn::Sub: '${CloudTrailBucket.Arn}/*'
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-trail-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-cloudtrail-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailCloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  Fn::GetAtt:
                    - CloudTrailLogGroup
                    - Arn

  # AWS Config for compliance monitoring
  ConfigRole:
    Type: AWS::IAM::Role
    Condition: CreateConfigRecorder
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-config-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole

  ConfigBucket:
    Type: AWS::S3::Bucket
    Condition: CreateConfigRecorder
    Properties:
      BucketName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-config-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-config-bucket-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: CreateConfigRecorder
    Properties:
      Bucket:
        Ref: ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource:
              Fn::GetAtt:
                - ConfigBucket
                - Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount':
                  Ref: AWS::AccountId
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource:
              Fn::GetAtt:
                - ConfigBucket
                - Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount':
                  Ref: AWS::AccountId
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource:
              Fn::Sub: '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount':
                  Ref: AWS::AccountId

  ConfigConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: CreateConfigRecorder
    Properties:
      RoleARN:
        Fn::GetAtt:
          - ConfigRole
          - Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Condition: CreateConfigRecorder
    DependsOn: ConfigBucketPolicy
    Properties:
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-config-delivery-${AWS::AccountId}'
      S3BucketName:
        Ref: ConfigBucket
      S3KeyPrefix: config

  # AWS GuardDuty for Threat Detection (conditional - only if no detector exists)
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Condition: CreateGuardDutyDetector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      DataSources:
        S3Logs:
          Enable: true
        Kubernetes:
          AuditLogs:
            Enable: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-guardduty-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  GuardDutyPublishingDestination:
    Type: AWS::GuardDuty::PublishingDestination
    Condition: CreateGuardDutyDetector
    Properties:
      DetectorId:
        Ref: GuardDutyDetector
      DestinationType: S3
      DestinationProperties:
        DestinationArn:
          Fn::GetAtt:
            - LogsBucket
            - Arn
        KmsKeyArn:
          Fn::Sub: 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/s3'

  # GuardDuty High Severity Findings Alarm
  GuardDutyHighSeverityAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: CreateGuardDutyDetector
    Properties:
      AlarmName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-guardduty-high-severity-${AWS::AccountId}'
      AlarmDescription: GuardDuty high severity findings detected
      Namespace: AWS/GuardDuty
      MetricName: HighSeverityFindings
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertsTopic
      TreatMissingData: notBreaching

  # EventBridge Rules for Monitoring and Automation
  EventBridgeRule:
    Type: AWS::Events::Rule
    Properties:
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-monitoring-rule-${AWS::AccountId}'
      Description: EventBridge rule for ECS and ALB monitoring events
      EventPattern:
        source:
          - aws.ecs
          - aws.elasticloadbalancing
        detail-type:
          - ECS Task State Change
          - ECS Service Action
          - AWS API Call via CloudTrail
        detail:
          service:
            - ecs
            - elasticloadbalancing
      State: ENABLED
      Targets:
        - Arn:
            Ref: AlertsTopic
          Id: '1'

  EventBridgeDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-eventbridge-dlq-${AWS::AccountId}'
      MessageRetentionPeriod: 1209600
      VisibilityTimeout: 60
      Tags:
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix

  EventBridgeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-eventbridge-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EventBridgePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource:
                  Ref: AlertsTopic
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource:
                  Fn::GetAtt:
                    - EventBridgeDeadLetterQueue
                    - Arn

  # WAF Web ACL for Application Load Balancer
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: EnableWAF
    Properties:
      Name:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-waf-webacl-${AWS::AccountId}'
      Description: WAF Web ACL for ALB protection
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: RateLimitRule
          Priority: 3
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: WebACLMetric
      Tags:
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Condition: EnableWAF
    Properties:
      ResourceArn:
        Fn::GetAtt:
          - LoadBalancer
          - LoadBalancerArn
      WebACLArn:
        Fn::GetAtt:
          - WAFWebACL
          - Arn

  # Centralized Logging Infrastructure
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-logs-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: LogArchival
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 90
              - StorageClass: DEEP_ARCHIVE
                TransitionInDays: 365
      Tags:
        - Key: Name
          Value:
            Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-logs-bucket-${AWS::AccountId}'
        - Key: Environment
          Value:
            Ref: EnvironmentSuffix
        - Key: Project
          Value:
            Ref: ProjectName
        - Key: CostCenter
          Value: 'Engineering'
        - Key: Compliance
          Value: 'Required'

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: s3:PutObject
            Resource:
              Fn::Sub: '${LogsBucket.Arn}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: s3:GetBucketAcl
            Resource:
              Fn::GetAtt:
                - LogsBucket
                - Arn
          - Sid: ALBAccessLogsWrite
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub:
                  - 'arn:aws:iam::${ELBAccount}:root'
                  - ELBAccount:
                      Fn::FindInMap:
                        - ELBAccountId
                        - Ref: AWS::Region
                        - AccountId
            Action: s3:PutObject
            Resource:
              Fn::Sub: '${LogsBucket.Arn}/alb-access-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: ALBAccessLogsAclCheck
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub:
                  - 'arn:aws:iam::${ELBAccount}:root'
                  - ELBAccount:
                      Fn::FindInMap:
                        - ELBAccountId
                        - Ref: AWS::Region
                        - AccountId
            Action: s3:GetBucketAcl
            Resource:
              Fn::GetAtt:
                - LogsBucket
                - Arn
          - Sid: GuardDutyWrite
            Effect: Allow
            Principal:
              Service: guardduty.amazonaws.com
            Action: s3:PutObject
            Resource:
              Fn::Sub: '${LogsBucket.Arn}/*'
          - Sid: GuardDutyGetBucketLocation
            Effect: Allow
            Principal:
              Service: guardduty.amazonaws.com
            Action: s3:GetBucketLocation
            Resource:
              Fn::GetAtt:
                - LogsBucket
                - Arn
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - Fn::GetAtt:
                  - LogsBucket
                  - Arn
              - Fn::Sub: '${LogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # VPC Flow Logs
  VpcFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      LogDestinationType: s3
      LogDestination:
        Fn::Sub: '${LogsBucket.Arn}/vpc-flow-logs/'
      ResourceId:
        Ref: VPC
      ResourceType: VPC
      TrafficType: ALL
      LogFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${flow-direction}'

  # CloudWatch Dashboard for comprehensive monitoring
  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-dashboard-${AWS::AccountId}'
      DashboardBody:
        Fn::Sub:
          - |
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
                      [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${LoadBalancerFullName}" ],
                      [ ".", "TargetResponseTime", ".", "." ],
                      [ ".", "HTTPCode_Target_2XX_Count", ".", "." ],
                      [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                      [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${Region}",
                    "title": "ALB Metrics",
                    "period": 300
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
                      [ "AWS/ECS", "CPUUtilization", "ServiceName", "${ServiceName}", "ClusterName", "${ClusterName}" ],
                      [ ".", "MemoryUtilization", ".", ".", ".", "." ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${Region}",
                    "title": "ECS Service Metrics",
                    "period": 300
                  }
                }
              ]
            }
          - LoadBalancerFullName:
              Fn::GetAtt:
                - LoadBalancer
                - LoadBalancerFullName
            ServiceName:
              Fn::GetAtt:
                - ECSService
                - Name
            ClusterName:
              Ref: ECSCluster
            Region:
              Ref: AWS::Region

  # Custom Resource to seed S3 bucket with dummy source code to trigger pipeline
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-lambda-exec-role-${AWS::AccountId}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  Fn::Sub: 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*:*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource:
                  Fn::Sub: '${ArtifactBucket.Arn}/source/source.zip'
  
  SourceSeederLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName:
        Fn::Sub: '${EnvironmentSuffix}-${ProjectName}-source-seeder-${AWS::AccountId}'
      Code:
        ZipFile: |
          import boto3
          import os
          import json
          import zipfile
          import io
          import traceback
          import urllib.request
          
          s3 = boto3.client('s3')

          def send_response(event, context, status, data=None, reason=None, physical_id=None):
              response_body = {
                  'Status': status,
                  'Reason': reason or f'See CloudWatch Log Stream: {context.log_stream_name}',
                  'PhysicalResourceId': physical_id or context.log_stream_name,
                  'StackId': event['StackId'],
                  'RequestId': event['RequestId'],
                  'LogicalResourceId': event['LogicalResourceId'],
                  'NoEcho': False,
                  'Data': data or {}
              }
              encoded = json.dumps(response_body).encode('utf-8')
              req = urllib.request.Request(event['ResponseURL'], data=encoded, method='PUT')
              req.add_header('content-type', 'application/json')
              req.add_header('content-length', str(len(encoded)))
              with urllib.request.urlopen(req) as _:
                  pass

          def handler(event, context):
              try:
                  request_type = event.get('RequestType', 'Create')
                  bucket = os.environ['BUCKET'] 
                  key = os.environ['KEY']
                  
                  if request_type in ('Create', 'Update'):
                      buf = io.BytesIO()
                      with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
                          z.writestr('README.md', '# Seeded Source\nThis is a dummy source archive.\n')
                          z.writestr('dummy.txt', 'ok\n')
                      buf.seek(0)
                      s3.put_object(Bucket=bucket, Key=key, Body=buf.getvalue(), ContentType='application/zip')

                  send_response(event, context, 'SUCCESS', data={'Bucket': bucket, 'Key': key})
                  
              except Exception as e:
                  traceback.print_exc()
                  send_response(event, context, 'FAILED', reason=str(e))
                  
      Handler: index.handler
      Runtime: python3.9
      Timeout: 30
      Role:
        Fn::GetAtt:
          - LambdaExecutionRole
          - Arn
      Environment:
        Variables:
          BUCKET:
            Ref: ArtifactBucket
          KEY: source/source.zip

  SourceSeeder:
    Type: Custom::SeedSource
    Properties:
      ServiceToken:
        Fn::GetAtt:
          - SourceSeederLambda
          - Arn
      Bucket:
        Ref: ArtifactBucket
      Key: source/source.zip
      # Depend on pipeline to ensure bucket and role are ready
    DependsOn: Pipeline

Outputs:
  VPCId:
    Description: VPC ID
    Value:
      Ref: VPC
  LoadBalancerDNS:
    Description: Public ALB DNS
    Value:
      Fn::GetAtt:
        - LoadBalancer
        - DNSName
  ClusterName:
    Description: ECS Cluster
    Value:
      Ref: ECSCluster
  # FIX: Use Fn::GetAtt: [ECSService, Name] to return the friendly name, not the ARN.
  ServiceName:
    Description: ECS Service
    Value:
      Fn::GetAtt:
        - ECSService
        - Name
  EcrRepositoryUri:
    Description: ECR Repo URI
    Value:
      Fn::Sub: '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${EcrRepository}'
  PipelineName:
    Description: CodePipeline name
    Value:
      Ref: Pipeline
  AlertsTopicArn:
    Description: SNS alerts topic
    Value:
      Ref: AlertsTopic
  TargetGroupArn:
    Description: Load Balancer Target Group ARN
    Value:
      Ref: TargetGroup
  ApplicationSecretsArn:
    Description: AWS Secrets Manager secret ARN for application secrets
    Value:
      Ref: ApplicationSecrets
  CloudTrailArn:
    Description: CloudTrail ARN for audit logging
    Value:
      Fn::GetAtt:
        - CloudTrail
        - Arn
  ConfigRecorderName:
    Description: AWS Config Configuration Recorder name
    Value:
      Fn::If:
        - CreateConfigRecorder
        - Fn::Sub: '${ProjectName}-${EnvironmentSuffix}-config-recorder-${AWS::AccountId}'
        - 'default'
  MaxCapacity:
    Description: Maximum ECS service capacity for scaling
    Value: 50
  MinCapacity:
    Description: Minimum ECS service capacity for scaling
    Value: 2
  EventBridgeRuleArn:
    Description: EventBridge rule ARN for monitoring events
    Value:
      Fn::GetAtt:
        - EventBridgeRule
        - Arn
  EventBridgeDeadLetterQueueUrl:
    Description: EventBridge dead letter queue URL
    Value:
      Ref: EventBridgeDeadLetterQueue
  WAFWebACLArn:
    Description: WAF Web ACL ARN for ALB protection
    Value:
      Fn::If:
        - EnableWAF
        - Fn::GetAtt:
            - WAFWebACL
            - Arn
        - 'WAF-disabled'
  CloudWatchDashboardUrl:
    Description: CloudWatch Dashboard URL for monitoring
    Value:
      Fn::Sub: 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${EnvironmentSuffix}-${ProjectName}-dashboard-${AWS::AccountId}'
  LogsBucketArn:
    Description: Centralized logs bucket ARN for VPC Flow Logs, ALB access logs, and GuardDuty
    Value:
      Fn::GetAtt:
        - LogsBucket
        - Arn
  GuardDutyDetectorId:
    Description: GuardDuty detector ID for threat detection
    Value:
      Fn::If:
        - CreateGuardDutyDetector
        - Ref: GuardDutyDetector
        - 'GuardDuty-disabled'
  VpcFlowLogId:
    Description: VPC Flow Log ID for network monitoring
    Value:
      Ref: VpcFlowLog
```