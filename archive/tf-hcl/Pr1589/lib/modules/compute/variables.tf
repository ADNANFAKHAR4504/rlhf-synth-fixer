// Variables for compute module

variable "project_name" { type = string }
variable "environment_suffix" { type = string }
variable "common_tags" { type = map(string) }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "instance_type" { type = string }
variable "allowed_ssh_cidrs" { type = list(string) }
variable "ec2_instance_profile_name" { type = string }
variable "ami_id" { type = string }
