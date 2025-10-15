Model response
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready CI/CD Pipeline for Web Application Deployment with automated build, test, and deploy stages'

Parameters:
  ProjectName:
    Type: String
    Default: 'WebApp'
    Description: 'Name of the project for resource naming and tagging'
    
  NotificationEmail:
    Type: String
    Description: 'Email address for pipeline notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'
    
  EC2InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for deployment targets'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      
  DevEnvironmentName:
    Type: String
    Default: 'Development'
    Description: 'Name of the development environment'
    
  ProdEnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Name of the production environment'
    
  ArtifactBucketName:
    Type: String
    Default: ''
    Description: 'S3 bucket name for artifacts (leave empty for auto-generation)'
    
  CodeBuildComputeType:
    Type: String
    Default: 'BUILD_GENERAL1_SMALL'
    Description: 'CodeBuild compute type'
    AllowedValues:
      - BUILD_GENERAL1_SMALL
      - BUILD_GENERAL1_MEDIUM
      - BUILD_GENERAL1_LARGE

Conditions:
  CreateBucket: !Equals [!Ref ArtifactBucketName, '']

Resources:
  # ==================== IAM Roles and Policies ====================
  
  # IAM Role for CodePipeline
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodePipeline-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodePipelineFullAccess
      Policies:
        - PolicyName: CodePipelineServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !Sub '${ArtifactsBucket.Arn}'
                  - !Sub '${ArtifactsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'codecommit:GetBranch'
                  - 'codecommit:GetCommit'
                  - 'codecommit:UploadArchive'
                  - 'codecommit:GetUploadArchiveStatus'
                  - 'codecommit:CancelUploadArchive'
                Resource: !GetAtt CodeCommitRepository.Arn
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
                  - 'sns:Publish'
                Resource: !Ref SNSTopic
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # IAM Role for CodeBuild
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodeBuild-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${ProjectName}-*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${ProjectName}-*:*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${ArtifactsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'codecommit:GitPull'
                Resource: !GetAtt CodeCommitRepository.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # IAM Role for CodeDeploy
  CodeDeployServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodeDeploy-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodeDeployRole
      Policies:
        - PolicyName: CodeDeployServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:CreateTags'
                  - 'ec2:DescribeInstances'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref SNSTopic
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricAlarm'
                  - 'cloudwatch:DescribeAlarms'
                  - 'cloudwatch:DeleteAlarms'
                Resource: '*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: EC2InstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${ArtifactsBucket.Arn}'
                  - !Sub '${ArtifactsBucket.Arn}/*'
                  - !Sub 'arn:aws:s3:::aws-codedeploy-${AWS::Region}/*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-Profile'
      Roles:
        - !Ref EC2InstanceRole

  # ==================== S3 Bucket for Artifacts ====================
  
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - CreateBucket
        - !Sub '${ProjectName}-artifacts-${AWS::AccountId}-${AWS::Region}'
        - !Ref ArtifactBucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30
            NoncurrentVersionExpirationInDays: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ==================== CodeCommit Repository ====================
  
  CodeCommitRepository:
    Type: AWS::CodeCommit::Repository
    Properties:
      RepositoryName: !Sub '${ProjectName}-repo'
      RepositoryDescription: !Sub 'Repository for ${ProjectName} application'
      Code:
        S3:
          Bucket: !Ref ArtifactsBucket
          Key: initial-commit.zip
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ==================== CodeBuild Project ====================
  
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ProjectName}-build'
      Description: !Sub 'Build project for ${ProjectName}'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: !Ref CodeBuildComputeType
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: PROJECT_NAME
            Value: !Ref ProjectName
          - Name: ARTIFACT_BUCKET
            Value: !Ref ArtifactsBucket
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - echo Pre-build phase started on `date`
                - echo Installing dependencies...
                - npm install
            build:
              commands:
                - echo Build started on `date`
                - echo Building the application...
                - npm run build
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Running tests...
                - npm test
          artifacts:
            files:
              - '**/*'
              - appspec.yml
              - scripts/*
            name: BuildArtifact
      TimeoutInMinutes: 15
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ==================== CodeDeploy Application ====================
  
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${ProjectName}-app'
      ComputePlatform: Server
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # CodeDeploy Deployment Group for Development
  CodeDeployDeploymentGroupDev:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ProjectName}-${DevEnvironmentName}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.OneAtATime
      Ec2TagFilters:
        - Type: KEY_AND_VALUE
          Key: Environment
          Value: !Ref DevEnvironmentName
        - Type: KEY_AND_VALUE
          Key: Project
          Value: !Ref ProjectName
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref CloudWatchAlarmDev
      LoadBalancerInfo:
        TargetGroupInfoList: []
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref DevEnvironmentName
        - Key: ManagedBy
          Value: 'CloudFormation'

  # CodeDeploy Deployment Group for Production
  CodeDeployDeploymentGroupProd:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ProjectName}-${ProdEnvironmentName}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.OneAtATime
      Ec2TagFilters:
        - Type: KEY_AND_VALUE
          Key: Environment
          Value: !Ref ProdEnvironmentName
        - Type: KEY_AND_VALUE
          Key: Project
          Value: !Ref ProjectName
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
          - DEPLOYMENT_STOP_ON_REQUEST
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref CloudWatchAlarmProd
      LoadBalancerInfo:
        TargetGroupInfoList: []
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref ProdEnvironmentName
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ==================== SNS Topic for Notifications ====================
  
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-pipeline-notifications'
      DisplayName: !Sub '${ProjectName} Pipeline Notifications'
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ==================== CloudWatch Alarms ====================
  
  CloudWatchAlarmDev:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${DevEnvironmentName}-DeploymentErrors'
      AlarmDescription: !Sub 'Alert when deployment errors occur in ${DevEnvironmentName}'
      MetricName: Errors
      Namespace: AWS/CodeDeploy
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ApplicationName
          Value: !Ref CodeDeployApplication
        - Name: DeploymentGroupName
          Value: !Sub '${ProjectName}-${DevEnvironmentName}'
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  CloudWatchAlarmProd:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${ProdEnvironmentName}-DeploymentErrors'
      AlarmDescription: !Sub 'Alert when deployment errors occur in ${ProdEnvironmentName}'
      MetricName: Errors
      Namespace: AWS/CodeDeploy
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ApplicationName
          Value: !Ref CodeDeployApplication
        - Name: DeploymentGroupName
          Value: !Sub '${ProjectName}-${ProdEnvironmentName}'
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  # ==================== CodePipeline ====================
  
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ProjectName}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactsBucket
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
                RepositoryName: !GetAtt CodeCommitRepository.Name
                BranchName: main
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
              RunOrder: 1
              
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
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: SNS
                  Version: '1'
                Configuration:
                  TopicArn: !Ref SNSTopic
                  Message: !Sub 'Build failed for ${ProjectName} pipeline'
                  
        # Deploy to Development Stage
        - Name: DeployToDevelopment
          Actions:
            - Name: DeployToDevAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroupDev
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: SNS
                  Version: '1'
                Configuration:
                  TopicArn: !Ref SNSTopic
                  Message: !Sub 'Deployment to ${DevEnvironmentName} failed for ${ProjectName}'
                  
        # Manual Approval Stage
        - Name: ManualApproval
          Actions:
            - Name: ApproveProductionDeployment
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref SNSTopic
                CustomData: !Sub 'Please review and approve deployment to ${ProdEnvironmentName}'
              RunOrder: 1
              
        # Deploy to Production Stage
        - Name: DeployToProduction
          Actions:
            - Name: DeployToProdAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroupProd
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
              OnFailure:
                ActionTypeId:
                  Category: Invoke
                  Owner: AWS
                  Provider: SNS
                  Version: '1'
                Configuration:
                  TopicArn: !Ref SNSTopic
                  Message: !Sub 'Deployment to ${ProdEnvironmentName} failed for ${ProjectName}'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # CloudWatch Event Rule for Pipeline State Changes
  PipelineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-pipeline-state-change'
      Description: !Sub 'Trigger notifications for ${ProjectName} pipeline state changes'
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          pipeline:
            - !Ref CodePipeline
          state:
            - FAILED
            - SUCCEEDED
      State: ENABLED
      Targets:
        - Arn: !Ref SNSTopic
          Id: SNSTarget
          InputTransformer:
            InputPathsMap:
              pipeline: $.detail.pipeline
              state: $.detail.state
            InputTemplate: !Sub |
              "Pipeline <pipeline> has <state> in account ${AWS::AccountId}"

  # Permission for EventBridge to publish to SNS
  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowEventBridgeToPublish
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sns:Publish'
            Resource: !Ref SNSTopic

  # CloudWatch Event Rule for CodeCommit
  CodeCommitEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-codecommit-trigger'
      Description: !Sub 'Trigger pipeline on CodeCommit changes for ${ProjectName}'
      EventPattern:
        source:
          - aws.codecommit
        detail-type:
          - CodeCommit Repository State Change
        resources:
          - !GetAtt CodeCommitRepository.Arn
        detail:
          referenceType:
            - branch
          referenceName:
            - main
      State: ENABLED
      Targets:
        - Arn: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${CodePipeline}'
          RoleArn: !GetAtt CodePipelineEventRole.Arn
          Id: CodePipeline

  # IAM Role for CloudWatch Events to trigger Pipeline
  CodePipelineEventRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-Pipeline-Event-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: StartPipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 'codepipeline:StartPipelineExecution'
                Resource: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${CodePipeline}'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: 'CloudFormation'

Outputs:
  CodeCommitRepositoryCloneUrl:
    Description: 'HTTPS Clone URL for CodeCommit Repository'
    Value: !GetAtt CodeCommitRepository.CloneUrlHttp
    Export:
      Name: !Sub '${AWS::StackName}-RepoCloneUrl'
      
  CodeCommitRepositoryArn:
    Description: 'ARN of the CodeCommit Repository'
    Value: !GetAtt CodeCommitRepository.Arn
    Export:
      Name: !Sub '${AWS::StackName}-RepoArn'
      
  CodePipelineArn:
    Description: 'ARN of the CodePipeline'
    Value: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${CodePipeline}'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineArn'
      
  CodePipelineName:
    Description: 'Name of the CodePipeline'
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'
      
  ArtifactsBucketName:
    Description: 'Name of the S3 Artifacts Bucket'
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'
      
  SNSTopicArn:
    Description: 'ARN of the SNS Topic for notifications'
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic'
      
  CodeDeployApplicationName:
    Description: 'Name of the CodeDeploy Application'
    Value: !Ref CodeDeployApplication
    Export:
      Name: !Sub '${AWS::StackName}-CodeDeployApp'
      
  EC2InstanceProfileArn:
    Description: 'ARN of the EC2 Instance Profile for deployment targets'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfile'
```