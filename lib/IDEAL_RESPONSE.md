# Transaction Processing Pipeline - IDEAL Implementation

Serverless transaction processing pipeline using CDKTF Python with ZIP-based Lambda deployment.

## Key Corrections from MODEL_RESPONSE

1. **Lambda Deployment**: ZIP-based instead of container images
2. **Backend Configuration**: Correct Terraform state management
3. **API Gateway**: Fixed CDKTF provider parameter naming
4. **Self-Contained**: Inline Lambda packaging function

## Architecture Overview

- API Gateway REST API (/upload endpoint)
- 3 Lambda functions (validation, transformation, notification) - ZIP deployment
- Step Functions Express workflow with error handling
- 2 DynamoDB tables (status tracking, transformed data)
- S3 bucket for file storage
- SNS topic for notifications
- SQS dead letter queue
- CloudWatch Logs, Alarms, X-Ray tracing

## Infrastructure Code

### Lambda ZIP Packaging (tap_stack.py)

Key fix: Added inline packaging function:

```python
import os
import subprocess
import tempfile
import shutil
from pathlib import Path

def package_lambda(lambda_dir: str, function_name: str) -> str:
    """Package Lambda function with dependencies into a ZIP file."""
    with tempfile.TemporaryDirectory() as temp_dir:
        lambda_path = Path(lambda_dir)
        app_file = lambda_path / "app.py"
        requirements_file = lambda_path / "requirements.txt"

        # Copy app.py
        shutil.copy(str(app_file), temp_dir)

        # Install dependencies for ARM64
        if requirements_file.exists():
            subprocess.run([
                "pip", "install",
                "-r", str(requirements_file),
                "-t", temp_dir,
                "--platform", "manylinux2014_aarch64",
                "--only-binary=:all:",
                "--python-version", "3.11"
            ], check=True)

        # Create ZIP
        output_dir = Path("lambda_packages")
        output_dir.mkdir(exist_ok=True)
        zip_path = output_dir / f"{function_name}.zip"

        shutil.make_archive(
            str(zip_path.with_suffix('')),
            'zip',
            temp_dir
        )

        return str(zip_path)
```

### Lambda Functions (ZIP Deployment)

```python
# Package all Lambdas
lib_dir = os.path.dirname(os.path.abspath(__file__))
validation_zip = package_lambda(
    os.path.join(lib_dir, "lambda", "validation"),
    f"validation-lambda-{environment_suffix}"
)
validation_zip = os.path.abspath(validation_zip)

# Define Lambda with ZIP deployment
validation_lambda = LambdaFunction(
    self,
    "validation_lambda",
    function_name=f"validation-lambda-{environment_suffix}",
    role=validation_role.arn,
    handler="app.lambda_handler",  # Key change: specify handler
    runtime="python3.11",            # Key change: specify runtime
    filename=validation_zip,          # Key change: ZIP file
    source_code_hash=Fn.filebase64sha256(validation_zip),
    architectures=["arm64"],
    memory_size=512,
    timeout=60,
    environment={
        "variables": {
            "BUCKET_NAME": uploads_bucket.bucket,
            "ENVIRONMENT": environment_suffix
        }
    },
    tracing_config={"mode": "Active"},
    depends_on=[validation_log_group]
)
```

### Backend Configuration

```python
# Production: S3 Backend with DynamoDB locking
S3Backend(
    self,
    bucket=state_bucket,
    key=f"{environment_suffix}/{construct_id}.tfstate",
    region=state_bucket_region,
    encrypt=True,
    dynamodb_table="iac-rlhf-tf-state-lock",  # Correct locking
)

# Development: Local backend (commented out S3Backend)
```

### API Gateway Usage Plan

```python
# Fixed parameter names for CDKTF
usage_plan = ApiGatewayUsagePlan(
    self,
    "api_usage_plan",
    name=f"transaction-api-plan-{environment_suffix}",
    api_stages=[{
        "apiId": rest_api.id,
        "stage": api_stage.stage_name
    }],
    quota_settings={          # Correct: quota_settings
        "limit": 1000,
        "period": "DAY"
    },
    throttle_settings={       # Correct: throttle_settings
        "burst_limit": 100,
        "rate_limit": 50
    }
)
```

### Stack Outputs

```python
# Removed ECR outputs, added Lambda ARNs for integration testing
TerraformOutput(
    self,
    "validation_lambda_arn",
    value=validation_lambda.arn,
    description="Validation Lambda function ARN"
)
```

## Deployment Commands

```bash
# Lint
pipenv run pylint lib/ --disable=C0301,C0103,C0114,C0115,C0116

# Synth (packages Lambdas automatically)
ENVIRONMENT_SUFFIX="synth9lh0b7" AWS_REGION="us-east-1" pipenv run cdktf synth

# Deploy
ENVIRONMENT_SUFFIX="synth9lh0b7" AWS_REGION="us-east-1" pipenv run cdktf deploy --auto-approve
```

## Lambda Code Structure

```
lib/lambda/
  validation/
    app.py           # Validation logic
    requirements.txt # boto3, aws-xray-sdk
  transformation/
    app.py           # Transform & DynamoDB write
    requirements.txt
  notification/
    app.py           # SNS publish
    requirements.txt
```

## Validation Results

- **Lint**: 10/10 (perfect pylint score)
- **Build**: cdktf synth successful
- **Lambda Packaging**: Automatic ZIP creation for ARM64
- **Infrastructure**: 11 AWS services configured correctly
- **Environment Suffix**: All resources include dynamic suffix
- **Cost**: Removed 3 unnecessary ECR repositories

## Key Improvements Over MODEL_RESPONSE

1. **Simpler Deployment**: No Docker/ECR dependencies
2. **Self-Contained**: Inline Lambda packaging
3. **Correct Configuration**: Fixed Terraform backend and API Gateway parameters
4. **Better Testing**: Lambda ARNs in outputs for integration tests
5. **Cost Optimized**: Removed unnecessary ECR infrastructure