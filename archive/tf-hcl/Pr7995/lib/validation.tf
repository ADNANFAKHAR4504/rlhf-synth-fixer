# Validation marker resource to trigger checks
resource "null_resource" "validation_marker" {
  count = var.validation_enabled ? 1 : 0

  triggers = {
    timestamp = timestamp()
  }

  lifecycle {
    precondition {
      condition     = length(var.approved_ami_ids) > 0
      error_message = "At least one approved AMI ID must be specified"
    }

    precondition {
      condition     = length(var.required_tags) > 0
      error_message = "At least one required tag must be specified"
    }
  }
}

# Terraform check for S3 bucket versioning validation
check "s3_bucket_versioning_enabled" {
  assert {
    condition = alltrue([
      for bucket_name in var.bucket_names_to_validate :
      try(
        data.external.s3_bucket_versioning[bucket_name].result.status == "Enabled",
        false
      )
    ])
    error_message = "All S3 buckets must have versioning enabled. Failed buckets: ${join(", ", [
      for bucket_name in var.bucket_names_to_validate :
      bucket_name if try(
        data.external.s3_bucket_versioning[bucket_name].result.status != "Enabled",
        true
      )
    ])}"
  }
}

# Terraform check for S3 bucket lifecycle policies
check "s3_bucket_lifecycle_policies_exist" {
  assert {
    condition = alltrue([
      for bucket_name in var.bucket_names_to_validate :
      try(
        tonumber(data.external.s3_bucket_lifecycle[bucket_name].result.rule_count) > 0,
        false
      )
    ])
    error_message = "All S3 buckets must have lifecycle policies defined. Failed buckets: ${join(", ", [
      for bucket_name in var.bucket_names_to_validate :
      bucket_name if try(
        tonumber(data.external.s3_bucket_lifecycle[bucket_name].result.rule_count) == 0,
        true
      )
    ])}"
  }
}

# Terraform check for security group ingress rules
check "security_group_no_unrestricted_access" {
  assert {
    condition = alltrue([
      for sg_id in var.security_group_ids_to_validate :
      alltrue([
        for rule in try(data.aws_security_group.validation_security_groups[sg_id].ingress, []) :
        !contains(rule.cidr_blocks, "0.0.0.0/0") || rule.from_port == 443 || rule.from_port == 80
      ])
    ])
    error_message = "Security groups must not allow unrestricted access (0.0.0.0/0) except for HTTP/HTTPS. Violations: ${join(", ", [
      for sg_id in var.security_group_ids_to_validate :
      sg_id if anytrue([
        for rule in try(data.aws_security_group.validation_security_groups[sg_id].ingress, []) :
        contains(rule.cidr_blocks, "0.0.0.0/0") && rule.from_port != 443 && rule.from_port != 80
      ])
    ])}"
  }
}

# Terraform check for EC2 instance AMI validation
check "ec2_instance_approved_amis" {
  assert {
    condition = alltrue([
      for instance_id in var.instance_ids_to_validate :
      try(
        contains(var.approved_ami_ids, data.aws_instance.validation_instances[instance_id].ami),
        false
      )
    ])
    error_message = "All EC2 instances must use approved AMIs. Unapproved AMIs: ${join(", ", [
      for instance_id in var.instance_ids_to_validate :
      "${instance_id}: ${try(data.aws_instance.validation_instances[instance_id].ami, "unknown")}" if try(
        !contains(var.approved_ami_ids, data.aws_instance.validation_instances[instance_id].ami),
        true
      )
    ])}"
  }
}

# Terraform check for tag compliance on EC2 instances
check "ec2_instance_tag_compliance" {
  assert {
    condition = alltrue([
      for instance_id in var.instance_ids_to_validate :
      alltrue([
        for required_tag in var.required_tags :
        contains(keys(try(data.aws_instance.validation_instances[instance_id].tags, {})), required_tag)
      ])
    ])
    error_message = "All EC2 instances must have required tags. Missing tags: ${join(", ", flatten([
      for instance_id in var.instance_ids_to_validate : [
        for required_tag in var.required_tags :
        "${instance_id}: ${required_tag}" if !contains(keys(try(data.aws_instance.validation_instances[instance_id].tags, {})), required_tag)
      ]
    ]))}"
  }
}

# Local values for validation results
locals {
  # S3 bucket versioning validation results
  s3_versioning_validation = {
    for bucket_name in var.bucket_names_to_validate :
    bucket_name => try(
      data.external.s3_bucket_versioning[bucket_name].result.status == "Enabled",
      false
    )
  }

  # S3 bucket lifecycle validation results
  s3_lifecycle_validation = {
    for bucket_name in var.bucket_names_to_validate :
    bucket_name => try(
      tonumber(data.external.s3_bucket_lifecycle[bucket_name].result.rule_count) > 0,
      false
    )
  }

  # Security group validation results
  security_group_validation = {
    for sg_id in var.security_group_ids_to_validate :
    sg_id => try(
      alltrue([
        for rule in data.aws_security_group.validation_security_groups[sg_id].ingress :
        !contains(rule.cidr_blocks, "0.0.0.0/0") || rule.from_port == 443 || rule.from_port == 80
      ]),
      false
    )
  }

  # EC2 AMI validation results
  ec2_ami_validation = {
    for instance_id in var.instance_ids_to_validate :
    instance_id => try(
      contains(var.approved_ami_ids, data.aws_instance.validation_instances[instance_id].ami),
      false
    )
  }

  # EC2 tag compliance validation results
  ec2_tag_validation = {
    for instance_id in var.instance_ids_to_validate :
    instance_id => try(
      alltrue([
        for required_tag in var.required_tags :
        contains(keys(data.aws_instance.validation_instances[instance_id].tags), required_tag)
      ]),
      false
    )
  }

  # Overall validation status
  all_validations_passed = alltrue(concat(
    values(local.s3_versioning_validation),
    values(local.s3_lifecycle_validation),
    values(local.security_group_validation),
    values(local.ec2_ami_validation),
    values(local.ec2_tag_validation)
  ))
}
