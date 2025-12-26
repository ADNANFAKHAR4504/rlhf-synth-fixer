########################
# Input Variables
########################

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = ""
}

variable "lambda_function_name" {
  description = "Base name of the Lambda function"
  type        = string
  default     = "serverless-api-function"
}

variable "api_gateway_name" {
  description = "Base name of the API Gateway"
  type        = string
  default     = "serverless-api"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ServerlessAPI"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}