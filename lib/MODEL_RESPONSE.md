AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready CI/CD pipeline with CodePipeline, CodeBuild, CodeDeploy, and Lambda validation'

Parameters:
  ProjectName:
    Type: String
    Default: 'my-cicd-project'
    Description: 'Name of the project for resource naming'
  
  ApplicationName:
    Type: String
    Default: 'my-application'
    Description: 'Name of the application for CodeDeploy'
  
  NotificationEmail:
    Type: String
    Description: 'Email address for pipeline failure notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Resources:
  # ========================================
  # S3 BUCKET FOR SOURCE CODE WITH VERSIONING
  # ========================================
  SourceCodeBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-source-code-${AWS::AccountId}'
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
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref PipelineLogGroup

  # S3 BUCKET FOR PIPELINE ARTIFACTS
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-artifacts-${AWS::AccountId}'
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

  # ========================================
  # CLOUDWATCH LOG GROUPS FOR AUDITING
  # ========================================
  PipelineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codepipeline/${ProjectName}'
      RetentionInDays: 30

  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${ProjectName}'
      RetentionInDays: 30

  CodeDeployLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codedeploy/${ProjectName}'
      RetentionInDays: 30

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-validation'
      RetentionInDays: 30

  # ========================================
  # IAM ROLES WITH LEAST PRIVILEGE
  # ========================================
  
  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodePipeline-ServiceRole'
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
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:GetBucketVersioning
                Resource:
                  - !Sub '${SourceCodeBucket}/*'
                  - !Sub '${ArtifactsBucket}/*'
                  - !Ref SourceCodeBucket
                  - !Ref ArtifactsBucket
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn
              - Effect: Allow
                Action:
                  - codedeploy:CreateDeployment
                  - codedeploy:GetApplication
                  - codedeploy:GetApplicationRevision
                  - codedeploy:GetDeployment
                  - codedeploy:GetDeploymentConfig
                  - codedeploy:RegisterApplicationRevision
                Resource: '*'
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource: !GetAtt ValidationLambdaFunction.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt PipelineLogGroup.Arn

  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodeBuild-ServiceRole'
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
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: 
                  - !GetAtt CodeBuildLogGroup.Arn
                  - !Sub '${CodeBuildLogGroup.Arn}:*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${SourceCodeBucket}/*'
                  - !Sub '${ArtifactsBucket}/*'

  # CodeDeploy Service Role
  CodeDeployServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CodeDeploy-ServiceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole
      Policies:
        - PolicyName: CodeDeployServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: 
                  - !GetAtt CodeDeployLogGroup.Arn
                  - !Sub '${CodeDeployLogGroup.Arn}:*'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-Lambda-ExecutionRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: LambdaValidationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - codepipeline:PutJobSuccessResult
                  - codepipeline:PutJobFailureResult
                Resource: '*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: 
                  - !GetAtt LambdaLogGroup.Arn
                  - !Sub '${LambdaLogGroup.Arn}:*'

  # CloudWatch Events Role for Pipeline Triggering
  CloudWatchEventRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CloudWatchEvent-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchEventPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - codepipeline:StartPipelineExecution
                Resource: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${ProjectName}-pipeline'

  # ========================================
  # CODEBUILD PROJECT
  # ========================================
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${ProjectName}-build'
      Description: 'Build project for CI/CD pipeline'
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
          - Name: PROJECT_NAME
            Value: !Ref ProjectName
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
            build:
              commands:
                - echo Build started on `date`
                - echo Compiling the source code...
                - # Add your build commands here
                - echo Build completed on `date`
            post_build:
              commands:
                - echo Build completed on `date`
          artifacts:
            files:
              - '**/*'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup

  # ========================================
  # CODEDEPLOY APPLICATION AND DEPLOYMENT GROUP
  # ========================================
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${ProjectName}-application'
      ComputePlatform: Server

  CodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${ProjectName}-deployment-group'
      ServiceRoleArn: !GetAtt CodeDeployServiceRole.Arn
      DeploymentConfigName: CodeDeployDefault.AllAtOnceHalfAtATime
      Ec2TagFilters:
        - Type: KEY_AND_VALUE
          Key: Environment
          Value: Production
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM

  # ========================================
  # LAMBDA FUNCTION FOR CUSTOM VALIDATION
  # ========================================
  ValidationLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-validation-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import json
          import boto3
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          codepipeline = boto3.client('codepipeline')

          def lambda_handler(event, context):
              """
              Custom validation function that runs after deployment
              """
              job_id = event['CodePipeline.job']['id']
              
              try:
                  logger.info('Starting deployment validation...')
                  
                  # Add your custom validation logic here
                  # For example: health checks, smoke tests, etc.
                  
                  # Simulate validation process
                  validation_passed = True
                  
                  if validation_passed:
                      logger.info('Validation passed successfully')
                      codepipeline.put_job_success_result(jobId=job_id)
                  else:
                      logger.error('Validation failed')
                      codepipeline.put_job_failure_result(
                          jobId=job_id,
                          failureDetails={'message': 'Custom validation failed', 'type': 'JobFailed'}
                      )
              
              except Exception as e:
                  logger.error(f'Error during validation: {str(e)}')
                  codepipeline.put_job_failure_result(
                      jobId=job_id,
                      failureDetails={'message': str(e), 'type': 'JobFailed'}
                  )
              
              return {'statusCode': 200}

  # ========================================
  # CODEPIPELINE
  # ========================================
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${ProjectName}-pipeline'
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactsBucket
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                S3Bucket: !Ref SourceCodeBucket
                S3ObjectKey: source.zip
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
        
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: '1'
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroup
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1
        
        - Name: Validate
          Actions:
            - Name: ValidateDeployment
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: '1'
              Configuration:
                FunctionName: !Ref ValidationLambdaFunction
              RunOrder: 1

  # ========================================
  # CLOUDWATCH EVENT RULE FOR AUTO-TRIGGERING
  # ========================================
  PipelineTriggerRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-pipeline-trigger'
      Description: 'Trigger pipeline on S3 object creation'
      EventPattern:
        source:
          - aws.s3
        detail-type:
          - Object Created
        detail:
          bucket:
            name:
              - !Ref SourceCodeBucket
          object:
            key:
              - source.zip
      State: ENABLED
      Targets:
        - Arn: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${ProjectName}-pipeline'
          Id: PipelineTriggerTarget
          RoleArn: !GetAtt CloudWatchEventRole.Arn

  # ========================================
  # SNS TOPIC FOR NOTIFICATIONS
  # ========================================
  NotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-pipeline-notifications'
      DisplayName: 'CI/CD Pipeline Notifications'

  NotificationTopicSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref NotificationTopic
      Endpoint: !Ref NotificationEmail

  # ========================================
  # CLOUDWATCH ALARMS FOR MONITORING
  # ========================================
  PipelineFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-pipeline-failure'
      AlarmDescription: 'Alarm for CodePipeline failures'
      MetricName: PipelineExecutionFailure
      Namespace: AWS/CodePipeline
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: PipelineName
          Value: !Ref CodePipeline
      AlarmActions:
        - !Ref NotificationTopic
      TreatMissingData: notBreaching

  BuildFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-build-failure'
      AlarmDescription: 'Alarm for CodeBuild failures'
      MetricName: FailedBuilds
      Namespace: AWS/CodeBuild
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: ProjectName
          Value: !Ref CodeBuildProject
      AlarmActions:
        - !Ref NotificationTopic
      TreatMissingData: notBreaching

  # ========================================
  # CLOUDTRAIL FOR ADDITIONAL AUDITING
  # ========================================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-cloudtrail'
      S3BucketName: !Ref ArtifactsBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SourceCodeBucket}/*'
                - !Sub '${ArtifactsBucket}/*'

# ========================================
# OUTPUTS
# ========================================
Outputs:
  PipelineName:
    Description: 'Name of the created CodePipeline'
    Value: !Ref CodePipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  SourceBucketName:
    Description: 'Name of the S3 bucket for source code'
    Value: !Ref SourceCodeBucket
    Export:
      Name: !Sub '${AWS::StackName}-SourceBucket'

  ArtifactsBucketName:
    Description: 'Name of the S3 bucket for artifacts'
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'

  CodeBuildProjectName:
    Description: 'Name of the CodeBuild project'
    Value: !Ref CodeBuildProject
    Export:
      Name: !Sub '${AWS::StackName}-CodeBuildProject'

  CodeDeployApplicationName:
    Description: 'Name of the CodeDeploy application'
    Value: !Ref CodeDeployApplication
    Export:
      Name: !Sub '${AWS::StackName}-CodeDeployApplication'

  ValidationLambdaFunctionName:
    Description: 'Name of the validation Lambda function'
    Value: !Ref ValidationLambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-ValidationFunction'

  NotificationTopicArn:
    Description: 'ARN of the SNS topic for notifications'
    Value: !Ref NotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopic'