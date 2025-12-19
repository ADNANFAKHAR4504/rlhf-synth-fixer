Task: Generate a complete, production-ready JSON CloudFormation template (one JSON document, nothing else) which provisions a CI/CD pipeline that deploys an application to an Amazon ECS cluster in us-east-1. The template must meet the following detailed requirements exactly:

1) Template format & output:
   - Output only a single JSON CloudFormation template. No commentary, no markdown, no explanation, no extra characters before or after the JSON.

2) Parameters:
   - ApplicationName (String, Default: my-app)
   - PipelineArtifactBucketName (String, empty default allowed — if empty, template should create a new S3 bucket)
   - SNSOperationsTopicNameOrArn (String) — allow either create or use existing (if value is an ARN, use it)
   - ECSClusterName (String, Default: created if not provided)
   - CodeBuildImage (String, default to aws/codebuild/standard:6.0 or similar)
   - GitRepository (String) and GitBranch (String)

3) Resources required:
   - S3 Artifact Bucket (create if not provided)
   - CodeBuild Project(s) for Build and Test stages (include buildspec or buildspecOverride)
   - IAM Roles and Policies for:
       * CodePipeline service role
       * CodeBuild service role
       * ECS task execution and task role if tasks run containers
       * Any role used by CodeDeploy/ECS deployments
     Policies should follow least-privilege (explicit actions/resources). Avoid `"Effect":"Allow","Action":"*","Resource":"*"` unless absolutely necessary for required operations, and annotate policy statements with the minimal allowed resources/condition where possible.
   - CodePipeline with Source, Build, Test, Deploy stages and necessary ActionTypeConfigurations
   - SNS Topic (or parameter to use an existing one) and subscription stub
   - ECS Cluster and an ECS Service definition (the template should define a sample TaskDefinition referencing an image parameter or placeholder)
   - If using CodeDeploy for ECS Blue/Green, create the CodeDeploy Application and DeploymentGroup (for rollback support).
   - CloudWatch Events / EventBridge rule to send pipeline execution state changes to the SNS Topic (so every execution triggers a notification).
   - Optional: CloudWatch Alarms or CodePipeline webhook to notify on failures (not required but allowed).

4) Rollback mechanism:
   - Use CodeDeploy Blue/Green deployment configuration for ECS or set up pipeline actions that detect failure and automatically trigger rollback to previous TaskDefinition (include required permissions).
   - Include healthy deployment/rollback lifecycle hooks in the CodeDeploy DeploymentGroup to ensure failed deployments are rolled back.

5) Validation and best practice:
   - Use Outputs for PipelineName, ArtifactBucketName, SNSArn, ECSClusterName.
   - Ensure resources have logical names that include the ApplicationName parameter.
   - The template must be syntactically valid JSON and designed to pass `aws cloudformation validate-template`.
   - Use References and Fn::GetAtt as appropriate rather than hard-coded ARNs.

6) Testing instructions inside template (metadata or parameter):
   - Include CloudFormation Metadata or Template Comments (JSON comments aren't allowed — so embed verification steps in a `Metadata` block) describing how to validate: e.g., how to run `aws cloudformation validate-template`, how to check CodePipeline stages, and how to test rollback by forcing a failing deployment.

7) Security:
   - Ensure S3 bucket has BlockPublicAccess enabled.
   - Ensure CodeBuild logs can be sent to CloudWatch (define log group) and appropriate role permissions exist.
   - Define IAM trust relationships explicitly and minimize privileges in policies.

Deliverable:
- A single JSON CloudFormation template implementing the above. Output only the JSON content.

Notes:
- If a resource cannot be fully parameterized, use a clear, deterministic default but ensure it is override-able via Parameters.
- Avoid adding any explanatory text outside the JSON.