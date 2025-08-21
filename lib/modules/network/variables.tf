# modules/network/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "security_group_name_prefix" {
  description = "Prefix for security group names"
  type        = string
  default     = "myapp"
}

variable "ingress_port" {
  description = "Port for ingress rule"
  type        = number
  default     = 443
}

variable "ingress_cidr_blocks" {
  description = "CIDR blocks for ingress rule"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "egress_cidr_blocks" {
  description = "CIDR blocks for egress rule"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "security_group_tags" {
  description = "Additional tags for security group"
  type        = map(string)
  default     = {}
}
