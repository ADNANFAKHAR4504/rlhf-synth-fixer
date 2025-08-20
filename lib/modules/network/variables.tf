// Variables for network module

variable "project_name" { type = string }
variable "environment_suffix" { type = string }
variable "common_tags" { type = map(string) }
variable "azs" { type = list(string) }
