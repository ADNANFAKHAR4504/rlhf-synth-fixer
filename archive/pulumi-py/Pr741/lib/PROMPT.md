You are an expert in Pulumi (Python) and AWS CI/CD. Write the full content of tap_stack.py implementing a TapStack Pulumi ComponentResource that provisions a production-ready CI/CD pipeline using AWS in us-west-2 for project IaC - AWS Nova Model Breaking.

Do not generate pulumi.yaml or tap.py (they already exist and instantiate TapStack). All infrastructure must be implemented in this single file using methods inside the TapStack class for logic separation.

Functional Objective Provision a secure, auditable CI/CD pipeline for a web application using AWS CodePipeline with GitHub source, CodeBuild build, and a deployment stage. Enforce role-based access control (RBAC) and send Slack notifications for success/failure events.

Hard Requirements Region and Naming

Target region: us-west-2.

Use a configurable naming scheme. Prefix all named resources with a corporate prefix derived from Pulumi config, e.g., prefix = config.get("namePrefix") or "corp" and environment suffix from TapStackArgs.environment_suffix.

Example final names: "{prefix}-{env}-codepipeline", "{prefix}-{env}-codebuild", etc.

Single-File, Method-Structured Implementation

All logic must live in tap_stack.py.

Implement the following private methods and call them from init:

\_load_config()

\_create_artifacts_bucket()

\_create_service_roles() (pipeline role, codebuild role, notifications role, least-privilege policies)

\_create_codestar_connection() (GitHub via AWS CodeStar Connections)

\_create_codebuild_project()

\_create_codepipeline() (Source Build Deploy, with Manual Approval before Deploy)

\_create_notifications() (AWS Chatbot + CodeStar Notifications to Slack)

\_enforce_rbac() (IAM permissions for who can StartPipelineExecution and approve)

Use ResourceOptions(parent=self) for all resources for clean hierarchy.

GitHub Source Integration

Use AWS CodeStar Connections for GitHub.

Take required values from Pulumi Config (no hardcoding): github.owner, github.repo, github.branch, github.connectionArn (if pre-created), or create a aws.codestarnotifications.Connection equivalent if supported in provider.

Configure CodePipeline Source stage to use this connection.

Build Stage

Use AWS CodeBuild Project.

Buildspec must be provided inline via Pulumi (YAML string) and configurable through Pulumi Config() when needed.

Grant CodeBuild least-privilege IAM (access only to artifacts bucket, logs, and any needed AWS service APIs).

Support environment variables via Pulumi config and environmentVariables (non-secret) and reference secrets from AWS Secrets Manager for sensitive values (e.g., SLACK_WEBHOOK only if needed; otherwise prefer AWS Chatbot route).

Deploy Stage

Provide a deployment stage that can be one of:

S3 static site deploy (sync artifacts to S3 bucket, optional CloudFront invalidation), or

CloudFormation stack deploy (generic), or

ECS service deploy.

Choose S3 static hosting deploy by default for simplicity; make target bucket name configurable via Pulumi config deploy.targetBucketName. The CodeBuild deploy action can run aws s3 sync in a separate Deploy CodeBuild project or as a CodePipeline Deploy action using the artifacts.

Insert a Manual Approval action before the Deploy stage.

Role-Based Access Control (RBAC)

Enforce RBAC at two levels:

Only a configured allow-list of IAM principals (from Pulumi config array rbac.approverArns) can approve the Manual Approval action and start the pipeline.

The pipelines IAM role and CodeBuild role must be least-privilege.

Create an IAM policy that grants codepipeline:StartPipelineExecution and codepipeline:PutApprovalResult only to the specified principals. Bind as needed (document the recommended attachment approach in comments if AWS account-level enforcement is preferable).

Slack Notifications

Integrate AWS Chatbot with Slack for pipeline notifications:

Use Pulumi config for: slack.workspaceId, slack.channelId.

Create an SNS topic for notifications.

Configure AWS Chatbot SlackChannelConfiguration for the SNS topic and Slack channel.

Create CodeStar Notifications rules for CodePipeline pipeline state changes (success, failure) that publish to the SNS topic.

Ensure both successful and failed stage transitions notify the Slack channel.

Observability

Enable CloudWatch Logs for CodeBuild projects.

Tag all resources consistently using self.tags.

Configuration and Secrets

No hardcoded sensitive values. Read all configurable values from Pulumi Config() or environment variables.

If any secrets are needed (e.g., webhook fallback), store in AWS Secrets Manager and read ARNs from config.

Outputs

Export key outputs: pipeline name, artifacts bucket name, CodeBuild project name, SNS topic ARN, Chatbot channel configuration name.

Pulumi API Usage Guidance Use pulumi_aws provider modules:

aws.codepipeline.Pipeline, aws.codepipeline.PipelineArgs, aws.codepipeline.PipelineStageArgs, aws.codepipeline.PipelineArtifactArgs, etc.

aws.codebuild.Project

aws.s3.Bucket (for artifacts)

aws.iam.Role, aws.iam.RolePolicy, aws.iam.RolePolicyAttachment, aws.iam.Policy

aws.cloudwatch.LogGroup

aws.sns.Topic

aws.chatbot.SlackChannelConfiguration

aws.codestarnotifications.NotificationRule

aws.codestarconnections.Connection (or accept connectionArn via config if pre-created)

Use pulumi.Config() inside \_load_config() to read:

env (environment suffix)

namePrefix (corporate prefix)

github.owner, github.repo, github.branch, github.connectionArn

deploy.targetBucketName

rbac.approverArns (list)

slack.workspaceId, slack.channelId

Optional secrets (via config.get_secret)

Code Architecture and Style Keep everything in tap_stack.py.

Class signatures provided below; extend them without altering existing docstrings structure.

Starter skeleton (use and expand):

python Copy from typing import Optional, List, Dict import pulumi from pulumi import ResourceOptions, Output, Config import pulumi_aws as aws

class TapStackArgs: def init(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None): self.environment_suffix = environment_suffix or 'dev' self.tags = tags

class TapStack(pulumi.ComponentResource): def init(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None): super().init('tap:stack:TapStack', name, None, opts) self.environment_suffix = args.environment_suffix self.tags = args.tags or {}

# 1) load config
self._load_config()

# 2) infra creation orchestration
self._create_artifacts_bucket()
self._create_service_roles()
self._create_codestar_connection()
self._create_codebuild_project()
self._create_codepipeline()
self._create_notifications()
self._enforce_rbac()

self.register_outputs({
"pipelineName": self.pipeline_name,
"artifactsBucket": self.artifacts_bucket.bucket,
"buildProjectName": self.build_project.name,
"notificationsTopicArn": self.notifications_topic.arn,
"chatbotConfigName": self.chatbot_config.name,
})

def \_load_config(self) -> None: # Read all config here (env, prefixes, GitHub info, Slack IDs, RBAC principals, target bucket, secrets)
...

def \_create_artifacts_bucket(self) -> None: # S3 bucket for pipeline artifacts, with block public access and server-side encryption
...

def \_create_service_roles(self) -> None: # Create IAM roles and policies for: CodePipeline, CodeBuild, Notifications (Chatbot/CodeStar)
...

def \_create_codestar_connection(self) -> None: # Create or import CodeStar Connections link to GitHub based on config; store connection ARN for pipeline
...

def \_create_codebuild_project(self) -> None: # CodeBuild project with CloudWatch Logs; inline buildspec that builds and optionally syncs artifacts
...

def \_create_codepipeline(self) -> None: # Define Pipeline with stages: Source (GitHub via CodeStar), Build (CodeBuild), Approval (Manual), Deploy (S3)
...

def \_create_notifications(self) -> None: # SNS topic + AWS Chatbot Slack channel configuration + CodeStar Notifications rule for pipeline
...

def \_enforce_rbac(self) -> None: # IAM policies restricting who can StartPipelineExecution and PutApprovalResult
...
Notes:

Inline comments are required explaining each resource and why.

Ensure least-privilege policies for roles.

The Manual Approval action should be gated by IAM and notify the Slack channel via SNS/Chatbot.

Use self.tags on all taggable resources.

Do not hardcode any sensitive values; read from Pulumi Config() and config.get_secret(...) where appropriate.

Return only the complete tap_stack.py file content. The result must be deployable with pulumi up and satisfy:

Uses AWS CodePipeline to automate deployments.

Implements strict role-based access control.

Sends Slack notifications for successful and failed deployment stages.
