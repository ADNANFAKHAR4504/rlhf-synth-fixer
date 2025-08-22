You are an expert in Pulumi and AWS Infrastructure as Code using Python. Please write the complete `tap_stack.py` file for a Pulumi ComponentResource called `TapStack`. This file must implement the following infrastructure using AWS in us-west-2 for the IaC - AWS Nova Model Breaking project.

## Infrastructure Requirements

Your Pulumi code must provision the following serverless infrastructure, using Pulumi with Python:

### 1. AWS Lambda

Create one or more Lambda functions to handle HTTP requests.

- Use the Python runtime (`python3.9` or latest supported)
- Configure environment variables using Pulumi config, not hardcoded values
- Ensure CloudWatch logging is enabled
- Name the function with prefix: `prod-`

### 2. AWS API Gateway (HTTP API)

Create an API Gateway (REST or HTTP API v2) that:

- Integrates with the Lambda function(s)
- Supports basic routes (e.g., `/`, `/health`)
- Name the API with prefix: `prod-`

### 3. IAM Roles & Policies

Create a dedicated IAM role for Lambda execution.

Define least-privilege permissions:

- Allow Lambda to write logs to CloudWatch
- Allow access to environment variables or S3 (if needed)
- Name role/policy with prefix: `prod-`

### 4. S3 Bucket

Create a private S3 bucket named with `prod-` prefix.

Enable:

- Versioning
- Server-side encryption
- Block public access
- Intended for data storage by the Lambda or application

### 5. CloudWatch Alerts

Create CloudWatch alarms that:

- Monitor Lambda errors using Errors metric
- Alert when error count exceeds a threshold (e.g., 1 in 5 minutes)
- Use Pulumi-native alarms, with names prefixed as `prod-`

## Implementation Constraints

Use the `TapStack` class inside `tap_stack.py` (already scaffolded).

Do not define resources directly inside `__init__`; instead:

- Split infrastructure setup into helper methods like `_create_lambda()`, `_create_api_gateway()`, `_create_s3_bucket()`, etc.
- Use these helper methods inside `__init__`
- Use values from `TapStackArgs`, Pulumi Config, or environment variables (from `os.environ`)
- Do not hardcode any sensitive values
- Use `self.tags` and `self.environment_suffix` from the provided `TapStackArgs`
- All resources must use Pulumi's `ResourceOptions(parent=self)` for hierarchy
- Apply consistent naming using the `prod-` prefix + `self.environment_suffix`
- Add detailed comments above each resource block or method, explaining what it does and why

## Expected Output

A single Python file `tap_stack.py` that defines the full `TapStack` class.

It should:

- Deploy successfully using `pulumi up`
- Match the structure defined in your existing template
- Be clean, modular, testable, and production-grade
- Do not include the `tap.py` entry point - that already exists and will instantiate this `TapStack`
