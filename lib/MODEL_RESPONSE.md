```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-region CI/CD pipeline with StackSets deployment and automated rollback for NovaModelBreaking project'

Parameters:
  GitHubRepo:
    Type: String
    Description: 'GitHub repository in format owner/repo-name'
    Default: 'myuser/myrepo'
  
  GitHubBranch:
    Type: String
    Description: 'GitHub branch to monitor for changes'
    Default: 'main'
  
  GitHubOAuthToken:
    Type: String
    Description: 'GitHub Personal Access Token for repository access'
    NoEcho: true
  
  ApplicationStackName:
    Type: String
    Description: 'Name for the application stack deployed via StackSet'
    Default: 'nova-model-breaking-app'
  
  ArtifactStoreBucketName:
    Type: String
    Description: 'S3 bucket name for storing pipeline artifacts'
    Default: 'nova-model-breaking-artifacts'

Resources:
  # S3 Bucket for storing pipeline artifacts
  ArtifactStore:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref ArtifactStoreBucketName
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
      Tags:
        - Key: Project
          Value: NovaModelBreaking
        - Key: Purpose
          Value: PipelineArtifacts

  # CloudWatch Alarm for application stack rollback trigger
  ApplicationRollbackAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationStackName}-rollback-trigger'
      AlarmDescription: 'Triggers rollback of application stack on high error rate'
      MetricName: 'ErrorRate'
      Namespace: 'AWS/ApplicationELB'
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # IAM Role for CodePipeline service
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaModelBreaking-CodePipeline-ServiceRole-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelineServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 permissions for artifact storage
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${ArtifactStore}/*'
                  - !GetAtt ArtifactStore.Arn
              # CodeBuild permissions
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn
              # CloudFormation StackSet permissions
              - Effect: Allow
                Action:
                  - cloudformation:CreateStackSet
                  - cloudformation:UpdateStackSet
                  - cloudformation:DeleteStackSet
                  - cloudformation:DescribeStackSet
                  - cloudformation:DescribeStackSetOperation
                  - cloudformation:CreateStackInstances
                  - cloudformation:UpdateStackInstances
                  - cloudformation:DeleteStackInstances
                  - cloudformation:DescribeStackInstance
                  - cloudformation:ListStackInstances
                Resource: '*'
              # STS permissions for assuming StackSet roles
              - Effect: Allow
                Action:
                  - sts:AssumeRole
                Resource:
                  - !GetAtt StackSetAdministrationRole.Arn
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # IAM Role for CodeBuild service
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaModelBreaking-CodeBuild-ServiceRole-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              # S3 permissions for artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource: !Sub '${ArtifactStore}/*'
              # CloudFormation validation permissions
              - Effect: Allow
                Action:
                  - cloudformation:ValidateTemplate
                Resource: '*'
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # IAM Role for StackSet Administration (used by CodePipeline)
  StackSetAdministrationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaModelBreaking-StackSet-Administration-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action: sts:AssumeRole
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
      Policies:
        - PolicyName: StackSetAdministrationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # StackSet management permissions
              - Effect: Allow
                Action:
                  - sts:AssumeRole
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:role/NovaModelBreaking-StackSet-Execution-*'
              # CloudFormation permissions for StackSet operations
              - Effect: Allow
                Action:
                  - cloudformation:*
                Resource: '*'
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # IAM Role for StackSet Execution (used in target regions)
  StackSetExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaModelBreaking-StackSet-Execution-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !GetAtt StackSetAdministrationRole.Arn
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Broad permissions for application resource creation
        # In production, this should be more restrictive based on actual application needs
        - arn:aws:iam::aws:policy/PowerUserAccess
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # CodeBuild Project for building and testing application
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub 'NovaModelBreaking-Build-${AWS::Region}'
      Description: 'Build project for NovaModelBreaking application'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:4.0
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: APPLICATION_STACK_NAME
            Value: !Ref ApplicationStackName
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - echo Build started on `date`
            build:
              commands:
                - echo Build phase started on `date`
                - echo Validating application template...
                - aws cloudformation validate-template --template-body file://application-template.yml
                - echo Build completed on `date`
            post_build:
              commands:
                - echo Build completed on `date`
          artifacts:
            files:
              - '**/*'
      TimeoutInMinutes: 15
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # Main CI/CD Pipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub 'NovaModelBreaking-Pipeline-${AWS::Region}'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      # Pipeline-level rollback configuration
      PipelineType: V2
      ExecutionMode: QUEUED
      # Artifact store configuration
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactStore
      Stages:
        # Source Stage - GitHub integration
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: '1'
              Configuration:
                Owner: !Select [0, !Split ['/', !Ref GitHubRepo]]
                Repo: !Select [1, !Split ['/', !Ref GitHubRepo]]
                Branch: !Ref GitHubBranch
                OAuthToken: !Ref GitHubOAuthToken
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: Lambda
                  Version: '1'
        
        # Build Stage - CodeBuild compilation and testing
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
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: Lambda
                  Version: '1'
        
        # Deploy Stage - Multi-region deployment using StackSets
        - Name: Deploy
          Actions:
            - Name: CreateUpdateStackSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormationStackSet
                Version: '1'
              Configuration:
                # StackSet configuration
                StackSetName: !Sub '${ApplicationStackName}-stackset'
                TemplatePath: 'BuildOutput::application-template.yml'
                # Use SELF_MANAGED permissions model
                PermissionModel: SELF_MANAGED
                # Administration role for StackSet management
                AdministrationRoleArn: !GetAtt StackSetAdministrationRole.Arn
                # Execution role name (without ARN as it will be assumed in target regions)
                ExecutionRoleName: !Ref StackSetExecutionRole
                # Deployment targets - explicit regions
                DeploymentTargets: !Sub '${AWS::AccountId}'
                Regions: 'us-east-1,us-west-2'
                # Failure tolerance and concurrency settings for strict deployment
                FailureToleranceCount: '0'
                MaxConcurrentCount: '1'
                # Parameter overrides for rollback configuration
                ParameterOverrides: !Sub |
                  [
                    {
                      "ParameterKey": "RollbackConfiguration",
                      "ParameterValue": "{\"RollbackTriggers\":[{\"Arn\":\"${ApplicationRollbackAlarm}\",\"Type\":\"AWS::CloudWatch::Alarm\"}],\"MonitoringTimeInMinutes\":10}"
                    }
                  ]
                # Capabilities for IAM resource creation
                Capabilities: 'CAPABILITY_IAM,CAPABILITY_NAMED_IAM'
              InputArtifacts:
                - Name: BuildOutput
              # Region specification for StackSet operation
              Region: !Ref AWS::Region
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: Lambda
                  Version: '1'
      Tags:
        - Key: Project
          Value: NovaModelBreaking

  # CloudWatch Event Rule for GitHub webhook (optional - for automatic triggering)
  GitHubWebhookEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'NovaModelBreaking-GitHub-Webhook-${AWS::Region}'
      Description: 'Triggers pipeline on GitHub push events'
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          state:
            - STARTED
      State: ENABLED
      Targets:
        - Arn: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${Pipeline}'
          Id: GitHubWebhookTarget
          RoleArn: !GetAtt CodePipelineServiceRole.Arn

Outputs:
  PipelineName:
    Description: 'Name of the created CodePipeline'
    Value: !Ref Pipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'
  
  PipelineArn:
    Description: 'ARN of the created CodePipeline'
    Value: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${Pipeline}'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineArn'
  
  ArtifactStoreBucket:
    Description: 'S3 bucket used for pipeline artifacts'
    Value: !Ref ArtifactStore
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactStore'
  
  StackSetAdministrationRoleArn:
    Description: 'ARN of the StackSet Administration Role'
    Value: !GetAtt StackSetAdministrationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StackSetAdminRole'
  
  StackSetExecutionRoleName:
    Description: 'Name of the StackSet Execution Role'
    Value: !Ref StackSetExecutionRole
    Export:
      Name: !Sub '${AWS::StackName}-StackSetExecRole'
  
  RollbackAlarmArn:
    Description: 'ARN of the CloudWatch Alarm used for application rollback'
    Value: !Ref ApplicationRollbackAlarm
    Export:
      Name: !Sub '${AWS::StackName}-RollbackAlarm'
```