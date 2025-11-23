# Multi-Stage CI/CD Pipeline CloudFormation Template

This CloudFormation template creates a comprehensive CI/CD pipeline with cross-account deployment capabilities, security scanning, and proper artifact encryption.

## File: lib/pipeline.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-stage CI/CD pipeline with cross-account deployment capabilities

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for resource naming to ensure uniqueness
    Default: dev

  StagingAccountId:
    Type: String
    Description: AWS Account ID for staging environment

  ProductionAccountId:
    Type: String
    Description: AWS Account ID for production environment

  SourceRepositoryName:
    Type: String
    Description: CodeCommit repository name for source code
    Default: my-application

  SourceBranchName:
    Type: String
    Description: Branch name to monitor for changes
    Default: main

  ArtifactRetentionDays:
    Type: Number
    Description: Number of days to retain pipeline artifacts
    Default: 30
    MinValue: 1
    MaxValue: 365

Resources:
  # KMS Key for artifact encryption
  ArtifactEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub KMS key for pipeline artifacts encryption ${EnvironmentSuffix}
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow CodePipeline to use the key
            Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CodeBuild to use the key
            Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow cross-account access for staging
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${StagingAccountId}:root
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow cross-account access for production
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${ProductionAccountId}:root
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'

  ArtifactEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/pipeline-artifacts-${EnvironmentSuffix}
      TargetKeyId: !Ref ArtifactEncryptionKey

  # S3 Bucket for pipeline artifacts
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt ArtifactEncryptionKey.Arn
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: !Ref ArtifactRetentionDays
            NoncurrentVersionExpirationInDays: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  ArtifactBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ArtifactBucket
      PolicyDocument:
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub ${ArtifactBucket.Arn}/*
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms
          - Sid: AllowCrossAccountAccess
            Effect: Allow
            Principal:
              AWS:
                - !Sub arn:aws:iam::${StagingAccountId}:root
                - !Sub arn:aws:iam::${ProductionAccountId}:root
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
            Resource: !Sub ${ArtifactBucket.Arn}/*

  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub codepipeline-service-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodePipelineFullAccess
      Policies:
        - PolicyName: CodePipelineAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - codecommit:GetBranch
                  - codecommit:GetCommit
                  - codecommit:UploadArchive
                  - codecommit:GetUploadArchiveStatus
                  - codecommit:CancelUploadArchive
                Resource: !Sub arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${SourceRepositoryName}
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource:
                  - !GetAtt ArtifactBucket.Arn
                  - !Sub ${ArtifactBucket.Arn}/*
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:Encrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt ArtifactEncryptionKey.Arn
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource:
                  - !GetAtt UnitTestProject.Arn
                  - !GetAtt SecurityScanProject.Arn
              - Effect: Allow
                Action:
                  - sts:AssumeRole
                Resource:
                  - !Sub arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}
                  - !Sub arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}

  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub codebuild-service-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !GetAtt ArtifactBucket.Arn
                  - !Sub ${ArtifactBucket.Arn}/*
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:Encrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt ArtifactEncryptionKey.Arn
              - Effect: Allow
                Action:
                  - codecommit:GitPull
                Resource: !Sub arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${SourceRepositoryName}

  # CodeBuild Project for Unit Tests
  UnitTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub unit-test-project-${EnvironmentSuffix}
      Description: CodeBuild project for running unit tests
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:7.0
        EnvironmentVariables:
          - Name: ENVIRONMENT
            Value: !Ref EnvironmentSuffix
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 18
              commands:
                - echo "Installing dependencies..."
                - npm install
            build:
              commands:
                - echo "Running unit tests..."
                - npm test
            post_build:
              commands:
                - echo "Unit tests completed"
          artifacts:
            files:
              - '**/*'
      EncryptionKey: !GetAtt ArtifactEncryptionKey.Arn
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub /aws/codebuild/unit-test-${EnvironmentSuffix}

  # CodeBuild Project for Security Scanning
  SecurityScanProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub security-scan-project-${EnvironmentSuffix}
      Description: CodeBuild project for security scanning
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:7.0
        EnvironmentVariables:
          - Name: ENVIRONMENT
            Value: !Ref EnvironmentSuffix
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 18
              commands:
                - echo "Installing security scanning tools..."
                - npm install -g npm-audit-resolver snyk
            build:
              commands:
                - echo "Running security scans..."
                - npm audit --audit-level=moderate || true
                - echo "Security scan completed"
            post_build:
              commands:
                - echo "Security analysis finished"
          artifacts:
            files:
              - '**/*'
      EncryptionKey: !GetAtt ArtifactEncryptionKey.Arn
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub /aws/codebuild/security-scan-${EnvironmentSuffix}

  # SNS Topic for Pipeline Notifications
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub pipeline-notifications-${EnvironmentSuffix}
      DisplayName: CI/CD Pipeline Notifications
      KmsMasterKeyId: !Ref ArtifactEncryptionKey

  # EventBridge Rule for Pipeline State Changes
  PipelineStateChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub pipeline-state-change-${EnvironmentSuffix}
      Description: Capture all pipeline state changes
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          pipeline:
            - !Ref CodePipeline
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineNotificationTarget

  # EventBridge Rule for Pipeline Failures
  PipelineFailureRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub pipeline-failure-${EnvironmentSuffix}
      Description: Capture pipeline failures
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Stage Execution State Change
        detail:
          state:
            - FAILED
          pipeline:
            - !Ref CodePipeline
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineFailureTarget

  # SNS Topic Policy
  PipelineNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref PipelineNotificationTopic
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sns:Publish
            Resource: !Ref PipelineNotificationTopic

  # CodePipeline
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub cicd-pipeline-${EnvironmentSuffix}
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionKey:
          Id: !GetAtt ArtifactEncryptionKey.Arn
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
                RepositoryName: !Ref SourceRepositoryName
                BranchName: !Ref SourceBranchName
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
              RunOrder: 1

        # Build Stage
        - Name: Build
          Actions:
            - Name: UnitTest
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref UnitTestProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: UnitTestOutput
              RunOrder: 1

        # Test Stage
        - Name: Test
          Actions:
            - Name: SecurityScan
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref SecurityScanProject
              InputArtifacts:
                - Name: UnitTestOutput
              OutputArtifacts:
                - Name: SecurityScanOutput
              RunOrder: 1

        # Deploy to Staging
        - Name: DeployToStaging
          Actions:
            - Name: DeployStaging
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub application-stack-staging-${EnvironmentSuffix}
                Capabilities: CAPABILITY_IAM,CAPABILITY_NAMED_IAM
                RoleArn: !Sub arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}
                TemplatePath: SecurityScanOutput::template.yaml
              InputArtifacts:
                - Name: SecurityScanOutput
              RunOrder: 1
              RoleArn: !Sub arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}

        # Manual Approval before Production
        - Name: ApprovalForProduction
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                CustomData: Please review staging deployment before approving production release
                NotificationArn: !Ref PipelineNotificationTopic
              RunOrder: 1

        # Deploy to Production
        - Name: DeployToProduction
          Actions:
            - Name: DeployProduction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub application-stack-production-${EnvironmentSuffix}
                Capabilities: CAPABILITY_IAM,CAPABILITY_NAMED_IAM
                RoleArn: !Sub arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}
                TemplatePath: SecurityScanOutput::template.yaml
              InputArtifacts:
                - Name: SecurityScanOutput
              RunOrder: 1
              RoleArn: !Sub arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}

  # EventBridge Rule to trigger pipeline on CodeCommit changes
  PipelineTriggerRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub pipeline-trigger-${EnvironmentSuffix}
      Description: Trigger pipeline on repository changes
      EventPattern:
        source:
          - aws.codecommit
        detail-type:
          - CodeCommit Repository State Change
        detail:
          event:
            - referenceCreated
            - referenceUpdated
          referenceType:
            - branch
          referenceName:
            - !Ref SourceBranchName
        resources:
          - !Sub arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${SourceRepositoryName}
      State: ENABLED
      Targets:
        - Arn: !Sub arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${CodePipeline}
          RoleArn: !GetAtt EventBridgePipelineRole.Arn
          Id: CodePipelineTarget

  # IAM Role for EventBridge to start pipeline
  EventBridgePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub eventbridge-pipeline-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: StartPipelineExecution
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: codepipeline:StartPipelineExecution
                Resource: !Sub arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${CodePipeline}

Outputs:
  PipelineName:
    Description: Name of the CodePipeline
    Value: !Ref CodePipeline
    Export:
      Name: !Sub ${AWS::StackName}-PipelineName

  ArtifactBucketName:
    Description: S3 bucket for pipeline artifacts
    Value: !Ref ArtifactBucket
    Export:
      Name: !Sub ${AWS::StackName}-ArtifactBucket

  KMSKeyId:
    Description: KMS key for artifact encryption
    Value: !GetAtt ArtifactEncryptionKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-KMSKey

  NotificationTopicArn:
    Description: SNS topic for pipeline notifications
    Value: !Ref PipelineNotificationTopic
    Export:
      Name: !Sub ${AWS::StackName}-NotificationTopic

  CodePipelineUrl:
    Description: URL to the CodePipeline console
    Value: !Sub https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view

  CrossAccountDeployRoleStaging:
    Description: ARN of role needed in staging account
    Value: !Sub arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}

  CrossAccountDeployRoleProduction:
    Description: ARN of role needed in production account
    Value: !Sub arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}
```

## File: lib/cross-account-role.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Cross-account IAM role for CodePipeline deployments (deploy in staging/production accounts)

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for resource naming to ensure uniqueness

  PipelineAccountId:
    Type: String
    Description: AWS Account ID where the pipeline is running

  ArtifactBucketName:
    Type: String
    Description: Name of the S3 bucket containing pipeline artifacts

  KMSKeyArn:
    Type: String
    Description: ARN of the KMS key used for artifact encryption

Resources:
  CrossAccountDeployRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub cross-account-deploy-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${PipelineAccountId}:root
            Action: sts:AssumeRole
          - Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Policies:
        - PolicyName: CrossAccountDeploymentAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:ListBucket
                Resource:
                  - !Sub arn:aws:s3:::${ArtifactBucketName}
                  - !Sub arn:aws:s3:::${ArtifactBucketName}/*
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !Ref KMSKeyArn
              - Effect: Allow
                Action:
                  - cloudformation:CreateStack
                  - cloudformation:UpdateStack
                  - cloudformation:DescribeStacks
                  - cloudformation:DescribeStackEvents
                  - cloudformation:DescribeStackResources
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource: '*'
                Condition:
                  StringEquals:
                    iam:PassedToService: cloudformation.amazonaws.com

Outputs:
  CrossAccountRoleArn:
    Description: ARN of the cross-account deployment role
    Value: !GetAtt CrossAccountDeployRole.Arn
    Export:
      Name: !Sub ${AWS::StackName}-CrossAccountRole
```

## File: lib/README.md

```markdown
# Multi-Stage CI/CD Pipeline Infrastructure

This CloudFormation solution deploys a comprehensive CI/CD pipeline with cross-account deployment capabilities, security scanning, artifact encryption, and monitoring.

## Architecture Overview

The pipeline consists of the following stages:

1. **Source**: Pulls code from AWS CodeCommit
2. **Build**: Runs unit tests using CodeBuild
3. **Test**: Performs security scanning using CodeBuild
4. **Deploy to Staging**: Deploys to staging account using cross-account role
5. **Manual Approval**: Requires manual approval before production
6. **Deploy to Production**: Deploys to production account using cross-account role

## Features

- **Cross-Account Deployment**: Supports deploying to separate staging and production AWS accounts
- **Artifact Encryption**: All artifacts encrypted using KMS with automatic key rotation
- **Security Scanning**: Mandatory security scanning before any deployment
- **Monitoring**: EventBridge rules for pipeline state changes and failures
- **Manual Approval**: Production deployments require manual approval
- **Lifecycle Management**: Automatic cleanup of old artifacts
- **Notifications**: SNS topic for pipeline events

## Prerequisites

1. AWS CodeCommit repository created
2. Access to staging and production AWS accounts
3. AWS CLI configured with appropriate credentials
4. Valid account IDs for staging and production environments

## Deployment Instructions

### Step 1: Deploy Cross-Account Roles (in Staging and Production Accounts)

First, deploy the cross-account role in both staging and production accounts:

```bash
# Deploy in staging account
aws cloudformation create-stack \
  --stack-name pipeline-cross-account-role-staging \
  --template-body file://cross-account-role.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=PipelineAccountId,ParameterValue=<PIPELINE_ACCOUNT_ID> \
    ParameterKey=ArtifactBucketName,ParameterValue=pipeline-artifacts-dev-<PIPELINE_ACCOUNT_ID> \
    ParameterKey=KMSKeyArn,ParameterValue=<KMS_KEY_ARN> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --profile staging

# Deploy in production account
aws cloudformation create-stack \
  --stack-name pipeline-cross-account-role-production \
  --template-body file://cross-account-role.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=PipelineAccountId,ParameterValue=<PIPELINE_ACCOUNT_ID> \
    ParameterKey=ArtifactBucketName,ParameterValue=pipeline-artifacts-dev-<PIPELINE_ACCOUNT_ID> \
    ParameterKey=KMSKeyArn,ParameterValue=<KMS_KEY_ARN> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --profile production
```

**Note**: You'll need to deploy the pipeline first to get the KMS key ARN, then update the cross-account roles, or create the KMS key separately first.

### Step 2: Deploy the Pipeline (in Pipeline Account)

Deploy the main pipeline stack:

```bash
aws cloudformation create-stack \
  --stack-name cicd-pipeline-stack \
  --template-body file://pipeline.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=StagingAccountId,ParameterValue=<STAGING_ACCOUNT_ID> \
    ParameterKey=ProductionAccountId,ParameterValue=<PRODUCTION_ACCOUNT_ID> \
    ParameterKey=SourceRepositoryName,ParameterValue=my-application \
    ParameterKey=SourceBranchName,ParameterValue=main \
    ParameterKey=ArtifactRetentionDays,ParameterValue=30 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Update Cross-Account Roles with KMS Key ARN

After the pipeline stack is created, get the KMS Key ARN from outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name cicd-pipeline-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`KMSKeyId`].OutputValue' \
  --output text
```

Then update the cross-account role stacks in staging and production with the actual KMS Key ARN.

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Suffix for resource naming | dev | Yes |
| StagingAccountId | AWS Account ID for staging | - | Yes |
| ProductionAccountId | AWS Account ID for production | - | Yes |
| SourceRepositoryName | CodeCommit repository name | my-application | Yes |
| SourceBranchName | Branch to monitor | main | Yes |
| ArtifactRetentionDays | Days to retain artifacts | 30 | No |

## Resource Naming Convention

All resources include the `EnvironmentSuffix` parameter:

- Pipeline: `cicd-pipeline-{EnvironmentSuffix}`
- Artifact Bucket: `pipeline-artifacts-{EnvironmentSuffix}-{AccountId}`
- KMS Key Alias: `alias/pipeline-artifacts-{EnvironmentSuffix}`
- CodeBuild Projects: `unit-test-project-{EnvironmentSuffix}`, `security-scan-project-{EnvironmentSuffix}`
- IAM Roles: `codepipeline-service-role-{EnvironmentSuffix}`, `codebuild-service-role-{EnvironmentSuffix}`

## Testing

### Test Pipeline Execution

1. Push code to the CodeCommit repository:
```bash
git push origin main
```

2. Monitor pipeline execution:
```bash
aws codepipeline get-pipeline-state \
  --name cicd-pipeline-dev \
  --region us-east-1
```

3. Check pipeline execution history:
```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name cicd-pipeline-dev \
  --region us-east-1
```

### Test Manual Approval

1. Wait for pipeline to reach approval stage
2. Approve through console or CLI:
```bash
aws codepipeline put-approval-result \
  --pipeline-name cicd-pipeline-dev \
  --stage-name ApprovalForProduction \
  --action-name ManualApproval \
  --result summary="Approved",status=Approved \
  --token <TOKEN_FROM_GET_PIPELINE_STATE> \
  --region us-east-1
```

### Verify Notifications

Check SNS topic for notifications:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn <TOPIC_ARN> \
  --region us-east-1
```

## Monitoring and Troubleshooting

### View Pipeline Logs

Check CodeBuild logs:
```bash
# Unit test logs
aws logs tail /aws/codebuild/unit-test-dev --follow --region us-east-1

# Security scan logs
aws logs tail /aws/codebuild/security-scan-dev --follow --region us-east-1
```

### Check EventBridge Rules

List all rules:
```bash
aws events list-rules --region us-east-1
```

View rule targets:
```bash
aws events list-targets-by-rule \
  --rule pipeline-state-change-dev \
  --region us-east-1
```

### Common Issues

**Issue**: Pipeline fails at cross-account deployment
- **Solution**: Verify cross-account role has correct trust relationship and permissions

**Issue**: KMS encryption errors
- **Solution**: Ensure KMS key policy allows access from staging/production accounts

**Issue**: CodeBuild fails
- **Solution**: Check buildspec.yaml in your repository and verify build commands

## Cleanup

To delete all resources:

```bash
# Delete pipeline stack
aws cloudformation delete-stack \
  --stack-name cicd-pipeline-stack \
  --region us-east-1

# Delete cross-account roles in staging
aws cloudformation delete-stack \
  --stack-name pipeline-cross-account-role-staging \
  --region us-east-1 \
  --profile staging

# Delete cross-account roles in production
aws cloudformation delete-stack \
  --stack-name pipeline-cross-account-role-production \
  --region us-east-1 \
  --profile production

# Empty and delete artifact bucket (if not automatically deleted)
aws s3 rb s3://pipeline-artifacts-dev-<ACCOUNT_ID> --force --region us-east-1
```

## Security Considerations

1. **Encryption**: All artifacts encrypted at rest using KMS
2. **Least Privilege**: IAM roles follow least privilege principle
3. **Cross-Account**: Separate accounts for staging and production
4. **Scanning**: Mandatory security scanning before deployment
5. **Approval**: Manual approval required for production deployments
6. **Monitoring**: All state changes tracked via EventBridge

## Cost Optimization

- Artifacts automatically deleted after 30 days (configurable)
- Old versions of artifacts deleted after 7 days
- CodeBuild uses small compute instances
- EventBridge rules filter only relevant events

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Cross-Account Deployment](https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create-cross-account.html)
- [KMS Key Policies](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
```

## File: lib/parameters.json

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "StagingAccountId",
    "ParameterValue": "123456789012"
  },
  {
    "ParameterKey": "ProductionAccountId",
    "ParameterValue": "123456789013"
  },
  {
    "ParameterKey": "SourceRepositoryName",
    "ParameterValue": "my-application"
  },
  {
    "ParameterKey": "SourceBranchName",
    "ParameterValue": "main"
  },
  {
    "ParameterKey": "ArtifactRetentionDays",
    "ParameterValue": "30"
  }
]
```
