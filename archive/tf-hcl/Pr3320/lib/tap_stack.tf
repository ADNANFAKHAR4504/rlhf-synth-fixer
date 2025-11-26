# tap_stack.tf
# Complete Terraform stack for Fitness Application Serverless API
# Platform: tf-hcl | Complexity: medium | Single-turn task

#######################
# Variables
#######################

variable "aws_region" {
  description = "AWS region to deploy resources (from provider.tf)"
  type        = string
}

variable "app_name" {
  description = "Name of the fitness application"
  type        = string
  default     = "fitness-app"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Fitness Application API"
}

# DynamoDB configuration
variable "dynamodb_read_capacity" {
  description = "Initial read capacity for DynamoDB table"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Initial write capacity for DynamoDB table"
  type        = number
  default     = 5
}

variable "dynamodb_autoscaling_min_read_capacity" {
  description = "Minimum read capacity for DynamoDB auto scaling"
  type        = number
  default     = 5
}

variable "dynamodb_autoscaling_max_read_capacity" {
  description = "Maximum read capacity for DynamoDB auto scaling"
  type        = number
  default     = 100
}

variable "dynamodb_autoscaling_min_write_capacity" {
  description = "Minimum write capacity for DynamoDB auto scaling"
  type        = number
  default     = 5
}

variable "dynamodb_autoscaling_max_write_capacity" {
  description = "Maximum write capacity for DynamoDB auto scaling"
  type        = number
  default     = 100
}

variable "dynamodb_autoscaling_target_value_read" {
  description = "Target value for DynamoDB auto scaling read capacity (percentage)"
  type        = number
  default     = 70
}

variable "dynamodb_autoscaling_target_value_write" {
  description = "Target value for DynamoDB auto scaling write capacity (percentage)"
  type        = number
  default     = 70
}

#######################
# Local Values
#######################

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  name_prefix = "${var.app_name}-${var.environment}"
}

#######################
# Data Sources
#######################

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

#######################
# KMS Key for Encryption
#######################

resource "aws_kms_key" "fitness_app_key" {
  description             = "KMS CMK for encrypting fitness application data at rest"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-kms-key"
    }
  )
}

resource "aws_kms_alias" "fitness_app_key_alias" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.fitness_app_key.key_id
}

#######################
# SSM Parameters (Encrypted with KMS)
#######################

resource "aws_ssm_parameter" "api_stage" {
  name        = "/${var.app_name}/${var.environment}/api_stage"
  description = "API Gateway Stage Name"
  type        = "String"
  value       = var.environment
  key_id      = aws_kms_key.fitness_app_key.key_id

  tags = local.common_tags
}

resource "aws_ssm_parameter" "log_level" {
  name        = "/${var.app_name}/${var.environment}/log_level"
  description = "Log level for the application"
  type        = "String"
  value       = "INFO"
  key_id      = aws_kms_key.fitness_app_key.key_id

  tags = local.common_tags
}

resource "aws_ssm_parameter" "api_key" {
  name        = "/${var.app_name}/${var.environment}/api_key"
  description = "API Key for external services (encrypted with KMS CMK)"
  type        = "SecureString"
  value       = "change-me-in-production-secure-api-key"
  key_id      = aws_kms_key.fitness_app_key.key_id

  tags = local.common_tags
}

#######################
# DynamoDB Table with KMS Encryption
#######################

resource "aws_dynamodb_table" "workout_logs" {
  name         = "${local.name_prefix}-workout-logs"
  billing_mode = "PROVISIONED"

  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity

  hash_key  = "UserId"
  range_key = "WorkoutId"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "WorkoutId"
    type = "S"
  }

  attribute {
    name = "WorkoutDate"
    type = "S"
  }

  # Global Secondary Index for querying by date
  global_secondary_index {
    name               = "WorkoutDateIndex"
    hash_key           = "UserId"
    range_key          = "WorkoutDate"
    write_capacity     = var.dynamodb_write_capacity
    read_capacity      = var.dynamodb_read_capacity
    projection_type    = "ALL"
  }

  # Enable Point-in-Time Recovery for data protection
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption with KMS CMK
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.fitness_app_key.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-workout-logs"
    }
  )
}

#######################
# DynamoDB Auto Scaling
#######################

# Table Read Capacity Auto Scaling
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  max_capacity       = var.dynamodb_autoscaling_max_read_capacity
  min_capacity       = var.dynamodb_autoscaling_min_read_capacity
  resource_id        = "table/${aws_dynamodb_table.workout_logs.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  name               = "${local.name_prefix}-dynamodb-read-capacity-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.dynamodb_autoscaling_target_value_read
  }
}

# Table Write Capacity Auto Scaling
resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  max_capacity       = var.dynamodb_autoscaling_max_write_capacity
  min_capacity       = var.dynamodb_autoscaling_min_write_capacity
  resource_id        = "table/${aws_dynamodb_table.workout_logs.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  name               = "${local.name_prefix}-dynamodb-write-capacity-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.dynamodb_autoscaling_target_value_write
  }
}

# GSI Read Capacity Auto Scaling
resource "aws_appautoscaling_target" "dynamodb_gsi_read_target" {
  max_capacity       = var.dynamodb_autoscaling_max_read_capacity
  min_capacity       = var.dynamodb_autoscaling_min_read_capacity
  resource_id        = "table/${aws_dynamodb_table.workout_logs.name}/index/WorkoutDateIndex"
  scalable_dimension = "dynamodb:index:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_gsi_read_policy" {
  name               = "${local.name_prefix}-dynamodb-gsi-read-capacity-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_gsi_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_gsi_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_gsi_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.dynamodb_autoscaling_target_value_read
  }
}

# GSI Write Capacity Auto Scaling
resource "aws_appautoscaling_target" "dynamodb_gsi_write_target" {
  max_capacity       = var.dynamodb_autoscaling_max_write_capacity
  min_capacity       = var.dynamodb_autoscaling_min_write_capacity
  resource_id        = "table/${aws_dynamodb_table.workout_logs.name}/index/WorkoutDateIndex"
  scalable_dimension = "dynamodb:index:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_gsi_write_policy" {
  name               = "${local.name_prefix}-dynamodb-gsi-write-capacity-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_gsi_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_gsi_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_gsi_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.dynamodb_autoscaling_target_value_write
  }
}

#######################
# Lambda IAM Role and Policies (Least Privilege)
#######################

resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

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

  tags = local.common_tags
}

# DynamoDB access policy with least privilege
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${local.name_prefix}-lambda-dynamodb-policy"
  description = "Policy for Lambda to access DynamoDB workout table with least privilege"

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
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.workout_logs.arn,
          "${aws_dynamodb_table.workout_logs.arn}/index/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# SSM Parameter Store access policy
resource "aws_iam_policy" "lambda_ssm_policy" {
  name        = "${local.name_prefix}-lambda-ssm-policy"
  description = "Policy for Lambda to access SSM Parameter Store with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.app_name}/${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.fitness_app_key.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

# CloudWatch Logs policy
resource "aws_iam_policy" "lambda_cloudwatch_policy" {
  name        = "${local.name_prefix}-lambda-cloudwatch-policy"
  description = "Policy for Lambda to write logs to CloudWatch with least privilege"

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*:*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# X-Ray tracing policy
resource "aws_iam_policy" "lambda_xray_policy" {
  name        = "${local.name_prefix}-lambda-xray-policy"
  description = "Policy for Lambda X-Ray tracing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = ["*"]
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_ssm_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_ssm_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_cloudwatch_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_xray_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_xray_policy.arn
}

#######################
# Lambda Function Code (Archive Data Sources)
#######################

data "archive_file" "lambda_get_workouts" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/get_workouts.zip"

  source {
    content  = file("${path.module}/lambda_code/get_workouts.py")
    filename = "get_workouts.py"
  }
}

data "archive_file" "lambda_create_workout" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/create_workout.zip"

  source {
    content  = file("${path.module}/lambda_code/create_workout.py")
    filename = "create_workout.py"
  }
}

data "archive_file" "lambda_update_workout" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/update_workout.zip"

  source {
    content  = file("${path.module}/lambda_code/update_workout.py")
    filename = "update_workout.py"
  }
}

data "archive_file" "lambda_delete_workout" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/delete_workout.zip"

  source {
    content  = file("${path.module}/lambda_code/delete_workout.py")
    filename = "delete_workout.py"
  }
}

#######################
# Lambda Functions (Python 3.10)
#######################

resource "aws_lambda_function" "get_workouts" {
  function_name = "${local.name_prefix}-get-workouts"
  description   = "Lambda function to retrieve user workout logs"

  filename         = data.archive_file.lambda_get_workouts.output_path
  source_code_hash = data.archive_file.lambda_get_workouts.output_base64sha256
  handler          = "get_workouts.lambda_handler"
  runtime          = "python3.10"

  role        = aws_iam_role.lambda_role.arn
  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PARAM_STORE_PATH = "/${var.app_name}/${var.environment}"
      TABLE_NAME       = aws_dynamodb_table.workout_logs.name
      LOG_LEVEL        = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-get-workouts"
    }
  )
}

resource "aws_cloudwatch_log_group" "get_workouts_logs" {
  name              = "/aws/lambda/${aws_lambda_function.get_workouts.function_name}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_lambda_function" "create_workout" {
  function_name = "${local.name_prefix}-create-workout"
  description   = "Lambda function to create new workout logs"

  filename         = data.archive_file.lambda_create_workout.output_path
  source_code_hash = data.archive_file.lambda_create_workout.output_base64sha256
  handler          = "create_workout.lambda_handler"
  runtime          = "python3.10"

  role        = aws_iam_role.lambda_role.arn
  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PARAM_STORE_PATH = "/${var.app_name}/${var.environment}"
      TABLE_NAME       = aws_dynamodb_table.workout_logs.name
      LOG_LEVEL        = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-create-workout"
    }
  )
}

resource "aws_cloudwatch_log_group" "create_workout_logs" {
  name              = "/aws/lambda/${aws_lambda_function.create_workout.function_name}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_lambda_function" "update_workout" {
  function_name = "${local.name_prefix}-update-workout"
  description   = "Lambda function to update existing workout logs"

  filename         = data.archive_file.lambda_update_workout.output_path
  source_code_hash = data.archive_file.lambda_update_workout.output_base64sha256
  handler          = "update_workout.lambda_handler"
  runtime          = "python3.10"

  role        = aws_iam_role.lambda_role.arn
  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PARAM_STORE_PATH = "/${var.app_name}/${var.environment}"
      TABLE_NAME       = aws_dynamodb_table.workout_logs.name
      LOG_LEVEL        = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-update-workout"
    }
  )
}

resource "aws_cloudwatch_log_group" "update_workout_logs" {
  name              = "/aws/lambda/${aws_lambda_function.update_workout.function_name}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_lambda_function" "delete_workout" {
  function_name = "${local.name_prefix}-delete-workout"
  description   = "Lambda function to delete workout logs"

  filename         = data.archive_file.lambda_delete_workout.output_path
  source_code_hash = data.archive_file.lambda_delete_workout.output_base64sha256
  handler          = "delete_workout.lambda_handler"
  runtime          = "python3.10"

  role        = aws_iam_role.lambda_role.arn
  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PARAM_STORE_PATH = "/${var.app_name}/${var.environment}"
      TABLE_NAME       = aws_dynamodb_table.workout_logs.name
      LOG_LEVEL        = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-delete-workout"
    }
  )
}

resource "aws_cloudwatch_log_group" "delete_workout_logs" {
  name              = "/aws/lambda/${aws_lambda_function.delete_workout.function_name}"
  retention_in_days = 7

  tags = local.common_tags
}

#######################
# API Gateway REST API (Edge-Optimized)
#######################

resource "aws_api_gateway_rest_api" "fitness_api" {
  name        = "${local.name_prefix}-api"
  description = "Fitness Application Serverless API with secure endpoints"

  endpoint_configuration {
    types = ["EDGE"]
  }

  tags = local.common_tags
}

# API Gateway Resources
resource "aws_api_gateway_resource" "workouts_resource" {
  rest_api_id = aws_api_gateway_rest_api.fitness_api.id
  parent_id   = aws_api_gateway_rest_api.fitness_api.root_resource_id
  path_part   = "workouts"
}

resource "aws_api_gateway_resource" "workout_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.fitness_api.id
  parent_id   = aws_api_gateway_resource.workouts_resource.id
  path_part   = "{workoutId}"
}

# GET /workouts
resource "aws_api_gateway_method" "get_workouts_method" {
  rest_api_id   = aws_api_gateway_rest_api.fitness_api.id
  resource_id   = aws_api_gateway_resource.workouts_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_workouts_integration" {
  rest_api_id             = aws_api_gateway_rest_api.fitness_api.id
  resource_id             = aws_api_gateway_resource.workouts_resource.id
  http_method             = aws_api_gateway_method.get_workouts_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_workouts.invoke_arn
}

# POST /workouts
resource "aws_api_gateway_method" "post_workout_method" {
  rest_api_id   = aws_api_gateway_rest_api.fitness_api.id
  resource_id   = aws_api_gateway_resource.workouts_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_workout_integration" {
  rest_api_id             = aws_api_gateway_rest_api.fitness_api.id
  resource_id             = aws_api_gateway_resource.workouts_resource.id
  http_method             = aws_api_gateway_method.post_workout_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_workout.invoke_arn
}

# PUT /workouts/{workoutId}
resource "aws_api_gateway_method" "put_workout_method" {
  rest_api_id   = aws_api_gateway_rest_api.fitness_api.id
  resource_id   = aws_api_gateway_resource.workout_id_resource.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "put_workout_integration" {
  rest_api_id             = aws_api_gateway_rest_api.fitness_api.id
  resource_id             = aws_api_gateway_resource.workout_id_resource.id
  http_method             = aws_api_gateway_method.put_workout_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_workout.invoke_arn
}

# DELETE /workouts/{workoutId}
resource "aws_api_gateway_method" "delete_workout_method" {
  rest_api_id   = aws_api_gateway_rest_api.fitness_api.id
  resource_id   = aws_api_gateway_resource.workout_id_resource.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "delete_workout_integration" {
  rest_api_id             = aws_api_gateway_rest_api.fitness_api.id
  resource_id             = aws_api_gateway_resource.workout_id_resource.id
  http_method             = aws_api_gateway_method.delete_workout_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.delete_workout.invoke_arn
}

# Lambda Permissions for API Gateway Invocation
resource "aws_lambda_permission" "get_workouts_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetWorkouts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_workouts.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fitness_api.execution_arn}/*/${aws_api_gateway_method.get_workouts_method.http_method}${aws_api_gateway_resource.workouts_resource.path}"
}

resource "aws_lambda_permission" "create_workout_permission" {
  statement_id  = "AllowAPIGatewayInvokeCreateWorkout"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_workout.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fitness_api.execution_arn}/*/${aws_api_gateway_method.post_workout_method.http_method}${aws_api_gateway_resource.workouts_resource.path}"
}

resource "aws_lambda_permission" "update_workout_permission" {
  statement_id  = "AllowAPIGatewayInvokeUpdateWorkout"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_workout.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fitness_api.execution_arn}/*/${aws_api_gateway_method.put_workout_method.http_method}${aws_api_gateway_resource.workout_id_resource.path}"
}

resource "aws_lambda_permission" "delete_workout_permission" {
  statement_id  = "AllowAPIGatewayInvokeDeleteWorkout"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_workout.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fitness_api.execution_arn}/*/${aws_api_gateway_method.delete_workout_method.http_method}${aws_api_gateway_resource.workout_id_resource.path}"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.get_workouts_integration,
    aws_api_gateway_integration.post_workout_integration,
    aws_api_gateway_integration.put_workout_integration,
    aws_api_gateway_integration.delete_workout_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.fitness_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.workouts_resource.id,
      aws_api_gateway_resource.workout_id_resource.id,
      aws_api_gateway_method.get_workouts_method.id,
      aws_api_gateway_method.post_workout_method.id,
      aws_api_gateway_method.put_workout_method.id,
      aws_api_gateway_method.delete_workout_method.id,
      aws_api_gateway_integration.get_workouts_integration.id,
      aws_api_gateway_integration.post_workout_integration.id,
      aws_api_gateway_integration.put_workout_integration.id,
      aws_api_gateway_integration.delete_workout_integration.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.name_prefix}-api"
  retention_in_days = 7

  tags = local.common_tags
}

# API Gateway Stage with Logging and Tracing
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.fitness_api.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      ip                      = "$context.identity.sourceIp"
      caller                  = "$context.identity.caller"
      user                    = "$context.identity.user"
      requestTime             = "$context.requestTime"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      status                  = "$context.status"
      protocol                = "$context.protocol"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  tags = local.common_tags
}

# API Gateway Account (for CloudWatch Logs)
resource "aws_api_gateway_account" "api_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "${local.name_prefix}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_policy" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

#######################
# CloudWatch Monitoring and Alarms
#######################

# API Gateway Error Alarm
resource "aws_cloudwatch_metric_alarm" "api_errors_alarm" {
  alarm_name          = "${local.name_prefix}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when API Gateway returns more than 5 server errors in 1 minute"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.fitness_api.name
    Stage   = aws_api_gateway_stage.api_stage.stage_name
  }

  tags = local.common_tags
}

# API Gateway Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_latency_alarm" {
  alarm_name          = "${local.name_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Alert when average API Gateway latency exceeds 1 second for 2 consecutive minutes"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.fitness_api.name
    Stage   = aws_api_gateway_stage.api_stage.stage_name
  }

  tags = local.common_tags
}

# DynamoDB Read Throttle Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttle_alarm" {
  alarm_name          = "${local.name_prefix}-dynamodb-read-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when DynamoDB read operations are being throttled"

  dimensions = {
    TableName = aws_dynamodb_table.workout_logs.name
  }

  tags = local.common_tags
}

# DynamoDB Write Throttle Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttle_alarm" {
  alarm_name          = "${local.name_prefix}-dynamodb-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when DynamoDB write operations are being throttled"

  dimensions = {
    TableName = aws_dynamodb_table.workout_logs.name
  }

  tags = local.common_tags
}

# Lambda Error Alarm for Get Workouts
resource "aws_cloudwatch_metric_alarm" "lambda_get_workouts_errors" {
  alarm_name          = "${local.name_prefix}-lambda-get-workouts-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when get_workouts Lambda function has more than 5 errors in 1 minute"

  dimensions = {
    FunctionName = aws_lambda_function.get_workouts.function_name
  }

  tags = local.common_tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "fitness_app_dashboard" {
  dashboard_name = "${local.name_prefix}-dashboard"

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
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.fitness_api.name, "Stage", aws_api_gateway_stage.api_stage.stage_name, { stat = "Sum", label = "Total Requests" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Gateway - Request Count"
          period  = 300
          region  = data.aws_region.current.name
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
            ["AWS/ApiGateway", "Latency", "ApiName", aws_api_gateway_rest_api.fitness_api.name, "Stage", aws_api_gateway_stage.api_stage.stage_name, { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Gateway - Latency (ms)"
          period  = 300
          region  = data.aws_region.current.name
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
            ["AWS/ApiGateway", "4XXError", "ApiName", aws_api_gateway_rest_api.fitness_api.name, "Stage", aws_api_gateway_stage.api_stage.stage_name, { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", ".", ".", ".", ".", { stat = "Sum", label = "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Gateway - Error Count"
          period  = 300
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.workout_logs.name, { stat = "Sum", label = "Read Capacity" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Write Capacity" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "DynamoDB - Consumed Capacity"
          period  = 300
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", aws_dynamodb_table.workout_logs.name, { stat = "Sum", label = "Read Throttles" }],
            [".", "WriteThrottleEvents", ".", ".", { stat = "Sum", label = "Write Throttles" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "DynamoDB - Throttle Events"
          period  = 300
          region  = data.aws_region.current.name
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.get_workouts.function_name, { stat = "Sum", label = "Get" }],
            ["...", aws_lambda_function.create_workout.function_name, { stat = "Sum", label = "Create" }],
            ["...", aws_lambda_function.update_workout.function_name, { stat = "Sum", label = "Update" }],
            ["...", aws_lambda_function.delete_workout.function_name, { stat = "Sum", label = "Delete" }]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda - Invocations"
          period  = 300
          region  = data.aws_region.current.name
        }
      }
    ]
  })
}

#######################
# Outputs
#######################

output "api_url" {
  description = "Base URL of the deployed API Gateway"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}"
}

output "api_endpoint_get_workouts" {
  description = "Full endpoint to GET workouts"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/workouts?user_id=<USER_ID>"
}

output "api_endpoint_create_workout" {
  description = "Full endpoint to POST (create) a workout"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/workouts"
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB workout logs table"
  value       = aws_dynamodb_table.workout_logs.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB workout logs table"
  value       = aws_dynamodb_table.workout_logs.arn
}

output "lambda_functions" {
  description = "Names of all Lambda functions"
  value = {
    get_workouts    = aws_lambda_function.get_workouts.function_name
    create_workout  = aws_lambda_function.create_workout.function_name
    update_workout  = aws_lambda_function.update_workout.function_name
    delete_workout  = aws_lambda_function.delete_workout.function_name
  }
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.fitness_app_dashboard.dashboard_name}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.fitness_api.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.fitness_app_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.fitness_app_key.arn
}
