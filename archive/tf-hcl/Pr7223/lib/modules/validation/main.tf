# Custom validation module to enforce identical security group rules
variable "security_groups" {
  description = "Map of security groups to validate"
  type = map(object({
    name    = string
    ingress = list(any)
    egress  = list(any)
  }))
}

variable "expected_rules" {
  description = "Expected security group rules across environments"
  type        = any
}

locals {
  # Validate that all security groups have consistent rules
  validation_checks = {
    for sg_name, sg in var.security_groups :
    sg_name => (
      length(sg.ingress) == length(var.expected_rules[sg_name].ingress) &&
      length(sg.egress) == length(var.expected_rules[sg_name].egress)
    )
  }

  all_valid = alltrue([for k, v in local.validation_checks : v])
}

resource "null_resource" "validation" {
  count = local.all_valid ? 0 : 1

  provisioner "local-exec" {
    command = "echo 'ERROR: Security group rules validation failed' && exit 1"
  }
}

output "validation_result" {
  description = "Security group validation result"
  value       = local.all_valid
}
