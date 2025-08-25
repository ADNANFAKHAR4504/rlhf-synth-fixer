AWSTemplateFormatVersion: '2010-09-09'
Description: 'Fully automated CI/CD pipeline with CodePipeline, CodeBuild, Lambda, and S3 integration'

Parameters:
  ProjectName:
    Type: String
    Default: 'my-cicd-project'
    Description: 'Name of the project - used for naming resources'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  SourceBucketName:
    Type: String
    Default: 'source-code-bucket'
    Description: 'S3 bucket name for source code storage'
    AllowedPattern: '^[a-z0-9-]+$'

  ArtifactsBucketName:
    Type: String
    Default: 'build-artifacts-bucket'
    Description: 'S3 bucket name for build artifacts'
    AllowedPattern: '^[a-z0-9-]+$'

  NotificationEmail:
    Type: String
    Description: 'Email address for pipeline notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Resources:
  # ============================================================================
  # S3 BUCKETS
  # ============================================================================
  
  # Source code bucket - where application code is uploaded
  SourceCodeBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${SourceBucketName}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  # Artifacts bucket - for storing build artifacts and temporary files
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ArtifactsBucketName}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30

  # ============================================================================
  # CLOUDWATCH LOGS
  # ============================================================================
  
  # Log group for CodeBuild logs
  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/${ProjectName}'
      RetentionInDays: 14

  # Log group for Lambda function logs
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-validation'
      RetentionInDays: 14

  # Log group for S3 events
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}'
      RetentionInDays: 7

  # Log group for CodePipeline
  PipelineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codepipeline/${ProjectName}'
      RetentionInDays: 14

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================
  
  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-codepipeline-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 permissions for source and artifacts
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${SourceCodeBucket}/*'
                  - !Sub '${ArtifactsBucket}/*'
                  - !GetAtt SourceCodeBucket.Arn
                  - !GetAtt ArtifactsBucket.Arn
              # CodeBuild permissions
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: !GetAtt CodeBuildProject.Arn
              # Lambda permissions
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource: !GetAtt ValidationLambda.Arn
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codepipeline/*'

  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-codebuild-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*'
              # S3 permissions for artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource:
                  - !Sub '${SourceCodeBucket}/*'
                  - !Sub '${ArtifactsBucket}/*'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role'
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
              # CodePipeline permissions to signal success/failure
              - Effect: Allow
                Action:
                  - codepipeline:PutJobSuccessResult
                  - codepipeline:PutJobFailureResult
                Resource: '*'
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              # S3 permissions to read artifacts
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${ArtifactsBucket}/*'

  # ============================================================================
  # LAMBDA FUNCTION
  # ============================================================================
  
  # Validation Lambda Function
  ValidationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-validation-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      Environment:
        Variables:
          PROJECT_NAME: !Ref ProjectName
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              """
              Lambda function to validate deployment
              This function acts as a quality gate in the CI/CD pipeline
              """
              
              # Initialize CodePipeline client
              codepipeline = boto3.client('codepipeline')
              
              try:
                  # Extract job details from the event
                  job_id = event['CodePipeline.job']['id']
                  input_artifacts = event['CodePipeline.job']['data']['inputArtifacts']
                  
                  logger.info(f"Starting validation for job: {job_id}")
                  logger.info(f"Input artifacts: {input_artifacts}")
                  
                  # Perform validation checks
                  validation_result = perform_validation_checks(input_artifacts)
                  
                  if validation_result['success']:
                      logger.info("Validation successful")
                      codepipeline.put_job_success_result(jobId=job_id)
                      return {
                          'statusCode': 200,
                          'body': json.dumps('Validation successful')
                      }
                  else:
                      logger.error(f"Validation failed: {validation_result['message']}")
                      codepipeline.put_job_failure_result(
                          jobId=job_id,
                          failureDetails={'message': validation_result['message']}
                      )
                      return {
                          'statusCode': 400,
                          'body': json.dumps(f"Validation failed: {validation_result['message']}")
                      }
                      
              except Exception as e:
                  logger.error(f"Error in validation function: {str(e)}")
                  codepipeline.put_job_failure_result(
                      jobId=job_id,
                      failureDetails={'message': f'Validation error: {str(e)}'}
                  )
                  return {
                      'statusCode': 500,
                      'body': json.dumps(f'Error: {str(e)}')
                  }
          
          def perform_validation_checks(input_artifacts):
              """
              Perform actual validation checks
              This is where you would implement your specific validation logic
              """
              try:
                  # Example validation checks
                  project_name = os.environ.get('PROJECT_NAME', 'unknown')
                  
                  # Check 1: Verify artifacts exist
                  if not input_artifacts:
                      return {
                          'success': False,
                          'message': 'No input artifacts found'
                      }
                  
                  # Check 2: Basic environment validation
                  logger.info(f"Validating deployment for project: {project_name}")
                  
                  # Check 3: Add your custom validation logic here
                  # For example:
                  # - Verify configuration files
                  # - Check environment variables
                  # - Validate deployment targets
                  # - Run smoke tests
                  
                  logger.info("All validation checks passed")
                  return {
                      'success': True,
                      'message': 'All validation checks passed'
                  }
                  
              except Exception as e:
                  return {
                      'success': False,
                      'message': f'Validation check failed: {str(e)}'
                  }

  # ============================================================================
  # CODEBUILD PROJECT
  # ============================================================================
  
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
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        EnvironmentVariables:
          - Name: PROJECT_NAME
            Value: !Ref ProjectName
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
                - echo "Pre-build phase started on `date`"
                - echo "Project Name: $PROJECT_NAME"
                - echo "AWS Region: $AWS_DEFAULT_REGION"
                - echo "AWS Account ID: $AWS_ACCOUNT_ID"
            build:
              commands:
                - echo "Build phase started on `date`"
                - echo "Compiling the source code..."
                # Add your build commands here
                # For example:
                # - npm install (for Node.js projects)
                # - mvn compile (for Java projects)
                # - pip install -r requirements.txt (for Python projects)
                - echo "Running tests..."
                # Add your test commands here
                # For example:
                # - npm test
                # - mvn test
                # - python -m pytest
                - echo "Packaging application..."
                # Add your packaging commands here
            post_build:
              commands:
                - echo "Post-build phase started on `date`"
                - echo "Build completed successfully"
          artifacts:
            files:
              - '**/*'
            name: !Sub '${ProjectName}-$(date +%Y-%m-%d)'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup

  # ============================================================================
  # SNS TOPIC FOR NOTIFICATIONS
  # ============================================================================
  
  PipelineNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-pipeline-notifications'
      DisplayName: 'CI/CD Pipeline Notifications'

  PipelineNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref PipelineNotificationTopic
      Endpoint: !Ref NotificationEmail

  # ============================================================================
  # CODEPIPELINE
  # ============================================================================
  
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
                Provider: S3
                Version: '1'
              Configuration:
                S3Bucket: !Ref SourceCodeBucket
                S3ObjectKey: source.zip
                PollForSourceChanges: true
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
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        
        # Validation Stage
        - Name: Validation
          Actions:
            - Name: ValidationAction
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
                Version: '1'
              Configuration:
                FunctionName: !Ref ValidationLambda
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

  # ============================================================================
  # CLOUDWATCH EVENTS FOR PIPELINE MONITORING
  # ============================================================================
  
  PipelineEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-pipeline-events'
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
      State: ENABLED
      Targets:
        - Arn: !Ref PipelineNotificationTopic
          Id: PipelineNotificationTarget

  # Permission for EventBridge to publish to SNS
  PipelineEventRulePermission:
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
            Action: sns:Publish
            Resource: !Ref PipelineNotificationTopic

# ============================================================================
# OUTPUTS
# ============================================================================

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
    Description: 'Name of the S3 bucket for build artifacts'
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactsBucket'

  CodeBuildProjectName:
    Description: 'Name of the CodeBuild project'
    Value: !Ref CodeBuildProject
    Export:
      Name: !Sub '${AWS::StackName}-CodeBuildProject'

  ValidationLambdaName:
    Description: 'Name of the validation Lambda function'
    Value: !Ref ValidationLambda
    Export:
      Name: !Sub '${AWS::StackName}-ValidationLambda'

  PipelineConsoleURL:
    Description: 'URL to view the pipeline in AWS Console'
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view'

  SourceBucketConsoleURL:
    Description: 'URL to view the source bucket in AWS Console'
    Value: !Sub 'https://console.aws.amazon.com/s3/buckets/${SourceCodeBucket}'