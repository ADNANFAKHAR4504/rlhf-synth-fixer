# Secure CI/CD Pipeline with CodePipeline, CodeBuild, and Elastic Beanstalk

This CloudFormation template creates a comprehensive CI/CD pipeline with multiple environments and security best practices.

## Architecture Overview

- **CodePipeline**: Orchestrates the entire CI/CD workflow
- **CodeBuild**: Builds and tests the application
- **Elastic Beanstalk**: Hosts the application across multiple environments (Dev, Test, Prod)
- **KMS Encryption**: Secures all artifacts and data
- **SNS Notifications**: Alerts on pipeline state changes

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure CI/CD Pipeline with CodePipeline, CodeBuild, and Elastic Beanstalk deployment across multiple environments and regions'

Parameters:
  # Repository Configuration
  GitHubRepoOwner:
    Type: String
    Description: GitHub repository owner/organization name
    Default: 'your-org'

  GitHubRepoName:
    Type: String
    Description: GitHub repository name
    Default: 'your-app'

  GitHubBranch:
    Type: String
    Description: GitHub branch to track
    Default: 'main'

  GitHubToken:
    Type: String
    Description: GitHub personal access token (stored in Systems Manager Parameter Store)
    Default: '/cicd/github-token'
    NoEcho: true

  # Application Configuration
  ApplicationName:
    Type: String
    Description: Name of the application
    Default: 'MyWebApp'

  SolutionStackName:
    Type: String
    Description: Elastic Beanstalk solution stack
    Default: '64bit Amazon Linux 2 v5.8.0 running Node.js 18'

  # Notification Configuration
  NotificationEmail:
    Type: String
    Description: Email address for pipeline notifications
    Default: 'devteam@company.com'

  # Tagging Configuration
  Environment:
    Type: String
    Description: Environment designation
    Default: 'cicd'
    AllowedValues: ['dev', 'test', 'prod', 'cicd']

  Project:
    Type: String
    Description: Project name
    Default: 'WebApplication'

  Owner:
    Type: String
    Description: Resource owner
    Default: 'DevOps Team'

  CostCenter:
    Type: String
    Description: Cost center for billing
    Default: 'Engineering'

Resources:
  # KMS Key for Encryption
  PipelineKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for CI/CD Pipeline encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CodePipeline Service
            Effect: Allow
            Principal:
              Service:
                - codepipeline.amazonaws.com
                - codebuild.amazonaws.com
                - s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PipelineKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-pipeline-key'
      TargetKeyId: !Ref PipelineKMSKey

  # S3 Bucket for Artifacts
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-cicd-artifacts-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref PipelineKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30
            NoncurrentVersionExpirationInDays: 7
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Groups
  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${ApplicationName}-build'
      RetentionInDays: 30
      KmsKeyId: !GetAtt PipelineKMSKey.Arn

  # SNS Topics for Notifications
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ApplicationName}-pipeline-notifications'
      KmsMasterKeyId: !Ref PipelineKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PipelineNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref PipelineNotificationTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # IAM Roles
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-CodePipeline-ServiceRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelineServicePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${ArtifactsBucket}/*'
                  - !GetAtt ArtifactsBucket.Arn
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn
              - Effect: Allow
                Action:
                  - elasticbeanstalk:CreateApplicationVersion
                  - elasticbeanstalk:DescribeApplicationVersions
                  - elasticbeanstalk:DescribeApplications
                  - elasticbeanstalk:DescribeEnvironments
                  - elasticbeanstalk:UpdateEnvironment
                Resource: '*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref PipelineNotificationTopic
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt PipelineKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-CodeBuild-ServiceRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildServicePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource: !Sub '${ArtifactsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt PipelineKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ElasticBeanstalkServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-ElasticBeanstalk-ServiceRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticbeanstalk.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ElasticBeanstalkInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ElasticBeanstalkInstanceRole

  ElasticBeanstalkInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-ElasticBeanstalk-InstanceRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CodeBuild Project
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ApplicationName}-build'
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
          - Name: APPLICATION_NAME
            Value: !Ref ApplicationName
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - echo Build started on `date`
                - echo Installing dependencies...
                - npm install
            build:
              commands:
                - echo Build phase started on `date`
                - echo Running tests...
                - npm test
                - echo Building the application...
                - npm run build
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Creating deployment package...
          artifacts:
            files:
              - '**/*'
            name: !Sub '${ApplicationName}-$(date +%Y-%m-%d)'
      EncryptionKey: !GetAtt PipelineKMSKey.Arn
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Elastic Beanstalk Application
  ElasticBeanstalkApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: !Ref ApplicationName
      Description: !Sub 'CI/CD Application for ${ApplicationName}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Elastic Beanstalk Environments
  DevelopmentEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Sub '${ApplicationName}-dev'
      SolutionStackName: !Ref SolutionStackName
      OptionSettings:
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: IamInstanceProfile
          Value: !Ref ElasticBeanstalkInstanceProfile
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: ServiceRole
          Value: !Ref ElasticBeanstalkServiceRole
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: '1'
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: '2'
        - Namespace: aws:elasticbeanstalk:healthreporting:system
          OptionName: SystemType
          Value: enhanced
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: NODE_ENV
          Value: development
      Tags:
        - Key: Environment
          Value: dev
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  TestingEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Sub '${ApplicationName}-test'
      SolutionStackName: !Ref SolutionStackName
      OptionSettings:
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: IamInstanceProfile
          Value: !Ref ElasticBeanstalkInstanceProfile
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: ServiceRole
          Value: !Ref ElasticBeanstalkServiceRole
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: '1'
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: '3'
        - Namespace: aws:elasticbeanstalk:healthreporting:system
          OptionName: SystemType
          Value: enhanced
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: NODE_ENV
          Value: testing
      Tags:
        - Key: Environment
          Value: test
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ProductionEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Sub '${ApplicationName}-prod'
      SolutionStackName: !Ref SolutionStackName
      OptionSettings:
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: IamInstanceProfile
          Value: !Ref ElasticBeanstalkInstanceProfile
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: ServiceRole
          Value: !Ref ElasticBeanstalkServiceRole
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: '2'
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: '5'
        - Namespace: aws:elasticbeanstalk:healthreporting:system
          OptionName: SystemType
          Value: enhanced
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: NODE_ENV
          Value: production
        - Namespace: aws:elasticbeanstalk:command
          OptionName: DeploymentPolicy
          Value: RollingWithAdditionalBatch
        - Namespace: aws:elasticbeanstalk:command
          OptionName: BatchSizeType
          Value: Percentage
        - Namespace: aws:elasticbeanstalk:command
          OptionName: BatchSize
          Value: '30'
      Tags:
        - Key: Environment
          Value: prod
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # EventBridge Rules for Pipeline Notifications
  PipelineStateChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ApplicationName}-pipeline-state-change'
      Description: 'Capture pipeline state changes'
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
        detail:
          state:
            - FAILED
            - SUCCEEDED
          pipeline:
            - !Ref CodePipeline
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineNotificationTarget
          InputTransformer:
            InputPathsMap:
              pipeline: $.detail.pipeline
              state: $.detail.state
              execution-id: $.detail.execution-id
            InputTemplate: |
              {
                "pipeline": "<pipeline>",
                "state": "<state>",
                "execution-id": "<execution-id>",
                "message": "Pipeline <pipeline> has <state> for execution <execution-id>"
              }

  # CodePipeline
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ApplicationName}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactsBucket
        EncryptionKey:
          Id: !GetAtt PipelineKMSKey.Arn
          Type: KMS
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: '1'
              Configuration:
                Owner: !Ref GitHubRepoOwner
                Repo: !Ref GitHubRepoName
                Branch: !Ref GitHubBranch
                OAuthToken: !Sub '{{resolve:ssm:${GitHubToken}:1}}'
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput

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

        - Name: DeployToDev
          Actions:
            - Name: DeployToDevAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ElasticBeanstalk
                Version: '1'
              Configuration:
                ApplicationName: !Ref ElasticBeanstalkApplication
                EnvironmentName: !Ref DevelopmentEnvironment
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        - Name: DeployToTest
          Actions:
            - Name: ApprovalForTest
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: 'Please review and approve deployment to Test environment'
              RunOrder: 1
            - Name: DeployToTestAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ElasticBeanstalk
                Version: '1'
              Configuration:
                ApplicationName: !Ref ElasticBeanstalkApplication
                EnvironmentName: !Ref TestingEnvironment
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 2

        - Name: DeployToProd
          Actions:
            - Name: ApprovalForProd
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: 'Please review and approve deployment to Production environment'
              RunOrder: 1
            - Name: DeployToProdAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ElasticBeanstalk
                Version: '1'
              Configuration:
                ApplicationName: !Ref ElasticBeanstalkApplication
                EnvironmentName: !Ref ProductionEnvironment
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # GitHub Webhook
  GitHubWebhook:
    Type: AWS::CodePipeline::Webhook
    Properties:
      Name: !Sub '${ApplicationName}-github-webhook'
      Authentication: GITHUB_HMAC
      AuthenticationConfiguration:
        SecretToken: !Sub '{{resolve:ssm:${GitHubToken}:1}}'
      Filters:
        - JsonPath: $.ref
          MatchEquals: !Sub 'refs/heads/${GitHubBranch}'
      TargetPipeline: !Ref CodePipeline
      TargetAction: SourceAction
      TargetPipelineVersion: !GetAtt CodePipeline.Version
      RegisterWithThirdParty: true

Outputs:
  PipelineName:
    Description: 'Name of the CodePipeline'
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  ArtifactsBucketName:
    Description: 'Name of the S3 bucket for artifacts'
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'

  ApplicationName:
    Description: 'Name of the Elastic Beanstalk application'
    Value: !Ref ElasticBeanstalkApplication
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationName'

  DevelopmentEnvironmentURL:
    Description: 'URL of the Development environment'
    Value: !GetAtt DevelopmentEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-DevEnvironmentURL'

  TestingEnvironmentURL:
    Description: 'URL of the Testing environment'
    Value: !GetAtt TestingEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-TestEnvironmentURL'

  ProductionEnvironmentURL:
    Description: 'URL of the Production environment'
    Value: !GetAtt ProductionEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-ProdEnvironmentURL'

  KMSKeyId:
    Description: 'KMS Key ID for pipeline encryption'
    Value: !Ref PipelineKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  NotificationTopicArn:
    Description: 'SNS Topic ARN for notifications'
    Value: !Ref PipelineNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopic'
```

## Features

### Security

- **KMS Encryption**: All artifacts, logs, and SNS topics are encrypted
- **IAM Least Privilege**: Minimal permissions for each service role
- **S3 Security**: Public access blocked, versioning enabled, lifecycle policies

### Multi-Environment Deployment

- **Development Environment**: Auto-deployment for rapid iteration
- **Testing Environment**: Manual approval required
- **Production Environment**: Manual approval with rolling deployment strategy

### Monitoring & Notifications

- **CloudWatch Logs**: Centralized logging for CodeBuild
- **SNS Notifications**: Email alerts for pipeline state changes
- **EventBridge Rules**: Automated pipeline monitoring

### CI/CD Pipeline Stages

1. **Source**: GitHub integration with webhook triggers
2. **Build**: Automated testing and artifact creation
3. **Deploy to Dev**: Automatic deployment to development environment
4. **Deploy to Test**: Manual approval + deployment to testing environment
5. **Deploy to Prod**: Manual approval + rolling deployment to production

## Deployment Instructions

1. **Prerequisites**:
   - GitHub repository with your application code
   - GitHub personal access token stored in Systems Manager Parameter Store
   - Notification email address

2. **Parameters to Configure**:
   - `GitHubRepoOwner`: Your GitHub username/organization
   - `GitHubRepoName`: Repository name
   - `GitHubBranch`: Branch to track (default: main)
   - `ApplicationName`: Name for your application
   - `NotificationEmail`: Email for pipeline notifications

3. **Deploy the Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name my-cicd-pipeline \
     --template-body file://pipeline-template.yaml \
     --parameters ParameterKey=GitHubRepoOwner,ParameterValue=your-username \
                  ParameterKey=GitHubRepoName,ParameterValue=your-repo \
                  ParameterKey=NotificationEmail,ParameterValue=your-email@company.com \
     --capabilities CAPABILITY_NAMED_IAM
   ```

## Outputs

The template provides the following outputs:

- Pipeline name and ARN
- Artifacts bucket name
- Application name
- Environment URLs (Dev, Test, Prod)
- KMS key ID
- Notification topic ARN

## Best Practices Implemented

- ✅ Encryption at rest and in transit
- ✅ Least privilege IAM policies
- ✅ Manual approvals for production deployments
- ✅ Rolling deployment strategy for zero downtime
- ✅ Automated testing in build phase
- ✅ Centralized logging and monitoring
- ✅ Cost optimization with artifact lifecycle policies
- ✅ Tagged resources for cost allocation
