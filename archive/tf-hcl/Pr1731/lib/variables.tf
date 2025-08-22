variable "aws_region" {
  description = "Primary AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS provider region"
  type        = string
  default     = "us-west-2"
}
