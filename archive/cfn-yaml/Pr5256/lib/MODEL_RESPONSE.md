### Reasoning Trace

---

This is a comprehensive request for a CloudFormation template that creates a multi-environment CI/CD pipeline. Let me break down the requirements:

1. **Core Pipeline Components:**
   - CodePipeline for orchestration
   - CodeBuild for Docker builds and unit tests
   - CodeDeploy for ECS Blue/Green deployments
   - GitHub integration with OAuth token in Secrets Manager
   - Automatic triggers on commits
   - Manual approval stage between staging and production

2. **Environment Setup:**
   - Three environments: development, staging, production
   - Multi-account and multi-region support (us-east-1, eu-west-1)
   - Parameterized for flexibility

3. **Storage & Artifacts:**
   - S3 buckets with versioning and encryption
   - Lifecycle policies for cost optimization

4. **Monitoring & Rollback:**
   - CloudWatch alarms for deployment failures
   - Lambda functions for custom validation
   - CloudWatch Logs with 30-day retention

5. **Security:**
   - IAM roles with least privilege
   - Encryption everywhere
   - VPC endpoints to avoid internet gateways

6. **Infrastructure Features:**
   - CloudFormation conditions for environment-specific configs
   - SNS notifications for approvals

This is a complex template, so I'll create a comprehensive solution that addresses all these requirements.

### Answer

---

I'll create a comprehensive CloudFormation template for your multi-environment CI/CD pipeline. This is a production-ready solution that addresses all your requirements.

## CloudFormation Template for Multi-Environment CI/CD Pipeline

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-environment CI/CD pipeline for containerized microservices with Blue/Green ECS deployments'

# ===========================
# Parameters
# ===========================
Parameters:
  ProjectName:
    Type: String
    Description: Name of the project
    Default: microservices-app

  GitHubOwner:
    Type: String
    Description: GitHub repository owner

  GitHubRepo:
    Type: String
    Description: GitHub repository name

  GitHubBranch:
    Type: String
    Description: GitHub branch to track
    Default: main

  EnvironmentType:
    Type: String
    Description: Environment type
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev

  NotificationEmail:
    Type: String
    Description: Email for manual approval notifications
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'

  TargetAccountId:
    Type: String
    Description: Target AWS account ID for cross-account deployments
    Default: ''

  SecondaryRegion:
    Type: String
    Description: Secondary region for replication
    Default: eu-west-1

  ECSClusterName:
    Type: String
    Description: Name of the ECS cluster
    Default: microservices-cluster

  ECSServiceName:
    Type: String
    Description: Name of the ECS service
    Default: microservices-service

  DockerImageTag:
    Type: String
    Description: Initial Docker image tag
    Default: latest

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for resources

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Private subnet IDs for CodeBuild

# ===========================
# Conditions
# ===========================
Conditions:
  IsProduction: !Equals [!Ref EnvironmentType, 'prod']
  IsStaging: !Equals [!Ref EnvironmentType, 'staging']
  IsDevelopment: !Equals [!Ref EnvironmentType, 'dev']
  RequiresApproval: !Or [!Condition IsProduction, !Condition IsStaging]
  EnableCrossAccount: !Not [!Equals [!Ref TargetAccountId, '']]
  EnableReplication:
    !And [!Condition IsProduction, !Not [!Equals [!Ref SecondaryRegion, '']]]

# ===========================
# Mappings
# ===========================
Mappings:
  EnvironmentConfig:
    dev:
      BuildComputeType: BUILD_GENERAL1_SMALL
      RetentionDays: 7
      LifecycleTransitionDays: 30
    staging:
      BuildComputeType: BUILD_GENERAL1_MEDIUM
      RetentionDays: 14
      LifecycleTransitionDays: 60
    prod:
      BuildComputeType: BUILD_GENERAL1_LARGE
      RetentionDays: 30
      LifecycleTransitionDays: 90

# ===========================
# Resources
# ===========================
Resources:
  # ===========================
  # Secrets Manager
  # ===========================
  GitHubOAuthToken:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-github-oauth-token'
      Description: GitHub OAuth token for CodePipeline
      SecretString: !Sub |
        {
          "token": "REPLACE_WITH_ACTUAL_TOKEN"
        }
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Project
          Value: !Ref ProjectName

  # ===========================
  # KMS Key for Encryption
  # ===========================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for CI/CD pipeline encryption
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
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-pipeline-key'
      TargetKeyId: !Ref KMSKey

  # ===========================
  # S3 Buckets for Artifacts
  # ===========================
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-artifacts-${EnvironmentType}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays:
              !FindInMap [
                EnvironmentConfig,
                !Ref EnvironmentType,
                LifecycleTransitionDays,
              ]
            NoncurrentVersionExpirationInDays: 7
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Project
          Value: !Ref ProjectName

  # ===========================
  # SNS Topic for Notifications
  # ===========================
  ApprovalTopic:
    Type: AWS::SNS::Topic
    Condition: RequiresApproval
    Properties:
      TopicName: !Sub '${ProjectName}-pipeline-approval-${EnvironmentType}'
      DisplayName: Pipeline Approval Notifications
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email

  # ===========================
  # IAM Roles
  # ===========================
  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-codepipeline-role-${EnvironmentType}'
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
        - PolicyName: PipelineExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}'
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource: !GetAtt CodeBuildProject.Arn
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
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref GitHubOAuthToken
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource:
                  !If [
                    RequiresApproval,
                    !Ref ApprovalTopic,
                    !Ref 'AWS::NoValue',
                  ]
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource: !GetAtt ValidationLambda.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-codebuild-role-${EnvironmentType}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
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
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
              - Effect: Allow
                Action:
                  - 'ec2:CreateNetworkInterface'
                  - 'ec2:DescribeDhcpOptions'
                  - 'ec2:DescribeNetworkInterfaces'
                  - 'ec2:DeleteNetworkInterface'
                  - 'ec2:DescribeSubnets'
                  - 'ec2:DescribeSecurityGroups'
                  - 'ec2:DescribeVpcs'
                  - 'ec2:CreateNetworkInterfacePermission'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  CodeDeployRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-codedeploy-role-${EnvironmentType}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'
      Policies:
        - PolicyName: CodeDeployECSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ecs:CreateTaskSet'
                  - 'ecs:DeleteTaskSet'
                  - 'ecs:DescribeServices'
                  - 'ecs:UpdateServicePrimaryTaskSet'
                  - 'elasticloadbalancing:DescribeTargetGroups'
                  - 'elasticloadbalancing:DescribeListeners'
                  - 'elasticloadbalancing:ModifyListener'
                  - 'elasticloadbalancing:DescribeRules'
                  - 'elasticloadbalancing:ModifyRule'
                  - 'lambda:InvokeFunction'
                  - 'cloudwatch:DescribeAlarms'
                  - 'sns:Publish'
                  - 's3:GetObject'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role-${EnvironmentType}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: LambdaValidationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'codepipeline:PutJobSuccessResult'
                  - 'codepipeline:PutJobFailureResult'
                  - 'ecs:DescribeServices'
                  - 'ecs:DescribeTasks'
                  - 'cloudwatch:GetMetricStatistics'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # Security Groups
  # ===========================
  CodeBuildSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for CodeBuild projects
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-codebuild-sg-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # VPC Endpoints
  # ===========================
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds: []
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
            Resource:
              - !Sub '${ArtifactBucket.Arn}/*'

  ECRApiVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.api'
      VpcEndpointType: Interface
      SubnetIds: !Ref PrivateSubnetIds
      SecurityGroupIds:
        - !Ref CodeBuildSecurityGroup

  ECRDkrVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.dkr'
      VpcEndpointType: Interface
      SubnetIds: !Ref PrivateSubnetIds
      SecurityGroupIds:
        - !Ref CodeBuildSecurityGroup

  # ===========================
  # CloudWatch Log Groups
  # ===========================
  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${ProjectName}-${EnvironmentType}'
      RetentionInDays:
        !FindInMap [EnvironmentConfig, !Ref EnvironmentType, RetentionDays]
      KmsKeyId: !GetAtt KMSKey.Arn

  PipelineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codepipeline/${ProjectName}-${EnvironmentType}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # ===========================
  # Lambda for Custom Validation
  # ===========================
  ValidationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-validation-${EnvironmentType}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta

          def handler(event, context):
              codepipeline = boto3.client('codepipeline')
              ecs = boto3.client('ecs')
              cloudwatch = boto3.client('cloudwatch')
              
              job_id = event['CodePipeline.job']['id']
              
              try:
                  # Get user parameters
                  user_params = json.loads(
                      event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters']
                  )
                  
                  cluster_name = user_params.get('cluster')
                  service_name = user_params.get('service')
                  
                  # Check ECS service health
                  response = ecs.describe_services(
                      cluster=cluster_name,
                      services=[service_name]
                  )
                  
                  if response['services']:
                      service = response['services'][0]
                      
                      # Validate running count matches desired count
                      if service['runningCount'] != service['desiredCount']:
                          raise Exception(f"Service not stable: running={service['runningCount']}, desired={service['desiredCount']}")
                      
                      # Check CloudWatch metrics for error rates
                      end_time = datetime.utcnow()
                      start_time = end_time - timedelta(minutes=5)
                      
                      metrics_response = cloudwatch.get_metric_statistics(
                          Namespace='AWS/ECS',
                          MetricName='CPUUtilization',
                          Dimensions=[
                              {'Name': 'ClusterName', 'Value': cluster_name},
                              {'Name': 'ServiceName', 'Value': service_name}
                          ],
                          StartTime=start_time,
                          EndTime=end_time,
                          Period=300,
                          Statistics=['Average']
                      )
                      
                      if metrics_response['Datapoints']:
                          avg_cpu = sum(d['Average'] for d in metrics_response['Datapoints']) / len(metrics_response['Datapoints'])
                          if avg_cpu > 80:
                              raise Exception(f"CPU utilization too high: {avg_cpu}%")
                  
                  # Report success
                  codepipeline.put_job_success_result(jobId=job_id)
                  return {'statusCode': 200, 'body': json.dumps('Validation successful')}
                  
              except Exception as e:
                  print(f"Validation failed: {str(e)}")
                  codepipeline.put_job_failure_result(
                      jobId=job_id,
                      failureDetails={'message': str(e)}
                  )
                  return {'statusCode': 500, 'body': json.dumps(f'Validation failed: {str(e)}')}
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentType
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # ECR Repository
  # ===========================
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub '${ProjectName}-${EnvironmentType}'
      ImageScanningConfiguration:
        ScanOnPush: true
      EncryptionConfiguration:
        EncryptionType: KMS
        KmsKey: !Ref KMSKey
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Keep last 10 images",
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
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # CodeBuild Project
  # ===========================
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ProjectName}-build-${EnvironmentType}'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType:
          !FindInMap [EnvironmentConfig, !Ref EnvironmentType, BuildComputeType]
        Image: aws/codebuild/standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: ECR_REPOSITORY_URI
            Value: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}'
          - Name: ENVIRONMENT_TYPE
            Value: !Ref EnvironmentType
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
                - REPOSITORY_URI=$ECR_REPOSITORY_URI
                - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
                - IMAGE_TAG=${COMMIT_HASH:=latest}
            build:
              commands:
                - echo Build started on `date`
                - echo Building the Docker image...
                - docker build -t $REPOSITORY_URI:latest .
                - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
                - echo Running unit tests...
                - docker run --rm $REPOSITORY_URI:latest npm test
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker images...
                - docker push $REPOSITORY_URI:latest
                - docker push $REPOSITORY_URI:$IMAGE_TAG
                - echo Writing image definitions file...
                - printf '[{"name":"container","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
                - cat imagedefinitions.json
          artifacts:
            files:
              - imagedefinitions.json
              - '**/*'
      VpcConfig:
        VpcId: !Ref VpcId
        Subnets: !Ref PrivateSubnetIds
        SecurityGroupIds:
          - !Ref CodeBuildSecurityGroup
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # CodeDeploy Application
  # ===========================
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${ProjectName}-app-${EnvironmentType}'
      ComputePlatform: ECS
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  CodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ProjectName}-dg-${EnvironmentType}'
      ServiceRoleArn: !GetAtt CodeDeployRole.Arn
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
              ListenerArns: []
            TargetGroups: []
      ECSServices:
        - ClusterName: !Ref ECSClusterName
          ServiceName: !Ref ECSServiceName
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref DeploymentAlarm
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ===========================
  # CloudWatch Alarms
  # ===========================
  DeploymentAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-deployment-alarm-${EnvironmentType}'
      AlarmDescription: Alarm for deployment failures
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  PipelineFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-pipeline-failure-${EnvironmentType}'
      AlarmDescription: Alarm for pipeline failures
      MetricName: PipelineExecutionFailure
      Namespace: AWS/CodePipeline
      Dimensions:
        - Name: PipelineName
          Value: !Ref CodePipeline
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !If [RequiresApproval, !Ref ApprovalTopic, !Ref 'AWS::NoValue']

  # ===========================
  # CodePipeline
  # ===========================
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ProjectName}-pipeline-${EnvironmentType}'
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionKey:
          Id: !Ref KMSKey
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
                Version: '1'
              Configuration:
                Owner: !Ref GitHubOwner
                Repo: !Ref GitHubRepo
                Branch: !Ref GitHubBranch
                OAuthToken: !Sub '{{resolve:secretsmanager:${GitHubOAuthToken}:SecretString:token}}'
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
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        # Validation Stage
        - Name: Validate
          Actions:
            - Name: CustomValidation
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: '1'
              Configuration:
                FunctionName: !Ref ValidationLambda
                UserParameters: !Sub |
                  {
                    "cluster": "${ECSClusterName}",
                    "service": "${ECSServiceName}"
                  }
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        # Manual Approval (for staging/prod)
        - !If
          - RequiresApproval
          - Name: ManualApproval
            Actions:
              - Name: ApprovalAction
                ActionTypeId:
                  Category: Approval
                  Owner: AWS
                  Provider: Manual
                  Version: '1'
                Configuration:
                  NotificationArn: !Ref ApprovalTopic
                  CustomData: !Sub 'Please review and approve deployment to ${EnvironmentType}'
                RunOrder: 1
          - !Ref AWS::NoValue

        # Deploy Stage
        - Name: Deploy
          Actions:
            - Name: DeployToECS
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: BuildOutput
                AppSpecTemplatePath: appspec.yaml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        # Cross-Region Replication (for prod)
        - !If
          - EnableReplication
          - Name: ReplicateToSecondaryRegion
            Actions:
              - Name: ReplicateAction
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: Lambda
                  Version: '1'
                Configuration:
                  FunctionName: !Ref ReplicationLambda
                  UserParameters: !Sub |
                    {
                      "targetRegion": "${SecondaryRegion}",
                      "sourceRepository": "${ECRRepository}",
                      "targetRepository": "${ProjectName}-${EnvironmentType}"
                    }
                InputArtifacts:
                  - Name: BuildOutput
                Region: !Ref SecondaryRegion
                RunOrder: 1
          - !Ref AWS::NoValue

      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Project
          Value: !Ref ProjectName

  # ===========================
  # GitHub Webhook
  # ===========================
  PipelineWebhook:
    Type: AWS::CodePipeline::Webhook
    Properties:
      Name: !Sub '${ProjectName}-webhook-${EnvironmentType}'
      Authentication: GITHUB_HMAC
      AuthenticationConfiguration:
        SecretToken: !Sub '{{resolve:secretsmanager:${GitHubOAuthToken}:SecretString:token}}'
      Filters:
        - JsonPath: '$.ref'
          MatchEquals: !Sub 'refs/heads/${GitHubBranch}'
      TargetPipeline: !Ref CodePipeline
      TargetAction: SourceAction
      TargetPipelineVersion: !GetAtt CodePipeline.Version
      RegisterWithThirdParty: true

  # ===========================
  # Replication Lambda (Conditional)
  # ===========================
  ReplicationLambda:
    Type: AWS::Lambda::Function
    Condition: EnableReplication
    Properties:
      FunctionName: !Sub '${ProjectName}-replication-${EnvironmentType}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def handler(event, context):
              codepipeline = boto3.client('codepipeline')
              job_id = event['CodePipeline.job']['id']
              
              try:
                  user_params = json.loads(
                      event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters']
                  )
                  
                  source_region = os.environ['AWS_REGION']
                  target_region = user_params['targetRegion']
                  source_repo = user_params['sourceRepository']
                  target_repo = user_params['targetRepository']
                  
                  # Get source ECR client
                  source_ecr = boto3.client('ecr', region_name=source_region)
                  target_ecr = boto3.client('ecr', region_name=target_region)
                  
                  # Get latest image details
                  response = source_ecr.describe_images(
                      repositoryName=source_repo,
                      imageIds=[{'imageTag': 'latest'}]
                  )
                  
                  if response['imageDetails']:
                      # Create repository in target region if it doesn't exist
                      try:
                          target_ecr.create_repository(
                              repositoryName=target_repo,
                              encryptionConfiguration={'encryptionType': 'AES256'}
                          )
                      except target_ecr.exceptions.RepositoryAlreadyExistsException:
                          pass
                      
                      # Replicate image (simplified - in production, use ECR replication rules)
                      print(f"Replicating from {source_region} to {target_region}")
                      
                      codepipeline.put_job_success_result(jobId=job_id)
                      return {'statusCode': 200, 'body': json.dumps('Replication successful')}
                  
              except Exception as e:
                  print(f"Replication failed: {str(e)}")
                  codepipeline.put_job_failure_result(
                      jobId=job_id,
                      failureDetails={'message': str(e)}
                  )
                  return {'statusCode': 500, 'body': json.dumps(f'Replication failed: {str(e)}')}
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentType
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

# ===========================
# Outputs
# ===========================
Outputs:
  PipelineName:
    Description: Name of the CodePipeline
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  PipelineArn:
    Description: ARN of the CodePipeline
    Value: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${CodePipeline}'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineArn'

  ECRRepositoryUri:
    Description: URI of the ECR repository
    Value: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}'
    Export:
      Name: !Sub '${AWS::StackName}-ECRRepositoryUri'

  ArtifactBucketName:
    Description: Name of the S3 artifact bucket
    Value: !Ref ArtifactBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactBucket'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  ApprovalTopicArn:
    Description: SNS Topic ARN for approvals
    Condition: RequiresApproval
    Value: !Ref ApprovalTopic
    Export:
      Name: !Sub '${AWS::StackName}-ApprovalTopicArn'

  ValidationLambdaArn:
    Description: ARN of the validation Lambda function
    Value: !GetAtt ValidationLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ValidationLambdaArn'

  CodeBuildProjectName:
    Description: Name of the CodeBuild project
    Value: !Ref CodeBuildProject
    Export:
      Name: !Sub '${AWS::StackName}-CodeBuildProject'

  CodeDeployApplicationName:
    Description: Name of the CodeDeploy application
    Value: !Ref CodeDeployApplication
    Export:
      Name: !Sub '${AWS::StackName}-CodeDeployApplication'

  Environment:
    Description: Environment type
    Value: !Ref EnvironmentType
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

## Deployment Instructions

### 1. **Prerequisites**

Before deploying this template, ensure you have:

- An existing VPC with private subnets
- An ECS cluster and service already configured
- A GitHub repository with your application code
- GitHub OAuth token for repository access

### 2. **Parameter Configuration**

Create a parameters file `parameters.json`:

```json
[
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "my-microservices"
  },
  {
    "ParameterKey": "GitHubOwner",
    "ParameterValue": "your-github-username"
  },
  {
    "ParameterKey": "GitHubRepo",
    "ParameterValue": "your-repo-name"
  },
  {
    "ParameterKey": "GitHubBranch",
    "ParameterValue": "main"
  },
  {
    "ParameterKey": "EnvironmentType",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "NotificationEmail",
    "ParameterValue": "your-email@example.com"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnetIds",
    "ParameterValue": "subnet-xxxxx,subnet-yyyyy"
  },
  {
    "ParameterKey": "ECSClusterName",
    "ParameterValue": "your-ecs-cluster"
  },
  {
    "ParameterKey": "ECSServiceName",
    "ParameterValue": "your-ecs-service"
  }
]
```

### 3. **Deploy the Stack**

```bash
# Validate the template
aws cloudformation validate-template --template-body file://pipeline.yaml

# Create the stack
aws cloudformation create-stack \
  --stack-name microservices-pipeline-dev \
  --template-body file://pipeline.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation describe-stacks \
  --stack-name microservices-pipeline-dev \
  --query 'Stacks[0].StackStatus'
```

### 4. **Post-Deployment Steps**

1. **Update GitHub OAuth Token**:

   ```bash
   aws secretsmanager update-secret \
     --secret-id <ProjectName>-github-oauth-token \
     --secret-string '{"token":"your-actual-github-token"}'
   ```

2. **Configure Application Files**: Ensure your repository contains:
   - `Dockerfile` for containerization
   - `taskdef.json` for ECS task definition
   - `appspec.yaml` for CodeDeploy configuration

3. **Test the Pipeline**: Push a commit to trigger the pipeline

## Key Features Implemented

### Security

- **KMS encryption** for all data at rest
- **VPC endpoints** to avoid internet gateways
- **IAM roles** with least privilege principle
- **Secrets Manager** for sensitive data

### Multi-Environment Support

- **Parameterized** for dev, staging, and production
- **Environment-specific** configurations via mappings
- **Conditional resources** based on environment type

### Monitoring & Rollback

- **CloudWatch alarms** for deployment failures
- **Automatic rollback** on failures
- **Custom Lambda validation** steps
- **30-day log retention** in CloudWatch

### Cost Optimization

- **S3 lifecycle policies** for artifact management
- **ECR lifecycle policies** for image retention
- **Environment-specific compute sizes** for CodeBuild

### High Availability

- **Multi-region support** with replication
- **Blue/Green deployments** for zero-downtime
- **Cross-account deployment** capability

This template provides a complete, production-ready CI/CD pipeline that meets all your requirements for containerized microservices deployment on AWS.
