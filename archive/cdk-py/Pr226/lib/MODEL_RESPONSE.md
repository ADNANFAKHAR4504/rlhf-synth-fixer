To implement the CI/CD pipeline using AWS CDK in Python, follow these steps. Below is the complete AWS CDK Python project structure and code to meet the specified requirements.

### Project Structure

```
ci-cd-pipeline/
├── app.py
├── cdk.json
├── pipeline_stack.py
├── requirements.txt
├── buildspec.yml
└── src/
    ├── __init__.py
    ├── staging_stack.py
    └── production_stack.py
```

### `app.py`

```python
#!/usr/bin/env python3

import aws_cdk as cdk
from pipeline_stack import CIPipelineStack

app = cdk.App()

CIPipelineStack(app, "CIPipelineStack",
    env=cdk.Environment(account='YOUR_ACCOUNT_ID', region='us-west-2'),
)

app.synth()
```

### `cdk.json`

```json
{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true",
    "@aws-cdk/core:stackRelativeExports": "true"
  }
}
```

### `requirements.txt`

```
aws-cdk-lib==2.x.x
constructs>=10.0.0,<11.0.0
```

### `pipeline_stack.py`

```python
from aws_cdk import (
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as cpactions,
    aws_codebuild as codebuild,
    aws_iam as iam,
    Stack,
    RemovalPolicy
)
from constructs import Construct
from src.staging_stack import StagingStack
from src.production_stack import ProductionStack

class CIPipelineStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # S3 Bucket for artifacts
        artifacts_bucket = codepipeline.ArtifactBucket(
            self, "ArtifactsBucket",
            removal_policy=RemovalPolicy.DESTROY
        )

        # CodePipeline
        pipeline = codepipeline.Pipeline(
            self, "CodePipeline",
            artifact_bucket=artifacts_bucket
        )

        # Source Stage
        source_output = codepipeline.Artifact()
        source_action = cpactions.CodeCommitSourceAction(
            action_name="CodeCommit",
            repository=codecommit.Repository.from_repository_name(
                self, "SourceRepo", "your-repo-name"),
            output=source_output,
            branch="main"
        )
        pipeline.add_stage(
            stage_name="Source",
            actions=[source_action]
        )

        # CodeBuild Project
        build_project = codebuild.PipelineProject(
            self, "BuildProject",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_5_0
            ),
            build_spec=codebuild.BuildSpec.from_source_filename("buildspec.yml")
        )

        # Build Stage
        build_output = codepipeline.Artifact()
        build_action = cpactions.CodeBuildAction(
            action_name="CodeBuild",
            project=build_project,
            input=source_output,
            outputs=[build_output]
        )
        pipeline.add_stage(
            stage_name="Build",
            actions=[build_action]
        )

        # Staging Stage
        staging_stack = StagingStack(self, "StagingStack")
        staging_stage = pipeline.add_stage(stage_name="Staging")
        staging_stage.add_action(
            cpactions.CloudFormationCreateUpdateStackAction(
                action_name="StagingDeploy",
                stack_name="StagingStack",
                template_path=build_output.at_path("StagingStack.template.json"),
                admin_permissions=True,
                parameter_overrides=staging_stack.parameters
            )
        )

        # Manual Approval
        manual_approval_action = cpactions.ManualApprovalAction(
            action_name="ApproveProduction"
        )
        pipeline.add_stage(
            stage_name="Approval",
            actions=[manual_approval_action]
        )

        # Production Stage
        production_stack = ProductionStack(self, "ProductionStack")
        production_stage = pipeline.add_stage(stage_name="Production")
        production_stage.add_action(
            cpactions.CloudFormationCreateUpdateStackAction(
                action_name="ProductionDeploy",
                stack_name="ProductionStack",
                template_path=build_output.at_path("ProductionStack.template.json"),
                admin_permissions=True,
                parameter_overrides=production_stack.parameters
            )
        )
```

### `src/staging_stack.py`

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3
)
from constructs import Construct

class StagingStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.parameters = {}

        bucket = s3.Bucket(
            self, "StagingBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        cdk.Tags.of(self).add("Environment", "staging")
```

### `src/production_stack.py`

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3
)
from constructs import Construct

class ProductionStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.parameters = {}

        bucket = s3.Bucket(
            self, "ProductionBucket",
            removal_policy=RemovalPolicy.RETAIN
        )

        cdk.Tags.of(self).add("Environment", "production")
```

### `buildspec.yml`

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.8
    commands:
      - pip install -r requirements.txt
  build:
    commands:
      - cdk synth

artifacts:
  files:
    - '**/*'
  base-directory: cdk.out
```

### Steps to Deploy

1. **Install AWS CDK**:

   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap CDK in your account**:

   ```bash
   cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2
   ```

3. **Deploy the stack**:
   ```bash
   cdk deploy
   ```

This setup will create a CI/CD pipeline that builds your application using CodeBuild and deploys it to staging and production environments with manual approval for production. The resources are tagged appropriately, and the infrastructure is defined entirely in Python using AWS CDK.
