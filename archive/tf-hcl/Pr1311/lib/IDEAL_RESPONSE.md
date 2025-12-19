# Terraform Infrastructure Code

## api_gateway.tf

```hcl
resource "aws_api_gateway_rest_api" "main" {
  name = "${var.project_name}-${var.environment_suffix}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-api"
    Environment = var.environment
  }
}

# API Gateway resources and methods for each service
resource "aws_api_gateway_resource" "services" {
  for_each = toset(["user", "order", "notification"])

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.key
}

resource "aws_api_gateway_method" "services_get" {
  for_each = aws_api_gateway_resource.services

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "services_post" {
  for_each = aws_api_gateway_resource.services

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway integrations
resource "aws_api_gateway_integration" "services_get" {
  for_each = aws_api_gateway_method.services_get

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.services[each.key].id
  http_method = each.value.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.services[each.key].invoke_arn
}

resource "aws_api_gateway_integration" "services_post" {
  for_each = aws_api_gateway_method.services_post

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.services[each.key].id
  http_method = each.value.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.services[each.key].invoke_arn
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.services_get,
    aws_api_gateway_integration.services_post
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  lifecycle {
    create_before_destroy = true
  }
}

# Enable X-Ray tracing for API Gateway
resource "aws_api_gateway_stage" "main" {
  stage_name    = var.environment
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id

  xray_tracing_enabled = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${var.environment}-stage"
    Environment = var.environment
  }
}
```

## cloudwatch.tf

```hcl
# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset(["user", "order", "notification"])

  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-${each.key}-service"
  retention_in_days = 14
  # kms_key_id        = aws_kms_key.pipeline_key.arn # Removed to avoid circular dependency

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${each.key}-logs"
    Environment = var.environment
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 14
  # kms_key_id        = aws_kms_key.pipeline_key.arn # Removed to avoid circular dependency

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-api-logs"
    Environment = var.environment
  }
}

# CloudWatch Log Groups for CodeBuild projects
resource "aws_cloudwatch_log_group" "codebuild_build" {
  name              = "/aws/codebuild/${var.project_name}-${var.environment_suffix}-build-test"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-codebuild-build-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "codebuild_deploy" {
  name              = "/aws/codebuild/${var.project_name}-${var.environment_suffix}-deploy"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-codebuild-deploy-logs"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "${var.project_name}-${var.environment_suffix}-user-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-order-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-notification-service"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Function Duration"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.environment_suffix}-user-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-order-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-notification-service"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Invocations"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.project_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Gateway Requests"
        }
      }
    ]
  })
}
```

## codebuild.tf

```hcl
resource "aws_codebuild_project" "build_and_test" {
  name         = "${var.project_name}-${var.environment_suffix}-build-test"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "ARTIFACTS_BUCKET"
      value = aws_s3_bucket.artifacts.bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-build-test"
    Environment = var.environment
  }
}

resource "aws_codebuild_project" "deploy" {
  name         = "${var.project_name}-${var.environment_suffix}-deploy"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "SNS_TOPIC_ARN"
      value = aws_sns_topic.deployment_notifications.arn
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "deployspec.yml"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-deploy"
    Environment = var.environment
  }
}
```

## codepipeline.tf

```hcl
# Commented out CodePipeline resource as it requires GitHub token in Secrets Manager
# To enable, create a secret named 'github-token' in AWS Secrets Manager with your GitHub OAuth token
/*
resource "aws_codepipeline" "main" {
  name     = "${var.project_name}-${var.environment_suffix}-pipeline"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.pipeline_key.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        Owner      = split("/", var.github_repo)[0]
        Repo       = split("/", var.github_repo)[1]
        Branch     = var.github_branch
        OAuthToken = "{{resolve:secretsmanager:github-token}}"
      }
    }
  }

  stage {
    name = "Build_and_Test"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.build_and_test.name
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      input_artifacts = ["build_output"]
      version         = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy.name
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-pipeline"
    Environment = var.environment
  }
}
*/
```

## data.tf

```hcl
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "codepipeline_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codepipeline.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "codebuild_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "codedeploy_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codedeploy.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}
```

## dynamodb.tf

```hcl
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-${var.environment_suffix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-users-table"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-${var.environment_suffix}-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user-id-index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-orders-table"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "notifications" {
  name         = "${var.project_name}-${var.environment_suffix}-notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notification_id"

  attribute {
    name = "notification_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-notifications-table"
    Environment = var.environment
  }
}
```

## iam.tf

```hcl
# Lambda execution roles
resource "aws_iam_role" "lambda_execution" {
  for_each = toset(["user", "order", "notification"])

  name               = "${var.project_name}-${var.environment_suffix}-${each.key}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${each.key}-lambda-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  for_each = aws_iam_role.lambda_execution

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_xray_access" {
  for_each = aws_iam_role.lambda_execution

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Lambda DynamoDB policy
resource "aws_iam_policy" "lambda_dynamodb" {
  name = "${var.project_name}-${var.environment_suffix}-lambda-dynamodb"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.orders.arn,
          aws_dynamodb_table.notifications.arn,
          "${aws_dynamodb_table.users.arn}/*",
          "${aws_dynamodb_table.orders.arn}/*",
          "${aws_dynamodb_table.notifications.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  for_each = aws_iam_role.lambda_execution

  role       = each.value.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

# CodePipeline role
resource "aws_iam_role" "codepipeline" {
  name               = "${var.project_name}-${var.environment_suffix}-codepipeline-role"
  assume_role_policy = data.aws_iam_policy_document.codepipeline_assume_role.json
}

resource "aws_iam_policy" "codepipeline" {
  name = "${var.project_name}-${var.environment_suffix}-codepipeline-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.artifacts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codedeploy:CreateDeployment",
          "codedeploy:GetDeployment",
          "codedeploy:GetDeploymentConfig",
          "codedeploy:RegisterApplicationRevision"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codepipeline" {
  role       = aws_iam_role.codepipeline.name
  policy_arn = aws_iam_policy.codepipeline.arn
}

# CodeBuild role
resource "aws_iam_role" "codebuild" {
  name               = "${var.project_name}-${var.environment_suffix}-codebuild-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume_role.json
}

resource "aws_iam_policy" "codebuild" {
  name = "${var.project_name}-${var.environment_suffix}-codebuild-policy"

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.artifacts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-${var.environment_suffix}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = aws_kms_key.pipeline_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codebuild" {
  role       = aws_iam_role.codebuild.name
  policy_arn = aws_iam_policy.codebuild.arn
}

# CodeDeploy role
resource "aws_iam_role" "codedeploy" {
  name               = "${var.project_name}-${var.environment_suffix}-codedeploy-role"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role.json
}

resource "aws_iam_role_policy_attachment" "codedeploy" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda"
}
```

## kms.tf

```hcl
resource "aws_kms_key" "pipeline_key" {
  description             = "KMS key for CI/CD pipeline encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCodePipelineAccess"
        Effect = "Allow"
        Principal = {
          Service = ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-pipeline-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "pipeline_key" {
  name          = "alias/${var.project_name}-${var.environment_suffix}-pipeline"
  target_key_id = aws_kms_key.pipeline_key.key_id
}
```

## lambda.tf

```hcl
# Create placeholder zip files for Lambda functions
data "archive_file" "lambda_placeholder" {
  for_each = toset(["user", "order", "notification"])

  type        = "zip"
  output_path = "${path.module}/${each.key}-lambda-placeholder.zip"

  source {
    content = templatefile("${path.module}/lambda_function.py.tpl", {
      service_name = each.key
    })
    filename = "lambda_function.py"
  }
}

# Lambda functions
resource "aws_lambda_function" "services" {
  for_each = toset(["user", "order", "notification"])

  function_name = "${var.project_name}-${var.environment_suffix}-${each.key}-service"
  role          = aws_iam_role.lambda_execution[each.key].arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  filename         = data.archive_file.lambda_placeholder[each.key].output_path
  source_code_hash = data.archive_file.lambda_placeholder[each.key].output_base64sha256

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      SERVICE_NAME        = each.key
      USERS_TABLE         = aws_dynamodb_table.users.name
      ORDERS_TABLE        = aws_dynamodb_table.orders.name
      NOTIFICATIONS_TABLE = aws_dynamodb_table.notifications.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${each.key}-service"
    Environment = var.environment
  }

  depends_on = [aws_cloudwatch_log_group.lambda_logs]
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = aws_lambda_function.services

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
```

## outputs.tf

```hcl
output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

# output "pipeline_name" {
#   description = "CodePipeline name"
#   value       = aws_codepipeline.main.name
# }

output "artifacts_bucket" {
  description = "S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "static_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "lambda_function_names" {
  description = "Lambda function names"
  value       = [for fn in aws_lambda_function.services : fn.function_name]
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users         = aws_dynamodb_table.users.name
    orders        = aws_dynamodb_table.orders.name
    notifications = aws_dynamodb_table.notifications.name
  }
}

output "sns_topic_arn" {
  description = "SNS topic ARN for deployment notifications"
  value       = aws_sns_topic.deployment_notifications.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.pipeline_key.key_id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
```

## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.2"
    }
  }

  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

## s3.tf

```hcl
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-${var.environment_suffix}-artifacts-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-artifacts"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-${var.environment_suffix}-static-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-static-assets"
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.pipeline_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.pipeline_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## sns.tf

```hcl
resource "aws_sns_topic" "deployment_notifications" {
  name = "${var.project_name}-${var.environment_suffix}-deployment-notifications"

  kms_master_key_id = aws_kms_key.pipeline_key.arn

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-deployment-notifications"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.deployment_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_policy" "deployment_notifications" {
  arn = aws_sns_topic.deployment_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.deployment_notifications.arn
      }
    ]
  })
}
```

## tap_stack.tf

```hcl
# Main Terraform configuration for microservices CI/CD infrastructure
# This file imports all the individual module files

```

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "microservices-cicd"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "your-org/microservices-app"
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email for deployment notifications"
  type        = string
  default     = "devops@example.com"
}

variable "environment_suffix" {
  description = "Suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"
}
```
