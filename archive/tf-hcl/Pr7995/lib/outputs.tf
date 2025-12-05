# JSON-formatted validation report for CI/CD consumption
output "validation_report_json" {
  description = "Comprehensive validation report in JSON format"
  value = jsonencode({
    timestamp          = timestamp()
    account_id         = data.aws_caller_identity.current.account_id
    region             = data.aws_region.current.name
    environment_suffix = var.environment_suffix
    overall_status     = local.all_validations_passed ? "PASS" : "FAIL"
    validation_results = {
      s3_buckets = {
        versioning = {
          status  = alltrue(values(local.s3_versioning_validation)) ? "PASS" : "FAIL"
          details = local.s3_versioning_validation
          failures = [
            for bucket_name, passed in local.s3_versioning_validation :
            bucket_name if !passed
          ]
        }
        lifecycle_policies = {
          status  = alltrue(values(local.s3_lifecycle_validation)) ? "PASS" : "FAIL"
          details = local.s3_lifecycle_validation
          failures = [
            for bucket_name, passed in local.s3_lifecycle_validation :
            bucket_name if !passed
          ]
        }
      }
      security_groups = {
        no_unrestricted_access = {
          status  = alltrue(values(local.security_group_validation)) ? "PASS" : "FAIL"
          details = local.security_group_validation
          failures = [
            for sg_id, passed in local.security_group_validation :
            sg_id if !passed
          ]
        }
      }
      ec2_instances = {
        approved_amis = {
          status  = alltrue(values(local.ec2_ami_validation)) ? "PASS" : "FAIL"
          details = local.ec2_ami_validation
          failures = [
            for instance_id, passed in local.ec2_ami_validation :
            instance_id if !passed
          ]
        }
        tag_compliance = {
          status  = alltrue(values(local.ec2_tag_validation)) ? "PASS" : "FAIL"
          details = local.ec2_tag_validation
          failures = [
            for instance_id, passed in local.ec2_tag_validation :
            instance_id if !passed
          ]
        }
      }
    }
  })
}

# Human-readable validation summary
output "validation_summary" {
  description = "Human-readable validation summary"
  value = {
    overall_status       = local.all_validations_passed ? "PASS" : "FAIL"
    s3_versioning_pass   = alltrue(values(local.s3_versioning_validation))
    s3_lifecycle_pass    = alltrue(values(local.s3_lifecycle_validation))
    security_groups_pass = alltrue(values(local.security_group_validation))
    ec2_ami_pass         = alltrue(values(local.ec2_ami_validation))
    ec2_tags_pass        = alltrue(values(local.ec2_tag_validation))
  }
}

# Detailed validation results by category
output "s3_validation_details" {
  description = "Detailed S3 bucket validation results"
  value = {
    versioning = local.s3_versioning_validation
    lifecycle  = local.s3_lifecycle_validation
  }
}

output "security_group_validation_details" {
  description = "Detailed security group validation results"
  value       = local.security_group_validation
}

output "ec2_validation_details" {
  description = "Detailed EC2 instance validation results"
  value = {
    ami_compliance = local.ec2_ami_validation
    tag_compliance = local.ec2_tag_validation
  }
}

# Failed resources for immediate attention
output "failed_resources" {
  description = "List of resources that failed validation"
  value = {
    s3_buckets_no_versioning = [
      for bucket_name, passed in local.s3_versioning_validation :
      bucket_name if !passed
    ]
    s3_buckets_no_lifecycle = [
      for bucket_name, passed in local.s3_lifecycle_validation :
      bucket_name if !passed
    ]
    security_groups_unrestricted = [
      for sg_id, passed in local.security_group_validation :
      sg_id if !passed
    ]
    ec2_unapproved_amis = [
      for instance_id, passed in local.ec2_ami_validation :
      instance_id if !passed
    ]
    ec2_missing_tags = [
      for instance_id, passed in local.ec2_tag_validation :
      instance_id if !passed
    ]
  }
}
