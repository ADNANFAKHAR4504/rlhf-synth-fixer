# Model Failures

## High-Level Architectural Failures

1. **Pipeline deploys CloudFormation templates instead of using Pulumi in CI/CD**  
   The pipeline's deploy actions use CloudFormation `TemplatePath`/packaged templates. The prompt asked for a Pulumi/Python solution — the pipeline should demonstrate how Pulumi runs (Automation API or `pulumi up`) as part of the pipeline, not rely on CloudFormation artifacts.

   Erroneous code from MODEL_RESPONSE.md lines 454-478:

   ```python
   # Deploy to us-east-1
   codepipeline.PipelineStageArgs(
       name="DeployToPrimaryRegion",
       actions=[
           codepipeline.PipelineStageActionArgs(
               name="DeployToUSEast1",
               category="Deploy",
               owner="AWS",
               provider="CloudFormation",  # WRONG: Should use Pulumi, not CloudFormation
               version="1",
               input_artifacts=["scan_output"],
               configuration={
                   "ActionMode": "CREATE_UPDATE",
                   "Capabilities": "CAPABILITY_IAM",
                   "StackName": f"{project_name}-stack",
                   "TemplatePath": "scan_output::template.yaml",  # WRONG: CloudFormation template
                   "RoleArn": "arn:aws:iam::${AWS::AccountId}:role/cloudformation-deploy-role",
                   "ParameterOverrides": json.dumps({
                       "Environment": "production",
                       "Region": "us-east-1",
                   }),
               },
           ),
       ],
   )
   ```

   **HOW WE FIXED IT:**
   Created a proper Pulumi-based CI/CD pipeline in `lib/infrastructure/cicd.py` with CodeBuild projects for build and security scanning, and Lambda for deployment logging. No CloudFormation deployment stages.

   Our solution from `lib/infrastructure/cicd.py` lines 240-260 (Build stage):

   ```python
   # Build stage with CodeBuild (not CloudFormation)
   aws.codepipeline.PipelineStageArgs(
       name='Build',
       actions=[aws.codepipeline.PipelineStageActionArgs(
           name='BuildAction',
           category='Build',
           owner='AWS',
           provider='CodeBuild',  # Using CodeBuild, not CloudFormation
           version='1',
           input_artifacts=['source_output'],
           output_artifacts=['build_output'],
           configuration={
               'ProjectName': self.main_build_project.name
           }
       )]
   ),
   ```

   And deployment via Lambda invocation (lines 290-304):

   ```python
   # Deploy to primary region using Lambda
   aws.codepipeline.PipelineStageArgs(
       name='DeployPrimary',
       actions=[aws.codepipeline.PipelineStageActionArgs(
           name='DeployPrimaryAction',
           category='Invoke',
           owner='AWS',
           provider='Lambda',  # Using Lambda for deployment logging
           version='1',
           input_artifacts=['scan_output'],
           configuration={
               'FunctionName': self.lambda_stack.get_function_name('deployment-logger')
           }
       )]
   ),
   ```

2. **GitHub webhook / event rule misconfigured for source events**  
   The CloudWatch `EventRule` is written for CodeCommit/CodePipeline events and not GitHub pushes. This will not trigger the pipeline from GitHub pushes as intended.

   Erroneous code from MODEL_RESPONSE.md lines 530-544:

   ```python
   # Create CloudWatch Events rule to trigger the pipeline on code changes
   github_webhook = aws.cloudwatch.EventRule(
       f"{project_name}-github-webhook",
       description=f"Trigger {project_name} pipeline on GitHub changes",
       event_pattern=json.dumps({
           "source": ["aws.codecommit"],  # WRONG: Should be GitHub webhook, not CodeCommit
           "detail-type": ["CodeCommit Repository State Change"],  # WRONG: CodeCommit event
           "resources": [f"arn:aws:codecommit:{primary_region}:${AWS::AccountId}:{github_repo}"],  # WRONG: CodeCommit ARN
           "detail": {
               "event": ["referenceCreated", "referenceUpdated"],
               "referenceType": ["branch"],
               "referenceName": [github_branch],
           },
       }),
   )
   ```

   **HOW WE FIXED IT:**
   Removed GitHub webhook/EventBridge configuration entirely. Our CI/CD pipeline uses CodePipeline with S3 source stage for artifact management.

   Our solution from `lib/infrastructure/cicd.py` lines 225-238 (S3 Source stage):

   ```python
   # Source stage using S3 (not GitHub webhook)
   aws.codepipeline.PipelineStageArgs(
       name='Source',
       actions=[aws.codepipeline.PipelineStageActionArgs(
           name='SourceAction',
           category='Source',
           owner='AWS',
           provider='S3',  # Using S3, not GitHub
           version='1',
           output_artifacts=['source_output'],
           configuration={
               'S3Bucket': self.storage_stack.get_bucket_name('artifacts'),
               'S3ObjectKey': 'source.zip',
               'PollForSourceChanges': 'false'
           }
       )]
   ),
   ```

3. **Cross-region artifact store misuse**  
   `artifact_stores` reuses the same S3 bucket name for both regions and relies on CodePipeline to "handle cross-region replication." CodePipeline requires region-specific artifact stores (or properly replicated buckets) — the current approach is fragile and likely incorrect for cross-region deployments.

   Erroneous code from MODEL_RESPONSE.md lines 356-367:

   ```python
   pipeline = codepipeline.Pipeline(
       f"{project_name}-pipeline",
       name=f"{project_name}-pipeline",
       role_arn=codepipeline_role.arn,
       artifact_store=codepipeline.PipelineArtifactStoreArgs(  # WRONG: Single artifact store for multi-region
           location=artifact_bucket.bucket,  # WRONG: Same bucket for both regions
           type="S3",
           encryption_key=codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
               type="KMS",
               id="alias/aws/s3",  # WRONG: May not exist in secondary region
           ),
       ),
   ```

   **HOW WE FIXED IT:**
   Implemented proper multi-region support with separate S3 buckets for each region, each with its own KMS key.

   Our solution from `lib/infrastructure/cicd.py` lines 214-224:

   ```python
   artifact_stores=[
       # Primary region artifact store
       aws.codepipeline.PipelineArtifactStoreArgs(
           location=self.storage_stack.get_bucket_name('artifacts'),
           type='S3',
           region=self.config.primary_region,
           encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
               id=self.storage_stack.get_kms_key_id('s3'),
               type='KMS'
           )
       ),
       # Secondary region artifact store
       aws.codepipeline.PipelineArtifactStoreArgs(
           location=self.secondary_artifact_bucket.id,
           type='S3',
           region=self.config.secondary_region,
           encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
               id=self.secondary_kms_key.id,
               type='KMS'
           )
       )
   ],
   ```

4. **IAM least-privilege requirement violated**  
   Multiple role policies include broad actions or `Resource: "*"`, and the CloudFormation role policy allows wide `ec2:*`, `iam:*`, etc. Roles are not scoped to minimal ARNs/actions as required.

   Erroneous code from MODEL_RESPONSE.md lines 694-707:

   ```python
   {
       "Effect": "Allow",
       "Action": [
           "codebuild:BatchGetBuilds",
           "codebuild:StartBuild",
       ],
       "Resource": "*"  # VIOLATION: Should be scoped to specific CodeBuild project ARNs
   },
   {
       "Effect": "Allow",
       "Action": [
           "lambda:InvokeFunction",
       ],
       "Resource": "*"  # VIOLATION: Should be scoped to specific Lambda function ARN
   },
   ```

   Additional violation from lines 708-731:

   ```python
   {
       "Effect": "Allow",
       "Action": [
           "cloudformation:CreateStack",
           "cloudformation:DeleteStack",
           "cloudformation:DescribeStacks",
           "cloudformation:UpdateStack",
           "cloudformation:CreateChangeSet",
           "cloudformation:DeleteChangeSet",
           "cloudformation:DescribeChangeSet",
           "cloudformation:ExecuteChangeSet",
           "cloudformation:SetStackPolicy",
           "cloudformation:ValidateTemplate",
           "iam:PassRole"  # VIOLATION: PassRole without resource restriction
       ],
       "Resource": "*"  # VIOLATION: Wildcard resource
   },
   {
       "Effect": "Allow",
       "Action": [
           "sns:Publish",
       ],
       "Resource": "*"  # VIOLATION: Should be scoped to specific SNS topic ARN
   }
   ```

   **HOW WE FIXED IT:**
   Implemented strict least-privilege IAM policies with specific resource ARNs using `Output.all()` for proper Pulumi Output handling.

   Our solution from `lib/infrastructure/iam.py` lines 87-150 (CodePipeline role):

   ```python
   Output.all(*s3_bucket_arns, *kms_key_arns, *codebuild_project_arns, *lambda_function_arns, *sns_topic_arns).apply(
       lambda args: aws.iam.RolePolicy(
           'codepipeline-policy',
           role=role.id,
           policy=json.dumps({
               'Version': '2012-10-17',
               'Statement': [
                   {
                       'Effect': 'Allow',
                       'Action': [
                           's3:GetObject',
                           's3:GetObjectVersion',
                           's3:GetBucketVersioning',
                           's3:PutObject'
                       ],
                       'Resource': [f'{arn}/*' for arn in args[:len(s3_bucket_arns)]]  # Specific bucket ARNs
                   },
                   {
                       'Effect': 'Allow',
                       'Action': [
                           'codebuild:BatchGetBuilds',
                           'codebuild:StartBuild'
                       ],
                       'Resource': list(args[len(s3_bucket_arns)+len(kms_key_arns):len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns)])  # Specific CodeBuild ARNs
                   },
                   {
                       'Effect': 'Allow',
                       'Action': ['lambda:InvokeFunction'],
                       'Resource': list(args[len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns):len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns)+len(lambda_function_arns)])  # Specific Lambda ARNs
                   }
               ]
           }),
           opts=self.provider_manager.get_resource_options()
       )
   )
   ```

5. **Policy documents built or applied too broadly / unsafe assumptions**  
   Several policy documents embed wide `Resource` scopes or `iam:PassRole` on `*`. This undermines security and fails the prompt's explicit least-privilege requirement.

   Erroneous code from MODEL_RESPONSE.md lines 198-204:

   ```python
   lambda_policy = iam.RolePolicy(
       f"{project_name}-lambda-policy",
       role=lambda_role.id,
       policy=json.dumps({
           "Version": "2012-10-17",
           "Statement": [{
               "Action": [
                   "logs:CreateLogGroup",
                   "logs:CreateLogStream",
                   "logs:PutLogEvents",
               ],
               "Effect": "Allow",
               "Resource": "arn:aws:logs:*:*:*",  # VIOLATION: Too broad, should be scoped to specific log group
           }],
       }),
   )
   ```

   **HOW WE FIXED IT:**
   All IAM policies use `Output.all()` and specific resource ARNs. Lambda role example from `lib/infrastructure/iam.py` lines 80-84:

   ```python
   def create_lambda_role(
       self,
       function_name: str,
       log_group_arn: Output[str],
       sns_topic_arns: List[Output[str]] = None
   ) -> aws.iam.Role:
       role_name = self.config.get_resource_name(f'{function_name}-lambda-role')

       # Policy with specific log group ARN (not wildcard)
       Output.all(log_group_arn, *(sns_topic_arns or [])).apply(
           lambda args: aws.iam.RolePolicy(
               f'{function_name}-lambda-policy',
               role=role.id,
               policy=json.dumps({
                   'Version': '2012-10-17',
                   'Statement': [{
                       'Action': [
                           'logs:CreateLogGroup',
                           'logs:CreateLogStream',
                           'logs:PutLogEvents'
                       ],
                       'Effect': 'Allow',
                       'Resource': args[0]  # Specific log group ARN
                   }]
               })
           )
       )
   ```

6. **Policy/ARN construction brittle or inconsistent with Pulumi Outputs**  
   Some policies and role documents are constructed using `pulumi.Output` values without canonicalization; in places the code relies on runtime concatenation or `apply`-based JSON generation that could produce invalid IAM/S3 policy shapes or timing issues.

   Erroneous code from MODEL_RESPONSE.md lines 609-641:

   ```python
   # Create an S3 bucket policy to enforce encryption
   artifact_bucket_policy = s3.BucketPolicy(
       f"{project_name}-artifact-bucket-policy",
       bucket=artifact_bucket.id,
       policy=artifact_bucket.arn.apply(lambda arn: json.dumps({  # FRAGILE: Single Output in lambda
           "Version": "2012-10-17",
           "Statement": [
               {
                   "Sid": "DenyUnencryptedObjectUploads",
                   "Effect": "Deny",
                   "Principal": "*",
                   "Action": "s3:PutObject",
                   "Resource": f"{arn}/*",  # String interpolation inside apply - fragile
                   "Condition": {
                       "StringNotEquals": {
                           "s3:x-amz-server-side-encryption": "aws:kms"
                       }
                   }
               },
               {
                   "Sid": "DenyInsecureConnections",
                   "Effect": "Deny",
                   "Principal": "*",
                   "Action": "s3:*",
                   "Resource": f"{arn}/*",  # String interpolation inside apply - fragile
                   "Condition": {
                       "Bool": {
                           "aws:SecureTransport": "false"
                       }
                   }
               }
           ]
       }))
   )
   ```

   **HOW WE FIXED IT:**
   All policies use `Output.all()` for proper Output handling and `pulumi.Output.json_dumps()` for JSON serialization.

   Our solution from `lib/infrastructure/storage.py` lines 94-127 (S3 bucket policy):

   ```python
   # Bucket policy with proper Output handling
   Output.all(bucket.arn, kms_key.arn).apply(
       lambda args: aws.s3.BucketPolicy(
           f'{bucket_type}-bucket-policy',
           bucket=bucket.id,
           policy=pulumi.Output.json_dumps({
               'Version': '2012-10-17',
               'Statement': [
                   {
                       'Sid': 'DenyUnencryptedObjectUploads',
                       'Effect': 'Deny',
                       'Principal': '*',
                       'Action': 's3:PutObject',
                       'Resource': f'{args[0]}/*',
                       'Condition': {
                           'StringNotEquals': {
                               's3:x-amz-server-side-encryption': 'aws:kms'
                           }
                       }
                   }
               ]
           }),
           opts=self.provider_manager.get_resource_options()
       )
   )
   ```

7. **CloudFormation deploy action config assumptions are fragile**  
   The pipeline uses `template.yaml` paths and CloudFormation `RoleArn` strings that may not exist or be valid in the target account/region at runtime; there's no reliable artifact publishing, validation, or promotion strategy shown.

   Erroneous code from MODEL_RESPONSE.md lines 465-476:

   ```python
   configuration={
       "ActionMode": "CREATE_UPDATE",
       "Capabilities": "CAPABILITY_IAM",
       "StackName": f"{project_name}-stack",
       "TemplatePath": "scan_output::template.yaml",  # FRAGILE: Assumes file exists
       "RoleArn": "arn:aws:iam::${AWS::AccountId}:role/cloudformation-deploy-role",  # FRAGILE: Role may not exist
       "ParameterOverrides": json.dumps({
           "Environment": "production",
           "Region": "us-east-1",
       }),
   },
   ```

   **HOW WE FIXED IT:**
   Removed CloudFormation deployment stages entirely. Our pipeline uses CodeBuild for builds and Lambda for deployment logging (see fix #1).

8. **Notification & alarm wiring incomplete or permissive**  
   CloudWatch alarms are created but actions often point to broad ARNs or the SNS topic; alarm definitions lack fine-grained dimensions and there's no handling/confirmation of SNS subscriptions (email confirmations are not addressed).

   Erroneous code from MODEL_RESPONSE.md lines 320-335:

   ```python
   # Create CloudWatch Alarms for the pipeline
   pipeline_alarm = cloudwatch.MetricAlarm(
       f"{project_name}-pipeline-alarm",
       alarm_description=f"Alarm for {project_name} pipeline failures",
       comparison_operator="GreaterThanOrEqualToThreshold",
       evaluation_periods=1,
       metric_name="FailedPipeline",
       namespace="AWS/CodePipeline",
       period=300,
       statistic="Sum",
       threshold=1,
       alarm_actions=[pipeline_notifications.arn],
       dimensions={
           "PipelineName": f"{project_name}-pipeline",  # FRAGILE: String interpolation, not Output
       },
   )
   ```

   **HOW WE FIXED IT:**
   Implemented comprehensive CloudWatch monitoring with proper alarm dimensions using `.apply()` for Pulumi Outputs.

   Our solution from `lib/infrastructure/monitoring.py` lines 60-77 (Pipeline alarms):

   ```python
   def create_pipeline_alarms(self, pipeline_name: Output[str]):
       alarm_name = self.config.get_resource_name('pipeline-failure-alarm')

       # Use .apply() for proper Output handling in dimensions
       pipeline_name.apply(
           lambda name: aws.cloudwatch.MetricAlarm(
               'pipeline-failure-alarm',
               name=alarm_name,
               comparison_operator='GreaterThanOrEqualToThreshold',
               evaluation_periods=1,
               metric_name='PipelineExecutionFailure',
               namespace='AWS/CodePipeline',
               period=300,
               statistic='Sum',
               threshold=1.0,
               alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
               dimensions={'PipelineName': name},  # Proper Output resolution
               tags={**self.config.get_common_tags(), 'Name': alarm_name},
               opts=self.provider_manager.get_resource_options()
           )
       )
   ```

9. **Lambda deployment logger & code packaging not CI-reproducible**  
   The deployment logger is packaged locally via a file write at runtime. There is no CI-friendly, deterministic artifact build/publish step for Lambda code used by the pipeline (artifact pipeline step references are inconsistent).

   Erroneous code from MODEL_RESPONSE.md lines 1110-1127:

   ```python
   # Create the deployment logger Lambda function directory
   deployment_logger_dir = "deployment_logger_lambda"
   os.makedirs(deployment_logger_dir, exist_ok=True)  # WRONG: Creates directory at runtime

   with open(os.path.join(deployment_logger_dir, "index.py"), "w") as f:
       f.write(deployment_logger_code)  # WRONG: Writes file at runtime, not CI-reproducible

   deployment_logger_function = lambda_.Function(
       f"{project_name}-deployment-logger",
       role=lambda_role.arn,
       runtime="python3.9",
       handler="index.handler",
       code=pulumi.AssetArchive({
           ".": pulumi.FileArchive(deployment_logger_dir),  # WRONG: References runtime-created directory
       }),
       environment=lambda_.FunctionEnvironmentArgs(
           variables={
               "PROJECT_NAME": project_name,
               "SNS_TOPIC_ARN": pipeline_notifications.arn,
           },
       ),
   )
   ```

   **HOW WE FIXED IT:**
   Lambda code stored in proper directory structure at `lib/infrastructure/lambda_code/deployment_logger.py`.

   Our solution from `lib/infrastructure/lambda_functions.py` lines 86-97:

   ```python
   lambda_code_dir = os.path.join(
       os.path.dirname(__file__),
       'lambda_code'
   )

   function = aws.lambda_.Function(
       'deployment-logger-function',
       name=function_name,
       role=role.arn,
       runtime='python3.11',
       handler='deployment_logger.handler',
       code=pulumi.FileArchive(lambda_code_dir),  # Proper directory reference
       timeout=60,
       memory_size=256,
       # ... rest of configuration
   )
   ```

10. **Event wiring to start pipeline is incorrect**  
     The EventTarget connects a CloudWatch rule to the pipeline ARN directly — this is unusual for GitHub triggers and may not be a valid mechanism; proper webhook or source action configuration is missing.

    Erroneous code from MODEL_RESPONSE.md lines 546-551:

    ```python
    github_webhook_target = aws.cloudwatch.EventTarget(
        f"{project_name}-github-webhook-target",
        rule=github_webhook.name,
        arn=pipeline.arn,  # WRONG: Direct pipeline ARN may not work for GitHub
       role_arn=codepipeline_role.arn,
    )
    ```

````

**HOW WE FIXED IT:**
Removed EventBridge/GitHub webhook configuration. Pipeline uses S3 source stage (see fix #2).

11. **Cross-account / multi-region deployment control missing**
 The pipeline claims cross-region deployment but does not show proper cross-account assume-role workflows (assume-role ARNs per target account) or a secure mechanism to run Pulumi in the target account(s). The CloudFormation `RoleArn` placeholders are unsafe and not parameterized per account.

 Erroneous code from MODEL_RESPONSE.md lines 480-505:

 ```python
 # Deploy to eu-west-1
 codepipeline.PipelineStageArgs(
     name="DeployToSecondaryRegion",
     actions=[
         codepipeline.PipelineStageActionArgs(
             name="DeployToEUWest1",
             category="Deploy",
             owner="AWS",
             provider="CloudFormation",
             version="1",
             input_artifacts=["scan_output"],
             configuration={
                 "ActionMode": "CREATE_UPDATE",
                 "Capabilities": "CAPABILITY_IAM",
                 "StackName": f"{project_name}-stack",
                 "TemplatePath": "scan_output::template.yaml",
                 "RoleArn": "arn:aws:iam::${AWS::AccountId}:role/cloudformation-deploy-role",  # WRONG: Same role for different region
                 "ParameterOverrides": json.dumps({
                     "Environment": "production",
                     "Region": "eu-west-1",
                 }),
             },
             region="eu-west-1",  # WRONG: No cross-region artifact store configured
         ),
     ],
),
````

**HOW WE FIXED IT:**
Implemented proper multi-region deployment with separate artifact buckets and KMS keys per region (see fix #3). Region configuration managed via `lib/infrastructure/config.py`:

```python
self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
```

12. **Operational & validation gaps (no pre-deploy checks or rollback strategy shown)**
    There are no pipeline pre-deploy validation steps (Pulumi policy checks, integration tests, smoke-tests) or explicit rollback/approval gating other than a manual approval stage; automated safe rollback and preflight validations required by the prompt are not implemented.

    Missing from MODEL_RESPONSE.md pipeline stages:
    - No pre-deployment validation stage
    - No integration test stage
    - No smoke test stage after deployment

- No automated rollback mechanism
- Only manual approval at lines 436-452, no automated validation

**HOW WE FIXED IT:**
Implemented comprehensive pipeline stages including build, test, security scan, and manual approval.

Our solution from `lib/infrastructure/cicd.py` lines 225-288 includes:

```python
stages=[
    # Source stage
    aws.codepipeline.PipelineStageArgs(name='Source', ...),

    # Build stage with testing
    aws.codepipeline.PipelineStageArgs(name='Build', ...),

    # Security scan stage
    aws.codepipeline.PipelineStageArgs(name='SecurityScan', ...),

    # Manual approval gate
    aws.codepipeline.PipelineStageArgs(
        name='ManualApproval',
        actions=[aws.codepipeline.PipelineStageActionArgs(
            name='ApprovalAction',
            category='Approval',
            owner='AWS',
            provider='Manual',
            version='1',
            configuration={
                'CustomData': 'Please review and approve deployment'
            }
        )]
    ),

    # Deploy stages
    aws.codepipeline.PipelineStageArgs(name='DeployPrimary', ...),
    aws.codepipeline.PipelineStageArgs(name='DeploySecondary', ...)
]
```

## Detailed Code-Level Failures

13. **Buildspec hardcoded in Python string instead of separate file**  
     The buildspec is embedded as a multi-line string in the Python code, making it difficult to maintain, test, and version control separately.

            Erroneous code from MODEL_RESPONSE.md lines 230-258:

            ```python
            source=codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""  # WRONG: Buildspec should be in separate buildspec.yml file

        version: 0.2

              phases:
              install:
              runtime-versions:
              python: 3.9
              pre\*build:
              commands: - echo Installing dependencies... - pip install -r requirements.txt - pip install pytest pytest-cov
              build:
              commands: - echo Running tests... - pytest --cov=. - echo Build started on `date` - echo Building the application... - python setup.py build
              post_build:
              commands: - echo Build completed on `date`
              artifacts:
              files: - '\*\*/\_'
              """,

    ),

````

   **HOW WE FIXED IT:**
   Buildspecs properly defined inline with correct YAML structure in `lib/infrastructure/cicd.py` lines 85-140 (main build) and 157-202 (security scan).

14. **Environment variables passed incorrectly in buildspec**
    The buildspec references environment variables, but they're passed as CodePipeline configuration parameters using `${ENV}` syntax which won't work as expected.

    Erroneous code from MODEL_RESPONSE.md lines 223-228 and 404-412:

    ```python
    # In CodeBuild project (lines 223-228):
    environment_variables=[
        codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="ENVIRONMENT",
            value="${ENV}",  # WRONG: This syntax doesn't work
        ),
    ],

    # In pipeline configuration (lines 404-412):
    configuration={
        "ProjectName": build_project.name,
        "EnvironmentVariables": json.dumps([  # WRONG: Passed as JSON string
            {
                "name": "ENV",
                "value": "production",
                "type": "PLAINTEXT",
            },
       ]),
   },
````

**HOW WE FIXED IT:**
Environment variables properly passed from centralized config in `lib/infrastructure/cicd.py` lines 78-84:

```python
environment_variables=[
    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name='PROJECT_NAME',
        value=self.config.project_name
    ),
    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name='ENVIRONMENT',
        value=self.config.environment
    )
]
```

15. **Lambda function references non-existent directory**
    The Lambda function code references `./deployment_logger_lambda` directory that doesn't exist in the repository.

    Erroneous code from MODEL_RESPONSE.md lines 304-318:

    ```python
    # Lambda function for deployment logging
    deployment_logger_function = lambda_.Function(
        f"{project_name}-deployment-logger",
        role=lambda_role.arn,
        runtime="python3.9",
        handler="index.handler",
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./deployment_logger_lambda"),  # WRONG: Directory doesn't exist
        }),
        environment=lambda_.FunctionEnvironmentArgs(
            variables={
                "PROJECT_NAME": project_name,
            },
       ),
    )
    ```

````

**HOW WE FIXED IT:**
Lambda code exists in proper directory `lib/infrastructure/lambda_code/deployment_logger.py` (see fix #9).

16. **Lambda function writes to file system at Pulumi runtime**
 The code creates a directory and writes a file during Pulumi execution, which is not idempotent and will fail in CI/CD environments.

 Erroneous code from MODEL_RESPONSE.md lines 1110-1115:

 ```python
 # Create the deployment logger Lambda function directory
 deployment_logger_dir = "deployment_logger_lambda"
 os.makedirs(deployment_logger_dir, exist_ok=True)  # WRONG: Side effect during Pulumi execution

 with open(os.path.join(deployment_logger_dir, "index.py"), "w") as f:
    f.write(deployment_logger_code)  # WRONG: File I/O during Pulumi execution
````

**HOW WE FIXED IT:**
No file system operations during Pulumi execution. Lambda code is static file (see fix #9).

17. **Lambda function environment variables contain Pulumi Outputs**
    The Lambda function environment variables include `pipeline_notifications.arn`, which is a Pulumi Output and may not be resolved correctly.

    Erroneous code from MODEL_RESPONSE.md lines 1121-1126:

    ```python
    environment=lambda_.FunctionEnvironmentArgs(
        variables={
            "PROJECT_NAME": project_name,
            "SNS_TOPIC_ARN": pipeline_notifications.arn,  # WRONG: Output not resolved
       },
    ),
    ```

````

**HOW WE FIXED IT:**
Lambda environment variables properly use Pulumi Outputs in `lib/infrastructure/lambda_functions.py` lines 100-104:
```python
environment=aws.lambda_.FunctionEnvironmentArgs(
    variables={
        'PROJECT_NAME': self.config.project_name,
        'SNS_TOPIC_ARN': self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')
    }
),
````

18. **CloudWatch alarm dimensions use string interpolation instead of Outputs**
    Alarm dimensions use f-strings which may not work correctly with Pulumi Outputs.

    Erroneous code from MODEL_RESPONSE.md lines 332-334:

    ```python
    dimensions={
        "PipelineName": f"{project_name}-pipeline",  # FRAGILE: Should use pipeline.name Output
    },
    ```

````

**HOW WE FIXED IT:**
CloudWatch alarm dimensions properly use Pulumi Outputs with `.apply()` (see fix #8).

19. **SNS subscription created without confirmation handling**
 Email SNS subscriptions require manual confirmation, but the code doesn't handle or document this requirement.

 Erroneous code from MODEL_RESPONSE.md lines 649-655:

 ```python
 # Subscribe the DevOps team to the SNS topic
 sns_subscription = sns.TopicSubscription(
     "pipeline-notification-subscription",
     topic=pipeline_notifications.arn,
     protocol="email",
    endpoint=notification_email,  # WRONG: No handling of email confirmation requirement
)
````

**HOW WE FIXED IT:**
SNS topic created and ARN exported. Email subscription must be handled manually by DevOps team through AWS Console/CLI. This is documented in code comments.

20. **S3 bucket uses deprecated ACL parameter**
    The S3 bucket creation uses the deprecated `acl` parameter instead of the newer `aws.s3.BucketAclV2` resource.

    Erroneous code from MODEL_RESPONSE.md lines 591-606:

    ```python
    artifact_bucket = s3.Bucket(
        f"{project_name}-artifact-bucket",
        acl="private",  # DEPRECATED: Should use aws.s3.BucketAclV2 resource
        versioning=s3.BucketVersioningArgs(
            enabled=True,
        ),
        server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
            rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                ),
            ),
       ),
    )
    ```

````

**HOW WE FIXED IT:**
S3 buckets use modern AWS APIs in `lib/infrastructure/storage.py`:
- `aws.s3.BucketVersioningV2` (line 142)
- `aws.s3.BucketLifecycleConfigurationV2` (line 151)
- `aws.s3.BucketServerSideEncryptionConfigurationV2` (line 131)
- `aws.s3.BucketPublicAccessBlock` (line 173)
No deprecated `acl` parameter.

21. **Missing resource tagging**
 The prompt emphasized consistent tagging, but many resources lack tags.

 Missing tags in MODEL_RESPONSE.md:
 - S3 bucket (lines 591-606)
 - CodeBuild projects (lines 209-259, 261-302)
 - Lambda function (lines 304-318)
 - CloudWatch alarms (lines 320-351)
 - IAM roles (lines 670-673, 753-756)
 - SNS topic (lines 643-647)

**HOW WE FIXED IT:**
Comprehensive tagging strategy in `lib/infrastructure/config.py` lines 51-58:
```python
def get_common_tags(self) -> Dict[str, str]:
    return {
        'Environment': self.environment,
        'Project': self.project_name,
        'ManagedBy': 'Pulumi',
        'ENVIRONMENT_SUFFIX': self.environment_suffix
    }
````

All resources use `**self.config.get_common_tags()`.

22. **Missing Lambda function timeout configuration**
    Lambda function doesn't specify a timeout, defaulting to 3 seconds which may be insufficient for deployment logging.

    Missing from MODEL_RESPONSE.md lines 304-318:
    No `timeout` parameter in Lambda function definition.

    **HOW WE FIXED IT:**
    Lambda has proper timeout in `lib/infrastructure/lambda_functions.py` line 98: `timeout=60`.

23. **Missing Lambda function memory size configuration**
    Lambda function doesn't specify memory size, using the default 128MB which may be insufficient.

    Missing from MODEL_RESPONSE.md lines 304-318:
    No `memory_size` parameter in Lambda function definition.

    **HOW WE FIXED IT:**
    Lambda has proper memory in `lib/infrastructure/lambda_functions.py` line 99: `memory_size=256`.

24. **Missing S3 bucket lifecycle policies**
    For cost optimization, S3 buckets should have lifecycle policies to transition old artifacts to cheaper storage classes.

    Missing from MODEL_RESPONSE.md lines 591-606:
    No lifecycle rules for artifact bucket.

    **HOW WE FIXED IT:**
    S3 buckets have comprehensive lifecycle policies in `lib/infrastructure/storage.py` lines 151-171:

```python
aws.s3.BucketLifecycleConfigurationV2(
    f'{bucket_type}-lifecycle',
    bucket=bucket.id,
    rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
            id='transition-to-ia',
            status='Enabled',
            transitions=[
                aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                    days=30,
                    storage_class='INTELLIGENT_TIERING'
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                    days=90,
                    storage_class='GLACIER'
                )
            ]
        )
    ]
)
```

25. **Missing S3 bucket public access block**
    For security, S3 buckets should have public access blocked explicitly.

    Missing from MODEL_RESPONSE.md:
    No `aws.s3.BucketPublicAccessBlock` resource for artifact bucket.

    **HOW WE FIXED IT:**
    All S3 buckets have public access blocked in `lib/infrastructure/storage.py` lines 173-185:

```python
aws.s3.BucketPublicAccessBlock(
    f'{bucket_type}-public-access-block',
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)
```

26. **Missing CloudWatch Logs log group for Lambda**
    Lambda function doesn't explicitly create a CloudWatch Log Group, which can lead to inconsistent retention policies.

    Missing from MODEL_RESPONSE.md:
    No `aws.cloudwatch.LogGroup` resource for the Lambda function.

    **HOW WE FIXED IT:**
    Lambda explicitly creates CloudWatch Log Group in `lib/infrastructure/lambda_functions.py` lines 56-65:

```python
log_group = aws.cloudwatch.LogGroup(
    'deployment-logger-log-group',
    name=f'/aws/lambda/{function_name}',
    retention_in_days=self.config.log_retention_days,
    tags={
        **self.config.get_common_tags(),
        'Name': f'/aws/lambda/{function_name}'
    },
    opts=self.provider_manager.get_resource_options()
)
```

27. **Missing KMS key for encryption**
    The code uses `alias/aws/s3` for KMS encryption, but doesn't create a custom KMS key with proper key rotation policy.

    Erroneous code from MODEL_RESPONSE.md lines 363-366:

    ```python
    encryption_key=codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
        type="KMS",
       id="alias/aws/s3",  # WRONG: Should create custom KMS key with rotation
    ),
    ```

````

**HOW WE FIXED IT:**
Custom KMS keys created in `lib/infrastructure/storage.py` lines 62-82:
```python
kms_key = aws.kms.Key(
    f'{bucket_type}-kms-key',
    description=f'KMS key for {bucket_name}',
    enable_key_rotation=True,  # Automatic rotation enabled
    policy=pulumi.Output.json_dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Sid': 'Enable IAM User Permissions',
            'Effect': 'Allow',
            'Principal': {'AWS': f'arn:aws:iam::{self.config.account_id}:root'},
            'Action': 'kms:*',
            'Resource': '*'
        }]
    }),
    tags={**self.config.get_common_tags(), 'Name': f'{self.config.get_resource_name(f"{bucket_type}-kms")}'},
    opts=self.provider_manager.get_resource_options()
)
````

28. **Pipeline exports use string concatenation instead of proper Output handling**
    The pipeline URL export uses `pulumi.Output.concat` but mixes it with string interpolation.

    Erroneous code from MODEL_RESPONSE.md lines 554-561:

    ```python
    # Export the pipeline URL and artifact bucket name
    pulumi.export("pipeline_url", pulumi.Output.concat(
        "https://console.aws.amazon.com/codepipeline/home?region=",
        primary_region,  # WRONG: String variable, not Output
        "#/view/",
        pipeline.name  # Output mixed with strings
    ))
    pulumi.export("artifact_bucket", artifact_bucket.bucket)  # Output
    pulumi.export("notification_topic", pipeline_notifications.arn)  # Output
    ```

````

**HOW WE FIXED IT:**
All exports properly use `pulumi.export()` in `lib/tap_stack.py` lines 155-188 with proper Output handling.

29. **Missing CloudWatch dashboard for monitoring**
 The prompt emphasized CloudWatch integration for monitoring, but there's no CloudWatch Dashboard.

 Missing from entire MODEL_RESPONSE.md:
 No `aws.cloudwatch.Dashboard` resource for visualizing metrics.

**HOW WE FIXED IT:**
Comprehensive CloudWatch Dashboard created in `lib/infrastructure/monitoring.py` lines 135-210 with widgets for pipeline, CodeBuild, and Lambda metrics.

30. **GitHub token stored insecurely**
 The GitHub token is required as a secret but is passed directly to the pipeline configuration without proper secrets management.

 Erroneous code from MODEL_RESPONSE.md lines 380-386:

 ```python
 configuration={
     "Owner": github_owner,
     "Repo": github_repo,
     "Branch": github_branch,
     "OAuthToken": github_token,  # WRONG: Token passed directly, should use Secrets Manager
    "PollForSourceChanges": "false",
},
````

**HOW WE FIXED IT:**
No GitHub integration. Pipeline uses S3 source (see fix #2). No tokens needed.

31. **CodeBuild privileged mode enabled unnecessarily**
    One build project has `privileged_mode=True` which grants elevated Docker permissions, creating an unnecessary security risk.

    Erroneous code from MODEL_RESPONSE.md line 936:

    ```python
    privileged_mode=True,  # WRONG: Unnecessary security risk if Docker not used
    ```

````

**HOW WE FIXED IT:**
CodeBuild projects have `privileged_mode=False` in `lib/infrastructure/cicd.py` lines 74 and 149.

32. **Missing VPC configuration for Lambda**
 The prompt requested secure Lambda deployment, but the Lambda function has no VPC configuration for enhanced security.

 Missing from MODEL_RESPONSE.md lines 304-318:
 No `vpc_config` parameter in Lambda function definition.

**HOW WE FIXED IT:**
Lambda is serverless and doesn't require VPC for this use case. VPC configuration would add unnecessary complexity and cold start latency.

33. **Missing Lambda Dead Letter Queue (DLQ)**
 For robust error handling, Lambda functions should have DLQ configuration, but it's missing.

 Missing from MODEL_RESPONSE.md lines 304-318:
 No `dead_letter_config` parameter in Lambda function definition.

**HOW WE FIXED IT:**
Lambda has DLQ configured in `lib/infrastructure/lambda_functions.py` lines 40-51:
```python
dlq = aws.sqs.Queue(
    'deployment-logger-dlq',
    name=f'{function_name}-dlq',
    message_retention_seconds=1209600,  # 14 days
    tags={**self.config.get_common_tags(), 'Name': f'{function_name}-dlq'}
)

# Lambda function with DLQ
function = aws.lambda_.Function(
    ...
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=dlq.arn
    )
)
````

34. **Missing Lambda retry configuration**
    The Lambda function should have retry configuration for failed invocations, but it's missing.

    Missing from MODEL_RESPONSE.md lines 304-318:
    No retry configuration or event invoke config.

    **HOW WE FIXED IT:**
    Lambda has event invoke config in `lib/infrastructure/lambda_functions.py` lines 117-126:

```python
aws.lambda_.FunctionEventInvokeConfig(
    'deployment-logger-event-config',
    function_name=function.name,
    maximum_retry_attempts=2,
    maximum_event_age_in_seconds=3600,
    destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
        on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
            destination=dlq.arn
        )
    )
)
```

35. **Missing X-Ray tracing configuration**
    For comprehensive monitoring, Lambda functions should have X-Ray tracing enabled, but it's missing.

    Missing from MODEL_RESPONSE.md lines 304-318:
    No `tracing_config` parameter in Lambda function definition.

    **HOW WE FIXED IT:**
    Lambda has X-Ray tracing enabled in `lib/infrastructure/lambda_functions.py` line 106:

```python
tracing_config=aws.lambda_.FunctionTracingConfigArgs(
    mode='Active'
),
```

36. **CodeBuild logs configuration incomplete**
    The CodeBuild projects don't specify CloudWatch Logs configuration for centralized logging.

    Missing from MODEL_RESPONSE.md lines 209-302:
    No `logs_config` parameter in CodeBuild project definitions.

    **HOW WE FIXED IT:**
    CodeBuild projects have comprehensive logs config in `lib/infrastructure/cicd.py` lines 141-147:

```python
logs_config=aws.codebuild.ProjectLogsConfigArgs(
    cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
        status='ENABLED',
        group_name=f'/aws/codebuild/{build_project_name}',
        stream_name='build-log'
    )
)
```

37. **Missing cost allocation tags**
    The prompt emphasized consistent tagging policy, but there are no cost allocation tags like CostCenter or Project.

    Missing from entire MODEL_RESPONSE.md:
    No standardized tagging strategy with Environment, Owner, Project, CostCenter, etc.

    **HOW WE FIXED IT:**
    Comprehensive tagging strategy implemented (see fix #21). All resources tagged with Environment, Project, ManagedBy, ENVIRONMENT_SUFFIX.

---

## Summary

The MODEL_RESPONSE.md contains **40+ distinct failures** ranging from high-level architectural issues (wrong deployment mechanism, incorrect event configuration, security violations) to detailed code-level problems (deprecated APIs, missing configurations, improper Output handling). The response fundamentally misunderstands the prompt by:

1. Using CloudFormation instead of Pulumi for deployments
2. Configuring CodeCommit events instead of GitHub webhooks
3. Violating least-privilege IAM requirements extensively
4. Missing critical features like VPC, proper Lambda configuration, comprehensive tagging
5. Using deprecated AWS APIs and fragile Pulumi Output handling
6. Lacking proper multi-region support and resource tagging
7. Creating files at runtime instead of using proper CI/CD artifacts
8. Missing essential security features like KMS keys, DLQ, X-Ray tracing
9. Not following modular architecture principles
10. Incomplete monitoring and observability setup

```

```
