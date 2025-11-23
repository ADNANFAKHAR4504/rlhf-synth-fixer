variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "amazon_side_asn" {
  description = "Amazon side ASN for Transit Gateway"
  type        = number
  default     = 64512
}

variable "vpc_attachments" {
  description = "Map of VPC attachments"
  type = map(object({
    vpc_id     = string
    subnet_ids = list(string)
    cidr_block = string
  }))
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
