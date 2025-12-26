# =============================================================================
# Core Variables - Required for all deployments
# =============================================================================

variable "environment_suffix" {
  description = "Unique suffix for resource isolation and naming. Used across all resources to ensure multiple environments can coexist. Examples: 'dev', 'staging', 'prod', or UUID for testing."
  type        = string
  default     = "dev289"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix)) && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be lowercase alphanumeric with hyphens only, maximum 20 characters."
  }
}

variable "aws_region" {
  description = "AWS region for deployment. All resources including EKS cluster, VPC, and supporting services will be created in this region. Must be a valid AWS region."
  type        = string
  default     = "ap-southeast-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.aws_region))
    error_message = "AWS region must be in valid format, such as 'us-east-1' or 'ap-southeast-1'."
  }
}

# =============================================================================
# Networking Variables
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC. Must be large enough to accommodate all subnets (3 public + 3 private across 3 AZs). Recommended: /16 for production workloads."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

# =============================================================================
# EKS Cluster Variables
# =============================================================================

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster. Must be a supported EKS version. EKS supports multiple K8s versions with different features and security updates."
  type        = string
  default     = "1.28"

  validation {
    condition     = can(regex("^1\\.(2[6-9]|[3-9][0-9])$", var.cluster_version))
    error_message = "Cluster version must be 1.26 or higher."
  }
}

variable "cluster_name" {
  description = "Base name of the EKS cluster. Will be combined with environment_suffix to create full cluster name."
  type        = string
  default     = "eks-cluster"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and contain only lowercase letters, numbers, and hyphens."
  }
}

# =============================================================================
# Monitoring and Security Variables
# =============================================================================

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for comprehensive monitoring of cluster metrics, logs, and performance data. Provides visibility into CPU, memory, network, and storage metrics."
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty EKS protection for threat detection and security monitoring. Note: GuardDuty allows only ONE detector per AWS account/region. Only enable if not already configured."
  type        = bool
  default     = false
}

# =============================================================================
# Node Group Instance Types
# =============================================================================

variable "frontend_instance_type" {
  description = "Instance type for frontend node group. t3.large provides 2 vCPUs and 8 GB memory, suitable for frontend microservices with moderate compute needs."
  type        = string
  default     = "t3.large"

  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.[a-z0-9]+$", var.frontend_instance_type))
    error_message = "Instance type must be valid AWS EC2 instance type format (e.g., t3.large, m5.xlarge)."
  }
}

variable "backend_instance_type" {
  description = "Instance type for backend node group. m5.xlarge provides 4 vCPUs and 16 GB memory, optimized for backend API services with balanced compute and memory requirements."
  type        = string
  default     = "m5.xlarge"

  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.[a-z0-9]+$", var.backend_instance_type))
    error_message = "Instance type must be valid AWS EC2 instance type format (e.g., t3.large, m5.xlarge)."
  }
}

variable "data_processing_instance_type" {
  description = "Instance type for data-processing node group. c5.2xlarge provides 8 vCPUs and 16 GB memory, compute-optimized for data-intensive workloads and batch processing."
  type        = string
  default     = "c5.2xlarge"

  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.[a-z0-9]+$", var.data_processing_instance_type))
    error_message = "Instance type must be valid AWS EC2 instance type format (e.g., t3.large, m5.xlarge)."
  }
}

# =============================================================================
# Node Group Scaling Configuration
# =============================================================================

variable "node_group_min_size" {
  description = "Minimum number of nodes per node group. Ensures high availability with at least 2 nodes for redundancy across availability zones."
  type        = number
  default     = 2

  validation {
    condition     = var.node_group_min_size >= 1 && var.node_group_min_size <= 100
    error_message = "Minimum node group size must be between 1 and 100."
  }
}

variable "node_group_max_size" {
  description = "Maximum number of nodes per node group. Cluster Autoscaler will scale up to this limit based on pod resource requests and scheduling needs."
  type        = number
  default     = 10

  validation {
    condition     = var.node_group_max_size >= 1 && var.node_group_max_size <= 100
    error_message = "Maximum node group size must be between 1 and 100."
  }
}

variable "node_group_desired_size" {
  description = "Desired number of nodes per node group at deployment time. Should be between min and max size. Cluster Autoscaler will adjust this based on workload demands."
  type        = number
  default     = 2

  validation {
    condition     = var.node_group_desired_size >= 1 && var.node_group_desired_size <= 100
    error_message = "Desired node group size must be between 1 and 100."
  }
}

# =============================================================================
# Resource Tagging
# =============================================================================

variable "tags" {
  description = "Additional tags to apply to all resources. These tags are merged with default tags and help with cost allocation, resource organization, and compliance tracking."
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "eks-microservices"
  }
}
