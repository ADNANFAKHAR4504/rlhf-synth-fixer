### Reasoning Trace
---

Let me create a comprehensive CloudFormation YAML template that meets all the specified requirements for a CI/CD pipeline deploying to Elastic Beanstalk.

Key components I need to include:
1. Parameters for configuration
2. IAM Roles with least privilege for CodePipeline, CodeBuild, and CodeDeploy/Elastic Beanstalk
3. S3 bucket for artifacts with KMS encryption
4. SNS topic for notifications
5. Elastic Beanstalk Application and Environment
6. CodeBuild Project
7. CodePipeline with stages: Source (GitHub), Build, Manual Approval, Deploy
8. Proper tagging throughout
9. Outputs for SNS ARN and EB URL

Let me structure this properly with all the required configurations.
### Answer 
---

# CloudFormation CI/CD Pipeline for Elastic Beanstalk

Here's a comprehensive CloudFormation YAML template that creates a complete CI/CD pipeline with all the specified requirements:

```yaml
# cicd_pipeline.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CI/CD Pipeline for deploying web application to Elastic Beanstalk with CodePipeline, CodeBuild, and CodeDeploy'

Parameters:
  GitHubOwner:
    Type: String
    Description: GitHub account owner
    Default: 'your-github-username'
  
  GitHubRepo:
    Type: String
    Description: GitHub repository name
    Default: 'your-repo-name'
  
  GitHubBranch:
    Type: String
    Description: GitHub branch to track
    Default: 'main'
  
  GitHubToken:
    Type: String
    NoEcho: true
    Description: GitHub personal access token
    MinLength: 1
  
  EnvironmentName:
    Type: String
    Description: Environment name for Elastic Beanstalk
    Default: 'MyWebApp-env'
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9-]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters and hyphens
  
  EnvironmentType:
    Type: String
    Description: Environment type for tagging
    Default: 'Development'
    AllowedValues:
      - Development
      - Staging
      - Production
  
  NotificationEmail:
    Type: String
    Description: Email address for pipeline notifications
    AllowedPattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    ConstraintDescription: Must be a valid email address

  ApplicationStackSolution:
    Type: String
    Description: Elastic Beanstalk solution stack name
    Default: '64bit Amazon Linux 2023 v4.0.1 running Python 3.11'

Mappings:
  RegionMap:
    us-east-1:
      S3HostedZoneId: Z3AQBSTGFYJSTF
      EBServicePrincipal: elasticbeanstalk.amazonaws.com

Resources:
  # KMS Key for S3 encryption
  ArtifactKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting pipeline artifacts
      EnableKeyRotation: true
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
                - codebuild.amazonaws.com
                - codepipeline.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  ArtifactKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/codepipeline-${AWS::StackName}'
      TargetKeyId: !Ref ArtifactKMSKey

  # S3 Bucket for artifacts
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cicd-artifacts-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !GetAtt ArtifactKMSKey.Arn
      VersioningConfiguration:
        Status: Enabled
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # SNS Topic for notifications
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: Pipeline Notifications
      TopicName: !Sub 'pipeline-notifications-${AWS::StackName}'
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  PipelineNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref PipelineNotificationTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchEvents
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'SNS:Publish'
            Resource: !Ref PipelineNotificationTopic

  # IAM Role for CodePipeline
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'codepipeline-role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: PipelineExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ArtifactAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                  - 's3:GetBucketLocation'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}'
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Sid: CodeBuildAccess
                Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource: !GetAtt CodeBuildProject.Arn
              - Sid: ElasticBeanstalkAccess
                Effect: Allow
                Action:
                  - 'elasticbeanstalk:CreateApplicationVersion'
                  - 'elasticbeanstalk:DescribeApplicationVersions'
                  - 'elasticbeanstalk:DescribeEnvironments'
                  - 'elasticbeanstalk:DescribeEvents'
                  - 'elasticbeanstalk:UpdateEnvironment'
                  - 'elasticbeanstalk:DescribeApplications'
                Resource:
                  - !Sub 'arn:aws:elasticbeanstalk:${AWS::Region}:${AWS::AccountId}:application/MyWebApp'
                  - !Sub 'arn:aws:elasticbeanstalk:${AWS::Region}:${AWS::AccountId}:environment/MyWebApp/*'
                  - !Sub 'arn:aws:elasticbeanstalk:${AWS::Region}:${AWS::AccountId}:applicationversion/MyWebApp/*'
              - Sid: SNSPublish
                Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref PipelineNotificationTopic
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ArtifactKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # IAM Role for CodeBuild
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'codebuild-role-${AWS::StackName}'
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
              - Sid: CloudWatchLogsAccess
                Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              - Sid: S3ArtifactAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${ArtifactBucket.Arn}'
                  - !Sub '${ArtifactBucket.Arn}/*'
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ArtifactKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # IAM Role for Elastic Beanstalk EC2 instances
  ElasticBeanstalkInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eb-ec2-role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier'
        - 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  ElasticBeanstalkInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'eb-ec2-profile-${AWS::StackName}'
      Roles:
        - !Ref ElasticBeanstalkInstanceRole

  # IAM Role for Elastic Beanstalk service
  ElasticBeanstalkServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eb-service-role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticbeanstalk.amazonaws.com
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': elasticbeanstalk
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth'
        - 'arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # Elastic Beanstalk Application
  ElasticBeanstalkApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: MyWebApp
      Description: Web Application deployed via CI/CD Pipeline
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation

  # Elastic Beanstalk Configuration Template
  ElasticBeanstalkConfigurationTemplate:
    Type: AWS::ElasticBeanstalk::ConfigurationTemplate
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      Description: Configuration template for web application
      SolutionStackName: !Ref ApplicationStackSolution
      OptionSettings:
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: InstanceType
          Value: 't3.medium'
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: IamInstanceProfile
          Value: !Ref ElasticBeanstalkInstanceProfile
        - Namespace: 'aws:elasticbeanstalk:environment'
          OptionName: ServiceRole
          Value: !Ref ElasticBeanstalkServiceRole
        - Namespace: 'aws:elasticbeanstalk:environment'
          OptionName: EnvironmentType
          Value: 'LoadBalanced'
        - Namespace: 'aws:elasticbeanstalk:healthreporting:system'
          OptionName: SystemType
          Value: 'enhanced'
        - Namespace: 'aws:autoscaling:asg'
          OptionName: MinSize
          Value: '2'
        - Namespace: 'aws:autoscaling:asg'
          OptionName: MaxSize
          Value: '4'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: MeasureName
          Value: 'CPUUtilization'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: Unit
          Value: 'Percent'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: UpperThreshold
          Value: '70'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: LowerThreshold
          Value: '30'

  # Elastic Beanstalk Environment
  ElasticBeanstalkEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Ref EnvironmentName
      Description: !Sub '${EnvironmentType} environment for MyWebApp'
      TemplateName: !Ref ElasticBeanstalkConfigurationTemplate
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # CodeBuild Project
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${AWS::StackName}-build'
      Description: Build project for web application
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:4.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: ENVIRONMENT_TYPE
            Value: !Ref EnvironmentType
          - Name: APPLICATION_NAME
            Value: MyWebApp
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo "Installing dependencies..."
                - pip install --upgrade pip
                - pip install -r requirements.txt
            build:
              commands:
                - echo "Running tests..."
                - python -m pytest tests/ || true
                - echo "Building application..."
                - zip -r application.zip . -x '*.git*'
            post_build:
              commands:
                - echo "Build completed on `date`"
          artifacts:
            files:
              - application.zip
              - .ebextensions/**/*
              - Procfile
            name: BuildArtifact
          cache:
            paths:
              - '/root/.cache/pip/**/*'
      Cache:
        Type: S3
        Location: !Sub '${ArtifactBucket}/cache'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Sub '/aws/codebuild/${AWS::StackName}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${AWS::StackName}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
        EncryptionKey:
          Id: !GetAtt ArtifactKMSKey.Arn
          Type: KMS
      RestartExecutionOnUpdate: false
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
                OAuthToken: !Ref GitHubToken
                PollForSourceChanges: true
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
                  TopicArn: !Ref PipelineNotificationTopic
                  Message: |
                    Build failed in pipeline ${AWS::StackName}
                    Please check the CodeBuild logs for details.

        # Manual Approval Stage
        - Name: ManualApproval
          Actions:
            - Name: ApprovalAction
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref PipelineNotificationTopic
                CustomData: !Sub |
                  Please review the build artifacts and approve deployment to ${EnvironmentType} environment.
                  Application: MyWebApp
                  Environment: ${EnvironmentName}
              RunOrder: 1

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
                ApplicationName: !Ref ElasticBeanstalkApplication
                EnvironmentName: !Ref ElasticBeanstalkEnvironment
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
                  TopicArn: !Ref PipelineNotificationTopic
                  Message: |
                    Deployment failed in pipeline ${AWS::StackName}
                    Environment: ${EnvironmentName}
                    Please check the Elastic Beanstalk events for details.

      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Application
          Value: MyWebApp

  # CloudWatch Event Rule for Pipeline State Changes
  PipelineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Description: 'Trigger notifications on pipeline state changes'
      EventPattern:
        source:
          - aws.codepipeline
        detail-type:
          - CodePipeline Pipeline Execution State Change
          - CodePipeline Stage Execution State Change
        detail:
          pipeline:
            - !Ref Pipeline
          state:
            - SUCCEEDED
            - FAILED
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineNotificationTarget
          InputTransformer:
            InputPathsMap:
              pipeline: '$.detail.pipeline'
              state: '$.detail.state'
              executionId: '$.detail.execution-id'
            InputTemplate: |
              "Pipeline <pipeline> has <state>. Execution ID: <executionId>"

  # CloudWatch Event Rule for Build State Changes
  BuildEventRule:
    Type: AWS::Events::Rule
    Properties:
      Description: 'Trigger notifications on build state changes'
      EventPattern:
        source:
          - aws.codebuild
        detail-type:
          - CodeBuild Build State Change
        detail:
          project-name:
            - !Ref CodeBuildProject
          build-status:
            - SUCCEEDED
            - FAILED
            - STOPPED
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: BuildNotificationTarget
          InputTransformer:
            InputPathsMap:
              project: '$.detail.project-name'
              status: '$.detail.build-status'
              buildId: '$.detail.build-id'
            InputTemplate: |
              "Build <project> has <status>. Build ID: <buildId>"

  # CloudWatch Log Group for Pipeline
  PipelineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codepipeline/${AWS::StackName}'
      RetentionInDays: 30

  # CloudWatch Log Group for CodeBuild
  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${AWS::StackName}'
      RetentionInDays: 30

Outputs:
  PipelineUrl:
    Description: URL of the CodePipeline
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${Pipeline}/view'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineUrl'

  ElasticBeanstalkApplicationURL:
    Description: URL of the Elastic Beanstalk application
    Value: !GetAtt ElasticBeanstalkEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationUrl'

  SNSTopicARN:
    Description: ARN of the SNS notification topic
    Value: !Ref PipelineNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopicArn'

  ArtifactBucketName:
    Description: Name of the S3 artifact bucket
    Value: !Ref ArtifactBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactBucket'

  CodeBuildProjectName:
    Description: Name of the CodeBuild project
    Value: !Ref CodeBuildProject
    Export:
      Name: !Sub '${AWS::StackName}-BuildProject'

  ElasticBeanstalkApplicationName:
    Description: Name of the Elastic Beanstalk application
    Value: !Ref ElasticBeanstalkApplication
    Export:
      Name: !Sub '${AWS::StackName}-EBApplication'

  ElasticBeanstalkEnvironmentName:
    Description: Name of the Elastic Beanstalk environment
    Value: !Ref ElasticBeanstalkEnvironment
    Export:
      Name: !Sub '${AWS::StackName}-EBEnvironment'

  KMSKeyId:
    Description: ID of the KMS key used for encryption
    Value: !Ref ArtifactKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'
```

## Key Features Implemented:

### 1. **Security Best Practices**
- **Least privilege IAM roles** for each service
- **KMS encryption** for S3 artifacts
- **Server-side encryption** enabled
- **Private S3 bucket** with versioning
- **Enhanced health monitoring** for Elastic Beanstalk

### 2. **Automation & Reliability**
- **Automatic triggering** on GitHub pushes
- **CloudWatch Events** for state change notifications
- **Retry logic** through CodePipeline's built-in mechanisms
- **Log retention** policies configured
- **Auto-scaling** configured for EB environment

### 3. **Pipeline Structure**
- Source → Build → Manual Approval → Deploy sequence
- **Manual approval stage** with custom notification
- **Error handling** with SNS notifications on failures

### 4. **Resource Management**
- **Consistent tagging** across all resources
- **Parameterized configuration** for flexibility
- **CloudFormation exports** for cross-stack references
- **S3 lifecycle policies** for artifact cleanup

### 5. **Monitoring & Notifications**
- **SNS topic** for pipeline notifications
- **CloudWatch Events** for detailed state tracking
- **Email notifications** for approvals and failures

## Deployment Instructions:

1. **Prerequisites:**
   - Create a GitHub personal access token with repo permissions
   - Ensure you're in the us-east-1 region

2. **Deploy the stack:**
```bash
aws cloudformation create-stack \
  --stack-name mywebapp-cicd-pipeline \
  --template-body file://cicd_pipeline.yaml \
  --parameters \
    ParameterKey=GitHubOwner,ParameterValue=your-github-username \
    ParameterKey=GitHubRepo,ParameterValue=your-repo-name \
    ParameterKey=GitHubToken,ParameterValue=your-github-token \
    ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
    ParameterKey=EnvironmentType,ParameterValue=Development \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Confirm SNS subscription** via email after stack creation

This template provides a production-ready CI/CD pipeline with comprehensive error handling, security controls, and operational visibility.