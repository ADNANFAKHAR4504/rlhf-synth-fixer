variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "allowed_cidrs" {
  description = "List of allowed CIDR blocks for inter-VPC communication"
  type        = list(string)
}

variable "allowed_ports" {
  description = "List of allowed ports"
  type = list(object({
    port        = number
    protocol    = string
    description = string
  }))
}

variable "subnet_ids" {
  description = "List of subnet IDs to associate with the NACL"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}