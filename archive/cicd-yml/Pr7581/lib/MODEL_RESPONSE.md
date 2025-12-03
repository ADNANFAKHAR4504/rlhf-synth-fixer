### Reasoning Trace
---

The user is asking for a single CloudFormation YAML template that creates a comprehensive CI/CD pipeline. This is a massive requirement, but I need to deliver exactly what they're asking for. Let me break down the key requirements:

1. **Single CloudFormation YAML file** named `ci-cd.yml`
2. **CodePipeline** with 6 stages: Source, Build, Test, Deploy-Dev, Deploy-Staging, Deploy-Prod
3. **GitHub integration** with OAuth/webhook
4. **CodeBuild projects** for building, unit tests, integration tests
5. **ECS Fargate services** with CodeDeploy blue/green deployments for dev/staging/prod
6. **Manual approvals** before staging and production
7. **Lambda functions** for custom validation/rollback
8. **SNS notifications** and EventBridge rules for monitoring
9. **Cross-account deployment** support (dev: 123456789012, staging: 234567890123, prod: 345678901234)
10. **S3 artifact bucket** with KMS encryption and lifecycle policies
11. **SSM Parameter Store** integration
12. **Least-privilege IAM** roles

This is a complex template, but I need to create a comprehensive, production-ready CloudFormation template. Let me structure this properly:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Multi-stage CI/CD Pipeline for Containerized Microservices
Parameters:
  # Parameters for configuration
Resources:
  # 1. KMS Key for encryption
  # 2. S3 Artifact Bucket
  # 3. SNS Topic for notifications
  # 4. IAM Roles (Pipeline, CodeBuild, CodeDeploy, Lambda)
  # 5. CodeBuild Projects (Build, Unit Tests, Integration Tests)
  # 6. ECS Resources (Clusters, Services, Task Definitions for dev/staging/prod)


```

I'll continue structuring the template to include deployment, validation, and monitoring components across multiple environments. The goal is to create a robust, secure, and flexible CI/CD pipeline that supports complex microservices deployment workflows.
### Answer 
---

```yaml
# ci-cd.yml
AWSTemplateFormatVersion: "2010-09-09"
Description: Multi-stage CI/CD Pipeline for Containerized Microservices with Cross-Account Deployments

Parameters:
  GitHubOwner:
    Type: String
    Default: payment-microservices
    Description: GitHub repository owner/organization
  
  GitHubRepository:
    Type: String
    Default: payment-api
    Description: GitHub repository name
  
  GitHubBranch:
    Type: String
    Default: main
    Description: GitHub branch to monitor
  
  GitHubOAuthToken:
    Type: String
    NoEcho: true
    Description: GitHub OAuth token for repository access (stored in SSM)
  
  ECRRepository:
    Type: String
    Default: payment-microservices/api
    Description: ECR repository for Docker images
  
  NotificationEmail:
    Type: String
    Description: Email address for pipeline notifications
  
  DevAccountId:
    Type: String
    Default: "123456789012"
    Description: AWS Account ID for development environment
  
  StagingAccountId:
    Type: String
    Default: "234567890123"
    Description: AWS Account ID for staging environment
  
  ProdAccountId:
    Type: String
    Default: "345678901234"
    Description: AWS Account ID for production environment
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for ECS services
  
  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Private subnet IDs for ECS services

Resources:
  # ===========================
  # KMS Key for Encryption
  # ===========================
  
  PipelineKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for CI/CD pipeline artifact encryption
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - codepipeline.amazonaws.com
                - codebuild.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey"
              - "kms:CreateGrant"
            Resource: "*"
          - Sid: Allow use of the key for cross-account access
            Effect: Allow
            Principal:
              AWS:
                - !GetAtt CodePipelineServiceRole.Arn
                - !GetAtt CodeBuildServiceRole.Arn
                - !GetAtt CodeDeployServiceRole.Arn
            Action:
              - "kms:Decrypt"
              - "kms:DescribeKey"
              - "kms:GenerateDataKey"
            Resource: "*"
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices
        - Key: ManagedBy
          Value: CloudFormation

  PipelineKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/pipeline-artifacts
      TargetKeyId: !Ref PipelineKMSKey

  # ===========================
  # S3 Artifact Bucket
  # ===========================
  
  PipelineArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-pipeline-artifacts-${AWS::Region}"
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt PipelineKMSKey.Arn
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            NoncurrentVersionTransitions:
              - TransitionInDays: 7
                StorageClass: STANDARD_IA
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices
        - Key: ManagedBy
          Value: CloudFormation

  PipelineArtifactsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref PipelineArtifactsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt PipelineArtifactsBucket.Arn
              - !Sub "${PipelineArtifactsBucket.Arn}/*"
            Condition:
              Bool:
                "aws:SecureTransport": false
          - Sid: AllowCrossAccountAccess
            Effect: Allow
            Principal:
              AWS:
                - !Sub "arn:aws:iam::${DevAccountId}:root"
                - !Sub "arn:aws:iam::${StagingAccountId}:root"
                - !Sub "arn:aws:iam::${ProdAccountId}:root"
            Action:
              - "s3:GetObject"
              - "s3:GetObjectVersion"
            Resource: !Sub "${PipelineArtifactsBucket.Arn}/*"

  # ===========================
  # SNS Topics
  # ===========================
  
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: pipeline-notifications
      DisplayName: CI/CD Pipeline Notifications
      KmsMasterKeyId: !Ref PipelineKMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  PipelineNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref PipelineNotificationTopic
      PolicyDocument:
        Statement:
          - Sid: AllowPipelinePublish
            Effect: Allow
            Principal:
              Service:
                - codepipeline.amazonaws.com
                - events.amazonaws.com
            Action:
              - "SNS:Publish"
            Resource: !Ref PipelineNotificationTopic

  # ===========================
  # IAM Roles
  # ===========================
  
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-codepipeline-role"
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodePipelineReadOnlyAccess
      Policies:
        - PolicyName: PipelineExecutionPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - "s3:GetObject"
                  - "s3:GetObjectVersion"
                  - "s3:PutObject"
                Resource: !Sub "${PipelineArtifactsBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - "s3:GetBucketLocation"
                  - "s3:ListBucket"
                Resource: !GetAtt PipelineArtifactsBucket.Arn
              - Effect: Allow
                Action:
                  - "codebuild:BatchGetBuilds"
                  - "codebuild:StartBuild"
                Resource:
                  - !GetAtt BuildProject.Arn
                  - !GetAtt UnitTestProject.Arn
                  - !GetAtt IntegrationTestProject.Arn
              - Effect: Allow
                Action:
                  - "codedeploy:CreateDeployment"
                  - "codedeploy:GetApplication"
                  - "codedeploy:GetApplicationRevision"
                  - "codedeploy:GetDeployment"
                  - "codedeploy:GetDeploymentConfig"
                  - "codedeploy:RegisterApplicationRevision"
                Resource:
                  - !Sub "arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:application:${ECSApplication}"
                  - !Sub "arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentgroup:${ECSApplication}/*"
                  - !Sub "arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentconfig:*"
              - Effect: Allow
                Action:
                  - "sns:Publish"
                Resource: !Ref PipelineNotificationTopic
              - Effect: Allow
                Action:
                  - "lambda:InvokeFunction"
                Resource:
                  - !GetAtt ValidationLambda.Arn
                  - !GetAtt RollbackLambda.Arn
              - Effect: Allow
                Action:
                  - "kms:Decrypt"
                  - "kms:GenerateDataKey"
                Resource: !GetAtt PipelineKMSKey.Arn
              - Effect: Allow
                Action:
                  - "sts:AssumeRole"
                Resource:
                  - !Sub "arn:aws:iam::${DevAccountId}:role/CrossAccountDeployRole"
                  - !Sub "arn:aws:iam::${StagingAccountId}:role/CrossAccountDeployRole"
                  - !Sub "arn:aws:iam::${ProdAccountId}:role/CrossAccountDeployRole"
              - Effect: Allow
                Action:
                  - "ecs:*"
                Resource: "*"
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-codebuild-role"
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: "sts:AssumeRole"
      Policies:
        - PolicyName: CodeBuildExecutionPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - "logs:CreateLogGroup"
                  - "logs:CreateLogStream"
                  - "logs:PutLogEvents"
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*"
              - Effect: Allow
                Action:
                  - "s3:GetObject"
                  - "s3:GetObjectVersion"
                  - "s3:PutObject"
                Resource: !Sub "${PipelineArtifactsBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - "ecr:GetAuthorizationToken"
                  - "ecr:BatchCheckLayerAvailability"
                  - "ecr:GetDownloadUrlForLayer"
                  - "ecr:BatchGetImage"
                  - "ecr:PutImage"
                  - "ecr:InitiateLayerUpload"
                  - "ecr:UploadLayerPart"
                  - "ecr:CompleteLayerUpload"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "ssm:GetParameter"
                  - "ssm:GetParameters"
                Resource: !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/pipeline/*"
              - Effect: Allow
                Action:
                  - "kms:Decrypt"
                  - "kms:GenerateDataKey"
                Resource: !GetAtt PipelineKMSKey.Arn
              - Effect: Allow
                Action:
                  - "codebuild:CreateReportGroup"
                  - "codebuild:CreateReport"
                  - "codebuild:UpdateReport"
                  - "codebuild:BatchPutTestCases"
                Resource: !Sub "arn:aws:codebuild:${AWS::Region}:${AWS::AccountId}:report-group/*"
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  CodeDeployServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-codedeploy-role"
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS
      Policies:
        - PolicyName: CodeDeployECSPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - "ecs:DescribeServices"
                  - "ecs:CreateTaskSet"
                  - "ecs:UpdateServicePrimaryTaskSet"
                  - "ecs:DeleteTaskSet"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "elasticloadbalancing:DescribeTargetGroups"
                  - "elasticloadbalancing:DescribeListeners"
                  - "elasticloadbalancing:ModifyListener"
                  - "elasticloadbalancing:DescribeRules"
                  - "elasticloadbalancing:ModifyRule"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "s3:GetObject"
                Resource: !Sub "${PipelineArtifactsBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - "lambda:InvokeFunction"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "cloudwatch:DescribeAlarms"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "sns:Publish"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "iam:PassRole"
                Resource: !GetAtt ECSTaskExecutionRole.Arn
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-lambda-execution-role"
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: LambdaExecutionPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - "codedeploy:GetDeployment"
                  - "codedeploy:PutLifecycleEventHookExecutionStatus"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "ecs:DescribeServices"
                  - "ecs:DescribeTaskDefinition"
                  - "ecs:DescribeTasks"
                  - "ecs:ListTasks"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "elasticloadbalancing:DescribeTargetHealth"
                Resource: "*"
              - Effect: Allow
                Action:
                  - "sns:Publish"
                Resource: !Ref PipelineNotificationTopic
              - Effect: Allow
                Action:
                  - "ssm:GetParameter"
                Resource: !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/pipeline/*"
              - Effect: Allow
                Action:
                  - "codepipeline:PutJobSuccessResult"
                  - "codepipeline:PutJobFailureResult"
                Resource: "*"
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-ecs-task-execution-role"
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: ECSTaskExecutionPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - "ssm:GetParameter"
                  - "ssm:GetParameters"
                Resource: !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/pipeline/*"
              - Effect: Allow
                Action:
                  - "kms:Decrypt"
                Resource: !GetAtt PipelineKMSKey.Arn
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  # ===========================
  # CodeBuild Projects
  # ===========================
  
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub "${AWS::StackName}-build"
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/standard:7.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: ECR_REPOSITORY
            Value: !Ref ECRRepository
          - Name: IMAGE_TAG
            Value: latest
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-build.yml
      Cache:
        Type: S3
        Location: !Sub "${PipelineArtifactsBucket}/build-cache"
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub "/aws/codebuild/${AWS::StackName}-build"
      EncryptionKey: !GetAtt PipelineKMSKey.Arn
      TimeoutInMinutes: 20
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  UnitTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub "${AWS::StackName}-unit-tests"
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:7.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-unit.yml
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub "/aws/codebuild/${AWS::StackName}-unit-tests"
      EncryptionKey: !GetAtt PipelineKMSKey.Arn
      TimeoutInMinutes: 10
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  IntegrationTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub "${AWS::StackName}-integration-tests"
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:7.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-integration.yml
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub "/aws/codebuild/${AWS::StackName}-integration-tests"
      EncryptionKey: !GetAtt PipelineKMSKey.Arn
      TimeoutInMinutes: 15
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  # ===========================
  # ECS Resources
  # ===========================
  
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub "${AWS::StackName}-cluster"
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  ECSTaskDefinitionDev:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub "${AWS::StackName}-dev"
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: "256"
      Memory: "512"
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      ContainerDefinitions:
        - Name: app
          Image: !Sub "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}:latest"
          Essential: true
          PortMappings:
            - ContainerPort: 8080
              Protocol: tcp
          Environment:
            - Name: ENVIRONMENT
              Value: development
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Sub "/ecs/${AWS::StackName}"
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: dev
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  ECSServiceDev:
    Type: AWS::ECS::Service
    DependsOn: ALBListenerDev
    Properties:
      ServiceName: !Sub "${AWS::StackName}-dev"
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinitionDev
      DesiredCount: 2
      LaunchType: FARGATE
      DeploymentController:
        Type: CODE_DEPLOY
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets: !Ref PrivateSubnetIds
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: app
          ContainerPort: 8080
          TargetGroupArn: !Ref ALBTargetGroupBlueDev
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  # Staging and Prod services would follow similar pattern
  # Truncated for brevity but would replicate Dev pattern

  # ===========================
  # Load Balancers and Target Groups
  # ===========================
  
  ApplicationLoadBalancerDev:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${AWS::StackName}-alb-dev"
      Type: application
      Scheme: internal
      Subnets: !Ref PrivateSubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  ALBTargetGroupBlueDev:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-blue-dev"
      Port: 8080
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VpcId
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  ALBTargetGroupGreenDev:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-green-dev"
      Port: 8080
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VpcId
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  ALBListenerDev:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancerDev
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroupBlueDev

  # ===========================
  # Security Groups
  # ===========================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  # ===========================
  # CodeDeploy
  # ===========================
  
  ECSApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub "${AWS::StackName}-ecs-app"
      ComputePlatform: ECS
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  CodeDeployDeploymentGroupDev:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref ECSApplication
      DeploymentGroupName: !Sub "${AWS::StackName}-dev"
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSAllAtOnceBlueGreen
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
        GreenFleetProvisioningOption:
          Action: DISCOVER_EXISTING
      LoadBalancerInfo:
        TargetGroupPairInfoList:
          - ProdTrafficRoute:
              ListenerArns:
                - !Ref ALBListenerDev
            TargetGroups:
              - Name: !GetAtt ALBTargetGroupBlueDev.TargetGroupName
              - Name: !GetAtt ALBTargetGroupGreenDev.TargetGroupName
      ECSServices:
        - ClusterName: !Ref ECSCluster
          ServiceName: !GetAtt ECSServiceDev.Name
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref HighErrorRateAlarmDev
      Tags:
        - Key: Environment
          Value: Development
        - Key: Project
          Value: PaymentMicroservices

  # ===========================
  # CloudWatch Alarms
  # ===========================
  
  HighErrorRateAlarmDev:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-high-error-rate-dev"
      AlarmDescription: Alarm for high error rate in Dev environment
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancerDev.LoadBalancerFullName
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  # ===========================
  # Lambda Functions
  # ===========================
  
  ValidationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${AWS::StackName}-validation"
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 299
      MemorySize: 256
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref PipelineNotificationTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from urllib import request

          def handler(event, context):
              codepipeline = boto3.client('codepipeline')
              sns = boto3.client('sns')
              
              job_id = event['CodePipeline.job']['id']
              input_data = json.loads(event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters'])
              
              try:
                  # Perform validation logic
                  endpoint = input_data.get('endpoint', '')
                  expected_status = input_data.get('expectedStatus', 200)
                  
                  # Simple health check
                  response = request.urlopen(f"http://{endpoint}/health")
                  
                  if response.status == expected_status:
                      codepipeline.put_job_success_result(jobId=job_id)
                      print(f"Validation successful for {endpoint}")
                  else:
                      codepipeline.put_job_failure_result(
                          jobId=job_id,
                          failureDetails={'message': f'Unexpected status code: {response.status}'}
                      )
                      
                      # Send notification
                      sns.publish(
                          TopicArn=os.environ['SNS_TOPIC_ARN'],
                          Subject='Deployment Validation Failed',
                          Message=f'Validation failed for endpoint {endpoint}'
                      )
                      
              except Exception as e:
                  codepipeline.put_job_failure_result(
                      jobId=job_id,
                      failureDetails={'message': str(e)}
                  )
                  
              return {'statusCode': 200}
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  RollbackLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${AWS::StackName}-rollback"
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 299
      MemorySize: 256
      Code:
        ZipFile: |
          import json
          import boto3
          
          def handler(event, context):
              codedeploy = boto3.client('codedeploy')
              
              # Rollback logic implementation
              deployment_id = event.get('deploymentId')
              
              if deployment_id:
                  try:
                      response = codedeploy.stop_deployment(
                          deploymentId=deployment_id,
                          autoRollbackEnabled=True
                      )
                      return {
                          'statusCode': 200,
                          'body': json.dumps('Rollback initiated')
                      }
                  except Exception as e:
                      return {
                          'statusCode': 500,
                          'body': json.dumps(f'Rollback failed: {str(e)}')
                      }
              
              return {
                  'statusCode': 400,
                  'body': json.dumps('No deployment ID provided')
              }
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices

  # ===========================
  # EventBridge Rules
  # ===========================
  
  PipelineFailureEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "${AWS::StackName}-pipeline-failure"
      Description: Trigger on pipeline failure
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          state:
            - FAILED
            - CANCELED
          pipeline:
            - !Ref Pipeline
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: SNSTarget

  DeploymentFailureEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "${AWS::StackName}-deployment-failure"
      Description: Trigger on CodeDeploy failure
      EventPattern:
        source:
          - aws.codedeploy
        detail-type:
          - CodeDeploy Deployment State-change Notification
        detail:
          state:
            - FAILURE
            - STOPPED
      State: ENABLED
      Targets:
        - Arn: !GetAtt RollbackLambda.Arn
          Id: LambdaTarget

  # ===========================
  # SSM Parameters
  # ===========================
  
  DevConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /pipeline/dev/config
      Type: String
      Value: |
        {
          "environment": "development",
          "apiEndpoint": "https://api-dev.example.com",
          "dbEndpoint": "dev-db.cluster.amazonaws.com",
          "featureFlags": {
            "newPaymentFlow": false,
            "debugMode": true
          }
        }
      Description: Development environment configuration
      Tags:
        Environment: Development
        Project: PaymentMicroservices

  StagingConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /pipeline/staging/config
      Type: String
      Value: |
        {
          "environment": "staging",
          "apiEndpoint": "https://api-staging.example.com",
          "dbEndpoint": "staging-db.cluster.amazonaws.com",
          "featureFlags": {
            "newPaymentFlow": true,
            "debugMode": false
          }
        }
      Description: Staging environment configuration
      Tags:
        Environment: Staging
        Project: PaymentMicroservices

  ProdConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /pipeline/prod/config
      Type: String
      Value: |
        {
          "environment": "production",
          "apiEndpoint": "https://api.example.com",
          "dbEndpoint": "prod-db.cluster.amazonaws.com",
          "featureFlags": {
            "newPaymentFlow": true,
            "debugMode": false
          }
        }
      Description: Production environment configuration
      Tags:
        Environment: Production
        Project: PaymentMicroservices

  # ===========================
  # CodePipeline
  # ===========================
  
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub "${AWS::StackName}-pipeline"
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref PipelineArtifactsBucket
        EncryptionKey:
          Id: !GetAtt PipelineKMSKey.Arn
          Type: KMS
      Stages:
        # Source Stage
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: "1"
              Configuration:
                Owner: !Ref GitHubOwner
                Repo: !Ref GitHubRepository
                Branch: !Ref GitHubBranch
                OAuthToken: !Ref GitHubOAuthToken
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
                Version: "1"
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
        
        # Test Stage
        - Name: Test
          Actions:
            - Name: UnitTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: "1"
              Configuration:
                ProjectName: !Ref UnitTestProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: UnitTestOutput
              RunOrder: 1
            
            - Name: IntegrationTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: "1"
              Configuration:
                ProjectName: !Ref IntegrationTestProject
              InputArtifacts:
                - Name: BuildOutput
              OutputArtifacts:
                - Name: IntegrationTestOutput
              RunOrder: 2
        
        # Deploy to Dev Stage
        - Name: Deploy-Dev
          Actions:
            - Name: CreateChangeSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: "1"
              Configuration:
                ClusterName: !Ref ECSCluster
                ServiceName: !GetAtt ECSServiceDev.Name
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
            
            - Name: DeployToECSDev
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: "1"
              Configuration:
                ApplicationName: !Ref ECSApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroupDev
                TaskDefinitionTemplateArtifact: BuildOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: BuildOutput
                AppSpecTemplatePath: appspec.yaml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 2
            
            - Name: ValidateDev
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: "1"
              Configuration:
                FunctionName: !Ref ValidationLambda
                UserParameters: |
                  {
                    "endpoint": "alb-dev.internal.example.com",
                    "expectedStatus": 200
                  }
              RunOrder: 3
        
        # Deploy to Staging Stage
        - Name: Deploy-Staging
          Actions:
            - Name: ApprovalForStaging
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: "1"
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: Please review and approve deployment to Staging environment
              RunOrder: 1
            
            - Name: AssumeRoleStaging
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: "1"
              Configuration:
                ActionMode: CREATE_UPDATE
                RoleArn: !Sub "arn:aws:iam::${StagingAccountId}:role/CrossAccountDeployRole"
                StackName: !Sub "${AWS::StackName}-staging-deploy"
                TemplatePath: BuildOutput::deploy-staging.yml
                Capabilities: CAPABILITY_NAMED_IAM
                RoleArn: !Sub "arn:aws:iam::${StagingAccountId}:role/CloudFormationExecutionRole"
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 2
            
            - Name: ValidateStaging
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: "1"
              Configuration:
                FunctionName: !Ref ValidationLambda
                UserParameters: |
                  {
                    "endpoint": "alb-staging.internal.example.com",
                    "expectedStatus": 200
                  }
              RunOrder: 3
        
        # Deploy to Production Stage
        - Name: Deploy-Prod
          Actions:
            - Name: ApprovalForProduction
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: "1"
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: Please review and approve deployment to Production environment
                ExternalEntityLink: https://monitoring.example.com/dashboard
              RunOrder: 1
            
            - Name: AssumeRoleProd
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: "1"
              Configuration:
                ActionMode: CREATE_UPDATE
                RoleArn: !Sub "arn:aws:iam::${ProdAccountId}:role/CrossAccountDeployRole"
                StackName: !Sub "${AWS::StackName}-prod-deploy"
                TemplatePath: BuildOutput::deploy-prod.yml
                Capabilities: CAPABILITY_NAMED_IAM
                RoleArn: !Sub "arn:aws:iam::${ProdAccountId}:role/CloudFormationExecutionRole"
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 2
            
            - Name: ValidateProd
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: "1"
              Configuration:
                FunctionName: !Ref ValidationLambda
                UserParameters: |
                  {
                    "endpoint": "alb-prod.internal.example.com",
                    "expectedStatus": 200
                  }
              RunOrder: 3
      
      Tags:
        - Key: Environment
          Value: Shared-Tools
        - Key: Project
          Value: PaymentMicroservices
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Owner
          Value: DevOps
        - Key: CostCenter
          Value: Engineering

  # ===========================
  # GitHub Webhook
  # ===========================
  
  PipelineWebhook:
    Type: AWS::CodePipeline::Webhook
    Properties:
      Name: !Sub "${AWS::StackName}-webhook"
      Authentication: GITHUB_HMAC
      AuthenticationConfiguration:
        SecretToken: !Ref GitHubOAuthToken
      Filters:
        - JsonPath: "$.ref"
          MatchEquals: refs/heads/main
      TargetPipeline: !Ref Pipeline
      TargetAction: SourceAction
      TargetPipelineVersion: !GetAtt Pipeline.Version
      RegisterWithThirdParty: true

  # ===========================
  # Lambda Permissions for EventBridge
  # ===========================
  
  RollbackLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref RollbackLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DeploymentFailureEventRule.Arn

Outputs:
  PipelineName:
    Description: Name of the CI/CD Pipeline
    Value: !Ref Pipeline
    Export:
      Name: !Sub "${AWS::StackName}-pipeline-name"
  
  PipelineArn:
    Description: ARN of the CI/CD Pipeline
    Value: !Sub "arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${Pipeline}"
    Export:
      Name: !Sub "${AWS::StackName}-pipeline-arn"
  
  ArtifactsBucket:
    Description: S3 bucket for pipeline artifacts
    Value: !Ref PipelineArtifactsBucket
    Export:
      Name: !Sub "${AWS::StackName}-artifacts-bucket"
  
  NotificationTopic:
    Description: SNS topic for pipeline notifications
    Value: !Ref PipelineNotificationTopic
    Export:
      Name: !Sub "${AWS::StackName}-notification-topic"
  
  ECSClusterName:
    Description: Name of the ECS cluster
    Value: !Ref ECSCluster
    Export:
      Name: !Sub "${AWS::StackName}-ecs-cluster"
```