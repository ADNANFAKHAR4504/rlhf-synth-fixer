variable "domain_name" {
  description = "Domain name for the private hosted zone"
  type        = string
}

variable "primary_vpc_id" {
  description = "Primary VPC ID to associate with the hosted zone"
  type        = string
}

variable "primary_vpc_region" {
  description = "Region of the primary VPC"
  type        = string
}

variable "project_tags" {
  description = "Common project tags"
  type        = map(string)
  default     = {}
}
