# ========== GENERAL VARIABLES ==========

variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ml-pipeline"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "ML Pipeline"
    ManagedBy = "Terraform"
  }
}

# ========== KMS VARIABLES ==========

variable "kms_deletion_window_in_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
  validation {
    condition     = var.kms_deletion_window_in_days >= 7 && var.kms_deletion_window_in_days <= 30
    error_message = "KMS deletion window must be between 7 and 30 days."
  }
}

# ========== CLOUDWATCH VARIABLES ==========

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention period."
  }
}

# ========== KINESIS VARIABLES ==========

variable "kinesis_shard_count" {
  description = "Number of shards for Kinesis stream"
  type        = number
  default     = 2
  validation {
    condition     = var.kinesis_shard_count > 0 && var.kinesis_shard_count <= 1000
    error_message = "Kinesis shard count must be between 1 and 1000."
  }
}

variable "kinesis_retention_hours" {
  description = "Kinesis stream retention period in hours"
  type        = number
  default     = 24
  validation {
    condition     = var.kinesis_retention_hours >= 24 && var.kinesis_retention_hours <= 8760
    error_message = "Kinesis retention must be between 24 and 8760 hours (1 year)."
  }
}

# ========== LAMBDA VARIABLES ==========

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
  validation {
    condition     = contains(["python3.9", "python3.10", "python3.11", "python3.12"], var.lambda_runtime)
    error_message = "Lambda runtime must be a supported Python version."
  }
}

variable "lambda_preprocessing_timeout" {
  description = "Timeout for preprocessing Lambda function in seconds"
  type        = number
  default     = 300
  validation {
    condition     = var.lambda_preprocessing_timeout >= 1 && var.lambda_preprocessing_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_preprocessing_memory" {
  description = "Memory allocation for preprocessing Lambda function in MB"
  type        = number
  default     = 1024
  validation {
    condition     = var.lambda_preprocessing_memory >= 128 && var.lambda_preprocessing_memory <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}

variable "lambda_inference_timeout" {
  description = "Timeout for inference Lambda function in seconds"
  type        = number
  default     = 60
  validation {
    condition     = var.lambda_inference_timeout >= 1 && var.lambda_inference_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_inference_memory" {
  description = "Memory allocation for inference Lambda function in MB"
  type        = number
  default     = 512
  validation {
    condition     = var.lambda_inference_memory >= 128 && var.lambda_inference_memory <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}

# ========== SAGEMAKER VARIABLES ==========

variable "create_sagemaker_endpoints" {
  description = "Whether to create SageMaker endpoints (set to false to skip endpoint creation for faster deployment)"
  type        = bool
  default     = true
}

variable "create_step_functions" {
  description = "Whether to create Step Functions state machine (set to false to skip for testing)"
  type        = bool
  default     = true
}

variable "sagemaker_image_name" {
  description = "SageMaker container image name (ECR repository)"
  type        = string
  default     = "sagemaker-inference"
}

variable "sagemaker_instance_type" {
  description = "SageMaker endpoint instance type (only used if not serverless)"
  type        = string
  default     = "ml.m5.large"
}

variable "sagemaker_initial_instance_count" {
  description = "Initial number of instances for SageMaker endpoint"
  type        = number
  default     = 1
  validation {
    condition     = var.sagemaker_initial_instance_count >= 1
    error_message = "SageMaker instance count must be at least 1."
  }
}

variable "sagemaker_serverless_max_concurrency" {
  description = "Maximum concurrent invocations for serverless SageMaker endpoint"
  type        = number
  default     = 5
  validation {
    condition     = var.sagemaker_serverless_max_concurrency >= 1 && var.sagemaker_serverless_max_concurrency <= 200
    error_message = "SageMaker serverless max concurrency must be between 1 and 200."
  }
}

variable "sagemaker_serverless_memory_size" {
  description = "Memory size for serverless SageMaker endpoint in MB"
  type        = number
  default     = 2048
  validation {
    condition     = contains([1024, 2048, 3072, 4096, 5120, 6144], var.sagemaker_serverless_memory_size)
    error_message = "SageMaker serverless memory must be 1024, 2048, 3072, 4096, 5120, or 6144 MB."
  }
}

variable "sagemaker_training_instance_type" {
  description = "Instance type for SageMaker training jobs"
  type        = string
  default     = "ml.m5.xlarge"
}

variable "sagemaker_training_volume_size" {
  description = "EBS volume size for SageMaker training job in GB"
  type        = number
  default     = 30
  validation {
    condition     = var.sagemaker_training_volume_size >= 1 && var.sagemaker_training_volume_size <= 16384
    error_message = "SageMaker training volume size must be between 1 and 16384 GB."
  }
}

variable "sagemaker_training_max_runtime" {
  description = "Maximum runtime for SageMaker training job in seconds"
  type        = number
  default     = 86400
  validation {
    condition     = var.sagemaker_training_max_runtime >= 600 && var.sagemaker_training_max_runtime <= 432000
    error_message = "SageMaker training max runtime must be between 600 and 432000 seconds."
  }
}

variable "sagemaker_latency_threshold_ms" {
  description = "CloudWatch alarm threshold for SageMaker endpoint latency in milliseconds"
  type        = number
  default     = 1000
  validation {
    condition     = var.sagemaker_latency_threshold_ms > 0
    error_message = "Latency threshold must be greater than 0."
  }
}

# ========== EVENTBRIDGE VARIABLES ==========

variable "training_schedule_expression" {
  description = "EventBridge schedule expression for automated model training (e.g., 'rate(1 day)' or 'cron(0 2 * * ? *)')"
  type        = string
  default     = "rate(7 days)"
  validation {
    condition     = can(regex("^(rate\\(.+\\)|cron\\(.+\\))$", var.training_schedule_expression))
    error_message = "Training schedule expression must be a valid EventBridge rate or cron expression."
  }
}
