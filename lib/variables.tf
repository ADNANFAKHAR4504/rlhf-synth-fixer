variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Logical project identifier"
  type        = string
  default     = "ecommerce"
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names for isolation"
  type        = string
  default     = "prod"
}

variable "container_image" {
  description = "Container image URI"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest"
}

variable "container_cpu" {
  description = "Container CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Container memory in MB"
  type        = number
  default     = 1024
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "health_check_path" {
  description = "Health check path for ALB"
  type        = string
  default     = "/health"
}

variable "enable_https" {
  description = "Enable HTTPS listener on the load balancer"
  type        = bool
  default     = false
}

variable "create_acm_certificate" {
  description = "Provision ACM certificate when true"
  type        = bool
  default     = false
}

variable "acm_certificate_domain" {
  description = "Domain name to include in ACM certificate when created"
  type        = string
  default     = ""
}

variable "existing_acm_certificate_arn" {
  description = "Existing ACM certificate ARN to reuse when HTTPS is enabled"
  type        = string
  default     = ""
}

variable "enable_route53" {
  description = "Create Route 53 DNS record pointing to ALB"
  type        = bool
  default     = false
}

variable "route53_hosted_zone_name" {
  description = "Hosted zone name for Route 53 record (trailing dot optional)"
  type        = string
  default     = ""
}

variable "route53_record_name" {
  description = "Record name to create within the hosted zone"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Plaintext environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "ssm_parameters" {
  description = "Map of environment variable names to values stored as SSM parameters"
  type        = map(string)
  default     = {}
}

variable "database_secret_arn" {
  description = "ARN of Secrets Manager secret containing the database password"
  type        = string
  default     = ""
}

variable "database_secret_env_name" {
  description = "Environment variable name exposed to container for database password"
  type        = string
  default     = "DATABASE_PASSWORD"
}

variable "db_engine" {
  description = "Database engine identifier"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "16.3"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS (in GB)"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "app_user"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "appdb"
}

variable "db_enable_performance_insights" {
  description = "Toggle Performance Insights for the database when supported"
  type        = bool
  default     = false
}