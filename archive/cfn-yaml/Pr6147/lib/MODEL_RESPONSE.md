# Multi-Environment Payment Processing Infrastructure

This implementation provides a CloudFormation YAML solution for deploying payment processing infrastructure across multiple environments with environment parity.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-Environment Payment Processing Infrastructure

Parameters:
  Environment:
    Type: String
    Description: Environment name (dev, staging, prod)
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev

  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming
    MinLength: 3
    MaxLength: 10

  VPCCidr:
    Type: String
    Description: CIDR block for VPC
    Default: 10.0.0.0/16

Mappings:
  EnvironmentConfig:
    dev:
      DBInstanceClass: db.t3.medium
      ECSCpu: '512'
      ECSMemory: '1024'
      BackupRetention: 7
      AlarmThreshold: 80
      LogRetention: 7
    staging:
      DBInstanceClass: db.r5.large
      ECSCpu: '1024'
      ECSMemory: '2048'
      BackupRetention: 14
      AlarmThreshold: 75
      LogRetention: 30
    prod:
      DBInstanceClass: db.r5.large
      ECSCpu: '2048'
      ECSMemory: '4096'
      BackupRetention: 30
      AlarmThreshold: 70
      LogRetention: 90

Resources:
  # VPC Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'

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
      CidrBlock: !Select [0, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-3-${EnvironmentSuffix}'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VPCCidr, 6, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'

  # NAT Gateways - ISSUE: Creates NAT in all subnets instead of just one
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-1-${EnvironmentSuffix}'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-2-${EnvironmentSuffix}'

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'nat-3-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-2-${EnvironmentSuffix}'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-3-${EnvironmentSuffix}'

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Security Groups
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
          Value: !Sub 'alb-sg-${EnvironmentSuffix}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'ecs-sg-${EnvironmentSuffix}'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'db-sg-${EnvironmentSuffix}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'alb-${EnvironmentSuffix}'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'tg-${EnvironmentSuffix}'
      Port: 8080
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  # ISSUE: Missing SSL certificate configuration from SSM
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # RDS Aurora PostgreSQL Cluster
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for Aurora cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${EnvironmentSuffix}'

  # ISSUE: Missing SSM parameter integration for instance class
  AuroraCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      EngineVersion: '14.6'
      DatabaseName: payments
      MasterUsername: admin
      MasterUserPassword: ChangeMe123456
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref Environment, BackupRetention]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-1-${EnvironmentSuffix}'

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-2-${EnvironmentSuffix}'

  # SQS Queues with DLQ
  PaymentDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ISSUE: Message retention hardcoded instead of using SSM
  PaymentQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-queue-${EnvironmentSuffix}'
      MessageRetentionPeriod: 345600
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt PaymentDLQ.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'payment-cluster-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Roles
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ecs-task-execution-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: SSMAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/payments/*'
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:ReceiveMessage'
                  - 'sqs:DeleteMessage'
                Resource:
                  - !GetAtt PaymentQueue.Arn
                  - !GetAtt PaymentDLQ.Arn

  # ECS Task Definition
  PaymentTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'payment-service-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: !FindInMap [EnvironmentConfig, !Ref Environment, ECSCpu]
      Memory: !FindInMap [EnvironmentConfig, !Ref Environment, ECSMemory]
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: payment-service
          Image: nginx:latest
          PortMappings:
            - ContainerPort: 8080
              Protocol: tcp
          Environment:
            - Name: ENVIRONMENT
              Value: !Ref Environment
            - Name: DB_HOST
              Value: !GetAtt AuroraCluster.Endpoint.Address
            - Name: QUEUE_URL
              Value: !Ref PaymentQueue
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: payment-service

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub 'payment-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref PaymentTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: payment-service
          ContainerPort: 8080
          TargetGroupArn: !Ref ALBTargetGroup

  # CloudWatch Log Group
  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/payment-service-${EnvironmentSuffix}'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]

  # S3 Buckets for Logs
  ApplicationLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AccessLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'access-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetention]
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarms - ISSUE: Missing SSM integration for thresholds
  ECSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecs-cpu-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when ECS CPU exceeds threshold
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !FindInMap [EnvironmentConfig, !Ref Environment, AlarmThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ECSService.Name

  ECSMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecs-memory-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when ECS memory exceeds threshold
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !FindInMap [EnvironmentConfig, !Ref Environment, AlarmThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ECSService.Name

  DBConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'db-connections-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when DB connections exceed threshold
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: Aurora Cluster Endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  QueueURL:
    Description: SQS Queue URL
    Value: !Ref PaymentQueue
    Export:
      Name: !Sub '${AWS::StackName}-Queue-URL'

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Cluster'

  LogBucket:
    Description: Application Log Bucket
    Value: !Ref ApplicationLogBucket
    Export:
      Name: !Sub '${AWS::StackName}-Log-Bucket'
```

## File: lib/deploy-instructions.md

```markdown
# Deployment Instructions

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. CloudFormation permissions in target AWS account
3. SSM parameters created for environment-specific values

## SSM Parameter Setup

Create the following SSM parameters before deployment:

```bash
# Dev Environment
aws ssm put-parameter --name "/dev/payments/db-instance-class" --value "db.t3.medium" --type String
aws ssm put-parameter --name "/dev/payments/certificate-arn" --value "arn:aws:acm:region:account:certificate/id" --type String
aws ssm put-parameter --name "/dev/payments/alarm-threshold" --value "80" --type String

# Staging Environment
aws ssm put-parameter --name "/staging/payments/db-instance-class" --value "db.r5.large" --type String
aws ssm put-parameter --name "/staging/payments/certificate-arn" --value "arn:aws:acm:region:account:certificate/id" --type String
aws ssm put-parameter --name "/staging/payments/alarm-threshold" --value "75" --type String

# Production Environment
aws ssm put-parameter --name "/prod/payments/db-instance-class" --value "db.r5.large" --type String
aws ssm put-parameter --name "/prod/payments/certificate-arn" --value "arn:aws:acm:region:account:certificate/id" --type String
aws ssm put-parameter --name "/prod/payments/alarm-threshold" --value "70" --type String
```

## Deployment Commands

### Deploy Dev Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev001 \
    ParameterKey=VPCCidr,ParameterValue=10.0.0.0/16 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### Deploy Staging Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-processing-staging \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=stg001 \
    ParameterKey=VPCCidr,ParameterValue=10.1.0.0/16 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

### Deploy Production Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prd001 \
    ParameterKey=VPCCidr,ParameterValue=10.2.0.0/16 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Stack Updates

To update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev001 \
    ParameterKey=VPCCidr,ParameterValue=10.0.0.0/16 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Validation

After deployment, verify:

1. VPC and subnets created across 3 AZs
2. NAT gateways operational
3. ECS service running with desired task count
4. Aurora cluster accessible from ECS tasks
5. ALB health checks passing
6. CloudWatch alarms configured
7. S3 buckets created with lifecycle policies
```
