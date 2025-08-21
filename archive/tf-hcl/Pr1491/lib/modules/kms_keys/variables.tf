variable "resource_suffix" {
  description = "Suffix to ensure unique names"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
