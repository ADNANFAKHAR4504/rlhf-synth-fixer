```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready Fintech Microservices on ECS Fargate with High Availability'

Parameters:
  EnvironmentName:
    Type: String
    Default: fintech-prod
    Description: Environment name prefix for resources

  VPCCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC

  ApiImageUri:
    Type: String
    Description: Docker image URI for API service
    Default: public.ecr.aws/nginx/nginx:latest

  WorkerImageUri:
    Type: String
    Description: Docker image URI for Worker service
    Default: public.ecr.aws/nginx/nginx:latest

  SchedulerImageUri:
    Type: String
    Description: Docker image URI for Scheduler service
    Default: public.ecr.aws/nginx/nginx:latest

  CertificateArn:
    Type: String
    Description: ACM Certificate ARN for HTTPS listener (must be in same region as ALB)
    Default: arn:aws:acm:ap-south-1:679047180946:certificate/e7575731-8957-441e-9b4b-8cf3f827acd2
    AllowedPattern: ^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate\/.+
    ConstraintDescription: Must be a valid ACM certificate ARN (replace the default placeholder with your certificate ARN)

  SSMParameterPrefix:
    Type: String
    Default: /fintech/prod
    Description: SSM Parameter Store prefix for environment variables

  AlertEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    Default: alerts@example.com

  CreateSSMPlaceholders:
    Type: String
    Description: Whether to create placeholder SSM parameters for quick testing (set to false for production)
    Default: "true"
    AllowedValues: ["true", "false"]

  UseExistingLogGroups:
    Type: String
    Description: Set to "true" to use existing CloudWatch Log Group names (do not create them)
    Default: "false"
    AllowedValues: ["true", "false"]

  ExistingApiLogGroupName:
    Type: String
    Description: (Optional) Name of an existing Log Group to use for the API service when `UseExistingLogGroups` is true
    Default: ""

  ExistingWorkerLogGroupName:
    Type: String
    Description: (Optional) Name of an existing Log Group to use for the Worker service when `UseExistingLogGroups` is true
    Default: ""

  ExistingSchedulerLogGroupName:
    Type: String
    Description: (Optional) Name of an existing Log Group to use for the Scheduler service when `UseExistingLogGroups` is true
    Default: ""

Conditions:
  HasRealCertificate: !Not [!Equals [!Ref CertificateArn, "arn:aws:acm:ap-south-1:679047180946:certificate/e7575731-8957-441e-9b4b-8cf3f827acd2"]]
  CreateSSMPlaceholdersCondition: !Equals [!Ref CreateSSMPlaceholders, "true"]
  CreateLogGroups: !Equals [!Ref UseExistingLogGroups, "false"]


Resources:
  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc

  # Internet Gateway
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
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-2

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet-3

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-2

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.13.0/24
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-3

  # Elastic IPs for NAT Gateways
  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGatewayEIP3:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  # NAT Gateways
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-2

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP3.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-3

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-routes

  PublicRoute:
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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-routes-1

  PrivateRoute1:
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
          Value: !Sub ${EnvironmentName}-private-routes-2

  PrivateRoute2:
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

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-routes-3

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # ==================== Security Groups ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-alb-sg

  ECSTaskSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ecs-task-sg

  # Allow ECS tasks to communicate with each other
  ECSTaskSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref ECSTaskSecurityGroup
      IpProtocol: -1
      SourceSecurityGroupId: !Ref ECSTaskSecurityGroup

  # ==================== IAM Roles ====================
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: SSMParameterAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameters
                  - ssm:GetParameter
                Resource: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ecs-execution-role

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub arn:aws:s3:::${EnvironmentName}-*/*
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub arn:aws:s3:::${EnvironmentName}-*
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource: !Sub arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${EnvironmentName}-*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ecs-task-role

  # ==================== CloudWatch Log Groups ====================
  ApiLogGroup:
    Condition: CreateLogGroups
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /ecs/${EnvironmentName}/api-service
      RetentionInDays: 30

  WorkerLogGroup:
    Condition: CreateLogGroups
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /ecs/${EnvironmentName}/worker-service
      RetentionInDays: 30

  SchedulerLogGroup:
    Condition: CreateLogGroups
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /ecs/${EnvironmentName}/scheduler-service
      RetentionInDays: 30

  # Optional placeholder SSM parameters to allow quick test deployments.
  SSMApiKeyParameter:
    Condition: CreateSSMPlaceholdersCondition
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub ${SSMParameterPrefix}/api-key
      Type: String
      Value: "CHANGE_ME_API_KEY"

  SSMDatabaseUrlParameter:
    Condition: CreateSSMPlaceholdersCondition
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub ${SSMParameterPrefix}/database-url
      Type: String
      Value: "postgres://username:password@db.example.local:5432/fintech"

  SSMWorkerTokenParameter:
    Condition: CreateSSMPlaceholdersCondition
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub ${SSMParameterPrefix}/worker-token
      Type: String
      Value: "CHANGE_ME_WORKER_TOKEN"

  SSMSchedulerTokenParameter:
    Condition: CreateSSMPlaceholdersCondition
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub ${SSMParameterPrefix}/scheduler-token
      Type: String
      Value: "CHANGE_ME_SCHEDULER_TOKEN"

  # ==================== Service Discovery ====================
  ServiceDiscoveryNamespace:
    Type: AWS::ServiceDiscovery::PrivateDnsNamespace
    Properties:
      Name: !Sub ${EnvironmentName}.local
      Vpc: !Ref VPC
      Description: Private namespace for service discovery

  # ==================== ECS Cluster ====================
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${EnvironmentName}-cluster
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 80
          Base: 0
        - CapacityProvider: FARGATE_SPOT
          Weight: 20
          Base: 0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-cluster

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-alb

  # Target Groups
  ApiTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-api-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-399
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'

  WorkerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-worker-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-399
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'

  SchedulerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-scheduler-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-399
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'

  # HTTPS Listener
  HTTPSListener:
    Condition: HasRealCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: 404
            ContentType: text/plain
            MessageBody: Not Found
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn

  # HTTP Listener (redirect to HTTPS)
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: 404
            ContentType: text/plain
            MessageBody: Not Found
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Listener Rules
  ApiListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasRealCertificate
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref ApiTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /api/*
      ListenerArn: !Ref HTTPSListener
      Priority: 1

  ApiListenerRuleHTTP:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref ApiTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /api/*
      ListenerArn: !Ref HTTPListener
      Priority: 101

  WorkerListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasRealCertificate
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref WorkerTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /admin/*
      ListenerArn: !Ref HTTPSListener
      Priority: 2

  WorkerListenerRuleHTTP:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref WorkerTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /admin/*
      ListenerArn: !Ref HTTPListener
      Priority: 102

  SchedulerListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasRealCertificate
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref SchedulerTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /webhooks/*
      ListenerArn: !Ref HTTPSListener
      Priority: 3

  SchedulerListenerRuleHTTP:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref SchedulerTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /webhooks/*
      ListenerArn: !Ref HTTPListener
      Priority: 103

  # ==================== ECS Task Definitions ====================
  ApiTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${EnvironmentName}-api-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: api-container
          Image: !Ref ApiImageUri
          Essential: true
          
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          Environment:
            - Name: SERVICE_NAME
              Value: api-service
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentName
          Secrets:
            - Name: DATABASE_URL
              # ECS expects the full SSM Parameter ARN for Secrets Manager/SSM
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/database-url
            - Name: API_KEY
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/api-key
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !If [CreateLogGroups, !Ref ApiLogGroup, !Ref ExistingApiLogGroupName]
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: api
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost:80/ || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  WorkerTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${EnvironmentName}-worker-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '2048'
      Memory: '4096'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: worker-container
          Image: !Ref WorkerImageUri
          Essential: true
          
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          Environment:
            - Name: SERVICE_NAME
              Value: worker-service
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentName
          Secrets:
            - Name: DATABASE_URL
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/database-url
            - Name: WORKER_TOKEN
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/worker-token
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !If [CreateLogGroups, !Ref WorkerLogGroup, !Ref ExistingWorkerLogGroupName]
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: worker
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost:80/ || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  SchedulerTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${EnvironmentName}-scheduler-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: scheduler-container
          Image: !Ref SchedulerImageUri
          Essential: true
          
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          Environment:
            - Name: SERVICE_NAME
              Value: scheduler-service
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentName
          Secrets:
            - Name: DATABASE_URL
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/database-url
            - Name: SCHEDULER_TOKEN
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/scheduler-token
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !If [CreateLogGroups, !Ref SchedulerLogGroup, !Ref ExistingSchedulerLogGroupName]
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: scheduler
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost:80/ || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  # ==================== Service Discovery Services ====================
  ApiServiceDiscovery:
    Type: AWS::ServiceDiscovery::Service
    Properties:
      Name: api
      DnsConfig:
        DnsRecords:
          - Type: A
            TTL: 60
        NamespaceId: !Ref ServiceDiscoveryNamespace
      HealthCheckCustomConfig:
        FailureThreshold: 1

  WorkerServiceDiscovery:
    Type: AWS::ServiceDiscovery::Service
    Properties:
      Name: worker
      DnsConfig:
        DnsRecords:
          - Type: A
            TTL: 60
        NamespaceId: !Ref ServiceDiscoveryNamespace
      HealthCheckCustomConfig:
        FailureThreshold: 1

  SchedulerServiceDiscovery:
    Type: AWS::ServiceDiscovery::Service
    Properties:
      Name: scheduler
      DnsConfig:
        DnsRecords:
          - Type: A
            TTL: 60
        NamespaceId: !Ref ServiceDiscoveryNamespace
      HealthCheckCustomConfig:
        FailureThreshold: 1

  # ==================== ECS Services ====================
  ApiService:
    Type: AWS::ECS::Service
    DependsOn:
      - ApplicationLoadBalancer
      - HTTPListener
      - ApiListenerRuleHTTP
    Properties:
      ServiceName: !Sub ${EnvironmentName}-api-service
      Cluster: !Ref ECSCluster
      LaunchType: FARGATE
      DesiredCount: 2
      TaskDefinition: !Ref ApiTaskDefinition
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSTaskSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      LoadBalancers:
        - ContainerName: api-container
          ContainerPort: 80
          TargetGroupArn: !Ref ApiTargetGroup
      ServiceRegistries:
        - RegistryArn: !GetAtt ApiServiceDiscovery.Arn
      HealthCheckGracePeriodSeconds: 300
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-api-service

  WorkerService:
    Type: AWS::ECS::Service
    DependsOn:
      - ApplicationLoadBalancer
      - HTTPListener
      - WorkerListenerRuleHTTP
    Properties:
      ServiceName: !Sub ${EnvironmentName}-worker-service
      Cluster: !Ref ECSCluster
      LaunchType: FARGATE
      DesiredCount: 1
      TaskDefinition: !Ref WorkerTaskDefinition
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSTaskSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      LoadBalancers:
        - ContainerName: worker-container
          ContainerPort: 80
          TargetGroupArn: !Ref WorkerTargetGroup
      ServiceRegistries:
        - RegistryArn: !GetAtt WorkerServiceDiscovery.Arn
      HealthCheckGracePeriodSeconds: 300
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-worker-service

  SchedulerService:
    Type: AWS::ECS::Service
    DependsOn:
      - ApplicationLoadBalancer
      - HTTPListener
      - SchedulerListenerRuleHTTP
    Properties:
      ServiceName: !Sub ${EnvironmentName}-scheduler-service
      Cluster: !Ref ECSCluster
      LaunchType: FARGATE
      DesiredCount: 1
      TaskDefinition: !Ref SchedulerTaskDefinition
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSTaskSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      LoadBalancers:
        - ContainerName: scheduler-container
          ContainerPort: 80
          TargetGroupArn: !Ref SchedulerTargetGroup
      ServiceRegistries:
        - RegistryArn: !GetAtt SchedulerServiceDiscovery.Arn
      HealthCheckGracePeriodSeconds: 600
      DeploymentConfiguration:
        MaximumPercent: 100
        MinimumHealthyPercent: 0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-scheduler-service

  # ==================== Auto Scaling ====================
  ApiScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub
        - service/${ClusterName}/${ServiceName}
        - ClusterName: !Ref ECSCluster
          ServiceName: !GetAtt ApiService.Name
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ApiScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub ${EnvironmentName}-api-scaling-policy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ApiScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  WorkerScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 5
      MinCapacity: 1
      ResourceId: !Sub
        - service/${ClusterName}/${ServiceName}
        - ClusterName: !Ref ECSCluster
          ServiceName: !GetAtt WorkerService.Name
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  SchedulerScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 1
      MinCapacity: 1
      ResourceId: !Sub
        - service/${ClusterName}/${ServiceName}
        - ClusterName: !Ref ECSCluster
          ServiceName: !GetAtt SchedulerService.Name
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  WorkerScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub ${EnvironmentName}-worker-scaling-policy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref WorkerScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ==================== CloudWatch Alarms ====================
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub ${EnvironmentName}-alarms
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email

  ApiHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-api-high-cpu
      AlarmDescription: API service CPU utilization is too high
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ApiService.Name
      AlarmActions:
        - !Ref AlarmTopic

  WorkerHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-worker-high-cpu
      AlarmDescription: Worker service CPU utilization is too high
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt WorkerService.Name
      AlarmActions:
        - !Ref AlarmTopic

  ApiTaskFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-api-task-failure
      AlarmDescription: API service has task failures
      MetricName: TasksFailed
      Namespace: AWS/ECS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ApiService.Name
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: notBreaching

  WorkerTaskFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-worker-task-failure
      AlarmDescription: Worker service has task failures
      MetricName: TasksFailed
      Namespace: AWS/ECS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt WorkerService.Name
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: notBreaching

  SchedulerTaskFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-scheduler-task-failure
      AlarmDescription: Scheduler service has task failures
      MetricName: TasksFailed
      Namespace: AWS/ECS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt SchedulerService.Name
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: notBreaching

  ALBTargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-alb-response-time
      AlarmDescription: ALB target response time is too high
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref AlarmTopic

  # ==================== CloudWatch Dashboard ====================
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub ${EnvironmentName}-ecs-dashboard-${AWS::Region}
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", "ClusterName", "${ECSCluster}", "ServiceName", "${ApiService}"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "API Service CPU"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", "ClusterName", "${ECSCluster}", "ServiceName", "${WorkerService}"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Worker Service CPU"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${ApplicationLoadBalancer}"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ALB Target Response Time"
              }
            }
          ]
        }

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-vpc-id

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-alb-dns

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub ${EnvironmentName}-cluster-name

  ApiServiceArn:
    Description: API Service ARN
    Value: !Ref ApiService
    Export:
      Name: !Sub ${EnvironmentName}-api-service-arn

  WorkerServiceArn:
    Description: Worker Service ARN
    Value: !Ref WorkerService
    Export:
      Name: !Sub ${EnvironmentName}-worker-service-arn

  SchedulerServiceArn:
    Description: Scheduler Service ARN
    Value: !Ref SchedulerService
    Export:
      Name: !Sub ${EnvironmentName}-scheduler-service-arn

  ServiceDiscoveryNamespace:
    Description: Service Discovery Namespace
    Value: !Sub ${EnvironmentName}.local
    Export:
      Name: !Sub ${EnvironmentName}-service-discovery-namespace

  ApiServiceDiscoveryEndpoint:
    Description: API Service Discovery Endpoint
    Value: !Sub api.${EnvironmentName}.local
    Export:
      Name: !Sub ${EnvironmentName}-api-discovery-endpoint

  WorkerServiceDiscoveryEndpoint:
    Description: Worker Service Discovery Endpoint
    Value: !Sub worker.${EnvironmentName}.local
    Export:
      Name: !Sub ${EnvironmentName}-worker-discovery-endpoint

  SchedulerServiceDiscoveryEndpoint:
    Description: Scheduler Service Discovery Endpoint
    Value: !Sub scheduler.${EnvironmentName}.local
    Export:
      Name: !Sub ${EnvironmentName}-scheduler-discovery-endpoint
```
