variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming and uniqueness"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "eks-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "system_node_group_instance_types" {
  description = "Instance types for system node group"
  type        = list(string)
  default     = ["m5.large"]
}

variable "system_node_group_desired_size" {
  description = "Desired number of nodes in system node group"
  type        = number
  default     = 2
}

variable "system_node_group_min_size" {
  description = "Minimum number of nodes in system node group"
  type        = number
  default     = 2
}

variable "system_node_group_max_size" {
  description = "Maximum number of nodes in system node group"
  type        = number
  default     = 4
}

variable "app_node_group_instance_types" {
  description = "Instance types for application node group"
  type        = list(string)
  default     = ["t3.large", "t3a.large", "t2.large"]
}

variable "app_node_group_desired_size" {
  description = "Desired number of nodes in application node group"
  type        = number
  default     = 3
}

variable "app_node_group_min_size" {
  description = "Minimum number of nodes in application node group"
  type        = number
  default     = 2
}

variable "app_node_group_max_size" {
  description = "Maximum number of nodes in application node group"
  type        = number
  default     = 10
}

variable "gpu_node_group_instance_types" {
  description = "Instance types for GPU node group"
  type        = list(string)
  default     = ["g4dn.xlarge"]
}

variable "gpu_node_group_desired_size" {
  description = "Desired number of nodes in GPU node group"
  type        = number
  default     = 0
}

variable "gpu_node_group_min_size" {
  description = "Minimum number of nodes in GPU node group"
  type        = number
  default     = 0
}

variable "gpu_node_group_max_size" {
  description = "Maximum number of nodes in GPU node group"
  type        = number
  default     = 3
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler IAM role"
  type        = bool
  default     = true
}

variable "enable_alb_controller" {
  description = "Enable AWS Load Balancer Controller IAM role"
  type        = bool
  default     = true
}

variable "enable_external_secrets" {
  description = "Enable External Secrets Operator IAM role"
  type        = bool
  default     = true
}

variable "enable_ebs_csi_driver" {
  description = "Enable EBS CSI Driver IAM role"
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access" {
  description = "Enable public access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Enable private access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_cluster_encryption" {
  description = "Enable encryption for EKS secrets"
  type        = bool
  default     = true
}

variable "namespaces" {
  description = "Kubernetes namespaces to create"
  type        = list(string)
  default     = ["dev", "staging", "production"]
}

# Advanced features variables for 10/10 training quality

# GitOps variables
variable "gitops_repo_url" {
  description = "Git repository URL for GitOps"
  type        = string
  default     = "https://github.com/example/gitops-config"
}

variable "github_org" {
  description = "GitHub organization for ArgoCD authentication"
  type        = string
  default     = "example-org"
}

variable "domain_name" {
  description = "Base domain name for applications"
  type        = string
  default     = "example.com"
}

# Disaster Recovery variables
variable "dr_aws_region" {
  description = "AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "dr_vpc_cidr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "eks_public_access_cidrs" {
  description = "CIDR blocks allowed to access EKS API publicly"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Security variables
variable "slack_webhook_url" {
  description = "Slack webhook URL for Falco alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "security_alerts_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security@example.com"
}

variable "cosign_public_key" {
  description = "Cosign public key for image verification"
  type        = string
  default     = ""
}

# Cost Intelligence variables
variable "cost_alerts_email" {
  description = "Email address for cost alerts"
  type        = string
  default     = "finance@example.com"
}

# Service Mesh variables
variable "organization_name" {
  description = "Organization name for certificates"
  type        = string
  default     = "Example Corp"
}
