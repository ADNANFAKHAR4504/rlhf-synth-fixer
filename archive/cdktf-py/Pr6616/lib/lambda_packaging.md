# Lambda Packaging Strategy

## Current Issues

1. **Pre-generated packages**: The `lambda_packages/` directory contains 15 pre-generated ZIP files which shouldn't be in version control
2. **Hardcoded PR numbers**: Files like `validation-lambda-pr6616.zip` have hardcoded PR numbers
3. **Storage waste**: Each ZIP file is 14MB, totaling ~210MB of unnecessary storage

## Recommended Solution

### 1. Dynamic Package Generation

The current code already generates Lambda packages dynamically during stack synthesis:

```python
def package_lambda(lambda_dir: str, function_name: str) -> str:
    """Package Lambda function with dependencies into a ZIP file."""
    # Creates ZIP files dynamically with environment suffix
```

### 2. Clean Up Pre-generated Files

```bash
# Remove all pre-generated Lambda packages
rm -rf lambda_packages/

# Add to .gitignore
echo "lambda_packages/" >> .gitignore
```

### 3. Improved Packaging Strategy

Consider these improvements:

1. **Cache packages**: Only rebuild if source files change
2. **Use Lambda Layers**: For common dependencies (boto3, aws-xray-sdk)
3. **Smaller packages**: Exclude unnecessary files
4. **Build-time generation**: Generate during `cdktf synth` or `terraform apply`

### 4. Alternative Approaches

#### Option A: Build During CI/CD
```yaml
- name: Package Lambdas
  run: |
    python scripts/package-lambdas.py --env ${{ env.ENVIRONMENT_SUFFIX }}
```

#### Option B: Use Docker for Consistent Builds
```python
def package_lambda_with_docker(lambda_dir: str, function_name: str) -> str:
    """Package Lambda using Docker for consistent builds."""
    subprocess.run([
        "docker", "run", "--rm",
        "-v", f"{lambda_dir}:/var/task",
        "-v", f"{output_dir}:/var/output",
        "public.ecr.aws/lambda/python:3.11",
        "pip", "install", "-r", "requirements.txt", "-t", "/var/output"
    ])
```

#### Option C: Use AWS SAM Build
```python
# In tap_stack.py
from aws_cdk_lib.aws_sam import CfnFunction

# This handles packaging automatically
```

## Recommended Implementation

1. Keep the current dynamic packaging in `tap_stack.py`
2. Remove all pre-generated ZIP files
3. Add `lambda_packages/` to `.gitignore`
4. Consider adding a package cache mechanism
5. For production, consider using Lambda Layers for dependencies
