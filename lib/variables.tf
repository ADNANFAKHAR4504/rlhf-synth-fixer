variable "aws_region" {
  description = "AWS region where the EKS infrastructure will be deployed."
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names and tags to ensure environment isolation."
  type        = string
}

variable "cluster_name_prefix" {
  description = "Base name for the EKS cluster. The environment suffix is appended automatically."
  type        = string
  default     = "payments-platform-eks"
}

variable "cluster_version" {
  description = "Desired Kubernetes control plane version."
  type        = string
  default     = "1.28"
}

variable "cluster_log_retention_days" {
  description = "Retention period in days for EKS control plane CloudWatch Logs."
  type        = number
  default     = 30
}

variable "vpc_id_parameter_name" {
  description = "AWS Systems Manager Parameter Store name that holds the target VPC ID."
  type        = string
  default     = "/infrastructure/vpc/id"
}

variable "private_subnet_tag_key" {
  description = "Tag key used to identify private subnets."
  type        = string
  default     = "Type"
}

variable "private_subnet_tag_value" {
  description = "Tag value used to identify private subnets."
  type        = string
  default     = "private"
}

variable "availability_zones" {
  description = "Availability zones used for the EKS control plane and node groups."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "kubernetes_namespace" {
  description = "Namespace used for the payment services workloads."
  type        = string
  default     = "payments"
}

variable "database_secret_name" {
  description = "Name of the AWS Secrets Manager secret that stores the database credentials."
  type        = string
  default     = "payments/database"
}

locals {
  cluster_name             = "${var.cluster_name_prefix}-${var.environment_suffix}"
  frontend_node_group_name = "${local.cluster_name}-frontend"
  backend_node_group_name  = "${local.cluster_name}-backend"
  frontend_launch_template = "${local.cluster_name}-frontend-lt"
  backend_launch_template  = "${local.cluster_name}-backend-lt"
  kms_alias_name           = "alias/${local.cluster_name}"
  log_group_name           = "/aws/eks/${local.cluster_name}/cluster"
  namespace_name           = "${var.kubernetes_namespace}-${var.environment_suffix}"
  database_secret_name     = "${var.database_secret_name}-${var.environment_suffix}"
  sns_topic_name           = "${local.cluster_name}-autoscaler-alerts"

  common_tags = {
    Environment       = "production"
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
    Application       = "payments-platform"
    Component         = "eks"
  }
}

