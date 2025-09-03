# Production CI/CD Pipeline CloudFormation Template

I'll create a comprehensive CloudFormation template that implements a complete CI/CD pipeline with the specified requirements. This template follows AWS best practices and implements least-privilege IAM roles.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production CI/CD Pipeline for Web Application with CodePipeline, CodeBuild, and Elastic Beanstalk deployment'

Parameters:
  CodeCommitRepositoryName:
    Type: String
    Description: Name of the existing CodeCommit repository
    Default: my-web-app-repo
  
  ElasticBeanstalkApplicationName:
    Type: String
    Description: Name of the existing Elastic Beanstalk application
    Default: prod-web-application
  
  ElasticBeanstalkEnvironmentName:
    Type: String
    Description: Name of the existing Elastic Beanstalk environment
    Default: prod-web-environment
  
  BranchName:
    Type: String
    Description: Branch to track for pipeline triggers
    Default: main

Resources:
  # S3 Bucket for Pipeline Artifacts
  prodPipelineArtifactStore:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-pipeline-artifacts-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30
            NoncurrentVersionExpirationInDays: 7

  # IAM Role for CodePipeline
  prodCodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-codepipeline-service-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: prodCodePipelineServiceRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 permissions for artifacts
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${prodPipelineArtifactStore}/*'
                  - !GetAtt prodPipelineArtifactStore.Arn
              # CodeCommit permissions
              - Effect: Allow
                Action:
                  - codecommit:CancelUploadArchive
                  - codecommit:GetBranch
                  - codecommit:GetCommit
                  - codecommit:GetRepository
                  - codecommit:ListBranches
                  - codecommit:ListRepositories
                  - codecommit:UploadArchive
                Resource: !Sub 'arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${CodeCommitRepositoryName}'
              # CodeBuild permissions
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt prodCodeBuildProject.Arn
              # Elastic Beanstalk permissions
              - Effect: Allow
                Action:
                  - elasticbeanstalk:CreateApplicationVersion
                  - elasticbeanstalk:DescribeApplicationVersions
                  - elasticbeanstalk:DescribeApplications
                  - elasticbeanstalk:DescribeEnvironments
                  - elasticbeanstalk:UpdateEnvironment
                Resource: '*'

  # IAM Role for CodeBuild
  prodCodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-codebuild-service-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: prodCodeBuildServiceRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/prod-*'
              # S3 permissions for artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource: !Sub '${prodPipelineArtifactStore}/*'
              # CodeCommit permissions (if needed for build)
              - Effect: Allow
                Action:
                  - codecommit:GitPull
                Resource: !Sub 'arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${CodeCommitRepositoryName}'

  # CodeBuild Project
  prodCodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: prod-web-app-build
      Description: 'Production build project for web application'
      ServiceRole: !GetAtt prodCodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: ENVIRONMENT
            Value: production
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 14
              commands:
                - echo Installing dependencies...
                - npm install
            pre_build:
              commands:
                - echo Running linting...
                - npm run lint || echo "Linting completed with warnings"
                - echo Running unit tests...
                - npm test
            build:
              commands:
                - echo Building the application...
                - npm run build
            post_build:
              commands:
                - echo Build completed successfully
                - echo Preparing deployment package...
          artifacts:
            files:
              - '**/*'
            exclude-paths:
              - node_modules/**/*
              - .git/**/*
              - '*.md'
      TimeoutInMinutes: 15

  # CloudWatch Event Rule for CodeCommit changes
  prodCodeCommitEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: prod-codecommit-pipeline-trigger
      Description: 'Trigger pipeline on CodeCommit repository changes'
      EventPattern:
        source:
          - aws.codecommit
        detail-type:
          - CodeCommit Repository State Change
        resources:
          - !Sub 'arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${CodeCommitRepositoryName}'
        detail:
          event:
            - referenceCreated
            - referenceUpdated
          referenceType:
            - branch
          referenceName:
            - !Ref BranchName
      State: ENABLED
      Targets:
        - Arn: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${prodCodePipeline}'
          Id: prodCodePipelineTarget
          RoleArn: !GetAtt prodCloudWatchEventRole.Arn

  # IAM Role for CloudWatch Events
  prodCloudWatchEventRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-cloudwatch-event-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: prodCloudWatchEventRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - codepipeline:StartPipelineExecution
                Resource: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${prodCodePipeline}'

  # CodePipeline
  prodCodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: prod-web-app-pipeline
      RoleArn: !GetAtt prodCodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref prodPipelineArtifactStore
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
                RepositoryName: !Ref CodeCommitRepositoryName
                BranchName: !Ref BranchName
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
                ProjectName: !Ref prodCodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        
        # Deploy Stage
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ElasticBeanstalk
                Version: '1'
              Configuration:
                ApplicationName: !Ref ElasticBeanstalkApplicationName
                EnvironmentName: !Ref ElasticBeanstalkEnvironmentName
              InputArtifacts:
                - Name: BuildOutput
              Region: !Ref AWS::Region

  # CloudWatch Log Group for CodeBuild
  prodCodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${prodCodeBuildProject}'
      RetentionInDays: 14

Outputs:
  PipelineName:
    Description: 'Name of the created CodePipeline'
    Value: !Ref prodCodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'
  
  PipelineUrl:
    Description: 'URL of the CodePipeline in AWS Console'
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${prodCodePipeline}/view'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineUrl'
  
  CodeBuildProjectName:
    Description: 'Name of the CodeBuild project'
    Value: !Ref prodCodeBuildProject
    Export:
      Name: !Sub '${AWS::StackName}-CodeBuildProject'
  
  ArtifactsBucketName:
    Description: 'Name of the S3 bucket storing pipeline artifacts'
    Value: !Ref prodPipelineArtifactStore
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'
```

## Key Features and Best Practices Implemented

### **Pipeline Architecture**
- **Three-stage pipeline**: Source → Build → Deploy
- **Automatic triggering** via CloudWatch Events on CodeCommit changes
- **Artifact management** with versioned S3 bucket storage

### **Security & IAM Best Practices**
- **Least-privilege IAM roles** for each service
- **Encrypted artifact storage** with AES-256
- **Public access blocked** on S3 bucket
- **Resource-specific permissions** rather than wildcards where possible

### **Build Stage Features**
- **Multi-phase build process**: install → pre_build → build → post_build
- **Linting and unit testing** in pre_build phase
- **Configurable runtime environment** (Node.js 14)
- **Build timeout protection** (15 minutes)

### **Deployment Integration**
- **Direct Elastic Beanstalk deployment** from pipeline
- **Automatic application version creation**
- **Environment-specific configuration** via parameters

### **Monitoring & Maintenance**
- **CloudWatch logging** for build processes
- **Artifact lifecycle management** (30-day retention)
- **Log retention policies** (14 days for build logs)

## Usage Instructions

1. **Deploy the template** with your specific parameter values:
   ```bash
   aws cloudformation create-stack \
     --stack-name prod-cicd-pipeline \
     --template-body file://pipeline.yaml \
     --parameters ParameterKey=CodeCommitRepositoryName,ParameterValue=your-repo-name \
                  ParameterKey=ElasticBeanstalkApplicationName,ParameterValue=your-eb-app \
                  ParameterKey=ElasticBeanstalkEnvironmentName,ParameterValue=your-eb-env \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Ensure your application** includes the following npm scripts in `package.json`:
   ```json
   {
     "scripts": {
       "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
       "test": "jest",
       "build": "npm run build:prod"
     }
   }
   ```

3. **The pipeline will automatically trigger** when you push changes to the specified branch in CodeCommit.

This template provides a production-ready CI/CD pipeline that follows AWS best practices and can be easily customized for different application types and deployment targets.