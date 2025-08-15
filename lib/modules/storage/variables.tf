variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "route_table_ids" {
  description = "List of route table IDs for VPC endpoints"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

variable "vpc_endpoint_sg_id" {
  description = "ID of the VPC endpoint security group"
  type        = string
}

variable "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance role for S3 access"
  type        = string
}