// Variables for cross-region network module

variable "create_vpcs" {
  type        = bool
  description = "Whether to create VPC resources"
  default     = false
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "Allowed CIDR blocks for SSH ingress"
  default     = []
}
