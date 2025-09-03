I'll design a complete CI/CD pipeline for a serverless application using Terraform. Here's the comprehensive solution:

## Project Structure

```
terraform-serverless-pipeline/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── lambda/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── codebuild/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── codepipeline/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── buildspec/
    ├── buildspec-build.yml
    ├── buildspec-test.yml
    └── buildspec-deploy.yml
```

## Root Configuration Files

### main.tf
```hcl
# Configure Terraform and AWS Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for CodePipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "${var.environment}-${var.project_name}-pipeline-artifacts-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Lambda function module
module "lambda" {
  source = "./modules/lambda"
  
  environment    = var.environment
  project_name   = var.project_name
  function_name  = var.lambda_function_name
  runtime        = var.lambda_runtime
  handler        = var.lambda_handler
  timeout        = var.lambda_timeout
  memory_size    = var.lambda_memory_size
}

# CodeBuild projects module
module "codebuild" {
  source = "./modules/codebuild"
  
  environment           = var.environment
  project_name         = var.project_name
  source_repository    = var.source_repository
  artifacts_bucket     = aws_s3_bucket.pipeline_artifacts.bucket
  lambda_function_name = module.lambda.function_name
}

# CodePipeline module
module "codepipeline" {
  source = "./modules/codepipeline"
  
  environment              = var.environment
  project_name            = var.project_name
  source_repository       = var.source_repository
  source_branch           = var.source_branch
  artifacts_bucket        = aws_s3_bucket.pipeline_artifacts.bucket
  build_project_name      = module.codebuild.build_project_name
  test_project_name       = module.codebuild.test_project_name
  deploy_project_name     = module.codebuild.deploy_project_name
  lambda_function_name    = module.lambda.function_name
}
```

### variables.tf
```hcl
# Environment and project configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-app"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = contains(["us-east-1", "us-west-2"], var.aws_region)
    error_message = "AWS region must be either us-east-1 or us-west-2."
  }
}

# Source repository configuration
variable "source_repository" {
  description = "Source repository URL"
  type        = string
}

variable "source_branch" {
  description = "Source repository branch"
  type        = string
  default     = "main"
}

# Lambda function configuration
variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "api-handler"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.9"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}
```

### outputs.tf
```hcl
# Pipeline outputs
output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = module.codepipeline.pipeline_arn
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = module.codepipeline.pipeline_name
}

# Build project outputs
output "build_project_arn" {
  description = "ARN of the CodeBuild build project"
  value       = module.codebuild.build_project_arn
}

output "test_project_arn" {
  description = "ARN of the CodeBuild test project"
  value       = module.codebuild.test_project_arn
}

output "deploy_project_arn" {
  description = "ARN of the CodeBuild deploy project"
  value       = module.codebuild.deploy_project_arn
}

# Lambda function outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.lambda.function_arn
}

# Deployment status and configuration
output "deployment_status" {
  description = "Deployment configuration status"
  value = {
    environment = var.environment
    region      = var.aws_region
    pipeline    = module.codepipeline.pipeline_name
    lambda      = module.lambda.function_name
  }
}

# S3 artifacts bucket
output "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.bucket
}
```

## Lambda Module

### modules/lambda/main.tf
```hcl
# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-${var.project_name}-${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Lambda function
resource "aws_lambda_function" "main" {
  function_name = "${var.environment}-${var.project_name}-${var.function_name}"
  role         = aws_iam_role.lambda_role.arn
  handler      = var.handler
  runtime      = var.runtime
  timeout      = var.timeout
  memory_size  = var.memory_size

  # Initial dummy code - will be replaced by pipeline
  filename         = "${path.module}/dummy.zip"
  source_code_hash = data.archive_file.dummy.output_base64sha256

  # Enable versioning for rollback capability
  publish = true

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }
}

# Create dummy zip file for initial deployment
data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/dummy.zip"
  source {
    content  = "def handler(event, context): return {'statusCode': 200, 'body': 'Hello World'}"
    filename = "index.py"
  }
}

# Lambda alias for blue/green deployments
resource "aws_lambda_alias" "main" {
  name             = "live"
  description      = "Live alias for ${aws_lambda_function.main.function_name}"
  function_name    = aws_lambda_function.main.function_name
  function_version = aws_lambda_function.main.version
}
```

### modules/lambda/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "timeout" {
  description = "Lambda timeout"
  type        = number
}

variable "memory_size" {
  description = "Lambda memory size"
  type        = number
}
```

### modules/lambda/outputs.tf
```hcl
output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "alias_arn" {
  description = "ARN of the Lambda alias"
  value       = aws_lambda_alias.main.arn
}
```

## CodeBuild Module

### modules/codebuild/main.tf
```hcl
# CodeBuild service role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.environment}-${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

# CodeBuild policy for basic operations
resource "aws_iam_role_policy" "codebuild_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifacts_bucket}",
          "arn:aws:s3:::${var.artifacts_bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:PublishVersion",
          "lambda:UpdateAlias",
          "lambda:GetAlias"
        ]
        Resource = "arn:aws:lambda:*:*:function:${var.lambda_function_name}*"
      }
    ]
  })
}

# Build project for packaging Lambda code
resource "aws_codebuild_project" "build" {
  name          = "${var.environment}-${var.project_name}-build"
  description   = "Build project for packaging Lambda code"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-build.yml"
  }
}

# Test project for running automated tests
resource "aws_codebuild_project" "test" {
  name          = "${var.environment}-${var.project_name}-test"
  description   = "Test project for running automated tests"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-test.yml"
  }
}

# Deploy project for Lambda deployment with rollback
resource "aws_codebuild_project" "deploy" {
  name          = "${var.environment}-${var.project_name}-deploy"
  description   = "Deploy project for Lambda deployment with rollback"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"
    
    environment_variable {
      name  = "LAMBDA_FUNCTION_NAME"
      value = var.lambda_function_name
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-deploy.yml"
  }
}
```

### modules/codebuild/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "source_repository" {
  description = "Source repository URL"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for artifacts"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}
```

### modules/codebuild/outputs.tf
```hcl
output "build_project_name" {
  description = "Name of the build project"
  value       = aws_codebuild_project.build.name
}

output "build_project_arn" {
  description = "ARN of the build project"
  value       = aws_codebuild_project.build.arn
}

output "test_project_name" {
  description = "Name of the test project"
  value       = aws_codebuild_project.test.name
}

output "test_project_arn" {
  description = "ARN of the test project"
  value       = aws_codebuild_project.test.arn
}

output "deploy_project_name" {
  description = "Name of the deploy project"
  value       = aws_codebuild_project.deploy.name
}

output "deploy_project_arn" {
  description = "ARN of the deploy project"
  value       = aws_codebuild_project.deploy.arn
}
```

## CodePipeline Module

### modules/codepipeline/main.tf
```hcl
# CodePipeline service role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.environment}-${var.project_name}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

# CodePipeline policy
resource "aws_iam_role_policy" "codepipeline_policy" {
  role = aws_iam_role.codepipeline_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifacts_bucket}",
          "arn:aws:s3:::${var.artifacts_bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = [
          "arn:aws:codebuild:*:*:project/${var.build_project_name}",
          "arn:aws:codebuild:*:*:project/${var.test_project_name}",
          "arn:aws:codebuild:*:*:project/${var.deploy_project_name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:CancelUploadArchive",
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:GetRepository",
          "codecommit:ListBranches",
          "codecommit:ListRepositories"
        ]
        Resource = var.source_repository
      }
    ]
  })
}

# CodePipeline
resource "aws_codepipeline" "main" {
  name     = "${var.environment}-${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = var.artifacts_bucket
    type     = "S3"
  }

  # Source stage
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = basename(var.source_repository)
        BranchName     = var.source_branch
      }
    }
  }

  # Build stage
  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = var.build_project_name
      }
    }
  }

  # Test stage
  stage {
    name = "Test"

    action {
      name             = "Test"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["build_output"]
      output_artifacts = ["test_output"]
      version          = "1"

      configuration = {
        ProjectName = var.test_project_name
      }
    }
  }

  # Deploy stage
  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      input_artifacts = ["test_output"]
      version         = "1"

      configuration = {
        ProjectName = var.deploy_project_name
      }
    }
  }
}
```

### modules/codepipeline/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "source_repository" {
  description = "Source repository URL"
  type        = string
}

variable "source_branch" {
  description = "Source repository branch"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for artifacts"
  type        = string
}

variable "build_project_name" {
  description = "CodeBuild build project name"
  type        = string
}

variable "test_project_name" {
  description = "CodeBuild test project name"
  type        = string
}

variable "deploy_project_name" {
  description = "CodeBuild deploy project name"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}
```

### modules/codepipeline/outputs.tf
```hcl
output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.main.arn
}
```

## BuildSpec Files

### buildspec/buildspec-build.yml
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.9
  pre_build:
    commands:
      - echo Build started on `date`
      - echo Installing dependencies...
      - pip install -r requirements.txt -t .
  build:
    commands:
      - echo Build phase started on `date`
      - echo Packaging Lambda function...
      - zip -r deployment-package.zip . -x "*.git*" "buildspec/*" "terraform/*" "*.md" "*.txt"
  post_build:
    commands:
      - echo Build completed on `date`

artifacts:
  files:
    - deployment-package.zip
    - buildspec/buildspec-test.yml
    - buildspec/buildspec-deploy.yml
```

### buildspec/buildspec-test.yml
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.9
  pre_build:
    commands:
      - echo Test started on `date`
      - echo Installing test dependencies...
      - pip install pytest boto3 moto
  build:
    commands:
      - echo Running tests...
      - unzip deployment-package.zip -d test-env/
      - cd test-env
      - python -m pytest ../tests/ -v || exit 1
  post_build:
    commands:
      - echo Tests completed on `date`

artifacts:
  files:
    - deployment-package.zip
    - buildspec/buildspec-deploy.yml
```

### buildspec/buildspec-deploy.yml
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.9
  pre_build:
    commands:
      - echo Deploy started on `date`
      - echo Installing AWS CLI...
      - pip install awscli
      - echo Getting current Lambda version for rollback...
      - CURRENT_VERSION=$(aws lambda get-alias --function-name $LAMBDA_FUNCTION_NAME --name live --query 'FunctionVersion' --output text)
      - echo "Current version is $CURRENT_VERSION"
  build:
    commands:
      - echo Deploying Lambda function...
      - echo Updating function code...
      - aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://deployment-package.zip
      - echo Publishing new version...
      - NEW_VERSION=$(aws lambda publish-version --function-name $LAMBDA_FUNCTION_NAME --query 'Version' --output text)
      - echo "New version is $NEW_VERSION"
      - echo Updating alias to new version...
      - aws lambda update-alias --function-name $LAMBDA_FUNCTION_NAME --name live --function-version $NEW_VERSION
      - echo Running deployment verification...
      - sleep 10
      - echo Testing new deployment...
      - aws lambda invoke --function-name $LAMBDA_FUNCTION_NAME:live response.json
      - if [ $? -ne 0 ]; then echo "Deployment verification failed, rolling back..."; aws lambda update-alias --function-name $LAMBDA_FUNCTION_NAME --name live --function-version $CURRENT_VERSION; exit 1; fi
  post_build:
    commands:
      - echo Deploy completed successfully on `date`
      - echo "Deployed version $NEW_VERSION to live alias"
```

## Example Configuration File

### terraform.tfvars.example
```hcl
# Environment configuration
environment = "dev"
project_name = "serverless-app"
aws_region = "us-east-1"

# Source repository
source_repository = "https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-serverless-app"
source_branch = "main"

# Lambda configuration
lambda_function_name = "api-handler"
lambda_runtime = "python3.9"
lambda_handler = "index.handler"
lambda_timeout = 30
lambda_memory_size = 128
```

## Usage Instructions

1. **Initialize the project:**
```bash
# Clone or create the directory structure
mkdir terraform-serverless-pipeline
cd terraform-serverless-pipeline

# Copy all the files above into their respective locations
# Create terraform.tfvars from the example
cp terraform.tfvars.example terraform.tfvars
```

2. **Configure variables:**
Edit `terraform.tfvars` with your specific values:
```hcl
environment = "dev"
project_name = "my-app"
aws_region = "us-east-1"
source_repository = "your-codecommit-repo-url"
```

3. **Deploy the infrastructure:**
```bash
# Initialize Terraform
terraform init

# Validate the configuration
terraform validate

# Plan the deployment
terraform plan

# Apply the changes
terraform apply
```

4. **Switch environments or regions:**
```bash
# For production in us-west-2
terraform apply -var="environment=prod" -var="aws_region=us-west-2"
```

## Key Features

✅ **Modular Design**: Reusable modules for Lambda, CodeBuild, and CodePipeline
✅ **Multi-Environment**: Environment-based resource naming with prefixes
✅ **Multi-Region**: Easy switching between us-east-1 and us-west-2
✅ **Security**: Least-privilege IAM roles and policies
✅ **Automated Testing**: Integrated test stage in the pipeline
✅ **Rollback Capability**: Automatic rollback on deployment failure
✅ **Blue/Green Deployment**: Using Lambda aliases for safe deployments
✅ **Terraform Standards**: Proper structure with validation support

The pipeline will automatically:
- Build and package your Lambda code
- Run automated tests
- Deploy to Lambda with versioning
- Rollback automatically if deployment fails
- Provide comprehensive outputs for monitoring

This solution is production-ready and follows AWS and Terraform best practices for maintainability and security.