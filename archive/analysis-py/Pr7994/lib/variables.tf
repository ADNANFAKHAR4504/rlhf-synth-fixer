variable "aws_region" {
  description = "AWS region to analyze"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for uniqueness"
  type        = string
  default     = "dev"
}

variable "output_dir" {
  description = "Directory for analysis reports"
  type        = string
  default     = "./infrastructure-analysis-reports"
}
