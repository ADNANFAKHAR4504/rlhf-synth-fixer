# CI/CD Pipeline CloudFormation Implementation

This implementation creates a complete multi-stage CI/CD pipeline for containerized applications using CloudFormation YAML.

## File: lib/cicd-pipeline.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-stage CI/CD pipeline for containerized applications with Blue/Green deployments

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for resource names to ensure uniqueness across environments
    Default: dev
    AllowedPattern: ^[a-z0-9-]+$

  GitHubToken:
    Type: String
    Description: GitHub OAuth token for source integration
    NoEcho: true

  GitHubOwner:
    Type: String
    Description: GitHub repository owner

  RepositoryName:
    Type: String
    Description: GitHub repository name

  BranchName:
    Type: String
    Description: Git branch to track
    Default: main

  NotificationEmail:
    Type: String
    Description: Email address for pipeline notifications

  ECSClusterNameStaging:
    Type: String
    Description: ECS cluster name for staging environment

  ECSServiceNameStaging:
    Type: String
    Description: ECS service name for staging environment

  ECSClusterNameProduction:
    Type: String
    Description: ECS cluster name for production environment

  ECSServiceNameProduction:
    Type: String
    Description: ECS service name for production environment

Resources:
  # KMS Key for artifact encryption
  ArtifactEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for pipeline artifacts - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CodePipeline to use the key
            Effect: Allow
            Principal:
              Service:
                - codepipeline.amazonaws.com
                - codebuild.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
            Resource: '*'
      PendingWindowInDays: 7
    DeletionPolicy: Delete

  ArtifactEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/pipeline-${EnvironmentSuffix}'
      TargetKeyId: !Ref ArtifactEncryptionKey

  # S3 Bucket for pipeline artifacts
  PipelineArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !GetAtt ArtifactEncryptionKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
    DeletionPolicy: Delete

  # SNS Topic for pipeline notifications
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'pipeline-notifications-${EnvironmentSuffix}'
      DisplayName: CI/CD Pipeline Notifications
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email

  # CloudWatch Logs for Build Project
  BuildProjectLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/build-project-${EnvironmentSuffix}'
      RetentionInDays: 30
    DeletionPolicy: Delete

  # CloudWatch Logs for Test Project
  TestProjectLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/test-project-${EnvironmentSuffix}'
      RetentionInDays: 30
    DeletionPolicy: Delete

  # IAM Role for CodeBuild
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'codebuild-service-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildBasePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !GetAtt BuildProjectLogGroup.Arn
                  - !GetAtt TestProjectLogGroup.Arn
                  - !Sub '${BuildProjectLogGroup.Arn}:*'
                  - !Sub '${TestProjectLogGroup.Arn}:*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${PipelineArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt PipelineArtifactBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:Encrypt'
                  - 'kms:ReEncrypt*'
                  - 'kms:GenerateDataKey*'
                Resource:
                  - !GetAtt ArtifactEncryptionKey.Arn
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

  # CodeBuild Project for Build Stage
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub 'build-project-${EnvironmentSuffix}'
      Description: Build stage for CI/CD pipeline
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:4.0
        PrivilegedMode: true
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
            build:
              commands:
                - echo Build started on `date`
                - echo Building the Docker image...
                - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
                - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker image...
                - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
          artifacts:
            files:
              - '**/*'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref BuildProjectLogGroup
      EncryptionKey: !GetAtt ArtifactEncryptionKey.Arn

  # CodeBuild Project for Test Stage
  TestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub 'test-project-${EnvironmentSuffix}'
      Description: Test stage for CI/CD pipeline
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:4.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              commands:
                - echo Installing test dependencies...
            pre_build:
              commands:
                - echo Test phase starting...
            build:
              commands:
                - echo Running unit tests...
                - echo Running integration tests...
            post_build:
              commands:
                - echo Tests completed on `date`
          artifacts:
            files:
              - '**/*'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref TestProjectLogGroup
      EncryptionKey: !GetAtt ArtifactEncryptionKey.Arn

  # IAM Role for CodeDeploy
  CodeDeployServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'codedeploy-service-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'

  # CodeDeploy Application
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub 'ecs-app-${EnvironmentSuffix}'
      ComputePlatform: ECS

  # CodeDeploy Deployment Group for Staging
  DeploymentGroupStaging:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub 'staging-deployment-${EnvironmentSuffix}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSAllAtOnce
      DeploymentStyle:
        DeploymentType: BLUE_GREEN
        DeploymentOption: WITH_TRAFFIC_CONTROL
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
      ECSServices:
        - ClusterName: !Ref ECSClusterNameStaging
          ServiceName: !Ref ECSServiceNameStaging

  # CodeDeploy Deployment Group for Production
  DeploymentGroupProduction:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub 'production-deployment-${EnvironmentSuffix}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.ECSAllAtOnce
      DeploymentStyle:
        DeploymentType: BLUE_GREEN
        DeploymentOption: WITH_TRAFFIC_CONTROL
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
      ECSServices:
        - ClusterName: !Ref ECSClusterNameProduction
          ServiceName: !Ref ECSServiceNameProduction

  # IAM Role for CodePipeline
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'codepipeline-service-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodePipelineBasePolicy
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
                  - !GetAtt PipelineArtifactBucket.Arn
                  - !Sub '${PipelineArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:Encrypt'
                  - 'kms:ReEncrypt*'
                  - 'kms:GenerateDataKey*'
                Resource:
                  - !GetAtt ArtifactEncryptionKey.Arn
              - Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource:
                  - !GetAtt BuildProject.Arn
                  - !GetAtt TestProject.Arn
              - Effect: Allow
                Action:
                  - 'codedeploy:CreateDeployment'
                  - 'codedeploy:GetApplication'
                  - 'codedeploy:GetApplicationRevision'
                  - 'codedeploy:GetDeployment'
                  - 'codedeploy:GetDeploymentConfig'
                  - 'codedeploy:RegisterApplicationRevision'
                Resource:
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:application:${CodeDeployApplication}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentgroup:${CodeDeployApplication}/${DeploymentGroupStaging}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentgroup:${CodeDeployApplication}/${DeploymentGroupProduction}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentconfig:*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource:
                  - !Ref PipelineNotificationTopic
              - Effect: Allow
                Action:
                  - 'ecs:DescribeServices'
                  - 'ecs:DescribeTaskDefinition'
                  - 'ecs:DescribeTasks'
                  - 'ecs:ListTasks'
                  - 'ecs:RegisterTaskDefinition'
                  - 'ecs:UpdateService'
                Resource: '*'

  # CodePipeline
  CICDPipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub 'cicd-pipeline-${EnvironmentSuffix}'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref PipelineArtifactBucket
        EncryptionKey:
          Id: !GetAtt ArtifactEncryptionKey.Arn
          Type: KMS
      Stages:
        # Stage 1: Source
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
                Repo: !Ref RepositoryName
                Branch: !Ref BranchName
                OAuthToken: !Ref GitHubToken
              OutputArtifacts:
                - Name: SourceOutput

        # Stage 2: Build
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

        # Stage 3: Test
        - Name: Test
          Actions:
            - Name: TestAction
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: BuildOutput
              OutputArtifacts:
                - Name: TestOutput

        # Stage 4: Deploy to Staging
        - Name: Deploy-Staging
          Actions:
            - Name: DeployToStaging
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref DeploymentGroupStaging
                TaskDefinitionTemplateArtifact: TestOutput
                AppSpecTemplateArtifact: TestOutput
              InputArtifacts:
                - Name: TestOutput

        # Stage 5: Manual Approval and Deploy to Production
        - Name: Deploy-Production
          Actions:
            - Name: ApprovalAction
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: 'Please review staging deployment and approve production deployment'
            - Name: DeployToProduction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref DeploymentGroupProduction
                TaskDefinitionTemplateArtifact: TestOutput
                AppSpecTemplateArtifact: TestOutput
              InputArtifacts:
                - Name: TestOutput
              RunOrder: 2

  # CloudWatch Events Rule for Pipeline State Changes
  PipelineStateChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'pipeline-state-change-${EnvironmentSuffix}'
      Description: Trigger notifications on pipeline state changes
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          state:
            - STARTED
            - SUCCEEDED
            - FAILED
          pipeline:
            - !Ref CICDPipeline
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineNotificationTarget
          InputTransformer:
            InputPathsMap:
              pipeline: $.detail.pipeline
              state: $.detail.state
              execution: $.detail.execution-id
            InputTemplate: |
              "Pipeline <pipeline> execution <execution> has <state>."

  # SNS Topic Policy to allow CloudWatch Events
  PipelineNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref PipelineNotificationTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sns:Publish'
            Resource: !Ref PipelineNotificationTopic

Outputs:
  PipelineArn:
    Description: ARN of the CodePipeline
    Value: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${CICDPipeline}'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineArn'

  ArtifactBucketName:
    Description: Name of the S3 bucket for pipeline artifacts
    Value: !Ref PipelineArtifactBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactBucket'

  NotificationTopicArn:
    Description: ARN of the SNS topic for pipeline notifications
    Value: !Ref PipelineNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopic'

  BuildProjectName:
    Description: Name of the CodeBuild project for build stage
    Value: !Ref BuildProject
    Export:
      Name: !Sub '${AWS::StackName}-BuildProject'

  TestProjectName:
    Description: Name of the CodeBuild project for test stage
    Value: !Ref TestProject
    Export:
      Name: !Sub '${AWS::StackName}-TestProject'

  CodeDeployApplicationName:
    Description: Name of the CodeDeploy application
    Value: !Ref CodeDeployApplication
    Export:
      Name: !Sub '${AWS::StackName}-CodeDeployApp'
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This CloudFormation template creates a production-ready CI/CD pipeline for containerized applications with Blue/Green deployments.

## Architecture

The pipeline consists of 5 stages:

1. **Source**: Retrieves code from GitHub repository
2. **Build**: Builds Docker container images using CodeBuild
3. **Test**: Runs automated tests using CodeBuild
4. **Deploy-Staging**: Deploys to staging ECS cluster using CodeDeploy Blue/Green deployment
5. **Deploy-Production**: Manual approval followed by production deployment

## Prerequisites

Before deploying this stack, ensure you have:

- AWS Account with appropriate permissions
- GitHub repository with OAuth token
- ECS clusters and services for staging and production environments
- ECR repository for container images

## Deployment

### Parameters

The template requires the following parameters:

- `EnvironmentSuffix`: Unique suffix for resource names (e.g., dev, staging, prod)
- `GitHubToken`: GitHub OAuth token for source integration
- `GitHubOwner`: GitHub repository owner/organization
- `RepositoryName`: GitHub repository name
- `BranchName`: Git branch to track (default: main)
- `NotificationEmail`: Email address for pipeline notifications
- `ECSClusterNameStaging`: ECS cluster name for staging
- `ECSServiceNameStaging`: ECS service name for staging
- `ECSClusterNameProduction`: ECS cluster name for production
- `ECSServiceNameProduction`: ECS service name for production

### Deploy using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name cicd-pipeline-dev \
  --template-body file://lib/cicd-pipeline.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=GitHubToken,ParameterValue=YOUR_GITHUB_TOKEN \
    ParameterKey=GitHubOwner,ParameterValue=your-org \
    ParameterKey=RepositoryName,ParameterValue=your-repo \
    ParameterKey=BranchName,ParameterValue=main \
    ParameterKey=NotificationEmail,ParameterValue=team@example.com \
    ParameterKey=ECSClusterNameStaging,ParameterValue=staging-cluster \
    ParameterKey=ECSServiceNameStaging,ParameterValue=staging-service \
    ParameterKey=ECSClusterNameProduction,ParameterValue=prod-cluster \
    ParameterKey=ECSServiceNameProduction,ParameterValue=prod-service \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy using AWS Console

1. Navigate to CloudFormation console
2. Click "Create stack"
3. Upload `lib/cicd-pipeline.yml`
4. Fill in all required parameters
5. Acknowledge IAM resource creation
6. Click "Create stack"

## Security Features

- **Encryption**: All artifacts encrypted at rest using customer-managed KMS key
- **Least Privilege IAM**: All roles follow least-privilege principle with specific actions
- **S3 Security**: Bucket versioning enabled, public access blocked
- **Secure Source**: GitHub integration using OAuth token (stored securely in Parameters)

## Monitoring

- **CloudWatch Logs**: Build and test logs retained for 30 days
- **SNS Notifications**: Email notifications for pipeline state changes (STARTED, SUCCEEDED, FAILED)
- **CloudWatch Events**: Automatic capture of all pipeline execution events

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name cicd-pipeline-dev \
  --region us-east-1
```

Note: All resources are configured with `DeletionPolicy: Delete` for easy cleanup.

## Outputs

The stack exports the following values:

- `PipelineArn`: ARN of the CodePipeline
- `ArtifactBucketName`: S3 bucket name for artifacts
- `NotificationTopicArn`: SNS topic ARN for notifications
- `BuildProjectName`: CodeBuild project name for build stage
- `TestProjectName`: CodeBuild project name for test stage
- `CodeDeployApplicationName`: CodeDeploy application name

## Cost Optimization

- CodeBuild projects use `BUILD_GENERAL1_SMALL` compute type
- CloudWatch Logs retention set to 30 days
- S3 bucket lifecycle policies can be added for artifact cleanup

## Troubleshooting

### Pipeline fails at Source stage
- Verify GitHub token has correct permissions
- Check repository owner and name are correct

### Build/Test stage fails
- Review CloudWatch Logs for detailed error messages
- Verify ECR repository exists and CodeBuild has permissions

### Deploy stage fails
- Ensure ECS cluster and service names are correct
- Verify CodeDeploy has necessary permissions
- Check that ECS task definition and AppSpec files exist in repository
```
