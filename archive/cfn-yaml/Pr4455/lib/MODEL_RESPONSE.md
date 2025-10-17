Model response
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CI/CD Pipeline for Web Application Deployment using CodePipeline, CodeBuild, and CodeDeploy'

Parameters:
  # Environment Parameters
  DevEnvironmentName:
    Type: String
    Default: 'Development'
    Description: 'Name of the Development environment'
  
  ProdEnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Name of the Production environment'
  
  # Infrastructure Parameters
  DevInstanceType:
    Type: String
    Default: 't2.micro'
    AllowedValues:
      - 't2.micro'
      - 't2.small'
      - 't2.medium'
      - 't3.micro'
      - 't3.small'
    Description: 'EC2 instance type for Development environment'
  
  ProdInstanceType:
    Type: String
    Default: 't2.small'
    AllowedValues:
      - 't2.small'
      - 't2.medium'
      - 't3.small'
      - 't3.medium'
      - 'm5.large'
    Description: 'EC2 instance type for Production environment'
  
  # Notification Parameters
  NotificationEmail:
    Type: String
    Description: 'Email address to receive pipeline notifications'
    Default: 'admin@example.com'
  
  # Storage Parameters
  ArtifactBucketName:
    Type: String
    Description: 'Name of the S3 bucket to store pipeline artifacts'
    Default: 'webapp-pipeline-artifacts'
  
  # AWS Region Parameter
  AWSRegion:
    Type: String
    Default: 'us-east-1'
    AllowedValues:
      - 'us-east-1'
      - 'us-east-2'
      - 'us-west-1'
      - 'us-west-2'
      - 'eu-west-1'
      - 'eu-central-1'
      - 'ap-northeast-1'
      - 'ap-southeast-1'
      - 'ap-southeast-2'
    Description: 'AWS Region for the CI/CD pipeline'
  
  # Application Parameters
  ApplicationName:
    Type: String
    Default: 'WebApp'
    Description: 'Name of the application to be deployed'
  
  RepositoryName:
    Type: String
    Default: 'WebAppRepo'
    Description: 'Name of the CodeCommit repository'

Resources:
  #---------------------------------------------------------------------------
  # IAM Roles and Policies
  #---------------------------------------------------------------------------
  
  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodePipelineAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:GetBucketVersioning'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}'
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}/*'
              - Effect: Allow
                Action:
                  - 'codecommit:GetBranch'
                  - 'codecommit:GetCommit'
                  - 'codecommit:UploadArchive'
                  - 'codecommit:GetUploadArchiveStatus'
                  - 'codecommit:CancelUploadArchive'
                Resource: !GetAtt CodeCommitRepo.Arn
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
                  - 'codedeploy:GetApplicationRevision'
                  - 'codedeploy:GetDeployment'
                  - 'codedeploy:GetDeploymentConfig'
                  - 'codedeploy:RegisterApplicationRevision'
                Resource: 
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:application:${ApplicationName}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentgroup:${ApplicationName}/${ApplicationName}-${DevEnvironmentName}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentgroup:${ApplicationName}/${ApplicationName}-${ProdEnvironmentName}'
                  - !Sub 'arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentconfig:*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref PipelineNotificationTopic
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: 
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}'
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}/*'
              - Effect: Allow
                Action:
                  - 'codecommit:GitPull'
                Resource: !GetAtt CodeCommitRepo.Arn
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # CodeDeploy Service Role
  CodeDeployServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # EC2 Instance Role for CodeDeploy
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      Policies:
        - PolicyName: CodeDeployEC2Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}'
                  - !Sub 'arn:aws:s3:::${ArtifactBucketName}/*'
                  - !Sub 'arn:aws:s3:::aws-codedeploy-${AWS::Region}/*'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  #---------------------------------------------------------------------------
  # S3 Bucket for Pipeline Artifacts
  #---------------------------------------------------------------------------
  
  ArtifactBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Retain
    Properties:
      BucketName: !Ref ArtifactBucketName
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
          - Id: ExpireOldArtifacts
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: Environment
          Value: 'Shared'
        - Key: ManagedBy
          Value: CloudFormation
  
  ArtifactBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref ArtifactBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${ArtifactBucketName}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: !Sub 'arn:aws:s3:::${ArtifactBucketName}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  #---------------------------------------------------------------------------
  # CodeCommit Repository
  #---------------------------------------------------------------------------
  
  CodeCommitRepo:
    Type: 'AWS::CodeCommit::Repository'
    Properties:
      RepositoryName: !Ref RepositoryName
      RepositoryDescription: !Sub 'Repository for ${ApplicationName} source code'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation

  #---------------------------------------------------------------------------
  # CodeBuild Projects
  #---------------------------------------------------------------------------
  
  # Build Project
  BuildProject:
    Type: 'AWS::CodeBuild::Project'
    Properties:
      Name: !Sub '${ApplicationName}-Build'
      Description: !Sub 'Build project for ${ApplicationName}'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        PrivilegedMode: false
        EnvironmentVariables:
          - Name: ARTIFACT_BUCKET
            Value: !Ref ArtifactBucketName
          - Name: APPLICATION_NAME
            Value: !Ref ApplicationName
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
            build:
              commands:
                - echo Build started on `date`
                - npm run build
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Preparing deployment package...
                - mkdir -p dist/scripts
                - cp -r scripts dist/
                - cp appspec.yml dist/
          artifacts:
            files:
              - appspec.yml
              - 'scripts/**/*'
              - 'dist/**/*'
              - 'public/**/*'
              - package.json
              - package-lock.json
            discard-paths: no
          cache:
            paths:
              - 'node_modules/**/*'
      TimeoutInMinutes: 15
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub '/aws/codebuild/${ApplicationName}-Build'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # Test Project
  TestProject:
    Type: 'AWS::CodeBuild::Project'
    Properties:
      Name: !Sub '${ApplicationName}-Test'
      Description: !Sub 'Test project for ${ApplicationName}'
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        PrivilegedMode: false
        EnvironmentVariables:
          - Name: APPLICATION_NAME
            Value: !Ref ApplicationName
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
                - npm run lint
            build:
              commands:
                - echo Running tests...
                - npm test
            post_build:
              commands:
                - echo Testing completed on `date`
                - echo Generating test reports...
          reports:
            test-reports:
              files:
                - 'test-reports/**/*'
              base-directory: './'
          artifacts:
            files:
              - 'test-reports/**/*'
            discard-paths: no
      TimeoutInMinutes: 10
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub '/aws/codebuild/${ApplicationName}-Test'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation

  #---------------------------------------------------------------------------
  # CodeDeploy Application and Deployment Groups
  #---------------------------------------------------------------------------
  
  # CodeDeploy Application
  CodeDeployApplication:
    Type: 'AWS::CodeDeploy::Application'
    Properties:
      ApplicationName: !Ref ApplicationName
      ComputePlatform: Server
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  # Development Deployment Group
  DevDeploymentGroup:
    Type: 'AWS::CodeDeploy::DeploymentGroup'
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ApplicationName}-${DevEnvironmentName}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.AllAtOnce
      Ec2TagFilters:
        - Key: Environment
          Value: !Ref DevEnvironmentName
          Type: KEY_AND_VALUE
        - Key: Application
          Value: !Ref ApplicationName
          Type: KEY_AND_VALUE
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
          - DEPLOYMENT_STOP_ON_REQUEST
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref DevDeploymentAlarm
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref DevEnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
  
  # Production Deployment Group
  ProdDeploymentGroup:
    Type: 'AWS::CodeDeploy::DeploymentGroup'
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ApplicationName}-${ProdEnvironmentName}'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.OneAtATime
      Ec2TagFilters:
        - Key: Environment
          Value: !Ref ProdEnvironmentName
          Type: KEY_AND_VALUE
        - Key: Application
          Value: !Ref ApplicationName
          Type: KEY_AND_VALUE
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
          - DEPLOYMENT_STOP_ON_REQUEST
      AlarmConfiguration:
        Enabled: true
        Alarms:
          - Name: !Ref ProdDeploymentAlarm
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref ProdEnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  #---------------------------------------------------------------------------
  # CloudWatch Alarms
  #---------------------------------------------------------------------------
  
  # Development Deployment Alarm
  DevDeploymentAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ApplicationName}-${DevEnvironmentName}-DeploymentError'
      AlarmDescription: !Sub 'Alarm for deployment errors in the ${DevEnvironmentName} environment'
      MetricName: DeploymentFailure
      Namespace: 'AWS/CodeDeploy'
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ApplicationName
          Value: !Ref ApplicationName
        - Name: DeploymentGroupName
          Value: !Sub '${ApplicationName}-${DevEnvironmentName}'
      AlarmActions:
        - !Ref PipelineNotificationTopic
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref DevEnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
  
  # Production Deployment Alarm
  ProdDeploymentAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ApplicationName}-${ProdEnvironmentName}-DeploymentError'
      AlarmDescription: !Sub 'Alarm for deployment errors in the ${ProdEnvironmentName} environment'
      MetricName: DeploymentFailure
      Namespace: 'AWS/CodeDeploy'
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ApplicationName
          Value: !Ref ApplicationName
        - Name: DeploymentGroupName
          Value: !Sub '${ApplicationName}-${ProdEnvironmentName}'
      AlarmActions:
        - !Ref PipelineNotificationTopic
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref ProdEnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  #---------------------------------------------------------------------------
  # SNS Topic for Notifications
  #---------------------------------------------------------------------------
  
  PipelineNotificationTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      TopicName: !Sub '${ApplicationName}-Pipeline-Notifications'
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
  
  PipelineNotificationSubscription:
    Type: 'AWS::SNS::Subscription'
    Properties:
      TopicArn: !Ref PipelineNotificationTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  #---------------------------------------------------------------------------
  # CodePipeline
  #---------------------------------------------------------------------------
  
  Pipeline:
    Type: 'AWS::CodePipeline::Pipeline'
    Properties:
      Name: !Sub '${ApplicationName}-Pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionKey:
          Id: alias/aws/s3
          Type: KMS
      Stages:
        - Name: Source
          Actions:
            - Name: Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeCommit
                Version: '1'
              Configuration:
                RepositoryName: !Ref RepositoryName
                BranchName: main
              OutputArtifacts:
                - Name: SourceCode
              RunOrder: 1
        
        - Name: Build
          Actions:
            - Name: BuildApp
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceCode
              OutputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
        
        - Name: Test
          Actions:
            - Name: TestApp
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: SourceCode
              RunOrder: 1
        
        - Name: DeployToDev
          Actions:
            - Name: DeployToDev
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Sub '${ApplicationName}-${DevEnvironmentName}'
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
        
        - Name: Approval
          Actions:
            - Name: ApproveProduction
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: !Sub 'Approve deployment of ${ApplicationName} to Production?'
              RunOrder: 1
        
        - Name: DeployToProd
          Actions:
            - Name: DeployToProd
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Sub '${ApplicationName}-${ProdEnvironmentName}'
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
      Tags:
        - Key: Project
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation

  # Pipeline Status Event Rule
  PipelineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Description: "Rule for capturing CodePipeline state changes"
      EventPattern:
        source:
          - "aws.codepipeline"
        detail-type:
          - "CodePipeline Pipeline Execution State Change"
        detail:
          pipeline:
            - !Sub "${ApplicationName}-Pipeline"
          state:
            - "FAILED"
            - "SUCCEEDED"
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: "PipelineNotificationTarget"

Outputs:
  CodeCommitRepositoryCloneUrlHTTPS:
    Description: 'HTTPS URL for cloning the CodeCommit repository'
    Value: !GetAtt CodeCommitRepo.CloneUrlHttp
  
  CodeCommitRepositoryCloneUrlSSH:
    Description: 'SSH URL for cloning the CodeCommit repository'
    Value: !GetAtt CodeCommitRepo.CloneUrlSsh
  
  PipelineArn:
    Description: 'ARN of the CI/CD Pipeline'
    Value: !Ref Pipeline
  
  PipelineConsoleURL:
    Description: 'Console URL for the CI/CD Pipeline'
    Value: !Sub 'https://console.aws.amazon.com/codepipeline/home?region=${AWS::Region}#/view/${ApplicationName}-Pipeline'
  
  NotificationTopicARN:
    Description: 'ARN of the SNS Topic used for pipeline notifications'
    Value: !Ref PipelineNotificationTopic
```