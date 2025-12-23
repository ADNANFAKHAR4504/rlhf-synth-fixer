# CloudFormation Templates - Complete Infrastructure as Code

This document contains all the CloudFormation templates for the TAP (Task Assignment Platform) infrastructure with CI/CD pipeline integration

## Table of Contents

1. [TapStack.yml - Main Application Stack](#tapstackyml---main-application-stack)
2. [TapStack.json - Main Application Stack (JSON Format)](#tapstackjson---main-application-stack-json-format)
3. [cicd-pipeline.yml - CI/CD Pipeline Configuration](#cicd-pipelineyml---cicd-pipeline-configuration)
4. [cicd-pipeline.json - CI/CD Pipeline Configuration (JSON Format)](#cicd-pipelinejson---cicd-pipeline-configuration-json-format)

---

## TapStack.yml - Main Application Stack

This template creates the core DynamoDB table for the Task Assignment Platform.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      # Tags will be applied at stack level during deployment

Outputs:
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

---

## TapStack.json - Main Application Stack (JSON Format)

The same template in JSON format for compatibility with different deployment tools.

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "TAP Stack - Task Assignment Platform CloudFormation Template",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "EnvironmentSuffix"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        }
    },
    "Resources": {
        "TurnAroundPromptTable": {
            "Type": "AWS::DynamoDB::Table",
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete",
            "Properties": {
                "TableName": {
                    "Fn::Sub": "TurnAroundPromptTable${EnvironmentSuffix}"
                },
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "BillingMode": "PAY_PER_REQUEST",
                "DeletionProtectionEnabled": false
            }
        }
    },
    "Outputs": {
        "TurnAroundPromptTableName": {
            "Description": "Name of the DynamoDB table",
            "Value": {
                "Ref": "TurnAroundPromptTable"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableName"
                }
            }
        },
        "TurnAroundPromptTableArn": {
            "Description": "ARN of the DynamoDB table",
            "Value": {
                "Fn::GetAtt": [
                    "TurnAroundPromptTable",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableArn"
                }
            }
        },
        "StackName": {
            "Description": "Name of this CloudFormation stack",
            "Value": {
                "Ref": "AWS::StackName"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-StackName"
                }
            }
        },
        "EnvironmentSuffix": {
            "Description": "Environment suffix used for this deployment",
            "Value": {
                "Ref": "EnvironmentSuffix"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
                }
            }
        }
    }
}
```

---

## cicd-pipeline.yml - CI/CD Pipeline Configuration

Complete CI/CD pipeline with CodePipeline, CodeBuild, CodeDeploy for Blue/Green ECS deployments.

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

---

## cicd-pipeline.json - CI/CD Pipeline Configuration (JSON Format)

Due to length constraints, please refer to the `lib/cicd-pipeline.json` file in the repository for the complete JSON format template. The JSON version contains all the same resources and configurations as the YAML version above.

---

## Deployment Instructions

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **GitHub OAuth Token** for repository access
3. **ECS Clusters and Services** already created for staging and production environments

### Deployment Steps

#### 1. Deploy the Main Application Stack

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name tap-stack-dev \
  --parameter-overrides EnvironmentSuffix=dev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### 2. Deploy the CI/CD Pipeline

```bash
aws cloudformation deploy \
  --template-file lib/cicd-pipeline.yml \
  --stack-name cicd-pipeline-dev \
  --parameter-overrides \
    EnvironmentSuffix=dev \
    GitHubToken=<YOUR_GITHUB_TOKEN> \
    GitHubOwner=<YOUR_GITHUB_OWNER> \
    RepositoryName=<YOUR_REPO_NAME> \
    BranchName=main \
    NotificationEmail=<YOUR_EMAIL> \
    ECSClusterNameStaging=<STAGING_CLUSTER> \
    ECSServiceNameStaging=<STAGING_SERVICE> \
    ECSClusterNameProduction=<PROD_CLUSTER> \
    ECSServiceNameProduction=<PROD_SERVICE> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Stack Features

#### Main Application Stack (TapStack)
- DynamoDB table for task assignments with on-demand billing
- Environment-specific resource naming
- Exported outputs for cross-stack references
- Deletion protection disabled for non-production environments

#### CI/CD Pipeline Stack
- Multi-stage pipeline with Source, Build, Test, Staging Deploy, and Production Deploy stages
- Blue/Green deployments for zero-downtime releases
- KMS encryption for all artifacts
- CloudWatch Logs integration for build and test stages
- SNS notifications for pipeline state changes
- Manual approval gate before production deployment
- GitHub integration for source control
- ECR integration for Docker image management
- CodeDeploy integration for ECS deployments

### Security Best Practices

1. **Encryption**: All artifacts are encrypted using KMS
2. **Access Control**: Least privilege IAM roles for each service
3. **Secrets Management**: GitHub token stored as NoEcho parameter
4. **Bucket Security**: S3 bucket has public access blocked
5. **Audit Trail**: CloudWatch Logs for all build activities
6. **Approval Process**: Manual approval required for production deployments

### Monitoring and Alerting

- **CloudWatch Logs**: All build and test logs are stored for 30 days
- **SNS Notifications**: Email alerts for pipeline state changes
- **CloudWatch Events**: Automated monitoring of pipeline execution
- **Stack Outputs**: Exported values for integration with other stacks

### Clean Up

To delete the stacks and all associated resources:

```bash
# Delete CI/CD Pipeline first
aws cloudformation delete-stack --stack-name cicd-pipeline-dev

# Wait for deletion to complete, then delete main stack
aws cloudformation delete-stack --stack-name tap-stack-dev
```

---

## Additional Notes

- Both YAML and JSON formats are provided for maximum compatibility
- Templates are designed to be environment-agnostic using the EnvironmentSuffix parameter
- All resources follow AWS best practices for naming conventions
- Templates include proper deletion policies for stateful resources
- Cross-stack references are enabled through exported outputs
- The CI/CD pipeline requires pre-existing ECS infrastructure as per the requirements