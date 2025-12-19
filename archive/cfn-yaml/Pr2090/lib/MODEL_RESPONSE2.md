You're right! I accidentally provided two separate templates mixed together. Here's the complete, single CloudFormation template with all resources:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Account CI/CD Pipeline for Web App Deployment'

Parameters:
  GitHubOwner:
    Type: String
    Description: GitHub repository owner
    Default: your-github-org

  GitHubRepo:
    Type: String
    Description: GitHub repository name
    Default: your-web-app

  GitHubBranch:
    Type: String
    Description: GitHub branch to track
    Default: main

  StagingAccountId:
    Type: String
    Description: AWS Account ID for staging environment
    AllowedPattern: '[0-9]{12}'

  ProductionAccountId:
    Type: String
    Description: AWS Account ID for production environment
    AllowedPattern: '[0-9]{12}'

  SlackChannelId:
    Type: String
    Description: Slack channel ID for notifications
    Default: C1234567890

  SlackWorkspaceId:
    Type: String
    Description: Slack workspace ID
    Default: T1234567890

  ApprovalEmailList:
    Type: CommaDelimitedList
    Description: Email addresses for manual approval notifications
    Default: 'devops@company.com,lead@company.com'

Resources:
  # =====================================================
  # S3 BUCKET FOR PIPELINE ARTIFACTS
  # =====================================================
  PipelineArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-pipeline-artifacts-${AWS::AccountId}'
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

  # =====================================================
  # CODEPIPELINE SERVICE ROLE
  # =====================================================
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-CodePipeline-ServiceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodePipelineServiceRole
      Policies:
        - PolicyName: PipelineExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 permissions for artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:GetBucketVersioning
                Resource:
                  - !Sub '${PipelineArtifactsBucket}/*'
                  - !GetAtt PipelineArtifactsBucket.Arn
              # CodeBuild permissions
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource:
                  - !GetAtt BuildProject.Arn
                  - !GetAtt TestProject.Arn
              # CloudFormation permissions
              - Effect: Allow
                Action:
                  - cloudformation:CreateStack
                  - cloudformation:DeleteStack
                  - cloudformation:DescribeStacks
                  - cloudformation:UpdateStack
                  - cloudformation:CreateChangeSet
                  - cloudformation:DeleteChangeSet
                  - cloudformation:DescribeChangeSet
                  - cloudformation:ExecuteChangeSet
                  - cloudformation:SetStackPolicy
                  - cloudformation:ValidateTemplate
                Resource: '*'
              # Cross-account role assumption
              - Effect: Allow
                Action: sts:AssumeRole
                Resource:
                  - !Sub 'arn:aws:iam::${StagingAccountId}:role/CrossAccountDeploymentRole'
                  - !Sub 'arn:aws:iam::${ProductionAccountId}:role/CrossAccountDeploymentRole'
              # SNS for manual approval
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref ManualApprovalTopic

  # =====================================================
  # CODEBUILD ROLES AND PROJECTS
  # =====================================================
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-CodeBuild-ServiceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      Policies:
        - PolicyName: CodeBuildExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource: !Sub '${PipelineArtifactsBucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${AWS::StackName}-Build'
      Description: 'Build stage for web application'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws --version
                - echo Build started on `date`
            build:
              commands:
                - echo Build phase started on `date`
                - # Add your build commands here
                - npm install
                - npm run build
            post_build:
              commands:
                - echo Build completed on `date`
          artifacts:
            files:
              - '**/*'

  TestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${AWS::StackName}-Test'
      Description: 'Test stage for web application'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Test phase started on `date`
            build:
              commands:
                - echo Running tests...
                - npm test
                - npm run test:integration
            post_build:
              commands:
                - echo Tests completed on `date`

  # =====================================================
  # SNS TOPIC FOR MANUAL APPROVAL
  # =====================================================
  ManualApprovalTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-ManualApproval'
      DisplayName: 'Pipeline Manual Approval Required'

  ManualApprovalSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref ManualApprovalTopic
      Endpoint: !Select [0, !Ref ApprovalEmailList]

  # =====================================================
  # CHATBOT FOR SLACK NOTIFICATIONS
  # =====================================================
  SlackNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-SlackNotifications'
      DisplayName: 'Pipeline Notifications'

  ChatbotRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-Chatbot-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: chatbot.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess

  SlackChatbot:
    Type: AWS::Chatbot::SlackChannelConfiguration
    Properties:
      ConfigurationName: !Sub '${AWS::StackName}-slack-notifications'
      SlackChannelId: !Ref SlackChannelId
      SlackWorkspaceId: !Ref SlackWorkspaceId
      IamRoleArn: !GetAtt ChatbotRole.Arn
      SnsTopicArns:
        - !Ref SlackNotificationTopic
      LoggingLevel: ERROR

  # =====================================================
  # EVENTBRIDGE RULE FOR PIPELINE STATE CHANGES
  # =====================================================
  PipelineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-pipeline-events'
      Description: 'Capture pipeline state changes'
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
          - CodePipeline Stage Execution State Change
        detail:
          pipeline:
            - !Ref CodePipeline
          state:
            - FAILED
            - SUCCEEDED
      State: ENABLED
      Targets:
        - Arn: !Ref SlackNotificationTopic
          Id: SlackNotificationTarget

  # =====================================================
  # GITHUB WEBHOOK SECRET
  # =====================================================
  GitHubWebhookSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-github-webhook-secret'
      Description: 'Secret for GitHub webhook authentication'
      GenerateSecretString:
        SecretStringTemplate: '{}'
        GenerateStringKey: 'token'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # =====================================================
  # THE MAIN CODEPIPELINE
  # =====================================================
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${AWS::StackName}-Pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref PipelineArtifactsBucket
      Stages:
        # SOURCE STAGE
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
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput

        # BUILD STAGE
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

        # TEST STAGE
        - Name: Test
          Actions:
            - Name: TestAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: BuildOutput
              OutputArtifacts:
                - Name: TestOutput

        # STAGING DEPLOYMENT
        - Name: DeployStaging
          Actions:
            - Name: CreateStagingChangeSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CHANGE_SET_REPLACE
                StackName: Staging-WebApp-Stack
                ChangeSetName: Staging-WebApp-ChangeSet
                TemplatePath: TestOutput::infrastructure/app-template.yaml
                Capabilities: CAPABILITY_IAM,CAPABILITY_NAMED_IAM
                RoleArn: !Sub 'arn:aws:iam::${StagingAccountId}:role/CrossAccountDeploymentRole'
                ParameterOverrides: |
                  {
                    "Environment": "staging",
                    "ResourcePrefix": "Staging-"
                  }
              InputArtifacts:
                - Name: TestOutput
              Region: us-east-1
              RunOrder: 1
            - Name: ExecuteStagingChangeSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CHANGE_SET_EXECUTE
                StackName: Staging-WebApp-Stack
                ChangeSetName: Staging-WebApp-ChangeSet
                RoleArn: !Sub 'arn:aws:iam::${StagingAccountId}:role/CrossAccountDeploymentRole'
              Region: us-east-1
              RunOrder: 2

        # MANUAL APPROVAL
        - Name: ManualApproval
          Actions:
            - Name: ApprovalAction
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref ManualApprovalTopic
                CustomData: 'Please review the staging deployment and approve for production release.'

        # PRODUCTION DEPLOYMENT
        - Name: DeployProduction
          Actions:
            - Name: CreateProductionChangeSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CHANGE_SET_REPLACE
                StackName: Prod-WebApp-Stack
                ChangeSetName: Prod-WebApp-ChangeSet
                TemplatePath: TestOutput::infrastructure/app-template.yaml
                Capabilities: CAPABILITY_IAM,CAPABILITY_NAMED_IAM
                RoleArn: !Sub 'arn:aws:iam::${ProductionAccountId}:role/CrossAccountDeploymentRole'
                ParameterOverrides: |
                  {
                    "Environment": "production",
                    "ResourcePrefix": "Prod-"
                  }
              InputArtifacts:
                - Name: TestOutput
              Region: us-east-1
              RunOrder: 1
            - Name: ExecuteProductionChangeSet
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: '1'
              Configuration:
                ActionMode: CHANGE_SET_EXECUTE
                StackName: Prod-WebApp-Stack
                ChangeSetName: Prod-WebApp-ChangeSet
                RoleArn: !Sub 'arn:aws:iam::${ProductionAccountId}:role/CrossAccountDeploymentRole'
              Region: us-east-1
              RunOrder: 2

  # =====================================================
  # GITHUB WEBHOOK
  # =====================================================
  GitHubWebhook:
    Type: AWS::CodePipeline::Webhook
    Properties:
      Name: !Sub '${AWS::StackName}-github-webhook'
      Authentication: GITHUB_HMAC
      AuthenticationConfiguration:
        SecretToken: !Ref GitHubWebhookSecret
      Filters:
        - JsonPath: $.ref
          MatchEquals: !Sub 'refs/heads/${GitHubBranch}'
      TargetPipeline: !Ref CodePipeline
      TargetAction: SourceAction
      TargetPipelineVersion: !GetAtt CodePipeline.Version
      RegisterWithThirdParty: true

Outputs:
  PipelineName:
    Description: 'Name of the created CodePipeline'
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  PipelineUrl:
    Description: 'URL of the CodePipeline in AWS Console'
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view'

  ArtifactsBucket:
    Description: 'S3 bucket for pipeline artifacts'
    Value: !Ref PipelineArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'

  CrossAccountRoleArn:
    Description: 'ARN pattern for cross-account roles that need to be created'
    Value: !Sub 'arn:aws:iam::{ACCOUNT_ID}:role/CrossAccountDeploymentRole'

  GitHubWebhookUrl:
    Description: 'GitHub webhook URL for repository configuration'
    Value: !GetAtt GitHubWebhook.Url

  ManualApprovalTopicArn:
    Description: 'SNS Topic ARN for manual approval notifications'
    Value: !Ref ManualApprovalTopic

  SlackNotificationTopicArn:
    Description: 'SNS Topic ARN for Slack notifications'
    Value: !Ref SlackNotificationTopic
```

## Separate Cross-Account Role Template

You'll also need to deploy this template in your **staging** and **production** accounts:

```yaml
# cross-account-role.yaml - Deploy this in staging and production accounts
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Cross-account deployment role for CI/CD pipeline'

Parameters:
  PipelineAccountId:
    Type: String
    Description: AWS Account ID where the pipeline runs
    AllowedPattern: '[0-9]{12}'

Resources:
  CrossAccountDeploymentRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: CrossAccountDeploymentRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${PipelineAccountId}:root'
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Policies:
        - PolicyName: CloudFormationDeploymentPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:CreateRole
                  - iam:DeleteRole
                  - iam:GetRole
                  - iam:PassRole
                  - iam:AttachRolePolicy
                  - iam:DetachRolePolicy
                  - iam:PutRolePolicy
                  - iam:DeleteRolePolicy
                  - iam:GetRolePolicy
                  - iam:CreateInstanceProfile
                  - iam:DeleteInstanceProfile
                  - iam:AddRoleToInstanceProfile
                  - iam:RemoveRoleFromInstanceProfile
                Resource: '*'

Outputs:
  CrossAccountRoleArn:
    Description: 'ARN of the cross-account deployment role'
    Value: !GetAtt CrossAccountDeploymentRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CrossAccountRoleArn'
```

## Deployment Order

1. **First**: Deploy the cross-account role template in staging and production accounts
2. **Second**: Deploy the main pipeline template in your tools/pipeline account

This single template creates all the resources you need for your multi-account CI/CD pipeline!
