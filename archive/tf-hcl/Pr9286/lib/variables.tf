########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = ""
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "corp-s3-bucket"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "corp-s3-processor"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "S3LambdaIntegration"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}