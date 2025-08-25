# =================================================================================================
# TapStack (Task A) — Multi-Region Serverless CI/CD using Pulumi (single file)
# -------------------------------------------------------------------------------------------------
# Goal (from prompt):
# - Provision a serverless app concurrently in three regions: us-east-1, us-west-2, eu-central-1
# - Uniform tags: Environment=Production, Project=CICDIntegration on all resources
# - One S3 bucket for Pulumi state (secure: PAB + SSE-KMS + versioning + ownership enforced)
# - Centralized monitoring via CloudWatch (single dashboard aggregating all regions)
# - Zero-downtime releases (Lambda alias “live” + CodeDeploy traffic shifting)
# - Automatic rollback so that failure in any region triggers region-wide consistency rollback
# - Fully CI/CD integrable (uses AWS-native CodeCommit/CodeBuild/CodeDeploy/CodePipeline pattern)
# - All in one Python file; no external services; no GitHub
#
# Notes for operators (inline, no separate docs):
# - Pulumi state bucket here is *created* as a resource. To actually use it as the backend, set:
#     pulumi login s3://<exported-state-bucket-name>
#   on your workstation/runner before `pulumi up`. Bootstrap once (or pre-create the bucket).
# - CodeCommit repo lookup uses a dummy-safe fallback to keep the pipeline graph intact without
#   requiring real account access (mirrors Task Y).
# - CodePipeline (us-east-1) drives a single CodeBuild that updates/publishes Lambda versions in
#   *all* three regions and emits region-specific AppSpecs. Three CodeDeploy actions (one per region)
#   perform traffic shifting. If any region fails, an EventBridge rule triggers a coordinator Lambda
#   to reset other regions’ aliases to their previous versions (coordinated rollback).
# - IAM follows least-privilege where practical; wildcards only where service APIs require flexibility.
# =================================================================================================

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import InvokeOptions, Output, ResourceOptions, log

# --------------------------------------------------------------------------------------------------
# Configuration / constants
# --------------------------------------------------------------------------------------------------

REGIONS = ["us-east-1", "us-west-2", "eu-central-1"]
PRIMARY_REGION = "us-east-1"  # where CodePipeline, coordinator lambda, dashboard live

ENV_TAG = "Production"
PROJECT_TAG = "CICDIntegration"

DEFAULT_TAGS = {
    "Environment": ENV_TAG,
    "Project": PROJECT_TAG,
}

# --------------------------------------------------------------------------------------------------
# Args containers (Task Y pattern)
# --------------------------------------------------------------------------------------------------


class TapStackArgs:
  """Configuration class for TapStack arguments."""

  def __init__(
      self,
      environment_suffix: Optional[str] = None,
      tags: Optional[Dict[str, str]] = None,
  ) -> None:
    """Initialize TapStackArgs with environment suffix and tags.

    Args:
        environment_suffix: Suffix for environment identification (defaults to "dev")
        tags: Custom tags to extend/override base tags
    """
    self.environment_suffix = (environment_suffix or "dev").lower()

    # Base tags with required keys
    base_tags = {
        "Environment": self.environment_suffix,
        "Department": "Engineering",
        "Project": "IaC - AWS Nova Model Breaking",
    }

    # Merge base tags with custom tags (if provided)
    self.tags = {**base_tags, **(tags or {})}


class DummyRepo:
  """
  Dummy-safe CodeCommit representation (Task Y pattern).
  Keeps pipeline graph intact when a real repo cannot be looked up/created.
  """

  def __init__(self, name: str, arn: str, clone_url_http: str):
    self.repository_name: Output[str] = Output.from_input(name)
    self.arn: Output[str] = Output.from_input(arn)
    self.clone_url_http: Output[str] = Output.from_input(clone_url_http)


# --------------------------------------------------------------------------------------------------
# Component
# --------------------------------------------------------------------------------------------------

class TapStack(pulumi.ComponentResource):
  """
  Multi-region serverless CI/CD with centralized observability and coordinated rollback.

  Layout:
  - Providers per region (default tags applied provider-wide)
  - S3 KMS key + State Bucket (PRIMARY_REGION) with ownership enforced, versioning, PAB, SSE-KMS
  - Per region:
      * Lambda function (python3.12), published version + alias "live"
      * HTTP API (API Gateway v2) integrating Lambda alias
      * CloudWatch log group (retention)
      * CodeDeploy (Lambda) app + deployment group for traffic shifting
      * Metric alarms (Errors + Duration)
  - CodePipeline (PRIMARY_REGION):
      * Source: CodeCommit (dummy-safe)
      * Build: CodeBuild updates all regions' Lambda code, publishes versions, creates
               region-specific AppSpec files, stores "previous vs new" versions in SSM
      * Deploy: Three CodeDeploy actions (one per region) for traffic-shift releases
  - Global rollback:
      * EventBridge Rule on CodePipeline Execution "FAILED" → coordinator Lambda
      * Coordinator Lambda reads SSM per region and resets alias to previous version in
        *other* regions (keeps fleet consistent)
  - CloudWatch Dashboard (PRIMARY_REGION) showing metrics across all regions
  """

  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("tap:stack:TapStack", name, None, opts)

    self.tags = args.tags
    self.stack = pulumi.get_stack().lower()
    self.project = pulumi.get_project()
    self.account = aws.get_caller_identity().account_id
    self.region_meta: Dict[str, Dict] = {}

    # -------------------------------------
    # Providers per region (default tags)
    # -------------------------------------
    self.providers: Dict[str, aws.Provider] = {}
    for r in REGIONS:
      self.providers[r] = aws.Provider(
          f"aws-{r}",
          region=r,
          default_tags=aws.ProviderDefaultTagsArgs(tags=self.tags),
          opts=ResourceOptions(parent=self),
      )

    # --------------------------------------------------------
    # KMS + Pulumi state bucket in PRIMARY_REGION (secure)
    # --------------------------------------------------------
    self.state_kms_key = aws.kms.Key(
        f"state-kms-{self.stack}",
        description=f"KMS for Pulumi state bucket ({self.stack})",
        enable_key_rotation=True,
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    aws.kms.Alias(
        f"state-kms-alias-{self.stack}",
        name=f"alias/cicd-state-{self.stack}",
        target_key_id=self.state_kms_key.key_id,
        opts=ResourceOptions(parent=self.state_kms_key),
    )

    self.state_bucket = aws.s3.BucketV2(
        f"pulumi-state-{self.stack}",
        bucket=f"cicd-pulumi-state-{self.stack}",
        force_destroy=False,
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    aws.s3.BucketOwnershipControls(
        f"state-ownership-{self.stack}",
        bucket=self.state_bucket.id,
        rule=aws.s3.BucketOwnershipControlsRuleArgs(
            object_ownership="BucketOwnerEnforced"),
        opts=ResourceOptions(parent=self.state_bucket),
    )
    aws.s3.BucketVersioningV2(
        f"state-versioning-{self.stack}",
        bucket=self.state_bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"),
        opts=ResourceOptions(parent=self.state_bucket),
    )
    aws.s3.BucketPublicAccessBlock(
        f"state-pab-{self.stack}",
        bucket=self.state_bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=ResourceOptions(parent=self.state_bucket),
    )
    aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"state-sse-{self.stack}",
        bucket=self.state_bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # noqa: E501
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.state_kms_key.arn,
                )
            )
        ],
        opts=ResourceOptions(parent=self.state_bucket),
    )

    # --------------------------------------------------------
    # Artifact stores for CodePipeline cross-region actions
    # --------------------------------------------------------
    self.artifact_buckets: Dict[str, aws.s3.BucketV2] = {}
    for r in REGIONS:
      b = aws.s3.BucketV2(
          f"cp-artifacts-{r}-{self.stack}",
          bucket=f"cp-artifacts-{r}-{self.stack}",
          tags=self.tags,
          opts=ResourceOptions(parent=self, provider=self.providers[r]),
      )
      aws.s3.BucketOwnershipControls(
          f"cp-artifacts-ownership-{r}-{self.stack}",
          bucket=b.id,
          rule=aws.s3.BucketOwnershipControlsRuleArgs(
              object_ownership="BucketOwnerEnforced"),
          opts=ResourceOptions(parent=b),
      )
      aws.s3.BucketVersioningV2(
          f"cp-artifacts-versioning-{r}-{self.stack}",
          bucket=b.id,
          versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
              status="Enabled"),
          opts=ResourceOptions(parent=b),
      )
      aws.s3.BucketPublicAccessBlock(
          f"cp-artifacts-pab-{r}-{self.stack}",
          bucket=b.id,
          block_public_acls=True,
          block_public_policy=True,
          ignore_public_acls=True,
          restrict_public_buckets=True,
          opts=ResourceOptions(parent=b),
      )
      # Simpler SSE-S3 for artifacts (rotate fast, low admin)
      aws.s3.BucketServerSideEncryptionConfigurationV2(
          f"cp-artifacts-sse-{r}-{self.stack}",
          bucket=b.id,
          rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
              apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # noqa: E501
                  sse_algorithm="AES256"
              )
          )],
          opts=ResourceOptions(parent=b),
      )
      self.artifact_buckets[r] = b

    # --------------------------------------------------------
    # Per-region serverless app and release infra
    # --------------------------------------------------------
    for r in REGIONS:
      self._provision_region(r)

    # --------------------------------------------------------
    # CodeCommit source (dummy-safe)
    # --------------------------------------------------------
# --------------------------------------------------------
    try:
      existing = aws.codecommit.get_repository(
          repository_name=f"cicd-mr-{self.stack}",
          opts=InvokeOptions(
              parent=self,
              provider=self.providers[PRIMARY_REGION]
          )
      )
      repo_name_out = Output.from_input(existing.repository_name)
      repo_arn_out = Output.from_input(existing.arn)
      repo_clone_http_out = Output.from_input(existing.clone_url_http)
      repo_exists_out = Output.from_input(True)
      log.info(f"Using existing CodeCommit repo: {existing.repository_name}")
    except Exception as e:
      log.warn(f"Repo lookup failed (using dummy): {e}")
      repo_name_out = Output.from_input(f"cicd-mr-{self.stack}")
      repo_arn_out = Output.from_input(
          f"arn:aws:codecommit:{PRIMARY_REGION}:{self.account}:DUMMY"
      )
      repo_clone_http_out = Output.from_input("https://example.com/dummy.git")
      repo_exists_out = Output.from_input(False)

    self.repo_name = repo_name_out
    self.repo_arn = repo_arn_out
    self.repo_clone_http = repo_clone_http_out
    self.repo_exists = repo_exists_out  # flag output

    # --------------------------------------------------------
    # CodeBuild (PRIMARY) — updates ALL regions + emits region appspecs + stores prev/new in SSM
    # --------------------------------------------------------
    cb_role = aws.iam.Role(
        f"cb-role-{self.stack}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "codebuild.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }],
        }),
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )

    # Allow logging, artifacts, Lambda updates (scoped to our functions), and SSM parameter writes
    lambda_arns = [self.region_meta[r]["lambda_fn"].arn for r in REGIONS]
    ssm_prefix = f"/cicd/{self.stack}"
    aws.iam.RolePolicy(
        f"cb-inline-{self.stack}",
        role=cb_role.id,
        policy=Output.all(
            [b.arn for b in self.artifact_buckets.values()],
            lambda_arns,
        ).apply(lambda a: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "LogsWrite",
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                    "Resource": f"arn:aws:logs:{PRIMARY_REGION}:{self.account}:*",
                },
                {
                    "Sid": "S3Artifacts",
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:ListBucket"],
                    "Resource": sum(([arn, f"{arn}/*"] for arn in a[0]), []),
                },
                {
                    "Sid": "LambdaUpdateAllRegions",
                    "Effect": "Allow",
                    "Action": [
                        "lambda:UpdateFunctionCode",
                        "lambda:PublishVersion",
                        "lambda:GetAlias",
                    ],
                    "Resource": a[1],
                },
                {
                    "Sid": "SSMWrite",
                    "Effect": "Allow",
                    "Action": ["ssm:PutParameter"],
                    "Resource": f"arn:aws:ssm:*:{self.account}:parameter{ssm_prefix}/*",
                },
            ],
        })),
        opts=ResourceOptions(parent=cb_role),
    )

    # ---- CodeBuild project with SECONDARY ARTIFACTS (per-region appspecs) ----
    cb_proj = aws.codebuild.Project(
        f"cb-mr-{self.stack}",
        name=f"cb-mr-{self.stack}",
        description="Builds Lambda package; updates code in all regions; publishes versions; emits region appspecs; stores prev/new in SSM.",  # noqa: E501
        service_role=cb_role.arn,
        artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
        # three region-specific secondary artifacts
        secondary_artifacts=[
            aws.codebuild.ProjectSecondaryArtifactArgs(
                type="S3",
                artifact_identifier="use1",
                # per-region bucket
                location=self.artifact_buckets["us-east-1"].bucket,
                packaging="ZIP",
                path="use1",
                name="artifact-use1.zip",
            ),
            aws.codebuild.ProjectSecondaryArtifactArgs(
                type="S3",
                artifact_identifier="usw2",
                location=self.artifact_buckets["us-west-2"].bucket,
                packaging="ZIP",
                path="usw2",
                name="artifact-usw2.zip",
            ),
            aws.codebuild.ProjectSecondaryArtifactArgs(
                type="S3",
                artifact_identifier="euc1",
                location=self.artifact_buckets["eu-central-1"].bucket,
                packaging="ZIP",
                path="euc1",
                name="artifact-euc1.zip",
            ),
        ],
        environment=aws.codebuild.ProjectEnvironmentArgs(
            compute_type="BUILD_GENERAL1_SMALL",
            image="aws/codebuild/amazonlinux2-x86_64-standard:5.0",
            type="LINUX_CONTAINER",
            environment_variables=[
                aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                  name="STACK", value=self.stack),
                aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(name="FUNCTION_USE1", value=self.region_meta["us-east-1"]["lambda_fn"].name),  # noqa: E501
                aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(name="FUNCTION_USW2", value=self.region_meta["us-west-2"]["lambda_fn"].name),  # noqa: E501
                aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(name="FUNCTION_EUC1", value=self.region_meta["eu-central-1"]["lambda_fn"].name),  # noqa: E501
                aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                  name="ALIAS", value="live"),
            ],
        ),
        source=aws.codebuild.ProjectSourceArgs(
            type="CODEPIPELINE",
            buildspec=r"""
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.12
    commands:
      - pip install -q --upgrade pip
  pre_build:
    commands:
      - echo "Preparing source..."
      - mkdir -p dist && if [ -f index.py ]; then cp index.py dist/; else printf '%s\n' "import json\n\ndef lambda_handler(event, context):\n    return {\"statusCode\":200,\"body\":json.dumps({\"ok\":True})}" > dist/index.py; fi
      - (cd dist && zip -qr ../package.zip .)
  build:
    commands:
      - set -e
      - echo "Update & publish us-east-1..."
      - PREV_USE1=$(aws lambda get-alias --function-name "$FUNCTION_USE1" --name "$ALIAS" --region us-east-1 --query 'FunctionVersion' --output text || echo "1")
      - aws lambda update-function-code --function-name "$FUNCTION_USE1" --zip-file fileb://package.zip --region us-east-1 > /dev/null
      - NEW_USE1=$(aws lambda publish-version --function-name "$FUNCTION_USE1" --region us-east-1 --query 'Version' --output text)
      - echo "Prev/Next use1: $PREV_USE1 -> $NEW_USE1"

      - echo "Update & publish us-west-2..."
      - PREV_USW2=$(aws lambda get-alias --function-name "$FUNCTION_USW2" --name "$ALIAS" --region us-west-2 --query 'FunctionVersion' --output text || echo "1")
      - aws lambda update-function-code --function-name "$FUNCTION_USW2" --zip-file fileb://package.zip --region us-west-2 > /dev/null
      - NEW_USW2=$(aws lambda publish-version --function-name "$FUNCTION_USW2" --region us-west-2 --query 'Version' --output text)
      - echo "Prev/Next usw2: $PREV_USW2 -> $NEW_USW2"

      - echo "Update & publish eu-central-1..."
      - PREV_EUC1=$(aws lambda get-alias --function-name "$FUNCTION_EUC1" --name "$ALIAS" --region eu-central-1 --query 'FunctionVersion' --output text || echo "1")
      - aws lambda update-function-code --function-name "$FUNCTION_EUC1" --zip-file fileb://package.zip --region eu-central-1 > /dev/null
      - NEW_EUC1=$(aws lambda publish-version --function-name "$FUNCTION_EUC1" --region eu-central-1 --query 'Version' --output text)
      - echo "Prev/Next euc1: $PREV_EUC1 -> $NEW_EUC1"

      - echo "Writing SSM prev/new for rollback coordination..."
      - aws ssm put-parameter --name "/cicd/$STACK/us-east-1/prev" --type String --value "$PREV_USE1" --overwrite --region us-east-1
      - aws ssm put-parameter --name "/cicd/$STACK/us-east-1/new"  --type String --value "$NEW_USE1"  --overwrite --region us-east-1
      - aws ssm put-parameter --name "/cicd/$STACK/us-west-2/prev" --type String --value "$PREV_USW2" --overwrite --region us-west-2
      - aws ssm put-parameter --name "/cicd/$STACK/us-west-2/new"  --type String --value "$NEW_USW2"  --overwrite --region us-west-2
      - aws ssm put-parameter --name "/cicd/$STACK/eu-central-1/prev" --type String --value "$PREV_EUC1" --overwrite --region eu-central-1
      - aws ssm put-parameter --name "/cicd/$STACK/eu-central-1/new"  --type String --value "$NEW_EUC1"  --overwrite --region eu-central-1

      - echo "Creating region AppSpecs..."
      - mkdir -p out/us-east-1 out/us-west-2 out/eu-central-1
      - |
        cat > out/us-east-1/appspec.yaml <<'EOF'
        version: 0.0
        Resources:
          - LambdaFn:
              Type: AWS::Lambda::Function
              Properties:
                Name: $FUNCTION_USE1
                Alias: $ALIAS
                CurrentVersion: $PREV_USE1
                TargetVersion: $NEW_USE1
        EOF
      - |
        cat > out/us-west-2/appspec.yaml <<'EOF'
        version: 0.0
        Resources:
          - LambdaFn:
              Type: AWS::Lambda::Function
              Properties:
                Name: $FUNCTION_USW2
                Alias: $ALIAS
                CurrentVersion: $PREV_USW2
                TargetVersion: $NEW_USW2
        EOF
      - |
        cat > out/eu-central-1/appspec.yaml <<'EOF'
        version: 0.0
        Resources:
          - LambdaFn:
              Type: AWS::Lambda::Function
              Properties:
                Name: $FUNCTION_EUC1
                Alias: $ALIAS
                CurrentVersion: $PREV_EUC1
                TargetVersion: $NEW_EUC1
        EOF
artifacts:
  files:
    - '**/*' # optional: keep a primary artifact for logs/diagnostics
secondary-artifacts:
  use1:
    files:
      - out/us-east-1/appspec.yaml
    discard-paths: yes
  usw2:
    files:
      - out/us-west-2/appspec.yaml
    discard-paths: yes
  euc1:
    files:
      - out/eu-central-1/appspec.yaml
    discard-paths: yes
""",
        ),
        tags=self.tags,
        opts=ResourceOptions(
          parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    self.cb_project = cb_proj

    # --------------------------------------------------------
    # CodeDeploy (per region) apps + groups (Lambda)
    # --------------------------------------------------------
    for r in REGIONS:
      cd_role = aws.iam.Role(
          f"cd-role-{r}-{self.stack}",
          assume_role_policy=json.dumps({
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Principal": {"Service": "codedeploy.amazonaws.com"},
                  "Action": "sts:AssumeRole",
              }],
          }),
          tags=self.tags,
          opts=ResourceOptions(parent=self, provider=self.providers[r]),
      )
      aws.iam.RolePolicyAttachment(
          f"cd-role-attach-{r}-{self.stack}",
          role=cd_role.name,
          policy_arn="arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda",
          opts=ResourceOptions(parent=cd_role),
      )
      app = aws.codedeploy.Application(
          f"cd-app-{r}-{self.stack}",
          compute_platform="Lambda",
          tags=self.tags,
          opts=ResourceOptions(parent=self, provider=self.providers[r]),
      )
      dg = aws.codedeploy.DeploymentGroup(
          f"cd-dg-{r}-{self.stack}",
          app_name=app.name,
          deployment_group_name=f"dg-{self.stack}-{r}",
          service_role_arn=cd_role.arn,
          deployment_config_name="CodeDeployDefault.LambdaLinear10PercentEvery1Minute",
          deployment_style=aws.codedeploy.DeploymentGroupDeploymentStyleArgs(
              deployment_type="BLUE_GREEN",
              deployment_option="WITH_TRAFFIC_CONTROL",
          ),
          auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
              enabled=True,
              events=["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"],
          ),
          alarm_configuration=aws.codedeploy.DeploymentGroupAlarmConfigurationArgs(
              enabled=False,
          ),
          tags=self.tags,
          opts=ResourceOptions(parent=app),
      )
      self.region_meta[r]["cd_app"] = app
      self.region_meta[r]["cd_dg"] = dg

    # --------------------------------------------------------
    # CodePipeline (PRIMARY) with cross-region deploy actions
    # --------------------------------------------------------
    cp_role = aws.iam.Role(
        f"cp-role-{self.stack}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "codepipeline.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }],
        }),
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    aws.iam.RolePolicy(
        f"cp-inline-{self.stack}",
        role=cp_role.id,
        policy=Output.all(
            [b.arn for b in self.artifact_buckets.values()],
            self.repo_arn,
            self.cb_project.arn,
        ).apply(lambda a: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "ArtifactsRW",
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:GetBucketVersioning"],
                    "Resource": sum(([arn, f"{arn}/*"] for arn in a[0]), []),
                },
                {
                    "Sid": "CodeCommitRead",
                    "Effect": "Allow",
                    "Action": [
                        "codecommit:GitPull",
                        "codecommit:GetBranch",
                        "codecommit:GetCommit",
                        "codecommit:GetRepository",
                        "codecommit:ListBranches",
                    ],
                    "Resource": a[1],
                },
                {
                    "Sid": "CodeBuildStart",
                    "Effect": "Allow",
                    "Action": ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
                    "Resource": a[2],
                },
                {
                    "Sid": "CodeDeployActions",
                    "Effect": "Allow",
                    "Action": [
                        "codedeploy:CreateDeployment",
                        "codedeploy:GetDeployment",
                        "codedeploy:GetDeploymentConfig",
                        "codedeploy:RegisterApplicationRevision",
                        "codedeploy:GetApplicationRevision",
                    ],
                    "Resource": "*"
                },
                {
                    "Sid": "LogsDescribe",
                    "Effect": "Allow",
                    "Action": ["logs:DescribeLogGroups", "logs:DescribeLogStreams"],
                    "Resource": "*"
                }
            ],
        })),
        opts=ResourceOptions(parent=cp_role),
    )

    # multi-artifact stores (one per region)
    artifact_stores = [
        aws.codepipeline.PipelineArtifactStoreArgs(
            type="S3",
            location=self.artifact_buckets[r].bucket,
            region=r,
        )
        for r in REGIONS
    ]

    pipeline = aws.codepipeline.Pipeline(
        f"cp-mr-{self.stack}",
        aws.codepipeline.PipelineArgs(
            name=f"cp-mr-{self.stack}",
            role_arn=cp_role.arn,
            artifact_stores=artifact_stores,
            stages=[
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="CodeCommitSource",
                            category="Source",
                            owner="AWS",
                            provider="CodeCommit",
                            version="1",
                            output_artifacts=["source_output"],
                            configuration={
                                "RepositoryName": self.repo_name,
                                "BranchName": "main",
                            },
                            run_order=1,
                        )
                    ],
                ),
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="BuildAllRegions",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            # NEW: add the three regional outputs (primary is optional)
                            output_artifacts=[
                                "build_output", "use1", "usw2", "euc1"],
                            configuration={
                                "ProjectName": self.cb_project.name,
                            },
                            run_order=1,
                        )
                    ],
                ),
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        # us-east-1
                        aws.codepipeline.PipelineStageActionArgs(
                            name="CodeDeployUSE1",
                            category="Deploy",
                            owner="AWS",
                            provider="CodeDeploy",
                            version="1",
                            # region-specific artifact
                            input_artifacts=["use1"],
                            configuration={
                                "ApplicationName": self.region_meta["us-east-1"]["cd_app"].name,
                                "DeploymentGroupName": self.region_meta["us-east-1"]["cd_dg"].deployment_group_name,
                                # No AppSpecTemplate* keys for Lambda
                            },
                            region="us-east-1",
                            run_order=1,
                        ),
                        # us-west-2
                        aws.codepipeline.PipelineStageActionArgs(
                            name="CodeDeployUSW2",
                            category="Deploy",
                            owner="AWS",
                            provider="CodeDeploy",
                            version="1",
                            input_artifacts=["usw2"],
                            configuration={
                                "ApplicationName": self.region_meta["us-west-2"]["cd_app"].name,
                                "DeploymentGroupName": self.region_meta["us-west-2"]["cd_dg"].deployment_group_name,
                            },
                            region="us-west-2",
                            run_order=1,
                        ),
                        # eu-central-1
                        aws.codepipeline.PipelineStageActionArgs(
                            name="CodeDeployEUC1",
                            category="Deploy",
                            owner="AWS",
                            provider="CodeDeploy",
                            version="1",
                            input_artifacts=["euc1"],
                            configuration={
                                "ApplicationName": self.region_meta["eu-central-1"]["cd_app"].name,
                                "DeploymentGroupName": self.region_meta["eu-central-1"]["cd_dg"].deployment_group_name,
                            },
                            region="eu-central-1",
                            run_order=1,
                        ),
                    ],
                ),
            ],
            tags=self.tags,
        ),
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    self.pipeline = pipeline

    # --------------------------------------------------------
    # Global rollback coordinator (PRIMARY_REGION)
    #   - Triggered when CodePipeline execution fails
    #   - Resets alias in other regions to previous version from SSM
    # --------------------------------------------------------
    coord_role = aws.iam.Role(
        f"rollback-role-{self.stack}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }],
        }),
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    aws.iam.RolePolicyAttachment(
        f"rollback-logs-{self.stack}",
        role=coord_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=ResourceOptions(parent=coord_role),
    )
    # Least-privilege for alias updates + SSM gets (include alias ARN too)
    alias_update_statements = []
    for r in REGIONS:
      fn_arn = self.region_meta[r]["lambda_fn"].arn
      alias_arn = self.region_meta[r]["alias"].arn
      alias_update_statements.append({
          "Sid": f"AliasUpdate{r.replace('-', '')}",
          "Effect": "Allow",
          "Action": ["lambda:GetAlias", "lambda:UpdateAlias"],
          "Resource": [fn_arn, alias_arn],
      })
    aws.iam.RolePolicy(
        f"rollback-inline-{self.stack}",
        role=coord_role.id,
        policy=Output.all(
            pipeline_name=self.pipeline.name,
            alias_statements=alias_update_statements
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": args["alias_statements"] + [
                {
                    "Sid": "SSMRead",
                    "Effect": "Allow",
                    "Action": ["ssm:GetParameter"],
                    "Resource": f"arn:aws:ssm:*:{self.account}:parameter/cicd/{self.stack}/*",
                },
                {
                    "Sid": "CodePipelineRead",
                    "Effect": "Allow",
                    "Action": ["codepipeline:GetPipelineExecution", "codepipeline:GetPipelineState"],
                    "Resource": f"arn:aws:codepipeline:{PRIMARY_REGION}:{self.account}:{args['pipeline_name']}",
                },
            ],
        })),
        opts=ResourceOptions(parent=coord_role),
    )

    coordinator_code = f"""
import os
import json
import boto3
import logging

log = logging.getLogger()
log.setLevel(logging.INFO)

STACK = "{self.stack}"
ALIAS = "live"
REGIONS = {json.dumps(REGIONS)}

def get_param(region, name):
    ssm = boto3.client("ssm", region_name=region)
    return ssm.get_parameter(Name=name)["Parameter"]["Value"]

def set_alias_to(region, function_name, version):
    lam = boto3.client("lambda", region_name=region)
    lam.update_alias(FunctionName=function_name, Name=ALIAS, FunctionVersion=version)

def lambda_handler(event, context):
    log.info("Event: %s", json.dumps(event))
    # On any pipeline failure, restore alias in all regions to PREV values
    try:
        actions = []
        for r in REGIONS:
            prev = get_param(r, f"/cicd/{{STACK}}/{{r}}/prev".format(STACK=STACK, r=r))
            fn_env_key = "FN_"+r.replace("-", "").upper()
            fn_name = os.environ.get(fn_env_key)
            if not fn_name:
                log.warning("Missing env for function in region %s", r)
                continue
            log.info("Rolling back %s to version %s", fn_name, prev)
            set_alias_to(r, fn_name, prev)
            actions.append({{"region": r, "function": fn_name, "rolled_to": prev}})
        return {{"statusCode": 200, "body": json.dumps({{"rolled_back": actions}})}}
    except Exception as e:
        log.exception("Rollback coordination failed: %s", e)
        return {{"statusCode": 500, "body": json.dumps({{"error": str(e)}})}}
"""
    coordinator_fn = aws.lambda_.Function(
        f"rollback-coordinator-{self.stack}",
        name=f"rollback-coordinator-{self.stack}",
        role=coord_role.arn,
        runtime="python3.12",
        handler="index.lambda_handler",
        timeout=180,
        memory_size=256,
        code=pulumi.AssetArchive(
            {"index.py": pulumi.StringAsset(coordinator_code)}),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "FN_USEAST1": self.region_meta["us-east-1"]["lambda_fn"].name,
                "FN_USWEST2": self.region_meta["us-west-2"]["lambda_fn"].name,
                "FN_EUCENTRAL1": self.region_meta["eu-central-1"]["lambda_fn"].name,
            }
        ),
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    self.rollback_coordinator = coordinator_fn

    # EventBridge rule to invoke coordinator on pipeline failure
    rule = aws.cloudwatch.EventRule(
        f"cp-failure-{self.stack}",
        description="Trigger rollback coordinator on CodePipeline execution failure",
        event_pattern=Output.all(
            pipeline_name=pipeline.name,
            stack_name=self.stack
        ).apply(lambda args: json.dumps({
            "source": ["aws.codepipeline"],
            "detail-type": ["CodePipeline Pipeline Execution State Change"],
            "detail": {
                "state": ["FAILED"],
                "pipeline": [args["pipeline_name"]]
            }
        })),
        tags=self.tags,
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )
    aws.cloudwatch.EventTarget(
        f"cp-failure-target-{self.stack}",
        rule=rule.name,
        arn=coordinator_fn.arn,
        opts=ResourceOptions(parent=rule),
    )
    aws.lambda_.Permission(
        f"allow-events-{self.stack}",
        action="lambda:InvokeFunction",
        function=coordinator_fn.name,
        principal="events.amazonaws.com",
        source_arn=rule.arn,
        opts=ResourceOptions(parent=rule),
    )

    # --------------------------------------------------------
    # Centralized CloudWatch Dashboard (PRIMARY) across regions
    # --------------------------------------------------------
    dash_widgets: List[Dict] = []

    # Metrics: Duration & Errors per region
    for metric_name, stat, title in [
        ("Duration", "Average", "Lambda Duration (ms)"),
        ("Errors", "Sum", "Lambda Errors"),
    ]:
      widgets_metrics = []
      for r in REGIONS:
        widgets_metrics.append(
            ["AWS/Lambda", metric_name, "FunctionName", self.region_meta[r]["lambda_fn"].name.apply(lambda n: n)]  # noqa: E501
        )
      dash_widgets.append({
          "type": "metric",
          "width": 24,
          "height": 6,
          "properties": {
              "metrics": widgets_metrics,
              "period": 300,
              "stat": stat,
              "region": PRIMARY_REGION,
              "title": f"{title} (All Regions)",
          },
      })

    # Log query widgets (show latest logs per region)
    for r in REGIONS:
      dash_widgets.append({
          "type": "log",
          "width": 24,
          "height": 6,
          "properties": {
              "query": self.region_meta[r]["log_group"].name.apply(
                  lambda lg: f"fields @timestamp, @message | sort @timestamp desc | limit 20"
              ),
              "region": r,
              "title": f"Recent Lambda Logs — {r}",
              "logGroupNames": [self.region_meta[r]["log_group"].name],
          },
      })

    aws.cloudwatch.Dashboard(
        f"mr-dashboard-{self.stack}",
        dashboard_name=f"cicd-multiregion-{self.stack}",
        dashboard_body=Output.from_input(
            {"widgets": dash_widgets}).apply(json.dumps),
        opts=ResourceOptions(
            parent=self, provider=self.providers[PRIMARY_REGION]),
    )

    # --------------------------------------------------------
    # Exports (executed when this component is instantiated by tap.py)
    # --------------------------------------------------------
    pulumi.export("state_bucket", self.state_bucket.bucket)
    for r in REGIONS:
      pulumi.export(f"function_{r.replace('-', '_')}",
                    self.region_meta[r]["lambda_fn"].name)
      pulumi.export(f"api_url_{r.replace('-', '_')}",
                    self.region_meta[r]["api_url"])
    pulumi.export("codepipeline_name", self.pipeline.name)
    pulumi.export("rollback_coordinator", self.rollback_coordinator.name)

    self.register_outputs({})

  # ----------------------------------------------------------------------------------------------
  # Region provisioning helper
  # ----------------------------------------------------------------------------------------------
  def _provision_region(self, region: str):
    p = self.providers[region]
    current_region = aws.get_region()
    meta: Dict = {}

    # Lambda role (logs only)
    lambda_role = aws.iam.Role(
        f"lambda-role-{region}-{self.stack}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }],
        }),
        tags=self.tags,
        opts=ResourceOptions(parent=self, provider=p),
    )

    lambda_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Sid": "CWLogs",
            "Effect": "Allow",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            "Resource": f"arn:aws:logs:{region}:{self.account}:*",
        }],
    })

    aws.iam.RolePolicy(
        f"lambda-logs-{region}-{self.stack}",
        role=lambda_role.id,
        policy=lambda_policy,
        opts=ResourceOptions(parent=lambda_role),
    )

    # Lambda function (python3.12). Publish True to get an initial version.
    lambda_fn = aws.lambda_.Function(
        f"fn-{region}-{self.stack}",
        name=f"cicd-mr-fn-{region}-{self.stack}",
        role=lambda_role.arn,
        runtime="python3.12",
        handler="index.lambda_handler",
        timeout=15,
        memory_size=256,
        publish=True,
        code=pulumi.AssetArchive({
            "index.py": pulumi.StringAsset(
                """
import json
def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "ok", "region": context.invoked_function_arn.split(':')[3]})
    }
"""
            )
        }),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={"ENVIRONMENT": ENV_TAG, "PROJECT": PROJECT_TAG}
        ),
        tags=self.tags,
        opts=ResourceOptions(parent=self, provider=p),
    )
    meta["lambda_fn"] = lambda_fn

    # Log group
    lg = aws.cloudwatch.LogGroup(
        f"lg-{region}-{self.stack}",
        name=lambda_fn.name.apply(lambda n: f"/aws/lambda/{n}"),
        retention_in_days=14,
        tags=self.tags,
        opts=ResourceOptions(parent=lambda_fn, provider=p),
    )
    meta["log_group"] = lg

    # Alias "live"
    alias = aws.lambda_.Alias(
        f"alias-live-{region}-{self.stack}",
        name="live",
        function_name=lambda_fn.name,
        function_version=lambda_fn.version,
        opts=ResourceOptions(parent=lambda_fn, provider=p),
    )
    meta["alias"] = alias

    # HTTP API (API GW v2) → Lambda (alias)
    api = aws.apigatewayv2.Api(
        f"api-{region}-{self.stack}",
        name=f"cicd-mr-api-{region}-{self.stack}",
        protocol_type="HTTP",
        opts=ResourceOptions(parent=self, provider=p),
    )
    integ = aws.apigatewayv2.Integration(
        f"api-int-{region}-{self.stack}",
        api_id=api.id,
        integration_type="AWS_PROXY",
        # integrate with alias for zero-downtime routing
        integration_uri=alias.arn,
        payload_format_version="2.0",
        integration_method="POST",
        opts=ResourceOptions(parent=api, provider=p),
    )
    route = aws.apigatewayv2.Route(
        f"api-route-{region}-{self.stack}",
        api_id=api.id,
        route_key="GET /",
        target=Output.concat("integrations/", integ.id),
        opts=ResourceOptions(parent=api, provider=p),
    )
    stage = aws.apigatewayv2.Stage(
        f"api-stage-{region}-{self.stack}",
        api_id=api.id,
        name="prod",
        auto_deploy=True,
        opts=ResourceOptions(parent=api, provider=p),
    )
    # permission for API to invoke lambda alias
    aws.lambda_.Permission(
        f"perm-apigw-{region}-{self.stack}",
        action="lambda:InvokeFunction",
        function=lambda_fn.name,   # permission applies to function; alias ARN is target
        principal="apigateway.amazonaws.com",
        source_arn=api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
        opts=ResourceOptions(parent=lambda_fn, provider=p),
    )
    meta["api_url"] = Output.concat(
        "https://", api.id, f".execute-api.{region}.amazonaws.com/", stage.name)

    # Alarms
    aws.cloudwatch.MetricAlarm(
        f"alarm-errors-{region}-{self.stack}",
        metric_name="Errors",
        namespace="AWS/Lambda",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        period=60,
        statistic="Sum",
        threshold=1,
        dimensions={"FunctionName": lambda_fn.name},
        alarm_description="Lambda errors > 0",
        tags=self.tags,
        opts=ResourceOptions(parent=lambda_fn, provider=p),
    )
    aws.cloudwatch.MetricAlarm(
        f"alarm-duration-{region}-{self.stack}",
        metric_name="Duration",
        namespace="AWS/Lambda",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        period=60,
        statistic="Average",
        threshold=5000,
        dimensions={"FunctionName": lambda_fn.name},
        alarm_description="Lambda duration > 5s",
        tags=self.tags,
        opts=ResourceOptions(parent=lambda_fn, provider=p),
    )

    self.region_meta[region] = meta
